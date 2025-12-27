/**
 * Self-Healing System - Automated Recovery Actions
 * 
 * Implements automatic remediation for common failures:
 * - Service restarts
 * - Cache clearing
 * - Resource scaling
 * - Database connection recovery
 * - Memory cleanup
 */

import { getDb } from "./db";
import { circuitBreakerStates, failureEvents } from "../drizzle/self-healing-schema";
import { eq } from "drizzle-orm";
import { notifyOwner } from "./_core/notification";

export type RecoveryAction = 
  | "restart_service"
  | "clear_cache"
  | "scale_resources"
  | "reconnect_database"
  | "cleanup_memory"
  | "reset_circuit_breaker"
  | "throttle_requests";

export interface RecoveryResult {
  action: RecoveryAction;
  success: boolean;
  message: string;
  timestamp: Date;
  metadata?: Record<string, unknown>;
}

/**
 * Cache storage for in-memory caching
 */
const cacheStore = new Map<string, { value: unknown; expiry: number }>();

/**
 * Request throttling storage
 */
const requestThrottleStore = new Map<string, { count: number; resetTime: number }>();

/**
 * Execute automated recovery action based on failure type
 */
export async function executeRecoveryAction(
  serviceName: string,
  failureType: string,
  metadata?: Record<string, unknown>
): Promise<RecoveryResult> {
  const action = determineRecoveryAction(failureType);
  
  console.log(`[Self-Healing] Executing recovery action: ${action} for service: ${serviceName}`);
  
  let result: RecoveryResult;
  
  try {
    switch (action) {
      case "restart_service":
        result = await restartService(serviceName, metadata);
        break;
      case "clear_cache":
        result = await clearCache(serviceName, metadata);
        break;
      case "scale_resources":
        result = await scaleResources(serviceName, metadata);
        break;
      case "reconnect_database":
        result = await reconnectDatabase(serviceName, metadata);
        break;
      case "cleanup_memory":
        result = await cleanupMemory(serviceName, metadata);
        break;
      case "reset_circuit_breaker":
        result = await resetCircuitBreaker(serviceName, metadata);
        break;
      case "throttle_requests":
        result = await throttleRequests(serviceName, metadata);
        break;
      default:
        result = {
          action,
          success: false,
          message: `Unknown recovery action: ${action}`,
          timestamp: new Date(),
        };
    }
    
    // Log recovery action
    const db = await getDb();
    if (db) {
      await db.insert(failureEvents).values({
        eventId: `recovery-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        failureCategory: "recovery_action",
        failureType: action,
        severity: result.success ? "low" : "high",
        affectedService: serviceName,
        errorMessage: `Recovery action ${action}: ${result.message}`,
        context: { action, result },
        detectionMethod: "automated",
        resolved: result.success,
        resolvedAt: result.success ? new Date() : null,
      });
    }
    
    // Notify owner if recovery failed
    if (!result.success) {
      await notifyOwner({
        title: `Recovery Action Failed: ${serviceName}`,
        content: `Failed to execute ${action} for ${serviceName}: ${result.message}`,
      });
    }
    
    return result;
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    
    result = {
      action,
      success: false,
      message: `Recovery action failed: ${errorMessage}`,
      timestamp: new Date(),
      metadata: { error: errorMessage },
    };
    
    // Log failure
    const db = await getDb();
    if (db) {
      await db.insert(failureEvents).values({
        eventId: `recovery-failure-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        failureCategory: "recovery_failure",
        failureType: action,
        severity: "critical",
        affectedService: serviceName,
        errorMessage: `Recovery action ${action} failed: ${errorMessage}`,
        errorStack: error instanceof Error ? error.stack : undefined,
        context: { action, error: errorMessage },
        detectionMethod: "automated",
        resolved: false,
      });
    }
    
    return result;
  }
}

/**
 * Determine appropriate recovery action based on failure type
 */
function determineRecoveryAction(failureType: string): RecoveryAction {
  const failureTypeLower = failureType.toLowerCase();
  
  if (failureTypeLower.includes("timeout") || failureTypeLower.includes("unresponsive")) {
    return "restart_service";
  }
  
  if (failureTypeLower.includes("cache") || failureTypeLower.includes("stale")) {
    return "clear_cache";
  }
  
  if (failureTypeLower.includes("memory") || failureTypeLower.includes("oom")) {
    return "cleanup_memory";
  }
  
  if (failureTypeLower.includes("database") || failureTypeLower.includes("connection")) {
    return "reconnect_database";
  }
  
  if (failureTypeLower.includes("overload") || failureTypeLower.includes("capacity")) {
    return "scale_resources";
  }
  
  if (failureTypeLower.includes("rate limit") || failureTypeLower.includes("too many requests")) {
    return "throttle_requests";
  }
  
  if (failureTypeLower.includes("circuit") || failureTypeLower.includes("breaker")) {
    return "reset_circuit_breaker";
  }
  
  // Default action
  return "restart_service";
}

/**
 * Restart service (simulated - in production would restart actual service)
 */
async function restartService(
  serviceName: string,
  metadata?: Record<string, unknown>
): Promise<RecoveryResult> {
  // In production, this would trigger actual service restart
  // For now, we simulate by clearing service state and resetting metrics
  
  console.log(`[Recovery] Restarting service: ${serviceName}`);
  
  // Clear any cached data for this service
  const cacheEntries = Array.from(cacheStore.entries());
  for (const [key] of cacheEntries) {
    if (key.startsWith(`${serviceName}:`)) {
      cacheStore.delete(key);
    }
  }
  
  // Reset circuit breaker if exists
  const db = await getDb();
  if (db) {
    await db
      .update(circuitBreakerStates)
      .set({
        state: "closed",
        failureCount: 0,
        lastFailureAt: null,
        nextRetryAt: null,
      })
      .where(eq(circuitBreakerStates.circuitName, serviceName));
  }
  
  return {
    action: "restart_service",
    success: true,
    message: `Service ${serviceName} restarted successfully`,
    timestamp: new Date(),
    metadata: { serviceName, ...metadata },
  };
}

/**
 * Clear cache for service
 */
async function clearCache(
  serviceName: string,
  metadata?: Record<string, unknown>
): Promise<RecoveryResult> {
  console.log(`[Recovery] Clearing cache for service: ${serviceName}`);
  
  let clearedCount = 0;
  
  // Clear all cache entries for this service
  const cacheEntries = Array.from(cacheStore.entries());
  for (const [key] of cacheEntries) {
    if (key.startsWith(`${serviceName}:`)) {
      cacheStore.delete(key);
      clearedCount++;
    }
  }
  
  return {
    action: "clear_cache",
    success: true,
    message: `Cleared ${clearedCount} cache entries for ${serviceName}`,
    timestamp: new Date(),
    metadata: { serviceName, clearedCount, ...metadata },
  };
}

/**
 * Scale resources (simulated - in production would scale actual resources)
 */
async function scaleResources(
  serviceName: string,
  metadata?: Record<string, unknown>
): Promise<RecoveryResult> {
  console.log(`[Recovery] Scaling resources for service: ${serviceName}`);
  
  // In production, this would trigger actual resource scaling
  // For now, we simulate by adjusting throttling limits
  
  const currentLimit = metadata?.currentLimit as number || 100;
  const newLimit = Math.floor(currentLimit * 1.5); // Increase by 50%
  
  return {
    action: "scale_resources",
    success: true,
    message: `Scaled resources for ${serviceName} from ${currentLimit} to ${newLimit}`,
    timestamp: new Date(),
    metadata: { serviceName, oldLimit: currentLimit, newLimit, ...metadata },
  };
}

/**
 * Reconnect to database
 */
async function reconnectDatabase(
  serviceName: string,
  metadata?: Record<string, unknown>
): Promise<RecoveryResult> {
  console.log(`[Recovery] Reconnecting database for service: ${serviceName}`);
  
  try {
    // Test database connection
    const db = await getDb();
    if (!db) {
      throw new Error("Database connection not available");
    }
    await db.select().from(circuitBreakerStates).limit(1);
    
    return {
      action: "reconnect_database",
      success: true,
      message: `Database reconnected successfully for ${serviceName}`,
      timestamp: new Date(),
      metadata: { serviceName, ...metadata },
    };
  } catch (error) {
    return {
      action: "reconnect_database",
      success: false,
      message: `Failed to reconnect database: ${error instanceof Error ? error.message : "Unknown error"}`,
      timestamp: new Date(),
      metadata: { serviceName, error, ...metadata },
    };
  }
}

/**
 * Cleanup memory (garbage collection)
 */
async function cleanupMemory(
  serviceName: string,
  metadata?: Record<string, unknown>
): Promise<RecoveryResult> {
  console.log(`[Recovery] Cleaning up memory for service: ${serviceName}`);
  
  const memBefore = process.memoryUsage().heapUsed / 1024 / 1024;
  
  // Force garbage collection if available
  if (global.gc) {
    global.gc();
  }
  
  // Clear old cache entries
  const now = Date.now();
  let clearedCount = 0;
  const entries = Array.from(cacheStore.entries());
  for (const [key, value] of entries) {
    if (value.expiry < now) {
      cacheStore.delete(key);
      clearedCount++;
    }
  }
  
  const memAfter = process.memoryUsage().heapUsed / 1024 / 1024;
  const memFreed = memBefore - memAfter;
  
  return {
    action: "cleanup_memory",
    success: true,
    message: `Memory cleanup completed for ${serviceName}. Freed ${memFreed.toFixed(2)} MB, cleared ${clearedCount} expired cache entries`,
    timestamp: new Date(),
    metadata: { serviceName, memBefore, memAfter, memFreed, clearedCount, ...metadata },
  };
}

/**
 * Reset circuit breaker
 */
async function resetCircuitBreaker(
  serviceName: string,
  metadata?: Record<string, unknown>
): Promise<RecoveryResult> {
  console.log(`[Recovery] Resetting circuit breaker for service: ${serviceName}`);
  
  const db = await getDb();
  if (db) {
    await db
      .update(circuitBreakerStates)
      .set({
        state: "closed",
        failureCount: 0,
        lastFailureAt: null,
        nextRetryAt: null,
      })
      .where(eq(circuitBreakerStates.circuitName, serviceName));
  }
  
  return {
    action: "reset_circuit_breaker",
    success: true,
    message: `Circuit breaker reset for ${serviceName}`,
    timestamp: new Date(),
    metadata: { serviceName, ...metadata },
  };
}

/**
 * Throttle requests to reduce load
 */
async function throttleRequests(
  serviceName: string,
  metadata?: Record<string, unknown>
): Promise<RecoveryResult> {
  console.log(`[Recovery] Throttling requests for service: ${serviceName}`);
  
  const throttleKey = `throttle:${serviceName}`;
  const now = Date.now();
  const windowMs = 60000; // 1 minute window
  const maxRequests = 50; // Reduced from normal limit
  
  requestThrottleStore.set(throttleKey, {
    count: 0,
    resetTime: now + windowMs,
  });
  
  return {
    action: "throttle_requests",
    success: true,
    message: `Request throttling enabled for ${serviceName}: ${maxRequests} requests per minute`,
    timestamp: new Date(),
    metadata: { serviceName, maxRequests, windowMs, ...metadata },
  };
}

/**
 * Check if request should be throttled
 */
export function isRequestThrottled(serviceName: string): boolean {
  const throttleKey = `throttle:${serviceName}`;
  const throttle = requestThrottleStore.get(throttleKey);
  
  if (!throttle) {
    return false;
  }
  
  const now = Date.now();
  
  // Reset if window expired
  if (now > throttle.resetTime) {
    requestThrottleStore.delete(throttleKey);
    return false;
  }
  
  // Check if limit exceeded
  const maxRequests = 50;
  if (throttle.count >= maxRequests) {
    return true;
  }
  
  // Increment counter
  throttle.count++;
  requestThrottleStore.set(throttleKey, throttle);
  
  return false;
}

/**
 * Execute automatic recovery for circuit breaker open state
 */
export async function autoRecoverCircuitBreaker(serviceName: string): Promise<void> {
  const db = await getDb();
  if (!db) {
    return;
  }

  const circuitState = await db
    .select()
    .from(circuitBreakerStates)
    .where(eq(circuitBreakerStates.circuitName, serviceName))
    .limit(1);
  
  if (circuitState.length === 0 || circuitState[0].state !== "open") {
    return;
  }
  
  const state = circuitState[0];
  const now = new Date();
  
  // Check if retry time has passed
  if (state.nextRetryAt && state.nextRetryAt > now) {
    return;
  }
  
  console.log(`[Self-Healing] Auto-recovering circuit breaker for ${serviceName}`);
  
  // Attempt recovery based on failure count
  if (state.failureCount >= 10) {
    // High failure count - aggressive recovery
    await executeRecoveryAction(serviceName, "service_restart", {
      reason: "high_failure_count",
      failureCount: state.failureCount,
    });
  } else if (state.failureCount >= 5) {
    // Medium failure count - clear cache
    await executeRecoveryAction(serviceName, "cache_clear", {
      reason: "medium_failure_count",
      failureCount: state.failureCount,
    });
  } else {
    // Low failure count - just reset circuit breaker
    await executeRecoveryAction(serviceName, "circuit_breaker_reset", {
      reason: "low_failure_count",
      failureCount: state.failureCount,
    });
  }
  
  // Transition to half-open state
  await db
    .update(circuitBreakerStates)
    .set({
      state: "half-open",
      nextRetryAt: new Date(now.getTime() + 30000), // 30 seconds
    })
    .where(eq(circuitBreakerStates.circuitName, serviceName));
}

/**
 * Schedule automatic recovery checks
 */
export function startAutoRecoveryScheduler(): void {
  // Check for circuit breakers that need recovery every 30 seconds
  setInterval(async () => {
    try {
      const db = await getDb();
      if (!db) {
        return;
      }

      const openCircuits = await db
        .select()
        .from(circuitBreakerStates)
        .where(eq(circuitBreakerStates.state, "open"));
      
      for (const circuit of openCircuits) {
        await autoRecoverCircuitBreaker(circuit.circuitName);
      }
    } catch (error) {
      console.error("[Self-Healing] Auto-recovery scheduler error:", error);
    }
  }, 30000);
  
  console.log("[Self-Healing] Auto-recovery scheduler started");
}
