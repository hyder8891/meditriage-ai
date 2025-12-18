import { getDb } from "./db";
import { appointments, type InsertAppointment } from "../drizzle/schema";
import { eq, and, gte, lte, or, desc } from "drizzle-orm";

/**
 * Create a new appointment
 */
export async function createAppointment(data: InsertAppointment) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const result = await db.insert(appointments).values(data);
  return result[0].insertId;
}

/**
 * Get appointment by ID
 */
export async function getAppointmentById(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const [appointment] = await db
    .select()
    .from(appointments)
    .where(eq(appointments.id, id));
  return appointment;
}

/**
 * Get appointments by patient ID
 */
export async function getAppointmentsByPatientId(patientId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  return db
    .select()
    .from(appointments)
    .where(eq(appointments.patientId, patientId))
    .orderBy(desc(appointments.appointmentDate));
}

/**
 * Get appointments by clinician ID
 */
export async function getAppointmentsByClinicianId(clinicianId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  return db
    .select()
    .from(appointments)
    .where(eq(appointments.clinicianId, clinicianId))
    .orderBy(desc(appointments.appointmentDate));
}

/**
 * Get appointments by date range
 */
export async function getAppointmentsByDateRange(startDate: Date, endDate: Date) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  return db
    .select()
    .from(appointments)
    .where(
      and(
        gte(appointments.appointmentDate, startDate),
        lte(appointments.appointmentDate, endDate)
      )
    )
    .orderBy(appointments.appointmentDate);
}

/**
 * Get appointments by clinician and date range
 */
export async function getAppointmentsByClinicianAndDateRange(
  clinicianId: number,
  startDate: Date,
  endDate: Date
) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  return db
    .select()
    .from(appointments)
    .where(
      and(
        eq(appointments.clinicianId, clinicianId),
        gte(appointments.appointmentDate, startDate),
        lte(appointments.appointmentDate, endDate)
      )
    )
    .orderBy(appointments.appointmentDate);
}

/**
 * Update appointment status
 */
export async function updateAppointmentStatus(
  id: number,
  status: "pending" | "confirmed" | "completed" | "cancelled" | "no_show"
) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  await db
    .update(appointments)
    .set({ status })
    .where(eq(appointments.id, id));
}

/**
 * Cancel appointment
 */
export async function cancelAppointment(
  id: number,
  cancelledBy: number,
  cancellationReason?: string
) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  await db
    .update(appointments)
    .set({
      status: "cancelled",
      cancelledBy,
      cancellationReason,
      cancelledAt: new Date(),
    })
    .where(eq(appointments.id, id));
}

/**
 * Mark reminder as sent
 */
export async function markReminderSent(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  await db
    .update(appointments)
    .set({
      reminderSent: true,
      reminderSentAt: new Date(),
    })
    .where(eq(appointments.id, id));
}

/**
 * Get upcoming appointments that need reminders
 * (appointments in next 24 hours that haven't been reminded yet)
 */
export async function getAppointmentsNeedingReminders() {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const now = new Date();
  const tomorrow = new Date(now.getTime() + 24 * 60 * 60 * 1000);
  
  return db
    .select()
    .from(appointments)
    .where(
      and(
        eq(appointments.reminderSent, false),
        or(
          eq(appointments.status, "pending"),
          eq(appointments.status, "confirmed")
        ),
        gte(appointments.appointmentDate, now),
        lte(appointments.appointmentDate, tomorrow)
      )
    );
}

/**
 * Check for appointment conflicts
 */
export async function checkAppointmentConflicts(
  clinicianId: number,
  appointmentDate: Date,
  duration: number,
  excludeAppointmentId?: number
) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const endTime = new Date(appointmentDate.getTime() + duration * 60 * 1000);
  
  const conflicts = await db
    .select()
    .from(appointments)
    .where(
      and(
        eq(appointments.clinicianId, clinicianId),
        or(
          eq(appointments.status, "pending"),
          eq(appointments.status, "confirmed")
        ),
        // Check for overlapping time slots
        or(
          and(
            gte(appointments.appointmentDate, appointmentDate),
            lte(appointments.appointmentDate, endTime)
          ),
          and(
            lte(appointments.appointmentDate, appointmentDate),
            gte(appointments.appointmentDate, endTime)
          )
        )
      )
    );
  
  // Exclude the current appointment if updating
  if (excludeAppointmentId) {
    return conflicts.filter((apt: any) => apt.id !== excludeAppointmentId);
  }
  
  return conflicts;
}

/**
 * Update appointment
 */
export async function updateAppointment(
  id: number,
  data: Partial<InsertAppointment>
) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  await db
    .update(appointments)
    .set(data)
    .where(eq(appointments.id, id));
}

/**
 * Delete appointment
 */
export async function deleteAppointment(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  await db.delete(appointments).where(eq(appointments.id, id));
}
