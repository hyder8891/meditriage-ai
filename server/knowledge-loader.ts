/**
 * Medical Knowledge Loader
 * 
 * Loads medical knowledge from JSON files into the database.
 * This replaces brain-embedded knowledge with maintainable, auditable,
 * and scalable database-backed knowledge.
 */

import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { getDb } from './db';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
import {
  diseases,
  symptoms,
  redFlags,
  medicationsKnowledge,
  knowledgeVersions,
  type InsertDisease,
  type InsertSymptom,
  type InsertRedFlag,
  type InsertMedicationKnowledge,
  type InsertKnowledgeVersion,
} from '../drizzle/schema';
import { eq } from 'drizzle-orm';

const KNOWLEDGE_BASE_PATH = join(__dirname, '../knowledge');

// Fallback for when running from different contexts
function getKnowledgeBasePath() {
  try {
    return KNOWLEDGE_BASE_PATH;
  } catch {
    return join(process.cwd(), 'knowledge');
  }
}

/**
 * Load diseases from JSON file
 */
export async function loadDiseases(): Promise<number> {
  const db = await getDb();
  if (!db) throw new Error('Database not available');
  
  const filePath = join(getKnowledgeBasePath(), 'diseases/common-diseases.json');
  const data = JSON.parse(readFileSync(filePath, 'utf-8'));
  
  let loaded = 0;
  for (const disease of data) {
    // Check if disease already exists
    const existing = await db.select().from(diseases).where(eq(diseases.icdCode, disease.icdCode)).limit(1);
    
    const diseaseData: InsertDisease = {
      icdCode: disease.icdCode,
      nameEn: disease.nameEn,
      nameAr: disease.nameAr,
      localName: disease.localName || null,
      category: disease.category,
      prevalenceIraq: disease.prevalenceIraq || null,
      description: disease.description,
      symptoms: JSON.stringify(disease.symptoms),
      riskFactors: JSON.stringify(disease.riskFactors),
      complications: JSON.stringify(disease.complications),
      differentialDiagnosis: JSON.stringify(disease.differentialDiagnosis),
      redFlags: JSON.stringify(disease.redFlags),
      treatmentProtocol: JSON.stringify(disease.treatmentProtocol),
      prognosis: disease.prognosis || null,
      preventionMeasures: JSON.stringify(disease.preventionMeasures),
      specialConsiderations: disease.specialConsiderations || null,
      createdAt: new Date(),
      updatedAt: new Date(),
      version: 1,
    };
    
    if (existing.length > 0) {
      // Update existing
      await db.update(diseases)
        .set({ ...diseaseData, version: existing[0].version + 1, updatedAt: new Date() })
        .where(eq(diseases.icdCode, disease.icdCode));
      
      // Log version change
      await logVersionChange('disease', existing[0].id, existing[0].version + 1, 'updated', `Updated from knowledge file`);
    } else {
      // Insert new
      const [inserted] = await db.insert(diseases).values(diseaseData);
      await logVersionChange('disease', inserted.insertId, 1, 'created', `Created from knowledge file`);
    }
    
    loaded++;
  }
  
  return loaded;
}

/**
 * Load symptoms from JSON file
 */
export async function loadSymptoms(): Promise<number> {
  const db = await getDb();
  if (!db) throw new Error('Database not available');
  
  const filePath = join(getKnowledgeBasePath(), 'symptoms/common-symptoms.json');
  const data = JSON.parse(readFileSync(filePath, 'utf-8'));
  
  let loaded = 0;
  for (const symptom of data) {
    // Check if symptom already exists
    const existing = await db.select().from(symptoms).where(eq(symptoms.nameEn, symptom.nameEn)).limit(1);
    
    const symptomData: InsertSymptom = {
      nameEn: symptom.nameEn,
      nameAr: symptom.nameAr,
      localName: symptom.localName || null,
      category: symptom.category,
      description: symptom.description || null,
      severityIndicators: JSON.stringify(symptom.severityIndicators),
      associatedConditions: JSON.stringify(symptom.associatedConditions),
      redFlagSymptom: symptom.redFlagSymptom || false,
      urgencyLevel: symptom.urgencyLevel || null,
      commonInIraq: symptom.commonInIraq !== undefined ? symptom.commonInIraq : true,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    
    if (existing.length > 0) {
      // Update existing
      await db.update(symptoms)
        .set({ ...symptomData, updatedAt: new Date() })
        .where(eq(symptoms.nameEn, symptom.nameEn));
    } else {
      // Insert new
      await db.insert(symptoms).values(symptomData);
    }
    
    loaded++;
  }
  
  return loaded;
}

/**
 * Load red flags from JSON file
 */
export async function loadRedFlags(): Promise<number> {
  const db = await getDb();
  if (!db) throw new Error('Database not available');
  
  const filePath = join(getKnowledgeBasePath(), 'red-flags/emergency-red-flags.json');
  const data = JSON.parse(readFileSync(filePath, 'utf-8'));
  
  let loaded = 0;
  for (const flag of data) {
    // Check if red flag already exists
    const existing = await db.select().from(redFlags).where(eq(redFlags.nameEn, flag.nameEn)).limit(1);
    
    const flagData: InsertRedFlag = {
      nameEn: flag.nameEn,
      nameAr: flag.nameAr,
      category: flag.category,
      description: flag.description,
      clinicalSignificance: flag.clinicalSignificance,
      associatedConditions: JSON.stringify(flag.associatedConditions),
      urgencyLevel: flag.urgencyLevel,
      recommendedAction: flag.recommendedAction,
      timeToTreatment: flag.timeToTreatment || null,
      facilityRequired: flag.facilityRequired || null,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    
    if (existing.length > 0) {
      // Update existing
      await db.update(redFlags)
        .set({ ...flagData, updatedAt: new Date() })
        .where(eq(redFlags.nameEn, flag.nameEn));
    } else {
      // Insert new
      await db.insert(redFlags).values(flagData);
    }
    
    loaded++;
  }
  
  return loaded;
}

/**
 * Load medications from JSON file
 */
export async function loadMedications(): Promise<number> {
  const db = await getDb();
  if (!db) throw new Error('Database not available');
  
  const filePath = join(getKnowledgeBasePath(), 'medications/common-medications.json');
  const data = JSON.parse(readFileSync(filePath, 'utf-8'));
  
  let loaded = 0;
  for (const med of data) {
    // Check if medication already exists
    const existing = await db.select().from(medicationsKnowledge)
      .where(eq(medicationsKnowledge.genericName, med.genericName)).limit(1);
    
    const medData: InsertMedicationKnowledge = {
      genericName: med.genericName,
      brandNames: JSON.stringify(med.brandNames),
      nameAr: med.nameAr,
      drugClass: med.drugClass,
      mechanism: med.mechanism || null,
      indications: JSON.stringify(med.indications),
      contraindications: JSON.stringify(med.contraindications),
      sideEffects: JSON.stringify(med.sideEffects),
      interactions: JSON.stringify(med.interactions),
      dosageAdult: med.dosageAdult || null,
      dosagePediatric: med.dosagePediatric || null,
      dosageElderly: med.dosageElderly || null,
      routeOfAdministration: med.routeOfAdministration || null,
      availabilityIraq: med.availabilityIraq,
      approximateCost: med.approximateCost || null,
      requiresPrescription: med.requiresPrescription,
      pregnancyCategory: med.pregnancyCategory || null,
      lactationSafety: med.lactationSafety || null,
      renalAdjustment: med.renalAdjustment || null,
      hepaticAdjustment: med.hepaticAdjustment || null,
      monitoringRequired: JSON.stringify(med.monitoringRequired),
      specialInstructions: med.specialInstructions || null,
      createdAt: new Date(),
      updatedAt: new Date(),
      version: 1,
    };
    
    if (existing.length > 0) {
      // Update existing
      await db.update(medicationsKnowledge)
        .set({ ...medData, version: existing[0].version + 1, updatedAt: new Date() })
        .where(eq(medicationsKnowledge.genericName, med.genericName));
      
      await logVersionChange('medication', existing[0].id, existing[0].version + 1, 'updated', `Updated from knowledge file`);
    } else {
      // Insert new
      const [inserted] = await db.insert(medicationsKnowledge).values(medData);
      await logVersionChange('medication', inserted.insertId, 1, 'created', `Created from knowledge file`);
    }
    
    loaded++;
  }
  
  return loaded;
}

/**
 * Log knowledge version change
 */
async function logVersionChange(
  entityType: string,
  entityId: number,
  version: number,
  changeType: 'created' | 'updated' | 'deprecated',
  description: string
): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error('Database not available');
  const versionData: InsertKnowledgeVersion = {
    entityType,
    entityId,
    version,
    changeType,
    changeDescription: description,
    changedBy: 'system',
    reviewedBy: null,
    approvedBy: null,
    createdAt: new Date(),
  };
  
  await db.insert(knowledgeVersions).values(versionData);
}

/**
 * Load all knowledge files
 */
export async function loadAllKnowledge(): Promise<{
  diseases: number;
  symptoms: number;
  redFlags: number;
  medications: number;
}> {
  console.log('🔄 Loading medical knowledge from files...');
  
  const results = {
    diseases: await loadDiseases(),
    symptoms: await loadSymptoms(),
    redFlags: await loadRedFlags(),
    medications: await loadMedications(),
  };
  
  console.log('✅ Knowledge loading complete:');
  console.log(`   - Diseases: ${results.diseases}`);
  console.log(`   - Symptoms: ${results.symptoms}`);
  console.log(`   - Red Flags: ${results.redFlags}`);
  console.log(`   - Medications: ${results.medications}`);
  
  return results;
}

/**
 * Validate knowledge integrity
 */
export async function validateKnowledge(): Promise<{
  valid: boolean;
  errors: string[];
}> {
  const db = await getDb();
  if (!db) throw new Error('Database not available');
  
  const errors: string[] = [];
  
  // Check if diseases reference valid symptoms
  const allDiseases = await db.select().from(diseases);
  const allSymptoms = await db.select().from(symptoms);
  const symptomIds = new Set(allSymptoms.map((s: any) => s.id));
  
  for (const disease of allDiseases) {
    const diseaseSymptoms = JSON.parse(disease.symptoms) as number[];
    for (const symptomId of diseaseSymptoms) {
      if (!symptomIds.has(symptomId)) {
        errors.push(`Disease ${disease.nameEn} references non-existent symptom ID ${symptomId}`);
      }
    }
  }
  
  // Check if red flags reference valid conditions
  const allRedFlags = await db.select().from(redFlags);
  const diseaseIcdCodes = new Set(allDiseases.map((d: any) => d.icdCode));
  
  for (const flag of allRedFlags) {
    if (!flag.associatedConditions) continue;
    const associatedConditions = JSON.parse(flag.associatedConditions) as string[];
    for (const icdCode of associatedConditions) {
      if (!diseaseIcdCodes.has(icdCode)) {
        errors.push(`Red flag ${flag.nameEn} references non-existent ICD code ${icdCode}`);
      }
    }
  }
  
  return {
    valid: errors.length === 0,
    errors,
  };
}
