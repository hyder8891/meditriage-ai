/**
 * Calendar tRPC Router
 * Handles all calendar and appointment booking operations
 */

import { z } from "zod";
import { publicProcedure, protectedProcedure, router } from "./_core/trpc";
import { TRPCError } from "@trpc/server";
import * as calendarDb from "./calendar-db";
import * as slotGenerator from "./slot-generator";
import { getDb } from "./db";
import { appointments } from "../drizzle/schema";
import { eq } from "drizzle-orm";

export const calendarRouter = router({
  // ============================================
  // DOCTOR WORKING HOURS MANAGEMENT
  // ============================================

  /**
   * Get doctor's working hours
   */
  getWorkingHours: protectedProcedure
    .input(z.object({ doctorId: z.number().optional() }))
    .query(async ({ ctx, input }) => {
      const doctorId = input.doctorId || ctx.user.id;
      
      // Check if user is doctor or requesting their own schedule
      if (ctx.user.role !== "doctor" && ctx.user.role !== "clinician" && doctorId !== ctx.user.id) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Not authorized to view this schedule",
        });
      }

      return calendarDb.getDoctorWorkingHours(doctorId);
    }),

  /**
   * Set doctor working hours
   */
  setWorkingHours: protectedProcedure
    .input(
      z.object({
        dayOfWeek: z.number().min(0).max(6),
        startTime: z.string().regex(/^\d{2}:\d{2}:\d{2}$/),
        endTime: z.string().regex(/^\d{2}:\d{2}:\d{2}$/),
        slotDuration: z.number().min(15).max(120),
        bufferTime: z.number().min(0).max(60).optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      // Only doctors can set their own working hours
      if (ctx.user.role !== "doctor" && ctx.user.role !== "clinician") {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Only doctors can set working hours",
        });
      }

      await calendarDb.upsertDoctorWorkingHours({
        doctorId: ctx.user.id,
        ...input,
      });

      return { success: true };
    }),

  // ============================================
  // AVAILABILITY EXCEPTIONS
  // ============================================

  /**
   * Get availability exceptions
   */
  getExceptions: protectedProcedure
    .input(
      z.object({
        doctorId: z.number().optional(),
        startDate: z.string(),
        endDate: z.string(),
      })
    )
    .query(async ({ ctx, input }) => {
      const doctorId = input.doctorId || ctx.user.id;
      
      return calendarDb.getDoctorExceptions(
        doctorId,
        new Date(input.startDate),
        new Date(input.endDate)
      );
    }),

  /**
   * Create availability exception
   */
  createException: protectedProcedure
    .input(
      z.object({
        exceptionDate: z.string(),
        exceptionType: z.enum([
          "unavailable",
          "custom_hours",
          "holiday",
          "vacation",
          "conference",
          "emergency",
        ]),
        customStartTime: z.string().optional(),
        customEndTime: z.string().optional(),
        reason: z.string().optional(),
        notes: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      if (ctx.user.role !== "doctor" && ctx.user.role !== "clinician") {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Only doctors can create exceptions",
        });
      }

      await calendarDb.createAvailabilityException({
        doctorId: ctx.user.id,
        exceptionDate: new Date(input.exceptionDate),
        exceptionType: input.exceptionType,
        customStartTime: input.customStartTime,
        customEndTime: input.customEndTime,
        reason: input.reason,
        notes: input.notes,
      });

      return { success: true };
    }),

  // ============================================
  // SLOT GENERATION
  // ============================================

  /**
   * Generate slots for next N days
   */
  generateSlots: protectedProcedure
    .input(
      z.object({
        days: z.number().min(1).max(90).default(30),
      })
    )
    .mutation(async ({ ctx, input }) => {
      if (ctx.user.role !== "doctor" && ctx.user.role !== "clinician") {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Only doctors can generate slots",
        });
      }

      const result = await slotGenerator.generateSlotsForNextDays(
        ctx.user.id,
        input.days,
        ctx.user.id
      );

      if (!result.success) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: result.error || "Failed to generate slots",
        });
      }

      return result;
    }),

  /**
   * Generate slots for specific date range
   */
  generateSlotsForRange: protectedProcedure
    .input(
      z.object({
        startDate: z.string(),
        endDate: z.string(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      if (ctx.user.role !== "doctor" && ctx.user.role !== "clinician") {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Only doctors can generate slots",
        });
      }

      const result = await slotGenerator.generateSlotsForDateRange(
        ctx.user.id,
        input.startDate,
        input.endDate,
        ctx.user.id
      );

      if (!result.success) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: result.error || "Failed to generate slots",
        });
      }

      return result;
    }),

  // ============================================
  // SLOT VIEWING
  // ============================================

  /**
   * Get doctor's calendar slots
   */
  getDoctorSlots: protectedProcedure
    .input(
      z.object({
        doctorId: z.number().optional(),
        startDate: z.string(),
        endDate: z.string(),
        statusFilter: z.array(z.string()).optional(),
      })
    )
    .query(async ({ ctx, input }) => {
      const doctorId = input.doctorId || ctx.user.id;
      
      return calendarDb.getDoctorSlots(
        doctorId,
        new Date(input.startDate),
        new Date(input.endDate),
        input.statusFilter
      );
    }),

  /**
   * Get available slots for booking (patient view)
   */
  getAvailableSlots: publicProcedure
    .input(
      z.object({
        doctorId: z.number(),
        startDate: z.string(),
        endDate: z.string(),
      })
    )
    .query(async ({ input }) => {
      return calendarDb.getAvailableSlots(
        input.doctorId,
        new Date(input.startDate),
        new Date(input.endDate)
      );
    }),

  /**
   * Get next available slot for a doctor
   */
  getNextAvailableSlot: publicProcedure
    .input(z.object({ doctorId: z.number() }))
    .query(async ({ input }) => {
      return calendarDb.getNextAvailableSlot(input.doctorId);
    }),

  // ============================================
  // SLOT MANAGEMENT
  // ============================================

  /**
   * Block a slot manually
   */
  blockSlot: protectedProcedure
    .input(
      z.object({
        slotId: z.number(),
        reason: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      if (ctx.user.role !== "doctor" && ctx.user.role !== "clinician") {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Only doctors can block slots",
        });
      }

      // Verify slot belongs to this doctor
      const slot = await calendarDb.getSlotById(input.slotId);
      if (!slot || slot.doctorId !== ctx.user.id) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Slot not found or not authorized",
        });
      }

      await calendarDb.blockSlot(input.slotId, ctx.user.id, input.reason);
      return { success: true };
    }),

  /**
   * Unblock a slot
   */
  unblockSlot: protectedProcedure
    .input(z.object({ slotId: z.number() }))
    .mutation(async ({ ctx, input }) => {
      if (ctx.user.role !== "doctor" && ctx.user.role !== "clinician") {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Only doctors can unblock slots",
        });
      }

      const slot = await calendarDb.getSlotById(input.slotId);
      if (!slot || slot.doctorId !== ctx.user.id) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Slot not found or not authorized",
        });
      }

      await calendarDb.updateSlotStatus(input.slotId, "available");
      return { success: true };
    }),

  // ============================================
  // BOOKING REQUESTS
  // ============================================

  /**
   * Create booking request (patient books a slot)
   */
  createBookingRequest: protectedProcedure
    .input(
      z.object({
        slotId: z.number(),
        chiefComplaint: z.string().optional(),
        symptoms: z.string().optional(),
        urgencyLevel: z.string().optional(),
        triageRecordId: z.number().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      // Get slot details
      const slot = await calendarDb.getSlotById(input.slotId);
      if (!slot) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Slot not found",
        });
      }

      if (slot.status !== "available") {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Slot is not available",
        });
      }

      // Set expiration (24 hours from now)
      const expiresAt = new Date();
      expiresAt.setHours(expiresAt.getHours() + 24);

      // Create booking request
      await calendarDb.createBookingRequest({
        patientId: ctx.user.id,
        doctorId: slot.doctorId,
        slotId: input.slotId,
        chiefComplaint: input.chiefComplaint,
        symptoms: input.symptoms,
        urgencyLevel: input.urgencyLevel,
        triageRecordId: input.triageRecordId,
        expiresAt,
      });

      // Temporarily reserve the slot
      await calendarDb.updateSlotStatus(input.slotId, "booked", {
        patientId: ctx.user.id,
      });

      return { success: true, message: "Booking request sent to doctor" };
    }),

  /**
   * Get pending booking requests (for doctors)
   */
  getPendingRequests: protectedProcedure.query(async ({ ctx }) => {
    if (ctx.user.role !== "doctor" && ctx.user.role !== "clinician") {
      throw new TRPCError({
        code: "FORBIDDEN",
        message: "Only doctors can view booking requests",
      });
    }

    return calendarDb.getPendingBookingRequests(ctx.user.id);
  }),

  /**
   * Get patient's booking requests
   */
  getMyBookingRequests: protectedProcedure.query(async ({ ctx }) => {
    return calendarDb.getPatientBookingRequests(ctx.user.id);
  }),

  /**
   * Confirm booking request (doctor confirms)
   */
  confirmBookingRequest: protectedProcedure
    .input(z.object({ requestId: z.number() }))
    .mutation(async ({ ctx, input }) => {
      if (ctx.user.role !== "doctor" && ctx.user.role !== "clinician") {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Only doctors can confirm bookings",
        });
      }

      // Get booking request
      const request = await calendarDb.getBookingRequestById(input.requestId);
      if (!request || request.doctorId !== ctx.user.id) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Booking request not found",
        });
      }

      if (request.status !== "pending") {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Booking request is not pending",
        });
      }

      // Get slot details
      const slot = await calendarDb.getSlotById(request.slotId);
      if (!slot) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Slot not found",
        });
      }

      // Create appointment
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      // Combine date and time into timestamp
      const appointmentDateTime = new Date(`${slot.slotDate}T${slot.startTime}`);
      
      const [appointment] = await db
        .insert(appointments)
        .values({
          patientId: request.patientId,
          clinicianId: ctx.user.id,
          appointmentDate: appointmentDateTime,
          duration: 30, // default duration
          appointmentType: "consultation",
          status: "confirmed",
          chiefComplaint: request.chiefComplaint,
          notes: request.symptoms,
        })
        .$returningId();

      // Confirm booking request
      await calendarDb.confirmBookingRequest(
        input.requestId,
        ctx.user.id,
        appointment.id
      );

      // Update slot with appointment ID
      await calendarDb.updateSlotStatus(request.slotId, "booked", {
        appointmentId: appointment.id,
      });

      return { success: true, appointmentId: appointment.id };
    }),

  /**
   * Reject booking request (doctor rejects)
   */
  rejectBookingRequest: protectedProcedure
    .input(
      z.object({
        requestId: z.number(),
        reason: z.string().optional(),
        suggestedSlots: z.array(z.number()).optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      if (ctx.user.role !== "doctor" && ctx.user.role !== "clinician") {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Only doctors can reject bookings",
        });
      }

      const request = await calendarDb.getBookingRequestById(input.requestId);
      if (!request || request.doctorId !== ctx.user.id) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Booking request not found",
        });
      }

      // Reject booking request
      await calendarDb.rejectBookingRequest(
        input.requestId,
        ctx.user.id,
        input.reason,
        input.suggestedSlots
      );

      // Release the slot
      await calendarDb.releaseSlot(request.slotId);

      return { success: true };
    }),

  /**
   * Cancel booking request (patient cancels)
   */
  cancelBookingRequest: protectedProcedure
    .input(z.object({ requestId: z.number() }))
    .mutation(async ({ ctx, input }) => {
      const request = await calendarDb.getBookingRequestById(input.requestId);
      if (!request || request.patientId !== ctx.user.id) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Booking request not found",
        });
      }

      if (request.status !== "pending") {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Can only cancel pending requests",
        });
      }

      // Cancel booking request
      await calendarDb.cancelBookingRequest(input.requestId);

      // Release the slot
      await calendarDb.releaseSlot(request.slotId);

      return { success: true };
    }),

  // ============================================
  // SLOT GENERATION HISTORY
  // ============================================

  /**
   * Get slot generation history
   */
  getGenerationHistory: protectedProcedure
    .input(z.object({ limit: z.number().min(1).max(50).default(10) }))
    .query(async ({ ctx, input }) => {
      if (ctx.user.role !== "doctor" && ctx.user.role !== "clinician") {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Only doctors can view generation history",
        });
      }

      return calendarDb.getSlotGenerationHistory(ctx.user.id, input.limit);
    }),
});
