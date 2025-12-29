import { getDb } from "./db";
import { medicalCertificates, type MedicalCertificate, type InsertMedicalCertificate } from "../drizzle/schema";
import { eq, and } from "drizzle-orm";

export async function createMedicalCertificate(data: Omit<InsertMedicalCertificate, "id" | "createdAt" | "updatedAt">) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const [certificate] = await db!.insert(medicalCertificates).values(data).$returningId();
  return certificate;
}

export async function getMedicalCertificatesByUserId(userId: number): Promise<MedicalCertificate[]> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return await db!.select().from(medicalCertificates).where(eq(medicalCertificates.userId, userId));
}

export async function getMedicalCertificateById(id: number): Promise<MedicalCertificate | undefined> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const [certificate] = await db!.select().from(medicalCertificates).where(eq(medicalCertificates.id, id));
  return certificate;
}

export async function updateMedicalCertificate(
  id: number,
  data: Partial<Omit<InsertMedicalCertificate, "id" | "userId" | "createdAt" | "updatedAt">>
) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db!.update(medicalCertificates).set(data).where(eq(medicalCertificates.id, id));
  return await getMedicalCertificateById(id);
}

export async function deleteMedicalCertificate(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db!.delete(medicalCertificates).where(eq(medicalCertificates.id, id));
  return { success: true };
}

export async function getAllMedicalCertificates(filters?: {
  status?: "pending" | "verified" | "rejected" | "expired";
  userId?: number;
}): Promise<MedicalCertificate[]> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  let query = db!.select().from(medicalCertificates);
  
  const conditions = [];
  if (filters?.status) {
    conditions.push(eq(medicalCertificates.verificationStatus, filters.status));
  }
  if (filters?.userId) {
    conditions.push(eq(medicalCertificates.userId, filters.userId));
  }
  
  if (conditions.length > 0) {
    query = query.where(and(...conditions)) as any;
  }
  
  return await query;
}

export async function verifyCertificate(
  id: number,
  status: "verified" | "rejected",
  verifiedBy: number,
  notes?: string
) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db!.update(medicalCertificates).set({
    verificationStatus: status,
    verifiedBy,
    verifiedAt: new Date(),
    verificationNotes: notes,
  }).where(eq(medicalCertificates.id, id));
  
  return await getMedicalCertificateById(id);
}
