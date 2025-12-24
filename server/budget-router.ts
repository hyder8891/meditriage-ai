/**
 * Budget Tracking tRPC Router
 * Provides endpoints for budget monitoring and usage analytics
 */

import { z } from "zod";
import { publicProcedure, protectedProcedure, router } from "./_core/trpc";
import {
  trackUsage,
  getUserUsageStats,
  getModuleUsageStats,
  checkBudgetLimit,
  updateBudgetUsage,
  estimateCost,
  type ModuleType,
} from "./budget-tracking";

export const budgetRouter = router({
  /**
   * Track API usage (internal use - called by other modules)
   */
  trackUsage: protectedProcedure
    .input(
      z.object({
        sessionId: z.string().optional(),
        module: z.enum([
          "brain_clinical_reasoning",
          "pharma_guard",
          "medical_imaging",
          "lab_results",
          "medical_reports",
          "symptom_checker",
          "soap_notes",
          "bio_scanner",
          "voice_transcription",
          "image_generation",
          "conversation_ai",
          "other",
        ]),
        apiProvider: z.string(),
        model: z.string().optional(),
        operationType: z.string().optional(),
        inputTokens: z.number().optional(),
        outputTokens: z.number().optional(),
        totalTokens: z.number().optional(),
        estimatedCostCents: z.number().optional(),
        requestDuration: z.number().optional(),
        statusCode: z.number().optional(),
        success: z.boolean().optional(),
        errorMessage: z.string().optional(),
        metadata: z.record(z.string(), z.any()).optional(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      await trackUsage({
        userId: ctx.user.id,
        ...input,
      });
      return { success: true };
    }),

  /**
   * Get current user's usage statistics
   */
  getMyUsageStats: protectedProcedure
    .input(
      z.object({
        startDate: z.string().optional(),
        endDate: z.string().optional(),
      })
    )
    .query(async ({ input, ctx }) => {
      const startDate = input.startDate ? new Date(input.startDate) : undefined;
      const endDate = input.endDate ? new Date(input.endDate) : undefined;

      return await getUserUsageStats(ctx.user.id, startDate, endDate);
    }),

  /**
   * Get usage statistics by module (admin only)
   */
  getModuleStats: protectedProcedure
    .input(
      z.object({
        module: z.enum([
          "brain_clinical_reasoning",
          "pharma_guard",
          "medical_imaging",
          "lab_results",
          "medical_reports",
          "symptom_checker",
          "soap_notes",
          "bio_scanner",
          "voice_transcription",
          "image_generation",
          "conversation_ai",
          "other",
        ]),
        startDate: z.string().optional(),
        endDate: z.string().optional(),
      })
    )
    .query(async ({ input, ctx }) => {
      // Check if user is admin
      if (ctx.user.role !== "admin" && ctx.user.role !== "clinician") {
        throw new Error("Unauthorized: Admin access required");
      }

      const startDate = input.startDate ? new Date(input.startDate) : undefined;
      const endDate = input.endDate ? new Date(input.endDate) : undefined;

      return await getModuleUsageStats(input.module as ModuleType, startDate, endDate);
    }),

  /**
   * Check current user's budget limit
   */
  checkMyBudgetLimit: protectedProcedure.query(async ({ ctx }) => {
    return await checkBudgetLimit(ctx.user.id);
  }),

  /**
   * Get all users' usage stats (admin only)
   */
  getAllUsersStats: protectedProcedure
    .input(
      z.object({
        startDate: z.string().optional(),
        endDate: z.string().optional(),
      })
    )
    .query(async ({ input, ctx }) => {
      // Check if user is admin
      if (ctx.user.role !== "admin" && ctx.user.role !== "clinician") {
        throw new Error("Unauthorized: Admin access required");
      }

      // This would require aggregating stats across all users
      // For now, return a placeholder
      return {
        totalUsers: 0,
        totalCostCents: 0,
        totalRequests: 0,
        message: "Feature coming soon - aggregate all users statistics",
      };
    }),

  /**
   * Estimate cost for a potential API call
   */
  estimateCost: publicProcedure
    .input(
      z.object({
        provider: z.string(),
        model: z.string(),
        inputTokens: z.number(),
        outputTokens: z.number(),
      })
    )
    .query(({ input }) => {
      const costCents = estimateCost(
        input.provider,
        input.model,
        input.inputTokens,
        input.outputTokens
      );
      return {
        costCents,
        costUSD: costCents / 100,
      };
    }),
});
