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
import { uploadLabReport, getRecentLabReports, getLabReportById, getBiomarkerTrend, deleteLabReport } from "./lab-integration";
import { routeToEmergencyClinic, updateClinicWaitTime, getClinicWaitTime } from "./emergency-routing";

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
  // Lab Reports Integration
  // ============================================================================

  /**
   * Upload and parse a lab report
   */
  uploadLabReport: protectedProcedure
    .input(z.object({
      fileUrl: z.string(),
      fileName: z.string(),
      mimeType: z.string(),
    }))
    .mutation(async ({ ctx, input }) => {
      // Note: File should already be uploaded to S3 by the client
      // This endpoint parses the report and saves metadata
      // For now, we'll fetch the file from the URL and process it
      const response = await fetch(input.fileUrl);
      const buffer = Buffer.from(await response.arrayBuffer());
      
      const report = await uploadLabReport(
        ctx.user.id,
        buffer,
        input.fileName,
        input.mimeType
      );
      
      return report;
    }),

  /**
   * Get recent lab reports for current user
   */
  getMyLabReports: protectedProcedure
    .input(z.object({
      limit: z.number().min(1).max(50).default(10),
    }))
    .query(async ({ ctx, input }) => {
      const reports = await getRecentLabReports(ctx.user.id, input.limit);
      return reports;
    }),

  /**
   * Get specific lab report by ID
   */
  getLabReport: protectedProcedure
    .input(z.object({
      reportId: z.number(),
    }))
    .query(async ({ ctx, input }) => {
      const report = await getLabReportById(input.reportId, ctx.user.id);
      if (!report) {
        throw new Error("Lab report not found");
      }
      return report;
    }),

  /**
   * Get biomarker trend over time
   */
  getBiomarkerTrend: protectedProcedure
    .input(z.object({
      biomarkerName: z.string(),
      months: z.number().min(1).max(24).default(6),
    }))
    .query(async ({ ctx, input }) => {
      const trend = await getBiomarkerTrend(
        ctx.user.id,
        input.biomarkerName,
        input.months
      );
      return trend;
    }),

  /**
   * Delete a lab report
   */
  deleteLabReport: protectedProcedure
    .input(z.object({
      reportId: z.number(),
    }))
    .mutation(async ({ ctx, input }) => {
      const success = await deleteLabReport(input.reportId, ctx.user.id);
      return { success };
    }),

  // ============================================================================
  // Emergency Routing
  // ============================================================================

  /**
   * Find best emergency clinic and get transport links
   */
  routeToEmergency: protectedProcedure
    .input(z.object({
      userLocation: z.object({
        lat: z.number(),
        lng: z.number(),
      }),
      severity: z.enum(["HIGH", "EMERGENCY"]),
      requiredCapabilities: z.array(z.string()).optional(),
    }))
    .query(async ({ input }) => {
      const route = await routeToEmergencyClinic(
        input.userLocation,
        input.severity,
        input.requiredCapabilities
      );
      return route;
    }),

  /**
   * Update clinic wait time (for clinic staff)
   */
  updateClinicWaitTime: protectedProcedure
    .input(z.object({
      clinicId: z.number(),
      waitTimeMinutes: z.number().min(0).max(600),
    }))
    .mutation(async ({ ctx, input }) => {
      // Only clinic staff can update wait times
      if (ctx.user.role !== "clinic_admin" && ctx.user.role !== "super_admin") {
        throw new Error("Only clinic staff can update wait times");
      }

      await updateClinicWaitTime(input.clinicId, input.waitTimeMinutes);
      return { success: true };
    }),

  /**
   * Get current wait time for a clinic
   */
  getClinicWaitTime: publicProcedure
    .input(z.object({
      clinicId: z.number(),
    }))
    .query(async ({ input }) => {
      const waitTime = await getClinicWaitTime(input.clinicId);
      return { waitTimeMinutes: waitTime };
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
