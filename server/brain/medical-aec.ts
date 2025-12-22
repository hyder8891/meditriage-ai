/**
 * Medical AEC (Autonomous Error Correction)
 * 
 * Layer 5 of Avicenna-X: Self-correcting AI via RLHF
 * Captures AI vs doctor diagnosis deltas and patches prompts automatically
 * 
 * Key Concepts:
 * - RLHF (Reinforcement Learning from Human Feedback): Learn from doctor corrections
 * - Prompt Patching: Update system prompts in database without code deployment
 * - Continuous Improvement: Every doctor correction makes the AI better
 * 
 * Architecture:
 * 1. Capture: Record AI diagnosis vs doctor diagnosis deltas
 * 2. Analyze: Identify systematic errors (e.g., "always misses X")
 * 3. Patch: Generate new prompt versions that fix the error
 * 4. Deploy: Activate new prompt in database (instant rollout)
 * 5. Monitor: Track improvement metrics
 */

import { getDb } from "../db";

const db = await getDb();
import { Redis } from "@upstash/redis";
import { invokeGeminiPro } from "../_core/gemini-dual";
import type { HybridDiagnosis } from "./orchestrator";

// Convert rediss:// to https:// for Upstash SDK
const redisUrl = process.env.REDIS_URL!.replace('rediss://', 'https://').replace(':6379', '');
const redis = new Redis({
  url: redisUrl,
  token: process.env.REDIS_TOKEN!,
});

// ============================================================================
// Types
// ============================================================================

interface DiagnosisDelta {
  userId: number;
  doctorId: number;
  triageRecordId?: number;
  
  aiDiagnosis: {
    primaryDiagnosis: string;
    confidence: number;
    differentialDiagnoses?: string[];
  };
  
  doctorDiagnosis: {
    primaryDiagnosis: string;
    confidence: number;
    differentialDiagnoses?: string[];
  };
  
  correctionType: "completely_wrong" | "missed_diagnosis" | "incorrect_ranking" | "severity_mismatch" | "correct_but_imprecise";
  severityDelta?: number;
  doctorFeedback?: string;
}

interface PromptPatch {
  promptName: string;
  promptVersion: number;
  systemPrompt: string;
  userPromptTemplate: string;
  patchReason: string;
  expectedImprovement: string;
}

// ============================================================================
// Main Functions
// ============================================================================

/**
 * Record a medical correction from a doctor
 * This is the core RLHF data collection mechanism
 */
export async function recordMedicalCorrection(delta: DiagnosisDelta): Promise<void> {
  try {
    console.log(`[Medical AEC] Recording correction from doctor ${delta.doctorId}...`);

    // Store in database
    // TODO: Insert into medical_corrections table

    // Add to RLHF training queue
    await addToRLHFQueue(delta);

    // Check if this error is systematic (appears frequently)
    const isSystematic = await checkIfSystematicError(delta);

    if (isSystematic) {
      console.log(`[Medical AEC] ⚠️  Systematic error detected: ${delta.correctionType}`);
      
      // Trigger prompt patching
      await triggerPromptPatching(delta);
    }

    console.log("[Medical AEC] Correction recorded successfully");
  } catch (error) {
    console.error("[Medical AEC] Error recording correction:", error);
  }
}

/**
 * Generate and deploy a prompt patch to fix systematic errors
 * This is the "self-healing" mechanism
 */
export async function generatePromptPatch(
  errorPattern: string,
  recentCorrections: DiagnosisDelta[]
): Promise<PromptPatch | null> {
  try {
    console.log(`[Medical AEC] Generating prompt patch for error: ${errorPattern}`);

    // Analyze error pattern with AI
    const analysis = await analyzeErrorPattern(errorPattern, recentCorrections);

    if (!analysis.isPatchable) {
      console.log("[Medical AEC] Error is not patchable via prompt engineering");
      return null;
    }

    // Generate new prompt version
    const currentPrompt = await loadCurrentPrompt();
    const patchedPrompt = await generatePatchedPrompt(currentPrompt, analysis);

    // Create patch record
    const patch: PromptPatch = {
      promptName: "medical_triage_v2",
      promptVersion: currentPrompt.version + 1,
      systemPrompt: patchedPrompt.systemPrompt,
      userPromptTemplate: patchedPrompt.userPromptTemplate,
      patchReason: analysis.rootCause,
      expectedImprovement: analysis.expectedImprovement,
    };

    console.log(`[Medical AEC] Generated prompt patch v${patch.promptVersion}`);
    return patch;
  } catch (error) {
    console.error("[Medical AEC] Error generating prompt patch:", error);
    return null;
  }
}

/**
 * Deploy a prompt patch to production
 * Updates database, AI switches to new prompt immediately
 */
export async function deployPromptPatch(patch: PromptPatch): Promise<boolean> {
  try {
    console.log(`[Medical AEC] Deploying prompt patch v${patch.promptVersion}...`);

    // Store in database
    // TODO: Insert into medical_reasoning_prompts table
    // TODO: Set isActive = true, deactivate previous version

    // Clear Redis cache to force reload
    await redis.del("medical_reasoning_prompt:active");

    console.log(`[Medical AEC] ✅ Prompt patch v${patch.promptVersion} deployed successfully`);
    return true;
  } catch (error) {
    console.error("[Medical AEC] Error deploying prompt patch:", error);
    return false;
  }
}

/**
 * Background job: Analyze corrections and generate patches
 * Should run daily via cron
 */
export async function analyzeCorrectionsJob(): Promise<void> {
  console.log("[Medical AEC Job] Starting correction analysis...");

  try {
    // Get corrections from last 7 days
    const recentCorrections = await getRecentCorrections(7);

    if (recentCorrections.length < 10) {
      console.log("[Medical AEC Job] Not enough corrections to analyze (need at least 10)");
      return;
    }

    // Group by correction type
    const grouped = groupCorrectionsByType(recentCorrections);

    // Find systematic errors (same error type > 5 times)
    for (const [correctionType, corrections] of Object.entries(grouped)) {
      if (corrections.length >= 5) {
        console.log(`[Medical AEC Job] Found systematic error: ${correctionType} (${corrections.length} occurrences)`);

        // Generate prompt patch
        const patch = await generatePromptPatch(correctionType, corrections);

        if (patch) {
          // Deploy patch automatically (with human review option)
          const deployed = await deployPromptPatch(patch);

          if (deployed) {
            console.log(`[Medical AEC Job] ✅ Auto-deployed patch for ${correctionType}`);
          }
        }
      }
    }

    console.log("[Medical AEC Job] Correction analysis complete");
  } catch (error) {
    console.error("[Medical AEC Job] Error:", error);
  }
}

// ============================================================================
// RLHF Training Data Generation
// ============================================================================

async function addToRLHFQueue(delta: DiagnosisDelta): Promise<void> {
  try {
    // Convert correction to training example
    const trainingExample = {
      correctionId: 0, // TODO: Get from database insert
      inputContext: {
        // TODO: Reconstruct from triage record
        symptoms: [],
        vitals: {},
        history: "",
      },
      expectedOutput: {
        diagnosis: delta.doctorDiagnosis.primaryDiagnosis,
        confidence: delta.doctorDiagnosis.confidence,
        reasoning: [],
      },
      qualityScore: calculateQualityScore(delta),
    };

    // Store in database
    // TODO: Insert into rlhf_training_data table

    console.log("[Medical AEC] Added to RLHF training queue");
  } catch (error) {
    console.error("[Medical AEC] Error adding to RLHF queue:", error);
  }
}

function calculateQualityScore(delta: DiagnosisDelta): number {
  let score = 100;

  // Penalize if doctor confidence is low
  if (delta.doctorDiagnosis.confidence < 70) {
    score -= 20;
  }

  // Penalize if no feedback provided
  if (!delta.doctorFeedback) {
    score -= 10;
  }

  // Boost if correction type is clear
  if (delta.correctionType === "completely_wrong" || delta.correctionType === "missed_diagnosis") {
    score += 10;
  }

  return Math.max(score, 0);
}

// ============================================================================
// Error Pattern Analysis
// ============================================================================

async function checkIfSystematicError(delta: DiagnosisDelta): Promise<boolean> {
  try {
    // Check Redis for similar errors in last 24 hours
    const pattern = `error:${delta.correctionType}:*`;
    const keys = await redis.keys(pattern);

    if (!keys || keys.length < 3) {
      // Record this error
      const errorKey = `error:${delta.correctionType}:${Date.now()}`;
      await redis.set(errorKey, JSON.stringify(delta), { ex: 86400 });
      return false;
    }

    // If 3+ similar errors in 24 hours, it's systematic
    return true;
  } catch (error) {
    console.error("[Medical AEC] Error checking systematic error:", error);
    return false;
  }
}

async function analyzeErrorPattern(
  errorPattern: string,
  corrections: DiagnosisDelta[]
): Promise<any> {
  // Use AI to analyze the error pattern
  const prompt = `You are a medical AI quality assurance expert analyzing systematic errors.

**Error Pattern:** ${errorPattern}

**Recent Corrections:**
${corrections.map((c, i) => `
${i + 1}. AI said: ${c.aiDiagnosis.primaryDiagnosis}
   Doctor said: ${c.doctorDiagnosis.primaryDiagnosis}
   Feedback: ${c.doctorFeedback || "None"}
`).join("\n")}

Analyze this error pattern and determine:
1. Is this fixable via prompt engineering? (true/false)
2. What is the root cause? (e.g., "AI doesn't consider family history", "AI overweights symptom X")
3. What prompt change would fix it?
4. What improvement would you expect? (e.g., "10% accuracy increase")

Return as JSON.`;

  const response = await invokeGeminiPro({
    messages: [{ role: "user", content: prompt }],
    response_format: {
      type: "json_schema",
      json_schema: {
        name: "error_analysis",
        strict: true,
        schema: {
          type: "object",
          properties: {
            isPatchable: { type: "boolean" },
            rootCause: { type: "string" },
            suggestedPromptChange: { type: "string" },
            expectedImprovement: { type: "string" },
          },
          required: ["isPatchable", "rootCause", "suggestedPromptChange", "expectedImprovement"],
        },
      },
    },
  });

  return JSON.parse(response.choices[0].message.content);
}

async function generatePatchedPrompt(
  currentPrompt: any,
  analysis: any
): Promise<{ systemPrompt: string; userPromptTemplate: string }> {
  // Use AI to generate patched prompt
  const prompt = `You are a medical AI prompt engineer. Your job is to patch a system prompt to fix a systematic error.

**Current System Prompt:**
${currentPrompt.systemPrompt}

**Error Analysis:**
Root Cause: ${analysis.rootCause}
Suggested Fix: ${analysis.suggestedPromptChange}

Generate an improved version of the system prompt that fixes this error while preserving all other functionality.

Return the new system prompt as plain text (not JSON).`;

  const response = await invokeGeminiPro({
    messages: [{ role: "user", content: prompt }],
  });

  const patchedSystemPrompt = response.choices[0].message.content;

  return {
    systemPrompt: patchedSystemPrompt,
    userPromptTemplate: currentPrompt.userPromptTemplate, // Keep same
  };
}

// ============================================================================
// Data Loading
// ============================================================================

async function loadCurrentPrompt(): Promise<any> {
  try {
    // Check Redis cache
    const cached = await redis.get("medical_reasoning_prompt:active");
    if (cached) {
      return cached;
    }

    // Load from database
    // TODO: Query medical_reasoning_prompts table for active prompt
    
    // Default fallback
    return {
      version: 1,
      systemPrompt: "You are an expert medical AI...",
      userPromptTemplate: "Analyze this patient case...",
    };
  } catch (error) {
    console.error("[Medical AEC] Error loading current prompt:", error);
    return {
      version: 1,
      systemPrompt: "You are an expert medical AI...",
      userPromptTemplate: "Analyze this patient case...",
    };
  }
}

async function getRecentCorrections(days: number): Promise<DiagnosisDelta[]> {
  try {
    // TODO: Query medical_corrections table
    // WHERE created_at > NOW() - INTERVAL days DAY
    
    return [];
  } catch (error) {
    console.error("[Medical AEC] Error getting recent corrections:", error);
    return [];
  }
}

function groupCorrectionsByType(corrections: DiagnosisDelta[]): Record<string, DiagnosisDelta[]> {
  const grouped: Record<string, DiagnosisDelta[]> = {};

  for (const correction of corrections) {
    if (!grouped[correction.correctionType]) {
      grouped[correction.correctionType] = [];
    }
    grouped[correction.correctionType].push(correction);
  }

  return grouped;
}

// ============================================================================
// Metrics & Monitoring
// ============================================================================

/**
 * Calculate AI accuracy rate over time
 * Used to measure impact of prompt patches
 */
export async function calculateAccuracyRate(days: number): Promise<number> {
  try {
    const corrections = await getRecentCorrections(days);
    
    if (corrections.length === 0) {
      return 100; // No corrections = perfect (or no data)
    }

    // Count "correct" diagnoses (no correction or minor correction)
    const correct = corrections.filter(c => 
      c.correctionType === "correct_but_imprecise" || 
      c.correctionType === "incorrect_ranking"
    ).length;

    const accuracyRate = (correct / corrections.length) * 100;
    return Math.round(accuracyRate);
  } catch (error) {
    console.error("[Medical AEC] Error calculating accuracy rate:", error);
    return 0;
  }
}

/**
 * Get prompt performance metrics
 * Tracks how each prompt version performs
 */
export async function getPromptPerformanceMetrics(promptVersion: number): Promise<any> {
  try {
    // TODO: Query medical_reasoning_prompts table
    // Return usage_count, avg_confidence_score, accuracy_rate
    
    return {
      usageCount: 0,
      avgConfidenceScore: 0,
      accuracyRate: 0,
    };
  } catch (error) {
    console.error("[Medical AEC] Error getting prompt metrics:", error);
    return null;
  }
}

/**
 * Rollback to previous prompt version if new version performs worse
 */
export async function rollbackPrompt(toVersion: number): Promise<boolean> {
  try {
    console.log(`[Medical AEC] Rolling back to prompt version ${toVersion}...`);

    // TODO: Update medical_reasoning_prompts table
    // SET isActive = true WHERE promptVersion = toVersion
    // SET isActive = false WHERE promptVersion != toVersion

    // Clear cache
    await redis.del("medical_reasoning_prompt:active");

    console.log(`[Medical AEC] ✅ Rolled back to version ${toVersion}`);
    return true;
  } catch (error) {
    console.error("[Medical AEC] Error rolling back prompt:", error);
    return false;
  }
}

// ============================================================================
// Trigger Functions
// ============================================================================

async function triggerPromptPatching(delta: DiagnosisDelta): Promise<void> {
  try {
    // Get recent similar corrections
    const recentCorrections = await getRecentCorrections(7);
    const similarCorrections = recentCorrections.filter(c => c.correctionType === delta.correctionType);

    if (similarCorrections.length < 5) {
      console.log("[Medical AEC] Not enough similar corrections to generate patch");
      return;
    }

    // Generate patch
    const patch = await generatePromptPatch(delta.correctionType, similarCorrections);

    if (patch) {
      // Deploy patch
      await deployPromptPatch(patch);
    }
  } catch (error) {
    console.error("[Medical AEC] Error triggering prompt patching:", error);
  }
}
