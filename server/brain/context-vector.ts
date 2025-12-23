// @ts-nocheck
/**
 * Context Vector Service
 * 
 * Layer 1 of Avicenna-X: Aggregates patient state into weighted vectors
 * Combines: symptoms + history + vitals + environment + social determinants
 */

import { getDb } from "../db";

const db = await getDb();
import { Redis } from "@upstash/redis";
import { invokeGeminiFlash } from "../_core/gemini-dual";
import type { SymptomInput, ContextVector } from "./orchestrator";

// Convert rediss:// to https:// for Upstash SDK
const redisUrl = process.env.REDIS_URL!.replace('rediss://', 'https://').replace(':6379', '');
const redis = new Redis({
  url: redisUrl,
  token: process.env.REDIS_TOKEN!,
});

// ============================================================================
// Context Aggregation
// ============================================================================

export async function buildContextVector(
  userId: number,
  input: SymptomInput
): Promise<ContextVector> {
  console.log(`[Context Vector] Building for user ${userId}...`);

  // Parallel data fetching for speed (<200ms target)
  const startTime = Date.now();
  
  const [
    medicalHistory,
    recentLabTrends,
    geolocation,
    financialPrefs,
    wearableData,
    environmentalData,
  ] = await Promise.all([
    fetchMedicalHistorySummary(userId),
    fetchLabTrends(userId),
    fetchUserGeolocation(userId),
    fetchFinancialConstraints(userId),
    fetchWearableData(userId),
    fetchEnvironmentalFactors(userId),
  ]);

  // Calculate symptom severity with multi-factor analysis
  const symptomSeverity = calculateSymptomSeverity(input, wearableData);

  const contextVector: ContextVector = {
    userId,
    symptomSeverity,
    medicalHistory,
    environmentalFactors: {
      ...environmentalData,
      location: geolocation,
    },
    financialConstraints: financialPrefs,
    wearableData,
  };

  const duration = Date.now() - startTime;
  console.log(`[Context Vector] Built in ${duration}ms`);

  // Store vector for future reference
  await storeContextVector(contextVector);

  return contextVector;
}

// ============================================================================
// Medical History Aggregation
// ============================================================================

async function fetchMedicalHistorySummary(userId: number): Promise<string> {
  try {
    // Fetch recent triage records
    const triageRecords = await db.query.triageRecords.findMany({
      where: (records, { eq }) => eq(records.userId, userId),
      orderBy: (records, { desc }) => [desc(records.createdAt)],
      limit: 10,
    });

    if (triageRecords.length === 0) {
      return "No significant medical history on record";
    }

    // Extract key conditions and symptoms
    const conditions = new Set<string>();
    const chronicSymptoms = new Set<string>();

    for (const record of triageRecords) {
      // Parse chief complaints
      if (record.chiefComplaint) {
        conditions.add(record.chiefComplaint);
      }

      // Parse symptoms
      try {
        const symptoms = JSON.parse(record.symptoms);
        if (Array.isArray(symptoms)) {
          symptoms.forEach(s => chronicSymptoms.add(s));
        }
      } catch (e) {
        // Skip invalid JSON
      }
    }

    // Build concise summary
    const conditionsList = Array.from(conditions).slice(0, 5).join(", ");
    const symptomsList = Array.from(chronicSymptoms).slice(0, 5).join(", ");

    return `Recent conditions: ${conditionsList}. Recurring symptoms: ${symptomsList}`;
  } catch (error) {
    console.error("[Context Vector] Error fetching medical history:", error);
    return "Unable to retrieve medical history";
  }
}

// ============================================================================
// Lab Trends Analysis
// ============================================================================

async function fetchLabTrends(userId: number): Promise<any> {
  try {
    // TODO: Query lab_reports and lab_results tables
    // Analyze trends: "Your iron is dropping fast", "Glucose trending up"
    
    return {
      trends: [],
      alerts: [],
    };
  } catch (error) {
    console.error("[Context Vector] Error fetching lab trends:", error);
    return { trends: [], alerts: [] };
  }
}

// ============================================================================
// Geolocation & Environmental Factors
// ============================================================================

async function fetchUserGeolocation(userId: number): Promise<{ city: string; lat: number; lng: number } | undefined> {
  try {
    // Check Redis cache first (updated by mobile app or browser geolocation)
    const cached = await redis.get(`user:${userId}:geo`);
    if (cached && typeof cached === "object") {
      return cached as any;
    }

    // Fallback to user profile city if available
    const user = await db.query.users.findFirst({
      where: (users, { eq }) => eq(users.id, userId),
    });

    // Default to Baghdad for Iraqi users
    return { city: "Baghdad", lat: 33.3152, lng: 44.3661 };
  } catch (error) {
    console.error("[Context Vector] Error fetching geolocation:", error);
    return { city: "Baghdad", lat: 33.3152, lng: 44.3661 };
  }
}

async function fetchEnvironmentalFactors(userId: number): Promise<any> {
  try {
    // Get user location first
    const location = await fetchUserGeolocation(userId);
    
    // Check if OpenWeather API key is configured
    const apiKey = process.env.OPENWEATHER_API_KEY;
    if (!apiKey) {
      console.warn("[Context Vector] OPENWEATHER_API_KEY not configured, using default values");
      return getDefaultEnvironmentalFactors();
    }

    // Fetch weather data from OpenWeatherMap API
    const weatherUrl = `https://api.openweathermap.org/data/2.5/weather?lat=${location.lat}&lon=${location.lng}&appid=${apiKey}&units=metric`;
    
    const response = await fetch(weatherUrl, {
      signal: AbortSignal.timeout(3000), // 3 second timeout
    });

    if (!response.ok) {
      console.warn(`[Context Vector] Weather API returned ${response.status}, using defaults`);
      return getDefaultEnvironmentalFactors();
    }

    const weatherData = await response.json();
    
    // Extract relevant environmental factors
    const environmentalFactors = {
      barometricPressure: weatherData.main?.pressure, // hPa
      temperature: weatherData.main?.temp, // Celsius
      humidity: weatherData.main?.humidity, // Percentage
      airQualityIndex: undefined, // Would need separate AQI API
      weatherCondition: weatherData.weather?.[0]?.main, // Clear, Clouds, Rain, etc.
      windSpeed: weatherData.wind?.speed, // m/s
    };

    console.log(`[Context Vector] Weather data fetched for ${location.city}: ${environmentalFactors.temperature}°C, ${environmentalFactors.humidity}% humidity`);
    
    return environmentalFactors;
  } catch (error) {
    // Graceful fallback - don't crash the AI if weather API is down
    console.error("[Context Vector] Error fetching environmental factors:", error);
    return getDefaultEnvironmentalFactors();
  }
}

// Default environmental factors for Baghdad (typical values)
function getDefaultEnvironmentalFactors() {
  return {
    barometricPressure: 1013, // Standard atmospheric pressure (hPa)
    temperature: 25, // Moderate temperature (Celsius)
    humidity: 40, // Typical humidity for Baghdad (%)
    airQualityIndex: undefined,
    weatherCondition: "Clear",
    windSpeed: 3, // Light breeze (m/s)
  };
}

// ============================================================================
// Financial Constraints Tracking
// ============================================================================

async function fetchFinancialConstraints(userId: number): Promise<any> {
  try {
    // Check if user has clicked "Budget" filter recently
    const budgetClicks = await redis.get(`user:${userId}:budget_filter_clicks`);
    
    // Check user subscription tier
    const subscription = await db.query.subscriptions.findFirst({
      where: (subs, { eq }) => eq(subs.userId, userId),
      orderBy: (subs, { desc }) => [desc(subs.createdAt)],
    });

    return {
      budgetFilterClicked: budgetClicks ? parseInt(budgetClicks as string) > 0 : false,
      selectedPriceRange: subscription?.tier || "free",
      insuranceStatus: "none", // TODO: Add insurance tracking
    };
  } catch (error) {
    console.error("[Context Vector] Error fetching financial constraints:", error);
    return {
      budgetFilterClicked: false,
      selectedPriceRange: "medium",
    };
  }
}

// ============================================================================
// Wearable Data Integration
// ============================================================================

async function fetchWearableData(userId: number): Promise<any> {
  try {
    // Import wearable integration service
    const { getRecentWearableData, getDailySummary } = await import("../avicenna/wearable-integration");
    
    // Get today's summary if available (pre-computed aggregates)
    const today = new Date();
    const dailySummary = await getDailySummary(userId, today);
    
    if (dailySummary.length > 0) {
      const summary = dailySummary[0];
      return {
        avgHeartRate: summary.avgHeartRate ? parseFloat(summary.avgHeartRate) : undefined,
        restingHeartRate: summary.restingHeartRate,
        avgHRV: summary.avgHRV ? parseFloat(summary.avgHRV) : undefined,
        totalSteps: summary.totalSteps,
        avgSleepDuration: summary.avgSleepDuration ? parseFloat(summary.avgSleepDuration) : undefined,
        avgBloodOxygen: summary.avgBloodOxygen ? parseFloat(summary.avgBloodOxygen) : undefined,
        anomalies: summary.anomalies ? JSON.parse(summary.anomalies) : [],
      };
    }
    
    // Fallback: Get recent data points (last 24 hours)
    const recentData = await getRecentWearableData(userId, 24);
    
    if (recentData.length === 0) {
      return undefined; // No wearable data available
    }
    
    // Compute basic aggregates from recent data
    const heartRateData = recentData.filter(d => d.metricType === "heart_rate");
    const stepsData = recentData.filter(d => d.metricType === "steps");
    const hrvData = recentData.filter(d => d.metricType === "hrv");
    const bloodOxygenData = recentData.filter(d => d.metricType === "blood_oxygen");
    
    return {
      avgHeartRate: heartRateData.length > 0
        ? heartRateData.reduce((sum, d) => sum + parseFloat(d.value), 0) / heartRateData.length
        : undefined,
      totalSteps: stepsData.length > 0
        ? Math.max(...stepsData.map(d => parseFloat(d.value)))
        : undefined,
      avgHRV: hrvData.length > 0
        ? hrvData.reduce((sum, d) => sum + parseFloat(d.value), 0) / hrvData.length
        : undefined,
      avgBloodOxygen: bloodOxygenData.length > 0
        ? bloodOxygenData.reduce((sum, d) => sum + parseFloat(d.value), 0) / bloodOxygenData.length
        : undefined,
      anomalies: [], // No anomaly detection on raw data
    };
  } catch (error) {
    console.error("[Context Vector] Error fetching wearable data:", error);
    return undefined;
  }
}

// ============================================================================
// Symptom Severity Calculation
// ============================================================================

function calculateSymptomSeverity(input: SymptomInput, wearableData?: any): number {
  let severity = input.severity || 5; // Default moderate

  // Adjust based on vitals
  if (input.vitals) {
    // Heart rate
    if (input.vitals.heartRate) {
      if (input.vitals.heartRate > 120) severity += 2;
      else if (input.vitals.heartRate < 50) severity += 2;
      else if (input.vitals.heartRate > 100) severity += 1;
    }

    // Temperature
    if (input.vitals.temperature) {
      if (input.vitals.temperature > 39.5) severity += 3; // Very high fever
      else if (input.vitals.temperature > 38.5) severity += 1;
      else if (input.vitals.temperature < 35.0) severity += 2; // Hypothermia
    }

    // Oxygen saturation
    if (input.vitals.oxygenSaturation) {
      if (input.vitals.oxygenSaturation < 90) severity += 3; // Critical
      else if (input.vitals.oxygenSaturation < 92) severity += 2;
      else if (input.vitals.oxygenSaturation < 95) severity += 1;
    }

    // Blood pressure
    if (input.vitals.bloodPressure) {
      const [systolic, diastolic] = input.vitals.bloodPressure.split("/").map(Number);
      if (systolic > 180 || diastolic > 120) severity += 3; // Hypertensive crisis
      else if (systolic < 90 || diastolic < 60) severity += 2; // Hypotension
    }
  }

  // Adjust based on wearable data (comprehensive health metrics)
  if (wearableData) {
    // Heart Rate Variability (HRV) - strong stress/illness indicator
    if (wearableData.avgHRV) {
      if (wearableData.avgHRV < 20) severity += 2; // Very low HRV = significant stress/illness
      else if (wearableData.avgHRV < 30) severity += 1; // Low HRV = moderate stress
    }
    
    // Resting Heart Rate - elevated RHR can indicate illness
    if (wearableData.restingHeartRate) {
      if (wearableData.restingHeartRate > 100) severity += 2; // Tachycardia at rest
      else if (wearableData.restingHeartRate > 90) severity += 1;
    }
    
    // Blood Oxygen - critical indicator
    if (wearableData.avgBloodOxygen) {
      if (wearableData.avgBloodOxygen < 90) severity += 3; // Critical hypoxemia
      else if (wearableData.avgBloodOxygen < 92) severity += 2;
      else if (wearableData.avgBloodOxygen < 95) severity += 1;
    }
    
    // Sleep Duration - insufficient sleep weakens immune system
    if (wearableData.avgSleepDuration) {
      if (wearableData.avgSleepDuration < 4) severity += 1; // Severe sleep deprivation
      else if (wearableData.avgSleepDuration < 5) severity += 0.5;
    }
    
    // Detected Anomalies from wearable data
    if (wearableData.anomalies && Array.isArray(wearableData.anomalies)) {
      for (const anomaly of wearableData.anomalies) {
        if (anomaly.severity === "high" || anomaly.severity === "critical") {
          severity += 2;
        } else if (anomaly.severity === "moderate") {
          severity += 1;
        }
      }
    }
  }

  // Keyword analysis for severity
  if (input.text) {
    const emergencyKeywords = ["can't breathe", "chest pain", "severe pain", "bleeding heavily", "unconscious"];
    const hasEmergencyKeyword = emergencyKeywords.some(keyword => 
      input.text!.toLowerCase().includes(keyword)
    );
    if (hasEmergencyKeyword) severity += 3;
  }

  // Cap at 10
  return Math.min(severity, 10);
}

// ============================================================================
// Vector Storage
// ============================================================================

async function storeContextVector(contextVector: ContextVector): Promise<void> {
  try {
    // Store in Redis with 24-hour expiration
    const key = `context_vector:${contextVector.userId}:${Date.now()}`;
    await redis.set(key, JSON.stringify(contextVector), { ex: 86400 });

    // TODO: Store in patient_context_vectors table for long-term analysis
  } catch (error) {
    console.error("[Context Vector] Error storing vector:", error);
  }
}

// ============================================================================
// Budget Filter Tracking
// ============================================================================

export async function trackBudgetFilterClick(userId: number): Promise<void> {
  try {
    const key = `user:${userId}:budget_filter_clicks`;
    await redis.incr(key);
    await redis.expire(key, 2592000); // 30 days
  } catch (error) {
    console.error("[Context Vector] Error tracking budget filter click:", error);
  }
}

// ============================================================================
// Wearable Data Update (called by mobile app)
// ============================================================================

export async function updateWearableData(userId: number, data: any): Promise<void> {
  try {
    const key = `user:${userId}:wearable`;
    await redis.set(key, JSON.stringify(data), { ex: 3600 }); // 1 hour expiration
    console.log(`[Context Vector] Updated wearable data for user ${userId}`);
  } catch (error) {
    console.error("[Context Vector] Error updating wearable data:", error);
  }
}

// ============================================================================
// Geolocation Update (called by mobile app or browser)
// ============================================================================

export async function updateUserGeolocation(
  userId: number,
  location: { city: string; lat: number; lng: number }
): Promise<void> {
  try {
    const key = `user:${userId}:geo`;
    await redis.set(key, JSON.stringify(location), { ex: 86400 }); // 24 hours
    console.log(`[Context Vector] Updated geolocation for user ${userId}: ${location.city}`);
  } catch (error) {
    console.error("[Context Vector] Error updating geolocation:", error);
  }
}
