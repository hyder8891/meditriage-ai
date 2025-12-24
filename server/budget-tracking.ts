/**
 * Budget Tracking Module
 * Tracks AI API usage and costs for monitoring and budget management
 */

import { getDb } from "./db";
import { budgetTracking, budgetLimits } from "../drizzle/schema";
import { eq, and, gte, lte, sql, desc } from "drizzle-orm";

export type ModuleType =
  | "brain_clinical_reasoning"
  | "pharma_guard"
  | "medical_imaging"
  | "lab_results"
  | "medical_reports"
  | "symptom_checker"
  | "soap_notes"
  | "bio_scanner"
  | "voice_transcription"
  | "image_generation"
  | "conversation_ai"
  | "other";

export interface TrackUsageParams {
  userId: number;
  sessionId?: string;
  module: ModuleType;
  apiProvider: string;
  model?: string;
  operationType?: string;
  inputTokens?: number;
  outputTokens?: number;
  totalTokens?: number;
  estimatedCostCents?: number;
  requestDuration?: number;
  statusCode?: number;
  success?: boolean;
  errorMessage?: string;
  metadata?: Record<string, any>;
}

/**
 * Track API usage and cost
 */
export async function trackUsage(params: TrackUsageParams) {
  try {
    const db = await getDb();
    if (!db) throw new Error("Database not available");
    const record = await db.insert(budgetTracking).values({
      userId: params.userId,
      sessionId: params.sessionId,
      module: params.module,
      apiProvider: params.apiProvider,
      model: params.model,
      operationType: params.operationType,
      inputTokens: params.inputTokens || 0,
      outputTokens: params.outputTokens || 0,
      totalTokens: params.totalTokens || (params.inputTokens || 0) + (params.outputTokens || 0),
      estimatedCostCents: params.estimatedCostCents || 0,
      requestDuration: params.requestDuration,
      statusCode: params.statusCode || 200,
      success: params.success !== false ? "true" : "false",
      errorMessage: params.errorMessage,
      metadata: params.metadata ? JSON.stringify(params.metadata) : null,
    });

    return record;
  } catch (error) {
    console.error("[Budget Tracking] Error tracking usage:", error);
    // Don't throw - tracking failures shouldn't break the main flow
    return null;
  }
}

/**
 * Get usage statistics for a user
 */
export async function getUserUsageStats(userId: number, startDate?: Date, endDate?: Date) {
  try {
    const db = await getDb();
    if (!db) throw new Error("Database not available");
    const conditions = [eq(budgetTracking.userId, userId)];
    
    if (startDate) {
      conditions.push(gte(budgetTracking.createdAt, startDate));
    }
    
    if (endDate) {
      conditions.push(lte(budgetTracking.createdAt, endDate));
    }

    const records = await db
      .select()
      .from(budgetTracking)
      .where(and(...conditions))
      .orderBy(desc(budgetTracking.createdAt));

    // Calculate totals
    const totalCostCents = records.reduce((sum: number, r: any) => sum + (r.estimatedCostCents || 0), 0);
    const totalTokens = records.reduce((sum: number, r: any) => sum + (r.totalTokens || 0), 0);
    const totalRequests = records.length;
    const successfulRequests = records.filter((r: any) => r.success === "true").length;

    // Group by module
    const byModule: Record<string, { count: number; costCents: number; tokens: number }> = {};
    records.forEach((r: any) => {
      if (!byModule[r.module]) {
        byModule[r.module] = { count: 0, costCents: 0, tokens: 0 };
      }
      byModule[r.module].count++;
      byModule[r.module].costCents += r.estimatedCostCents || 0;
      byModule[r.module].tokens += r.totalTokens || 0;
    });

    return {
      totalCostCents,
      totalCostUSD: totalCostCents / 100,
      totalTokens,
      totalRequests,
      successfulRequests,
      successRate: totalRequests > 0 ? (successfulRequests / totalRequests) * 100 : 0,
      byModule,
      records,
    };
  } catch (error) {
    console.error("[Budget Tracking] Error getting user stats:", error);
    throw error;
  }
}

/**
 * Get usage statistics by module
 */
export async function getModuleUsageStats(module: ModuleType, startDate?: Date, endDate?: Date) {
  try {
    const db = await getDb();
    if (!db) throw new Error("Database not available");
    const conditions = [eq(budgetTracking.module, module)];
    
    if (startDate) {
      conditions.push(gte(budgetTracking.createdAt, startDate));
    }
    
    if (endDate) {
      conditions.push(lte(budgetTracking.createdAt, endDate));
    }

    const records = await db
      .select()
      .from(budgetTracking)
      .where(and(...conditions))
      .orderBy(desc(budgetTracking.createdAt));

    const totalCostCents = records.reduce((sum: number, r: any) => sum + (r.estimatedCostCents || 0), 0);
    const totalTokens = records.reduce((sum: number, r: any) => sum + (r.totalTokens || 0), 0);
    const totalRequests = records.length;

    return {
      module,
      totalCostCents,
      totalCostUSD: totalCostCents / 100,
      totalTokens,
      totalRequests,
      records,
    };
  } catch (error) {
    console.error("[Budget Tracking] Error getting module stats:", error);
    throw error;
  }
}

/**
 * Check if user has exceeded budget limit
 */
export async function checkBudgetLimit(userId: number): Promise<{
  withinLimit: boolean;
  limitAmountCents: number;
  currentUsageCents: number;
  percentageUsed: number;
  limitType?: string;
}> {
  try {
    const db = await getDb();
    if (!db) throw new Error("Database not available");
    // Get active budget limits for user
    const limits = await db
      .select()
      .from(budgetLimits)
      .where(
        and(
          eq(budgetLimits.userId, userId),
          eq(budgetLimits.active, "true"),
          lte(budgetLimits.periodStart, new Date()),
          gte(budgetLimits.periodEnd, new Date())
        )
      );

    if (limits.length === 0) {
      // No limits set - within limit by default
      return {
        withinLimit: true,
        limitAmountCents: 0,
        currentUsageCents: 0,
        percentageUsed: 0,
      };
    }

    // Check first active limit (could be extended to check multiple)
    const limit = limits[0];
    const percentageUsed = (limit.currentUsageCents / limit.limitAmountCents) * 100;

    return {
      withinLimit: limit.currentUsageCents < limit.limitAmountCents,
      limitAmountCents: limit.limitAmountCents,
      currentUsageCents: limit.currentUsageCents,
      percentageUsed,
      limitType: limit.limitType,
    };
  } catch (error) {
    console.error("[Budget Tracking] Error checking budget limit:", error);
    // On error, allow request to proceed
    return {
      withinLimit: true,
      limitAmountCents: 0,
      currentUsageCents: 0,
      percentageUsed: 0,
    };
  }
}

/**
 * Update budget limit usage
 */
export async function updateBudgetUsage(userId: number, costCents: number) {
  try {
    const db = await getDb();
    if (!db) throw new Error("Database not available");
    const limits = await db
      .select()
      .from(budgetLimits)
      .where(
        and(
          eq(budgetLimits.userId, userId),
          eq(budgetLimits.active, "true"),
          lte(budgetLimits.periodStart, new Date()),
          gte(budgetLimits.periodEnd, new Date())
        )
      );

    for (const limit of limits) {
      const newUsage = limit.currentUsageCents + costCents;
      
      await db
        .update(budgetLimits)
        .set({ currentUsageCents: newUsage })
        .where(eq(budgetLimits.id, limit.id));

      // Check if alert threshold reached
      const percentageUsed = (newUsage / limit.limitAmountCents) * 100;
      if (
        percentageUsed >= (limit.alertThresholdPercent || 80) &&
        limit.alertSent === "false"
      ) {
        // Mark alert as sent
        await db
          .update(budgetLimits)
          .set({ alertSent: "true" })
          .where(eq(budgetLimits.id, limit.id));

        // TODO: Send actual alert notification
        console.warn(
          `[Budget Tracking] Alert: User ${userId} has reached ${percentageUsed.toFixed(1)}% of budget limit`
        );
      }
    }
  } catch (error) {
    console.error("[Budget Tracking] Error updating budget usage:", error);
  }
}

/**
 * Estimate cost based on tokens (rough estimates)
 */
export function estimateCost(
  provider: string,
  model: string,
  inputTokens: number,
  outputTokens: number
): number {
  // Cost in cents per 1K tokens (these are rough estimates)
  const pricing: Record<string, { input: number; output: number }> = {
    "gpt-4": { input: 3, output: 6 }, // $0.03/$0.06 per 1K tokens
    "gpt-4-turbo": { input: 1, output: 3 }, // $0.01/$0.03 per 1K tokens
    "gpt-3.5-turbo": { input: 0.05, output: 0.15 }, // $0.0005/$0.0015 per 1K tokens
    "gemini-pro": { input: 0.05, output: 0.15 }, // Free tier, then similar to GPT-3.5
    "deepseek": { input: 0.014, output: 0.028 }, // $0.00014/$0.00028 per 1K tokens
  };

  const modelKey = model.toLowerCase();
  const rates = pricing[modelKey] || { input: 0.1, output: 0.2 }; // Default fallback

  const inputCost = (inputTokens / 1000) * rates.input;
  const outputCost = (outputTokens / 1000) * rates.output;

  return Math.round((inputCost + outputCost) * 100); // Return cents
}
