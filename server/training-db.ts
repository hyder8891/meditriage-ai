import { eq, desc } from "drizzle-orm";
import { 
  trainingMaterials,
  InsertTrainingMaterial,
  triageTrainingData,
  InsertTriageTrainingData,
  medicalKnowledgeBase,
  InsertMedicalKnowledgeBase
} from "../drizzle/schema";
import { getDb } from "./db";

// Training Materials Operations
export async function createTrainingMaterial(material: InsertTrainingMaterial) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const result = await db.insert(trainingMaterials).values(material);
  return result;
}

export async function getAllTrainingMaterials() {
  const db = await getDb();
  if (!db) return [];
  
  return await db
    .select()
    .from(trainingMaterials)
    .orderBy(desc(trainingMaterials.createdAt));
}

export async function getTrainingMaterialsByCategory(category: string) {
  const db = await getDb();
  if (!db) return [];
  
  return await db
    .select()
    .from(trainingMaterials)
    .where(eq(trainingMaterials.category, category))
    .orderBy(desc(trainingMaterials.createdAt));
}

export async function updateTrainingMaterialStatus(
  id: number, 
  status: string,
  processedData?: {
    summary?: string;
    keyFindings?: string;
    clinicalRelevance?: string;
  }
) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const updateData: any = {
    trainingStatus: status,
    processedAt: new Date(),
  };
  
  if (processedData) {
    if (processedData.summary) updateData.summary = processedData.summary;
    if (processedData.keyFindings) updateData.keyFindings = processedData.keyFindings;
    if (processedData.clinicalRelevance) updateData.clinicalRelevance = processedData.clinicalRelevance;
  }
  
  await db
    .update(trainingMaterials)
    .set(updateData)
    .where(eq(trainingMaterials.id, id));
}

// Triage Training Data Operations
export async function createTriageTrainingData(data: InsertTriageTrainingData) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const result = await db.insert(triageTrainingData).values(data);
  return result;
}

export async function getAllTriageTrainingData() {
  const db = await getDb();
  if (!db) return [];
  
  return await db
    .select()
    .from(triageTrainingData)
    .orderBy(desc(triageTrainingData.createdAt));
}

export async function getUntrainedTriageData() {
  const db = await getDb();
  if (!db) return [];
  
  return await db
    .select()
    .from(triageTrainingData)
    .where(eq(triageTrainingData.usedForTraining, null as any))
    .orderBy(desc(triageTrainingData.createdAt));
}

export async function markTriageDataAsTrained(id: number, epoch: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  await db
    .update(triageTrainingData)
    .set({
      usedForTraining: new Date(),
      trainingEpoch: epoch,
    })
    .where(eq(triageTrainingData.id, id));
}

// Medical Knowledge Base Operations
export async function createKnowledgeEntry(entry: InsertMedicalKnowledgeBase) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const result = await db.insert(medicalKnowledgeBase).values(entry);
  return result;
}

export async function searchKnowledgeBase(topic: string) {
  const db = await getDb();
  if (!db) return [];
  
  // Simple search - in production, use full-text search
  return await db
    .select()
    .from(medicalKnowledgeBase)
    .where(eq(medicalKnowledgeBase.topic, topic))
    .orderBy(desc(medicalKnowledgeBase.confidence));
}

export async function getKnowledgeByCategory(category: string) {
  const db = await getDb();
  if (!db) return [];
  
  return await db
    .select()
    .from(medicalKnowledgeBase)
    .where(eq(medicalKnowledgeBase.category, category))
    .orderBy(desc(medicalKnowledgeBase.confidence));
}
