import { getDb } from "./db";
import { consultations } from "../drizzle/schema";
import { eq, and, or, gte, desc } from "drizzle-orm";
import { randomBytes } from "crypto";

export async function createConsultation(data: {
  patientId: number;
  clinicianId: number;
  scheduledTime: Date;
  chiefComplaint?: string;
  appointmentId?: number;
}) {
  const db = await getDb();
  const roomId = randomBytes(16).toString('hex');
  
  const [result] = await db!.insert(consultations).values({
    ...data,
    roomId,
    status: "scheduled",
  });

  return { consultationId: result.insertId, roomId };
}

export async function getConsultationById(id: number) {
  const db = await getDb();
  const [consultation] = await db!
    .select()
    .from(consultations)
    .where(eq(consultations.id, id));
  
  return consultation;
}

export async function getConsultationByRoomId(roomId: string) {
  const db = await getDb();
  const [consultation] = await db!
    .select()
    .from(consultations)
    .where(eq(consultations.roomId, roomId));
  
  return consultation;
}

export async function getConsultationsByPatient(patientId: number) {
  const db = await getDb();
  return await db!
    .select()
    .from(consultations)
    .where(eq(consultations.patientId, patientId))
    .orderBy(desc(consultations.scheduledTime));
}

export async function getConsultationsByClinician(clinicianId: number) {
  const db = await getDb();
  return await db!
    .select()
    .from(consultations)
    .where(eq(consultations.clinicianId, clinicianId))
    .orderBy(desc(consultations.scheduledTime));
}

export async function getUpcomingConsultations(userId: number, role: 'patient' | 'clinician') {
  const db = await getDb();
  const now = new Date();
  
  const condition = role === 'patient' 
    ? eq(consultations.patientId, userId)
    : eq(consultations.clinicianId, userId);
  
  return await db!
    .select()
    .from(consultations)
    .where(
      and(
        condition,
        gte(consultations.scheduledTime, now),
        or(
          eq(consultations.status, "scheduled"),
          eq(consultations.status, "waiting")
        )
      )
    )
    .orderBy(consultations.scheduledTime);
}

export async function updateConsultationStatus(
  id: number,
  status: "scheduled" | "waiting" | "in_progress" | "completed" | "cancelled" | "no_show"
) {
  const db = await getDb();
  await db!
    .update(consultations)
    .set({ status })
    .where(eq(consultations.id, id));
}

export async function startConsultation(id: number) {
  const db = await getDb();
  await db!
    .update(consultations)
    .set({
      status: "in_progress",
      startTime: new Date(),
    })
    .where(eq(consultations.id, id));
}

export async function endConsultation(id: number, data?: {
  notes?: string;
  diagnosis?: string;
  prescriptionGenerated?: boolean;
}) {
  const db = await getDb();
  const endTime = new Date();
  
  // Get start time to calculate duration
  const consultation = await getConsultationById(id);
  const duration = consultation?.startTime 
    ? Math.round((endTime.getTime() - new Date(consultation.startTime).getTime()) / 60000)
    : null;
  
  await db!
    .update(consultations)
    .set({
      status: "completed",
      endTime,
      duration,
      ...data,
    })
    .where(eq(consultations.id, id));
}

export async function saveChatTranscript(id: number, messages: any[]) {
  const db = await getDb();
  await db!
    .update(consultations)
    .set({
      chatTranscript: JSON.stringify(messages),
    })
    .where(eq(consultations.id, id));
}

export async function rateConsultation(id: number, rating: number, feedback?: string) {
  const db = await getDb();
  await db!
    .update(consultations)
    .set({
      patientRating: rating,
      patientFeedback: feedback,
    })
    .where(eq(consultations.id, id));
}
