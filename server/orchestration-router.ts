/**
 * Orchestration Logs tRPC Router
 * Provides endpoints for viewing and analyzing orchestration logs
 */

import { z } from "zod";
import { publicProcedure, protectedProcedure, router } from "./_core/trpc";
import {
  getUserOrchestrationLogs,
  getOrchestrationLogsByRequestId,
  getOrchestrationStats,
} from "./orchestration-logging";

export const orchestrationRouter = router({
  /**
   * Get current user's orchestration logs
   */
  getMyLogs: protectedProcedure
    .input(
      z.object({
        startDate: z.string().optional(),
        endDate: z.string().optional(),
        module: z.string().optional(),
        status: z.enum(["started", "in_progress", "completed", "failed", "cancelled"]).optional(),
        limit: z.number().min(1).max(1000).optional(),
      })
    )
    .query(async ({ input, ctx }) => {
      const startDate = input.startDate ? new Date(input.startDate) : undefined;
      const endDate = input.endDate ? new Date(input.endDate) : undefined;

      return await getUserOrchestrationLogs(ctx.user.id, {
        startDate,
        endDate,
        module: input.module,
        status: input.status,
        limit: input.limit || 100,
      });
    }),

  /**
   * Get logs by request ID (including nested operations)
   */
  getLogsByRequestId: protectedProcedure
    .input(
      z.object({
        requestId: z.string(),
      })
    )
    .query(async ({ input }) => {
      return await getOrchestrationLogsByRequestId(input.requestId);
    }),

  /**
   * Get system-wide orchestration statistics (admin only)
   */
  getSystemStats: protectedProcedure
    .input(
      z.object({
        startDate: z.string().optional(),
        endDate: z.string().optional(),
        module: z.string().optional(),
      })
    )
    .query(async ({ input, ctx }) => {
      // Check if user is admin
      if (ctx.user.role !== "admin" && ctx.user.role !== "clinician") {
        throw new Error("Unauthorized: Admin access required");
      }

      const startDate = input.startDate ? new Date(input.startDate) : undefined;
      const endDate = input.endDate ? new Date(input.endDate) : undefined;

      return await getOrchestrationStats({
        startDate,
        endDate,
        module: input.module,
      });
    }),

  /**
   * Get recent failed operations (admin only)
   */
  getRecentFailures: protectedProcedure
    .input(
      z.object({
        limit: z.number().min(1).max(100).optional(),
      })
    )
    .query(async ({ input, ctx }) => {
      // Check if user is admin
      if (ctx.user.role !== "admin" && ctx.user.role !== "clinician") {
        throw new Error("Unauthorized: Admin access required");
      }

      // Get recent failed operations across all users
      // This would require a different query - for now return placeholder
      return {
        failures: [],
        message: "Feature coming soon - recent system failures",
      };
    }),
});
