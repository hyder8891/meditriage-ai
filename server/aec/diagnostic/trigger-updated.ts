/**
 * Diagnostic Trigger - Entry point for diagnostic layer
 * Updated to trigger surgical layer after diagnosis
 */

import { runDiagnostic } from "./engine";
import { runSurgicalProcedure } from "../surgical/engine";

/**
 * Trigger diagnostic for an error
 * This runs asynchronously in the background
 */
export async function triggerDiagnostic(errorId: number): Promise<void> {
  console.log(`[AEC Diagnostic] Diagnostic triggered for error ${errorId}`);
  
  // Run diagnostic asynchronously (don't block)
  runDiagnostic(errorId)
    .then(async (result) => {
      if (result) {
        console.log(`[AEC Diagnostic] ✅ Diagnostic complete for error ${errorId}`);
        console.log(`[AEC Diagnostic] Root cause: ${result.rootCause.issue}`);
        
        // Trigger surgical layer (patch generation)
        console.log(`[AEC Diagnostic] Triggering surgical procedure...`);
        
        const surgicalResult = await runSurgicalProcedure(errorId, {
          autoApply: false, // Don't auto-apply for safety - require manual review
          createBranch: true,
          createBackup: true,
        });
        
        if (surgicalResult.success) {
          console.log(`[AEC Diagnostic] ✅ Surgical procedure complete`);
          console.log(`[AEC Diagnostic] Patch ID: ${surgicalResult.patchId}`);
          console.log(`[AEC Diagnostic] Files to modify: ${surgicalResult.filesModified.length}`);
          
          if (surgicalResult.warnings.length > 0) {
            console.log(`[AEC Diagnostic] ⚠️  Warnings:`);
            surgicalResult.warnings.forEach(w => console.log(`  - ${w}`));
          }
        } else {
          console.log(`[AEC Diagnostic] ❌ Surgical procedure failed`);
          surgicalResult.errors.forEach(e => console.log(`  - ${e}`));
        }
      } else {
        console.log(`[AEC Diagnostic] ⚠️  Diagnostic failed for error ${errorId}`);
      }
    })
    .catch((error) => {
      console.error(`[AEC Diagnostic] ❌ Diagnostic error for error ${errorId}:`, error);
    });
  
  console.log(`[AEC Diagnostic] Diagnostic running in background for error ${errorId}...`);
}
