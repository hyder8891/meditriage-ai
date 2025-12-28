import { router, protectedProcedure } from "./_core/trpc";
import { z } from "zod";
import { getDb } from "./db";
import { 
  users, 
  triageRecords, 
  consultations,
  budgetTracking,
  budgetLimits,
  orchestrationLogs,
  systemHealthMetrics
} from "../drizzle/schema";
import { eq, gte, count, and, desc, sql, between, lte } from "drizzle-orm";
import { TRPCError } from "@trpc/server";

// Admin-only middleware
const adminProcedure = protectedProcedure.use(({ ctx, next }) => {
  if (ctx.user.role !== 'admin') {
    throw new TRPCError({
      code: 'FORBIDDEN',
      message: 'Admin access required',
    });
  }
  return next({ ctx });
});

export const adminRouter = router({
  // Get all users
  getAllUsers: adminProcedure.query(async () => {
    const db = await getDb();
    return await db!.select().from(users);
  }),

  // Get system statistics
  getSystemStats: adminProcedure.query(async () => {
    const db = await getDb();
    
    // Total users
    const [totalUsersResult] = await db!.select({ count: count() }).from(users);
    const totalUsers = totalUsersResult.count;

    // New users this month
    const firstDayOfMonth = new Date();
    firstDayOfMonth.setDate(1);
    firstDayOfMonth.setHours(0, 0, 0, 0);
    
    const [newUsersResult] = await db!
      .select({ count: count() })
      .from(users)
      .where(gte(users.createdAt, firstDayOfMonth));
    const newUsersThisMonth = newUsersResult.count;

    // Verified clinicians
    const [verifiedCliniciansResult] = await db!
      .select({ count: count() })
      .from(users)
      .where(and(eq(users.role, 'clinician'), eq(users.verified, true)));
    const verifiedClinicians = verifiedCliniciansResult.count;

    // Pending clinicians
    const [pendingCliniciansResult] = await db!
      .select({ count: count() })
      .from(users)
      .where(and(eq(users.role, 'clinician'), eq(users.verified, false)));
    const pendingClinicians = pendingCliniciansResult.count;

    // Total triage sessions
    const [totalTriageResult] = await db!.select({ count: count() }).from(triageRecords);
    const totalTriageSessions = totalTriageResult.count;

    // Triage sessions today
    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);
    
    const [triageTodayResult] = await db!
      .select({ count: count() })
      .from(triageRecords)
      .where(gte(triageRecords.createdAt, startOfToday));
    const triageSessionsToday = triageTodayResult.count;

    // Total consultations
    const [totalConsultationsResult] = await db!.select({ count: count() }).from(consultations);
    const totalConsultations = totalConsultationsResult.count;

    // Consultations today
    const [consultationsTodayResult] = await db!
      .select({ count: count() })
      .from(consultations)
      .where(gte(consultations.createdAt, startOfToday));
    const consultationsToday = consultationsTodayResult.count;

    return {
      totalUsers,
      newUsersThisMonth,
      verifiedClinicians,
      pendingClinicians,
      totalTriageSessions,
      triageSessionsToday,
      totalConsultations,
      consultationsToday,
      recentActivity: [], // Placeholder for activity log
    };
  }),

  // Verify clinician
  verifyClinician: adminProcedure
    .input(z.object({ userId: z.number() }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      
      await db!
        .update(users)
        .set({ verified: true })
        .where(eq(users.id, input.userId));

      return { success: true };
    }),

  // Update user role
  updateUserRole: adminProcedure
    .input(z.object({
      userId: z.number(),
      role: z.enum(['patient', 'clinician', 'admin']),
    }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      
      await db!
        .update(users)
        .set({ role: input.role })
        .where(eq(users.id, input.userId));

      return { success: true };
    }),

  // Delete user
  deleteUser: adminProcedure
    .input(z.object({ userId: z.number() }))
    .mutation(async ({ input, ctx }) => {
      const db = await getDb();
      
      // Prevent deleting yourself
      if (input.userId === ctx.user.id) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: 'Cannot delete your own account',
        });
      }

      await db!.delete(users).where(eq(users.id, input.userId));

      return { success: true };
    }),

  // ============================================================================
  // BUDGET TRACKING & ANALYTICS
  // ============================================================================

  // Get budget summary with aggregated costs
  getBudgetSummary: adminProcedure
    .input(z.object({
      timeRange: z.enum(["today", "week", "month", "year", "all"]).default("month"),
      groupBy: z.enum(["module", "user", "provider", "day"]).optional(),
    }))
    .query(async ({ input }) => {
      const db = await getDb();
      
      // Calculate date range
      const now = new Date();
      let startDate = new Date();
      
      switch (input.timeRange) {
        case "today":
          startDate.setHours(0, 0, 0, 0);
          break;
        case "week":
          startDate.setDate(now.getDate() - 7);
          break;
        case "month":
          startDate.setMonth(now.getMonth() - 1);
          break;
        case "year":
          startDate.setFullYear(now.getFullYear() - 1);
          break;
        case "all":
          startDate = new Date(0); // Beginning of time
          break;
      }

      // Get total cost
      const [totalResult] = await db!
        .select({
          totalCostCents: sql<number>`SUM(${budgetTracking.estimatedCostCents})`,
          totalRequests: count(),
          totalTokens: sql<number>`SUM(${budgetTracking.totalTokens})`,
        })
        .from(budgetTracking)
        .where(gte(budgetTracking.createdAt, startDate));

      // Get cost by module
      const costByModule = await db!
        .select({
          module: budgetTracking.module,
          totalCostCents: sql<number>`SUM(${budgetTracking.estimatedCostCents})`,
          requestCount: count(),
        })
        .from(budgetTracking)
        .where(gte(budgetTracking.createdAt, startDate))
        .groupBy(budgetTracking.module)
        .orderBy(desc(sql`SUM(${budgetTracking.estimatedCostCents})`));

      // Get cost by API provider
      const costByProvider = await db!
        .select({
          provider: budgetTracking.apiProvider,
          totalCostCents: sql<number>`SUM(${budgetTracking.estimatedCostCents})`,
          requestCount: count(),
        })
        .from(budgetTracking)
        .where(gte(budgetTracking.createdAt, startDate))
        .groupBy(budgetTracking.apiProvider)
        .orderBy(desc(sql`SUM(${budgetTracking.estimatedCostCents})`));

      // Get recent high-cost requests
      const highCostRequests = await db!
        .select()
        .from(budgetTracking)
        .where(gte(budgetTracking.createdAt, startDate))
        .orderBy(desc(budgetTracking.estimatedCostCents))
        .limit(10);

      return {
        summary: {
          totalCostCents: totalResult.totalCostCents || 0,
          totalCostUSD: ((totalResult.totalCostCents || 0) / 100).toFixed(2),
          totalRequests: totalResult.totalRequests,
          totalTokens: totalResult.totalTokens || 0,
          timeRange: input.timeRange,
        },
        costByModule,
        costByProvider,
        highCostRequests,
      };
    }),

  // Get budget trend data for charts
  getBudgetTrend: adminProcedure
    .input(z.object({
      days: z.number().min(1).max(365).default(30),
    }))
    .query(async ({ input }) => {
      const db = await getDb();
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - input.days);

      const dailyCosts = await db!
        .select({
          date: sql<string>`DATE(${budgetTracking.createdAt})`,
          totalCostCents: sql<number>`SUM(${budgetTracking.estimatedCostCents})`,
          requestCount: count(),
        })
        .from(budgetTracking)
        .where(gte(budgetTracking.createdAt, startDate))
        .groupBy(sql`DATE(${budgetTracking.createdAt})`)
        .orderBy(sql`DATE(${budgetTracking.createdAt})`);

      return dailyCosts;
    }),

  // ============================================================================
  // ORCHESTRATION LOGS & MONITORING
  // ============================================================================

  // Get orchestration logs with filtering
  getOrchestrationLogs: adminProcedure
    .input(z.object({
      limit: z.number().min(1).max(100).default(50),
      offset: z.number().min(0).default(0),
      status: z.enum(["started", "in_progress", "completed", "failed", "cancelled"]).optional(),
      module: z.string().optional(),
      operation: z.string().optional(),
      userId: z.number().optional(),
      startDate: z.date().optional(),
      endDate: z.date().optional(),
    }))
    .query(async ({ input }) => {
      const db = await getDb();
      
      // Build where conditions
      const conditions = [];
      if (input.status) conditions.push(eq(orchestrationLogs.status, input.status));
      if (input.module) conditions.push(eq(orchestrationLogs.module, input.module));
      if (input.operation) conditions.push(eq(orchestrationLogs.operation, input.operation));
      if (input.userId) conditions.push(eq(orchestrationLogs.userId, input.userId));
      if (input.startDate) conditions.push(gte(orchestrationLogs.startTime, input.startDate));
      if (input.endDate) conditions.push(lte(orchestrationLogs.startTime, input.endDate));

      const logs = await db!
        .select()
        .from(orchestrationLogs)
        .where(conditions.length > 0 ? and(...conditions) : undefined)
        .orderBy(desc(orchestrationLogs.startTime))
        .limit(input.limit)
        .offset(input.offset);

      // Get total count for pagination
      const [countResult] = await db!
        .select({ count: count() })
        .from(orchestrationLogs)
        .where(conditions.length > 0 ? and(...conditions) : undefined);

      return {
        logs,
        total: countResult.count,
        hasMore: input.offset + input.limit < countResult.count,
      };
    }),

  // Get orchestration statistics
  getOrchestrationStats: adminProcedure
    .input(z.object({
      timeRange: z.enum(["today", "week", "month"]).default("today"),
    }))
    .query(async ({ input }) => {
      const db = await getDb();
      
      const now = new Date();
      let startDate = new Date();
      
      switch (input.timeRange) {
        case "today":
          startDate.setHours(0, 0, 0, 0);
          break;
        case "week":
          startDate.setDate(now.getDate() - 7);
          break;
        case "month":
          startDate.setMonth(now.getMonth() - 1);
          break;
      }

      // Get status distribution
      const statusDistribution = await db!
        .select({
          status: orchestrationLogs.status,
          count: count(),
        })
        .from(orchestrationLogs)
        .where(gte(orchestrationLogs.startTime, startDate))
        .groupBy(orchestrationLogs.status);

      // Get average duration by module
      const avgDurationByModule = await db!
        .select({
          module: orchestrationLogs.module,
          avgDuration: sql<number>`AVG(${orchestrationLogs.durationMs})`,
          count: count(),
        })
        .from(orchestrationLogs)
        .where(and(
          gte(orchestrationLogs.startTime, startDate),
          eq(orchestrationLogs.status, "completed")
        ))
        .groupBy(orchestrationLogs.module);

      // Get recent failures
      const recentFailures = await db!
        .select()
        .from(orchestrationLogs)
        .where(and(
          gte(orchestrationLogs.startTime, startDate),
          eq(orchestrationLogs.status, "failed")
        ))
        .orderBy(desc(orchestrationLogs.startTime))
        .limit(10);

      return {
        statusDistribution,
        avgDurationByModule,
        recentFailures,
      };
    }),

  // ============================================================================
  // SYSTEM HEALTH & MONITORING
  // ============================================================================

  // Get system health metrics
  getSystemHealth: adminProcedure.query(async () => {
    const db = await getDb();
    
    // Get latest health metrics for each service
    const healthMetrics = await db!
      .select()
      .from(systemHealthMetrics)
      .orderBy(desc(systemHealthMetrics.timestamp))
      .limit(20);

    // Calculate overall system status
    const servicesDown = healthMetrics.filter(m => m.status === "down").length;
    const servicesDegraded = healthMetrics.filter(m => m.status === "degraded").length;
    
    let overallStatus: "healthy" | "degraded" | "down" = "healthy";
    if (servicesDown > 0) overallStatus = "down";
    else if (servicesDegraded > 0) overallStatus = "degraded";

    return {
      overallStatus,
      servicesDown,
      servicesDegraded,
      metrics: healthMetrics,
    };
  }),

  // Get real-time analytics for dashboard
  getDashboardAnalytics: adminProcedure.query(async () => {
    const db = await getDb();
    
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const thisWeek = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const thisMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    // Active users today
    const [activeUsersToday] = await db!
      .select({ count: sql<number>`COUNT(DISTINCT ${users.id})` })
      .from(users)
      .where(gte(users.lastSignedIn, today));

    // Triage sessions today
    const [triageToday] = await db!
      .select({ count: count() })
      .from(triageRecords)
      .where(gte(triageRecords.createdAt, today));

    // Consultations today
    const [consultationsToday] = await db!
      .select({ count: count() })
      .from(consultations)
      .where(gte(consultations.createdAt, today));

    // Cost today
    const [costToday] = await db!
      .select({ totalCents: sql<number>`SUM(${budgetTracking.estimatedCostCents})` })
      .from(budgetTracking)
      .where(gte(budgetTracking.createdAt, today));

    // Error rate today
    const [errorStats] = await db!
      .select({
        total: count(),
        failed: sql<number>`SUM(CASE WHEN ${orchestrationLogs.status} = 'failed' THEN 1 ELSE 0 END)`,
      })
      .from(orchestrationLogs)
      .where(gte(orchestrationLogs.startTime, today));

    const errorRate = errorStats.total > 0 
      ? ((errorStats.failed / errorStats.total) * 100).toFixed(2)
      : "0.00";

    return {
      activeUsersToday: activeUsersToday.count || 0,
      triageSessionsToday: triageToday.count,
      consultationsToday: consultationsToday.count,
      costTodayUSD: ((costToday.totalCents || 0) / 100).toFixed(2),
      errorRatePercent: errorRate,
    };
  }),
});
