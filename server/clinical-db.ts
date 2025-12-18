import { eq, desc } from "drizzle-orm";
import { getDb } from "./db";
import {
  cases,
  vitals,
  diagnoses,
  clinicalNotes,
  medications,
  facilities,
  transcriptions,
  InsertCase,
  InsertVitals,
  InsertDiagnosis,
  InsertClinicalNote,
  InsertMedication,
  InsertFacility,
  InsertTranscription,
} from "../drizzle/schema";

/**
 * Case Management
 */
export async function createCase(caseData: InsertCase) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const result = await db.insert(cases).values(caseData);
  return result[0].insertId;
}

export async function getCaseById(caseId: number) {
  const db = await getDb();
  if (!db) return null;
  
  const result = await db.select().from(cases).where(eq(cases.id, caseId)).limit(1);
  return result[0] || null;
}

export async function getCasesByClinicianId(clinicianId: number) {
  const db = await getDb();
  if (!db) return [];
  
  return await db.select().from(cases)
    .where(eq(cases.clinicianId, clinicianId))
    .orderBy(desc(cases.createdAt));
}

export async function getAllActiveCases() {
  const db = await getDb();
  if (!db) return [];
  
  return await db.select().from(cases)
    .where(eq(cases.status, "active"))
    .orderBy(desc(cases.createdAt));
}

export async function updateCaseStatus(caseId: number, status: "active" | "completed" | "archived") {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  await db.update(cases)
    .set({ status, updatedAt: new Date() })
    .where(eq(cases.id, caseId));
}

/**
 * Vitals Management
 */
export async function saveVitals(vitalsData: InsertVitals) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const result = await db.insert(vitals).values(vitalsData);
  return result[0].insertId;
}

export async function getVitalsByCaseId(caseId: number) {
  const db = await getDb();
  if (!db) return [];
  
  return await db.select().from(vitals)
    .where(eq(vitals.caseId, caseId))
    .orderBy(desc(vitals.recordedAt));
}

/**
 * Diagnosis Management
 */
export async function saveDiagnosis(diagnosisData: InsertDiagnosis) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const result = await db.insert(diagnoses).values(diagnosisData);
  return result[0].insertId;
}

export async function getDiagnosesByCaseId(caseId: number) {
  const db = await getDb();
  if (!db) return [];
  
  return await db.select().from(diagnoses)
    .where(eq(diagnoses.caseId, caseId))
    .orderBy(desc(diagnoses.probability));
}

/**
 * Clinical Notes Management
 */
export async function saveClinicalNote(noteData: InsertClinicalNote) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const result = await db.insert(clinicalNotes).values(noteData);
  return result[0].insertId;
}

export async function getClinicalNotesByCaseId(caseId: number) {
  const db = await getDb();
  if (!db) return [];
  
  return await db.select().from(clinicalNotes)
    .where(eq(clinicalNotes.caseId, caseId))
    .orderBy(desc(clinicalNotes.createdAt));
}

/**
 * Medications Management
 */
export async function addMedication(medicationData: InsertMedication) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const result = await db.insert(medications).values(medicationData);
  return result[0].insertId;
}

export async function searchMedications(query: string) {
  const db = await getDb();
  if (!db) return [];
  
  // Simple search - in production, use full-text search
  return await db.select().from(medications).limit(20);
}

export async function getMedicationById(id: number) {
  const db = await getDb();
  if (!db) return null;
  
  const result = await db.select().from(medications).where(eq(medications.id, id)).limit(1);
  return result[0] || null;
}

/**
 * Facilities Management (Iraq-specific)
 */
export async function addFacility(facilityData: InsertFacility) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const result = await db.insert(facilities).values(facilityData);
  return result[0].insertId;
}

export async function searchFacilities(type?: string, city?: string) {
  const db = await getDb();
  if (!db) return [];
  
  if (type) {
    return await db.select().from(facilities)
      .where(eq(facilities.type, type as any))
      .limit(50);
  }
  
  return await db.select().from(facilities).limit(50);
}

export async function getEmergencyFacilities() {
  const db = await getDb();
  if (!db) return [];
  
  return await db.select().from(facilities)
    .where(eq(facilities.emergencyServices, 1))
    .limit(20);
}

/**
 * Transcription Management for Live Scribe
 */
export async function createTranscription(transcriptionData: InsertTranscription) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const result = await db.insert(transcriptions).values(transcriptionData);
  return result[0].insertId;
}

export async function getTranscriptionById(transcriptionId: number) {
  const db = await getDb();
  if (!db) return null;
  
  const result = await db.select().from(transcriptions)
    .where(eq(transcriptions.id, transcriptionId))
    .limit(1);
  return result[0] || null;
}

export async function getTranscriptionsByClinicianId(clinicianId: number) {
  const db = await getDb();
  if (!db) return [];
  
  return await db.select().from(transcriptions)
    .where(eq(transcriptions.clinicianId, clinicianId))
    .orderBy(desc(transcriptions.createdAt));
}

export async function getTranscriptionsByCaseId(caseId: number) {
  const db = await getDb();
  if (!db) return [];
  
  return await db.select().from(transcriptions)
    .where(eq(transcriptions.caseId, caseId))
    .orderBy(desc(transcriptions.createdAt));
}

export async function updateTranscription(transcriptionId: number, updates: Partial<InsertTranscription>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  await db.update(transcriptions)
    .set({ ...updates, updatedAt: new Date() })
    .where(eq(transcriptions.id, transcriptionId));
}

export async function deleteTranscription(transcriptionId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  await db.delete(transcriptions)
    .where(eq(transcriptions.id, transcriptionId));
}
