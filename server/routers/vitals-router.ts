import { router, protectedProcedure } from "../_core/trpc";
import { z } from "zod";
import { getDb } from "../db";
import { patientVitals } from "../../drizzle/schema";
import { eq, desc } from "drizzle-orm";
import { TRPCError } from "@trpc/server";

export const vitalsRouter = router({
  /**
   * Log a new vital signs measurement from camera-based scanning
   */
  logVital: protectedProcedure
    .input(z.object({
      heartRate: z.number().min(30).max(250),
      confidence: z.number().min(0).max(100),
      stress: z.enum(["LOW", "NORMAL", "HIGH"]),
      measurementDuration: z.number().optional(),
      deviceInfo: z.object({
        browser: z.string().optional(),
        cameraResolution: z.string().optional(),
        userAgent: z.string().optional(),
      }).optional(),
      environmentalFactors: z.object({
        lightingQuality: z.enum(["poor", "fair", "good", "excellent"]).optional(),
        movementDetected: z.boolean().optional(),
        faceDetectionConfidence: z.number().optional(),
      }).optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });

      await db.insert(patientVitals).values({
        userId: ctx.user.id,
        heartRate: input.heartRate,
        stressLevel: input.stress,
        confidenceScore: input.confidence,
        measurementDuration: input.measurementDuration,
        deviceInfo: input.deviceInfo ? JSON.stringify(input.deviceInfo) : null,
        environmentalFactors: input.environmentalFactors ? JSON.stringify(input.environmentalFactors) : null,
      });
      
      return { success: true, message: "Vital signs recorded successfully" };
    }),

  /**
   * Get recent vital signs measurements for the current user
   */
  getRecent: protectedProcedure
    .input(z.object({
      limit: z.number().min(1).max(100).default(10),
    }).optional())
    .query(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });

      const limit = input?.limit ?? 10;
      
      const vitals = await db.query.patientVitals.findMany({
        where: eq(patientVitals.userId, ctx.user.id),
        orderBy: [desc(patientVitals.createdAt)],
        limit,
      });

      // Parse JSON fields for frontend consumption
      return vitals.map(vital => ({
        ...vital,
        deviceInfo: vital.deviceInfo ? JSON.parse(vital.deviceInfo) : null,
        environmentalFactors: vital.environmentalFactors ? JSON.parse(vital.environmentalFactors) : null,
      }));
    }),

  /**
   * Get vital signs statistics and trends
   */
  getStats: protectedProcedure
    .query(async ({ ctx }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });

      const vitals = await db.query.patientVitals.findMany({
        where: eq(patientVitals.userId, ctx.user.id),
        orderBy: [desc(patientVitals.createdAt)],
        limit: 30, // Last 30 measurements
      });

      if (vitals.length === 0) {
        return {
          totalMeasurements: 0,
          averageHeartRate: null,
          lowestHeartRate: null,
          highestHeartRate: null,
          averageConfidence: null,
          stressDistribution: { LOW: 0, NORMAL: 0, HIGH: 0 },
        };
      }

      const heartRates = vitals.map(v => v.heartRate).filter(hr => hr !== null) as number[];
      const confidenceScores = vitals.map(v => v.confidenceScore).filter(c => c !== null) as number[];
      
      const stressDistribution = vitals.reduce((acc, v) => {
        if (v.stressLevel) {
          acc[v.stressLevel as keyof typeof acc] = (acc[v.stressLevel as keyof typeof acc] || 0) + 1;
        }
        return acc;
      }, { LOW: 0, NORMAL: 0, HIGH: 0 });

      return {
        totalMeasurements: vitals.length,
        averageHeartRate: heartRates.length > 0 
          ? Math.round(heartRates.reduce((a, b) => a + b, 0) / heartRates.length)
          : null,
        lowestHeartRate: heartRates.length > 0 ? Math.min(...heartRates) : null,
        highestHeartRate: heartRates.length > 0 ? Math.max(...heartRates) : null,
        averageConfidence: confidenceScores.length > 0
          ? Math.round(confidenceScores.reduce((a, b) => a + b, 0) / confidenceScores.length)
          : null,
        stressDistribution,
        recentTrend: vitals.slice(0, 7).reverse(), // Last 7 measurements for chart
      };
    }),

  /**
   * Delete a specific vital measurement (for privacy/corrections)
   */
  deleteVital: protectedProcedure
    .input(z.object({
      id: z.number(),
    }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });

      // Verify ownership before deletion
      const vital = await db.query.patientVitals.findFirst({
        where: eq(patientVitals.id, input.id),
      });

      if (!vital || vital.userId !== ctx.user.id) {
        throw new Error("Vital measurement not found or unauthorized");
      }

      await db.delete(patientVitals).where(eq(patientVitals.id, input.id));
      
      return { success: true, message: "Vital measurement deleted" };
    }),
});
