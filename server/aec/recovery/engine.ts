/**
 * Recovery Engine - Orchestrates testing, deployment, and rollback
 */

import { getDb } from "../../db";
import { aecPatches, aecDetectedErrors } from "../../../drizzle/schema";
import { eq } from "drizzle-orm";
import { runAllTests, runSmokeTests } from "./test-runner";
import { deployPatch, rollbackDeployment, performHealthCheck, shouldAutoDeployPatch } from "./deployment-manager";
import { updatePatchValidation, updatePatchDeployment } from "../surgical/engine";
import { sendDeploymentSuccessAlert, sendDeploymentFailedAlert, sendRollbackAlert, sendHealthCheckFailedAlert } from "../alerts/notification-service";
import Redis from "ioredis";

// Redis client for circuit breaker
const redis = new Redis(process.env.REDIS_URL || "redis://localhost:6379");

export interface RecoveryResult {
  success: boolean;
  testsPassed: boolean;
  deployed: boolean;
  healthCheckPassed: boolean;
  errors: string[];
  warnings: string[];
  killedByCircuitBreaker?: boolean;
}

// ============================================================================
// AEC Kill Switch (Circuit Breaker)
// ============================================================================

/**
 * Check if AEC should be blocked from patching a file
 * 
 * Prevents infinite loop where:
 * 1. AEC patches a file
 * 2. Patch causes new error
 * 3. AEC patches again
 * 4. Loop continues, burning credits and potentially breaking code
 * 
 * @param filePath - File being patched
 * @param errorId - Error ID being fixed
 * @returns true if safe to proceed, false if kill switch engaged
 */
async function checkSafetyLock(filePath: string, errorId: number): Promise<boolean> {
  const key = `aec:panic:${filePath}:${errorId}`;
  
  try {
    // Increment attempt counter
    const attempts = await redis.incr(key);
    
    // Set 30-minute expiry on first attempt
    if (attempts === 1) {
      await redis.expire(key, 1800); // 30 minutes
    }

    // Kill switch: max 3 attempts per file per error in 30 minutes
    if (attempts > 3) {
      console.error(
        `🚨 AEC KILL SWITCH ENGAGED: Too many patch attempts for ${filePath} (error ${errorId}). ` +
        `Manual intervention required. Attempts: ${attempts}/3`
      );
      
      // Send critical alert to admin
      try {
        const { sendManualReviewAlert } = await import("../alerts/notification-service");
        await sendManualReviewAlert(errorId, "AEC Kill Switch Engaged", [
          `File: ${filePath}`,
          `Error ID: ${errorId}`,
          `Attempts: ${attempts}`,
          "Reason: Too many failed patch attempts",
          "Action Required: Manual code review and fix",
        ]);
      } catch (alertError) {
        console.error("[AEC Kill Switch] Failed to send alert:", alertError);
      }
      
      return false; // STOP THE AI
    }

    console.log(
      `[AEC Safety Lock] ${filePath} - Attempt ${attempts}/3 (window: 30 minutes)`
    );
    
    return true; // Safe to proceed
  } catch (error) {
    console.error("[AEC Safety Lock] Redis error:", error);
    // If Redis fails, allow the operation (fail-open for availability)
    return true;
  }
}

/**
 * Reset safety lock for a file (admin override)
 */
export async function resetSafetyLock(filePath: string, errorId: number): Promise<void> {
  const key = `aec:panic:${filePath}:${errorId}`;
  
  try {
    await redis.del(key);
    console.log(`[AEC Safety Lock] Reset for ${filePath} (error ${errorId})`);
  } catch (error) {
    console.error("[AEC Safety Lock] Error resetting:", error);
  }
}

/**
 * Get safety lock status for a file
 */
export async function getSafetyLockStatus(
  filePath: string,
  errorId: number
): Promise<{ attempts: number; ttl: number; locked: boolean }> {
  const key = `aec:panic:${filePath}:${errorId}`;
  
  try {
    const attempts = await redis.get(key);
    const ttl = await redis.ttl(key);
    
    return {
      attempts: attempts ? parseInt(attempts) : 0,
      ttl: ttl > 0 ? ttl : 0,
      locked: attempts ? parseInt(attempts) > 3 : false,
    };
  } catch (error) {
    console.error("[AEC Safety Lock] Error getting status:", error);
    return { attempts: 0, ttl: 0, locked: false };
  }
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
    
    // Step 1.5: Check AEC Kill Switch (Circuit Breaker)
    const filePath = patch.filePath || "unknown";
    const safeToProceed = await checkSafetyLock(filePath, patch.errorId);
    
    if (!safeToProceed) {
      console.error(`[AEC Recovery Engine] 🚨 Kill switch engaged for ${filePath}`);
      result.errors.push("AEC kill switch engaged - too many patch attempts");
      result.warnings.push("Manual intervention required");
      result.killedByCircuitBreaker = true;
      
      // Update patch status
      await updatePatchDeployment(
        patchId,
        "rejected",
        "Kill switch engaged - too many attempts"
      );
      
      return result;
    }

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
        
        // Send deployment success alert
        console.log(`[AEC Alerts] Sending deployment success alert for patch ${patchId}`);
        await sendDeploymentSuccessAlert(patchId);

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
            
            // Send health check failed alert
            console.log(`[AEC Alerts] Sending health check failed alert`);
            await sendHealthCheckFailedAlert({ healthy: healthCheck.healthy });

            // Rollback
            const rollbackResult = await rollbackDeployment();

            if (rollbackResult.success) {
              console.log(`[AEC Recovery Engine] ✅ Rollback successful`);
              await updatePatchDeployment(patchId, "rolled_back", "Health check failed");
              
              // Send rollback alert
              console.log(`[AEC Alerts] Sending rollback alert for patch ${patchId}`);
              await sendRollbackAlert(patchId, "Health check failed after deployment");
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
        
        // Send deployment failed alert
        console.log(`[AEC Alerts] Sending deployment failed alert for patch ${patchId}`);
        await sendDeploymentFailedAlert(patchId, deploymentResult.errors.join(", "));
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
      
      // Send rollback alert
      console.log(`[AEC Alerts] Sending rollback alert for patch ${patchId}`);
      await sendRollbackAlert(patchId, "Manual rollback requested");
      
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
