/**
 * Calendar Database Helpers
 * Handles doctor availability, slot management, and booking workflows
 */

import { getDb } from "./db";
import {
  doctorWorkingHours,
  calendarSlots,
  doctorAvailabilityExceptions,
  appointmentBookingRequests,
  slotGenerationHistory,
  appointments,
} from "../drizzle/schema";
import { eq, and, gte, lte, between, sql, inArray, or } from "drizzle-orm";

/**
 * Get doctor's working hours
 */
export async function getDoctorWorkingHours(doctorId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  return db
    .select()
    .from(doctorWorkingHours)
    .where(
      and(
        eq(doctorWorkingHours.doctorId, doctorId),
        eq(doctorWorkingHours.isActive, true)
      )
    );
}

/**
 * Create or update doctor working hours
 */
export async function upsertDoctorWorkingHours(data: {
  doctorId: number;
  dayOfWeek: number;
  startTime: string;
  endTime: string;
  slotDuration: number;
  bufferTime?: number;
}) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  return db.insert(doctorWorkingHours).values(data);
}

/**
 * Get availability exceptions for a doctor
 */
export async function getDoctorExceptions(
  doctorId: number,
  startDate: Date,
  endDate: Date
) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  return db
    .select()
    .from(doctorAvailabilityExceptions)
    .where(
      and(
        eq(doctorAvailabilityExceptions.doctorId, doctorId),
        between(
          doctorAvailabilityExceptions.exceptionDate,
          startDate,
          endDate
        )
      )
    );
}

/**
 * Create availability exception
 */
export async function createAvailabilityException(data: {
  doctorId: number;
  exceptionDate: Date;
  exceptionType: "unavailable" | "custom_hours" | "holiday" | "vacation" | "conference" | "emergency";
  customStartTime?: string;
  customEndTime?: string;
  reason?: string;
  notes?: string;
}) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  return db.insert(doctorAvailabilityExceptions).values(data);
}

/**
 * Get calendar slots for a doctor within date range
 */
export async function getDoctorSlots(
  doctorId: number,
  startDate: Date,
  endDate: Date,
  statusFilter?: string[]
) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const conditions = [
    eq(calendarSlots.doctorId, doctorId),
    between(calendarSlots.slotDate, startDate, endDate),
  ];

  if (statusFilter && statusFilter.length > 0) {
    conditions.push(inArray(calendarSlots.status, statusFilter as any));
  }

  return db
    .select()
    .from(calendarSlots)
    .where(and(...conditions))
    .orderBy(calendarSlots.slotStart);
}

/**
 * Get available slots for booking
 */
export async function getAvailableSlots(
  doctorId: number,
  startDate: Date,
  endDate: Date
) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  return db
    .select()
    .from(calendarSlots)
    .where(
      and(
        eq(calendarSlots.doctorId, doctorId),
        between(calendarSlots.slotDate, startDate, endDate),
        eq(calendarSlots.status, "available"),
        gte(calendarSlots.slotStart, new Date()) // Only future slots
      )
    )
    .orderBy(calendarSlots.slotStart);
}

/**
 * Get a specific slot by ID
 */
export async function getSlotById(slotId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const result = await db
    .select()
    .from(calendarSlots)
    .where(eq(calendarSlots.id, slotId))
    .limit(1);
  return result[0];
}

/**
 * Create a calendar slot
 */
export async function createCalendarSlot(data: {
  doctorId: number;
  slotDate: Date;
  startTime: string;
  endTime: string;
  slotStart: Date;
  slotEnd: Date;
  status?: "available" | "booked" | "blocked" | "completed" | "cancelled" | "no_show" | "past";
  slotType?: "regular" | "emergency" | "follow_up" | "break" | "personal";
  generatedFrom?: number;
  isManual?: boolean;
  notes?: string;
}) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  return db.insert(calendarSlots).values(data as any);
}

/**
 * Update slot status (for booking/blocking)
 */
export async function updateSlotStatus(
  slotId: number,
  status: string,
  additionalData?: {
    appointmentId?: number;
    patientId?: number;
    blockedBy?: number;
    blockReason?: string;
  }
) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  return db
    .update(calendarSlots)
    .set({
      status: status as any,
      ...additionalData,
      updatedAt: new Date(),
    })
    .where(eq(calendarSlots.id, slotId));
}

/**
 * Book a slot (atomic operation to prevent double-booking)
 */
export async function bookSlot(
  slotId: number,
  patientId: number,
  appointmentId: number
) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  // Use optimistic locking to prevent race conditions
  const result = await db
    .update(calendarSlots)
    .set({
      status: "booked",
      patientId,
      appointmentId,
      updatedAt: new Date(),
    })
    .where(
      and(
        eq(calendarSlots.id, slotId),
        eq(calendarSlots.status, "available") // Only book if still available
      )
    );

  return result;
}

/**
 * Release a slot (when appointment is cancelled)
 */
export async function releaseSlot(slotId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  return db
    .update(calendarSlots)
    .set({
      status: "available",
      patientId: null,
      appointmentId: null,
      updatedAt: new Date(),
    })
    .where(eq(calendarSlots.id, slotId));
}

/**
 * Block a slot manually
 */
export async function blockSlot(
  slotId: number,
  blockedBy: number,
  reason?: string
) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  return db
    .update(calendarSlots)
    .set({
      status: "blocked",
      blockedBy,
      blockReason: reason,
      updatedAt: new Date(),
    })
    .where(eq(calendarSlots.id, slotId));
}

/**
 * Create booking request
 */
export async function createBookingRequest(data: {
  patientId: number;
  doctorId: number;
  slotId: number;
  chiefComplaint?: string;
  symptoms?: string;
  urgencyLevel?: string;
  triageRecordId?: number;
  expiresAt?: Date;
}) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  return db.insert(appointmentBookingRequests).values(data);
}

/**
 * Get booking request by ID
 */
export async function getBookingRequestById(requestId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const result = await db
    .select()
    .from(appointmentBookingRequests)
    .where(eq(appointmentBookingRequests.id, requestId))
    .limit(1);
  return result[0];
}

/**
 * Get pending booking requests for a doctor
 */
export async function getPendingBookingRequests(doctorId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  return db
    .select()
    .from(appointmentBookingRequests)
    .where(
      and(
        eq(appointmentBookingRequests.doctorId, doctorId),
        eq(appointmentBookingRequests.status, "pending")
      )
    )
    .orderBy(appointmentBookingRequests.createdAt);
}

/**
 * Get booking requests for a patient
 */
export async function getPatientBookingRequests(patientId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  return db
    .select()
    .from(appointmentBookingRequests)
    .where(eq(appointmentBookingRequests.patientId, patientId))
    .orderBy(appointmentBookingRequests.createdAt);
}

/**
 * Confirm booking request
 */
export async function confirmBookingRequest(
  requestId: number,
  confirmedBy: number,
  appointmentId: number
) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  return db
    .update(appointmentBookingRequests)
    .set({
      status: "confirmed",
      confirmedBy,
      confirmedAt: new Date(),
      appointmentId,
      updatedAt: new Date(),
    })
    .where(eq(appointmentBookingRequests.id, requestId));
}

/**
 * Reject booking request
 */
export async function rejectBookingRequest(
  requestId: number,
  rejectedBy: number,
  reason?: string,
  suggestedSlots?: number[]
) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  return db
    .update(appointmentBookingRequests)
    .set({
      status: "rejected",
      rejectedBy,
      rejectedAt: new Date(),
      rejectionReason: reason,
      suggestedSlots: suggestedSlots ? JSON.stringify(suggestedSlots) : null,
      updatedAt: new Date(),
    })
    .where(eq(appointmentBookingRequests.id, requestId));
}

/**
 * Cancel booking request (by patient)
 */
export async function cancelBookingRequest(requestId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  return db
    .update(appointmentBookingRequests)
    .set({
      status: "cancelled",
      updatedAt: new Date(),
    })
    .where(eq(appointmentBookingRequests.id, requestId));
}

/**
 * Record slot generation history
 */
export async function recordSlotGeneration(data: {
  doctorId: number;
  startDate: Date;
  endDate: Date;
  slotsGenerated: number;
  workingHoursUsed?: string;
  generationType: "manual" | "automatic" | "bulk" | "recurring";
  triggeredBy?: number;
  status: "success" | "partial" | "failed";
  errorMessage?: string;
}) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  return db.insert(slotGenerationHistory).values(data);
}

/**
 * Get slot generation history for a doctor
 */
export async function getSlotGenerationHistory(
  doctorId: number,
  limit: number = 10
) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  return db
    .select()
    .from(slotGenerationHistory)
    .where(eq(slotGenerationHistory.doctorId, doctorId))
    .orderBy(sql`${slotGenerationHistory.createdAt} DESC`)
    .limit(limit);
}

/**
 * Check for slot conflicts
 */
export async function checkSlotConflicts(
  doctorId: number,
  slotStart: Date,
  slotEnd: Date
) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  return db
    .select()
    .from(calendarSlots)
    .where(
      and(
        eq(calendarSlots.doctorId, doctorId),
        or(
          // Overlapping slots
          and(
            lte(calendarSlots.slotStart, slotStart),
            gte(calendarSlots.slotEnd, slotStart)
          ),
          and(
            lte(calendarSlots.slotStart, slotEnd),
            gte(calendarSlots.slotEnd, slotEnd)
          ),
          and(
            gte(calendarSlots.slotStart, slotStart),
            lte(calendarSlots.slotEnd, slotEnd)
          )
        )
      )
    );
}

/**
 * Get next available slot for a doctor
 */
export async function getNextAvailableSlot(doctorId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const result = await db
    .select()
    .from(calendarSlots)
    .where(
      and(
        eq(calendarSlots.doctorId, doctorId),
        eq(calendarSlots.status, "available"),
        gte(calendarSlots.slotStart, new Date())
      )
    )
    .orderBy(calendarSlots.slotStart)
    .limit(1);
  return result[0];
}

/**
 * Bulk create slots
 */
export async function bulkCreateSlots(
  slots: Array<{
    doctorId: number;
    slotDate: Date;
    startTime: string;
    endTime: string;
    slotStart: Date;
    slotEnd: Date;
    status?: "available" | "booked" | "blocked" | "completed" | "cancelled" | "no_show" | "past";
    slotType?: "regular" | "emergency" | "follow_up" | "break" | "personal";
    generatedFrom?: number;
    isManual?: boolean;
    notes?: string;
  }>
) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  if (slots.length === 0) return;
  return db.insert(calendarSlots).values(slots as any);
}

/**
 * Mark past slots as expired
 */
export async function markPastSlotsAsExpired(doctorId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  return db
    .update(calendarSlots)
    .set({
      status: "past",
      updatedAt: new Date(),
    })
    .where(
      and(
        eq(calendarSlots.doctorId, doctorId),
        eq(calendarSlots.status, "available"),
        lte(calendarSlots.slotEnd, new Date())
      )
    );
}
