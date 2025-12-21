/**
 * Lab Result Interpretation System - Database Schema
 * 
 * This schema supports comprehensive lab result management:
 * - Upload and store lab reports
 * - Extract and parse individual test results
 * - Store reference ranges for different demographics
 * - Track trends over time
 * - Generate interpretations and recommendations
 */

import { mysqlTable, int, varchar, text, timestamp, decimal, boolean } from "drizzle-orm/mysql-core";

/**
 * Lab Reports - Uploaded lab report documents
 */
export const labReports = mysqlTable("lab_reports", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("user_id").notNull(), // Patient who owns this report
  
  // Report metadata
  reportDate: timestamp("report_date").notNull(), // Date lab work was done
  uploadDate: timestamp("upload_date").defaultNow().notNull(),
  reportName: varchar("report_name", { length: 255 }), // e.g., "Annual Physical Labs"
  labName: varchar("lab_name", { length: 255 }), // Laboratory that performed tests
  orderingPhysician: varchar("ordering_physician", { length: 255 }),
  
  // File storage
  fileUrl: text("file_url").notNull(), // S3 URL to original file
  fileType: varchar("file_type", { length: 50 }), // pdf, jpg, png, etc.
  fileSize: int("file_size"), // in bytes
  
  // OCR and extraction
  ocrText: text("ocr_text"), // Raw extracted text
  extractionStatus: varchar("extraction_status", { length: 50 }).default("pending"), // pending, processing, completed, failed
  extractionError: text("extraction_error"),
  
  // AI interpretation
  overallInterpretation: text("overall_interpretation"), // AI summary of all results
  riskLevel: varchar("risk_level", { length: 20 }), // low, moderate, high, critical
  recommendedActions: text("recommended_actions"), // JSON array of recommendations
  
  // Status
  status: varchar("status", { length: 50 }).default("uploaded"), // uploaded, processed, reviewed
  reviewedBy: int("reviewed_by"), // Clinician who reviewed
  reviewedAt: timestamp("reviewed_at"),
  
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().onUpdateNow().notNull(),
});

/**
 * Lab Results - Individual test results extracted from reports
 */
export const labResults = mysqlTable("lab_results", {
  id: int("id").autoincrement().primaryKey(),
  reportId: int("report_id").notNull(), // Foreign key to lab_reports
  userId: int("user_id").notNull(), // Denormalized for easy querying
  
  // Test identification
  testName: varchar("test_name", { length: 255 }).notNull(), // e.g., "Hemoglobin"
  testCode: varchar("test_code", { length: 100 }), // e.g., "HGB", "LOINC code"
  testCategory: varchar("test_category", { length: 100 }), // CBC, Metabolic Panel, Lipid Panel, etc.
  
  // Result value
  value: varchar("value", { length: 100 }).notNull(), // Stored as string to handle various formats
  numericValue: decimal("numeric_value", { precision: 10, scale: 3 }), // Parsed numeric value if applicable
  unit: varchar("unit", { length: 50 }), // mg/dL, mmol/L, etc.
  
  // Reference range
  referenceRangeMin: decimal("reference_range_min", { precision: 10, scale: 3 }),
  referenceRangeMax: decimal("reference_range_max", { precision: 10, scale: 3 }),
  referenceRangeText: varchar("reference_range_text", { length: 255 }), // e.g., "3.5-5.5 mg/dL"
  
  // Status and flags
  status: varchar("status", { length: 20 }).notNull(), // normal, high, low, critical_high, critical_low
  abnormalFlag: boolean("abnormal_flag").default(false),
  criticalFlag: boolean("critical_flag").default(false),
  
  // AI interpretation
  interpretation: text("interpretation"), // Patient-friendly explanation
  clinicalSignificance: text("clinical_significance"), // Medical significance
  possibleCauses: text("possible_causes"), // JSON array of possible causes if abnormal
  recommendedFollowUp: text("recommended_follow_up"),
  
  // Metadata
  testDate: timestamp("test_date").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().onUpdateNow().notNull(),
});

/**
 * Lab Reference Ranges - Standard reference ranges for different demographics
 */
export const labReferenceRanges = mysqlTable("lab_reference_ranges", {
  id: int("id").autoincrement().primaryKey(),
  
  // Test identification
  testName: varchar("test_name", { length: 255 }).notNull(),
  testCode: varchar("test_code", { length: 100 }),
  testCategory: varchar("test_category", { length: 100 }),
  
  // Demographics
  ageMin: int("age_min"), // Minimum age for this range (null = no minimum)
  ageMax: int("age_max"), // Maximum age for this range (null = no maximum)
  gender: varchar("gender", { length: 20 }), // male, female, all
  
  // Reference range
  referenceMin: decimal("reference_min", { precision: 10, scale: 3 }),
  referenceMax: decimal("reference_max", { precision: 10, scale: 3 }),
  unit: varchar("unit", { length: 50 }).notNull(),
  
  // Critical values
  criticalLow: decimal("critical_low", { precision: 10, scale: 3 }),
  criticalHigh: decimal("critical_high", { precision: 10, scale: 3 }),
  
  // Additional info
  description: text("description"),
  clinicalContext: text("clinical_context"),
  
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().onUpdateNow().notNull(),
});

/**
 * Lab Trends - Track changes in lab values over time
 */
export const labTrends = mysqlTable("lab_trends", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("user_id").notNull(),
  testName: varchar("test_name", { length: 255 }).notNull(),
  
  // Trend analysis
  trendDirection: varchar("trend_direction", { length: 20 }), // improving, worsening, stable, fluctuating
  percentChange: decimal("percent_change", { precision: 10, scale: 2 }),
  timeSpan: int("time_span"), // Days between first and last measurement
  measurementCount: int("measurement_count"), // Number of measurements in trend
  
  // Values
  firstValue: decimal("first_value", { precision: 10, scale: 3 }),
  lastValue: decimal("last_value", { precision: 10, scale: 3 }),
  minValue: decimal("min_value", { precision: 10, scale: 3 }),
  maxValue: decimal("max_value", { precision: 10, scale: 3 }),
  avgValue: decimal("avg_value", { precision: 10, scale: 3 }),
  
  // Dates
  firstDate: timestamp("first_date"),
  lastDate: timestamp("last_date"),
  
  // AI insights
  trendInterpretation: text("trend_interpretation"),
  
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().onUpdateNow().notNull(),
});

// Type exports for TypeScript
export type LabReport = typeof labReports.$inferSelect;
export type InsertLabReport = typeof labReports.$inferInsert;

export type LabResult = typeof labResults.$inferSelect;
export type InsertLabResult = typeof labResults.$inferInsert;

export type LabReferenceRange = typeof labReferenceRanges.$inferSelect;
export type InsertLabReferenceRange = typeof labReferenceRanges.$inferInsert;

export type LabTrend = typeof labTrends.$inferSelect;
export type InsertLabTrend = typeof labTrends.$inferInsert;
