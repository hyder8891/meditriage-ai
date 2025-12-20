/**
 * Diagnostic Engine - Orchestrates the diagnostic process
 */

import { getDb } from "../../db";
import { aecDetectedErrors, aecDiagnostics } from "../../../drizzle/schema";
import { eq } from "drizzle-orm";
import { buildDiagnosticContext, trimContextToTokenLimit, estimateTokenCount } from "./context-builder";
import { diagnoseWithGemini, validateDiagnostic } from "./gemini-engine";
import type { ErrorContext } from "./context-builder";
import type { DiagnosticResult } from "../types";

// ============================================================================
// Main Diagnostic Flow
// ============================================================================

/**
 * Run full diagnostic for an error
 */
export async function runDiagnostic(errorId: number): Promise<DiagnosticResult | null> {
  console.log(`[AEC Diagnostic Engine] Starting diagnostic for error ${errorId}...`);

  const db = await getDb();
  if (!db) {
    console.error("[AEC Diagnostic Engine] Database not available");
    return null;
  }

  try {
    // Update error status
    await db
      .update(aecDetectedErrors)
      .set({ status: "diagnosing" })
      .where(eq(aecDetectedErrors.id, errorId));

    // Load error details
    const [errorRecord] = await db
      .select()
      .from(aecDetectedErrors)
      .where(eq(aecDetectedErrors.id, errorId))
      .limit(1);

    if (!errorRecord) {
      console.error(`[AEC Diagnostic Engine] Error ${errorId} not found`);
      return null;
    }

    // Build error context
    const errorContext: ErrorContext = {
      id: errorRecord.id,
      severity: errorRecord.severity,
      errorType: errorRecord.errorType,
      source: errorRecord.source,
      errorMessage: errorRecord.errorMessage,
      stackTrace: errorRecord.stackTrace || undefined,
      context: errorRecord.context ? JSON.parse(errorRecord.context) : undefined,
      detectedAt: errorRecord.detectedAt,
    };

    // Build comprehensive context
    console.log(`[AEC Diagnostic Engine] Building codebase context...`);
    let context = await buildDiagnosticContext(errorContext);

    // Check token count
    const tokenCount = estimateTokenCount(context);
    console.log(`[AEC Diagnostic Engine] Context size: ${tokenCount} tokens`);

    // Trim if necessary
    if (tokenCount > 900000) {
      console.log(`[AEC Diagnostic Engine] Context too large, trimming...`);
      context = trimContextToTokenLimit(context, 900000);
    }

    // Run Gemini diagnostic
    console.log(`[AEC Diagnostic Engine] Invoking Gemini Pro...`);
    const diagnostic = await diagnoseWithGemini(context);

    // Validate diagnostic
    if (!validateDiagnostic(diagnostic)) {
      console.error(`[AEC Diagnostic Engine] Invalid diagnostic result`);
      await db
        .update(aecDetectedErrors)
        .set({ status: "detected" })
        .where(eq(aecDetectedErrors.id, errorId));
      return null;
    }

    // Save diagnostic to database
    await saveDiagnostic(diagnostic);

    // Update error status
    await db
      .update(aecDetectedErrors)
      .set({ status: "patching" })
      .where(eq(aecDetectedErrors.id, errorId));

    console.log(`[AEC Diagnostic Engine] ✅ Diagnostic complete for error ${errorId}`);
    console.log(`[AEC Diagnostic Engine] Root cause: ${diagnostic.rootCause.issue}`);
    console.log(`[AEC Diagnostic Engine] Impact: ${diagnostic.impact}`);

    return diagnostic;
  } catch (error: any) {
    console.error(`[AEC Diagnostic Engine] Diagnostic failed:`, error);

    // Reset error status
    await db
      .update(aecDetectedErrors)
      .set({ status: "detected" })
      .where(eq(aecDetectedErrors.id, errorId));

    return null;
  }
}

// ============================================================================
// Database Operations
// ============================================================================

/**
 * Save diagnostic result to database
 */
async function saveDiagnostic(diagnostic: DiagnosticResult): Promise<void> {
  const db = await getDb();
  if (!db) {
    console.error("[AEC Diagnostic Engine] Database not available");
    return;
  }

  await db.insert(aecDiagnostics).values({
    errorId: diagnostic.errorId,
    rootCauseFile: diagnostic.rootCause.file || null,
    rootCauseLine: diagnostic.rootCause.line || null,
    rootCauseFunction: diagnostic.rootCause.function || null,
    rootCauseIssue: diagnostic.rootCause.issue,
    explanation: diagnostic.explanation,
    impact: diagnostic.impact,
    affectedFeatures: JSON.stringify(diagnostic.affectedFeatures),
    fixSteps: JSON.stringify(diagnostic.fixSteps),
    filesToModify: JSON.stringify(diagnostic.filesToModify),
    refactoringNeeded: diagnostic.refactoringNeeded.length > 0 
      ? JSON.stringify(diagnostic.refactoringNeeded) 
      : null,
    testsToAdd: diagnostic.testsToAdd.length > 0 
      ? JSON.stringify(diagnostic.testsToAdd) 
      : null,
    diagnosticDuration: diagnostic.diagnosticDuration,
    tokensUsed: diagnostic.tokensUsed,
    modelVersion: diagnostic.modelVersion,
    completedAt: new Date(),
  });

  console.log(`[AEC Diagnostic Engine] Diagnostic saved to database`);
}

/**
 * Get diagnostic by error ID
 */
export async function getDiagnosticByErrorId(errorId: number): Promise<DiagnosticResult | null> {
  const db = await getDb();
  if (!db) {
    return null;
  }

  const [record] = await db
    .select()
    .from(aecDiagnostics)
    .where(eq(aecDiagnostics.errorId, errorId))
    .limit(1);

  if (!record) {
    return null;
  }

  return {
    errorId: record.errorId,
    rootCause: {
      file: record.rootCauseFile || undefined,
      line: record.rootCauseLine || undefined,
      function: record.rootCauseFunction || undefined,
      issue: record.rootCauseIssue,
    },
    explanation: record.explanation,
    impact: record.impact as "low" | "medium" | "high" | "critical",
    affectedFeatures: JSON.parse(record.affectedFeatures || "[]"),
    fixSteps: JSON.parse(record.fixSteps),
    filesToModify: JSON.parse(record.filesToModify),
    refactoringNeeded: record.refactoringNeeded ? JSON.parse(record.refactoringNeeded) : [],
    testsToAdd: record.testsToAdd ? JSON.parse(record.testsToAdd) : [],
    diagnosticDuration: record.diagnosticDuration || 0,
    tokensUsed: record.tokensUsed || 0,
    modelVersion: record.modelVersion || "unknown",
  };
}
