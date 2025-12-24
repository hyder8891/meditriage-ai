import { eq, and, desc } from "drizzle-orm";
import { getDb } from "./db";
import {
  patientMedications,
  medicalConditions,
  medicineImages,
  drugInteractionChecks,
  InsertPatientMedication,
  InsertMedicalCondition,
  InsertMedicineImage,
  InsertDrugInteractionCheck,
} from "../drizzle/schema";

/**
 * Patient Medications Management
 */
export async function addPatientMedication(medicationData: InsertPatientMedication) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const result = await db.insert(patientMedications).values(medicationData);
  return result[0].insertId;
}

export async function getPatientMedications(patientId: number, activeOnly: boolean = true) {
  const db = await getDb();
  if (!db) return [];
  
  const conditions = [eq(patientMedications.patientId, patientId)];
  
  if (activeOnly) {
    conditions.push(eq(patientMedications.isActive, true));
  }
  
  const query = db.select().from(patientMedications).where(and(...conditions));
  
  return await query.orderBy(desc(patientMedications.createdAt));
}

export async function getPatientMedicationById(id: number) {
  const db = await getDb();
  if (!db) return null;
  
  const result = await db.select().from(patientMedications)
    .where(eq(patientMedications.id, id))
    .limit(1);
  return result[0] || null;
}

export async function updatePatientMedication(id: number, updates: Partial<InsertPatientMedication>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  await db.update(patientMedications)
    .set({ ...updates, updatedAt: new Date() })
    .where(eq(patientMedications.id, id));
}

export async function deactivatePatientMedication(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  await db.update(patientMedications)
    .set({ isActive: false, endDate: new Date(), updatedAt: new Date() })
    .where(eq(patientMedications.id, id));
}

export async function deletePatientMedication(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  await db.delete(patientMedications).where(eq(patientMedications.id, id));
}

/**
 * Medical Conditions Management
 */
export async function addMedicalCondition(conditionData: InsertMedicalCondition) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const result = await db.insert(medicalConditions).values(conditionData);
  return result[0].insertId;
}

export async function getPatientConditions(patientId: number, activeOnly: boolean = true) {
  const db = await getDb();
  if (!db) return [];
  
  const conditions = [eq(medicalConditions.patientId, patientId)];
  
  if (activeOnly) {
    conditions.push(eq(medicalConditions.status, "active"));
  }
  
  const query = db.select().from(medicalConditions).where(and(...conditions));
  
  return await query.orderBy(desc(medicalConditions.createdAt));
}

export async function getMedicalConditionById(id: number) {
  const db = await getDb();
  if (!db) return null;
  
  const result = await db.select().from(medicalConditions)
    .where(eq(medicalConditions.id, id))
    .limit(1);
  return result[0] || null;
}

export async function updateMedicalCondition(id: number, updates: Partial<InsertMedicalCondition>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  await db.update(medicalConditions)
    .set({ ...updates, updatedAt: new Date() })
    .where(eq(medicalConditions.id, id));
}

export async function deleteMedicalCondition(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  await db.delete(medicalConditions).where(eq(medicalConditions.id, id));
}

/**
 * Medicine Images Management
 */
export async function saveMedicineImage(imageData: InsertMedicineImage) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const result = await db.insert(medicineImages).values(imageData);
  return result[0].insertId;
}

export async function getMedicineImageById(id: number) {
  const db = await getDb();
  if (!db) return null;
  
  const result = await db.select().from(medicineImages)
    .where(eq(medicineImages.id, id))
    .limit(1);
  return result[0] || null;
}

export async function getUserMedicineImages(userId: number) {
  const db = await getDb();
  if (!db) return [];
  
  return await db.select().from(medicineImages)
    .where(eq(medicineImages.userId, userId))
    .orderBy(desc(medicineImages.createdAt));
}

export async function updateMedicineImage(id: number, updates: Partial<InsertMedicineImage>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  await db.update(medicineImages)
    .set({ ...updates, updatedAt: new Date() })
    .where(eq(medicineImages.id, id));
}

export async function deleteMedicineImage(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  await db.delete(medicineImages).where(eq(medicineImages.id, id));
}

/**
 * Drug Interaction Checks Logging
 */
export async function logDrugInteractionCheck(checkData: InsertDrugInteractionCheck) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const result = await db.insert(drugInteractionChecks).values(checkData);
  return result[0].insertId;
}

export async function getUserInteractionChecks(userId: number, limit: number = 10) {
  const db = await getDb();
  if (!db) return [];
  
  return await db.select().from(drugInteractionChecks)
    .where(eq(drugInteractionChecks.userId, userId))
    .orderBy(desc(drugInteractionChecks.createdAt))
    .limit(limit);
}

export async function getInteractionCheckById(id: number) {
  const db = await getDb();
  if (!db) return null;
  
  const result = await db.select().from(drugInteractionChecks)
    .where(eq(drugInteractionChecks.id, id))
    .limit(1);
  return result[0] || null;
}
