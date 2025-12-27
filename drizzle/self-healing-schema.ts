/**
 * Self-Healing System Database Schema
 * Tracks failures, recovery actions, and system health metrics
 */

import { mysqlTable, varchar, text, int, bigint, boolean, timestamp, json, index } from "drizzle-orm/mysql-core";
import { sql } from "drizzle-orm";

/**
 * System Health Metrics
 * Stores aggregated health metrics for monitoring and analysis
 */
export const systemHealthMetrics = mysqlTable(
  "system_health_metrics",
  {
    id: bigint("id", { mode: "number" }).primaryKey().autoincrement(),
    timestamp: timestamp("timestamp").notNull().defaultNow(),
    metricType: varchar("metric_type", { length: 100 }).notNull(), // 'cpu', 'memory', 'latency', 'error_rate', etc.
    metricName: varchar("metric_name", { length: 255 }).notNull(), // Specific metric identifier
    value: bigint("value", { mode: "number" }).notNull(),
    unit: varchar("unit", { length: 50 }).notNull(), // 'percent', 'ms', 'count', 'bytes', etc.
    tags: json("tags").$type<Record<string, string>>(), // Additional context
    source: varchar("source", { length: 255 }).notNull(), // Service/module that generated the metric
    createdAt: timestamp("created_at").notNull().defaultNow(),
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
export const failureEvents = mysqlTable(
  "failure_events",
  {
    id: bigint("id", { mode: "number" }).primaryKey().autoincrement(),
    eventId: varchar("event_id", { length: 100 }).notNull().unique(), // UUID for correlation
    timestamp: timestamp("timestamp").notNull().defaultNow(),
    failureCategory: varchar("failure_category", { length: 100 }).notNull(), // 'external_dependency', 'internal_service', etc.
    failureType: varchar("failure_type", { length: 100 }).notNull(), // 'api_timeout', 'database_connection', etc.
    severity: varchar("severity", { length: 50 }).notNull(), // 'low', 'medium', 'high', 'critical'
    affectedService: varchar("affected_service", { length: 255 }).notNull(),
    errorMessage: text("error_message"),
    errorStack: text("error_stack"),
    context: json("context").$type<Record<string, any>>(),
    detectionMethod: varchar("detection_method", { length: 100 }).notNull(), // 'threshold', 'anomaly', 'exception', etc.
    userId: varchar("user_id", { length: 255 }), // If failure affected specific user
    requestId: varchar("request_id", { length: 255 }), // Correlation with orchestration logs
    resolved: boolean("resolved").notNull().default(false),
    resolvedAt: timestamp("resolved_at"),
    createdAt: timestamp("created_at").notNull().defaultNow(),
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
export const recoveryActions = mysqlTable(
  "recovery_actions",
  {
    id: bigint("id", { mode: "number" }).primaryKey().autoincrement(),
    actionId: varchar("action_id", { length: 100 }).notNull().unique(), // UUID
    failureEventId: bigint("failure_event_id", { mode: "number" })
      .notNull()
      .references(() => failureEvents.id),
    timestamp: timestamp("timestamp").notNull().defaultNow(),
    actionType: varchar("action_type", { length: 100 }).notNull(), // 'retry', 'failover', 'restart', 'circuit_break', etc.
    actionStrategy: varchar("action_strategy", { length: 255 }).notNull(), // Specific strategy used
    status: varchar("status", { length: 50 }).notNull(), // 'initiated', 'in_progress', 'succeeded', 'failed', 'rolled_back'
    automated: boolean("automated").notNull(),
    triggeredBy: varchar("triggered_by", { length: 255 }), // User ID if manual, 'system' if automated
    parameters: json("parameters").$type<Record<string, any>>(),
    result: json("result").$type<Record<string, any>>(),
    durationMs: int("duration_ms"),
    completedAt: timestamp("completed_at"),
    createdAt: timestamp("created_at").notNull().defaultNow(),
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
export const circuitBreakerStates = mysqlTable(
  "circuit_breaker_states",
  {
    id: bigint("id", { mode: "number" }).primaryKey().autoincrement(),
    circuitName: varchar("circuit_name", { length: 255 }).notNull().unique(), // Unique identifier for circuit
    state: varchar("state", { length: 50 }).notNull(), // 'closed', 'open', 'half_open'
    failureCount: int("failure_count").notNull().default(0),
    successCount: int("success_count").notNull().default(0),
    lastFailureAt: timestamp("last_failure_at"),
    lastSuccessAt: timestamp("last_success_at"),
    openedAt: timestamp("opened_at"),
    nextRetryAt: timestamp("next_retry_at"),
    configuration: json("configuration").$type<{
      failureThreshold: number;
      successThreshold: number;
      timeout: number;
      resetTimeout: number;
    }>(),
    updatedAt: timestamp("updated_at").notNull().defaultNow().onUpdateNow(),
    createdAt: timestamp("created_at").notNull().defaultNow(),
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
export const systemHealthBaselines = mysqlTable(
  "system_health_baselines",
  {
    id: bigint("id", { mode: "number" }).primaryKey().autoincrement(),
    metricType: varchar("metric_type", { length: 100 }).notNull(),
    metricName: varchar("metric_name", { length: 255 }).notNull(),
    source: varchar("source", { length: 255 }).notNull(),
    timeWindow: varchar("time_window", { length: 50 }).notNull(), // '1h', '24h', '7d', etc.
    mean: bigint("mean", { mode: "number" }).notNull(),
    median: bigint("median", { mode: "number" }).notNull(),
    stdDev: bigint("std_dev", { mode: "number" }).notNull(),
    p50: bigint("p50", { mode: "number" }).notNull(),
    p95: bigint("p95", { mode: "number" }).notNull(),
    p99: bigint("p99", { mode: "number" }).notNull(),
    min: bigint("min", { mode: "number" }).notNull(),
    max: bigint("max", { mode: "number" }).notNull(),
    sampleCount: int("sample_count").notNull(),
    calculatedAt: timestamp("calculated_at").notNull(),
    validUntil: timestamp("valid_until").notNull(),
    createdAt: timestamp("created_at").notNull().defaultNow(),
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
