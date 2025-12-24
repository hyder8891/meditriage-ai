import { mysqlTable, int, varchar, decimal, timestamp, text, mysqlEnum } from "drizzle-orm/mysql-core";

/**
 * Budget tracking table - tracks AI API usage and costs
 * Enables cost monitoring, budget limits, and usage analytics
 */
export const budgetTracking = mysqlTable("budget_tracking", {
  id: int("id").autoincrement().primaryKey(),
  
  // User and session tracking
  userId: int("user_id").notNull(),
  sessionId: varchar("session_id", { length: 255 }), // Optional session identifier
  
  // Module/Feature tracking
  module: mysqlEnum("module", [
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
    "other"
  ]).notNull(),
  
  // API usage details
  apiProvider: varchar("api_provider", { length: 50 }).notNull(), // e.g., "openai", "gemini", "deepseek"
  model: varchar("model", { length: 100 }), // e.g., "gpt-4", "gemini-pro"
  operationType: varchar("operation_type", { length: 50 }), // e.g., "completion", "transcription", "image_gen"
  
  // Token/usage metrics
  inputTokens: int("input_tokens").default(0),
  outputTokens: int("output_tokens").default(0),
  totalTokens: int("total_tokens").default(0),
  
  // Cost tracking (in USD cents to avoid floating point issues)
  estimatedCostCents: int("estimated_cost_cents").default(0), // Cost in cents (1 USD = 100 cents)
  
  // Request metadata
  requestDuration: int("request_duration"), // in milliseconds
  statusCode: int("status_code"), // HTTP status code
  success: mysqlEnum("success", ["true", "false"]).default("true").notNull(),
  errorMessage: text("error_message"), // Error details if failed
  
  // Additional context
  metadata: text("metadata"), // JSON object for additional tracking data
  
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export type BudgetTracking = typeof budgetTracking.$inferSelect;
export type InsertBudgetTracking = typeof budgetTracking.$inferInsert;

/**
 * Budget limits table - defines spending limits per user/organization
 */
export const budgetLimits = mysqlTable("budget_limits", {
  id: int("id").autoincrement().primaryKey(),
  
  // Scope
  userId: int("user_id"), // null for global limits
  clinicId: int("clinic_id"), // null for individual user limits
  
  // Limit configuration
  limitType: mysqlEnum("limit_type", ["daily", "weekly", "monthly", "total"]).notNull(),
  limitAmountCents: int("limit_amount_cents").notNull(), // Limit in cents
  
  // Current usage
  currentUsageCents: int("current_usage_cents").default(0).notNull(),
  
  // Period tracking
  periodStart: timestamp("period_start").notNull(),
  periodEnd: timestamp("period_end").notNull(),
  
  // Alerts
  alertThresholdPercent: int("alert_threshold_percent").default(80), // Alert at 80% usage
  alertSent: mysqlEnum("alert_sent", ["true", "false"]).default("false").notNull(),
  
  // Status
  active: mysqlEnum("active", ["true", "false"]).default("true").notNull(),
  
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().onUpdateNow().notNull(),
});

export type BudgetLimit = typeof budgetLimits.$inferSelect;
export type InsertBudgetLimit = typeof budgetLimits.$inferInsert;
