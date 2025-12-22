/**
 * Resource Auction Algorithm
 * 
 * Layer 3 of Avicenna-X: Intelligent resource matching
 * Scores doctors/clinics based on: skill match + proximity + price + network quality
 * 
 * The "auction" metaphor: Resources bid for patients based on their strengths.
 * Unlike traditional marketplaces, we optimize for patient outcomes, not just price.
 */

import { getDb } from "../db";

const db = await getDb();
import { Redis } from "@upstash/redis";
import type { HybridDiagnosis, ContextVector, ResourceMatch } from "./orchestrator";

// Convert rediss:// to https:// for Upstash SDK
const redisUrl = process.env.REDIS_URL!.replace('rediss://', 'https://').replace(':6379', '');
const redis = new Redis({
  url: redisUrl,
  token: process.env.REDIS_TOKEN!,
});

// ============================================================================
// Types
// ============================================================================

interface DoctorCandidate {
  id: number;
  name: string;
  specialty: string;
  subSpecialties?: string[];
  availabilityStatus: "available" | "busy" | "offline";
  currentPatientCount: number;
  maxPatientsPerDay: number;
  clinicId?: number;
  
  // Performance metrics
  diagnosisAccuracyRate: number;
  connectionQualityScore: number;
  avgResponseTime: number;
  patientSatisfactionScore: number;
}

interface ClinicCandidate {
  id: number;
  name: string;
  location: { city: string; lat: number; lng: number };
  equipmentAvailable: string[];
  networkQuality: "excellent" | "good" | "fair" | "poor";
  isOpen: boolean;
  avgWaitTime: number; // minutes
}

// ============================================================================
// Main Auction Functions
// ============================================================================

/**
 * Find best telemedicine doctor for the diagnosis
 * Score = (Skill_Match * 0.4) + (Availability * 0.3) + (Price * 0.2) + (Network * 0.1)
 */
export async function findBestDoctor(
  diagnosis: HybridDiagnosis,
  context: ContextVector
): Promise<ResourceMatch | undefined> {
  console.log(`[Resource Auction] Finding best doctor for: ${diagnosis.primaryDiagnosis}`);

  // Load available doctors
  const candidates = await loadAvailableDoctors();

  if (candidates.length === 0) {
    console.log("[Resource Auction] No available doctors found");
    return undefined;
  }

  // Score each candidate
  const scoredCandidates = candidates.map(doctor => {
    const skillMatch = calculateSkillMatch(doctor, diagnosis);
    const availability = calculateAvailability(doctor);
    const priceScore = calculatePriceAdherence(doctor, context);
    const networkScore = calculateNetworkScore(doctor);

    const totalScore = 
      skillMatch * 0.4 +
      availability * 0.3 +
      priceScore * 0.2 +
      networkScore * 0.1;

    return {
      doctor,
      score: totalScore,
      breakdown: {
        skillMatch,
        availability,
        priceScore,
        networkScore,
      },
    };
  });

  // Sort by score descending
  scoredCandidates.sort((a, b) => b.score - a.score);

  // Log top 3
  console.log("[Resource Auction] Top 3 doctors:");
  scoredCandidates.slice(0, 3).forEach((c, i) => {
    console.log(`  ${i + 1}. Dr. ${c.doctor.name} (${c.doctor.specialty}): ${c.score.toFixed(2)}`);
    console.log(`     Skill: ${c.breakdown.skillMatch.toFixed(2)}, Availability: ${c.breakdown.availability.toFixed(2)}, Price: ${c.breakdown.priceScore.toFixed(2)}, Network: ${c.breakdown.networkScore.toFixed(2)}`);
  });

  // Return best match
  const best = scoredCandidates[0];
  
  return {
    resourceId: best.doctor.id,
    resourceType: "doctor",
    score: best.score,
    scoreBreakdown: {
      skillMatch: best.breakdown.skillMatch,
      proximity: 0, // N/A for telemedicine
      priceAdherence: best.breakdown.priceScore,
      networkQuality: best.breakdown.networkScore,
    },
    metadata: {
      name: best.doctor.name,
      specialty: best.doctor.specialty,
      estimatedWaitTime: best.doctor.avgResponseTime,
      connectionQuality: best.doctor.connectionQualityScore > 80 ? "excellent" : "good",
    },
  };
}

/**
 * Find best clinic for in-person visit
 * Score = (Equipment_Match * 0.4) + (Proximity * 0.3) + (Price * 0.2) + (Network * 0.1)
 */
export async function findBestClinic(
  diagnosis: HybridDiagnosis,
  context: ContextVector
): Promise<ResourceMatch | undefined> {
  console.log(`[Resource Auction] Finding best clinic for: ${diagnosis.primaryDiagnosis}`);

  // Load available clinics
  const candidates = await loadAvailableClinics();

  if (candidates.length === 0) {
    console.log("[Resource Auction] No available clinics found");
    return undefined;
  }

  // Determine required equipment based on diagnosis
  const requiredEquipment = determineRequiredEquipment(diagnosis);

  // Score each candidate
  const scoredCandidates = candidates.map(clinic => {
    const equipmentMatch = calculateEquipmentMatch(clinic, requiredEquipment);
    const proximity = calculateProximity(clinic, context);
    const priceScore = 0.5; // TODO: Implement clinic pricing
    const networkScore = calculateClinicNetworkScore(clinic);

    const totalScore = 
      equipmentMatch * 0.4 +
      proximity * 0.3 +
      priceScore * 0.2 +
      networkScore * 0.1;

    return {
      clinic,
      score: totalScore,
      breakdown: {
        equipmentMatch,
        proximity,
        priceScore,
        networkScore,
      },
    };
  });

  // Sort by score descending
  scoredCandidates.sort((a, b) => b.score - a.score);

  // Log top 3
  console.log("[Resource Auction] Top 3 clinics:");
  scoredCandidates.slice(0, 3).forEach((c, i) => {
    console.log(`  ${i + 1}. ${c.clinic.name}: ${c.score.toFixed(2)}`);
    console.log(`     Equipment: ${c.breakdown.equipmentMatch.toFixed(2)}, Proximity: ${c.breakdown.proximity.toFixed(2)}, Network: ${c.breakdown.networkScore.toFixed(2)}`);
  });

  // Return best match
  const best = scoredCandidates[0];
  
  return {
    resourceId: best.clinic.id,
    resourceType: "clinic",
    score: best.score,
    scoreBreakdown: {
      skillMatch: best.breakdown.equipmentMatch,
      proximity: best.breakdown.proximity,
      priceAdherence: best.breakdown.priceScore,
      networkQuality: best.breakdown.networkScore,
    },
    metadata: {
      name: best.clinic.name,
      location: `${best.clinic.location.city}`,
      estimatedWaitTime: best.clinic.avgWaitTime,
      connectionQuality: best.clinic.networkQuality,
    },
  };
}

/**
 * Find nearest emergency facility (bypasses scoring, just finds closest)
 */
export async function findNearestEmergency(
  location?: { city: string; lat: number; lng: number }
): Promise<ResourceMatch | undefined> {
  console.log("[Resource Auction] Finding nearest emergency facility...");

  // TODO: Query clinics with emergency capability
  // For now, return undefined
  return undefined;
}

// ============================================================================
// Data Loading
// ============================================================================

async function loadAvailableDoctors(): Promise<DoctorCandidate[]> {
  try {
    // Query users with doctor role + performance metrics
    const doctors = await db.query.users.findMany({
      where: (users, { eq, and, inArray }) => and(
        inArray(users.role, ["doctor", "clinician"]),
        eq(users.verified, true)
      ),
    });

    // Load performance metrics for each doctor
    const candidates: DoctorCandidate[] = [];

    for (const doctor of doctors) {
      // Check availability status
      if (doctor.availabilityStatus === "offline") continue;

      // Load performance metrics
      const performance = await db.query.doctorPerformance.findFirst({
        where: (perf, { eq }) => eq(perf.doctorId, doctor.id),
      });

      candidates.push({
        id: doctor.id,
        name: doctor.name || "Unknown",
        specialty: doctor.specialty || "General Medicine",
        subSpecialties: [], // TODO: Parse from JSON field
        availabilityStatus: doctor.availabilityStatus || "available",
        currentPatientCount: doctor.currentPatientCount || 0,
        maxPatientsPerDay: doctor.maxPatientsPerDay || 50,
        clinicId: doctor.clinicId || undefined,
        diagnosisAccuracyRate: performance?.diagnosisAccuracyRate ? parseFloat(performance.diagnosisAccuracyRate as any) : 75,
        connectionQualityScore: performance?.connectionQualityScore ? parseFloat(performance.connectionQualityScore as any) : 80,
        avgResponseTime: performance?.avgResponseTime || 120,
        patientSatisfactionScore: performance?.patientSatisfactionScore ? parseFloat(performance.patientSatisfactionScore as any) : 4.0,
      });
    }

    return candidates;
  } catch (error) {
    console.error("[Resource Auction] Error loading doctors:", error);
    return [];
  }
}

async function loadAvailableClinics(): Promise<ClinicCandidate[]> {
  try {
    // TODO: Query clinics table
    // For now, return empty array
    return [];
  } catch (error) {
    console.error("[Resource Auction] Error loading clinics:", error);
    return [];
  }
}

// ============================================================================
// Scoring Functions
// ============================================================================

/**
 * Calculate skill match score (0-1)
 * Factors: specialty alignment, diagnosis accuracy rate, patient satisfaction
 */
function calculateSkillMatch(doctor: DoctorCandidate, diagnosis: HybridDiagnosis): number {
  let score = 0;

  // Base score from diagnosis accuracy rate
  score += (doctor.diagnosisAccuracyRate / 100) * 0.5;

  // Specialty match bonus
  const specialtyMatch = checkSpecialtyMatch(doctor.specialty, diagnosis.primaryDiagnosis);
  if (specialtyMatch) {
    score += 0.3;
  }

  // Patient satisfaction bonus
  score += (doctor.patientSatisfactionScore / 5) * 0.2;

  return Math.min(score, 1);
}

function checkSpecialtyMatch(specialty: string, diagnosis: string): boolean {
  const specialtyLower = specialty.toLowerCase();
  const diagnosisLower = diagnosis.toLowerCase();

  // Simple keyword matching (can be improved with ML)
  const specialtyMap: Record<string, string[]> = {
    cardiology: ["heart", "cardiac", "chest pain", "arrhythmia", "hypertension"],
    pulmonology: ["lung", "respiratory", "breathing", "asthma", "copd", "pneumonia"],
    gastroenterology: ["stomach", "digestive", "abdominal", "nausea", "diarrhea", "ibs"],
    neurology: ["headache", "migraine", "seizure", "stroke", "neurological", "dizziness"],
    dermatology: ["skin", "rash", "acne", "eczema", "psoriasis"],
    orthopedics: ["bone", "joint", "fracture", "sprain", "back pain", "arthritis"],
    pediatrics: ["child", "infant", "pediatric"],
    psychiatry: ["mental", "depression", "anxiety", "psychiatric"],
    endocrinology: ["diabetes", "thyroid", "hormone", "endocrine"],
  };

  for (const [spec, keywords] of Object.entries(specialtyMap)) {
    if (specialtyLower.includes(spec)) {
      return keywords.some(keyword => diagnosisLower.includes(keyword));
    }
  }

  return false;
}

/**
 * Calculate availability score (0-1)
 * Factors: current queue length, response time, availability status
 */
function calculateAvailability(doctor: DoctorCandidate): number {
  let score = 1;

  // Penalize based on current queue
  const queueRatio = doctor.currentPatientCount / doctor.maxPatientsPerDay;
  score -= queueRatio * 0.5;

  // Penalize based on response time
  if (doctor.avgResponseTime > 300) { // > 5 minutes
    score -= 0.2;
  } else if (doctor.avgResponseTime > 180) { // > 3 minutes
    score -= 0.1;
  }

  // Penalize if busy
  if (doctor.availabilityStatus === "busy") {
    score -= 0.3;
  }

  return Math.max(score, 0);
}

/**
 * Calculate price adherence score (0-1)
 * Factors: user's budget preferences, doctor's pricing tier
 */
function calculatePriceAdherence(doctor: DoctorCandidate, context: ContextVector): number {
  // If user clicked budget filter, prioritize lower-cost doctors
  if (context.financialConstraints.budgetFilterClicked) {
    // TODO: Implement actual pricing tiers
    // For now, return moderate score
    return 0.7;
  }

  // Default: price is not a major factor
  return 0.5;
}

/**
 * Calculate network score (0-1)
 * Factors: connection quality, latency, dropped connections
 */
function calculateNetworkScore(doctor: DoctorCandidate): number {
  // Normalize connection quality score (0-100) to (0-1)
  return doctor.connectionQualityScore / 100;
}

/**
 * Calculate equipment match score for clinics (0-1)
 */
function calculateEquipmentMatch(clinic: ClinicCandidate, requiredEquipment: string[]): number {
  if (requiredEquipment.length === 0) {
    return 1; // No specific equipment needed
  }

  const matchCount = requiredEquipment.filter(eq => 
    clinic.equipmentAvailable.includes(eq)
  ).length;

  return matchCount / requiredEquipment.length;
}

/**
 * Calculate proximity score for clinics (0-1)
 */
function calculateProximity(clinic: ClinicCandidate, context: ContextVector): number {
  if (!context.environmentalFactors.location) {
    return 0.5; // Unknown location, neutral score
  }

  // Calculate distance using Haversine formula
  const distance = calculateDistance(
    context.environmentalFactors.location.lat,
    context.environmentalFactors.location.lng,
    clinic.location.lat,
    clinic.location.lng
  );

  // Score based on distance (closer = better)
  if (distance < 2) return 1.0; // < 2km
  if (distance < 5) return 0.8; // < 5km
  if (distance < 10) return 0.6; // < 10km
  if (distance < 20) return 0.4; // < 20km
  return 0.2; // > 20km
}

function calculateDistance(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371; // Earth's radius in km
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  
  const a = 
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
    Math.sin(dLng / 2) * Math.sin(dLng / 2);
  
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

function toRad(degrees: number): number {
  return degrees * (Math.PI / 180);
}

/**
 * Calculate network score for clinics (0-1)
 */
function calculateClinicNetworkScore(clinic: ClinicCandidate): number {
  const qualityMap = {
    excellent: 1.0,
    good: 0.8,
    fair: 0.5,
    poor: 0.2,
  };

  return qualityMap[clinic.networkQuality] || 0.5;
}

/**
 * Determine required equipment based on diagnosis
 */
function determineRequiredEquipment(diagnosis: HybridDiagnosis): string[] {
  const equipment: string[] = [];
  const diagnosisLower = diagnosis.primaryDiagnosis.toLowerCase();

  // Simple keyword-based equipment mapping
  if (diagnosisLower.includes("fracture") || diagnosisLower.includes("bone")) {
    equipment.push("xray");
  }

  if (diagnosisLower.includes("heart") || diagnosisLower.includes("cardiac")) {
    equipment.push("ecg", "echo");
  }

  if (diagnosisLower.includes("lung") || diagnosisLower.includes("respiratory")) {
    equipment.push("xray", "spirometry");
  }

  if (diagnosisLower.includes("abdominal") || diagnosisLower.includes("stomach")) {
    equipment.push("ultrasound");
  }

  if (diagnosisLower.includes("brain") || diagnosisLower.includes("head")) {
    equipment.push("ct", "mri");
  }

  return equipment;
}

// ============================================================================
// Deep Link Generation
// ============================================================================

export function generateDeepLinks(resource: ResourceMatch): {
  uberLink?: string;
  careemLink?: string;
  googleMapsLink?: string;
} {
  // TODO: Implement deep link generation for ride-sharing apps
  // Example: uber://action=setPickup&pickup=my_location&dropoff[latitude]=33.3152&dropoff[longitude]=44.3661
  
  return {
    uberLink: undefined,
    careemLink: undefined,
    googleMapsLink: undefined,
  };
}
