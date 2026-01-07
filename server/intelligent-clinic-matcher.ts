/**
 * Intelligent Clinic Matcher
 * 
 * Matches patients to clinics/hospitals based on:
 * - Required medical tests
 * - Symptoms and conditions
 * - Urgency level
 * - Location
 * - Available services
 */

import { getDb } from "./db";
import { iraqClinics } from "../drizzle/schema";
import { eq, and, or, sql, desc, like } from "drizzle-orm";

// ============================================================================
// Types
// ============================================================================

export interface MatchCriteria {
  requiredTests: string[];
  symptoms: string[];
  conditions: string[];
  urgencyLevel: 'low' | 'moderate' | 'high' | 'critical';
  specialty?: string;
  governorate: string;
  city?: string;
}

export interface MatchedFacility {
  id: number;
  name: string;
  nameArabic?: string;
  type: string;
  address?: string;
  phone?: string;
  hasEmergency: boolean;
  has24Hours: boolean;
  bedCount?: number;
  matchScore: number;
  matchReasons: string[];
  matchedServices: string[];
  matchedSpecialties: string[];
  distance?: number;
}

// ============================================================================
// Service to Test Mapping
// ============================================================================

/**
 * Maps medical tests to clinic services
 * This is crucial for accurate clinic matching
 */
const TEST_TO_SERVICE_MAP: Record<string, string[]> = {
  // Blood tests
  "blood test": ["lab", "laboratory", "blood_test", "pathology"],
  "complete blood count": ["lab", "laboratory", "cbc", "blood_test", "hematology"],
  "cbc": ["lab", "laboratory", "cbc", "blood_test", "hematology"],
  "blood sugar": ["lab", "laboratory", "diabetes_care", "endocrinology"],
  "glucose test": ["lab", "laboratory", "diabetes_care"],
  "hba1c": ["lab", "laboratory", "diabetes_care", "endocrinology"],
  "lipid profile": ["lab", "laboratory", "cardiology"],
  "cholesterol": ["lab", "laboratory", "cardiology"],
  "liver function": ["lab", "laboratory", "hepatology", "gastroenterology"],
  "kidney function": ["lab", "laboratory", "nephrology", "urology"],
  "thyroid function": ["lab", "laboratory", "endocrinology"],
  "tsh": ["lab", "laboratory", "endocrinology"],
  "urine test": ["lab", "laboratory", "urology"],
  "urinalysis": ["lab", "laboratory", "urology"],
  "stool test": ["lab", "laboratory", "gastroenterology"],
  "blood culture": ["lab", "laboratory", "infectious_disease"],
  "coagulation": ["lab", "laboratory", "hematology"],
  "electrolytes": ["lab", "laboratory"],
  "vitamin d": ["lab", "laboratory"],
  "iron studies": ["lab", "laboratory", "hematology"],
  "ferritin": ["lab", "laboratory", "hematology"],
  
  // Imaging
  "x-ray": ["xray", "radiology", "imaging"],
  "xray": ["xray", "radiology", "imaging"],
  "chest x-ray": ["xray", "radiology", "imaging", "pulmonology"],
  "ct scan": ["ct", "radiology", "imaging"],
  "ct": ["ct", "radiology", "imaging"],
  "mri": ["mri", "radiology", "imaging"],
  "ultrasound": ["ultrasound", "radiology", "imaging"],
  "echocardiogram": ["echo", "cardiology", "imaging"],
  "echo": ["echo", "cardiology"],
  "mammogram": ["mammography", "radiology", "oncology"],
  "bone density": ["dexa", "radiology", "orthopedics"],
  "dexa scan": ["dexa", "radiology"],
  
  // Cardiac
  "ecg": ["ecg", "cardiology", "cardiac"],
  "ekg": ["ecg", "cardiology", "cardiac"],
  "electrocardiogram": ["ecg", "cardiology"],
  "stress test": ["cardiology", "cardiac_stress"],
  "holter monitor": ["cardiology", "holter"],
  
  // Other
  "endoscopy": ["endoscopy", "gastroenterology"],
  "colonoscopy": ["colonoscopy", "gastroenterology"],
  "biopsy": ["pathology", "surgery"],
  "spirometry": ["pulmonology", "respiratory"],
  "lung function": ["pulmonology", "spirometry"],
  "allergy test": ["allergy", "immunology"],
  "hearing test": ["audiology", "ent"],
  "eye exam": ["ophthalmology", "eye_care"],
  "pregnancy test": ["obstetrics", "gynecology", "lab"],
  "pap smear": ["gynecology", "obstetrics"],
};

/**
 * Maps symptoms to relevant specialties
 */
const SYMPTOM_TO_SPECIALTY_MAP: Record<string, string[]> = {
  // Cardiac
  "chest pain": ["cardiology", "emergency"],
  "heart palpitations": ["cardiology"],
  "shortness of breath": ["cardiology", "pulmonology", "emergency"],
  "high blood pressure": ["cardiology", "internal_medicine"],
  
  // Respiratory
  "cough": ["pulmonology", "internal_medicine", "ent"],
  "wheezing": ["pulmonology", "allergy"],
  "difficulty breathing": ["pulmonology", "emergency"],
  
  // Gastrointestinal
  "abdominal pain": ["gastroenterology", "surgery"],
  "nausea": ["gastroenterology", "internal_medicine"],
  "vomiting": ["gastroenterology", "emergency"],
  "diarrhea": ["gastroenterology", "internal_medicine"],
  "constipation": ["gastroenterology"],
  "heartburn": ["gastroenterology"],
  
  // Neurological
  "headache": ["neurology", "internal_medicine"],
  "migraine": ["neurology"],
  "dizziness": ["neurology", "ent"],
  "numbness": ["neurology"],
  "seizure": ["neurology", "emergency"],
  
  // Musculoskeletal
  "back pain": ["orthopedics", "neurology", "physical_therapy"],
  "joint pain": ["orthopedics", "rheumatology"],
  "muscle pain": ["orthopedics", "internal_medicine"],
  
  // Dermatological
  "rash": ["dermatology", "allergy"],
  "skin irritation": ["dermatology"],
  "itching": ["dermatology", "allergy"],
  
  // Urological
  "painful urination": ["urology", "nephrology"],
  "frequent urination": ["urology", "endocrinology"],
  "blood in urine": ["urology", "nephrology", "emergency"],
  
  // ENT
  "sore throat": ["ent", "internal_medicine"],
  "ear pain": ["ent"],
  "hearing loss": ["ent", "audiology"],
  "nasal congestion": ["ent", "allergy"],
  
  // General
  "fever": ["internal_medicine", "infectious_disease", "emergency"],
  "fatigue": ["internal_medicine", "endocrinology"],
  "weight loss": ["internal_medicine", "oncology", "endocrinology"],
  "weight gain": ["endocrinology", "internal_medicine"],
};

// ============================================================================
// Matching Functions
// ============================================================================

/**
 * Find clinics that match the required tests
 */
export async function matchClinicsToTests(
  requiredTests: string[],
  governorate: string,
  limit: number = 10
): Promise<MatchedFacility[]> {
  const db = await getDb();
  if (!db) return [];
  
  // Get all services needed for the tests
  const neededServices = new Set<string>();
  requiredTests.forEach(test => {
    const testLower = test.toLowerCase();
    Object.entries(TEST_TO_SERVICE_MAP).forEach(([key, services]) => {
      if (testLower.includes(key) || key.includes(testLower)) {
        services.forEach(s => neededServices.add(s));
      }
    });
  });
  
  // If no specific services found, default to lab
  if (neededServices.size === 0 && requiredTests.length > 0) {
    neededServices.add('lab');
    neededServices.add('laboratory');
  }
  
  // Query clinics in the governorate
  const clinics = await db.select()
    .from(iraqClinics)
    .where(
      and(
        eq(iraqClinics.governorate, governorate),
        eq(iraqClinics.isActive, true)
      )
    )
    .orderBy(desc(iraqClinics.bedCount))
    .limit(50);
  
  // Score each clinic
  const scoredClinics: MatchedFacility[] = clinics.map((clinic: any) => {
    const services = clinic.services ? JSON.parse(clinic.services) : [];
    const specialties = clinic.specialties ? JSON.parse(clinic.specialties) : [];
    
    let score = 0;
    const matchReasons: string[] = [];
    const matchedServices: string[] = [];
    const matchedSpecialties: string[] = [];
    
    // Check service matches
    services.forEach((service: string) => {
      const serviceLower = service.toLowerCase();
      neededServices.forEach(needed => {
        if (serviceLower.includes(needed) || needed.includes(serviceLower)) {
          score += 20;
          if (!matchedServices.includes(service)) {
            matchedServices.push(service);
          }
        }
      });
    });
    
    // Bonus for lab facilities
    if (services.some((s: string) => s.toLowerCase().includes('lab'))) {
      score += 15;
      matchReasons.push('Has laboratory services');
    }
    
    // Bonus for radiology
    if (services.some((s: string) => 
      s.toLowerCase().includes('xray') || 
      s.toLowerCase().includes('radiology') ||
      s.toLowerCase().includes('imaging')
    )) {
      score += 10;
      matchReasons.push('Has imaging/radiology');
    }
    
    // Bonus for 24-hour service
    if (clinic.has24Hours) {
      score += 5;
    }
    
    // Bonus for larger facilities (more likely to have comprehensive services)
    if (clinic.bedCount && clinic.bedCount > 100) {
      score += 10;
    }
    
    // Cap score at 100
    score = Math.min(score, 100);
    
    // Add default reason if no specific matches
    if (matchReasons.length === 0 && score > 0) {
      matchReasons.push('General healthcare facility');
    }
    
    return {
      id: clinic.id,
      name: clinic.name,
      nameArabic: clinic.nameArabic,
      type: clinic.facilityType,
      address: clinic.address,
      phone: clinic.phone,
      hasEmergency: clinic.hasEmergency,
      has24Hours: clinic.has24Hours,
      bedCount: clinic.bedCount,
      matchScore: score,
      matchReasons,
      matchedServices,
      matchedSpecialties
    };
  });
  
  // Sort by score and return top matches
  return scoredClinics
    .filter(c => c.matchScore > 0)
    .sort((a, b) => b.matchScore - a.matchScore)
    .slice(0, limit);
}

/**
 * Find clinics that match symptoms
 */
export async function matchClinicsToSymptoms(
  symptoms: string[],
  governorate: string,
  limit: number = 10
): Promise<MatchedFacility[]> {
  const db = await getDb();
  if (!db) return [];
  
  // Get relevant specialties for symptoms
  const neededSpecialties = new Set<string>();
  symptoms.forEach(symptom => {
    const symptomLower = symptom.toLowerCase();
    Object.entries(SYMPTOM_TO_SPECIALTY_MAP).forEach(([key, specialties]) => {
      if (symptomLower.includes(key) || key.includes(symptomLower)) {
        specialties.forEach(s => neededSpecialties.add(s));
      }
    });
  });
  
  // Query clinics
  const clinics = await db.select()
    .from(iraqClinics)
    .where(
      and(
        eq(iraqClinics.governorate, governorate),
        eq(iraqClinics.isActive, true)
      )
    )
    .orderBy(desc(iraqClinics.bedCount))
    .limit(50);
  
  // Score each clinic
  const scoredClinics: MatchedFacility[] = clinics.map((clinic: any) => {
    const specialties = clinic.specialties ? JSON.parse(clinic.specialties) : [];
    const services = clinic.services ? JSON.parse(clinic.services) : [];
    
    let score = 0;
    const matchReasons: string[] = [];
    const matchedServices: string[] = [];
    const matchedSpecialties: string[] = [];
    
    // Check specialty matches
    specialties.forEach((specialty: string) => {
      const specLower = specialty.toLowerCase();
      neededSpecialties.forEach(needed => {
        if (specLower.includes(needed) || needed.includes(specLower)) {
          score += 25;
          if (!matchedSpecialties.includes(specialty)) {
            matchedSpecialties.push(specialty);
            matchReasons.push(`Has ${specialty} specialty`);
          }
        }
      });
    });
    
    // Bonus for emergency services if critical symptoms
    const hasCriticalSymptom = symptoms.some(s => 
      s.toLowerCase().includes('chest pain') ||
      s.toLowerCase().includes('difficulty breathing') ||
      s.toLowerCase().includes('severe')
    );
    
    if (hasCriticalSymptom && clinic.hasEmergency) {
      score += 20;
      matchReasons.push('Has emergency services');
    }
    
    // Bonus for 24-hour service
    if (clinic.has24Hours) {
      score += 5;
    }
    
    score = Math.min(score, 100);
    
    return {
      id: clinic.id,
      name: clinic.name,
      nameArabic: clinic.nameArabic,
      type: clinic.facilityType,
      address: clinic.address,
      phone: clinic.phone,
      hasEmergency: clinic.hasEmergency,
      has24Hours: clinic.has24Hours,
      bedCount: clinic.bedCount,
      matchScore: score,
      matchReasons,
      matchedServices,
      matchedSpecialties
    };
  });
  
  return scoredClinics
    .filter(c => c.matchScore > 0)
    .sort((a, b) => b.matchScore - a.matchScore)
    .slice(0, limit);
}

/**
 * Comprehensive clinic matching based on all criteria
 */
export async function matchClinicsComprehensive(
  criteria: MatchCriteria
): Promise<{
  clinics: MatchedFacility[];
  hospitals: MatchedFacility[];
  pharmacies: MatchedFacility[];
}> {
  const db = await getDb();
  if (!db) {
    return { clinics: [], hospitals: [], pharmacies: [] };
  }
  
  // Get all clinics in governorate
  let allFacilities = await db.select()
    .from(iraqClinics)
    .where(
      and(
        eq(iraqClinics.governorate, criteria.governorate),
        eq(iraqClinics.isActive, true)
      )
    )
    .orderBy(desc(iraqClinics.bedCount))
    .limit(100);
  
  // Fallback: if no facilities found in specific governorate, get from Baghdad or any active facilities
  if (allFacilities.length === 0) {
    allFacilities = await db.select()
      .from(iraqClinics)
      .where(eq(iraqClinics.isActive, true))
      .orderBy(desc(iraqClinics.bedCount))
      .limit(100);
  }
  
  // Get needed services from tests
  const neededServices = new Set<string>();
  criteria.requiredTests.forEach(test => {
    const testLower = test.toLowerCase();
    Object.entries(TEST_TO_SERVICE_MAP).forEach(([key, services]) => {
      if (testLower.includes(key) || key.includes(testLower)) {
        services.forEach(s => neededServices.add(s));
      }
    });
  });
  
  // Get needed specialties from symptoms
  const neededSpecialties = new Set<string>();
  criteria.symptoms.forEach(symptom => {
    const symptomLower = symptom.toLowerCase();
    Object.entries(SYMPTOM_TO_SPECIALTY_MAP).forEach(([key, specialties]) => {
      if (symptomLower.includes(key) || key.includes(symptomLower)) {
        specialties.forEach(s => neededSpecialties.add(s));
      }
    });
  });
  
  // Add specified specialty
  if (criteria.specialty) {
    neededSpecialties.add(criteria.specialty.toLowerCase());
  }
  
  // Score all facilities
  const scoredFacilities: MatchedFacility[] = allFacilities.map((facility: any) => {
    const services = facility.services ? JSON.parse(facility.services) : [];
    const specialties = facility.specialties ? JSON.parse(facility.specialties) : [];
    
    let score = 30; // Base score
    const matchReasons: string[] = [];
    const matchedServices: string[] = [];
    const matchedSpecialties: string[] = [];
    
    // Service matching (for tests)
    services.forEach((service: string) => {
      const serviceLower = service.toLowerCase();
      neededServices.forEach(needed => {
        if (serviceLower.includes(needed) || needed.includes(serviceLower)) {
          score += 15;
          if (!matchedServices.includes(service)) {
            matchedServices.push(service);
          }
        }
      });
    });
    
    // Specialty matching (for symptoms)
    specialties.forEach((specialty: string) => {
      const specLower = specialty.toLowerCase();
      neededSpecialties.forEach(needed => {
        if (specLower.includes(needed) || needed.includes(specLower)) {
          score += 20;
          if (!matchedSpecialties.includes(specialty)) {
            matchedSpecialties.push(specialty);
          }
        }
      });
    });
    
    // Urgency-based scoring
    if (criteria.urgencyLevel === 'critical' || criteria.urgencyLevel === 'high') {
      if (facility.hasEmergency) {
        score += 25;
        matchReasons.push('Emergency services available');
      }
      if (facility.has24Hours) {
        score += 15;
        matchReasons.push('24-hour service');
      }
      // Prefer larger hospitals for critical cases
      if (facility.bedCount && facility.bedCount > 200) {
        score += 10;
      }
    }
    
    // Build match reasons
    if (matchedServices.length > 0) {
      matchReasons.push(`Offers: ${matchedServices.slice(0, 3).join(', ')}`);
    }
    if (matchedSpecialties.length > 0) {
      matchReasons.push(`Specialties: ${matchedSpecialties.slice(0, 3).join(', ')}`);
    }
    
    if (matchReasons.length === 0) {
      matchReasons.push('General healthcare facility');
    }
    
    score = Math.min(score, 100);
    
    return {
      id: facility.id,
      name: facility.name,
      nameArabic: facility.nameArabic,
      type: facility.facilityType,
      address: facility.address,
      phone: facility.phone,
      hasEmergency: facility.hasEmergency,
      has24Hours: facility.has24Hours,
      bedCount: facility.bedCount,
      matchScore: score,
      matchReasons,
      matchedServices,
      matchedSpecialties
    };
  });
  
  // Separate into clinics and hospitals
  const hospitals = scoredFacilities
    .filter(f => 
      f.type.includes('hospital') || 
      f.type === 'medical_city' || 
      f.type === 'emergency_center'
    )
    .sort((a, b) => b.matchScore - a.matchScore)
    .slice(0, 5);
  
  const clinics = scoredFacilities
    .filter(f => 
      f.type === 'clinic' || 
      f.type === 'health_center' ||
      f.type === 'specialized_hospital'
    )
    .sort((a, b) => b.matchScore - a.matchScore)
    .slice(0, 5);
  
  // If not enough clinics, include some hospitals
  if (clinics.length < 3) {
    const additionalFacilities = scoredFacilities
      .filter(f => !clinics.includes(f) && !hospitals.includes(f))
      .sort((a, b) => b.matchScore - a.matchScore)
      .slice(0, 3 - clinics.length);
    clinics.push(...additionalFacilities);
  }
  
  return {
    clinics,
    hospitals: criteria.urgencyLevel === 'critical' || criteria.urgencyLevel === 'high' 
      ? hospitals 
      : hospitals.slice(0, 2),
    pharmacies: [] // Would need pharmacy data
  };
}

export {
  TEST_TO_SERVICE_MAP,
  SYMPTOM_TO_SPECIALTY_MAP
};
