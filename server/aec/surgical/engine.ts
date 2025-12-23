// @ts-nocheck
/**
 * Surgical Engine - Orchestrates patch generation and application
 */

import { getDb } from "../../db";
import { aecDetectedErrors, aecPatches, aecDiagnostics } from "../../../drizzle/schema";
import { eq } from "drizzle-orm";
import { generatePatch, validatePatch } from "./patch-generator";
import { applyPatch, validateBeforeApply, getCurrentBranch } from "./patch-applicator";
import { getDiagnosticByErrorId } from "../diagnostic/engine";
import type { GeneratedPatch } from "./patch-generator";

export interface SurgicalResult {
  success: boolean;
  patchId?: number;
  branchName?: string;
  filesModified: string[];
  errors: string[];
  warnings: string[];
}

// ============================================================================
// Main Surgical Flow
// ============================================================================

/**
 * Run surgical procedure for a diagnosed error
 */
export async function runSurgicalProcedure(
  errorId: number,
  options: {
    autoApply?: boolean; // Automatically apply patch (default: false for safety)
    createBranch?: boolean; // Create git branch (default: true)
    createBackup?: boolean; // Create backup before applying (default: true)
  } = {}
): Promise<SurgicalResult> {
  console.log(`[AEC Surgical Engine] Starting surgical procedure for error ${errorId}...`);

  const result: SurgicalResult = {
    success: false,
    filesModified: [],
    errors: [],
    warnings: [],
  };

  const db = await getDb();
  if (!db) {
    result.errors.push("Database not available");
    return result;
  }

  try {
    // Step 1: Load diagnostic
    const diagnostic = await getDiagnosticByErrorId(errorId);
    if (!diagnostic) {
      result.errors.push(`No diagnostic found for error ${errorId}`);
      return result;
    }

    // Get diagnostic ID
    const [diagnosticRecord] = await db
      .select()
      .from(aecDiagnostics)
      .where(eq(aecDiagnostics.errorId, errorId))
      .limit(1);

    if (!diagnosticRecord) {
      result.errors.push(`Diagnostic record not found for error ${errorId}`);
      return result;
    }

    const diagnosticId = diagnosticRecord.id;

    // Step 2: Generate patch
    console.log(`[AEC Surgical Engine] Generating patch...`);
    const patch = await generatePatch(diagnostic, diagnosticId);

    if (!patch) {
      result.errors.push("Failed to generate patch");
      return result;
    }

    // Step 3: Validate patch
    const validation = validatePatch(patch);
    if (!validation.valid) {
      result.errors.push(...validation.errors);
      return result;
    }

    // Step 4: Safety checks
    const safetyCheck = await validateBeforeApply(patch);
    result.warnings.push(...safetyCheck.warnings);

    if (!safetyCheck.safe) {
      console.log(`[AEC Surgical Engine] ⚠️  Safety warnings detected`);
      result.warnings.forEach(w => console.log(`  - ${w}`));
    }

    // Step 5: Save patch to database
    const patchId = await savePatchToDatabase(patch);
    result.patchId = patchId;

    // Step 6: Apply patch (if autoApply is true)
    if (options.autoApply) {
      console.log(`[AEC Surgical Engine] Applying patch...`);

      const applicationResult = await applyPatch(patch, {
        createBranch: options.createBranch !== false, // Default true
        createBackup: options.createBackup !== false, // Default true
        dryRun: false,
      });

      result.filesModified = applicationResult.filesApplied;
      result.branchName = applicationResult.branchName;
      result.errors.push(...applicationResult.errors);

      if (applicationResult.success) {
        // Update patch status
        await db
          .update(aecPatches)
          .set({ validationStatus: "pending" })
          .where(eq(aecPatches.id, patchId));

        // Update error status
        await db
          .update(aecDetectedErrors)
          .set({ status: "patching" })
          .where(eq(aecDetectedErrors.id, errorId));

        console.log(`[AEC Surgical Engine] ✅ Patch applied successfully`);
      } else {
        console.log(`[AEC Surgical Engine] ❌ Patch application failed`);
      }

      result.success = applicationResult.success;
    } else {
      console.log(`[AEC Surgical Engine] Patch generated but not applied (autoApply=false)`);
      result.success = true; // Generation succeeded
    }

    return result;
  } catch (error: any) {
    console.error(`[AEC Surgical Engine] Surgical procedure failed:`, error);
    result.errors.push(`Fatal error: ${error.message}`);
    return result;
  }
}

// ============================================================================
// Database Operations
// ============================================================================

/**
 * Save patch to database
 */
async function savePatchToDatabase(patch: GeneratedPatch): Promise<number> {
  const db = await getDb();
  if (!db) {
    throw new Error("Database not available");
  }

  const [insertResult] = await db.insert(aecPatches).values({
    diagnosticId: patch.diagnosticId,
    errorId: patch.errorId,
    patchVersion: patch.patchVersion,
    branchName: null, // Will be updated when applied
    filesModified: JSON.stringify(patch.filesModified.map(f => ({
      path: f.filePath,
      description: f.changeDescription,
      linesAdded: f.linesAdded,
      linesRemoved: f.linesRemoved,
    }))),
    linesAdded: patch.filesModified.reduce((sum, f) => sum + f.linesAdded, 0),
    linesRemoved: patch.filesModified.reduce((sum, f) => sum + f.linesRemoved, 0),
    validationStatus: "pending",
    deploymentStatus: "pending",
  });

  const patchId = Number(insertResult.insertId);
  console.log(`[AEC Surgical Engine] Patch saved to database (ID: ${patchId})`);

  return patchId;
}

/**
 * Get patch by ID
 */
export async function getPatchById(patchId: number): Promise<GeneratedPatch | null> {
  const db = await getDb();
  if (!db) {
    return null;
  }

  const [record] = await db
    .select()
    .from(aecPatches)
    .where(eq(aecPatches.id, patchId))
    .limit(1);

  if (!record) {
    return null;
  }

  const filesData = JSON.parse(record.filesModified);

  return {
    diagnosticId: record.diagnosticId,
    errorId: record.errorId,
    patchVersion: record.patchVersion,
    filesModified: filesData.map((f: any) => ({
      filePath: f.path,
      originalContent: "", // Not stored in DB
      patchedContent: "", // Not stored in DB
      linesAdded: f.linesAdded,
      linesRemoved: f.linesRemoved,
      changeDescription: f.description,
    })),
    summary: "", // Not stored separately
    reasoning: "", // Not stored separately
  };
}

/**
 * Update patch validation status
 */
export async function updatePatchValidation(
  patchId: number,
  status: "pending" | "testing" | "passed" | "failed",
  testResults?: any
): Promise<void> {
  const db = await getDb();
  if (!db) {
    return;
  }

  await db
    .update(aecPatches)
    .set({
      validationStatus: status,
      testResults: testResults ? JSON.stringify(testResults) : null,
    })
    .where(eq(aecPatches.id, patchId));

  console.log(`[AEC Surgical Engine] Patch ${patchId} validation status: ${status}`);
}

/**
 * Update patch deployment status
 */
export async function updatePatchDeployment(
  patchId: number,
  status: "pending" | "deploying" | "deployed" | "rolled_back" | "rejected",
  reason?: string
): Promise<void> {
  const db = await getDb();
  if (!db) {
    return;
  }

  const updates: any = {
    deploymentStatus: status,
  };

  if (status === "deployed") {
    updates.deployedAt = new Date();
  } else if (status === "rolled_back") {
    updates.rolledBackAt = new Date();
    if (reason) {
      updates.rollbackReason = reason;
    }
  }

  await db
    .update(aecPatches)
    .set(updates)
    .where(eq(aecPatches.id, patchId));

  console.log(`[AEC Surgical Engine] Patch ${patchId} deployment status: ${status}`);
}
