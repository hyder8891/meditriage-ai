/**
 * Patch Generator - Surgical Layer
 * Generates code patches using Gemini Pro based on diagnostic results
 */

import { invokeLLM } from "../../_core/llm";
import fs from "fs/promises";
import path from "path";
import type { DiagnosticResult } from "../types";

export interface GeneratedPatch {
  diagnosticId: number;
  errorId: number;
  patchVersion: string;
  filesModified: FilePatch[];
  summary: string;
  reasoning: string;
}

export interface FilePatch {
  filePath: string;
  originalContent: string;
  patchedContent: string;
  linesAdded: number;
  linesRemoved: number;
  changeDescription: string;
}

// ============================================================================
// Patch Generation
// ============================================================================

const PATCH_SYSTEM_PROMPT = `You are an expert software engineer tasked with generating precise code patches to fix bugs.

Your responsibilities:
1. Generate EXACT code changes (not pseudocode or comments)
2. Maintain code style and conventions
3. Preserve existing functionality
4. Add proper error handling
5. Include inline comments explaining changes
6. Ensure type safety (TypeScript)

Rules:
- Output COMPLETE file contents (not just snippets)
- Maintain imports, exports, and structure
- Follow existing patterns in the codebase
- Add validation and error handling
- Keep changes minimal but complete

This is a medical application - accuracy and safety are paramount.`;

const PATCH_OUTPUT_SCHEMA = {
  name: "code_patch",
  strict: true,
  schema: {
    type: "object",
    properties: {
      files: {
        type: "array",
        items: {
          type: "object",
          properties: {
            filePath: {
              type: "string",
              description: "Relative path to the file from project root",
            },
            patchedContent: {
              type: "string",
              description: "Complete patched file content",
            },
            changeDescription: {
              type: "string",
              description: "Brief description of what was changed",
            },
          },
          required: ["filePath", "patchedContent", "changeDescription"],
          additionalProperties: false,
        },
      },
      summary: {
        type: "string",
        description: "Overall summary of the patch",
      },
      reasoning: {
        type: "string",
        description: "Explanation of why these changes fix the issue",
      },
    },
    required: ["files", "summary", "reasoning"],
    additionalProperties: false,
  },
};

/**
 * Generate code patch from diagnostic
 */
export async function generatePatch(
  diagnostic: DiagnosticResult,
  diagnosticId: number
): Promise<GeneratedPatch | null> {
  console.log(`[AEC Patch Generator] Generating patch for error ${diagnostic.errorId}...`);

  try {
    // Load current file contents
    const fileContents = await loadFiles(diagnostic.filesToModify);

    // Build patch generation prompt
    const prompt = buildPatchPrompt(diagnostic, fileContents);

    // Call Gemini Pro
    const response = await invokeLLM({
      messages: [
        { role: "system", content: PATCH_SYSTEM_PROMPT },
        { role: "user", content: prompt },
      ],
      temperature: 0.2, // Low temperature for precise code generation
      response_format: {
        type: "json_schema",
        json_schema: PATCH_OUTPUT_SCHEMA,
      },
    });

    // Parse response
    const patchData = JSON.parse(response.choices[0].message.content);

    // Build file patches
    const filesModified: FilePatch[] = [];
    for (const file of patchData.files) {
      const original = fileContents[file.filePath] || "";
      const { linesAdded, linesRemoved } = calculateLineDiff(original, file.patchedContent);

      filesModified.push({
        filePath: file.filePath,
        originalContent: original,
        patchedContent: file.patchedContent,
        linesAdded,
        linesRemoved,
        changeDescription: file.changeDescription,
      });
    }

    const patch: GeneratedPatch = {
      diagnosticId,
      errorId: diagnostic.errorId,
      patchVersion: generatePatchVersion(),
      filesModified,
      summary: patchData.summary,
      reasoning: patchData.reasoning,
    };

    console.log(`[AEC Patch Generator] ✅ Patch generated: ${filesModified.length} files modified`);
    console.log(`[AEC Patch Generator] Summary: ${patch.summary}`);

    return patch;
  } catch (error: any) {
    console.error(`[AEC Patch Generator] Failed to generate patch:`, error);
    return null;
  }
}

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Load file contents from disk
 */
async function loadFiles(filePaths: string[]): Promise<Record<string, string>> {
  const projectRoot = "/home/ubuntu/meditriage-ai";
  const contents: Record<string, string> = {};

  for (const filePath of filePaths) {
    try {
      const fullPath = path.join(projectRoot, filePath);
      const content = await fs.readFile(fullPath, "utf-8");
      contents[filePath] = content;
    } catch (error) {
      console.warn(`[AEC Patch Generator] Could not read ${filePath}:`, error);
      contents[filePath] = ""; // Empty if file doesn't exist
    }
  }

  return contents;
}

/**
 * Build patch generation prompt
 */
function buildPatchPrompt(
  diagnostic: DiagnosticResult,
  fileContents: Record<string, string>
): string {
  let prompt = `# Code Patch Generation Request

## Error Context
- **Error ID**: ${diagnostic.errorId}
- **Root Cause**: ${diagnostic.rootCause.issue}
- **Impact**: ${diagnostic.impact}
- **Affected Features**: ${diagnostic.affectedFeatures.join(", ")}

## Root Cause Details
`;

  if (diagnostic.rootCause.file) {
    prompt += `- **File**: ${diagnostic.rootCause.file}\n`;
  }
  if (diagnostic.rootCause.line) {
    prompt += `- **Line**: ${diagnostic.rootCause.line}\n`;
  }
  if (diagnostic.rootCause.function) {
    prompt += `- **Function**: ${diagnostic.rootCause.function}\n`;
  }

  prompt += `\n## Explanation
${diagnostic.explanation}

## Fix Instructions
${diagnostic.fixSteps.map((step, i) => `${i + 1}. ${step}`).join("\n")}

`;

  // Add current file contents
  prompt += `## Current File Contents\n\n`;
  for (const [filePath, content] of Object.entries(fileContents)) {
    prompt += `### ${filePath}
\`\`\`typescript
${content}
\`\`\`

`;
  }

  // Add refactoring suggestions if available
  if (diagnostic.refactoringNeeded.length > 0) {
    prompt += `## Refactoring Suggestions
${diagnostic.refactoringNeeded.map((s, i) => `${i + 1}. ${s}`).join("\n")}

`;
  }

  prompt += `## Your Task

Generate COMPLETE, WORKING code for each file that needs to be modified.

Requirements:
1. Output the ENTIRE file content (not just changed sections)
2. Implement ALL fix steps precisely
3. Add proper error handling and validation
4. Include inline comments explaining critical changes
5. Maintain existing code style and conventions
6. Ensure TypeScript type safety
7. Follow the refactoring suggestions where applicable

Output format: JSON with files array containing complete patched file contents.

Remember: This is a medical application. Accuracy and safety are critical.`;

  return prompt;
}

/**
 * Calculate line differences
 */
function calculateLineDiff(original: string, patched: string): {
  linesAdded: number;
  linesRemoved: number;
} {
  const originalLines = original.split("\n");
  const patchedLines = patched.split("\n");

  // Simple diff: count line changes
  const maxLines = Math.max(originalLines.length, patchedLines.length);
  let added = 0;
  let removed = 0;

  for (let i = 0; i < maxLines; i++) {
    const origLine = originalLines[i];
    const patchLine = patchedLines[i];

    if (origLine === undefined && patchLine !== undefined) {
      added++;
    } else if (origLine !== undefined && patchLine === undefined) {
      removed++;
    } else if (origLine !== patchLine) {
      // Line modified - count as both added and removed
      added++;
      removed++;
    }
  }

  return { linesAdded: added, linesRemoved: removed };
}

/**
 * Generate patch version string
 */
function generatePatchVersion(): string {
  const now = new Date();
  const timestamp = now.toISOString().replace(/[:.]/g, "-").slice(0, -5);
  return `aec-patch-${timestamp}`;
}

/**
 * Validate generated patch
 */
export function validatePatch(patch: GeneratedPatch): {
  valid: boolean;
  errors: string[];
} {
  const errors: string[] = [];

  // Check that files were modified
  if (patch.filesModified.length === 0) {
    errors.push("No files modified in patch");
  }

  // Check that patched content is not empty
  for (const file of patch.filesModified) {
    if (!file.patchedContent || file.patchedContent.trim().length === 0) {
      errors.push(`Empty patched content for ${file.filePath}`);
    }

    // Check for basic syntax (has imports, exports, etc.)
    if (file.filePath.endsWith(".ts") || file.filePath.endsWith(".tsx")) {
      // TypeScript files should have some structure
      if (!file.patchedContent.includes("import") && !file.patchedContent.includes("export")) {
        errors.push(`${file.filePath} appears to be missing imports/exports`);
      }
    }
  }

  // Check summary and reasoning
  if (!patch.summary || patch.summary.length < 10) {
    errors.push("Patch summary is too short or missing");
  }

  if (!patch.reasoning || patch.reasoning.length < 20) {
    errors.push("Patch reasoning is too short or missing");
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}
