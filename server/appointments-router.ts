import { router, protectedProcedure } from "./_core/trpc";
import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { getDb } from "./db";
import { appointments, users } from "../drizzle/schema";
import { eq, and, gte, lte, desc, asc } from "drizzle-orm";

/**
 * Appointments Router
 * Handles appointment booking and management
 */

export const appointmentsRouter = router({
  /**
   * Create a new appointment
   */
  createAppointment: protectedProcedure
    .input(
      z.object({
        appointmentDate: z.string(), // ISO date string
        duration: z.number().optional().default(30),
        appointmentType: z.enum([
          "consultation",
          "follow_up",
          "emergency",
          "screening",
          "vaccination",
          "other",
        ]),
        facilityName: z.string().optional(),
        facilityAddress: z.string().optional(),
        clinicianId: z.number().optional(),
        chiefComplaint: z.string().optional(),
        notes: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Database unavailable",
        });
      }

      try {
        const appointmentDate = new Date(input.appointmentDate);

        // Validate date is in the future
        if (appointmentDate < new Date()) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: "Appointment date must be in the future",
          });
        }

        // Create appointment
        const [result] = await db.insert(appointments).values({
          patientId: ctx.user.id,
          appointmentDate,
          duration: input.duration,
          appointmentType: input.appointmentType,
          facilityName: input.facilityName || null,
          facilityAddress: input.facilityAddress || null,
          clinicianId: input.clinicianId || null,
          chiefComplaint: input.chiefComplaint || null,
          notes: input.notes || null,
          status: "pending",
        });

        return {
          success: true,
          appointmentId: result.insertId,
          message: "Appointment booked successfully",
        };
      } catch (error) {
        console.error("[Appointments] Create error:", error);
        if (error instanceof TRPCError) throw error;
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to create appointment",
        });
      }
    }),

  /**
   * Get user's appointments
   */
  getMyAppointments: protectedProcedure
    .input(
      z
        .object({
          status: z
            .enum(["pending", "confirmed", "completed", "cancelled", "no_show"])
            .optional(),
          upcoming: z.boolean().optional(),
        })
        .optional()
    )
    .query(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Database unavailable",
        });
      }

      try {
        // Build where conditions
        const conditions = [eq(appointments.patientId, ctx.user.id)];

        // Filter by status if provided
        if (input?.status) {
          conditions.push(eq(appointments.status, input.status));
        }

        // Filter upcoming appointments
        if (input?.upcoming) {
          conditions.push(gte(appointments.appointmentDate, new Date()));
        }

        const results = await db
          .select()
          .from(appointments)
          .where(and(...conditions))
          .orderBy(desc(appointments.appointmentDate));

        return results;
      } catch (error) {
        console.error("[Appointments] Get appointments error:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to retrieve appointments",
        });
      }
    }),

  /**
   * Get appointment by ID
   */
  getAppointmentById: protectedProcedure
    .input(z.object({ appointmentId: z.number() }))
    .query(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Database unavailable",
        });
      }

      try {
        const [appointment] = await db
          .select()
          .from(appointments)
          .where(eq(appointments.id, input.appointmentId))
          .limit(1);

        if (!appointment) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Appointment not found",
          });
        }

        // Verify ownership
        if (appointment.patientId !== ctx.user.id && appointment.clinicianId !== ctx.user.id) {
          throw new TRPCError({
            code: "FORBIDDEN",
            message: "You don't have permission to view this appointment",
          });
        }

        return appointment;
      } catch (error) {
        console.error("[Appointments] Get appointment error:", error);
        if (error instanceof TRPCError) throw error;
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to retrieve appointment",
        });
      }
    }),

  /**
   * Update appointment status
   */
  updateAppointmentStatus: protectedProcedure
    .input(
      z.object({
        appointmentId: z.number(),
        status: z.enum(["pending", "confirmed", "completed", "cancelled", "no_show"]),
        cancellationReason: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Database unavailable",
        });
      }

      try {
        // Get appointment
        const [appointment] = await db
          .select()
          .from(appointments)
          .where(eq(appointments.id, input.appointmentId))
          .limit(1);

        if (!appointment) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Appointment not found",
          });
        }

        // Verify ownership
        if (appointment.patientId !== ctx.user.id && appointment.clinicianId !== ctx.user.id) {
          throw new TRPCError({
            code: "FORBIDDEN",
            message: "You don't have permission to update this appointment",
          });
        }

        // Update appointment
        const updateData: any = {
          status: input.status,
        };

        if (input.status === "cancelled") {
          updateData.cancelledBy = ctx.user.id;
          updateData.cancelledAt = new Date();
          if (input.cancellationReason) {
            updateData.cancellationReason = input.cancellationReason;
          }
        }

        await db
          .update(appointments)
          .set(updateData)
          .where(eq(appointments.id, input.appointmentId));

        return {
          success: true,
          message: "Appointment updated successfully",
        };
      } catch (error) {
        console.error("[Appointments] Update status error:", error);
        if (error instanceof TRPCError) throw error;
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to update appointment",
        });
      }
    }),

  /**
   * Reschedule appointment
   */
  rescheduleAppointment: protectedProcedure
    .input(
      z.object({
        appointmentId: z.number(),
        newDate: z.string(), // ISO date string
      })
    )
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Database unavailable",
        });
      }

      try {
        const newDate = new Date(input.newDate);

        // Validate date is in the future
        if (newDate < new Date()) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: "New appointment date must be in the future",
          });
        }

        // Get appointment
        const [appointment] = await db
          .select()
          .from(appointments)
          .where(eq(appointments.id, input.appointmentId))
          .limit(1);

        if (!appointment) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Appointment not found",
          });
        }

        // Verify ownership
        if (appointment.patientId !== ctx.user.id) {
          throw new TRPCError({
            code: "FORBIDDEN",
            message: "You don't have permission to reschedule this appointment",
          });
        }

        // Update appointment date
        await db
          .update(appointments)
          .set({
            appointmentDate: newDate,
            status: "pending", // Reset to pending after rescheduling
          })
          .where(eq(appointments.id, input.appointmentId));

        return {
          success: true,
          message: "Appointment rescheduled successfully",
        };
      } catch (error) {
        console.error("[Appointments] Reschedule error:", error);
        if (error instanceof TRPCError) throw error;
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to reschedule appointment",
        });
      }
    }),

  /**
   * Get appointment statistics
   */
  getAppointmentStats: protectedProcedure.query(async ({ ctx }) => {
    const db = await getDb();
    if (!db) {
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: "Database unavailable",
      });
    }

    try {
      const allAppointments = await db
        .select()
        .from(appointments)
        .where(eq(appointments.patientId, ctx.user.id));

      const now = new Date();
      const upcoming = allAppointments.filter(
        (apt) => new Date(apt.appointmentDate) > now && apt.status !== "cancelled"
      );
      const past = allAppointments.filter((apt) => new Date(apt.appointmentDate) <= now);
      const cancelled = allAppointments.filter((apt) => apt.status === "cancelled");

      return {
        total: allAppointments.length,
        upcoming: upcoming.length,
        past: past.length,
        cancelled: cancelled.length,
        byStatus: {
          pending: allAppointments.filter((apt) => apt.status === "pending").length,
          confirmed: allAppointments.filter((apt) => apt.status === "confirmed").length,
          completed: allAppointments.filter((apt) => apt.status === "completed").length,
          cancelled: cancelled.length,
          no_show: allAppointments.filter((apt) => apt.status === "no_show").length,
        },
      };
    } catch (error) {
      console.error("[Appointments] Stats error:", error);
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: "Failed to get appointment statistics",
      });
    }
  }),
});
