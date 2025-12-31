import { router, protectedProcedure } from "./_core/trpc";
import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { getDb } from "./db";
import { prescriptions, medicationAdherence } from "../drizzle/schema";
import { eq, and, gte, lte, desc } from "drizzle-orm";

/**
 * Medications Router
 * Handles medication management and reminders
 */

export const medicationsRouter = router({
  /**
   * Add a new medication (patient self-management)
   */
  addMedication: protectedProcedure
    .input(
      z.object({
        medicationName: z.string(),
        genericName: z.string().optional(),
        dosage: z.string(),
        frequency: z.string(),
        route: z.string().optional(),
        startDate: z.string(), // ISO date string
        endDate: z.string().optional(),
        duration: z.number().optional(),
        instructions: z.string().optional(),
        warnings: z.string().optional(),
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
        const startDate = new Date(input.startDate);
        const endDate = input.endDate ? new Date(input.endDate) : null;

        // Create prescription (self-managed, no clinician)
        const [result] = await db.insert(prescriptions).values({
          patientId: ctx.user.id,
          clinicianId: ctx.user.id, // Self-managed
          medicationName: input.medicationName,
          genericName: input.genericName || null,
          dosage: input.dosage,
          frequency: input.frequency,
          route: input.route || null,
          startDate,
          endDate,
          duration: input.duration || null,
          instructions: input.instructions || null,
          warnings: input.warnings || null,
          status: "active",
        });

        return {
          success: true,
          medicationId: result.insertId,
          message: "Medication added successfully",
        };
      } catch (error) {
        console.error("[Medications] Add error:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to add medication",
        });
      }
    }),

  /**
   * Get patient's medications
   */
  getMyMedications: protectedProcedure
    .input(
      z
        .object({
          status: z.enum(["active", "completed", "discontinued", "on_hold"]).optional(),
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
        const conditions = [eq(prescriptions.patientId, ctx.user.id)];

        if (input?.status) {
          conditions.push(eq(prescriptions.status, input.status));
        }

        const results = await db
          .select()
          .from(prescriptions)
          .where(and(...conditions))
          .orderBy(desc(prescriptions.createdAt));

        return results;
      } catch (error) {
        console.error("[Medications] Get medications error:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to retrieve medications",
        });
      }
    }),

  /**
   * Update medication status
   */
  updateMedicationStatus: protectedProcedure
    .input(
      z.object({
        medicationId: z.number(),
        status: z.enum(["active", "completed", "discontinued", "on_hold"]),
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
        // Verify ownership
        const [medication] = await db
          .select()
          .from(prescriptions)
          .where(eq(prescriptions.id, input.medicationId))
          .limit(1);

        if (!medication) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Medication not found",
          });
        }

        if (medication.patientId !== ctx.user.id) {
          throw new TRPCError({
            code: "FORBIDDEN",
            message: "You don't have permission to update this medication",
          });
        }

        // Update status
        await db
          .update(prescriptions)
          .set({ status: input.status })
          .where(eq(prescriptions.id, input.medicationId));

        return {
          success: true,
          message: "Medication status updated",
        };
      } catch (error) {
        console.error("[Medications] Update status error:", error);
        if (error instanceof TRPCError) throw error;
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to update medication status",
        });
      }
    }),

  /**
   * Mark medication as taken
   */
  markMedicationTaken: protectedProcedure
    .input(
      z.object({
        medicationId: z.number(),
        scheduledTime: z.string().optional(), // ISO date string
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
        // Verify ownership
        const [medication] = await db
          .select()
          .from(prescriptions)
          .where(eq(prescriptions.id, input.medicationId))
          .limit(1);

        if (!medication) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Medication not found",
          });
        }

        if (medication.patientId !== ctx.user.id) {
          throw new TRPCError({
            code: "FORBIDDEN",
            message: "You don't have permission to update this medication",
          });
        }

        // Record adherence
        const scheduledTime = input.scheduledTime ? new Date(input.scheduledTime) : new Date();

        await db.insert(medicationAdherence).values({
          prescriptionId: input.medicationId,
          patientId: ctx.user.id,
          scheduledTime,
          taken: true,
          takenAt: new Date(),
          missed: false,
        });

        return {
          success: true,
          message: "Medication marked as taken",
        };
      } catch (error) {
        console.error("[Medications] Mark taken error:", error);
        if (error instanceof TRPCError) throw error;
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to mark medication as taken",
        });
      }
    }),

  /**
   * Get medication adherence history
   */
  getAdherenceHistory: protectedProcedure
    .input(
      z.object({
        medicationId: z.number(),
        days: z.number().optional().default(30),
      })
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
        // Verify ownership
        const [medication] = await db
          .select()
          .from(prescriptions)
          .where(eq(prescriptions.id, input.medicationId))
          .limit(1);

        if (!medication) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Medication not found",
          });
        }

        if (medication.patientId !== ctx.user.id) {
          throw new TRPCError({
            code: "FORBIDDEN",
            message: "You don't have permission to view this medication",
          });
        }

        // Get adherence records
        const daysAgo = new Date();
        daysAgo.setDate(daysAgo.getDate() - input.days);

        const records = await db
          .select()
          .from(medicationAdherence)
          .where(
            and(
              eq(medicationAdherence.prescriptionId, input.medicationId),
              gte(medicationAdherence.scheduledTime, daysAgo)
            )
          )
          .orderBy(desc(medicationAdherence.scheduledTime));

        return records;
      } catch (error) {
        console.error("[Medications] Get adherence error:", error);
        if (error instanceof TRPCError) throw error;
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to retrieve adherence history",
        });
      }
    }),

  /**
   * Get medication statistics
   */
  getMedicationStats: protectedProcedure.query(async ({ ctx }) => {
    const db = await getDb();
    if (!db) {
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: "Database unavailable",
      });
    }

    try {
      const allMedications = await db
        .select()
        .from(prescriptions)
        .where(eq(prescriptions.patientId, ctx.user.id));

      const active = allMedications.filter((med) => med.status === "active");
      const completed = allMedications.filter((med) => med.status === "completed");
      const discontinued = allMedications.filter((med) => med.status === "discontinued");

      return {
        total: allMedications.length,
        active: active.length,
        completed: completed.length,
        discontinued: discontinued.length,
        byStatus: {
          active: active.length,
          completed: completed.length,
          discontinued: discontinued.length,
          on_hold: allMedications.filter((med) => med.status === "on_hold").length,
        },
      };
    } catch (error) {
      console.error("[Medications] Stats error:", error);
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: "Failed to get medication statistics",
      });
    }
  }),

  /**
   * Delete medication
   */
  deleteMedication: protectedProcedure
    .input(z.object({ medicationId: z.number() }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Database unavailable",
        });
      }

      try {
        // Verify ownership
        const [medication] = await db
          .select()
          .from(prescriptions)
          .where(eq(prescriptions.id, input.medicationId))
          .limit(1);

        if (!medication) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Medication not found",
          });
        }

        if (medication.patientId !== ctx.user.id) {
          throw new TRPCError({
            code: "FORBIDDEN",
            message: "You don't have permission to delete this medication",
          });
        }

        // Delete medication
        await db.delete(prescriptions).where(eq(prescriptions.id, input.medicationId));

        return {
          success: true,
          message: "Medication deleted successfully",
        };
      } catch (error) {
        console.error("[Medications] Delete error:", error);
        if (error instanceof TRPCError) throw error;
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to delete medication",
        });
      }
    }),
});
