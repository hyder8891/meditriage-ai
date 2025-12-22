/**
 * Avicenna-X Orchestration Engine
 * 
 * The core "Predictive Health Graph" algorithm that transforms MediTriage
 * from a passive tool into an active health operating system.
 * 
 * Named after Ibn Sina (Avicenna), the father of modern medicine.
 */

import { getDb } from "../db";
import { Redis } from "@upstash/redis";
import { invokeGeminiPro, invokeGeminiFlash } from "../_core/gemini-dual";
import type { User } from "../../drizzle/schema";

// Initialize Redis for epidemiology tracking
// Convert rediss:// to https:// for Upstash SDK
const redisUrl = process.env.REDIS_URL!.replace('rediss://', 'https://').replace(':6379', '');
const redis = new Redis({
  url: redisUrl,
  token: process.env.REDIS_TOKEN!,
});

// ============================================================================
// Types
// ============================================================================

export interface SymptomInput {
  text?: string;
  audioUrl?: string;
  symptoms?: string[];
  severity?: number; // 1-10
  vitals?: {
    heartRate?: number;
    bloodPressure?: string;
    temperature?: number;
    oxygenSaturation?: number;
  };
}

export interface ContextVector {
  userId: number;
  symptomSeverity: number;
  medicalHistory: string;
  environmentalFactors: {
    barometricPressure?: number;
    temperature?: number;
    location?: { city: string; lat: number; lng: number };
  };
  financialConstraints: {
    budgetFilterClicked?: boolean;
    selectedPriceRange?: string;
  };
  wearableData?: {
    heartRate?: number;
    heartRateVariability?: number;
  };
}

export interface LocalRisk {
  disease: string;
  caseCount: number;
  riskLevel: "low" | "moderate" | "high" | "critical";
  growthRate: number;
}

export interface HybridDiagnosis {
  primaryDiagnosis: string;
  confidence: number;
  differentialDiagnoses: Array<{
    diagnosis: string;
    probability: number;
  }>;
  severity: "LOW" | "MODERATE" | "HIGH" | "EMERGENCY";
  guardrailsTriggered: string[];
  reasoning: string[];
  localRisksConsidered: string[];
}

export interface ResourceMatch {
  resourceId: number;
  resourceType: "doctor" | "clinic" | "emergency";
  score: number;
  scoreBreakdown: {
    skillMatch: number;
    proximity: number;
    priceAdherence: number;
    networkQuality: number;
  };
  metadata: {
    name?: string;
    specialty?: string;
    location?: string;
    estimatedWaitTime?: number;
    connectionQuality?: string;
  };
}

export interface OrchestrationResult {
  action: "NAVIGATE_TO_CLINIC" | "CONNECT_SOCKET" | "EMERGENCY_BYPASS" | "SELF_CARE";
  target?: ResourceMatch;
  diagnosis: HybridDiagnosis;
  contextVector: ContextVector;
  executionMetrics: {
    contextGatheringMs: number;
    epidemiologyCheckMs: number;
    hybridDiagnosisMs: number;
    resourceOrchestrationMs: number;
    totalExecutionMs: number;
  };
  deepLinks?: {
    uberLink?: string;
    careemLink?: string;
    googleMapsLink?: string;
  };
}

// ============================================================================
// MAIN ORCHESTRATOR
// ============================================================================

/**
 * The Avicenna-X Loop
 * 
 * Executes the 4-phase orchestration:
 * 1. SENSE - Gather context (symptoms + history + environment + social)
 * 2. LOCAL - Check epidemiology (disease spikes in user's city)
 * 3. THINK - Hybrid diagnosis (symbolic guardrails + neural AI + Bayesian update)
 * 4. ACT - Resource orchestration (find best doctor/clinic with network quality)
 */
export async function executeAvicennaLoop(
  userId: number,
  input: SymptomInput
): Promise<OrchestrationResult> {
  const startTime = Date.now();
  const metrics = {
    contextGatheringMs: 0,
    epidemiologyCheckMs: 0,
    hybridDiagnosisMs: 0,
    resourceOrchestrationMs: 0,
    totalExecutionMs: 0,
  };

  try {
    // ========================================================================
    // PHASE 1: SENSE - Gather Context
    // ========================================================================
    const contextStart = Date.now();
    const contextVector = await gatherContext(userId, input);
    metrics.contextGatheringMs = Date.now() - contextStart;

    // ========================================================================
    // PHASE 2: LOCAL - Check Epidemiology
    // ========================================================================
    const epidemiologyStart = Date.now();
    const localRisks = await checkEpidemiology(contextVector.environmentalFactors.location?.city || "Baghdad");
    metrics.epidemiologyCheckMs = Date.now() - epidemiologyStart;

    // ========================================================================
    // PHASE 3: THINK - Hybrid Diagnosis
    // ========================================================================
    const diagnosisStart = Date.now();
    const diagnosis = await generateHybridDiagnosis(contextVector, localRisks, input);
    metrics.hybridDiagnosisMs = Date.now() - diagnosisStart;

    // ========================================================================
    // PHASE 4: ACT - Resource Orchestration
    // ========================================================================
    const orchestrationStart = Date.now();
    const action = await orchestrateResources(diagnosis, contextVector);
    metrics.resourceOrchestrationMs = Date.now() - orchestrationStart;

    metrics.totalExecutionMs = Date.now() - startTime;

    // Log execution
    await logOrchestration(userId, action, diagnosis, contextVector, metrics);

    return {
      ...action,
      diagnosis,
      contextVector,
      executionMetrics: metrics,
    };
  } catch (error) {
    console.error("[Avicenna-X] Orchestration failed:", error);
    throw error;
  }
}

// ============================================================================
// PHASE 1: Context Gathering (SENSE)
// ============================================================================

async function gatherContext(userId: number, input: SymptomInput): Promise<ContextVector> {
  // Parallel data fetching for speed
  const [user, medicalHistory, labReports, geolocation, financialPrefs] = await Promise.all([
    db.query.users.findFirst({ where: (users, { eq }) => eq(users.id, userId) }),
    fetchMedicalHistory(userId),
    fetchRecentLabReports(userId),
    fetchGeolocation(userId),
    fetchFinancialPreferences(userId),
  ]);

  // Calculate symptom severity
  const symptomSeverity = input.severity || calculateSeverity(input);

  // Build context vector
  const contextVector: ContextVector = {
    userId,
    symptomSeverity,
    medicalHistory: medicalHistory || "No significant medical history",
    environmentalFactors: {
      location: geolocation,
      // TODO: Add barometric pressure API integration
    },
    financialConstraints: financialPrefs,
    wearableData: {
      heartRate: input.vitals?.heartRate,
      // TODO: Add Apple Watch / wearable integration
    },
  };

  return contextVector;
}

async function fetchMedicalHistory(userId: number): Promise<string> {
  // Fetch from triage records and clinical cases
  const records = await db.query.triageRecords.findMany({
    where: (records, { eq }) => eq(records.userId, userId),
    orderBy: (records, { desc }) => [desc(records.createdAt)],
    limit: 5,
  });

  if (records.length === 0) return "";

  // Summarize key conditions
  const conditions = records.map(r => r.chiefComplaint).filter(Boolean);
  return conditions.join(", ");
}

async function fetchRecentLabReports(userId: number): Promise<any[]> {
  // TODO: Integrate with lab_reports table
  return [];
}

async function fetchGeolocation(userId: number): Promise<{ city: string; lat: number; lng: number } | undefined> {
  // Try Redis cache first
  const cached = await redis.get(`user:${userId}:geo`);
  if (cached) return cached as any;

  // Default to Baghdad if not available
  return { city: "Baghdad", lat: 33.3152, lng: 44.3661 };
}

async function fetchFinancialPreferences(userId: number): Promise<any> {
  // TODO: Track budget filter clicks in user_settings
  return {
    budgetFilterClicked: false,
    selectedPriceRange: "medium",
  };
}

function calculateSeverity(input: SymptomInput): number {
  // Simple heuristic based on vitals
  let severity = 5; // default moderate

  if (input.vitals) {
    if (input.vitals.heartRate && input.vitals.heartRate > 120) severity += 2;
    if (input.vitals.temperature && input.vitals.temperature > 38.5) severity += 1;
    if (input.vitals.oxygenSaturation && input.vitals.oxygenSaturation < 92) severity += 3;
  }

  return Math.min(severity, 10);
}

// ============================================================================
// PHASE 2: Epidemiology Check (LOCAL)
// ============================================================================

async function checkEpidemiology(city: string): Promise<LocalRisk[]> {
  // Check Redis for disease spikes
  const risksKey = `city:${city.toLowerCase()}:risks`;
  const risks = await redis.get(risksKey);

  if (risks) {
    return risks as LocalRisk[];
  }

  // If no data, return empty (background job will populate)
  return [];
}

// ============================================================================
// PHASE 3: Hybrid Diagnosis (THINK)
// ============================================================================

async function generateHybridDiagnosis(
  context: ContextVector,
  localRisks: LocalRisk[],
  input: SymptomInput
): Promise<HybridDiagnosis> {
  // Step A: Check symbolic guardrails first
  const guardrailsTriggered = await checkMedicalGuardrails(context, input);

  if (guardrailsTriggered.some(g => g.action.bypassAI)) {
    // EMERGENCY - bypass AI
    return {
      primaryDiagnosis: guardrailsTriggered[0].action.immediateAction || "Emergency condition detected",
      confidence: 100,
      differentialDiagnoses: [],
      severity: "EMERGENCY",
      guardrailsTriggered: guardrailsTriggered.map(g => g.ruleName),
      reasoning: ["Hard medical guardrail triggered - immediate action required"],
      localRisksConsidered: [],
    };
  }

  // Step B: Neural analysis with Gemini Pro
  const aiAnalysis = await analyzeWithAI(context, localRisks, input);

  // Step C: Bayesian update based on local epidemiology
  const updatedDiagnosis = applyBayesianUpdate(aiAnalysis, localRisks);

  return {
    ...updatedDiagnosis,
    guardrailsTriggered: guardrailsTriggered.map(g => g.ruleName),
    localRisksConsidered: localRisks.map(r => `${r.disease} (${r.caseCount} cases, ${r.riskLevel} risk)`),
  };
}

async function checkMedicalGuardrails(context: ContextVector, input: SymptomInput): Promise<any[]> {
  // TODO: Query medical_guardrails table and evaluate conditions
  const triggered = [];

  // Example: Heart rate > 120 AND chest pain
  if (input.vitals?.heartRate && input.vitals.heartRate > 120) {
    const hasChestPain = input.text?.toLowerCase().includes("chest pain") || 
                         input.symptoms?.some(s => s.toLowerCase().includes("chest"));
    
    if (hasChestPain) {
      triggered.push({
        ruleName: "CARDIAC_EMERGENCY",
        action: {
          bypassAI: true,
          urgencyLevel: "emergency",
          immediateAction: "Possible cardiac event - immediate medical attention required",
        },
      });
    }
  }

  return triggered;
}

async function analyzeWithAI(
  context: ContextVector,
  localRisks: LocalRisk[],
  input: SymptomInput
): Promise<HybridDiagnosis> {
  const prompt = `You are an expert medical AI analyzing a patient case.

**Patient Context:**
- Symptom Severity: ${context.symptomSeverity}/10
- Medical History: ${context.medicalHistory}
- Location: ${context.environmentalFactors.location?.city || "Unknown"}
- Vitals: ${JSON.stringify(input.vitals || {})}

**Current Symptoms:**
${input.text || input.symptoms?.join(", ") || "Not specified"}

**Local Disease Risks:**
${localRisks.map(r => `- ${r.disease}: ${r.caseCount} cases (${r.riskLevel} risk, ${r.growthRate}% growth)`).join("\n")}

Provide a structured diagnosis with:
1. Primary diagnosis
2. Confidence (0-100)
3. Top 3 differential diagnoses with probabilities
4. Severity level (LOW/MODERATE/HIGH/EMERGENCY)
5. Clinical reasoning

Return as JSON.`;

  const response = await invokeGeminiPro({
    messages: [{ role: "user", content: prompt }],
    response_format: {
      type: "json_schema",
      json_schema: {
        name: "diagnosis",
        strict: true,
        schema: {
          type: "object",
          properties: {
            primaryDiagnosis: { type: "string" },
            confidence: { type: "number" },
            differentialDiagnoses: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  diagnosis: { type: "string" },
                  probability: { type: "number" },
                },
                required: ["diagnosis", "probability"],
              },
            },
            severity: { type: "string", enum: ["LOW", "MODERATE", "HIGH", "EMERGENCY"] },
            reasoning: { type: "array", items: { type: "string" } },
          },
          required: ["primaryDiagnosis", "confidence", "differentialDiagnoses", "severity", "reasoning"],
        },
      },
    },
  });

  const result = JSON.parse(response.choices[0].message.content);
  
  return {
    ...result,
    guardrailsTriggered: [],
    localRisksConsidered: [],
  };
}

function applyBayesianUpdate(diagnosis: HybridDiagnosis, localRisks: LocalRisk[]): HybridDiagnosis {
  // Boost probabilities for diseases with local spikes
  const updatedDifferentials = diagnosis.differentialDiagnoses.map(diff => {
    const localRisk = localRisks.find(r => 
      r.disease.toLowerCase().includes(diff.diagnosis.toLowerCase()) ||
      diff.diagnosis.toLowerCase().includes(r.disease.toLowerCase())
    );

    if (localRisk && localRisk.riskLevel !== "low") {
      // Boost probability based on local risk
      const boost = localRisk.riskLevel === "critical" ? 0.3 : 
                    localRisk.riskLevel === "high" ? 0.2 : 0.1;
      
      return {
        ...diff,
        probability: Math.min(diff.probability + boost, 0.95),
      };
    }

    return diff;
  });

  // Re-sort by probability
  updatedDifferentials.sort((a, b) => b.probability - a.probability);

  return {
    ...diagnosis,
    differentialDiagnoses: updatedDifferentials,
  };
}

// ============================================================================
// PHASE 4: Resource Orchestration (ACT)
// ============================================================================

async function orchestrateResources(
  diagnosis: HybridDiagnosis,
  context: ContextVector
): Promise<Omit<OrchestrationResult, "diagnosis" | "contextVector" | "executionMetrics">> {
  if (diagnosis.severity === "EMERGENCY") {
    // Find nearest emergency facility
    const emergencyClinic = await findNearestEmergency(context.environmentalFactors.location);
    
    return {
      action: "EMERGENCY_BYPASS",
      target: emergencyClinic,
      deepLinks: emergencyClinic ? generateDeepLinks(emergencyClinic) : undefined,
    };
  }

  if (diagnosis.severity === "HIGH") {
    // Find best clinic with required equipment
    const clinic = await findBestClinic(diagnosis, context);
    
    return {
      action: "NAVIGATE_TO_CLINIC",
      target: clinic,
      deepLinks: clinic ? generateDeepLinks(clinic) : undefined,
    };
  }

  if (diagnosis.severity === "MODERATE") {
    // Find best telemedicine doctor
    const doctor = await findBestDoctor(diagnosis, context);
    
    return {
      action: "CONNECT_SOCKET",
      target: doctor,
    };
  }

  // LOW severity - self-care
  return {
    action: "SELF_CARE",
  };
}

async function findNearestEmergency(location?: { city: string; lat: number; lng: number }): Promise<ResourceMatch | undefined> {
  // TODO: Query clinics with emergency capability, sort by distance
  return undefined;
}

async function findBestClinic(diagnosis: HybridDiagnosis, context: ContextVector): Promise<ResourceMatch | undefined> {
  // TODO: Implement resource auction algorithm
  // Score = (Equipment_Match * 0.4) + (Proximity * 0.3) + (Price * 0.2) + (Network * 0.1)
  return undefined;
}

async function findBestDoctor(diagnosis: HybridDiagnosis, context: ContextVector): Promise<ResourceMatch | undefined> {
  // TODO: Implement doctor scoring algorithm
  // Score = (Skill_Match * 0.4) + (Proximity * 0.3) + (Price * 0.2) + (Network * 0.1)
  // Prioritize doctors with good connection quality from socket metrics
  return undefined;
}

function generateDeepLinks(resource: ResourceMatch): any {
  // TODO: Generate Uber/Careem/Google Maps deep links
  return {};
}

// ============================================================================
// Logging
// ============================================================================

async function logOrchestration(
  userId: number,
  action: any,
  diagnosis: HybridDiagnosis,
  context: ContextVector,
  metrics: any
): Promise<void> {
  // TODO: Insert into orchestration_logs table
  console.log("[Avicenna-X] Orchestration complete:", {
    userId,
    action: action.action,
    diagnosis: diagnosis.primaryDiagnosis,
    severity: diagnosis.severity,
    totalMs: metrics.totalExecutionMs,
  });
}
