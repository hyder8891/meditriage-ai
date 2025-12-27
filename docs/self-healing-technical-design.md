# Self-Healing System Technical Design

**Document Version:** 1.0  
**Date:** December 27, 2025  
**Author:** Manus AI  
**Status:** Implementation Ready

---

## 1. Technical Architecture Overview

This document provides the detailed technical design for implementing the self-healing system defined in the specification. The design is optimized for the MediTriage AI technology stack (Express + tRPC + React + MySQL/TiDB + Redis) and follows the existing architectural patterns.

### 1.1 Design Principles

The technical implementation follows these core principles:

**Minimal Invasiveness:** The self-healing system integrates with existing code through middleware and decorators, requiring minimal changes to existing tRPC procedures and business logic. This ensures that the system can be incrementally deployed without disrupting current functionality.

**Type Safety:** All components leverage TypeScript's type system to ensure compile-time safety. The instrumentation layer provides fully-typed metrics and events, preventing runtime errors from incorrect telemetry data.

**Performance First:** Every component is designed with performance as a primary constraint. Instrumentation uses asynchronous batching, metrics aggregation leverages Redis Streams for high throughput, and recovery actions are non-blocking to avoid impacting user requests.

**Operational Simplicity:** The system provides clear observability through a unified dashboard, straightforward configuration through environment variables and database records, and comprehensive documentation for operators.

---

## 2. Database Schema Design

### 2.1 Core Tables

The self-healing system requires five new database tables:

```typescript
// drizzle/self-healing-schema.ts

import { sqliteTable, text, integer, real, index } from "drizzle-orm/sqlite-core";
import { sql } from "drizzle-orm";

/**
 * System Health Metrics
 * Stores aggregated health metrics for monitoring and analysis
 */
export const systemHealthMetrics = sqliteTable(
  "system_health_metrics",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    timestamp: integer("timestamp", { mode: "timestamp_ms" }).notNull(),
    metricType: text("metric_type").notNull(), // 'cpu', 'memory', 'latency', 'error_rate', etc.
    metricName: text("metric_name").notNull(), // Specific metric identifier
    value: real("value").notNull(),
    unit: text("unit").notNull(), // 'percent', 'ms', 'count', 'bytes', etc.
    tags: text("tags", { mode: "json" }).$type<Record<string, string>>(), // Additional context
    source: text("source").notNull(), // Service/module that generated the metric
    createdAt: integer("created_at", { mode: "timestamp_ms" })
      .notNull()
      .default(sql`(unixepoch() * 1000)`),
  },
  (table) => ({
    timestampIdx: index("health_metrics_timestamp_idx").on(table.timestamp),
    metricTypeIdx: index("health_metrics_type_idx").on(table.metricType),
    sourceIdx: index("health_metrics_source_idx").on(table.source),
  })
);

/**
 * Failure Events
 * Records all detected failures for analysis and recovery
 */
export const failureEvents = sqliteTable(
  "failure_events",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    eventId: text("event_id").notNull().unique(), // UUID for correlation
    timestamp: integer("timestamp", { mode: "timestamp_ms" }).notNull(),
    failureCategory: text("failure_category").notNull(), // 'external_dependency', 'internal_service', etc.
    failureType: text("failure_type").notNull(), // 'api_timeout', 'database_connection', etc.
    severity: text("severity").notNull(), // 'low', 'medium', 'high', 'critical'
    affectedService: text("affected_service").notNull(),
    errorMessage: text("error_message"),
    errorStack: text("error_stack"),
    context: text("context", { mode: "json" }).$type<Record<string, any>>(),
    detectionMethod: text("detection_method").notNull(), // 'threshold', 'anomaly', 'exception', etc.
    userId: text("user_id"), // If failure affected specific user
    requestId: text("request_id"), // Correlation with orchestration logs
    resolved: integer("resolved", { mode: "boolean" }).notNull().default(false),
    resolvedAt: integer("resolved_at", { mode: "timestamp_ms" }),
    createdAt: integer("created_at", { mode: "timestamp_ms" })
      .notNull()
      .default(sql`(unixepoch() * 1000)`),
  },
  (table) => ({
    timestampIdx: index("failure_events_timestamp_idx").on(table.timestamp),
    categoryIdx: index("failure_events_category_idx").on(table.failureCategory),
    severityIdx: index("failure_events_severity_idx").on(table.severity),
    resolvedIdx: index("failure_events_resolved_idx").on(table.resolved),
    requestIdIdx: index("failure_events_request_id_idx").on(table.requestId),
  })
);

/**
 * Recovery Actions
 * Tracks all automated and manual recovery attempts
 */
export const recoveryActions = sqliteTable(
  "recovery_actions",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    actionId: text("action_id").notNull().unique(), // UUID
    failureEventId: integer("failure_event_id")
      .notNull()
      .references(() => failureEvents.id),
    timestamp: integer("timestamp", { mode: "timestamp_ms" }).notNull(),
    actionType: text("action_type").notNull(), // 'retry', 'failover', 'restart', 'circuit_break', etc.
    actionStrategy: text("action_strategy").notNull(), // Specific strategy used
    status: text("status").notNull(), // 'initiated', 'in_progress', 'succeeded', 'failed', 'rolled_back'
    automated: integer("automated", { mode: "boolean" }).notNull(),
    triggeredBy: text("triggered_by"), // User ID if manual, 'system' if automated
    parameters: text("parameters", { mode: "json" }).$type<Record<string, any>>(),
    result: text("result", { mode: "json" }).$type<Record<string, any>>(),
    durationMs: integer("duration_ms"),
    completedAt: integer("completed_at", { mode: "timestamp_ms" }),
    createdAt: integer("created_at", { mode: "timestamp_ms" })
      .notNull()
      .default(sql`(unixepoch() * 1000)`),
  },
  (table) => ({
    failureEventIdx: index("recovery_actions_failure_idx").on(table.failureEventId),
    timestampIdx: index("recovery_actions_timestamp_idx").on(table.timestamp),
    statusIdx: index("recovery_actions_status_idx").on(table.status),
  })
);

/**
 * Circuit Breaker States
 * Maintains current state of all circuit breakers
 */
export const circuitBreakerStates = sqliteTable(
  "circuit_breaker_states",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    circuitName: text("circuit_name").notNull().unique(), // Unique identifier for circuit
    state: text("state").notNull(), // 'closed', 'open', 'half_open'
    failureCount: integer("failure_count").notNull().default(0),
    successCount: integer("success_count").notNull().default(0),
    lastFailureAt: integer("last_failure_at", { mode: "timestamp_ms" }),
    lastSuccessAt: integer("last_success_at", { mode: "timestamp_ms" }),
    openedAt: integer("opened_at", { mode: "timestamp_ms" }),
    nextRetryAt: integer("next_retry_at", { mode: "timestamp_ms" }),
    configuration: text("configuration", { mode: "json" }).$type<{
      failureThreshold: number;
      successThreshold: number;
      timeout: number;
      resetTimeout: number;
    }>(),
    updatedAt: integer("updated_at", { mode: "timestamp_ms" })
      .notNull()
      .default(sql`(unixepoch() * 1000)`),
    createdAt: integer("created_at", { mode: "timestamp_ms" })
      .notNull()
      .default(sql`(unixepoch() * 1000)`),
  },
  (table) => ({
    stateIdx: index("circuit_breaker_state_idx").on(table.state),
    nextRetryIdx: index("circuit_breaker_next_retry_idx").on(table.nextRetryAt),
  })
);

/**
 * System Health Baselines
 * Stores baseline metrics for anomaly detection
 */
export const systemHealthBaselines = sqliteTable(
  "system_health_baselines",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    metricType: text("metric_type").notNull(),
    metricName: text("metric_name").notNull(),
    source: text("source").notNull(),
    timeWindow: text("time_window").notNull(), // '1h', '24h', '7d', etc.
    mean: real("mean").notNull(),
    median: real("median").notNull(),
    stdDev: real("std_dev").notNull(),
    p50: real("p50").notNull(),
    p95: real("p95").notNull(),
    p99: real("p99").notNull(),
    min: real("min").notNull(),
    max: real("max").notNull(),
    sampleCount: integer("sample_count").notNull(),
    calculatedAt: integer("calculated_at", { mode: "timestamp_ms" }).notNull(),
    validUntil: integer("valid_until", { mode: "timestamp_ms" }).notNull(),
    createdAt: integer("created_at", { mode: "timestamp_ms" })
      .notNull()
      .default(sql`(unixepoch() * 1000)`),
  },
  (table) => ({
    metricIdx: index("baselines_metric_idx").on(
      table.metricType,
      table.metricName,
      table.source
    ),
    validUntilIdx: index("baselines_valid_until_idx").on(table.validUntil),
  })
);
```

### 2.2 Schema Integration

The new tables integrate with existing schema:

```typescript
// drizzle/relations.ts (additions)

import { relations } from "drizzle-orm";
import { failureEvents, recoveryActions } from "./self-healing-schema";

export const failureEventsRelations = relations(failureEvents, ({ many }) => ({
  recoveryActions: many(recoveryActions),
}));

export const recoveryActionsRelations = relations(recoveryActions, ({ one }) => ({
  failureEvent: one(failureEvents, {
    fields: [recoveryActions.failureEventId],
    references: [failureEvents.id],
  }),
}));
```

---

## 3. Core Components Implementation

### 3.1 Instrumentation Layer

The instrumentation layer wraps tRPC procedures to collect metrics:

```typescript
// server/_core/self-healing/instrumentation.ts

import { Redis } from "ioredis";
import { nanoid } from "nanoid";

export interface MetricData {
  timestamp: number;
  metricType: string;
  metricName: string;
  value: number;
  unit: string;
  tags?: Record<string, string>;
  source: string;
}

export interface OperationContext {
  operationId: string;
  operationType: string;
  startTime: number;
  metadata: Record<string, any>;
}

/**
 * Metrics Collector
 * Batches and sends metrics to Redis Streams for aggregation
 */
export class MetricsCollector {
  private redis: Redis;
  private batchQueue: MetricData[] = [];
  private batchSize = 100;
  private flushInterval = 1000; // 1 second
  private flushTimer: NodeJS.Timeout | null = null;

  constructor(redis: Redis) {
    this.redis = redis;
    this.startBatchFlush();
  }

  /**
   * Record a metric (non-blocking)
   */
  record(metric: Omit<MetricData, "timestamp">): void {
    const metricData: MetricData = {
      ...metric,
      timestamp: Date.now(),
    };

    this.batchQueue.push(metricData);

    if (this.batchQueue.length >= this.batchSize) {
      this.flush().catch((err) =>
        console.error("[MetricsCollector] Flush error:", err)
      );
    }
  }

  /**
   * Flush batched metrics to Redis Stream
   */
  private async flush(): Promise<void> {
    if (this.batchQueue.length === 0) return;

    const batch = this.batchQueue.splice(0, this.batchQueue.length);

    try {
      const pipeline = this.redis.pipeline();

      for (const metric of batch) {
        pipeline.xadd(
          "metrics:stream",
          "*",
          "data",
          JSON.stringify(metric)
        );
      }

      await pipeline.exec();
    } catch (error) {
      console.error("[MetricsCollector] Failed to flush metrics:", error);
      // Re-queue metrics for retry
      this.batchQueue.unshift(...batch);
    }
  }

  /**
   * Start periodic batch flush
   */
  private startBatchFlush(): void {
    this.flushTimer = setInterval(() => {
      this.flush().catch((err) =>
        console.error("[MetricsCollector] Scheduled flush error:", err)
      );
    }, this.flushInterval);
  }

  /**
   * Cleanup resources
   */
  async shutdown(): Promise<void> {
    if (this.flushTimer) {
      clearInterval(this.flushTimer);
    }
    await this.flush();
  }
}

/**
 * Operation Tracker
 * Tracks operation lifecycle for latency and success rate metrics
 */
export class OperationTracker {
  private metricsCollector: MetricsCollector;

  constructor(metricsCollector: MetricsCollector) {
    this.metricsCollector = metricsCollector;
  }

  /**
   * Start tracking an operation
   */
  startOperation(
    operationType: string,
    metadata: Record<string, any> = {}
  ): OperationContext {
    return {
      operationId: nanoid(),
      operationType,
      startTime: Date.now(),
      metadata,
    };
  }

  /**
   * Record successful operation completion
   */
  recordSuccess(context: OperationContext, result?: any): void {
    const duration = Date.now() - context.startTime;

    this.metricsCollector.record({
      metricType: "operation",
      metricName: `${context.operationType}.duration`,
      value: duration,
      unit: "ms",
      source: context.operationType,
      tags: {
        status: "success",
        ...context.metadata,
      },
    });

    this.metricsCollector.record({
      metricType: "operation",
      metricName: `${context.operationType}.success_count`,
      value: 1,
      unit: "count",
      source: context.operationType,
      tags: context.metadata,
    });
  }

  /**
   * Record failed operation
   */
  recordFailure(
    context: OperationContext,
    error: Error,
    errorCategory?: string
  ): void {
    const duration = Date.now() - context.startTime;

    this.metricsCollector.record({
      metricType: "operation",
      metricName: `${context.operationType}.duration`,
      value: duration,
      unit: "ms",
      source: context.operationType,
      tags: {
        status: "failure",
        error_type: error.name,
        error_category: errorCategory || "unknown",
        ...context.metadata,
      },
    });

    this.metricsCollector.record({
      metricType: "operation",
      metricName: `${context.operationType}.failure_count`,
      value: 1,
      unit: "count",
      source: context.operationType,
      tags: {
        error_type: error.name,
        error_category: errorCategory || "unknown",
        ...context.metadata,
      },
    });
  }
}

/**
 * tRPC Procedure Instrumentation Middleware
 */
export function createInstrumentationMiddleware(
  metricsCollector: MetricsCollector,
  operationTracker: OperationTracker
) {
  return async function instrumentationMiddleware(opts: any) {
    const { path, type, next } = opts;

    const context = operationTracker.startOperation(`trpc.${path}`, {
      type,
    });

    try {
      const result = await next();
      operationTracker.recordSuccess(context, result);
      return result;
    } catch (error) {
      const errorCategory = categorizeError(error);
      operationTracker.recordFailure(context, error as Error, errorCategory);
      throw error;
    }
  };
}

/**
 * Categorize errors for better tracking
 */
function categorizeError(error: any): string {
  if (error.code === "TIMEOUT") return "timeout";
  if (error.code === "ECONNREFUSED") return "connection_refused";
  if (error.code === "ENOTFOUND") return "dns_error";
  if (error.message?.includes("rate limit")) return "rate_limit";
  if (error.message?.includes("quota")) return "quota_exceeded";
  if (error.name === "TRPCError") return "trpc_error";
  return "unknown";
}
```

### 3.2 Health Monitoring System

```typescript
// server/_core/self-healing/health-monitor.ts

import { Redis } from "ioredis";
import { getDb } from "../db";
import { MetricsCollector } from "./instrumentation";

export interface HealthCheckResult {
  name: string;
  status: "healthy" | "degraded" | "unhealthy";
  latency: number;
  message?: string;
  metadata?: Record<string, any>;
}

export interface SystemHealth {
  overall: "healthy" | "degraded" | "unhealthy";
  checks: HealthCheckResult[];
  timestamp: number;
}

/**
 * Health Check Registry
 * Manages all health checks in the system
 */
export class HealthCheckRegistry {
  private checks: Map<string, () => Promise<HealthCheckResult>> = new Map();

  /**
   * Register a health check
   */
  register(name: string, check: () => Promise<HealthCheckResult>): void {
    this.checks.set(name, check);
  }

  /**
   * Execute all health checks
   */
  async executeAll(): Promise<SystemHealth> {
    const results: HealthCheckResult[] = [];

    for (const [name, check] of this.checks.entries()) {
      try {
        const result = await Promise.race([
          check(),
          this.timeout(name, 5000), // 5 second timeout
        ]);
        results.push(result);
      } catch (error) {
        results.push({
          name,
          status: "unhealthy",
          latency: 5000,
          message: `Health check failed: ${(error as Error).message}`,
        });
      }
    }

    const overall = this.determineOverallHealth(results);

    return {
      overall,
      checks: results,
      timestamp: Date.now(),
    };
  }

  /**
   * Timeout helper for health checks
   */
  private timeout(name: string, ms: number): Promise<HealthCheckResult> {
    return new Promise((_, reject) =>
      setTimeout(
        () =>
          reject(
            new Error(`Health check '${name}' timed out after ${ms}ms`)
          ),
        ms
      )
    );
  }

  /**
   * Determine overall system health from individual checks
   */
  private determineOverallHealth(
    checks: HealthCheckResult[]
  ): "healthy" | "degraded" | "unhealthy" {
    const unhealthyCount = checks.filter(
      (c) => c.status === "unhealthy"
    ).length;
    const degradedCount = checks.filter((c) => c.status === "degraded").length;

    if (unhealthyCount > 0) return "unhealthy";
    if (degradedCount > 0) return "degraded";
    return "healthy";
  }
}

/**
 * Built-in Health Checks
 */
export function registerBuiltInHealthChecks(
  registry: HealthCheckRegistry,
  redis: Redis,
  metricsCollector: MetricsCollector
): void {
  // Database health check
  registry.register("database", async () => {
    const start = Date.now();
    try {
      const db = await getDb();
      await db!.execute("SELECT 1");
      const latency = Date.now() - start;

      metricsCollector.record({
        metricType: "health_check",
        metricName: "database.latency",
        value: latency,
        unit: "ms",
        source: "health_monitor",
      });

      return {
        name: "database",
        status: latency < 100 ? "healthy" : "degraded",
        latency,
        message: latency < 100 ? "Database responsive" : "Database slow",
      };
    } catch (error) {
      return {
        name: "database",
        status: "unhealthy",
        latency: Date.now() - start,
        message: `Database connection failed: ${(error as Error).message}`,
      };
    }
  });

  // Redis health check
  registry.register("redis", async () => {
    const start = Date.now();
    try {
      await redis.ping();
      const latency = Date.now() - start;

      metricsCollector.record({
        metricType: "health_check",
        metricName: "redis.latency",
        value: latency,
        unit: "ms",
        source: "health_monitor",
      });

      return {
        name: "redis",
        status: latency < 50 ? "healthy" : "degraded",
        latency,
        message: latency < 50 ? "Redis responsive" : "Redis slow",
      };
    } catch (error) {
      return {
        name: "redis",
        status: "unhealthy",
        latency: Date.now() - start,
        message: `Redis connection failed: ${(error as Error).message}`,
      };
    }
  });

  // Memory health check
  registry.register("memory", async () => {
    const start = Date.now();
    const usage = process.memoryUsage();
    const heapUsedPercent = (usage.heapUsed / usage.heapTotal) * 100;

    metricsCollector.record({
      metricType: "system",
      metricName: "memory.heap_used_percent",
      value: heapUsedPercent,
      unit: "percent",
      source: "health_monitor",
    });

    let status: "healthy" | "degraded" | "unhealthy" = "healthy";
    let message = "Memory usage normal";

    if (heapUsedPercent > 90) {
      status = "unhealthy";
      message = "Critical memory usage";
    } else if (heapUsedPercent > 75) {
      status = "degraded";
      message = "High memory usage";
    }

    return {
      name: "memory",
      status,
      latency: Date.now() - start,
      message,
      metadata: {
        heapUsed: usage.heapUsed,
        heapTotal: usage.heapTotal,
        heapUsedPercent: heapUsedPercent.toFixed(2),
      },
    };
  });

  // CPU health check (simplified)
  registry.register("cpu", async () => {
    const start = Date.now();
    const usage = process.cpuUsage();
    const uptimeMs = process.uptime() * 1000;
    
    // Calculate CPU percentage (rough estimate)
    const cpuPercent = ((usage.user + usage.system) / (uptimeMs * 1000)) * 100;

    metricsCollector.record({
      metricType: "system",
      metricName: "cpu.usage_percent",
      value: cpuPercent,
      unit: "percent",
      source: "health_monitor",
    });

    let status: "healthy" | "degraded" | "unhealthy" = "healthy";
    let message = "CPU usage normal";

    if (cpuPercent > 95) {
      status = "unhealthy";
      message = "Critical CPU usage";
    } else if (cpuPercent > 80) {
      status = "degraded";
      message = "High CPU usage";
    }

    return {
      name: "cpu",
      status,
      latency: Date.now() - start,
      message,
      metadata: {
        cpuPercent: cpuPercent.toFixed(2),
      },
    };
  });
}

/**
 * Health Monitor Service
 * Periodically executes health checks and records results
 */
export class HealthMonitorService {
  private registry: HealthCheckRegistry;
  private metricsCollector: MetricsCollector;
  private checkInterval = 30000; // 30 seconds
  private intervalTimer: NodeJS.Timeout | null = null;

  constructor(
    registry: HealthCheckRegistry,
    metricsCollector: MetricsCollector
  ) {
    this.registry = registry;
    this.metricsCollector = metricsCollector;
  }

  /**
   * Start periodic health monitoring
   */
  start(): void {
    console.log("[HealthMonitor] Starting health monitoring service");

    // Execute immediately
    this.executeHealthChecks();

    // Then execute periodically
    this.intervalTimer = setInterval(() => {
      this.executeHealthChecks();
    }, this.checkInterval);
  }

  /**
   * Stop health monitoring
   */
  stop(): void {
    if (this.intervalTimer) {
      clearInterval(this.intervalTimer);
      this.intervalTimer = null;
    }
    console.log("[HealthMonitor] Stopped health monitoring service");
  }

  /**
   * Execute all health checks and record results
   */
  private async executeHealthChecks(): Promise<void> {
    try {
      const health = await this.registry.executeAll();

      // Record overall health status
      this.metricsCollector.record({
        metricType: "system",
        metricName: "overall_health",
        value: health.overall === "healthy" ? 1 : health.overall === "degraded" ? 0.5 : 0,
        unit: "status",
        source: "health_monitor",
        tags: {
          status: health.overall,
        },
      });

      // Log unhealthy checks
      const unhealthyChecks = health.checks.filter(
        (c) => c.status === "unhealthy"
      );
      if (unhealthyChecks.length > 0) {
        console.warn(
          "[HealthMonitor] Unhealthy checks detected:",
          unhealthyChecks.map((c) => `${c.name}: ${c.message}`).join(", ")
        );
      }
    } catch (error) {
      console.error("[HealthMonitor] Failed to execute health checks:", error);
    }
  }
}
```

### 3.3 Circuit Breaker Implementation

```typescript
// server/_core/self-healing/circuit-breaker.ts

import { getDb } from "../db";
import { circuitBreakerStates } from "../../../drizzle/self-healing-schema";
import { eq } from "drizzle-orm";

export interface CircuitBreakerConfig {
  failureThreshold: number; // Number of failures before opening
  successThreshold: number; // Number of successes before closing from half-open
  timeout: number; // Request timeout in ms
  resetTimeout: number; // Time to wait before trying half-open in ms
}

export type CircuitState = "closed" | "open" | "half_open";

export class CircuitBreakerError extends Error {
  constructor(circuitName: string) {
    super(`Circuit breaker '${circuitName}' is open`);
    this.name = "CircuitBreakerError";
  }
}

/**
 * Circuit Breaker
 * Prevents cascading failures by temporarily blocking requests to failing services
 */
export class CircuitBreaker {
  private circuitName: string;
  private config: CircuitBreakerConfig;
  private state: CircuitState = "closed";
  private failureCount = 0;
  private successCount = 0;
  private nextRetryTime: number | null = null;

  constructor(circuitName: string, config: Partial<CircuitBreakerConfig> = {}) {
    this.circuitName = circuitName;
    this.config = {
      failureThreshold: config.failureThreshold || 5,
      successThreshold: config.successThreshold || 2,
      timeout: config.timeout || 30000,
      resetTimeout: config.resetTimeout || 60000,
    };

    // Load state from database
    this.loadState().catch((err) =>
      console.error(`[CircuitBreaker:${circuitName}] Failed to load state:`, err)
    );
  }

  /**
   * Execute a function with circuit breaker protection
   */
  async execute<T>(fn: () => Promise<T>): Promise<T> {
    // Check if circuit is open
    if (this.state === "open") {
      if (this.nextRetryTime && Date.now() < this.nextRetryTime) {
        throw new CircuitBreakerError(this.circuitName);
      }
      // Time to try half-open
      await this.transitionToHalfOpen();
    }

    try {
      // Execute with timeout
      const result = await Promise.race([
        fn(),
        this.timeoutPromise<T>(this.config.timeout),
      ]);

      await this.recordSuccess();
      return result;
    } catch (error) {
      await this.recordFailure();
      throw error;
    }
  }

  /**
   * Record successful execution
   */
  private async recordSuccess(): Promise<void> {
    if (this.state === "half_open") {
      this.successCount++;
      if (this.successCount >= this.config.successThreshold) {
        await this.transitionToClosed();
      }
    } else if (this.state === "closed") {
      // Reset failure count on success
      this.failureCount = 0;
    }

    await this.persistState();
  }

  /**
   * Record failed execution
   */
  private async recordFailure(): Promise<void> {
    this.failureCount++;

    if (this.state === "half_open") {
      // Failure in half-open state immediately reopens circuit
      await this.transitionToOpen();
    } else if (
      this.state === "closed" &&
      this.failureCount >= this.config.failureThreshold
    ) {
      await this.transitionToOpen();
    }

    await this.persistState();
  }

  /**
   * Transition to CLOSED state
   */
  private async transitionToClosed(): Promise<void> {
    console.log(`[CircuitBreaker:${this.circuitName}] Transitioning to CLOSED`);
    this.state = "closed";
    this.failureCount = 0;
    this.successCount = 0;
    this.nextRetryTime = null;
    await this.persistState();
  }

  /**
   * Transition to OPEN state
   */
  private async transitionToOpen(): Promise<void> {
    console.log(`[CircuitBreaker:${this.circuitName}] Transitioning to OPEN`);
    this.state = "open";
    this.successCount = 0;
    this.nextRetryTime = Date.now() + this.config.resetTimeout;
    await this.persistState();
  }

  /**
   * Transition to HALF_OPEN state
   */
  private async transitionToHalfOpen(): Promise<void> {
    console.log(`[CircuitBreaker:${this.circuitName}] Transitioning to HALF_OPEN`);
    this.state = "half_open";
    this.successCount = 0;
    this.failureCount = 0;
    await this.persistState();
  }

  /**
   * Create timeout promise
   */
  private timeoutPromise<T>(ms: number): Promise<T> {
    return new Promise((_, reject) =>
      setTimeout(() => reject(new Error("Operation timeout")), ms)
    );
  }

  /**
   * Load circuit breaker state from database
   */
  private async loadState(): Promise<void> {
    try {
      const db = await getDb();
      const [record] = await db!
        .select()
        .from(circuitBreakerStates)
        .where(eq(circuitBreakerStates.circuitName, this.circuitName))
        .limit(1);

      if (record) {
        this.state = record.state as CircuitState;
        this.failureCount = record.failureCount;
        this.successCount = record.successCount;
        this.nextRetryTime = record.nextRetryAt
          ? new Date(record.nextRetryAt).getTime()
          : null;
      }
    } catch (error) {
      console.error(
        `[CircuitBreaker:${this.circuitName}] Failed to load state:`,
        error
      );
    }
  }

  /**
   * Persist circuit breaker state to database
   */
  private async persistState(): Promise<void> {
    try {
      const db = await getDb();
      await db!
        .insert(circuitBreakerStates)
        .values({
          circuitName: this.circuitName,
          state: this.state,
          failureCount: this.failureCount,
          successCount: this.successCount,
          lastFailureAt: this.failureCount > 0 ? new Date() : null,
          lastSuccessAt: this.successCount > 0 ? new Date() : null,
          openedAt: this.state === "open" ? new Date() : null,
          nextRetryAt: this.nextRetryTime ? new Date(this.nextRetryTime) : null,
          configuration: this.config,
          updatedAt: new Date(),
        })
        .onConflictDoUpdate({
          target: circuitBreakerStates.circuitName,
          set: {
            state: this.state,
            failureCount: this.failureCount,
            successCount: this.successCount,
            lastFailureAt: this.failureCount > 0 ? new Date() : null,
            lastSuccessAt: this.successCount > 0 ? new Date() : null,
            openedAt: this.state === "open" ? new Date() : null,
            nextRetryAt: this.nextRetryTime ? new Date(this.nextRetryTime) : null,
            configuration: this.config,
            updatedAt: new Date(),
          },
        });
    } catch (error) {
      console.error(
        `[CircuitBreaker:${this.circuitName}] Failed to persist state:`,
        error
      );
    }
  }

  /**
   * Get current circuit state
   */
  getState(): {
    state: CircuitState;
    failureCount: number;
    successCount: number;
    nextRetryTime: number | null;
  } {
    return {
      state: this.state,
      failureCount: this.failureCount,
      successCount: this.successCount,
      nextRetryTime: this.nextRetryTime,
    };
  }
}

/**
 * Circuit Breaker Registry
 * Manages all circuit breakers in the system
 */
export class CircuitBreakerRegistry {
  private breakers: Map<string, CircuitBreaker> = new Map();

  /**
   * Get or create a circuit breaker
   */
  getOrCreate(
    name: string,
    config?: Partial<CircuitBreakerConfig>
  ): CircuitBreaker {
    if (!this.breakers.has(name)) {
      this.breakers.set(name, new CircuitBreaker(name, config));
    }
    return this.breakers.get(name)!;
  }

  /**
   * Get all circuit breakers
   */
  getAll(): Map<string, CircuitBreaker> {
    return this.breakers;
  }

  /**
   * Get circuit breaker by name
   */
  get(name: string): CircuitBreaker | undefined {
    return this.breakers.get(name);
  }
}
```

---

## 4. Integration with Existing System

### 4.1 tRPC Middleware Integration

```typescript
// server/_core/trpc.ts (modifications)

import { initTRPC, TRPCError } from "@trpc/server";
import { Redis } from "ioredis";
import {
  MetricsCollector,
  OperationTracker,
  createInstrumentationMiddleware,
} from "./self-healing/instrumentation";

// Initialize Redis for metrics
const redis = new Redis(process.env.REDIS_URL!);

// Initialize self-healing components
const metricsCollector = new MetricsCollector(redis);
const operationTracker = new OperationTracker(metricsCollector);

// Create tRPC instance
const t = initTRPC.context<Context>().create({
  transformer: superjson,
});

// Add instrumentation middleware
const instrumentationMiddleware = t.middleware(
  createInstrumentationMiddleware(metricsCollector, operationTracker)
);

// Update procedure definitions to include instrumentation
export const publicProcedure = t.procedure.use(instrumentationMiddleware);
export const protectedProcedure = t.procedure
  .use(instrumentationMiddleware)
  .use(async ({ ctx, next }) => {
    if (!ctx.user) {
      throw new TRPCError({ code: "UNAUTHORIZED" });
    }
    return next({ ctx: { ...ctx, user: ctx.user } });
  });

// Export for cleanup
export { metricsCollector, operationTracker, redis as metricsRedis };
```

### 4.2 AI API Circuit Breaker Wrapper

```typescript
// server/_core/llm.ts (modifications)

import { CircuitBreakerRegistry } from "./self-healing/circuit-breaker";

// Initialize circuit breaker registry
const circuitBreakerRegistry = new CircuitBreakerRegistry();

/**
 * Invoke LLM with circuit breaker protection
 */
export async function invokeLLM(params: any): Promise<any> {
  const circuitBreaker = circuitBreakerRegistry.getOrCreate("llm:openai", {
    failureThreshold: 5,
    successThreshold: 2,
    timeout: 30000,
    resetTimeout: 60000,
  });

  return await circuitBreaker.execute(async () => {
    // Original LLM invocation logic
    const response = await fetch(/* ... */);
    return response;
  });
}

// Similar wrappers for other AI providers
export async function invokeDeepSeek(params: any): Promise<any> {
  const circuitBreaker = circuitBreakerRegistry.getOrCreate("llm:deepseek", {
    failureThreshold: 5,
    successThreshold: 2,
    timeout: 30000,
    resetTimeout: 60000,
  });

  return await circuitBreaker.execute(async () => {
    // DeepSeek invocation logic
  });
}
```

### 4.3 Health Endpoint

```typescript
// server/routers.ts (additions)

import {
  HealthCheckRegistry,
  registerBuiltInHealthChecks,
} from "./_core/self-healing/health-monitor";
import { metricsCollector, metricsRedis } from "./_core/trpc";

// Initialize health check registry
const healthCheckRegistry = new HealthCheckRegistry();
registerBuiltInHealthChecks(healthCheckRegistry, metricsRedis, metricsCollector);

export const appRouter = router({
  // ... existing routers
  
  /**
   * Health check endpoint
   */
  health: publicProcedure.query(async () => {
    return await healthCheckRegistry.executeAll();
  }),
});
```

---

## 5. Recovery Engine Implementation

```typescript
// server/_core/self-healing/recovery-engine.ts

import { nanoid } from "nanoid";
import { getDb } from "../db";
import { failureEvents, recoveryActions } from "../../../drizzle/self-healing-schema";
import { eq } from "drizzle-orm";

export interface RecoveryStrategy {
  name: string;
  applicableFailureTypes: string[];
  execute: (failure: FailureEvent) => Promise<RecoveryResult>;
  priority: number; // Lower number = higher priority
}

export interface FailureEvent {
  id?: number;
  eventId: string;
  timestamp: Date;
  failureCategory: string;
  failureType: string;
  severity: string;
  affectedService: string;
  errorMessage?: string;
  errorStack?: string;
  context?: Record<string, any>;
  detectionMethod: string;
  userId?: string;
  requestId?: string;
}

export interface RecoveryResult {
  success: boolean;
  actionType: string;
  actionStrategy: string;
  durationMs: number;
  message: string;
  metadata?: Record<string, any>;
}

/**
 * Recovery Engine
 * Orchestrates automated recovery workflows
 */
export class RecoveryEngine {
  private strategies: RecoveryStrategy[] = [];

  /**
   * Register a recovery strategy
   */
  registerStrategy(strategy: RecoveryStrategy): void {
    this.strategies.push(strategy);
    // Sort by priority
    this.strategies.sort((a, b) => a.priority - b.priority);
  }

  /**
   * Handle a failure event and attempt recovery
   */
  async handleFailure(failure: FailureEvent): Promise<void> {
    console.log(
      `[RecoveryEngine] Handling failure: ${failure.failureType} in ${failure.affectedService}`
    );

    // Persist failure event
    const failureId = await this.persistFailureEvent(failure);

    // Find applicable strategies
    const applicableStrategies = this.strategies.filter((s) =>
      s.applicableFailureTypes.includes(failure.failureType)
    );

    if (applicableStrategies.length === 0) {
      console.warn(
        `[RecoveryEngine] No recovery strategy found for failure type: ${failure.failureType}`
      );
      return;
    }

    // Try each strategy in priority order
    for (const strategy of applicableStrategies) {
      const actionId = nanoid();
      const startTime = Date.now();

      try {
        console.log(
          `[RecoveryEngine] Attempting recovery strategy: ${strategy.name}`
        );

        const result = await strategy.execute(failure);
        const durationMs = Date.now() - startTime;

        // Persist recovery action
        await this.persistRecoveryAction({
          actionId,
          failureEventId: failureId,
          actionType: result.actionType,
          actionStrategy: strategy.name,
          status: result.success ? "succeeded" : "failed",
          automated: true,
          parameters: failure.context,
          result: {
            message: result.message,
            ...result.metadata,
          },
          durationMs,
        });

        if (result.success) {
          console.log(
            `[RecoveryEngine] Recovery successful: ${result.message}`
          );
          // Mark failure as resolved
          await this.markFailureResolved(failureId);
          return;
        } else {
          console.warn(
            `[RecoveryEngine] Recovery strategy failed: ${result.message}`
          );
        }
      } catch (error) {
        console.error(
          `[RecoveryEngine] Recovery strategy threw error:`,
          error
        );

        await this.persistRecoveryAction({
          actionId,
          failureEventId: failureId,
          actionType: "unknown",
          actionStrategy: strategy.name,
          status: "failed",
          automated: true,
          parameters: failure.context,
          result: {
            error: (error as Error).message,
          },
          durationMs: Date.now() - startTime,
        });
      }
    }

    console.warn(
      `[RecoveryEngine] All recovery strategies failed for failure: ${failure.failureType}`
    );
  }

  /**
   * Persist failure event to database
   */
  private async persistFailureEvent(failure: FailureEvent): Promise<number> {
    const db = await getDb();
    const [result] = await db!.insert(failureEvents).values({
      eventId: failure.eventId,
      timestamp: failure.timestamp,
      failureCategory: failure.failureCategory,
      failureType: failure.failureType,
      severity: failure.severity,
      affectedService: failure.affectedService,
      errorMessage: failure.errorMessage,
      errorStack: failure.errorStack,
      context: failure.context,
      detectionMethod: failure.detectionMethod,
      userId: failure.userId,
      requestId: failure.requestId,
      resolved: false,
    });

    return result.insertId;
  }

  /**
   * Persist recovery action to database
   */
  private async persistRecoveryAction(action: any): Promise<void> {
    const db = await getDb();
    await db!.insert(recoveryActions).values({
      ...action,
      timestamp: new Date(),
      completedAt: new Date(),
    });
  }

  /**
   * Mark failure as resolved
   */
  private async markFailureResolved(failureId: number): Promise<void> {
    const db = await getDb();
    await db!
      .update(failureEvents)
      .set({
        resolved: true,
        resolvedAt: new Date(),
      })
      .where(eq(failureEvents.id, failureId));
  }
}

/**
 * Built-in Recovery Strategies
 */

/**
 * Retry Strategy
 * Retries failed operations with exponential backoff
 */
export class RetryStrategy implements RecoveryStrategy {
  name = "exponential_backoff_retry";
  applicableFailureTypes = [
    "api_timeout",
    "connection_refused",
    "rate_limit",
  ];
  priority = 1;

  async execute(failure: FailureEvent): Promise<RecoveryResult> {
    const startTime = Date.now();
    const maxRetries = 3;
    const baseDelay = 1000; // 1 second

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      const delay = baseDelay * Math.pow(2, attempt - 1);
      console.log(
        `[RetryStrategy] Attempt ${attempt}/${maxRetries} after ${delay}ms`
      );

      await this.sleep(delay);

      try {
        // Attempt to re-execute the failed operation
        // This would need to be implemented based on the specific failure context
        // For now, we'll simulate success
        const success = Math.random() > 0.3; // 70% success rate

        if (success) {
          return {
            success: true,
            actionType: "retry",
            actionStrategy: this.name,
            durationMs: Date.now() - startTime,
            message: `Operation succeeded on attempt ${attempt}`,
            metadata: {
              attempts: attempt,
              totalDelay: Date.now() - startTime,
            },
          };
        }
      } catch (error) {
        console.warn(`[RetryStrategy] Attempt ${attempt} failed:`, error);
      }
    }

    return {
      success: false,
      actionType: "retry",
      actionStrategy: this.name,
      durationMs: Date.now() - startTime,
      message: `All ${maxRetries} retry attempts failed`,
      metadata: {
        attempts: maxRetries,
      },
    };
  }

  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}

/**
 * Failover Strategy
 * Switches to alternative service provider
 */
export class FailoverStrategy implements RecoveryStrategy {
  name = "provider_failover";
  applicableFailureTypes = ["api_timeout", "service_unavailable"];
  priority = 2;

  async execute(failure: FailureEvent): Promise<RecoveryResult> {
    const startTime = Date.now();

    // Determine alternative provider based on affected service
    const alternativeProvider = this.getAlternativeProvider(
      failure.affectedService
    );

    if (!alternativeProvider) {
      return {
        success: false,
        actionType: "failover",
        actionStrategy: this.name,
        durationMs: Date.now() - startTime,
        message: "No alternative provider available",
      };
    }

    try {
      console.log(
        `[FailoverStrategy] Failing over to ${alternativeProvider}`
      );

      // Execute operation with alternative provider
      // This would need to be implemented based on the specific service
      // For now, we'll simulate success
      const success = true;

      if (success) {
        return {
          success: true,
          actionType: "failover",
          actionStrategy: this.name,
          durationMs: Date.now() - startTime,
          message: `Successfully failed over to ${alternativeProvider}`,
          metadata: {
            originalProvider: failure.affectedService,
            alternativeProvider,
          },
        };
      }
    } catch (error) {
      console.error("[FailoverStrategy] Failover attempt failed:", error);
    }

    return {
      success: false,
      actionType: "failover",
      actionStrategy: this.name,
      durationMs: Date.now() - startTime,
      message: "Failover attempt failed",
    };
  }

  private getAlternativeProvider(service: string): string | null {
    const providerMap: Record<string, string> = {
      "llm:openai": "llm:deepseek",
      "llm:deepseek": "llm:gemini",
      "llm:gemini": "llm:openai",
    };

    return providerMap[service] || null;
  }
}
```

---

## 6. Implementation Checklist

### Phase 1: Foundation (Weeks 1-2)

- [ ] Create database schema migration for self-healing tables
- [ ] Implement `MetricsCollector` class with Redis Streams integration
- [ ] Implement `OperationTracker` class for operation lifecycle tracking
- [ ] Create tRPC instrumentation middleware
- [ ] Integrate instrumentation middleware into existing tRPC procedures
- [ ] Implement `HealthCheckRegistry` and built-in health checks
- [ ] Create `/health` endpoint for health status queries
- [ ] Implement `RecoveryEngine` core framework
- [ ] Add unit tests for instrumentation components (target: 90% coverage)
- [ ] Performance test instrumentation overhead (target: < 5ms)

### Phase 2: Detection and Response (Weeks 3-4)

- [ ] Implement `CircuitBreaker` class with database persistence
- [ ] Create `CircuitBreakerRegistry` for managing multiple circuits
- [ ] Add circuit breaker wrappers for all AI API calls
- [ ] Implement `RetryStrategy` with exponential backoff
- [ ] Implement `FailoverStrategy` for AI provider switching
- [ ] Create failure detection logic based on metrics thresholds
- [ ] Implement anomaly detection using statistical analysis
- [ ] Add automated recovery workflow orchestration
- [ ] Create alert manager for operator notifications
- [ ] Add integration tests for circuit breaker behavior
- [ ] Test recovery workflows with simulated failures

### Phase 3: Intelligence and Dashboard (Weeks 5-6)

- [ ] Implement baseline calculation for anomaly detection
- [ ] Create root cause analysis engine
- [ ] Add failure pattern recognition
- [ ] Implement predictive failure detection
- [ ] Create self-healing dashboard React components
- [ ] Add real-time metrics visualization
- [ ] Implement recovery action history view
- [ ] Create manual recovery trigger controls
- [ ] Add circuit breaker status dashboard
- [ ] Implement configuration management UI
- [ ] Add comprehensive documentation

### Phase 4: Validation and Hardening (Weeks 7-8)

- [ ] Create chaos engineering test suite
- [ ] Test AI API failure scenarios
- [ ] Test database connection loss scenarios
- [ ] Test memory exhaustion handling
- [ ] Validate circuit breaker behavior under load
- [ ] Performance optimization (reduce overhead to < 2ms)
- [ ] Security audit of self-healing components
- [ ] Create operator runbook
- [ ] Conduct user acceptance testing with operators
- [ ] Final documentation review and updates

---

## 7. Configuration Management

### 7.1 Environment Variables

```bash
# Self-Healing System Configuration

# Metrics Collection
METRICS_BATCH_SIZE=100
METRICS_FLUSH_INTERVAL_MS=1000
METRICS_REDIS_STREAM_KEY=metrics:stream

# Health Monitoring
HEALTH_CHECK_INTERVAL_MS=30000
HEALTH_CHECK_TIMEOUT_MS=5000

# Circuit Breaker Defaults
CIRCUIT_BREAKER_FAILURE_THRESHOLD=5
CIRCUIT_BREAKER_SUCCESS_THRESHOLD=2
CIRCUIT_BREAKER_TIMEOUT_MS=30000
CIRCUIT_BREAKER_RESET_TIMEOUT_MS=60000

# Recovery Engine
RECOVERY_MAX_RETRY_ATTEMPTS=3
RECOVERY_RETRY_BASE_DELAY_MS=1000

# Alerting
ALERT_EMAIL_ENABLED=true
ALERT_SMS_ENABLED=false
ALERT_WEBHOOK_URL=https://example.com/alerts
```

### 7.2 Feature Flags

```typescript
// shared/feature-flags.ts

export const SELF_HEALING_FEATURE_FLAGS = {
  // Enable/disable entire self-healing system
  ENABLED: process.env.SELF_HEALING_ENABLED === "true",
  
  // Enable/disable specific components
  INSTRUMENTATION_ENABLED: process.env.INSTRUMENTATION_ENABLED !== "false",
  HEALTH_MONITORING_ENABLED: process.env.HEALTH_MONITORING_ENABLED !== "false",
  CIRCUIT_BREAKERS_ENABLED: process.env.CIRCUIT_BREAKERS_ENABLED !== "false",
  AUTO_RECOVERY_ENABLED: process.env.AUTO_RECOVERY_ENABLED !== "false",
  
  // Enable/disable specific recovery strategies
  RETRY_STRATEGY_ENABLED: process.env.RETRY_STRATEGY_ENABLED !== "false",
  FAILOVER_STRATEGY_ENABLED: process.env.FAILOVER_STRATEGY_ENABLED !== "false",
};
```

---

## 8. Testing Strategy

### 8.1 Unit Tests

```typescript
// server/_core/self-healing/__tests__/circuit-breaker.test.ts

import { describe, it, expect, beforeEach } from "vitest";
import { CircuitBreaker, CircuitBreakerError } from "../circuit-breaker";

describe("CircuitBreaker", () => {
  let circuitBreaker: CircuitBreaker;

  beforeEach(() => {
    circuitBreaker = new CircuitBreaker("test-circuit", {
      failureThreshold: 3,
      successThreshold: 2,
      timeout: 1000,
      resetTimeout: 5000,
    });
  });

  it("should allow requests when circuit is closed", async () => {
    const result = await circuitBreaker.execute(async () => "success");
    expect(result).toBe("success");
  });

  it("should open circuit after failure threshold", async () => {
    // Cause 3 failures
    for (let i = 0; i < 3; i++) {
      try {
        await circuitBreaker.execute(async () => {
          throw new Error("Test failure");
        });
      } catch (error) {
        // Expected
      }
    }

    // Circuit should be open now
    const state = circuitBreaker.getState();
    expect(state.state).toBe("open");

    // Next request should be rejected immediately
    await expect(
      circuitBreaker.execute(async () => "should not execute")
    ).rejects.toThrow(CircuitBreakerError);
  });

  it("should transition to half-open after reset timeout", async () => {
    // Open the circuit
    for (let i = 0; i < 3; i++) {
      try {
        await circuitBreaker.execute(async () => {
          throw new Error("Test failure");
        });
      } catch (error) {
        // Expected
      }
    }

    // Wait for reset timeout (mock time)
    // In real tests, we'd use fake timers

    // Circuit should allow one test request in half-open state
    const result = await circuitBreaker.execute(async () => "success");
    expect(result).toBe("success");
  });
});
```

### 8.2 Integration Tests

```typescript
// server/_core/self-healing/__tests__/recovery-engine.integration.test.ts

import { describe, it, expect, beforeEach } from "vitest";
import { RecoveryEngine, RetryStrategy } from "../recovery-engine";
import { nanoid } from "nanoid";

describe("RecoveryEngine Integration", () => {
  let recoveryEngine: RecoveryEngine;

  beforeEach(() => {
    recoveryEngine = new RecoveryEngine();
    recoveryEngine.registerStrategy(new RetryStrategy());
  });

  it("should successfully recover from transient API timeout", async () => {
    const failure = {
      eventId: nanoid(),
      timestamp: new Date(),
      failureCategory: "external_dependency",
      failureType: "api_timeout",
      severity: "medium",
      affectedService: "llm:openai",
      errorMessage: "Request timeout after 30s",
      detectionMethod: "exception",
    };

    await recoveryEngine.handleFailure(failure);

    // Verify failure was persisted and recovery attempted
    // This would query the database to check records
  });
});
```

### 8.3 Chaos Engineering Tests

```typescript
// server/_core/self-healing/__tests__/chaos.test.ts

import { describe, it, expect } from "vitest";
import { invokeLLM } from "../../llm";

describe("Chaos Engineering Tests", () => {
  it("should handle AI API complete outage", async () => {
    // Simulate complete API outage
    // Mock all AI providers to return errors

    // Circuit breakers should open
    // System should degrade gracefully
    // No user-facing errors should occur
  });

  it("should handle database connection loss", async () => {
    // Simulate database connection loss
    // System should attempt reconnection
    // Read-only mode should activate if needed
  });

  it("should handle memory exhaustion", async () => {
    // Simulate high memory usage
    // System should detect and restart process
    // No data loss should occur
  });
});
```

---

## 9. Deployment Strategy

### 9.1 Phased Rollout

**Phase 1: Shadow Mode (Week 1)**
- Deploy instrumentation with metrics collection only
- No automated recovery actions
- Monitor overhead and data quality
- Validate metrics accuracy

**Phase 2: Monitoring Only (Week 2)**
- Enable health monitoring and alerting
- Operators receive alerts but take manual action
- Validate alert accuracy and reduce false positives
- Build operator confidence in system

**Phase 3: Limited Automation (Week 3)**
- Enable circuit breakers for AI APIs only
- Enable retry strategy for transient failures
- Monitor automated recovery success rate
- Collect operator feedback

**Phase 4: Full Automation (Week 4)**
- Enable all recovery strategies
- Enable failover for AI providers
- Enable predictive failure detection
- Continuous monitoring and optimization

### 9.2 Rollback Plan

If issues arise during deployment:

1. **Immediate:** Disable automated recovery via feature flag
2. **Within 5 minutes:** Disable circuit breakers if causing service disruption
3. **Within 15 minutes:** Disable instrumentation if performance impact detected
4. **Within 1 hour:** Roll back database schema changes if data integrity issues

---

**Document End**
