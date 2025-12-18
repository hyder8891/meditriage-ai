import { getDb } from "./db";
import { prescriptions, medicationAdherence, type InsertPrescription, type InsertMedicationAdherence } from "../drizzle/schema";
import { eq, and, desc } from "drizzle-orm";

/**
 * Create a new prescription
 */
export async function createPrescription(data: InsertPrescription) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const result = await db.insert(prescriptions).values(data);
  return result[0].insertId;
}

/**
 * Get all prescriptions
 */
export async function getAllPrescriptions() {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  return db
    .select()
    .from(prescriptions)
    .orderBy(desc(prescriptions.startDate));
}

/**
 * Get prescriptions by patient ID
 */
export async function getPrescriptionsByPatientId(patientId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  return db
    .select()
    .from(prescriptions)
    .where(eq(prescriptions.patientId, patientId))
    .orderBy(desc(prescriptions.startDate));
}

/**
 * Update prescription status
 */
export async function updatePrescriptionStatus(prescriptionId: number, status: "active" | "completed" | "discontinued" | "on_hold") {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  await db
    .update(prescriptions)
    .set({ status })
    .where(eq(prescriptions.id, prescriptionId));
}

/**
 * Record medication adherence
 */
export async function recordMedicationAdherence(data: InsertMedicationAdherence) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const result = await db.insert(medicationAdherence).values(data);
  return result[0].insertId;
}

/**
 * Get medication adherence by prescription ID
 */
export async function getAdherenceByPrescriptionId(prescriptionId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  return db
    .select()
    .from(medicationAdherence)
    .where(eq(medicationAdherence.prescriptionId, prescriptionId))
    .orderBy(desc(medicationAdherence.takenAt));
}

/**
 * Calculate adherence rate for a prescription
 */
export async function calculateAdherenceRate(prescriptionId: number): Promise<number> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const adherenceRecords = await getAdherenceByPrescriptionId(prescriptionId);
  if (adherenceRecords.length === 0) return 0;
  
  const takenCount = adherenceRecords.filter(r => r.taken).length;
  return Math.round((takenCount / adherenceRecords.length) * 100);
}
