/**
 * BRAIN Knowledge Adapter
 * 
 * Bridges the new structured knowledge system with BRAIN's existing interface.
 * This allows BRAIN to use database-backed knowledge instead of embedded knowledge.
 */

import {
  getKnowledgeContextForBrain,
  formatKnowledgeForPrompt,
  getDiseaseByIcdCode,
  searchSymptoms,
  getRedFlagSymptoms,
  checkRedFlags,
  getDifferentialDiagnosis,
  getTreatmentRecommendations,
  type Disease,
  type Symptom,
} from '../knowledge-query';
import { medicalKnowledge, type MedicalConcept } from './knowledge/medical-knowledge';

/**
 * Enhanced symptom normalization using both old and new knowledge systems
 */
export async function normalizeSymptoms(symptoms: string[]): Promise<Array<{
  original: string;
  conceptId: string;
  standardTerm: string;
  source: string;
  symptomData?: Symptom;
}>> {
  const normalized = [];
  
  for (const symptom of symptoms) {
    // Try new knowledge system first
    const newKnowledgeResults = await searchSymptoms(symptom);
    
    if (newKnowledgeResults.length > 0) {
      const matchedSymptom = newKnowledgeResults[0];
      normalized.push({
        original: symptom,
        conceptId: `SYM-${matchedSymptom.id}`,
        standardTerm: matchedSymptom.nameEn,
        source: 'MediTriage Knowledge Base',
        symptomData: matchedSymptom,
      });
    } else {
      // Fallback to old BRAIN knowledge system
      const concepts = await medicalKnowledge.findConcept(symptom);
      if (concepts.length > 0) {
        normalized.push({
          original: symptom,
          conceptId: concepts[0].conceptId,
          standardTerm: concepts[0].conceptName,
          source: concepts[0].source,
        });
      } else {
        // If no exact match, still include the symptom
        normalized.push({
          original: symptom,
          conceptId: `UNKNOWN-${Date.now()}`,
          standardTerm: symptom,
          source: 'User Input',
        });
      }
    }
  }

  return normalized;
}

/**
 * Find diagnoses using new knowledge system
 */
export async function findDiagnosesFromNewKnowledge(normalizedSymptoms: Array<{
  original: string;
  conceptId: string;
  standardTerm: string;
  source: string;
  symptomData?: Symptom;
}>): Promise<Array<{
  diagnosis: {
    conceptId: string;
    conceptName: string;
    icd10: string;
    source: string;
  };
  confidence: number;
  matchingSymptoms: number;
  diseaseData: Disease;
}>> {
  // Extract symptom IDs from normalized symptoms
  const symptomIds = normalizedSymptoms
    .filter(s => s.symptomData)
    .map(s => s.symptomData!.id);
  
  if (symptomIds.length === 0) return [];
  
  // Get differential diagnosis from new knowledge system
  const differentialDx = await getDifferentialDiagnosis(symptomIds);
  
  // Format for BRAIN compatibility
  return differentialDx.map(match => ({
    diagnosis: {
      conceptId: match.disease.icdCode,
      conceptName: match.disease.nameEn,
      icd10: match.disease.icdCode,
      source: 'MediTriage Knowledge Base',
    },
    confidence: match.matchScore,
    matchingSymptoms: match.matchingSymptoms,
    diseaseData: match.disease,
  }));
}

/**
 * Check for red flags using new knowledge system
 */
export async function checkRedFlagsEnhanced(normalizedSymptoms: Array<{
  original: string;
  conceptId: string;
  standardTerm: string;
  source: string;
  symptomData?: Symptom;
}>): Promise<{
  hasRedFlags: boolean;
  redFlags: string[];
  urgencyLevel: 'immediate' | 'urgent' | 'routine';
  detailedRedFlags: any[];
}> {
  // Extract symptom IDs
  const symptomIds = normalizedSymptoms
    .filter(s => s.symptomData)
    .map(s => s.symptomData!.id);
  
  if (symptomIds.length === 0) {
    return {
      hasRedFlags: false,
      redFlags: [],
      urgencyLevel: 'routine',
      detailedRedFlags: [],
    };
  }
  
  // Check red flags using new knowledge system
  const redFlagCheck = await checkRedFlags(symptomIds);
  
  return {
    hasRedFlags: redFlagCheck.hasRedFlags,
    redFlags: redFlagCheck.redFlags.map(f => f.nameEn),
    urgencyLevel: redFlagCheck.urgencyLevel,
    detailedRedFlags: redFlagCheck.redFlags,
  };
}

/**
 * Generate enhanced context for BRAIN using new knowledge system
 */
export async function generateEnhancedContext(
  normalizedSymptoms: Array<{
    original: string;
    conceptId: string;
    standardTerm: string;
    source: string;
    symptomData?: Symptom;
  }>,
  patientInfo: {
    age: number;
    gender: 'male' | 'female' | 'other';
    medicalHistory?: string[];
    location?: string;
  }
): Promise<{
  knowledgeContext: string;
  structuredData: any;
}> {
  // Extract symptom IDs
  const symptomIds = normalizedSymptoms
    .filter(s => s.symptomData)
    .map(s => s.symptomData!.id);
  
  if (symptomIds.length === 0) {
    return {
      knowledgeContext: '',
      structuredData: null,
    };
  }
  
  // Get comprehensive knowledge context
  const knowledge = await getKnowledgeContextForBrain(symptomIds);
  
  // Format for LLM prompt
  const knowledgePrompt = formatKnowledgeForPrompt(knowledge);
  
  // Add patient-specific context
  const enhancedPrompt = `
${knowledgePrompt}

## Patient Context
- **Age:** ${patientInfo.age} years
- **Gender:** ${patientInfo.gender}
- **Location:** ${patientInfo.location || 'Iraq'}
${patientInfo.medicalHistory && patientInfo.medicalHistory.length > 0 
  ? `- **Medical History:** ${patientInfo.medicalHistory.join(', ')}` 
  : ''}

## Iraqi Healthcare Context
- Consider common diseases in Iraq: diabetes, hypertension, infectious diseases (gastroenteritis, typhoid, hepatitis)
- Consider medication availability and cost in Iraqi context
- Consider cultural and social factors affecting healthcare access
- Consider seasonal patterns (heat-related illness in summer, respiratory infections in winter)
`;
  
  return {
    knowledgeContext: enhancedPrompt,
    structuredData: knowledge,
  };
}

/**
 * Get treatment recommendations using new knowledge system
 */
export async function getTreatmentRecommendationsEnhanced(
  primaryDiagnosis: string,
  icd10Code?: string
): Promise<{
  medications: any[];
  guidelines: any[];
  disease: Disease | null;
}> {
  if (!icd10Code) {
    return {
      medications: [],
      guidelines: [],
      disease: null,
    };
  }
  
  const recommendations = await getTreatmentRecommendations(icd10Code);
  
  if (!recommendations) {
    return {
      medications: [],
      guidelines: [],
      disease: null,
    };
  }
  
  return {
    medications: recommendations.medications,
    guidelines: recommendations.guidelines,
    disease: recommendations.disease,
  };
}

/**
 * Hybrid knowledge lookup: tries new system first, falls back to old
 */
export async function hybridKnowledgeLookup(
  symptoms: string[],
  patientInfo: {
    age: number;
    gender: 'male' | 'female' | 'other';
    medicalHistory?: string[];
    location?: string;
  }
): Promise<{
  normalizedSymptoms: any[];
  diagnoses: any[];
  redFlagCheck: any;
  enhancedContext: any;
  usingNewKnowledge: boolean;
}> {
  // Step 1: Normalize symptoms (hybrid approach)
  const normalizedSymptoms = await normalizeSymptoms(symptoms);
  
  // Check if we have any symptoms from new knowledge system
  const hasNewKnowledgeSymptoms = normalizedSymptoms.some(s => s.symptomData);
  
  if (hasNewKnowledgeSymptoms) {
    // Use new knowledge system
    console.log('🔬 Using new structured knowledge system');
    
    const [diagnoses, redFlagCheck, enhancedContext] = await Promise.all([
      findDiagnosesFromNewKnowledge(normalizedSymptoms),
      checkRedFlagsEnhanced(normalizedSymptoms),
      generateEnhancedContext(normalizedSymptoms, patientInfo),
    ]);
    
    return {
      normalizedSymptoms,
      diagnoses,
      redFlagCheck,
      enhancedContext,
      usingNewKnowledge: true,
    };
  } else {
    // Fallback to old knowledge system
    console.log('📚 Falling back to legacy knowledge system');
    
    return {
      normalizedSymptoms,
      diagnoses: [],
      redFlagCheck: {
        hasRedFlags: false,
        redFlags: [],
        urgencyLevel: 'routine' as const,
        detailedRedFlags: [],
      },
      enhancedContext: {
        knowledgeContext: '',
        structuredData: null,
      },
      usingNewKnowledge: false,
    };
  }
}
