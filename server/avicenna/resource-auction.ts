/**
 * Avicenna-x Feature #4: Resource Auction Algorithm
 * 
 * Intelligent doctor/clinic matching system that scores providers based on:
 * 1. Skill Match - Specialty alignment with patient condition
 * 2. Proximity - Distance from patient location
 * 3. Price - Cost optimization within budget constraints
 * 4. Network Quality - Connection stability for telemedicine
 * 5. Performance History - Past success rates and patient satisfaction
 * 
 * This creates a competitive marketplace where the best-fit provider wins.
 */

import { getDb } from '../db';
import { users, consultations } from '../../drizzle/schema';

const db = await getDb();
import { eq, and, gte, sql } from 'drizzle-orm';

// ============================================================================
// TYPES
// ============================================================================

export interface DoctorScore {
  doctorId: number;
  doctorName: string;
  specialty: string;
  totalScore: number; // 0-100
  breakdown: {
    skillMatch: number; // 0-100
    proximity: number; // 0-100
    price: number; // 0-100
    networkQuality: number; // 0-100
    performance: number; // 0-100
  };
  metadata: {
    distance: number; // km
    estimatedCost: number; // IQD
    avgResponseTime: number; // seconds
    successRate: number; // 0-1
    patientRating: number; // 0-5
    connectionStability: number; // 0-1
  };
  recommendation: 'HIGHLY_RECOMMENDED' | 'RECOMMENDED' | 'AVAILABLE' | 'NOT_RECOMMENDED';
}

export interface AuctionParams {
  patientLocation: { lat: number; lng: number };
  requiredSpecialty: string;
  symptoms: string[];
  urgency: 'EMERGENCY' | 'HIGH' | 'MEDIUM' | 'LOW';
  maxBudget?: number; // IQD
  maxDistance?: number; // km
  requiresTelemedicine: boolean;
  preferredLanguage?: 'ar' | 'en';
}

export interface DoctorPerformanceMetrics {
  doctorId: number;
  totalConsultations: number;
  successfulConsultations: number;
  avgResponseTime: number; // seconds
  avgConsultationDuration: number; // minutes
  patientSatisfactionAvg: number; // 0-5
  specialtySuccessRates: Record<string, number>; // specialty -> success rate
  lastUpdated: Date;
}

export interface NetworkQualityMetrics {
  doctorId: number;
  avgLatency: number; // ms
  avgBandwidth: number; // Mbps
  connectionDropRate: number; // 0-1
  lastConnectionQuality: 'EXCELLENT' | 'GOOD' | 'FAIR' | 'POOR';
  measurementCount: number;
  lastMeasured: Date;
}

// ============================================================================
// SKILL MATCHING
// ============================================================================

/**
 * Calculate skill match score (0-100) based on specialty alignment
 */
export function calculateSkillMatch(
  doctorSpecialty: string,
  requiredSpecialty: string,
  symptoms: string[]
): number {
  let score = 0;

  // Exact specialty match = 50 points
  if (doctorSpecialty.toLowerCase() === requiredSpecialty.toLowerCase()) {
    score += 50;
  }

  // Related specialty = 30 points
  const relatedSpecialties: Record<string, string[]> = {
    'cardiology': ['internal medicine', 'emergency medicine'],
    'neurology': ['internal medicine', 'emergency medicine'],
    'gastroenterology': ['internal medicine', 'general surgery'],
    'pulmonology': ['internal medicine', 'critical care'],
    'endocrinology': ['internal medicine', 'family medicine'],
    'nephrology': ['internal medicine', 'critical care'],
    'rheumatology': ['internal medicine', 'orthopedics'],
    'pediatrics': ['family medicine', 'neonatology'],
    'obstetrics': ['gynecology', 'family medicine'],
    'psychiatry': ['neurology', 'family medicine'],
    'dermatology': ['internal medicine', 'allergy'],
    'ophthalmology': ['neurology', 'family medicine'],
    'ent': ['head and neck surgery', 'family medicine'],
    'orthopedics': ['sports medicine', 'rheumatology'],
    'urology': ['nephrology', 'general surgery'],
  };

  const related = relatedSpecialties[requiredSpecialty.toLowerCase()] || [];
  if (related.some(r => doctorSpecialty.toLowerCase().includes(r))) {
    score += 30;
  }

  // Symptom-specialty alignment = up to 50 points
  const symptomKeywords: Record<string, string[]> = {
    'cardiology': ['chest pain', 'palpitations', 'shortness of breath', 'heart', 'cardiac'],
    'neurology': ['headache', 'dizziness', 'seizure', 'stroke', 'numbness', 'weakness'],
    'gastroenterology': ['abdominal pain', 'nausea', 'vomiting', 'diarrhea', 'constipation'],
    'pulmonology': ['cough', 'dyspnea', 'wheezing', 'chest tightness'],
    'endocrinology': ['diabetes', 'thyroid', 'weight', 'fatigue', 'hormone'],
    'nephrology': ['kidney', 'urine', 'edema', 'hypertension'],
    'rheumatology': ['joint pain', 'arthritis', 'stiffness', 'swelling'],
    'pediatrics': ['child', 'infant', 'fever', 'rash', 'developmental'],
    'obstetrics': ['pregnancy', 'prenatal', 'labor', 'delivery'],
    'psychiatry': ['depression', 'anxiety', 'mood', 'sleep', 'stress'],
    'dermatology': ['rash', 'skin', 'itching', 'lesion', 'acne'],
    'orthopedics': ['fracture', 'bone', 'joint', 'muscle', 'sprain'],
  };

  const keywords = symptomKeywords[doctorSpecialty.toLowerCase()] || [];
  const symptomText = symptoms.join(' ').toLowerCase();
  const matchCount = keywords.filter(kw => symptomText.includes(kw)).length;
  // Avoid division by zero when keywords array is empty
  const symptomScore = keywords.length > 0 ? Math.min(50, (matchCount / keywords.length) * 50) : 0;
  score += symptomScore;

  return Math.min(100, score);
}

// ============================================================================
// PROXIMITY SCORING
// ============================================================================

/**
 * Haversine formula to calculate distance between two coordinates
 */
export function calculateDistance(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number
): number {
  const R = 6371; // Earth's radius in km
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLng = (lng2 - lng1) * Math.PI / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLng / 2) * Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

/**
 * Calculate proximity score (0-100) with urgency weighting
 */
export function calculateProximityScore(
  distance: number,
  urgency: string,
  maxDistance?: number
): number {
  // If beyond max distance, return 0
  if (maxDistance && distance > maxDistance) {
    return 0;
  }

  // Urgency-based distance thresholds (km)
  const thresholds = {
    EMERGENCY: { ideal: 5, acceptable: 15, max: 30 },
    HIGH: { ideal: 10, acceptable: 25, max: 50 },
    MEDIUM: { ideal: 20, acceptable: 40, max: 100 },
    LOW: { ideal: 50, acceptable: 100, max: 200 },
  };

  const threshold = thresholds[urgency as keyof typeof thresholds] || thresholds.MEDIUM;

  // Scoring curve
  if (distance <= threshold.ideal) {
    return 100; // Perfect score
  } else if (distance <= threshold.acceptable) {
    // Linear decay from 100 to 60
    const ratio = (distance - threshold.ideal) / (threshold.acceptable - threshold.ideal);
    return 100 - (ratio * 40);
  } else if (distance <= threshold.max) {
    // Linear decay from 60 to 20
    const ratio = (distance - threshold.acceptable) / (threshold.max - threshold.acceptable);
    return 60 - (ratio * 40);
  } else {
    // Beyond max threshold
    return Math.max(0, 20 - ((distance - threshold.max) / 10));
  }
}

// ============================================================================
// PRICE OPTIMIZATION
// ============================================================================

/**
 * Calculate price score (0-100) based on cost and budget
 */
export function calculatePriceScore(
  doctorCost: number,
  maxBudget: number | undefined,
  avgMarketCost: number
): number {
  // If no budget constraint, score based on market comparison
  if (!maxBudget) {
    if (doctorCost <= avgMarketCost * 0.8) return 100; // 20% below market
    if (doctorCost <= avgMarketCost) return 80; // At or below market
    if (doctorCost <= avgMarketCost * 1.2) return 60; // 20% above market
    if (doctorCost <= avgMarketCost * 1.5) return 40; // 50% above market
    return 20; // More than 50% above market
  }

  // With budget constraint
  if (doctorCost > maxBudget) {
    return 0; // Over budget = disqualified
  }

  // Score based on how much budget is preserved
  const budgetUtilization = doctorCost / maxBudget;
  if (budgetUtilization <= 0.5) return 100; // Uses ≤50% of budget
  if (budgetUtilization <= 0.7) return 80; // Uses ≤70% of budget
  if (budgetUtilization <= 0.85) return 60; // Uses ≤85% of budget
  return 40; // Uses >85% of budget
}

/**
 * Estimate consultation cost based on specialty and urgency
 */
export function estimateConsultationCost(
  specialty: string,
  urgency: string,
  isTelemedicine: boolean
): number {
  // Base costs in IQD (Iraqi Dinar)
  const baseCosts: Record<string, number> = {
    'general practice': 25000,
    'family medicine': 25000,
    'internal medicine': 35000,
    'pediatrics': 30000,
    'cardiology': 50000,
    'neurology': 50000,
    'gastroenterology': 45000,
    'pulmonology': 45000,
    'endocrinology': 45000,
    'nephrology': 50000,
    'rheumatology': 45000,
    'obstetrics': 40000,
    'gynecology': 40000,
    'psychiatry': 40000,
    'dermatology': 35000,
    'ophthalmology': 40000,
    'ent': 40000,
    'orthopedics': 45000,
    'urology': 45000,
    'emergency medicine': 60000,
  };

  let cost = baseCosts[specialty.toLowerCase()] || 35000;

  // Urgency multiplier
  const urgencyMultipliers = {
    EMERGENCY: 2.0,
    HIGH: 1.5,
    MEDIUM: 1.0,
    LOW: 0.8,
  };
  cost *= urgencyMultipliers[urgency as keyof typeof urgencyMultipliers] || 1.0;

  // Telemedicine discount (20% cheaper)
  if (isTelemedicine) {
    cost *= 0.8;
  }

  return Math.round(cost);
}

// ============================================================================
// NETWORK QUALITY SCORING
// ============================================================================

/**
 * Calculate network quality score (0-100) for telemedicine readiness
 */
export function calculateNetworkQualityScore(
  metrics: NetworkQualityMetrics | null,
  requiresTelemedicine: boolean
): number {
  // If telemedicine not required, network quality doesn't matter
  if (!requiresTelemedicine) {
    return 100;
  }

  // No metrics = assume average quality
  if (!metrics) {
    return 50;
  }

  let score = 0;

  // Latency score (40 points max)
  if (metrics.avgLatency < 50) score += 40;
  else if (metrics.avgLatency < 100) score += 30;
  else if (metrics.avgLatency < 200) score += 20;
  else if (metrics.avgLatency < 300) score += 10;

  // Bandwidth score (30 points max)
  if (metrics.avgBandwidth >= 5) score += 30; // 5+ Mbps = excellent
  else if (metrics.avgBandwidth >= 2) score += 20; // 2-5 Mbps = good
  else if (metrics.avgBandwidth >= 1) score += 10; // 1-2 Mbps = fair

  // Connection stability (30 points max)
  const stability = 1 - metrics.connectionDropRate;
  score += stability * 30;

  return Math.min(100, score);
}

// ============================================================================
// PERFORMANCE SCORING
// ============================================================================

/**
 * Calculate performance score (0-100) based on historical metrics
 */
export function calculatePerformanceScore(
  metrics: DoctorPerformanceMetrics | null,
  requiredSpecialty: string
): number {
  // No metrics = assume average performance
  if (!metrics || metrics.totalConsultations < 5) {
    return 50;
  }

  let score = 0;

  // Success rate (40 points max)
  const successRate = metrics.successfulConsultations / metrics.totalConsultations;
  score += successRate * 40;

  // Patient satisfaction (30 points max)
  score += (metrics.patientSatisfactionAvg / 5) * 30;

  // Response time (15 points max) - faster is better
  if (metrics.avgResponseTime < 60) score += 15; // <1 min
  else if (metrics.avgResponseTime < 300) score += 10; // <5 min
  else if (metrics.avgResponseTime < 600) score += 5; // <10 min

  // Specialty-specific success rate (15 points max)
  const specialtyRate = metrics.specialtySuccessRates[requiredSpecialty] || successRate;
  score += specialtyRate * 15;

  return Math.min(100, score);
}

// ============================================================================
// MAIN AUCTION ALGORITHM
// ============================================================================

/**
 * Run the resource auction algorithm to find the best doctor
 */
export async function runResourceAuction(
  params: AuctionParams
): Promise<DoctorScore[]> {
  // Fetch available doctors with required specialty
  const doctors = await db
    .select({
      id: users.id,
      name: users.name,
      email: users.email,
      specialty: users.specialty,
      availabilityStatus: users.availabilityStatus,
    })
    .from(users)
    .where(
      and(
        eq(users.role, 'doctor'),
        eq(users.availabilityStatus, 'available'),
        eq(users.verified, true)
      )
    );

  // Calculate average market cost for price comparison
  const avgMarketCost = estimateConsultationCost(
    params.requiredSpecialty,
    params.urgency,
    params.requiresTelemedicine
  );

  // Score each doctor
  const scoredDoctors: DoctorScore[] = [];

  for (const doctor of doctors) {
    // Mock doctor location (in production, fetch from database)
    const doctorLocation = { lat: 33.3152 + Math.random() * 0.1, lng: 44.3661 + Math.random() * 0.1 };
    
    // Calculate distance
    const distance = calculateDistance(
      params.patientLocation.lat,
      params.patientLocation.lng,
      doctorLocation.lat,
      doctorLocation.lng
    );

    // Skip if beyond max distance
    if (params.maxDistance && distance > params.maxDistance) {
      continue;
    }

    // Estimate cost
    const estimatedCost = estimateConsultationCost(
      doctor.specialty || 'general practice',
      params.urgency,
      params.requiresTelemedicine
    );

    // Skip if over budget
    if (params.maxBudget && estimatedCost > params.maxBudget) {
      continue;
    }

    // Fetch performance metrics (mock for now)
    const performanceMetrics: DoctorPerformanceMetrics | null = null; // TODO: Fetch from database

    // Fetch network quality metrics (mock for now)
    const networkMetrics: NetworkQualityMetrics | null = null; // TODO: Fetch from database

    // Calculate individual scores
    const skillMatch = calculateSkillMatch(
      doctor.specialty || 'general practice',
      params.requiredSpecialty,
      params.symptoms
    );

    const proximity = calculateProximityScore(
      distance,
      params.urgency,
      params.maxDistance
    );

    const price = calculatePriceScore(
      estimatedCost,
      params.maxBudget,
      avgMarketCost
    );

    const networkQuality = calculateNetworkQualityScore(
      networkMetrics,
      params.requiresTelemedicine
    );

    const performance = calculatePerformanceScore(
      performanceMetrics,
      params.requiredSpecialty
    );

    // Weighted total score (customizable weights)
    const weights = {
      skillMatch: 0.35, // 35% - Most important
      proximity: 0.20, // 20% - Important for urgency
      price: 0.15, // 15% - Budget matters
      networkQuality: params.requiresTelemedicine ? 0.15 : 0.05, // 15% if telemedicine, 5% otherwise
      performance: 0.15, // 15% - Track record
    };

    const totalScore =
      skillMatch * weights.skillMatch +
      proximity * weights.proximity +
      price * weights.price +
      networkQuality * weights.networkQuality +
      performance * weights.performance;

    // Determine recommendation level
    let recommendation: DoctorScore['recommendation'];
    if (totalScore >= 80) recommendation = 'HIGHLY_RECOMMENDED';
    else if (totalScore >= 60) recommendation = 'RECOMMENDED';
    else if (totalScore >= 40) recommendation = 'AVAILABLE';
    else recommendation = 'NOT_RECOMMENDED';

    scoredDoctors.push({
      doctorId: doctor.id,
      doctorName: doctor.name || 'Unknown',
      specialty: doctor.specialty || 'General Practice',
      totalScore: Math.round(totalScore),
      breakdown: {
        skillMatch: Math.round(skillMatch),
        proximity: Math.round(proximity),
        price: Math.round(price),
        networkQuality: Math.round(networkQuality),
        performance: Math.round(performance),
      },
      metadata: {
        distance: Math.round(distance * 10) / 10,
        estimatedCost,
        avgResponseTime: performanceMetrics?.avgResponseTime || 180,
        successRate: performanceMetrics
          ? performanceMetrics.successfulConsultations / performanceMetrics.totalConsultations
          : 0.85,
        patientRating: performanceMetrics?.patientSatisfactionAvg || 4.2,
        connectionStability: networkMetrics ? 1 - networkMetrics.connectionDropRate : 0.9,
      },
      recommendation,
    });
  }

  // Sort by total score (descending)
  scoredDoctors.sort((a, b) => b.totalScore - a.totalScore);

  return scoredDoctors;
}
