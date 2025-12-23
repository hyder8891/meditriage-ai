// @ts-nocheck
/**
 * Epidemiology Tracking System
 * 
 * Layer 4 of Avicenna-X: Real-time disease surveillance
 * Aggregates anonymized symptom reports to detect disease spikes by city
 * 
 * Key Features:
 * - Privacy-preserving: Only city-level aggregation, no PII
 * - Real-time: Redis-based heatmaps updated every 5 minutes
 * - Predictive: Growth rate tracking to detect outbreaks early
 * - Actionable: Feeds into Bayesian diagnosis updates
 */

import { getDb } from "../db";

const db = await getDb();
import { Redis } from "@upstash/redis";
import type { LocalRisk } from "./orchestrator";

// Convert rediss:// to https:// for Upstash SDK
const redisUrl = process.env.REDIS_URL!.replace('rediss://', 'https://').replace(':6379', '');
const redis = new Redis({
  url: redisUrl,
  token: process.env.REDIS_TOKEN!,
});

// ============================================================================
// Types
// ============================================================================

interface SymptomReport {
  city: string;
  region?: string;
  symptomKeywords: string[];
  severityLevel: number; // 1-10
  urgencyLevel: string;
  ageGroup?: string;
  gender?: string;
  timestamp: Date;
}

interface DiseaseCluster {
  disease: string;
  caseCount: number;
  severityAvg: number;
  growthRate: number; // percentage change from previous period
  riskLevel: "low" | "moderate" | "high" | "critical";
}

// ============================================================================
// Main Functions
// ============================================================================

/**
 * Record anonymized symptom report for epidemiology tracking
 * Called after each triage session
 */
export async function recordSymptomReport(
  city: string,
  symptoms: string[],
  severity: number,
  urgency: string,
  demographics?: { ageGroup?: string; gender?: string }
): Promise<void> {
  try {
    console.log(`[Epidemiology] Recording symptom report for ${city}...`);

    // Store in database for long-term analysis
    // TODO: Insert into anonymized_symptom_reports table

    // Update Redis heatmap in real-time
    await updateRealtimeHeatmap(city, symptoms, severity, urgency);

    console.log(`[Epidemiology] Symptom report recorded successfully`);
  } catch (error) {
    console.error("[Epidemiology] Error recording symptom report:", error);
  }
}

/**
 * Get local disease risks for a city
 * Returns top 5 diseases with elevated risk
 */
export async function getLocalRisks(city: string): Promise<LocalRisk[]> {
  try {
    console.log(`[Epidemiology] Fetching local risks for ${city}...`);

    // Check Redis cache first
    const cacheKey = `city:${city.toLowerCase()}:risks`;
    const cached = await redis.get(cacheKey);

    if (cached && Array.isArray(cached)) {
      console.log(`[Epidemiology] Found ${cached.length} local risks in cache`);
      return cached as LocalRisk[];
    }

    // Calculate risks from recent data
    const risks = await calculateLocalRisks(city);

    // Cache for 5 minutes
    await redis.set(cacheKey, JSON.stringify(risks), { ex: 300 });

    console.log(`[Epidemiology] Calculated ${risks.length} local risks`);
    return risks;
  } catch (error) {
    console.error("[Epidemiology] Error fetching local risks:", error);
    return [];
  }
}

/**
 * Background job: Analyze disease patterns and update heatmaps
 * Should run every 5 minutes via cron
 */
export async function analyzeDiseasePatternsJob(): Promise<void> {
  console.log("[Epidemiology Job] Starting disease pattern analysis...");

  try {
    // Get all cities with recent activity
    const cities = await getActiveCities();

    for (const city of cities) {
      // Calculate disease clusters
      const clusters = await calculateDiseaseClusters(city);

      // Detect outbreaks
      const outbreaks = clusters.filter(c => c.riskLevel === "critical" || c.riskLevel === "high");

      if (outbreaks.length > 0) {
        console.log(`[Epidemiology Job] ⚠️  Detected ${outbreaks.length} outbreaks in ${city}:`);
        outbreaks.forEach(o => {
          console.log(`  - ${o.disease}: ${o.caseCount} cases (${o.growthRate}% growth)`);
        });

        // TODO: Send alerts to health authorities
      }

      // Update Redis heatmap
      const risks: LocalRisk[] = clusters.map(c => ({
        disease: c.disease,
        caseCount: c.caseCount,
        riskLevel: c.riskLevel,
        growthRate: c.growthRate,
      }));

      await redis.set(`city:${city.toLowerCase()}:risks`, JSON.stringify(risks), { ex: 300 });
    }

    console.log("[Epidemiology Job] Disease pattern analysis complete");
  } catch (error) {
    console.error("[Epidemiology Job] Error:", error);
  }
}

// ============================================================================
// Real-time Heatmap Updates
// ============================================================================

async function updateRealtimeHeatmap(
  city: string,
  symptoms: string[],
  severity: number,
  urgency: string
): Promise<void> {
  const timestamp = Date.now();
  const cityKey = city.toLowerCase();

  // Increment symptom counters
  for (const symptom of symptoms) {
    const symptomKey = `heatmap:${cityKey}:${symptom.toLowerCase()}`;
    
    // Increment counter
    await redis.incr(symptomKey);
    
    // Set expiration to 24 hours
    await redis.expire(symptomKey, 86400);
    
    // Add to sorted set for time-series analysis
    const timeSeriesKey = `heatmap:${cityKey}:${symptom.toLowerCase()}:timeseries`;
    await redis.zadd(timeSeriesKey, { score: timestamp, member: `${timestamp}:${severity}` });
    
    // Keep only last 24 hours
    const oneDayAgo = timestamp - 86400000;
    await redis.zremrangebyscore(timeSeriesKey, 0, oneDayAgo);
  }

  // Update city-level urgency counter
  const urgencyKey = `heatmap:${cityKey}:urgency:${urgency.toLowerCase()}`;
  await redis.incr(urgencyKey);
  await redis.expire(urgencyKey, 86400);
}

// ============================================================================
// Risk Calculation
// ============================================================================

async function calculateLocalRisks(city: string): Promise<LocalRisk[]> {
  const cityKey = city.toLowerCase();
  const risks: LocalRisk[] = [];

  // Get all symptom keys for this city
  const pattern = `heatmap:${cityKey}:*`;
  const keys = await redis.keys(pattern);

  if (!keys || keys.length === 0) {
    return [];
  }

  // Group symptoms into disease clusters
  const symptomCounts: Record<string, number> = {};

  for (const key of keys) {
    if (key.includes(":timeseries") || key.includes(":urgency:")) continue;

    const symptom = key.split(":")[2];
    const count = await redis.get(key);
    
    if (count && typeof count === "number") {
      symptomCounts[symptom] = count;
    }
  }

  // Map symptoms to diseases (simplified version)
  const diseaseClusters = mapSymptomsToDiseases(symptomCounts);

  // Calculate risk levels and growth rates
  for (const [disease, caseCount] of Object.entries(diseaseClusters)) {
    const growthRate = await calculateGrowthRate(cityKey, disease);
    const riskLevel = determineRiskLevel(caseCount, growthRate);

    risks.push({
      disease,
      caseCount,
      riskLevel,
      growthRate,
    });
  }

  // Sort by risk level and case count
  risks.sort((a, b) => {
    const riskOrder = { critical: 4, high: 3, moderate: 2, low: 1 };
    const aOrder = riskOrder[a.riskLevel];
    const bOrder = riskOrder[b.riskLevel];
    
    if (aOrder !== bOrder) return bOrder - aOrder;
    return b.caseCount - a.caseCount;
  });

  // Return top 5
  return risks.slice(0, 5);
}

function mapSymptomsToDiseases(symptomCounts: Record<string, number>): Record<string, number> {
  const diseases: Record<string, number> = {};

  // Symptom-to-disease mapping (simplified)
  const diseaseMap: Record<string, string[]> = {
    "Influenza": ["fever", "cough", "fatigue", "body aches", "headache"],
    "COVID-19": ["fever", "cough", "loss of taste", "loss of smell", "shortness of breath"],
    "Gastroenteritis": ["diarrhea", "nausea", "vomiting", "abdominal pain", "stomach cramps"],
    "Allergic Rhinitis": ["sneezing", "runny nose", "itchy eyes", "nasal congestion"],
    "Migraine": ["headache", "nausea", "sensitivity to light", "visual disturbances"],
    "Asthma Exacerbation": ["shortness of breath", "wheezing", "chest tightness", "cough"],
    "Urinary Tract Infection": ["painful urination", "frequent urination", "lower abdominal pain"],
    "Conjunctivitis": ["red eyes", "itchy eyes", "eye discharge", "watery eyes"],
    "Dengue Fever": ["high fever", "severe headache", "pain behind eyes", "joint pain", "rash"],
    "Food Poisoning": ["nausea", "vomiting", "diarrhea", "abdominal cramps", "fever"],
  };

  // Score each disease based on symptom matches
  for (const [disease, diseaseSymptoms] of Object.entries(diseaseMap)) {
    let score = 0;
    
    for (const symptom of diseaseSymptoms) {
      if (symptomCounts[symptom]) {
        score += symptomCounts[symptom];
      }
    }

    if (score > 0) {
      diseases[disease] = score;
    }
  }

  return diseases;
}

async function calculateGrowthRate(cityKey: string, disease: string): Promise<number> {
  try {
    // Get current count (last 24 hours)
    const currentKey = `disease_count:${cityKey}:${disease}:current`;
    const current = await redis.get(currentKey);
    const currentCount = current ? parseInt(current as string) : 0;

    // Get previous count (24-48 hours ago)
    const previousKey = `disease_count:${cityKey}:${disease}:previous`;
    const previous = await redis.get(previousKey);
    const previousCount = previous ? parseInt(previous as string) : 0;

    if (previousCount === 0) {
      return currentCount > 0 ? 100 : 0; // New disease
    }

    const growthRate = ((currentCount - previousCount) / previousCount) * 100;
    return Math.round(growthRate);
  } catch (error) {
    console.error("[Epidemiology] Error calculating growth rate:", error);
    return 0;
  }
}

function determineRiskLevel(caseCount: number, growthRate: number): "low" | "moderate" | "high" | "critical" {
  // Critical: High case count AND rapid growth
  if (caseCount > 100 && growthRate > 50) return "critical";
  
  // High: High case count OR rapid growth
  if (caseCount > 100 || growthRate > 50) return "high";
  
  // Moderate: Moderate case count or moderate growth
  if (caseCount > 20 || growthRate > 20) return "moderate";
  
  // Low: Everything else
  return "low";
}

// ============================================================================
// Disease Clustering
// ============================================================================

async function calculateDiseaseClusters(city: string): Promise<DiseaseCluster[]> {
  const cityKey = city.toLowerCase();
  
  // Get symptom counts
  const pattern = `heatmap:${cityKey}:*`;
  const keys = await redis.keys(pattern);

  if (!keys || keys.length === 0) {
    return [];
  }

  const symptomCounts: Record<string, number> = {};

  for (const key of keys) {
    if (key.includes(":timeseries") || key.includes(":urgency:")) continue;

    const symptom = key.split(":")[2];
    const count = await redis.get(key);
    
    if (count && typeof count === "number") {
      symptomCounts[symptom] = count;
    }
  }

  // Map to diseases
  const diseaseCounts = mapSymptomsToDiseases(symptomCounts);

  // Build clusters
  const clusters: DiseaseCluster[] = [];

  for (const [disease, caseCount] of Object.entries(diseaseCounts)) {
    const growthRate = await calculateGrowthRate(cityKey, disease);
    const riskLevel = determineRiskLevel(caseCount, growthRate);

    clusters.push({
      disease,
      caseCount,
      severityAvg: 5, // TODO: Calculate from actual severity data
      growthRate,
      riskLevel,
    });
  }

  return clusters;
}

// ============================================================================
// Utility Functions
// ============================================================================

async function getActiveCities(): Promise<string[]> {
  try {
    // Get all heatmap keys
    const keys = await redis.keys("heatmap:*");
    
    if (!keys || keys.length === 0) {
      return ["Baghdad"]; // Default
    }

    // Extract unique city names
    const cities = new Set<string>();
    for (const key of keys) {
      const parts = key.split(":");
      if (parts.length >= 2) {
        cities.add(parts[1]);
      }
    }

    return Array.from(cities);
  } catch (error) {
    console.error("[Epidemiology] Error getting active cities:", error);
    return ["Baghdad"];
  }
}

/**
 * Get disease heatmap for visualization
 * Returns disease counts by city for the past 24 hours
 */
export async function getDiseaseHeatmap(): Promise<Record<string, Record<string, number>>> {
  try {
    const cities = await getActiveCities();
    const heatmap: Record<string, Record<string, number>> = {};

    for (const city of cities) {
      const risks = await getLocalRisks(city);
      heatmap[city] = {};
      
      for (const risk of risks) {
        heatmap[city][risk.disease] = risk.caseCount;
      }
    }

    return heatmap;
  } catch (error) {
    console.error("[Epidemiology] Error getting disease heatmap:", error);
    return {};
  }
}

/**
 * Get outbreak alerts for a region
 * Returns diseases with critical or high risk levels
 */
export async function getOutbreakAlerts(city?: string): Promise<LocalRisk[]> {
  try {
    if (city) {
      const risks = await getLocalRisks(city);
      return risks.filter(r => r.riskLevel === "critical" || r.riskLevel === "high");
    }

    // Get alerts for all cities
    const cities = await getActiveCities();
    const allAlerts: LocalRisk[] = [];

    for (const c of cities) {
      const risks = await getLocalRisks(c);
      const alerts = risks.filter(r => r.riskLevel === "critical" || r.riskLevel === "high");
      allAlerts.push(...alerts);
    }

    return allAlerts;
  } catch (error) {
    console.error("[Epidemiology] Error getting outbreak alerts:", error);
    return [];
  }
}
