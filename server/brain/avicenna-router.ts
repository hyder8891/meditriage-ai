/**
 * Avicenna-X tRPC Router
 * 
 * Exposes the Predictive Health Graph orchestration system to the frontend
 */

import { router, publicProcedure, protectedProcedure } from "../_core/trpc";
import { z } from "zod";
import { executeAvicennaLoop } from "./orchestrator";
import { buildContextVector, trackBudgetFilterClick, updateWearableData, updateUserGeolocation } from "./context-vector";
import { getLocalRisks, getDiseaseHeatmap, getOutbreakAlerts, recordSymptomReport } from "./epidemiology";
import { findBestDoctor, findBestClinic } from "./resource-auction";
import { recordMedicalCorrection, calculateAccuracyRate, getPromptPerformanceMetrics } from "./medical-aec";

export const avicennaRouter = router({
  // ============================================================================
  // Core Orchestration
  // ============================================================================

  /**
   * Execute the full Avicenna-X loop
   * This is the main entry point for the orchestration system
   */
  orchestrate: protectedProcedure
    .input(z.object({
      text: z.string().optional(),
      audioUrl: z.string().optional(),
      symptoms: z.array(z.string()).optional(),
      severity: z.number().min(1).max(10).optional(),
      vitals: z.object({
        heartRate: z.number().optional(),
        bloodPressure: z.string().optional(),
        temperature: z.number().optional(),
        oxygenSaturation: z.number().optional(),
      }).optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const result = await executeAvicennaLoop(ctx.user.id, input);
      return result;
    }),

  // ============================================================================
  // Context Vector Management
  // ============================================================================

  /**
   * Track budget filter click (for financial constraint modeling)
   */
  trackBudgetFilter: protectedProcedure
    .mutation(async ({ ctx }) => {
      await trackBudgetFilterClick(ctx.user.id);
      return { success: true };
    }),

  /**
   * Update wearable data (Apple Watch, Fitbit, etc.)
   */
  updateWearableData: protectedProcedure
    .input(z.object({
      heartRate: z.number().optional(),
      heartRateVariability: z.number().optional(),
      steps: z.number().optional(),
      sleepHours: z.number().optional(),
      oxygenSaturation: z.number().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      await updateWearableData(ctx.user.id, input);
      return { success: true };
    }),

  /**
   * Update user geolocation (for proximity-based matching)
   */
  updateGeolocation: protectedProcedure
    .input(z.object({
      city: z.string(),
      lat: z.number(),
      lng: z.number(),
    }))
    .mutation(async ({ ctx, input }) => {
      await updateUserGeolocation(ctx.user.id, input);
      return { success: true };
    }),

  // ============================================================================
  // Epidemiology Tracking
  // ============================================================================

  /**
   * Get local disease risks for a city
   */
  getLocalRisks: publicProcedure
    .input(z.object({
      city: z.string(),
    }))
    .query(async ({ input }) => {
      const risks = await getLocalRisks(input.city);
      return risks;
    }),

  /**
   * Get disease heatmap for visualization
   */
  getDiseaseHeatmap: publicProcedure
    .query(async () => {
      const heatmap = await getDiseaseHeatmap();
      return heatmap;
    }),

  /**
   * Get outbreak alerts (critical/high risk diseases)
   */
  getOutbreakAlerts: publicProcedure
    .input(z.object({
      city: z.string().optional(),
    }))
    .query(async ({ input }) => {
      const alerts = await getOutbreakAlerts(input.city);
      return alerts;
    }),

  /**
   * Record symptom report for epidemiology tracking
   * (Called automatically after triage)
   */
  recordSymptomReport: protectedProcedure
    .input(z.object({
      city: z.string(),
      symptoms: z.array(z.string()),
      severity: z.number().min(1).max(10),
      urgency: z.string(),
      demographics: z.object({
        ageGroup: z.string().optional(),
        gender: z.string().optional(),
      }).optional(),
    }))
    .mutation(async ({ input }) => {
      await recordSymptomReport(
        input.city,
        input.symptoms,
        input.severity,
        input.urgency,
        input.demographics
      );
      return { success: true };
    }),

  // ============================================================================
  // Resource Auction
  // ============================================================================

  /**
   * Find best doctor for telemedicine consultation
   * (Used by orchestrator, but also exposed for manual selection)
   */
  findBestDoctor: protectedProcedure
    .input(z.object({
      diagnosis: z.object({
        primaryDiagnosis: z.string(),
        severity: z.enum(["LOW", "MODERATE", "HIGH", "EMERGENCY"]),
      }),
    }))
    .query(async ({ ctx, input }) => {
      // Build minimal context vector
      const contextVector = await buildContextVector(ctx.user.id, {});
      
      const doctor = await findBestDoctor(input.diagnosis as any, contextVector);
      return doctor;
    }),

  /**
   * Find best clinic for in-person visit
   */
  findBestClinic: protectedProcedure
    .input(z.object({
      diagnosis: z.object({
        primaryDiagnosis: z.string(),
        severity: z.enum(["LOW", "MODERATE", "HIGH", "EMERGENCY"]),
      }),
    }))
    .query(async ({ ctx, input }) => {
      // Build minimal context vector
      const contextVector = await buildContextVector(ctx.user.id, {});
      
      const clinic = await findBestClinic(input.diagnosis as any, contextVector);
      return clinic;
    }),

  // ============================================================================
  // Medical AEC (RLHF)
  // ============================================================================

  /**
   * Record medical correction from doctor
   * (Used by doctors to provide feedback on AI diagnoses)
   */
  recordCorrection: protectedProcedure
    .input(z.object({
      triageRecordId: z.number().optional(),
      aiDiagnosis: z.object({
        primaryDiagnosis: z.string(),
        confidence: z.number(),
        differentialDiagnoses: z.array(z.string()).optional(),
      }),
      doctorDiagnosis: z.object({
        primaryDiagnosis: z.string(),
        confidence: z.number(),
        differentialDiagnoses: z.array(z.string()).optional(),
      }),
      correctionType: z.enum([
        "completely_wrong",
        "missed_diagnosis",
        "incorrect_ranking",
        "severity_mismatch",
        "correct_but_imprecise",
      ]),
      severityDelta: z.number().optional(),
      doctorFeedback: z.string().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      // Only doctors can record corrections
      if (ctx.user.role !== "doctor" && ctx.user.role !== "clinician") {
        throw new Error("Only doctors can record corrections");
      }

      await recordMedicalCorrection({
        userId: ctx.user.id,
        doctorId: ctx.user.id,
        ...input,
      });

      return { success: true };
    }),

  /**
   * Get AI accuracy rate over time
   * (For monitoring dashboard)
   */
  getAccuracyRate: protectedProcedure
    .input(z.object({
      days: z.number().min(1).max(90).default(7),
    }))
    .query(async ({ input }) => {
      const accuracyRate = await calculateAccuracyRate(input.days);
      return { accuracyRate };
    }),

  /**
   * Get prompt performance metrics
   * (For admin monitoring)
   */
  getPromptMetrics: protectedProcedure
    .input(z.object({
      promptVersion: z.number(),
    }))
    .query(async ({ ctx, input }) => {
      // Only admins can view prompt metrics
      if (ctx.user.role !== "admin" && ctx.user.role !== "super_admin") {
        throw new Error("Only admins can view prompt metrics");
      }

      const metrics = await getPromptPerformanceMetrics(input.promptVersion);
      return metrics;
    }),
});

export type AvicennaRouter = typeof avicennaRouter;
