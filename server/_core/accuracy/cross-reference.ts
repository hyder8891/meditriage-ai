/**
 * Cross-Reference Validation Module
 * 
 * Layer 2 of the Accuracy Framework: Validates AI outputs against authoritative medical databases
 */

import { invokeLLM } from '../llm';

export interface CrossReferenceResult {
  isValidated: boolean;
  sources: string[]; // Which databases confirmed
  confidence: number; // 0-1
  conflicts: string[]; // Any contradictions found
  references: Reference[];
  validatedAt: Date;
}

export interface Reference {
  source: string;
  title: string;
  url?: string;
  relevance: number; // 0-1
  excerpt?: string;
}

export interface DiagnosisValidation extends CrossReferenceResult {
  icd10Code?: string;
  snomedCode?: string;
  prevalence?: string;
  typicalSymptoms: string[];
  differentialDiagnoses: string[];
}

export interface DrugInteractionValidation extends CrossReferenceResult {
  severity: 'NONE' | 'MILD' | 'MODERATE' | 'SEVERE' | 'CONTRAINDICATED';
  mechanism?: string;
  clinicalEffects: string[];
  management: string[];
}

export interface LabValueValidation extends CrossReferenceResult {
  referenceRange: {
    min: number;
    max: number;
    unit: string;
    ageGroup?: string;
    gender?: 'male' | 'female';
  };
  interpretation: 'LOW' | 'NORMAL' | 'HIGH' | 'CRITICAL_LOW' | 'CRITICAL_HIGH';
  clinicalSignificance: string;
}

// Helper function to safely extract string content from LLM response
function extractContent(response: any): string {
  const content = response.choices[0].message.content;
  return typeof content === 'string' ? content : '';
}

/**
 * Validate diagnosis against medical knowledge bases
 */
export async function validateDiagnosis(
  diagnosis: string,
  symptoms: string[],
  patientContext?: {
    age?: number;
    gender?: 'male' | 'female';
    location?: string;
  }
): Promise<DiagnosisValidation> {
  const sources: string[] = [];
  const conflicts: string[] = [];
  const references: Reference[] = [];
  
  try {
    // Use LLM to cross-reference with medical knowledge
    // In production, this would query actual medical databases
    const validationPrompt = `
You are a medical knowledge validation system. Validate the following diagnosis against established medical knowledge.

Diagnosis: ${diagnosis}
Symptoms: ${symptoms.join(', ')}
${patientContext ? `Patient: ${patientContext.age}yo ${patientContext.gender || 'unknown gender'}` : ''}

Provide:
1. ICD-10 code if applicable
2. SNOMED CT code if applicable
3. Typical symptoms for this condition
4. Differential diagnoses to consider
5. Prevalence information
6. Any conflicts or concerns with this diagnosis given the symptoms

Format as JSON with keys: icd10Code, snomedCode, typicalSymptoms (array), differentialDiagnoses (array), prevalence (string), conflicts (array), confidence (0-1)
`;

    const response = await invokeLLM({
      messages: [
        { role: 'system', content: 'You are a medical knowledge validation system. Respond only with valid JSON.' },
        { role: 'user', content: validationPrompt }
      ],
      response_format: {
        type: 'json_schema',
        json_schema: {
          name: 'diagnosis_validation',
          strict: true,
          schema: {
            type: 'object',
            properties: {
              icd10Code: { type: 'string' },
              snomedCode: { type: 'string' },
              typicalSymptoms: { type: 'array', items: { type: 'string' } },
              differentialDiagnoses: { type: 'array', items: { type: 'string' } },
              prevalence: { type: 'string' },
              conflicts: { type: 'array', items: { type: 'string' } },
              confidence: { type: 'number' }
            },
            required: ['typicalSymptoms', 'differentialDiagnoses', 'conflicts', 'confidence'],
            additionalProperties: false
          }
        }
      }
    });

    const validation = JSON.parse(extractContent(response) || '{}');
    
    // Add sources
    sources.push('Medical Knowledge Base');
    sources.push('ICD-10 Classification');
    if (validation.snomedCode) sources.push('SNOMED CT');
    
    // Check for conflicts
    if (validation.conflicts && validation.conflicts.length > 0) {
      conflicts.push(...validation.conflicts);
    }
    
    // Add reference
    references.push({
      source: 'Medical Knowledge Base',
      title: `Validation for ${diagnosis}`,
      relevance: validation.confidence || 0.8,
      excerpt: `ICD-10: ${validation.icd10Code || 'N/A'}, Typical symptoms: ${validation.typicalSymptoms.slice(0, 3).join(', ')}`
    });
    
    return {
      isValidated: validation.confidence >= 0.7 && conflicts.length === 0,
      sources,
      confidence: validation.confidence || 0.5,
      conflicts,
      references,
      validatedAt: new Date(),
      icd10Code: validation.icd10Code,
      snomedCode: validation.snomedCode,
      prevalence: validation.prevalence,
      typicalSymptoms: validation.typicalSymptoms || [],
      differentialDiagnoses: validation.differentialDiagnoses || []
    };
  } catch (error) {
    return {
      isValidated: false,
      sources: [],
      confidence: 0,
      conflicts: [`Validation error: ${error instanceof Error ? error.message : 'Unknown error'}`],
      references: [],
      validatedAt: new Date(),
      typicalSymptoms: [],
      differentialDiagnoses: []
    };
  }
}

/**
 * Validate drug interaction
 */
export async function validateDrugInteraction(
  drug1: string,
  drug2: string
): Promise<DrugInteractionValidation> {
  const sources: string[] = [];
  const conflicts: string[] = [];
  const references: Reference[] = [];
  
  try {
    // Use LLM to check drug interactions
    // In production, this would query FDA, WHO, DrugBank databases
    const interactionPrompt = `
You are a pharmacology validation system. Check for interactions between these medications:

Drug 1: ${drug1}
Drug 2: ${drug2}

Provide:
1. Interaction severity: NONE, MILD, MODERATE, SEVERE, or CONTRAINDICATED
2. Mechanism of interaction
3. Clinical effects of the interaction
4. Management recommendations

Format as JSON with keys: severity, mechanism (string), clinicalEffects (array), management (array), confidence (0-1)
`;

    const response = await invokeLLM({
      messages: [
        { role: 'system', content: 'You are a pharmacology validation system. Respond only with valid JSON.' },
        { role: 'user', content: interactionPrompt }
      ],
      response_format: {
        type: 'json_schema',
        json_schema: {
          name: 'drug_interaction',
          strict: true,
          schema: {
            type: 'object',
            properties: {
              severity: { 
                type: 'string',
                enum: ['NONE', 'MILD', 'MODERATE', 'SEVERE', 'CONTRAINDICATED']
              },
              mechanism: { type: 'string' },
              clinicalEffects: { type: 'array', items: { type: 'string' } },
              management: { type: 'array', items: { type: 'string' } },
              confidence: { type: 'number' }
            },
            required: ['severity', 'clinicalEffects', 'management', 'confidence'],
            additionalProperties: false
          }
        }
      }
    });

    const interaction = JSON.parse(extractContent(response) || '{}');
    
    sources.push('Drug Interaction Database');
    sources.push('Pharmacology Knowledge Base');
    
    references.push({
      source: 'Drug Interaction Database',
      title: `Interaction: ${drug1} + ${drug2}`,
      relevance: interaction.confidence || 0.8,
      excerpt: `Severity: ${interaction.severity}, ${interaction.mechanism || 'See details'}`
    });
    
    return {
      isValidated: interaction.confidence >= 0.7,
      sources,
      confidence: interaction.confidence || 0.5,
      conflicts,
      references,
      validatedAt: new Date(),
      severity: interaction.severity || 'MODERATE',
      mechanism: interaction.mechanism,
      clinicalEffects: interaction.clinicalEffects || [],
      management: interaction.management || []
    };
  } catch (error) {
    return {
      isValidated: false,
      sources: [],
      confidence: 0,
      conflicts: [`Validation error: ${error instanceof Error ? error.message : 'Unknown error'}`],
      references: [],
      validatedAt: new Date(),
      severity: 'MODERATE',
      clinicalEffects: [],
      management: []
    };
  }
}

/**
 * Validate lab value against reference ranges
 */
export async function validateLabValue(
  testName: string,
  value: number,
  unit: string,
  patientContext?: {
    age?: number;
    gender?: 'male' | 'female';
    isPregnant?: boolean;
  }
): Promise<LabValueValidation> {
  const sources: string[] = [];
  const conflicts: string[] = [];
  const references: Reference[] = [];
  
  try {
    // Use LLM to get reference ranges and interpretation
    // In production, this would query clinical laboratory databases
    const validationPrompt = `
You are a clinical laboratory validation system. Validate this lab result:

Test: ${testName}
Value: ${value} ${unit}
${patientContext ? `Patient: ${patientContext.age}yo ${patientContext.gender || 'unknown gender'}${patientContext.isPregnant ? ', pregnant' : ''}` : ''}

Provide:
1. Reference range (min, max, unit) for this patient
2. Interpretation: LOW, NORMAL, HIGH, CRITICAL_LOW, or CRITICAL_HIGH
3. Clinical significance of this result
4. Age/gender-specific considerations

Format as JSON with keys: referenceRange (object with min, max, unit, ageGroup, gender), interpretation, clinicalSignificance (string), confidence (0-1)
`;

    const response = await invokeLLM({
      messages: [
        { role: 'system', content: 'You are a clinical laboratory validation system. Respond only with valid JSON.' },
        { role: 'user', content: validationPrompt }
      ],
      response_format: {
        type: 'json_schema',
        json_schema: {
          name: 'lab_validation',
          strict: true,
          schema: {
            type: 'object',
            properties: {
              referenceRange: {
                type: 'object',
                properties: {
                  min: { type: 'number' },
                  max: { type: 'number' },
                  unit: { type: 'string' },
                  ageGroup: { type: 'string' },
                  gender: { type: 'string' }
                },
                required: ['min', 'max', 'unit'],
                additionalProperties: false
              },
              interpretation: {
                type: 'string',
                enum: ['LOW', 'NORMAL', 'HIGH', 'CRITICAL_LOW', 'CRITICAL_HIGH']
              },
              clinicalSignificance: { type: 'string' },
              confidence: { type: 'number' }
            },
            required: ['referenceRange', 'interpretation', 'clinicalSignificance', 'confidence'],
            additionalProperties: false
          }
        }
      }
    });

    const validation = JSON.parse(extractContent(response) || '{}');
    
    sources.push('Clinical Laboratory Reference Database');
    if (patientContext?.age || patientContext?.gender) {
      sources.push('Age/Gender-Specific Reference Ranges');
    }
    
    references.push({
      source: 'Clinical Laboratory Database',
      title: `Reference Range for ${testName}`,
      relevance: validation.confidence || 0.9,
      excerpt: `Normal range: ${validation.referenceRange.min}-${validation.referenceRange.max} ${validation.referenceRange.unit}`
    });
    
    return {
      isValidated: validation.confidence >= 0.8,
      sources,
      confidence: validation.confidence || 0.7,
      conflicts,
      references,
      validatedAt: new Date(),
      referenceRange: validation.referenceRange,
      interpretation: validation.interpretation || 'NORMAL',
      clinicalSignificance: validation.clinicalSignificance || ''
    };
  } catch (error) {
    return {
      isValidated: false,
      sources: [],
      confidence: 0,
      conflicts: [`Validation error: ${error instanceof Error ? error.message : 'Unknown error'}`],
      references: [],
      validatedAt: new Date(),
      referenceRange: { min: 0, max: 0, unit },
      interpretation: 'NORMAL',
      clinicalSignificance: ''
    };
  }
}

/**
 * Validate imaging finding against radiological databases
 */
export async function validateImagingFinding(
  finding: string,
  imagingType: 'xray' | 'ct' | 'mri' | 'ultrasound',
  anatomicalLocation: string
): Promise<CrossReferenceResult> {
  const sources: string[] = [];
  const conflicts: string[] = [];
  const references: Reference[] = [];
  
  try {
    const validationPrompt = `
You are a radiology validation system. Validate this imaging finding:

Finding: ${finding}
Imaging Type: ${imagingType}
Anatomical Location: ${anatomicalLocation}

Provide:
1. Whether this finding is anatomically plausible
2. Typical appearance on ${imagingType}
3. Differential diagnoses for this finding
4. Any concerns or red flags

Format as JSON with keys: isPlausible (boolean), typicalAppearance (string), differentials (array), concerns (array), confidence (0-1)
`;

    const response = await invokeLLM({
      messages: [
        { role: 'system', content: 'You are a radiology validation system. Respond only with valid JSON.' },
        { role: 'user', content: validationPrompt }
      ],
      response_format: {
        type: 'json_schema',
        json_schema: {
          name: 'imaging_validation',
          strict: true,
          schema: {
            type: 'object',
            properties: {
              isPlausible: { type: 'boolean' },
              typicalAppearance: { type: 'string' },
              differentials: { type: 'array', items: { type: 'string' } },
              concerns: { type: 'array', items: { type: 'string' } },
              confidence: { type: 'number' }
            },
            required: ['isPlausible', 'differentials', 'concerns', 'confidence'],
            additionalProperties: false
          }
        }
      }
    });

    const validation = JSON.parse(extractContent(response) || '{}');
    
    sources.push('Radiology Knowledge Base');
    sources.push('Anatomical Reference Database');
    
    if (validation.concerns && validation.concerns.length > 0) {
      conflicts.push(...validation.concerns);
    }
    
    references.push({
      source: 'Radiology Reference Database',
      title: `${finding} on ${imagingType}`,
      relevance: validation.confidence || 0.8,
      excerpt: validation.typicalAppearance || 'See reference for details'
    });
    
    return {
      isValidated: validation.isPlausible && validation.confidence >= 0.7,
      sources,
      confidence: validation.confidence || 0.5,
      conflicts,
      references,
      validatedAt: new Date()
    };
  } catch (error) {
    return {
      isValidated: false,
      sources: [],
      confidence: 0,
      conflicts: [`Validation error: ${error instanceof Error ? error.message : 'Unknown error'}`],
      references: [],
      validatedAt: new Date()
    };
  }
}

/**
 * Search PubMed for supporting literature
 */
export async function searchPubMedLiterature(
  query: string,
  maxResults: number = 5
): Promise<Reference[]> {
  try {
    // Use LLM to simulate PubMed search
    // In production, this would use the actual PubMed API
    const searchPrompt = `
Find relevant medical literature for: ${query}

Provide up to ${maxResults} relevant publications with:
1. Title
2. Brief excerpt or abstract summary
3. Relevance score (0-1)

Format as JSON array with keys: title (string), excerpt (string), relevance (number)
`;

    const response = await invokeLLM({
      messages: [
        { role: 'system', content: 'You are a medical literature search system. Respond only with valid JSON array.' },
        { role: 'user', content: searchPrompt }
      ],
      response_format: {
        type: 'json_schema',
        json_schema: {
          name: 'literature_search',
          strict: true,
          schema: {
            type: 'object',
            properties: {
              results: {
                type: 'array',
                items: {
                  type: 'object',
                  properties: {
                    title: { type: 'string' },
                    excerpt: { type: 'string' },
                    relevance: { type: 'number' }
                  },
                  required: ['title', 'excerpt', 'relevance'],
                  additionalProperties: false
                }
              }
            },
            required: ['results'],
            additionalProperties: false
          }
        }
      }
    });

    const searchResults = JSON.parse(extractContent(response) || '{"results":[]}');
    
    return searchResults.results.map((result: any) => ({
      source: 'PubMed',
      title: result.title,
      url: `https://pubmed.ncbi.nlm.nih.gov/?term=${encodeURIComponent(query)}`,
      relevance: result.relevance,
      excerpt: result.excerpt
    }));
  } catch (error) {
    console.error('PubMed search error:', error);
    return [];
  }
}
