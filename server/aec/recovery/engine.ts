/**
 * Recovery Engine - Orchestrates testing, deployment, and rollback
 */

import { getDb } from "../../db";
import { aecPatches, aecDetectedErrors } from "../../../drizzle/schema";
import { eq } from "drizzle-orm";
import { runAllTests, runSmokeTests } from "./test-runner";
import { deployPatch, rollbackDeployment, performHealthCheck, shouldAutoDeployPatch } from "./deployment-manager";
import { updatePatchValidation, updatePatchDeployment } from "../surgical/engine";

export interface RecoveryResult {
  success: boolean;
  testsPassed: boolean;
  deployed: boolean;
  healthCheckPassed: boolean;
  errors: string[];
  warnings: string[];
}

// ============================================================================
// Main Recovery Flow
// ============================================================================

/**
 * Run recovery procedure for a patch
 */
export async function runRecoveryProcedure(
  patchId: number,
  options: {
    autoDeploy?: boolean; // Automatically deploy if tests pass (default: false)
    skipTests?: boolean; // Skip tests (NOT RECOMMENDED)
    requireHealthCheck?: boolean; // Require post-deployment health check (default: true)
  } = {}
): Promise<RecoveryResult> {
  console.log(`[AEC Recovery Engine] Starting recovery procedure for patch ${patchId}...`);

  const result: RecoveryResult = {
    success: false,
    testsPassed: false,
    deployed: false,
    healthCheckPassed: false,
    errors: [],
    warnings: [],
  };

  const db = await getDb();
  if (!db) {
    result.errors.push("Database not available");
    return result;
  }

  try {
    // Step 1: Load patch details
    const [patch] = await db
      .select()
      .from(aecPatches)
      .where(eq(aecPatches.id, patchId))
      .limit(1);

    if (!patch) {
      result.errors.push(`Patch ${patchId} not found`);
      return result;
    }

    const branchName = patch.branchName || `aec/${patch.patchVersion}`;

    // Step 2: Run tests
    if (!options.skipTests) {
      console.log(`[AEC Recovery Engine] Running tests...`);

      await updatePatchValidation(patchId, "testing");

      const testResults = await runAllTests();

      if (testResults.success) {
        console.log(`[AEC Recovery Engine] ✅ All tests passed`);
        result.testsPassed = true;

        await updatePatchValidation(patchId, "passed", testResults);
      } else {
        console.log(`[AEC Recovery Engine] ❌ Tests failed`);
        result.errors.push("Tests failed");

        await updatePatchValidation(patchId, "failed", testResults);

        // Don't proceed to deployment if tests fail
        return result;
      }
    } else {
      console.log(`[AEC Recovery Engine] ⚠️  Skipping tests (NOT RECOMMENDED)`);
      result.warnings.push("Tests were skipped");
      result.testsPassed = true; // Assume passed if skipped
    }

    // Step 3: Determine if we should auto-deploy
    const [error] = await db
      .select()
      .from(aecDetectedErrors)
      .where(eq(aecDetectedErrors.id, patch.errorId))
      .limit(1);

    let shouldDeploy = options.autoDeploy || false;

    if (shouldDeploy && error) {
      // Check if it's safe to auto-deploy
      const affectsMedicalPathway = error.source?.includes("brain") || 
                                    error.source?.includes("triage") ||
                                    error.source?.includes("clinical");

      const diagnostic = await db
        .select()
        .from(require("../../../drizzle/schema").aecDiagnostics)
        .where(eq(require("../../../drizzle/schema").aecDiagnostics.errorId, patch.errorId))
        .limit(1);

      const impact = diagnostic[0]?.impact || "medium";

      shouldDeploy = shouldAutoDeployPatch(impact, affectsMedicalPathway);

      if (!shouldDeploy) {
        result.warnings.push("Auto-deploy blocked due to impact level or medical pathway");
      }
    }

    // Step 4: Deploy (if approved)
    if (shouldDeploy) {
      console.log(`[AEC Recovery Engine] Deploying patch...`);

      await updatePatchDeployment(patchId, "deploying");

      const deploymentResult = await deployPatch(branchName, {
        skipTests: true, // Already tested
      });

      if (deploymentResult.success) {
        console.log(`[AEC Recovery Engine] ✅ Deployment successful`);
        result.deployed = true;

        await updatePatchDeployment(patchId, "deployed");

        // Update error status to resolved
        await db
          .update(aecDetectedErrors)
          .set({ 
            status: "resolved",
            resolvedAt: new Date(),
          })
          .where(eq(aecDetectedErrors.id, patch.errorId));

        // Step 5: Post-deployment health check
        if (options.requireHealthCheck !== false) {
          console.log(`[AEC Recovery Engine] Running post-deployment health check...`);

          // Wait a bit for server to stabilize
          await new Promise(resolve => setTimeout(resolve, 5000));

          const healthCheck = await performHealthCheck();

          if (healthCheck.healthy) {
            console.log(`[AEC Recovery Engine] ✅ Health check passed`);
            result.healthCheckPassed = true;
          } else {
            console.log(`[AEC Recovery Engine] ❌ Health check failed, rolling back...`);
            result.errors.push("Post-deployment health check failed");

            // Rollback
            const rollbackResult = await rollbackDeployment();

            if (rollbackResult.success) {
              console.log(`[AEC Recovery Engine] ✅ Rollback successful`);
              await updatePatchDeployment(patchId, "rolled_back", "Health check failed");
            } else {
              console.log(`[AEC Recovery Engine] ❌ Rollback failed`);
              result.errors.push("Rollback failed");
            }

            return result;
          }
        } else {
          result.healthCheckPassed = true; // Skipped
        }

        result.success = true;
      } else {
        console.log(`[AEC Recovery Engine] ❌ Deployment failed`);
        result.errors.push(...deploymentResult.errors);

        await updatePatchDeployment(patchId, "rejected", "Deployment failed");
      }
    } else {
      console.log(`[AEC Recovery Engine] Patch ready but not deployed (autoDeploy=false or blocked)`);
      result.success = true; // Tests passed, ready for manual deployment
    }

    return result;
  } catch (error: any) {
    console.error(`[AEC Recovery Engine] Recovery procedure failed:`, error);
    result.errors.push(`Fatal error: ${error.message}`);
    return result;
  }
}

// ============================================================================
// Manual Operations
// ============================================================================

/**
 * Manually approve and deploy a patch
 */
export async function manuallyDeployPatch(patchId: number): Promise<RecoveryResult> {
  console.log(`[AEC Recovery Engine] Manually deploying patch ${patchId}...`);

  return runRecoveryProcedure(patchId, {
    autoDeploy: true,
    skipTests: false,
    requireHealthCheck: true,
  });
}

/**
 * Manually rollback a deployed patch
 */
export async function manuallyRollbackPatch(patchId: number): Promise<boolean> {
  console.log(`[AEC Recovery Engine] Manually rolling back patch ${patchId}...`);

  const db = await getDb();
  if (!db) {
    return false;
  }

  try {
    const rollbackResult = await rollbackDeployment();

    if (rollbackResult.success) {
      await updatePatchDeployment(patchId, "rolled_back", "Manual rollback");
      console.log(`[AEC Recovery Engine] ✅ Manual rollback successful`);
      return true;
    } else {
      console.log(`[AEC Recovery Engine] ❌ Manual rollback failed`);
      return false;
    }
  } catch (error) {
    console.error(`[AEC Recovery Engine] Manual rollback error:`, error);
    return false;
  }
}

// ============================================================================
// Monitoring
// ============================================================================

/**
 * Monitor deployed patch for issues
 */
export async function monitorDeployedPatch(
  patchId: number,
  durationMinutes: number = 30
): Promise<{
  stable: boolean;
  issues: string[];
}> {
  console.log(`[AEC Recovery Engine] Monitoring patch ${patchId} for ${durationMinutes} minutes...`);

  const issues: string[] = [];
  const checkInterval = 5 * 60 * 1000; // 5 minutes
  const endTime = Date.now() + (durationMinutes * 60 * 1000);

  while (Date.now() < endTime) {
    // Run health check
    const healthCheck = await performHealthCheck();

    if (!healthCheck.healthy) {
      issues.push(`Health check failed at ${new Date().toISOString()}`);
    }

    // Wait before next check
    await new Promise(resolve => setTimeout(resolve, checkInterval));
  }

  const stable = issues.length === 0;

  if (stable) {
    console.log(`[AEC Recovery Engine] ✅ Patch ${patchId} is stable`);
  } else {
    console.log(`[AEC Recovery Engine] ⚠️  Patch ${patchId} has ${issues.length} issues`);
  }

  return { stable, issues };
}
