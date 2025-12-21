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
      source: errorRecord.source || undefined,
      errorMessage: errorRecord.message,
      stackTrace: errorRecord.stackTrace || undefined,
      context: errorRecord.userContext ? JSON.parse(errorRecord.userContext) : undefined,
      detectedAt: errorRecord.firstOccurrence,
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
    rootCause: JSON.stringify(diagnostic.rootCause),
    impact: diagnostic.impact,
    affectedFeatures: JSON.stringify(diagnostic.affectedFeatures),
    proposedSolution: JSON.stringify({
      fixSteps: diagnostic.fixSteps,
      filesToModify: diagnostic.filesToModify,
      refactoringNeeded: diagnostic.refactoringNeeded,
      testsToAdd: diagnostic.testsToAdd,
    }),
    confidence: String(Math.round((diagnostic.tokensUsed > 0 ? 85 : 50))),
    codeContext: diagnostic.explanation,
    relatedFiles: JSON.stringify(diagnostic.filesToModify),
    analysisModel: diagnostic.modelVersion,
    analysisDuration: diagnostic.diagnosticDuration,
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

  const rootCause = JSON.parse(record.rootCause);
  const proposedSolution = JSON.parse(record.proposedSolution);
  
  return {
    errorId: record.errorId,
    rootCause: rootCause,
    explanation: record.codeContext || '',
    impact: record.impact as "low" | "medium" | "high" | "critical",
    affectedFeatures: JSON.parse(record.affectedFeatures || "[]"),
    fixSteps: proposedSolution.fixSteps || [],
    filesToModify: proposedSolution.filesToModify || [],
    refactoringNeeded: proposedSolution.refactoringNeeded || [],
    testsToAdd: proposedSolution.testsToAdd || [],
    diagnosticDuration: record.analysisDuration || 0,
    tokensUsed: 0, // Not stored in database schema
    modelVersion: record.analysisModel || "unknown",
  };
}
