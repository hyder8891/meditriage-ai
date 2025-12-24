// @ts-nocheck
/**
 * Avicenna-X Orchestration Engine
 * 
 * The core "Predictive Health Graph" algorithm that transforms My Doctor
 * from a passive tool into an active health operating system.
 * 
 * Named after Ibn Sina (Avicenna), the father of modern medicine.
 */

import { getDb } from "../db";
import { Redis } from "@upstash/redis";
import { invokeGeminiPro, invokeGeminiFlash } from "../_core/gemini-dual";
import type { User } from "../../drizzle/schema";
import { medicalGuardrails } from "../../drizzle/avicenna-schema";
import { eq } from "drizzle-orm";
import { routeToEmergencyClinic, type EmergencyRoute } from "./emergency-routing";
import { getLabContextForDiagnosis } from "./lab-integration";

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
    pressureChange?: {
      velocity: number;
      trend: "rising" | "falling" | "stable";
      change1h?: number;
      change3h?: number;
      change24h?: number;
    };
    pressureAlerts?: Array<{
      type: "rapid_drop" | "rapid_rise" | "extreme_low" | "extreme_high";
      severity: "low" | "moderate" | "high";
      message: string;
    }>;
    temperature?: number;
    location?: { city: string; lat: number; lng: number };
    // IRAQ-SPECIFIC: Air Quality Integration
    airQuality?: {
      aqi: number;
      category: "good" | "moderate" | "unhealthy_sensitive" | "unhealthy" | "very_unhealthy" | "hazardous";
      pm25: number;
      pm10: number;
      dominantPollutant: string;
      dataSource: string;
    };
    aqiAlerts?: Array<{
      type: "dust_storm" | "high_pm25" | "high_pm10" | "ozone_warning" | "general_pollution";
      severity: "low" | "medium" | "high" | "critical";
      title: string;
      message: string;
      healthRecommendations: string[];
      affectedGroups: string[];
    }>;
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
  emergencyRoute?: EmergencyRoute;
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
  const [user, medicalHistory, labContext, geolocation, financialPrefs, environmentalFactors] = await Promise.all([
    db.query.users.findFirst({ where: (users, { eq }) => eq(users.id, userId) }),
    fetchMedicalHistory(userId),
    fetchRecentLabReports(userId),
    fetchGeolocation(userId),
    fetchFinancialPreferences(userId),
    fetchEnvironmentalFactors(userId, geolocation),
  ]);

  // Combine medical history with lab context
  const enrichedHistory = medicalHistory
    ? `${medicalHistory}\n\n${labContext}`
    : labContext;

  // Calculate symptom severity
  const symptomSeverity = input.severity || calculateSeverity(input);

  // Build context vector
  const contextVector: ContextVector = {
    userId,
    symptomSeverity,
    medicalHistory: enrichedHistory || "No significant medical history",
    environmentalFactors: {
      ...environmentalFactors,
      location: geolocation,
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

async function fetchRecentLabReports(userId: number): Promise<string> {
  return await getLabContextForDiagnosis(userId);
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

async function fetchEnvironmentalFactors(
  userId: number,
  location?: { city: string; lat: number; lng: number }
): Promise<any> {
  try {
    if (!location) {
      return {};
    }

    const apiKey = process.env.OPENWEATHER_API_KEY;
    if (!apiKey) {
      return {};
    }

    // Fetch current weather
    const weatherUrl = `https://api.openweathermap.org/data/2.5/weather?lat=${location.lat}&lon=${location.lng}&appid=${apiKey}&units=metric`;
    const response = await fetch(weatherUrl, {
      signal: AbortSignal.timeout(3000),
    });

    if (!response.ok) {
      return {};
    }

    const weatherData = await response.json();
    const currentPressure = weatherData.main?.pressure || 1013;

    // Get pressure history and calculate changes
    const { getWeatherHistory } = await import("../db-weather");
    const { calculatePressureChange, detectPressureAlerts } = await import(
      "../services/weather-service"
    );

    const pressureHistory = await getWeatherHistory(
      location.lat,
      location.lng,
      24
    ).catch(() => []);

    let pressureChange = null;
    let pressureAlerts: any[] = [];

    if (pressureHistory.length > 0) {
      pressureChange = calculatePressureChange(currentPressure, pressureHistory);
      pressureAlerts = detectPressureAlerts(pressureChange);
    }

    // ========================================================================
    // IRAQ-SPECIFIC ENHANCEMENT: Air Quality Integration
    // ========================================================================
    // Fetch current air quality for Iraqi cities
    let airQualityData = null;
    let aqiAlerts: any[] = [];
    
    try {
      const { getCurrentAQI, getActiveAlerts, IRAQI_CITIES } = await import("../air-quality-service");
      
      // Map location to Iraqi city
      const iraqiCity = Object.keys(IRAQI_CITIES).find(
        city => location.city.toLowerCase().includes(city.toLowerCase())
      ) as any;
      
      if (iraqiCity) {
        const [aqiData, alerts] = await Promise.all([
          getCurrentAQI(iraqiCity).catch(() => null),
          getActiveAlerts(iraqiCity).catch(() => []),
        ]);
        
        if (aqiData) {
          airQualityData = {
            aqi: aqiData.aqi,
            category: aqiData.aqiCategory,
            pm25: parseFloat(aqiData.pm25 || "0"),
            pm10: parseFloat(aqiData.pm10 || "0"),
            dominantPollutant: aqiData.dominantPollutant,
            dataSource: aqiData.dataSource,
          };
        }
        
        if (alerts.length > 0) {
          aqiAlerts = alerts.map(alert => ({
            type: alert.alertType,
            severity: alert.severity,
            title: alert.title,
            message: alert.message,
            healthRecommendations: JSON.parse(alert.healthRecommendations),
            affectedGroups: JSON.parse(alert.affectedGroups),
          }));
        }
      }
    } catch (error) {
      console.error("[Orchestrator] Error fetching air quality:", error);
      // Continue without AQI data
    }

    return {
      barometricPressure: currentPressure,
      pressureChange: pressureChange
        ? {
            velocity: pressureChange.velocity,
            trend: pressureChange.trend,
            change1h: pressureChange.change1h,
            change3h: pressureChange.change3h,
            change24h: pressureChange.change24h,
          }
        : null,
      pressureAlerts: pressureAlerts.length > 0 ? pressureAlerts : null,
      temperature: weatherData.main?.temp,
      // NEW: Air quality data
      airQuality: airQualityData,
      aqiAlerts: aqiAlerts.length > 0 ? aqiAlerts : null,
    };
  } catch (error) {
    console.error("[Orchestrator] Error fetching environmental factors:", error);
    return {};
  }
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
  const triggered = [];

  try {
    // Query active medical guardrails from database, sorted by priority
    const guardrails = await db.query.medicalGuardrails.findMany({
      where: (guardrails, { eq }) => eq(guardrails.isActive, true),
      orderBy: (guardrails, { desc }) => [desc(guardrails.priority)],
    });

    // Evaluate each guardrail condition
    for (const guardrail of guardrails) {
      const condition = guardrail.condition as any;
      let conditionMet = false;

      // Vital sign threshold check
      if (condition.vitalSign && condition.operator && condition.threshold !== undefined) {
        const vitalValue = getVitalValue(input.vitals, condition.vitalSign);
        if (vitalValue !== null) {
          conditionMet = evaluateCondition(vitalValue, condition.operator, condition.threshold);
        }
      }

      // Symptom keyword check
      if (condition.symptomKeywords && condition.symptomKeywords.length > 0) {
        const text = (input.text || "").toLowerCase();
        const symptoms = (input.symptoms || []).map(s => s.toLowerCase());
        const allText = text + " " + symptoms.join(" ");

        const keywordMatches = condition.symptomKeywords.filter((keyword: string) =>
          allText.includes(keyword.toLowerCase())
        );

        const keywordConditionMet = condition.logicalOperator === "AND"
          ? keywordMatches.length === condition.symptomKeywords.length
          : keywordMatches.length > 0;

        // Combine with vital sign condition if both exist
        if (condition.vitalSign) {
          conditionMet = condition.logicalOperator === "AND"
            ? conditionMet && keywordConditionMet
            : conditionMet || keywordConditionMet;
        } else {
          conditionMet = keywordConditionMet;
        }
      }

      // If condition met, add to triggered list
      if (conditionMet) {
        triggered.push({
          ruleName: guardrail.ruleName,
          action: guardrail.action,
          ruleType: guardrail.ruleType,
        });

        // Update trigger count
        await db.update(medicalGuardrails)
          .set({ timesTriggered: guardrail.timesTriggered + 1 })
          .where(eq(medicalGuardrails.id, guardrail.id));

        // If emergency bypass, stop checking further rules
        if ((guardrail.action as any).bypassAI) {
          break;
        }
      }
    }
  } catch (error) {
    console.error("[Guardrails] Error checking medical guardrails:", error);
    // Fallback to hardcoded emergency rules
    if (input.vitals?.heartRate && input.vitals.heartRate > 120) {
      const hasChestPain = input.text?.toLowerCase().includes("chest pain") ||
                           input.symptoms?.some(s => s.toLowerCase().includes("chest"));

      if (hasChestPain) {
        triggered.push({
          ruleName: "CARDIAC_EMERGENCY_FALLBACK",
          action: {
            bypassAI: true,
            urgencyLevel: "emergency",
            immediateAction: "Possible cardiac event - immediate medical attention required",
          },
        });
      }
    }
  }

  return triggered;
}

// Helper: Get vital value by name
function getVitalValue(vitals: any, vitalName: string): number | null {
  if (!vitals) return null;
  const normalized = vitalName.toLowerCase().replace(/[_\s]/g, "");
  
  if (normalized === "heartrate") return vitals.heartRate || null;
  if (normalized === "temperature") return vitals.temperature || null;
  if (normalized === "oxygensaturation" || normalized === "spo2") return vitals.oxygenSaturation || null;
  if (normalized === "bloodpressure") {
    // Parse systolic from "120/80" format
    if (typeof vitals.bloodPressure === "string") {
      const systolic = parseInt(vitals.bloodPressure.split("/")[0]);
      return isNaN(systolic) ? null : systolic;
    }
  }
  
  return null;
}

// Helper: Evaluate condition operator
function evaluateCondition(value: number, operator: string, threshold: number): boolean {
  switch (operator) {
    case ">": return value > threshold;
    case "<": return value < threshold;
    case ">=": return value >= threshold;
    case "<=": return value <= threshold;
    case "=": return value === threshold;
    default: return false;
  }
}

async function analyzeWithAI(
  context: ContextVector,
  localRisks: LocalRisk[],
  input: SymptomInput
): Promise<HybridDiagnosis> {
  // ========================================================================
  // IRAQ-SPECIFIC ENHANCEMENT: Air Quality Context
  // ========================================================================
  let airQualityContext = "";
  const envFactors = context.environmentalFactors as any;
  
  if (envFactors.airQuality) {
    const aqi = envFactors.airQuality;
    airQualityContext = `\n**Air Quality (Iraq-Specific):**
- AQI: ${aqi.aqi} (${aqi.category})
- PM2.5: ${aqi.pm25} μg/m³
- PM10: ${aqi.pm10} μg/m³
- Dominant Pollutant: ${aqi.dominantPollutant}
- Data Source: ${aqi.dataSource}`;
    
    if (envFactors.aqiAlerts && envFactors.aqiAlerts.length > 0) {
      airQualityContext += `\n- Active Alerts: ${envFactors.aqiAlerts.map((a: any) => `${a.type} (${a.severity})`).join(", ")}`;
    }
    
    // Add clinical context for respiratory symptoms
    if (aqi.aqi > 100) {
      airQualityContext += `\n- CLINICAL NOTE: Poor air quality may exacerbate respiratory symptoms. Consider environmental triggers in differential diagnosis.`;
    }
    
    if (aqi.pm10 > 150 && aqi.pm25 > 50) {
      airQualityContext += `\n- DUST STORM DETECTED: High particulate matter consistent with Baghdad dust storms. Strongly consider dust-induced respiratory conditions.`;
    }
  }
  
  const prompt = `You are an expert medical AI analyzing a patient case in Iraq.

**Patient Context:**
- Symptom Severity: ${context.symptomSeverity}/10
- Medical History: ${context.medicalHistory}
- Location: ${context.environmentalFactors.location?.city || "Unknown"}
- Vitals: ${JSON.stringify(input.vitals || {})}
${airQualityContext}

**Current Symptoms:**
${input.text || input.symptoms?.join(", ") || "Not specified"}

**Local Disease Risks:**
${localRisks.map(r => `- ${r.disease}: ${r.caseCount} cases (${r.riskLevel} risk, ${r.growthRate}% growth)`).join("\n")}

**IRAQ-SPECIFIC CONSIDERATIONS:**
- Baghdad experiences frequent dust storms (especially spring/summer) causing respiratory issues
- High PM10/PM2.5 levels are common environmental triggers
- Consider air quality-related conditions for respiratory symptoms
- Seasonal patterns: Summer heat stress, winter pollution spikes

Provide a structured diagnosis with:
1. Primary diagnosis
2. Confidence (0-100)
3. Top 3 differential diagnoses with probabilities
4. Severity level (LOW/MODERATE/HIGH/EMERGENCY)
5. Clinical reasoning (include environmental factors if relevant)

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
    // Use emergency routing system
    const location = context.environmentalFactors.location;
    if (!location) {
      throw new Error("User location required for emergency routing");
    }

    const emergencyRoute = await routeToEmergencyClinic(
      { lat: location.lat, lng: location.lng },
      "EMERGENCY"
    );
    
    return {
      action: "EMERGENCY_BYPASS",
      target: {
        resourceId: emergencyRoute.clinic.id,
        resourceType: "emergency",
        score: emergencyRoute.urgencyScore,
        scoreBreakdown: {
          skillMatch: 100,
          proximity: 100 - (emergencyRoute.clinic.distance * 5),
          priceAdherence: 100,
          networkQuality: 100,
        },
        metadata: {
          name: emergencyRoute.clinic.name,
          location: emergencyRoute.clinic.location.address,
          estimatedWaitTime: emergencyRoute.clinic.currentWaitTime,
        },
      },
      deepLinks: {
        uberLink: emergencyRoute.transportOptions.uber?.deepLink,
        careemLink: emergencyRoute.transportOptions.careem?.deepLink,
        googleMapsLink: emergencyRoute.transportOptions.googleMaps.deepLink,
      },
      emergencyRoute,
    };
  }

  if (diagnosis.severity === "HIGH") {
    // Use emergency routing for HIGH severity too (non-emergency clinics)
    const location = context.environmentalFactors.location;
    if (!location) {
      throw new Error("User location required for clinic routing");
    }

    const emergencyRoute = await routeToEmergencyClinic(
      { lat: location.lat, lng: location.lng },
      "HIGH"
    );
    
    return {
      action: "NAVIGATE_TO_CLINIC",
      target: {
        resourceId: emergencyRoute.clinic.id,
        resourceType: "clinic",
        score: emergencyRoute.urgencyScore,
        scoreBreakdown: {
          skillMatch: 90,
          proximity: 100 - (emergencyRoute.clinic.distance * 5),
          priceAdherence: 80,
          networkQuality: 85,
        },
        metadata: {
          name: emergencyRoute.clinic.name,
          location: emergencyRoute.clinic.location.address,
          estimatedWaitTime: emergencyRoute.clinic.currentWaitTime,
        },
      },
      deepLinks: {
        uberLink: emergencyRoute.transportOptions.uber?.deepLink,
        careemLink: emergencyRoute.transportOptions.careem?.deepLink,
        googleMapsLink: emergencyRoute.transportOptions.googleMaps.deepLink,
      },
      emergencyRoute,
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
