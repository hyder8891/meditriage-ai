import { eq, desc } from "drizzle-orm";
import { 
  trainingMaterials,
  InsertTrainingMaterial,
  triageTrainingData,
  InsertTriageTrainingData,
  medicalKnowledgeBase,
  InsertMedicalKnowledgeBase,
  trainingSessions
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

// Additional helper functions
export async function getTrainingMaterialById(id: number) {
  const db = await getDb();
  if (!db) return null;
  
  const results = await db
    .select()
    .from(trainingMaterials)
    .where(eq(trainingMaterials.id, id))
    .limit(1);
  
  return results[0] || null;
}

export async function updateTrainingMaterial(id: number, data: Partial<InsertTrainingMaterial>) {
  const db = await getDb();
  if (!db) throw new Error('Database not available');
  
  await db
    .update(trainingMaterials)
    .set(data)
    .where(eq(trainingMaterials.id, id));
}

export async function deleteTrainingMaterial(id: number) {
  const db = await getDb();
  if (!db) throw new Error('Database not available');
  
  await db
    .delete(trainingMaterials)
    .where(eq(trainingMaterials.id, id));
}

export async function getTrainingStats() {
  const db = await getDb();
  if (!db) return { total: 0, byCategory: {}, totalKnowledgeExtracted: 0 };
  
  const allMaterials = await db.select().from(trainingMaterials);
  
  const byCategory = allMaterials.reduce((acc, material) => {
    acc[material.category] = (acc[material.category] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);
  
  return {
    total: allMaterials.length,
    byCategory,
    totalKnowledgeExtracted: allMaterials.filter(m => m.summary).length,
  };
}

// Training Session Operations
export async function createTrainingSession(data: {
  totalMaterials: number;
  triggeredBy: number;
}) {
  const db = await getDb();
  if (!db) throw new Error('Database not available');
  
  const result = await db.insert(trainingSessions).values({
    totalMaterials: data.totalMaterials,
    processedMaterials: 0,
    successfulMaterials: 0,
    failedMaterials: 0,
    status: 'running',
    triggeredBy: data.triggeredBy,
  });
  
  return Number((result as any).insertId || 0);
}

export async function updateTrainingSession(id: number, data: {
  processedMaterials?: number;
  successfulMaterials?: number;
  failedMaterials?: number;
  status?: string;
  completedAt?: Date;
  duration?: number;
  results?: string;
  errorMessage?: string;
}) {
  const db = await getDb();
  if (!db) throw new Error('Database not available');
  
  await db
    .update(trainingSessions)
    .set(data)
    .where(eq(trainingSessions.id, id));
}

export async function getAllTrainingSessions() {
  const db = await getDb();
  if (!db) return [];
  
  return await db
    .select()
    .from(trainingSessions)
    .orderBy(desc(trainingSessions.startedAt));
}

export async function getTrainingSessionById(id: number) {
  const db = await getDb();
  if (!db) return null;
  
  const results = await db
    .select()
    .from(trainingSessions)
    .where(eq(trainingSessions.id, id))
    .limit(1);
  
  return results[0] || null;
}

export async function saveTrainingMaterial(data: {
  userId: number;
  category: string;
  title: string;
  content: string;
  fileUrl: string;
  fileKey: string;
  extractedKnowledge?: string;
  processingStatus: string;
}) {
  const db = await getDb();
  if (!db) throw new Error('Database not available');
  
  const result = await db.insert(trainingMaterials).values({
    title: data.title,
    category: data.category,
    source: 'admin_upload',
    content: data.content,
    storageUrl: data.fileUrl,
    storageKey: data.fileKey,
    summary: data.extractedKnowledge || null,
    trainingStatus: data.processingStatus,
  });
  
  // For MySQL, insertId is available on the result
  return Number((result as any).insertId || 0);
}
