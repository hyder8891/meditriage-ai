/**
 * Self-Healing System tRPC Router
 * Provides endpoints for monitoring and controlling the self-healing system
 */

import { z } from "zod";
import { publicProcedure, protectedProcedure, router } from "./_core/trpc";
import { selfHealingSystem } from "./_core/self-healing";
import { CircuitBreakerRegistry } from "./_core/self-healing/circuit-breaker";
import { getDb } from "./db";
import { failureEvents, recoveryActions, circuitBreakerStates } from "../drizzle/self-healing-schema";
import { desc, eq, and, gte } from "drizzle-orm";
import { executeRecoveryAction, type RecoveryAction } from "./self-healing-recovery";
import { sendAlert, alertCriticalFailure, alertCircuitBreakerOpen } from "./self-healing-alerts";

export const selfHealingRouter = router({
  /**
   * Get current system health status
   */
  getSystemHealth: publicProcedure.query(async () => {
    return await selfHealingSystem.getSystemHealth();
  }),

  /**
   * Get all circuit breaker states
   */
  getCircuitBreakers: protectedProcedure.query(async () => {
    const registry = CircuitBreakerRegistry.getInstance();
    return registry.getAllStates();
  }),

  /**
   * Reset a specific circuit breaker
   */
  resetCircuitBreaker: protectedProcedure
    .input(
      z.object({
        circuitName: z.string(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      // Only admins can reset circuit breakers
      if (ctx.user.role !== "admin") {
        throw new Error("Unauthorized: Admin access required");
      }

      const registry = CircuitBreakerRegistry.getInstance();
      const breaker = registry.get(input.circuitName);

      if (!breaker) {
        throw new Error(`Circuit breaker '${input.circuitName}' not found`);
      }

      await breaker.reset();

      return {
        success: true,
        message: `Circuit breaker '${input.circuitName}' has been reset`,
      };
    }),

  /**
   * Get recent failure events
   */
  getRecentFailures: protectedProcedure
    .input(
      z.object({
        limit: z.number().min(1).max(100).optional().default(20),
        severity: z.enum(["low", "medium", "high", "critical"]).optional(),
        resolved: z.boolean().optional(),
      })
    )
    .query(async ({ input, ctx }) => {
      // Only admins and clinicians can view failure events
      if (ctx.user.role !== "admin" && ctx.user.role !== "clinician") {
        throw new Error("Unauthorized: Admin or clinician access required");
      }

      const db = await getDb();
      if (!db) {
        throw new Error("Database connection not available");
      }

      const conditions = [];
      if (input.severity) {
        conditions.push(eq(failureEvents.severity, input.severity));
      }
      if (input.resolved !== undefined) {
        conditions.push(eq(failureEvents.resolved, input.resolved));
      }

      const failures = await db
        .select()
        .from(failureEvents)
        .where(conditions.length > 0 ? and(...conditions) : undefined)
        .orderBy(desc(failureEvents.timestamp))
        .limit(input.limit);

      return failures;
    }),

  /**
   * Get failure event details with recovery actions
   */
  getFailureDetails: protectedProcedure
    .input(
      z.object({
        eventId: z.string(),
      })
    )
    .query(async ({ input, ctx }) => {
      // Only admins and clinicians can view failure details
      if (ctx.user.role !== "admin" && ctx.user.role !== "clinician") {
        throw new Error("Unauthorized: Admin or clinician access required");
      }

      const db = await getDb();
      if (!db) {
        throw new Error("Database connection not available");
      }

      const [failure] = await db
        .select()
        .from(failureEvents)
        .where(eq(failureEvents.eventId, input.eventId))
        .limit(1);

      if (!failure) {
        throw new Error("Failure event not found");
      }

      const actions = await db
        .select()
        .from(recoveryActions)
        .where(eq(recoveryActions.failureEventId, failure.id))
        .orderBy(desc(recoveryActions.timestamp));

      return {
        failure,
        recoveryActions: actions,
      };
    }),

  /**
   * Get failure statistics
   */
  getFailureStats: protectedProcedure
    .input(
      z.object({
        timeRangeHours: z.number().min(1).max(168).optional().default(24),
      })
    )
    .query(async ({ input, ctx }) => {
      // Only admins and clinicians can view stats
      if (ctx.user.role !== "admin" && ctx.user.role !== "clinician") {
        throw new Error("Unauthorized: Admin or clinician access required");
      }

      const db = await getDb();
      if (!db) {
        throw new Error("Database connection not available");
      }

      const since = new Date(Date.now() - input.timeRangeHours * 60 * 60 * 1000);

      const failures = await db
        .select()
        .from(failureEvents)
        .where(gte(failureEvents.timestamp, since));

      // Calculate statistics
      const total = failures.length;
      const resolved = failures.filter((f) => f.resolved).length;
      const unresolved = total - resolved;

      const bySeverity = {
        low: failures.filter((f) => f.severity === "low").length,
        medium: failures.filter((f) => f.severity === "medium").length,
        high: failures.filter((f) => f.severity === "high").length,
        critical: failures.filter((f) => f.severity === "critical").length,
      };

      const byCategory: Record<string, number> = {};
      failures.forEach((f) => {
        byCategory[f.failureCategory] = (byCategory[f.failureCategory] || 0) + 1;
      });

      return {
        timeRangeHours: input.timeRangeHours,
        total,
        resolved,
        unresolved,
        resolutionRate: total > 0 ? (resolved / total) * 100 : 0,
        bySeverity,
        byCategory,
      };
    }),

  /**
   * Get all circuit breaker states from database
   */
  getAllCircuitBreakerStates: protectedProcedure.query(async ({ ctx }) => {
    // Only admins can view all circuit breaker states
    if (ctx.user.role !== "admin") {
      throw new Error("Unauthorized: Admin access required");
    }

    const db = await getDb();
    if (!db) {
      throw new Error("Database connection not available");
    }

    const states = await db.select().from(circuitBreakerStates).orderBy(desc(circuitBreakerStates.updatedAt));

    return states;
  }),

  /**
   * Manually trigger recovery action
   */
  triggerRecoveryAction: protectedProcedure
    .input(
      z.object({
        serviceName: z.string(),
        actionType: z.enum([
          "restart_service",
          "clear_cache",
          "scale_resources",
          "reconnect_database",
          "cleanup_memory",
          "reset_circuit_breaker",
          "throttle_requests",
        ]),
        metadata: z.record(z.string(), z.unknown()).optional(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      // Only admins can trigger recovery actions
      if (ctx.user.role !== "admin") {
        throw new Error("Unauthorized: Admin access required");
      }

      const result = await executeRecoveryAction(
        input.serviceName,
        input.actionType as string,
        input.metadata
      );

      return result;
    }),

  /**
   * Send test alert
   */
  sendTestAlert: protectedProcedure
    .input(
      z.object({
        type: z.enum([
          "circuit_breaker_open",
          "critical_failure",
          "recovery_failure",
          "system_degraded",
        ]),
        serviceName: z.string().optional(),
        message: z.string().optional(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      // Only admins can send test alerts
      if (ctx.user.role !== "admin") {
        throw new Error("Unauthorized: Admin access required");
      }

      const alert = {
        id: `test-${Date.now()}`,
        type: input.type,
        severity: "high" as const,
        title: `Test Alert: ${input.type}`,
        message: input.message || `This is a test alert for ${input.type}`,
        metadata: { serviceName: input.serviceName || "test-service", test: true },
        timestamp: new Date(),
      };

      await sendAlert(alert);

      return { success: true, message: "Test alert sent successfully" };
    }),
});
