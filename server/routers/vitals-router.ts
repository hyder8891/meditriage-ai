import { router, protectedProcedure } from "../_core/trpc";
import { z } from "zod";
import { getDb } from "../db";
import { patientVitals, bioScannerCalibration } from "../../drizzle/schema";
import { eq, desc, and, gte, lte, sql } from "drizzle-orm";
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
      // HRV metrics
      hrvRmssd: z.number().optional(),
      hrvSdnn: z.number().optional(),
      hrvPnn50: z.number().optional(),
      hrvLfHfRatio: z.number().optional(),
      hrvStressScore: z.number().min(0).max(100).optional(),
      hrvAnsBalance: z.enum(["PARASYMPATHETIC", "BALANCED", "SYMPATHETIC"]).optional(),
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
        hrvRmssd: input.hrvRmssd?.toString(),
        hrvSdnn: input.hrvSdnn?.toString(),
        hrvPnn50: input.hrvPnn50?.toString(),
        hrvLfHfRatio: input.hrvLfHfRatio?.toString(),
        hrvStressScore: input.hrvStressScore,
        hrvAnsBalance: input.hrvAnsBalance,
        deviceInfo: input.deviceInfo ? JSON.stringify(input.deviceInfo) : null,
        environmentalFactors: input.environmentalFactors ? JSON.stringify(input.environmentalFactors) : null,
      });
      
      return { success: true, message: "Vital signs recorded successfully" };
    }),

  /**
   * Get recent vital signs measurements for the current user
   * Using direct select instead of db.query to avoid schema issues
   */
  getRecent: protectedProcedure
    .input(z.object({
      limit: z.number().min(1).max(100).default(10),
    }).optional())
    .query(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });

      const limit = input?.limit ?? 10;
      
      // Use direct select instead of db.query
      const vitals = await db
        .select()
        .from(patientVitals)
        .where(eq(patientVitals.userId, ctx.user.id))
        .orderBy(desc(patientVitals.createdAt))
        .limit(limit);

      // Parse JSON fields for frontend consumption
      return vitals.map(vital => ({
        ...vital,
        deviceInfo: vital.deviceInfo ? JSON.parse(vital.deviceInfo) : null,
        environmentalFactors: vital.environmentalFactors ? JSON.parse(vital.environmentalFactors) : null,
      }));
    }),

  /**
   * Get vital signs statistics and trends
   * Using direct select and aggregation
   */
  getStats: protectedProcedure
    .query(async ({ ctx }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });

      // Get all vitals for the user using direct select
      const vitals = await db
        .select()
        .from(patientVitals)
        .where(eq(patientVitals.userId, ctx.user.id))
        .orderBy(desc(patientVitals.createdAt))
        .limit(30); // Last 30 measurements

      if (vitals.length === 0) {
        return {
          totalReadings: 0,
          avgHeartRate: 0,
          avgStress: 0,
          avgRMSSD: 0,
          avgSDNN: 0,
        };
      }

      // Calculate statistics
      const heartRates = vitals.map(v => v.heartRate).filter((hr): hr is number => hr !== null);
      const avgHeartRate = heartRates.length > 0
        ? Math.round(heartRates.reduce((sum, hr) => sum + hr, 0) / heartRates.length)
        : 0;

      const stressScores = vitals.map(v => v.hrvStressScore).filter((s): s is number => s !== null);
      const avgStress = stressScores.length > 0
        ? Math.round(stressScores.reduce((sum, s) => sum + s, 0) / stressScores.length)
        : 0;

      const rmssdValues = vitals
        .map(v => v.hrvRmssd ? parseFloat(v.hrvRmssd) : null)
        .filter((r): r is number => r !== null);
      const avgRMSSD = rmssdValues.length > 0
        ? Math.round(rmssdValues.reduce((sum, r) => sum + r, 0) / rmssdValues.length)
        : 0;

      const sdnnValues = vitals
        .map(v => v.hrvSdnn ? parseFloat(v.hrvSdnn) : null)
        .filter((s): s is number => s !== null);
      const avgSDNN = sdnnValues.length > 0
        ? Math.round(sdnnValues.reduce((sum, s) => sum + s, 0) / sdnnValues.length)
        : 0;

      return {
        totalReadings: vitals.length,
        avgHeartRate,
        avgStress,
        avgRMSSD,
        avgSDNN,
      };
    }),

  /**
   * Get vitals within a date range for trend analysis
   */
  getTrends: protectedProcedure
    .input(z.object({
      timeRange: z.enum(["24h", "7d", "30d", "all"]).default("7d"),
      metric: z.enum(["heartRate", "stress", "rmssd", "sdnn"]).default("heartRate"),
    }))
    .query(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });

      const conditions = [eq(patientVitals.userId, ctx.user.id)];
      
      // Calculate date range based on timeRange
      const now = new Date();
      let startDate: Date | null = null;
      
      switch (input.timeRange) {
        case "24h":
          startDate = new Date(now.getTime() - 24 * 60 * 60 * 1000);
          break;
        case "7d":
          startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
          break;
        case "30d":
          startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
          break;
        case "all":
          // No date filter
          break;
      }
      
      if (startDate) {
        conditions.push(gte(patientVitals.createdAt, startDate));
      }

      const vitals = await db
        .select()
        .from(patientVitals)
        .where(and(...conditions))
        .orderBy(patientVitals.createdAt);

      return vitals.map(vital => {
        let value: number | null = null;
        
        switch (input.metric) {
          case "heartRate":
            value = vital.heartRate;
            break;
          case "stress":
            value = vital.hrvStressScore;
            break;
          case "rmssd":
            value = vital.hrvRmssd ? parseFloat(vital.hrvRmssd) : null;
            break;
          case "sdnn":
            value = vital.hrvSdnn ? parseFloat(vital.hrvSdnn) : null;
            break;
        }
        
        return {
          timestamp: vital.createdAt,
          value,
          confidence: vital.confidenceScore,
        };
      }).filter(item => item.value !== null); // Filter out null values
    }),

  /**
   * Save or update calibration data for the current user
   */
  saveCalibration: protectedProcedure
    .input(z.object({
      referenceHeartRate: z.number().min(30).max(250),
      measuredHeartRate: z.number().min(30).max(250),
      referenceDevice: z.string().optional(),
      notes: z.string().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });

      const correctionFactor = input.referenceHeartRate / input.measuredHeartRate;

      // Check if calibration exists for this user
      const existing = await db
        .select()
        .from(bioScannerCalibration)
        .where(eq(bioScannerCalibration.userId, ctx.user.id))
        .limit(1);

      if (existing.length > 0) {
        // Update existing calibration
        await db
          .update(bioScannerCalibration)
          .set({
            referenceHeartRate: input.referenceHeartRate,
            measuredHeartRate: input.measuredHeartRate,
            correctionFactor: correctionFactor.toString(),
            referenceDevice: input.referenceDevice,
            notes: input.notes,
          })
          .where(eq(bioScannerCalibration.userId, ctx.user.id));
      } else {
        // Insert new calibration
        await db.insert(bioScannerCalibration).values({
          userId: ctx.user.id,
          referenceHeartRate: input.referenceHeartRate,
          measuredHeartRate: input.measuredHeartRate,
          correctionFactor: correctionFactor.toString(),
          referenceDevice: input.referenceDevice,
          notes: input.notes,
        });
      }

      return {
        success: true,
        correctionFactor: Number(correctionFactor.toFixed(4)),
        message: "Calibration saved successfully"
      };
    }),

  /**
   * Get calibration data for the current user
   */
  getCalibration: protectedProcedure
    .query(async ({ ctx }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });

      const calibration = await db
        .select()
        .from(bioScannerCalibration)
        .where(eq(bioScannerCalibration.userId, ctx.user.id))
        .limit(1);

      if (calibration.length === 0) {
        return null;
      }

      return {
        ...calibration[0],
        correctionFactor: Number(calibration[0].correctionFactor),
      };
    }),

  /**
   * Delete calibration for the current user
   */
  deleteCalibration: protectedProcedure
    .mutation(async ({ ctx }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });

      await db
        .delete(bioScannerCalibration)
        .where(eq(bioScannerCalibration.userId, ctx.user.id));

      return { success: true, message: "Calibration deleted successfully" };
    }),
});
