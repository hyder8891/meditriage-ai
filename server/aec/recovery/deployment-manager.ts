// @ts-nocheck
/**
 * Deployment Manager - Recovery Layer
 * Handles zero-downtime deployments and rollbacks
 */

import { exec } from "child_process";
import { promisify } from "util";
import { getCurrentBranch, switchBranch } from "../surgical/patch-applicator";

const execAsync = promisify(exec);
const PROJECT_ROOT = "/home/ubuntu/meditriage-ai";

export interface DeploymentResult {
  success: boolean;
  deployedBranch?: string;
  previousBranch?: string;
  duration: number;
  errors: string[];
}

// ============================================================================
// Deployment
// ============================================================================

/**
 * Deploy a patch branch to main
 */
export async function deployPatch(
  patchBranch: string,
  options: {
    skipTests?: boolean;
    createBackup?: boolean;
  } = {}
): Promise<DeploymentResult> {
  console.log(`[AEC Deployment] Deploying patch branch: ${patchBranch}`);

  const startTime = Date.now();
  const result: DeploymentResult = {
    success: false,
    duration: 0,
    errors: [],
  };

  try {
    // Step 1: Get current branch (for rollback)
    const previousBranch = await getCurrentBranch();
    result.previousBranch = previousBranch;
    console.log(`[AEC Deployment] Current branch: ${previousBranch}`);

    // Step 2: Switch to patch branch
    await switchBranch(patchBranch);
    console.log(`[AEC Deployment] Switched to patch branch: ${patchBranch}`);

    // Step 3: Run tests (unless skipped)
    if (!options.skipTests) {
      console.log(`[AEC Deployment] Running pre-deployment tests...`);
      const { runAllTests } = await import("./test-runner");
      const testResults = await runAllTests();

      if (!testResults.success) {
        result.errors.push("Pre-deployment tests failed");
        console.log(`[AEC Deployment] ❌ Tests failed, aborting deployment`);

        // Rollback to previous branch
        await switchBranch(previousBranch);
        result.duration = Date.now() - startTime;
        return result;
      }

      console.log(`[AEC Deployment] ✅ Tests passed`);
    }

    // Step 4: Merge to main
    await switchBranch("main");
    await mergeWithMain(patchBranch);
    console.log(`[AEC Deployment] Merged ${patchBranch} into main`);

    // Step 5: Restart server (handled by Manus platform)
    console.log(`[AEC Deployment] Server will restart automatically`);

    result.success = true;
    result.deployedBranch = patchBranch;
    result.duration = Date.now() - startTime;

    console.log(`[AEC Deployment] ✅ Deployment successful (${result.duration}ms)`);

    return result;
  } catch (error: any) {
    console.error(`[AEC Deployment] Deployment failed:`, error);
    result.errors.push(error.message);
    result.duration = Date.now() - startTime;

    // Attempt rollback
    if (result.previousBranch) {
      try {
        await switchBranch(result.previousBranch);
        console.log(`[AEC Deployment] Rolled back to ${result.previousBranch}`);
      } catch (rollbackError: any) {
        console.error(`[AEC Deployment] Rollback failed:`, rollbackError);
        result.errors.push(`Rollback failed: ${rollbackError.message}`);
      }
    }

    return result;
  }
}

/**
 * Merge patch branch with main
 */
async function mergeWithMain(patchBranch: string): Promise<void> {
  try {
    await execAsync(
      `cd ${PROJECT_ROOT} && git merge ${patchBranch} --no-ff -m "Merge AEC patch ${patchBranch}"`,
      {
        maxBuffer: 10 * 1024 * 1024,
        timeout: 30000,
      }
    );
  } catch (error: any) {
    throw new Error(`Git merge failed: ${error.message}`);
  }
}

// ============================================================================
// Rollback
// ============================================================================

/**
 * Rollback deployment to previous state
 */
export async function rollbackDeployment(
  targetBranch: string = "main",
  commitHash?: string
): Promise<DeploymentResult> {
  console.log(`[AEC Deployment] Rolling back deployment...`);

  const startTime = Date.now();
  const result: DeploymentResult = {
    success: false,
    duration: 0,
    errors: [],
  };

  try {
    // Switch to target branch
    await switchBranch(targetBranch);

    // If commit hash provided, reset to that commit
    if (commitHash) {
      await execAsync(
        `cd ${PROJECT_ROOT} && git reset --hard ${commitHash}`,
        {
          maxBuffer: 10 * 1024 * 1024,
          timeout: 30000,
        }
      );
      console.log(`[AEC Deployment] Reset to commit: ${commitHash}`);
    } else {
      // Otherwise, reset to previous commit
      await execAsync(
        `cd ${PROJECT_ROOT} && git reset --hard HEAD~1`,
        {
          maxBuffer: 10 * 1024 * 1024,
          timeout: 30000,
        }
      );
      console.log(`[AEC Deployment] Reset to previous commit`);
    }

    result.success = true;
    result.duration = Date.now() - startTime;

    console.log(`[AEC Deployment] ✅ Rollback successful (${result.duration}ms)`);

    return result;
  } catch (error: any) {
    console.error(`[AEC Deployment] Rollback failed:`, error);
    result.errors.push(error.message);
    result.duration = Date.now() - startTime;
    return result;
  }
}

// ============================================================================
// Health Checks
// ============================================================================

/**
 * Perform post-deployment health check
 */
export async function performHealthCheck(): Promise<{
  healthy: boolean;
  checks: Record<string, boolean>;
}> {
  console.log(`[AEC Deployment] Performing post-deployment health check...`);

  const checks: Record<string, boolean> = {
    serverResponding: await checkServerHealth(),
    databaseConnected: await checkDatabaseHealth(),
    criticalEndpoints: await checkCriticalEndpoints(),
  };

  const healthy = Object.values(checks).every(c => c);

  if (healthy) {
    console.log(`[AEC Deployment] ✅ Health check passed`);
  } else {
    console.log(`[AEC Deployment] ❌ Health check failed`);
    Object.entries(checks).forEach(([name, passed]) => {
      console.log(`  - ${name}: ${passed ? "✅" : "❌"}`);
    });
  }

  return { healthy, checks };
}

/**
 * Check server health
 */
async function checkServerHealth(): Promise<boolean> {
  try {
    // In a real implementation, you'd ping the server's health endpoint
    // For now, we'll just check if the process is running
    const { stdout } = await execAsync(`ps aux | grep "tsx.*server" | grep -v grep`, {
      maxBuffer: 1024 * 1024,
      timeout: 5000,
    });

    return stdout.trim().length > 0;
  } catch (error) {
    return false;
  }
}

/**
 * Check database health
 */
async function checkDatabaseHealth(): Promise<boolean> {
  try {
    const { getDb } = await import("../../db");
    const db = await getDb();
    return db !== null;
  } catch (error) {
    return false;
  }
}

/**
 * Check critical endpoints
 */
async function checkCriticalEndpoints(): Promise<boolean> {
  try {
    // Import and run API health check
    const { monitorAPIHealth } = await import("../sentinel/api-monitor");
    await monitorAPIHealth();

    // If it doesn't throw, endpoints are responding
    return true;
  } catch (error) {
    return false;
  }
}

// ============================================================================
// Deployment Strategy
// ============================================================================

/**
 * Determine if deployment should proceed based on impact
 */
export function shouldAutoDeployPatch(impact: string, affectsmedicalPathway: boolean): boolean {
  // Never auto-deploy if it affects medical pathways
  if (affectsmedicalPathway) {
    console.log(`[AEC Deployment] Auto-deploy blocked: affects medical pathway`);
    return false;
  }

  // Auto-deploy only low and medium impact changes
  if (impact === "low" || impact === "medium") {
    console.log(`[AEC Deployment] Auto-deploy approved: ${impact} impact`);
    return true;
  }

  console.log(`[AEC Deployment] Auto-deploy blocked: ${impact} impact requires manual review`);
  return false;
}

/**
 * Calculate deployment window (avoid peak hours)
 */
export function getNextDeploymentWindow(): Date {
  const now = new Date();
  const hour = now.getHours();

  // Avoid peak hours (9 AM - 5 PM)
  if (hour >= 9 && hour < 17) {
    // Deploy after 5 PM
    const deployTime = new Date(now);
    deployTime.setHours(17, 0, 0, 0);
    return deployTime;
  }

  // Deploy immediately if outside peak hours
  return now;
}
