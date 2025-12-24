/**
 * Medical Knowledge Query Service
 * 
 * Provides structured queries to the medical knowledge base for use by BRAIN
 * and other AI diagnostic systems. This replaces brain-embedded knowledge
 * with database-backed, maintainable knowledge.
 */

import { getDb } from './db';
import {
  diseases,
  symptoms,
  redFlags,
  medicationsKnowledge,
  symptomDiseaseAssociations,
  clinicalGuidelines,
  type Disease,
  type Symptom,
  type RedFlag,
  type MedicationKnowledge,
} from '../drizzle/schema';

// Re-export types for external use
export type { Disease, Symptom, RedFlag, MedicationKnowledge };
import { eq, like, inArray, and, or, sql } from 'drizzle-orm';

/**
 * Get disease by ICD code
 */
export async function getDiseaseByIcdCode(icdCode: string): Promise<Disease | null> {
  const db = await getDb();
  if (!db) return null;
  
  const results = await db.select().from(diseases).where(eq(diseases.icdCode, icdCode)).limit(1);
  return results[0] || null;
}

/**
 * Search diseases by name (English or Arabic)
 */
export async function searchDiseases(query: string): Promise<Disease[]> {
  const db = await getDb();
  if (!db) return [];
  
  const results = await db.select().from(diseases).where(
    or(
      like(diseases.nameEn, `%${query}%`),
      like(diseases.nameAr, `%${query}%`),
      like(diseases.localName, `%${query}%`)
    )
  ).limit(20);
  
  return results;
}

/**
 * Get diseases by category
 */
export async function getDiseasesByCategory(category: string): Promise<Disease[]> {
  const db = await getDb();
  if (!db) return [];
  
  const results = await db.select().from(diseases).where(eq(diseases.category, category));
  return results;
}

/**
 * Get diseases common in Iraq
 */
export async function getCommonIraqiDiseases(): Promise<Disease[]> {
  const db = await getDb();
  if (!db) return [];
  
  const results = await db.select().from(diseases).where(
    or(
      eq(diseases.prevalenceIraq, 'high'),
      eq(diseases.prevalenceIraq, 'medium')
    )
  );
  
  return results;
}

/**
 * Get symptoms by IDs
 */
export async function getSymptomsByIds(symptomIds: number[]): Promise<Symptom[]> {
  const db = await getDb();
  if (!db) return [];
  
  if (symptomIds.length === 0) return [];
  
  const results = await db.select().from(symptoms).where(inArray(symptoms.id, symptomIds));
  return results;
}

/**
 * Search symptoms by name
 */
export async function searchSymptoms(query: string): Promise<Symptom[]> {
  const db = await getDb();
  if (!db) return [];
  
  const results = await db.select().from(symptoms).where(
    or(
      like(symptoms.nameEn, `%${query}%`),
      like(symptoms.nameAr, `%${query}%`),
      like(symptoms.localName, `%${query}%`)
    )
  ).limit(20);
  
  return results;
}

/**
 * Get red flag symptoms
 */
export async function getRedFlagSymptoms(): Promise<Symptom[]> {
  const db = await getDb();
  if (!db) return [];
  
  const results = await db.select().from(symptoms).where(eq(symptoms.redFlagSymptom, true));
  return results;
}

/**
 * Get red flags by category
 */
export async function getRedFlagsByCategory(category: string): Promise<RedFlag[]> {
  const db = await getDb();
  if (!db) return [];
  
  const results = await db.select().from(redFlags).where(eq(redFlags.category, category));
  return results;
}

/**
 * Get red flags by urgency level
 */
export async function getRedFlagsByUrgency(urgency: 'immediate' | 'urgent' | 'semi_urgent'): Promise<RedFlag[]> {
  const db = await getDb();
  if (!db) return [];
  
  const results = await db.select().from(redFlags).where(eq(redFlags.urgencyLevel, urgency));
  return results;
}

/**
 * Check for red flags in symptoms
 */
export async function checkRedFlags(symptomIds: number[]): Promise<{
  hasRedFlags: boolean;
  redFlags: RedFlag[];
  urgencyLevel: 'immediate' | 'urgent' | 'routine';
}> {
  const db = await getDb();
  if (!db) return { hasRedFlags: false, redFlags: [], urgencyLevel: 'routine' };
  
  // Get symptoms
  const patientSymptoms = await getSymptomsByIds(symptomIds);
  
  // Check if any are red flag symptoms
  const redFlagSymptoms = patientSymptoms.filter(s => s.redFlagSymptom);
  
  if (redFlagSymptoms.length === 0) {
    return { hasRedFlags: false, redFlags: [], urgencyLevel: 'routine' };
  }
  
  // Get associated red flags
  const allRedFlags = await db.select().from(redFlags);
  const relevantRedFlags: RedFlag[] = [];
  
  for (const flag of allRedFlags) {
    // Check if this red flag is relevant to patient's symptoms
    // This is a simplified check - in production, you'd want more sophisticated matching
    relevantRedFlags.push(flag);
  }
  
  // Determine highest urgency level
  let urgencyLevel: 'immediate' | 'urgent' | 'routine' = 'routine';
  for (const flag of relevantRedFlags) {
    if (flag.urgencyLevel === 'immediate') {
      urgencyLevel = 'immediate';
      break;
    } else if (flag.urgencyLevel === 'urgent') {
      if (urgencyLevel === 'routine') {
        urgencyLevel = 'urgent';
      }
    }
  }
  
  return {
    hasRedFlags: true,
    redFlags: relevantRedFlags.slice(0, 5), // Return top 5 most relevant
    urgencyLevel,
  };
}

/**
 * Get possible diseases from symptoms (differential diagnosis)
 */
export async function getDifferentialDiagnosis(symptomIds: number[]): Promise<{
  disease: Disease;
  matchScore: number;
  matchingSymptoms: number;
}[]> {
  const db = await getDb();
  if (!db) return [];
  
  if (symptomIds.length === 0) return [];
  
  // Get all diseases
  const allDiseases = await db.select().from(diseases);
  
  // Calculate match scores
  const matches = allDiseases.map(disease => {
    const diseaseSymptoms = JSON.parse(disease.symptoms) as number[];
    const matchingSymptoms = symptomIds.filter(id => diseaseSymptoms.includes(id));
    const matchScore = matchingSymptoms.length / diseaseSymptoms.length;
    
    return {
      disease,
      matchScore,
      matchingSymptoms: matchingSymptoms.length,
    };
  });
  
  // Filter and sort by match score
  return matches
    .filter(m => m.matchingSymptoms > 0)
    .sort((a, b) => b.matchScore - a.matchScore)
    .slice(0, 10); // Return top 10 matches
}

/**
 * Get medication by generic name
 */
export async function getMedicationByName(genericName: string): Promise<MedicationKnowledge | null> {
  const db = await getDb();
  if (!db) return null;
  
  const results = await db.select().from(medicationsKnowledge)
    .where(eq(medicationsKnowledge.genericName, genericName))
    .limit(1);
  
  return results[0] || null;
}

/**
 * Search medications
 */
export async function searchMedications(query: string): Promise<MedicationKnowledge[]> {
  const db = await getDb();
  if (!db) return [];
  
  const results = await db.select().from(medicationsKnowledge).where(
    or(
      like(medicationsKnowledge.genericName, `%${query}%`),
      like(medicationsKnowledge.nameAr, `%${query}%`),
      like(medicationsKnowledge.brandNames, `%${query}%`)
    )
  ).limit(20);
  
  return results;
}

/**
 * Get medications by drug class
 */
export async function getMedicationsByClass(drugClass: string): Promise<MedicationKnowledge[]> {
  const db = await getDb();
  if (!db) return [];
  
  const results = await db.select().from(medicationsKnowledge)
    .where(eq(medicationsKnowledge.drugClass, drugClass));
  
  return results;
}

/**
 * Get medications available in Iraq
 */
export async function getAvailableMedicationsInIraq(availability: 'widely_available' | 'limited' | 'rare' | 'not_available' = 'widely_available'): Promise<MedicationKnowledge[]> {
  const db = await getDb();
  if (!db) return [];
  
  const results = await db.select().from(medicationsKnowledge)
    .where(eq(medicationsKnowledge.availabilityIraq, availability));
  
  return results;
}

/**
 * Get treatment recommendations for disease
 */
export async function getTreatmentRecommendations(icdCode: string): Promise<{
  disease: Disease;
  medications: MedicationKnowledge[];
  guidelines: any[];
} | null> {
  const db = await getDb();
  if (!db) return null;
  
  const disease = await getDiseaseByIcdCode(icdCode);
  if (!disease) return null;
  
  // Parse treatment protocol (skip if null)
  const treatmentProtocol = disease.treatmentProtocol ? JSON.parse(disease.treatmentProtocol) as any : null;
  
  // Get relevant medications (simplified - in production, you'd parse the protocol more carefully)
  const medications = await db.select().from(medicationsKnowledge)
    .where(eq(medicationsKnowledge.availabilityIraq, 'widely_available'))
    .limit(10);
  
  // Get clinical guidelines (only if diseaseIds is not null)
  const guidelines = await db.select().from(clinicalGuidelines)
    .where(sql`${clinicalGuidelines.diseaseIds} IS NOT NULL AND ${clinicalGuidelines.diseaseIds} LIKE ${`%${icdCode}%`}`)
    .limit(5);
  
  return {
    disease,
    medications,
    guidelines,
  };
}

/**
 * Get knowledge context for BRAIN
 * This provides a comprehensive knowledge package for AI diagnostic reasoning
 */
export async function getKnowledgeContextForBrain(symptomIds: number[]): Promise<{
  symptoms: Symptom[];
  possibleDiseases: {
    disease: Disease;
    matchScore: number;
    matchingSymptoms: number;
  }[];
  redFlagCheck: {
    hasRedFlags: boolean;
    redFlags: RedFlag[];
    urgencyLevel: 'immediate' | 'urgent' | 'routine';
  };
  commonIraqiDiseases: Disease[];
}> {
  const [
    symptoms,
    possibleDiseases,
    redFlagCheck,
    commonIraqiDiseases,
  ] = await Promise.all([
    getSymptomsByIds(symptomIds),
    getDifferentialDiagnosis(symptomIds),
    checkRedFlags(symptomIds),
    getCommonIraqiDiseases(),
  ]);
  
  return {
    symptoms,
    possibleDiseases,
    redFlagCheck,
    commonIraqiDiseases,
  };
}

/**
 * Format knowledge for LLM prompt
 * Converts structured knowledge into natural language for AI consumption
 */
export function formatKnowledgeForPrompt(knowledge: {
  symptoms: Symptom[];
  possibleDiseases: {
    disease: Disease;
    matchScore: number;
    matchingSymptoms: number;
  }[];
  redFlagCheck: {
    hasRedFlags: boolean;
    redFlags: RedFlag[];
    urgencyLevel: 'immediate' | 'urgent' | 'routine';
  };
  commonIraqiDiseases: Disease[];
}): string {
  let prompt = '# Medical Knowledge Context\n\n';
  
  // Symptoms
  prompt += '## Patient Symptoms\n';
  knowledge.symptoms.forEach(symptom => {
    prompt += `- **${symptom.nameEn}** (${symptom.nameAr}): ${symptom.description || 'No description'}\n`;
    if (symptom.redFlagSymptom) {
      prompt += `  ⚠️ RED FLAG SYMPTOM - Urgency: ${symptom.urgencyLevel}\n`;
    }
  });
  prompt += '\n';
  
  // Red flags
  if (knowledge.redFlagCheck.hasRedFlags) {
    prompt += '## ⚠️ RED FLAGS DETECTED\n';
    prompt += `**Urgency Level: ${knowledge.redFlagCheck.urgencyLevel.toUpperCase()}**\n\n`;
    knowledge.redFlagCheck.redFlags.forEach(flag => {
      prompt += `- **${flag.nameEn}**: ${flag.clinicalSignificance}\n`;
      prompt += `  - Recommended Action: ${flag.recommendedAction}\n`;
      prompt += `  - Time to Treatment: ${flag.timeToTreatment || 'Immediate'}\n`;
    });
    prompt += '\n';
  }
  
  // Differential diagnosis
  prompt += '## Differential Diagnosis (Top Matches)\n';
  knowledge.possibleDiseases.slice(0, 5).forEach((match, index) => {
    const disease = match.disease;
    prompt += `${index + 1}. **${disease.nameEn}** (${disease.nameAr}) - ICD: ${disease.icdCode}\n`;
    prompt += `   - Match Score: ${(match.matchScore * 100).toFixed(1)}% (${match.matchingSymptoms} matching symptoms)\n`;
    prompt += `   - Prevalence in Iraq: ${disease.prevalenceIraq || 'Unknown'}\n`;
    prompt += `   - Description: ${disease.description}\n`;
    if (disease.specialConsiderations) {
      prompt += `   - Iraqi Context: ${disease.specialConsiderations}\n`;
    }
    prompt += '\n';
  });
  
  // Common Iraqi diseases
  prompt += '## Common Diseases in Iraqi Context\n';
  knowledge.commonIraqiDiseases.slice(0, 5).forEach(disease => {
    prompt += `- **${disease.nameEn}** (${disease.nameAr}): ${disease.description.substring(0, 150)}...\n`;
  });
  prompt += '\n';
  
  return prompt;
}
