/**
 * tRPC Router for Resource Auction Algorithm
 */

import { z } from 'zod';
import { router, publicProcedure, protectedProcedure } from '../_core/trpc';
import { runResourceAuction, type AuctionParams } from './resource-auction';
import { getDb } from '../db';
import { doctorPerformanceMetrics, networkQualityMetrics, networkQualityLogs } from '../../drizzle/schema';
import { eq } from 'drizzle-orm';

export const resourceAuctionRouter = router({
  /**
   * Find best doctor using resource auction algorithm
   */
  findBestDoctor: protectedProcedure
    .input(
      z.object({
        patientLocation: z.object({
          lat: z.number(),
          lng: z.number(),
        }),
        requiredSpecialty: z.string(),
        symptoms: z.array(z.string()),
        urgency: z.enum(['EMERGENCY', 'HIGH', 'MEDIUM', 'LOW']),
        maxBudget: z.number().optional(),
        maxDistance: z.number().optional(),
        requiresTelemedicine: z.boolean(),
        preferredLanguage: z.enum(['ar', 'en']).optional(),
      })
    )
    .mutation(async ({ input }) => {
      const params: AuctionParams = {
        patientLocation: input.patientLocation,
        requiredSpecialty: input.requiredSpecialty,
        symptoms: input.symptoms,
        urgency: input.urgency,
        maxBudget: input.maxBudget,
        maxDistance: input.maxDistance,
        requiresTelemedicine: input.requiresTelemedicine,
        preferredLanguage: input.preferredLanguage,
      };

      const results = await runResourceAuction(params);

      return {
        success: true,
        results,
        topDoctor: results[0] || null,
        totalCandidates: results.length,
      };
    }),

  /**
   * Get doctor performance metrics
   */
  getDoctorPerformance: protectedProcedure
    .input(z.object({ doctorId: z.number() }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error('Database not available');
      
      const metrics = await db
        .select()
        .from(doctorPerformanceMetrics)
        .where(eq(doctorPerformanceMetrics.doctorId, input.doctorId))
        .limit(1);

      return metrics[0] || null;
    }),

  /**
   * Get doctor network quality metrics
   */
  getDoctorNetworkQuality: protectedProcedure
    .input(z.object({ doctorId: z.number() }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error('Database not available');
      
      const metrics = await db
        .select()
        .from(networkQualityMetrics)
        .where(eq(networkQualityMetrics.doctorId, input.doctorId))
        .limit(1);

      return metrics[0] || null;
    }),

  /**
   * Log network quality measurement (called during consultations)
   */
  logNetworkQuality: protectedProcedure
    .input(
      z.object({
        doctorId: z.number(),
        latency: z.number(),
        bandwidth: z.number(),
        packetLoss: z.number().optional(),
        jitter: z.number().optional(),
        quality: z.enum(['EXCELLENT', 'GOOD', 'FAIR', 'POOR']),
        consultationId: z.number().optional(),
        sessionDuration: z.number().optional(),
        disconnectionCount: z.number().optional(),
        deviceType: z.string().optional(),
        networkType: z.string().optional(),
      })
    )
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error('Database not available');
      
      // Insert log
      await db.insert(networkQualityLogs).values({
        doctorId: input.doctorId,
        latency: input.latency,
        bandwidth: input.bandwidth.toString(),
        packetLoss: input.packetLoss?.toString() || '0.0000',
        jitter: input.jitter || 0,
        quality: input.quality,
        consultationId: input.consultationId,
        sessionDuration: input.sessionDuration,
        disconnectionCount: input.disconnectionCount || 0,
        deviceType: input.deviceType,
        networkType: input.networkType,
      });

      // Update aggregated metrics
      // TODO: Implement aggregation logic (calculate averages, update counts)

      return { success: true };
    }),

  /**
   * Update doctor performance metrics (called after consultations)
   */
  updateDoctorPerformance: protectedProcedure
    .input(
      z.object({
        doctorId: z.number(),
        consultationSuccess: z.boolean(),
        responseTime: z.number(), // seconds
        consultationDuration: z.number(), // minutes
        patientRating: z.number().min(0).max(5).optional(),
        specialty: z.string(),
      })
    )
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error('Database not available');
      
      // Fetch existing metrics
      const existing = await db
        .select()
        .from(doctorPerformanceMetrics)
        .where(eq(doctorPerformanceMetrics.doctorId, input.doctorId))
        .limit(1);

      if (existing.length === 0) {
        // Create new metrics
        const specialtyRates = JSON.stringify({ [input.specialty]: input.consultationSuccess ? 1.0 : 0.0 });
        
        await db.insert(doctorPerformanceMetrics).values({
          doctorId: input.doctorId,
          totalConsultations: 1,
          successfulConsultations: input.consultationSuccess ? 1 : 0,
          avgResponseTime: input.responseTime,
          avgConsultationDuration: input.consultationDuration,
          patientSatisfactionAvg: input.patientRating?.toString() || '4.20',
          totalRatings: input.patientRating ? 1 : 0,
          specialtySuccessRates: specialtyRates,
        });
      } else {
        // Update existing metrics (running averages)
        const current = existing[0];
        const newTotal = current.totalConsultations + 1;
        const newSuccessful = current.successfulConsultations + (input.consultationSuccess ? 1 : 0);
        
        // Calculate new averages
        const newAvgResponseTime = Math.round(
          (current.avgResponseTime * current.totalConsultations + input.responseTime) / newTotal
        );
        const newAvgDuration = Math.round(
          (current.avgConsultationDuration * current.totalConsultations + input.consultationDuration) / newTotal
        );

        // Update specialty success rates
        const specialtyRates = JSON.parse(current.specialtySuccessRates);
        const currentSpecialtyRate = specialtyRates[input.specialty] || 0;
        const specialtyCount = Object.keys(specialtyRates).includes(input.specialty) ? 2 : 1;
        specialtyRates[input.specialty] = (currentSpecialtyRate + (input.consultationSuccess ? 1 : 0)) / specialtyCount;

        // Update patient satisfaction
        let newSatisfaction = parseFloat(current.patientSatisfactionAvg);
        let newRatingCount = current.totalRatings;
        if (input.patientRating) {
          newSatisfaction = (newSatisfaction * newRatingCount + input.patientRating) / (newRatingCount + 1);
          newRatingCount += 1;
        }

        await db
          .update(doctorPerformanceMetrics)
          .set({
            totalConsultations: newTotal,
            successfulConsultations: newSuccessful,
            avgResponseTime: newAvgResponseTime,
            avgConsultationDuration: newAvgDuration,
            patientSatisfactionAvg: newSatisfaction.toFixed(2),
            totalRatings: newRatingCount,
            specialtySuccessRates: JSON.stringify(specialtyRates),
          })
          .where(eq(doctorPerformanceMetrics.doctorId, input.doctorId));
      }

      return { success: true };
    }),
});
