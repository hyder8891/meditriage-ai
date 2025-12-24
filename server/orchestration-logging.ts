/**
 * Orchestration Logging Module
 * Tracks system operations and AI workflows for debugging and monitoring
 */

import { getDb } from "./db";
import { orchestrationLogs } from "../drizzle/schema";
import { eq, and, gte, lte, desc, sql } from "drizzle-orm";
import { randomBytes } from "crypto";

export type LogStatus = "started" | "in_progress" | "completed" | "failed" | "cancelled";

export interface StartLogParams {
  operation: string;
  module: string;
  action: string;
  userId?: number;
  sessionId?: string;
  parentRequestId?: string;
  inputData?: any;
  metadata?: Record<string, any>;
  tags?: string[];
}

export interface UpdateLogParams {
  requestId: string;
  status?: LogStatus;
  outputData?: any;
  errorMessage?: string;
  errorStack?: string;
  errorCode?: string;
  metadata?: Record<string, any>;
}

/**
 * Generate unique request ID
 */
function generateRequestId(): string {
  return `req_${Date.now()}_${randomBytes(8).toString("hex")}`;
}

/**
 * Start logging an operation
 */
export async function startOrchestrationLog(params: StartLogParams): Promise<string> {
  try {
    const db = await getDb();
    if (!db) throw new Error("Database not available");

    const requestId = generateRequestId();
    const startTime = new Date();

    // Calculate depth if parent exists
    let depth = 0;
    if (params.parentRequestId) {
      const parent = await db
        .select()
        .from(orchestrationLogs)
        .where(eq(orchestrationLogs.requestId, params.parentRequestId))
        .limit(1);
      
      if (parent.length > 0) {
        depth = (parent[0].depth || 0) + 1;
      }
    }

    await db.insert(orchestrationLogs).values({
      requestId,
      userId: params.userId,
      sessionId: params.sessionId,
      operation: params.operation,
      module: params.module,
      action: params.action,
      status: "started",
      startTime,
      parentRequestId: params.parentRequestId,
      depth,
      inputData: params.inputData ? JSON.stringify(params.inputData) : null,
      metadata: params.metadata ? JSON.stringify(params.metadata) : null,
      tags: params.tags ? JSON.stringify(params.tags) : null,
    });

    return requestId;
  } catch (error) {
    console.error("[Orchestration Logging] Error starting log:", error);
    // Return a fallback ID so operations can continue
    return `fallback_${Date.now()}`;
  }
}

/**
 * Update an existing log entry
 */
export async function updateOrchestrationLog(params: UpdateLogParams) {
  try {
    const db = await getDb();
    if (!db) throw new Error("Database not available");

    const updates: any = {};

    if (params.status) {
      updates.status = params.status;
      
      // If completing or failing, set end time and calculate duration
      if (params.status === "completed" || params.status === "failed") {
        updates.endTime = new Date();
        
        // Get start time to calculate duration
        const log = await db
          .select()
          .from(orchestrationLogs)
          .where(eq(orchestrationLogs.requestId, params.requestId))
          .limit(1);
        
        if (log.length > 0 && log[0].startTime) {
          const durationMs = updates.endTime.getTime() - new Date(log[0].startTime).getTime();
          updates.durationMs = durationMs;
        }
      }
    }

    if (params.outputData) {
      updates.outputData = JSON.stringify(params.outputData);
    }

    if (params.errorMessage) {
      updates.errorMessage = params.errorMessage;
    }

    if (params.errorStack) {
      updates.errorStack = params.errorStack;
    }

    if (params.errorCode) {
      updates.errorCode = params.errorCode;
    }

    if (params.metadata) {
      updates.metadata = JSON.stringify(params.metadata);
    }

    await db
      .update(orchestrationLogs)
      .set(updates)
      .where(eq(orchestrationLogs.requestId, params.requestId));

  } catch (error) {
    console.error("[Orchestration Logging] Error updating log:", error);
    // Don't throw - logging failures shouldn't break the main flow
  }
}

/**
 * Complete a log entry (convenience method)
 */
export async function completeOrchestrationLog(requestId: string, outputData?: any) {
  await updateOrchestrationLog({
    requestId,
    status: "completed",
    outputData,
  });
}

/**
 * Fail a log entry (convenience method)
 */
export async function failOrchestrationLog(
  requestId: string,
  error: Error | string,
  errorCode?: string
) {
  const errorMessage = typeof error === "string" ? error : error.message;
  const errorStack = typeof error === "string" ? undefined : error.stack;

  await updateOrchestrationLog({
    requestId,
    status: "failed",
    errorMessage,
    errorStack,
    errorCode,
  });
}

/**
 * Get logs for a specific user
 */
export async function getUserOrchestrationLogs(
  userId: number,
  options?: {
    startDate?: Date;
    endDate?: Date;
    module?: string;
    status?: LogStatus;
    limit?: number;
  }
) {
  try {
    const db = await getDb();
    if (!db) throw new Error("Database not available");

    const conditions = [eq(orchestrationLogs.userId, userId)];

    if (options?.startDate) {
      conditions.push(gte(orchestrationLogs.createdAt, options.startDate));
    }

    if (options?.endDate) {
      conditions.push(lte(orchestrationLogs.createdAt, options.endDate));
    }

    if (options?.module) {
      conditions.push(eq(orchestrationLogs.module, options.module));
    }

    if (options?.status) {
      conditions.push(eq(orchestrationLogs.status, options.status));
    }

    let query = db
      .select()
      .from(orchestrationLogs)
      .where(and(...conditions))
      .orderBy(desc(orchestrationLogs.createdAt));

    if (options?.limit) {
      query = query.limit(options.limit) as any;
    }

    const logs = await query;

    return logs.map((log: any) => ({
      ...log,
      inputData: log.inputData ? JSON.parse(log.inputData) : null,
      outputData: log.outputData ? JSON.parse(log.outputData) : null,
      metadata: log.metadata ? JSON.parse(log.metadata) : null,
      tags: log.tags ? JSON.parse(log.tags) : null,
    }));
  } catch (error) {
    console.error("[Orchestration Logging] Error getting user logs:", error);
    throw error;
  }
}

/**
 * Get logs by request ID (including nested operations)
 */
export async function getOrchestrationLogsByRequestId(requestId: string) {
  try {
    const db = await getDb();
    if (!db) throw new Error("Database not available");

    // Get the main log and all nested operations
    const logs = await db
      .select()
      .from(orchestrationLogs)
      .where(
        sql`${orchestrationLogs.requestId} = ${requestId} OR ${orchestrationLogs.parentRequestId} = ${requestId}`
      )
      .orderBy(orchestrationLogs.depth, orchestrationLogs.createdAt);

    return logs.map((log: any) => ({
      ...log,
      inputData: log.inputData ? JSON.parse(log.inputData) : null,
      outputData: log.outputData ? JSON.parse(log.outputData) : null,
      metadata: log.metadata ? JSON.parse(log.metadata) : null,
      tags: log.tags ? JSON.parse(log.tags) : null,
    }));
  } catch (error) {
    console.error("[Orchestration Logging] Error getting logs by request ID:", error);
    throw error;
  }
}

/**
 * Get system-wide statistics
 */
export async function getOrchestrationStats(options?: {
  startDate?: Date;
  endDate?: Date;
  module?: string;
}) {
  try {
    const db = await getDb();
    if (!db) throw new Error("Database not available");

    const conditions = [];

    if (options?.startDate) {
      conditions.push(gte(orchestrationLogs.createdAt, options.startDate));
    }

    if (options?.endDate) {
      conditions.push(lte(orchestrationLogs.createdAt, options.endDate));
    }

    if (options?.module) {
      conditions.push(eq(orchestrationLogs.module, options.module));
    }

    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

    const logs = await db
      .select()
      .from(orchestrationLogs)
      .where(whereClause as any);

    const totalOperations = logs.length;
    const completedOperations = logs.filter((l: any) => l.status === "completed").length;
    const failedOperations = logs.filter((l: any) => l.status === "failed").length;
    const inProgressOperations = logs.filter((l: any) => l.status === "in_progress" || l.status === "started").length;

    // Calculate average duration for completed operations
    const completedLogs = logs.filter((l: any) => l.status === "completed" && l.durationMs);
    const avgDuration = completedLogs.length > 0
      ? completedLogs.reduce((sum: number, l: any) => sum + (l.durationMs || 0), 0) / completedLogs.length
      : 0;

    // Group by module
    const byModule: Record<string, { count: number; completed: number; failed: number }> = {};
    logs.forEach((l: any) => {
      if (!byModule[l.module]) {
        byModule[l.module] = { count: 0, completed: 0, failed: 0 };
      }
      byModule[l.module].count++;
      if (l.status === "completed") byModule[l.module].completed++;
      if (l.status === "failed") byModule[l.module].failed++;
    });

    return {
      totalOperations,
      completedOperations,
      failedOperations,
      inProgressOperations,
      successRate: totalOperations > 0 ? (completedOperations / totalOperations) * 100 : 0,
      avgDurationMs: Math.round(avgDuration),
      byModule,
    };
  } catch (error) {
    console.error("[Orchestration Logging] Error getting stats:", error);
    throw error;
  }
}

/**
 * Wrapper function to automatically log an async operation
 */
export async function withOrchestrationLogging<T>(
  params: StartLogParams,
  operation: (requestId: string) => Promise<T>
): Promise<T> {
  const requestId = await startOrchestrationLog(params);

  try {
    const result = await operation(requestId);
    await completeOrchestrationLog(requestId, result);
    return result;
  } catch (error) {
    await failOrchestrationLog(requestId, error as Error);
    throw error;
  }
}
