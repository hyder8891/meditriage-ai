/**
 * Gemini Pro Diagnostic Engine - Diagnostic Layer
 * Uses Gemini 2.0 Pro to analyze errors and generate fixes
 */

import { invokeLLM } from "../../_core/llm";
import type { CodebaseContext } from "./context-builder";
import type { DiagnosticResult } from "../types";

// ============================================================================
// Diagnostic Prompts
// ============================================================================

const DIAGNOSTIC_SYSTEM_PROMPT = `You are a senior DevOps engineer and full-stack developer analyzing a production issue in the "My Doctor" medical application.

Your task is to:
1. Identify the EXACT root cause (file, line number, function)
2. Explain WHY this error occurred (logic flaw, dependency conflict, schema mismatch)
3. Assess impact (critical medical pathway? user-facing? backend only?)
4. Provide step-by-step fix instructions
5. Suggest refactoring to prevent recurrence

Be precise, thorough, and focus on actionable solutions.`;

const DIAGNOSTIC_OUTPUT_SCHEMA = {
  name: "diagnostic_result",
  strict: true,
  schema: {
    type: "object",
    properties: {
      rootCause: {
        type: "object",
        properties: {
          file: { type: "string", description: "File path where the error originates" },
          line: { type: "number", description: "Line number of the error" },
          function: { type: "string", description: "Function or method name" },
          issue: { type: "string", description: "Brief description of the root cause" },
        },
        required: ["issue"],
        additionalProperties: false,
      },
      explanation: {
        type: "string",
        description: "Detailed explanation of why this error occurred",
      },
      impact: {
        type: "string",
        enum: ["low", "medium", "high", "critical"],
        description: "Impact level of this error",
      },
      affectedFeatures: {
        type: "array",
        items: { type: "string" },
        description: "List of features affected by this error",
      },
      fixSteps: {
        type: "array",
        items: { type: "string" },
        description: "Step-by-step instructions to fix the error",
      },
      filesToModify: {
        type: "array",
        items: { type: "string" },
        description: "List of files that need to be modified",
      },
      refactoringNeeded: {
        type: "array",
        items: { type: "string" },
        description: "Refactoring suggestions to prevent recurrence",
      },
      testsToAdd: {
        type: "array",
        items: { type: "string" },
        description: "Tests that should be added to prevent regression",
      },
    },
    required: [
      "rootCause",
      "explanation",
      "impact",
      "affectedFeatures",
      "fixSteps",
      "filesToModify",
    ],
    additionalProperties: false,
  },
};

// ============================================================================
// Diagnostic Engine
// ============================================================================

/**
 * Analyze error using Gemini Pro
 */
export async function diagnoseWithGemini(
  context: CodebaseContext
): Promise<DiagnosticResult> {
  console.log(`[AEC Gemini Engine] Starting diagnostic for error ${context.error.id}...`);

  const startTime = Date.now();

  // Build diagnostic prompt
  const userPrompt = buildDiagnosticPrompt(context);

  try {
    // Call Gemini Pro with Deep Think Mode
    const response = await invokeLLM({
      messages: [
        { role: "system", content: DIAGNOSTIC_SYSTEM_PROMPT },
        { role: "user", content: userPrompt },
      ],
      temperature: 0.1, // Low temperature for precise analysis
      response_format: {
        type: "json_schema",
        json_schema: DIAGNOSTIC_OUTPUT_SCHEMA,
      },
    });

    // Parse response
    const diagnosticData = JSON.parse(response.choices[0].message.content);

    // Calculate metrics
    const duration = Math.floor((Date.now() - startTime) / 1000);
    const tokensUsed = response.usage?.total_tokens || 0;

    const result: DiagnosticResult = {
      errorId: context.error.id,
      rootCause: {
        file: diagnosticData.rootCause.file,
        line: diagnosticData.rootCause.line,
        function: diagnosticData.rootCause.function,
        issue: diagnosticData.rootCause.issue,
      },
      explanation: diagnosticData.explanation,
      impact: diagnosticData.impact,
      affectedFeatures: diagnosticData.affectedFeatures,
      fixSteps: diagnosticData.fixSteps,
      filesToModify: diagnosticData.filesToModify,
      refactoringNeeded: diagnosticData.refactoringNeeded || [],
      testsToAdd: diagnosticData.testsToAdd || [],
      diagnosticDuration: duration,
      tokensUsed: tokensUsed,
      modelVersion: "gemini-2.0-pro",
    };

    console.log(`[AEC Gemini Engine] Diagnostic complete in ${duration}s, ${tokensUsed} tokens used`);
    console.log(`[AEC Gemini Engine] Root cause: ${result.rootCause.issue}`);

    return result;
  } catch (error: any) {
    console.error(`[AEC Gemini Engine] Diagnostic failed:`, error);

    // Return fallback diagnostic
    return {
      errorId: context.error.id,
      rootCause: {
        issue: `Failed to diagnose: ${error.message}`,
      },
      explanation: `Gemini Pro diagnostic failed. Error: ${error.message}`,
      impact: "medium",
      affectedFeatures: [],
      fixSteps: ["Manual investigation required"],
      filesToModify: [],
      refactoringNeeded: [],
      testsToAdd: [],
      diagnosticDuration: Math.floor((Date.now() - startTime) / 1000),
      tokensUsed: 0,
      modelVersion: "gemini-2.0-pro",
    };
  }
}

// ============================================================================
// Prompt Building
// ============================================================================

/**
 * Build comprehensive diagnostic prompt
 */
function buildDiagnosticPrompt(context: CodebaseContext): string {
  let prompt = `# Error Analysis Request

## Error Details
- **Error ID**: ${context.error.id}
- **Severity**: ${context.error.severity}
- **Type**: ${context.error.errorType}
- **Source**: ${context.error.source}
- **Message**: ${context.error.errorMessage}
- **Detected At**: ${context.error.detectedAt}

`;

  // Add stack trace
  if (context.error.stackTrace) {
    prompt += `## Stack Trace
\`\`\`
${context.error.stackTrace}
\`\`\`

`;
  }

  // Add error context
  if (context.error.context) {
    prompt += `## Error Context
\`\`\`json
${JSON.stringify(context.error.context, null, 2)}
\`\`\`

`;
  }

  // Add relevant files
  if (context.codebase.relevantFiles.length > 0) {
    prompt += `## Relevant Code Files

`;
    for (const file of context.codebase.relevantFiles) {
      prompt += `### ${file.path} (Relevance: ${file.relevance})
\`\`\`typescript
${file.content}
\`\`\`

`;
    }
  }

  // Add recent changes
  if (context.codebase.recentChanges.length > 0) {
    prompt += `## Recent Git Commits

`;
    for (const commit of context.codebase.recentChanges.slice(0, 5)) {
      prompt += `- **${commit.hash.substring(0, 7)}** (${commit.date}): ${commit.message}
  Files: ${commit.filesChanged.join(", ")}

`;
    }
  }

  // Add dependencies
  prompt += `## Dependencies
\`\`\`json
${JSON.stringify(context.codebase.dependencies, null, 2)}
\`\`\`

`;

  // Add database schema (truncated)
  if (context.codebase.schema) {
    const schemaPreview = context.codebase.schema.substring(0, 5000);
    prompt += `## Database Schema (Preview)
\`\`\`typescript
${schemaPreview}
${context.codebase.schema.length > 5000 ? "\n... (truncated)" : ""}
\`\`\`

`;
  }

  // Add runtime info
  prompt += `## Runtime Environment
- **Node Version**: ${context.runtime.systemInfo.nodeVersion}
- **Platform**: ${context.runtime.systemInfo.platform}
- **Memory Used**: ${Math.round(context.runtime.systemInfo.memory.used / 1024 / 1024)} MB
- **Uptime**: ${Math.round(context.runtime.systemInfo.uptime / 60)} minutes

`;

  // Add logs if available
  if (context.runtime.logs) {
    prompt += `## Recent Logs
\`\`\`
${context.runtime.logs}
\`\`\`

`;
  }

  prompt += `## Your Task

Analyze this error thoroughly and provide:
1. **Root Cause**: Identify the exact file, line, and function where the error originates
2. **Explanation**: Explain why this error occurred (logic flaw, dependency issue, etc.)
3. **Impact Assessment**: Determine if this affects critical medical pathways (BRAIN, Triage, Clinical)
4. **Fix Instructions**: Provide clear, step-by-step instructions to fix the error
5. **Prevention**: Suggest refactoring and tests to prevent this from happening again

Focus on actionable, precise solutions. This is a medical application, so accuracy is critical.`;

  return prompt;
}

/**
 * Validate diagnostic result
 */
export function validateDiagnostic(result: DiagnosticResult): boolean {
  // Check required fields
  if (!result.rootCause || !result.rootCause.issue) {
    console.warn("[AEC Gemini Engine] Invalid diagnostic: missing root cause");
    return false;
  }

  if (!result.explanation || result.explanation.length < 10) {
    console.warn("[AEC Gemini Engine] Invalid diagnostic: explanation too short");
    return false;
  }

  if (!result.fixSteps || result.fixSteps.length === 0) {
    console.warn("[AEC Gemini Engine] Invalid diagnostic: no fix steps provided");
    return false;
  }

  return true;
}
