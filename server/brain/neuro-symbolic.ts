// @ts-nocheck
/**
 * Neuro-Symbolic Triage Engine
 * 
 * Layer 2 of Avicenna-X: Hybrid reasoning system
 * Combines symbolic medical guardrails (hard rules) with neural AI (soft reasoning)
 * 
 * Architecture:
 * 1. Symbolic Layer: Check hard medical rules first (e.g., "HR > 120 + chest pain = emergency")
 * 2. Neural Layer: AI analysis with Gemini Pro for complex cases
 * 3. Bayesian Update: Adjust probabilities based on local epidemiology
 */

import { getDb } from "../db";

const db = await getDb();
import { Redis } from "@upstash/redis";
import { invokeGeminiPro, invokeGeminiFlash } from "../_core/gemini-dual";
import type { ContextVector, HybridDiagnosis, LocalRisk, SymptomInput } from "./orchestrator";

// Convert rediss:// to https:// for Upstash SDK
const redisUrl = process.env.REDIS_URL!.replace('rediss://', 'https://').replace(':6379', '');
const redis = new Redis({
  url: redisUrl,
  token: process.env.REDIS_TOKEN!,
});

// ============================================================================
// Types
// ============================================================================

interface MedicalGuardrail {
  id: number;
  ruleName: string;
  ruleDescription: string;
  ruleType: "emergency" | "critical" | "warning";
  condition: {
    vitalSign?: string;
    operator?: ">" | "<" | "=" | ">=" | "<=";
    threshold?: number;
    symptomKeywords?: string[];
    logicalOperator?: "AND" | "OR";
  };
  action: {
    urgencyLevel: "emergency" | "urgent" | "semi-urgent";
    bypassAI: boolean;
    immediateAction?: string;
    alertMessage?: string;
  };
  priority: number;
}

// ============================================================================
// Main Hybrid Diagnosis Function
// ============================================================================

export async function generateHybridDiagnosis(
  context: ContextVector,
  localRisks: LocalRisk[],
  input: SymptomInput
): Promise<HybridDiagnosis> {
  console.log(`[Neuro-Symbolic] Starting hybrid diagnosis for user ${context.userId}...`);

  // PHASE 1: Symbolic Layer - Check Medical Guardrails
  const guardrailsTriggered = await evaluateMedicalGuardrails(context, input);

  if (guardrailsTriggered.some(g => g.action.bypassAI)) {
    // EMERGENCY - bypass AI completely
    console.log(`[Neuro-Symbolic] Emergency guardrail triggered: ${guardrailsTriggered[0].ruleName}`);
    
    return {
      primaryDiagnosis: guardrailsTriggered[0].action.immediateAction || "Emergency condition detected",
      confidence: 100,
      differentialDiagnoses: [],
      severity: "EMERGENCY",
      guardrailsTriggered: guardrailsTriggered.map(g => g.ruleName),
      reasoning: [
        "Hard medical guardrail triggered - immediate action required",
        guardrailsTriggered[0].ruleDescription,
      ],
      localRisksConsidered: [],
    };
  }

  // PHASE 2: Neural Layer - AI Analysis
  const aiDiagnosis = await performNeuralAnalysis(context, localRisks, input, guardrailsTriggered);

  // PHASE 3: Bayesian Update - Adjust for Local Epidemiology
  const finalDiagnosis = applyBayesianUpdate(aiDiagnosis, localRisks);

  console.log(`[Neuro-Symbolic] Diagnosis complete: ${finalDiagnosis.primaryDiagnosis} (${finalDiagnosis.confidence}% confidence)`);

  return finalDiagnosis;
}

// ============================================================================
// PHASE 1: Symbolic Medical Guardrails
// ============================================================================

async function evaluateMedicalGuardrails(
  context: ContextVector,
  input: SymptomInput
): Promise<MedicalGuardrail[]> {
  const triggered: MedicalGuardrail[] = [];

  // Load guardrails from database (cached in Redis for speed)
  const guardrails = await loadMedicalGuardrails();

  // Evaluate each guardrail in priority order
  for (const guardrail of guardrails) {
    const isTriggered = evaluateGuardrailCondition(guardrail, context, input);
    
    if (isTriggered) {
      triggered.push(guardrail);
      console.log(`[Guardrail] Triggered: ${guardrail.ruleName}`);
      
      // Increment trigger counter
      await incrementGuardrailCounter(guardrail.id);
    }
  }

  return triggered;
}

async function loadMedicalGuardrails(): Promise<MedicalGuardrail[]> {
  try {
    // Check Redis cache first
    const cached = await redis.get("medical_guardrails:active");
    if (cached && Array.isArray(cached)) {
      return cached as MedicalGuardrail[];
    }

    // Load from database
    const guardrails = await db.query.medicalGuardrails.findMany({
      where: (g, { eq }) => eq(g.isActive, true),
      orderBy: (g, { desc }) => [desc(g.priority)],
    });

    // Cache for 1 hour
    await redis.set("medical_guardrails:active", JSON.stringify(guardrails), { ex: 3600 });

    return guardrails as any[];
  } catch (error) {
    console.error("[Guardrails] Error loading guardrails:", error);
    // Return hardcoded emergency rules as fallback
    return getHardcodedGuardrails();
  }
}

function evaluateGuardrailCondition(
  guardrail: MedicalGuardrail,
  context: ContextVector,
  input: SymptomInput
): boolean {
  const { condition } = guardrail;

  // Vital sign check
  if (condition.vitalSign && condition.operator && condition.threshold) {
    const vitalValue = getVitalValue(input, condition.vitalSign);
    if (vitalValue !== undefined) {
      const meetsVitalCondition = evaluateOperator(vitalValue, condition.operator, condition.threshold);
      
      // If no symptom keywords, vital alone is enough
      if (!condition.symptomKeywords || condition.symptomKeywords.length === 0) {
        return meetsVitalCondition;
      }

      // Check symptom keywords
      const hasKeywords = checkSymptomKeywords(input, condition.symptomKeywords, condition.logicalOperator);
      
      // Combine vital + symptoms based on logical operator
      if (condition.logicalOperator === "AND") {
        return meetsVitalCondition && hasKeywords;
      } else {
        return meetsVitalCondition || hasKeywords;
      }
    }
  }

  // Symptom keyword check only
  if (condition.symptomKeywords && condition.symptomKeywords.length > 0) {
    return checkSymptomKeywords(input, condition.symptomKeywords, condition.logicalOperator);
  }

  return false;
}

function getVitalValue(input: SymptomInput, vitalSign: string): number | undefined {
  if (!input.vitals) return undefined;

  switch (vitalSign.toLowerCase()) {
    case "heartrate":
    case "heart_rate":
      return input.vitals.heartRate;
    case "temperature":
      return input.vitals.temperature;
    case "oxygensaturation":
    case "oxygen_saturation":
    case "spo2":
      return input.vitals.oxygenSaturation;
    case "systolic":
      if (input.vitals.bloodPressure) {
        const [systolic] = input.vitals.bloodPressure.split("/").map(Number);
        return systolic;
      }
      return undefined;
    case "diastolic":
      if (input.vitals.bloodPressure) {
        const [, diastolic] = input.vitals.bloodPressure.split("/").map(Number);
        return diastolic;
      }
      return undefined;
    default:
      return undefined;
  }
}

function evaluateOperator(value: number, operator: string, threshold: number): boolean {
  switch (operator) {
    case ">": return value > threshold;
    case "<": return value < threshold;
    case ">=": return value >= threshold;
    case "<=": return value <= threshold;
    case "=": return value === threshold;
    default: return false;
  }
}

function checkSymptomKeywords(
  input: SymptomInput,
  keywords: string[],
  logicalOperator: "AND" | "OR" = "OR"
): boolean {
  const text = (input.text || "").toLowerCase();
  const symptoms = (input.symptoms || []).map(s => s.toLowerCase());
  const allText = [text, ...symptoms].join(" ");

  if (logicalOperator === "AND") {
    return keywords.every(keyword => allText.includes(keyword.toLowerCase()));
  } else {
    return keywords.some(keyword => allText.includes(keyword.toLowerCase()));
  }
}

async function incrementGuardrailCounter(guardrailId: number): Promise<void> {
  try {
    // TODO: Increment times_triggered in database
    // For now, just log
    console.log(`[Guardrails] Incremented counter for guardrail ${guardrailId}`);
  } catch (error) {
    console.error("[Guardrails] Error incrementing counter:", error);
  }
}

// ============================================================================
// Hardcoded Emergency Guardrails (Fallback)
// ============================================================================

function getHardcodedGuardrails(): MedicalGuardrail[] {
  return [
    {
      id: 1,
      ruleName: "CARDIAC_EMERGENCY",
      ruleDescription: "High heart rate with chest pain indicates possible cardiac event",
      ruleType: "emergency",
      condition: {
        vitalSign: "heartRate",
        operator: ">",
        threshold: 120,
        symptomKeywords: ["chest pain", "chest pressure", "chest tightness"],
        logicalOperator: "AND",
      },
      action: {
        urgencyLevel: "emergency",
        bypassAI: true,
        immediateAction: "Possible cardiac event - call emergency services immediately",
        alertMessage: "EMERGENCY: Seek immediate medical attention",
      },
      priority: 100,
    },
    {
      id: 2,
      ruleName: "RESPIRATORY_DISTRESS",
      ruleDescription: "Low oxygen saturation indicates respiratory emergency",
      ruleType: "emergency",
      condition: {
        vitalSign: "oxygenSaturation",
        operator: "<",
        threshold: 90,
      },
      action: {
        urgencyLevel: "emergency",
        bypassAI: true,
        immediateAction: "Severe respiratory distress - immediate medical attention required",
        alertMessage: "EMERGENCY: Oxygen levels critically low",
      },
      priority: 100,
    },
    {
      id: 3,
      ruleName: "STROKE_SYMPTOMS",
      ruleDescription: "FAST symptoms indicate possible stroke",
      ruleType: "emergency",
      condition: {
        symptomKeywords: ["face drooping", "arm weakness", "speech difficulty", "slurred speech"],
        logicalOperator: "OR",
      },
      action: {
        urgencyLevel: "emergency",
        bypassAI: true,
        immediateAction: "Possible stroke - call emergency services immediately",
        alertMessage: "EMERGENCY: Time-critical condition",
      },
      priority: 100,
    },
    {
      id: 4,
      ruleName: "SEVERE_BLEEDING",
      ruleDescription: "Uncontrolled bleeding requires immediate intervention",
      ruleType: "emergency",
      condition: {
        symptomKeywords: ["bleeding heavily", "can't stop bleeding", "severe bleeding", "blood loss"],
        logicalOperator: "OR",
      },
      action: {
        urgencyLevel: "emergency",
        bypassAI: true,
        immediateAction: "Severe bleeding - apply pressure and call emergency services",
        alertMessage: "EMERGENCY: Uncontrolled bleeding",
      },
      priority: 100,
    },
    {
      id: 5,
      ruleName: "HIGH_FEVER_WITH_CONFUSION",
      ruleDescription: "High fever with altered mental status may indicate sepsis or meningitis",
      ruleType: "emergency",
      condition: {
        vitalSign: "temperature",
        operator: ">",
        threshold: 39.5,
        symptomKeywords: ["confused", "disoriented", "not making sense", "altered mental status"],
        logicalOperator: "AND",
      },
      action: {
        urgencyLevel: "emergency",
        bypassAI: true,
        immediateAction: "Possible sepsis or meningitis - seek immediate medical attention",
        alertMessage: "EMERGENCY: High fever with altered consciousness",
      },
      priority: 95,
    },
  ];
}

// ============================================================================
// PHASE 2: Neural Analysis with Gemini Pro
// ============================================================================

async function performNeuralAnalysis(
  context: ContextVector,
  localRisks: LocalRisk[],
  input: SymptomInput,
  guardrailsTriggered: MedicalGuardrail[]
): Promise<HybridDiagnosis> {
  // Load active medical reasoning prompt from database
  const prompt = await loadActiveReasoningPrompt();

  // Build context for AI
  const systemPrompt = prompt.systemPrompt || getDefaultSystemPrompt();
  const userPrompt = buildUserPrompt(context, localRisks, input, guardrailsTriggered);

  // Invoke Gemini Pro with structured output
  const response = await invokeGeminiPro({
    messages: [
      { role: "system", content: systemPrompt },
      { role: "user", content: userPrompt },
    ],
    response_format: {
      type: "json_schema",
      json_schema: {
        name: "medical_diagnosis",
        strict: true,
        schema: {
          type: "object",
          properties: {
            primaryDiagnosis: { type: "string" },
            confidence: { type: "number", minimum: 0, maximum: 100 },
            differentialDiagnoses: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  diagnosis: { type: "string" },
                  probability: { type: "number", minimum: 0, maximum: 1 },
                },
                required: ["diagnosis", "probability"],
              },
            },
            severity: { type: "string", enum: ["LOW", "MODERATE", "HIGH", "EMERGENCY"] },
            reasoning: { type: "array", items: { type: "string" } },
          },
          required: ["primaryDiagnosis", "confidence", "differentialDiagnoses", "severity", "reasoning"],
          additionalProperties: false,
        },
      },
    },
  });

  const result = JSON.parse(response.choices[0].message.content);

  return {
    ...result,
    guardrailsTriggered: guardrailsTriggered.map(g => g.ruleName),
    localRisksConsidered: [],
  };
}

async function loadActiveReasoningPrompt(): Promise<any> {
  try {
    // TODO: Query medical_reasoning_prompts table for active prompt
    return {
      systemPrompt: getDefaultSystemPrompt(),
      temperature: 0.7,
      maxTokens: 2000,
    };
  } catch (error) {
    console.error("[Neural] Error loading reasoning prompt:", error);
    return {
      systemPrompt: getDefaultSystemPrompt(),
      temperature: 0.7,
      maxTokens: 2000,
    };
  }
}

function getDefaultSystemPrompt(): string {
  return `You are an expert medical AI trained to analyze patient symptoms and provide differential diagnoses.

Your role is to:
1. Analyze patient symptoms, vitals, and medical history
2. Consider local disease prevalence and epidemiology
3. Generate a primary diagnosis with confidence score
4. Provide top 3 differential diagnoses with probabilities
5. Assess severity level (LOW/MODERATE/HIGH/EMERGENCY)
6. Explain your clinical reasoning step-by-step

Important guidelines:
- Be conservative with confidence scores - medical diagnosis is uncertain
- Always consider red flags and emergency conditions
- Factor in local disease outbreaks when relevant
- Explain your reasoning clearly for transparency
- Use evidence-based medicine principles

You are assisting triage, not replacing a doctor. Your goal is to help patients understand urgency and next steps.`;
}

function buildUserPrompt(
  context: ContextVector,
  localRisks: LocalRisk[],
  input: SymptomInput,
  guardrailsTriggered: MedicalGuardrail[]
): string {
  const parts = [];

  // Patient context
  parts.push("**PATIENT CONTEXT:**");
  parts.push(`- Symptom Severity: ${context.symptomSeverity}/10`);
  parts.push(`- Medical History: ${context.medicalHistory}`);
  parts.push(`- Location: ${context.environmentalFactors.location?.city || "Unknown"}`);
  
  if (context.wearableData) {
    parts.push(`- Wearable Data: HR ${context.wearableData.heartRate || "N/A"}, HRV ${context.wearableData.heartRateVariability || "N/A"}`);
  }

  // Current symptoms
  parts.push("\n**CURRENT SYMPTOMS:**");
  if (input.text) {
    parts.push(input.text);
  }
  if (input.symptoms && input.symptoms.length > 0) {
    parts.push(`Reported symptoms: ${input.symptoms.join(", ")}`);
  }

  // Vitals
  if (input.vitals) {
    parts.push("\n**VITAL SIGNS:**");
    if (input.vitals.heartRate) parts.push(`- Heart Rate: ${input.vitals.heartRate} bpm`);
    if (input.vitals.bloodPressure) parts.push(`- Blood Pressure: ${input.vitals.bloodPressure} mmHg`);
    if (input.vitals.temperature) parts.push(`- Temperature: ${input.vitals.temperature}°C`);
    if (input.vitals.oxygenSaturation) parts.push(`- Oxygen Saturation: ${input.vitals.oxygenSaturation}%`);
  }

  // Local disease risks
  if (localRisks.length > 0) {
    parts.push("\n**LOCAL DISEASE RISKS:**");
    for (const risk of localRisks) {
      parts.push(`- ${risk.disease}: ${risk.caseCount} cases (${risk.riskLevel} risk, ${risk.growthRate}% growth rate)`);
    }
  }

  // Guardrails triggered (non-emergency)
  if (guardrailsTriggered.length > 0) {
    parts.push("\n**CLINICAL ALERTS:**");
    for (const guardrail of guardrailsTriggered) {
      parts.push(`- ${guardrail.ruleDescription}`);
    }
  }

  parts.push("\n**TASK:**");
  parts.push("Provide a structured medical assessment with primary diagnosis, differential diagnoses, severity level, and clinical reasoning.");

  return parts.join("\n");
}

// ============================================================================
// PHASE 3: Bayesian Update for Local Epidemiology
// ============================================================================

function applyBayesianUpdate(diagnosis: HybridDiagnosis, localRisks: LocalRisk[]): HybridDiagnosis {
  if (localRisks.length === 0) {
    return diagnosis;
  }

  console.log(`[Bayesian] Updating probabilities based on ${localRisks.length} local risks...`);

  // Boost probabilities for diseases with local spikes
  const updatedDifferentials = diagnosis.differentialDiagnoses.map(diff => {
    const matchingRisk = localRisks.find(risk =>
      risk.disease.toLowerCase().includes(diff.diagnosis.toLowerCase()) ||
      diff.diagnosis.toLowerCase().includes(risk.disease.toLowerCase())
    );

    if (matchingRisk && matchingRisk.riskLevel !== "low") {
      // Calculate boost based on risk level
      const boost = 
        matchingRisk.riskLevel === "critical" ? 0.3 :
        matchingRisk.riskLevel === "high" ? 0.2 :
        0.1;

      const newProbability = Math.min(diff.probability + boost, 0.95);
      
      console.log(`[Bayesian] Boosted ${diff.diagnosis}: ${diff.probability.toFixed(2)} → ${newProbability.toFixed(2)}`);

      return {
        ...diff,
        probability: newProbability,
      };
    }

    return diff;
  });

  // Re-sort by probability
  updatedDifferentials.sort((a, b) => b.probability - a.probability);

  // Check if primary diagnosis should change
  const topDifferential = updatedDifferentials[0];
  const shouldChangePrimary = topDifferential && topDifferential.probability > 0.7;

  return {
    ...diagnosis,
    primaryDiagnosis: shouldChangePrimary ? topDifferential.diagnosis : diagnosis.primaryDiagnosis,
    differentialDiagnoses: updatedDifferentials,
    localRisksConsidered: localRisks.map(r => `${r.disease} (${r.caseCount} cases, ${r.riskLevel} risk)`),
  };
}
