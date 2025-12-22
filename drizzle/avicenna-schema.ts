import { mysqlTable, int, varchar, text, timestamp, decimal, boolean, json, mysqlEnum, index } from "drizzle-orm/mysql-core";

/**
 * Avicenna-X Orchestration System Schema
 * 
 * This schema implements the "Predictive Health Graph" architecture
 * that transforms MediTriage from a passive tool into an active health OS.
 */

// ============================================================================
// LAYER 1: Context Vector System
// ============================================================================

/**
 * Patient context vectors - stores weighted embeddings of patient state
 * Combines: symptoms + history + vitals + environment + social determinants
 */
export const patientContextVectors = mysqlTable("patient_context_vectors", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("user_id").notNull(),
  
  // Vector embedding (stored as JSON array for now, will migrate to pgvector/TiDB Vector later)
  vectorEmbedding: json("vector_embedding").$type<number[]>(),
  
  // Context components (weighted inputs)
  symptomSeverity: decimal("symptom_severity", { precision: 3, scale: 1 }), // 0.0 - 10.0
  medicalHistorySummary: text("medical_history_summary"),
  environmentalFactors: json("environmental_factors").$type<{
    barometricPressure?: number;
    temperature?: number;
    humidity?: number;
    airQuality?: string;
    location?: { city: string; lat: number; lng: number };
  }>(),
  financialConstraints: json("financial_constraints").$type<{
    budgetFilterClicked?: boolean;
    selectedPriceRange?: string;
    insuranceStatus?: string;
  }>(),
  wearableData: json("wearable_data").$type<{
    heartRate?: number;
    heartRateVariability?: number;
    steps?: number;
    sleepHours?: number;
    oxygenSaturation?: number;
  }>(),
  
  // Metadata
  contextType: varchar("context_type", { length: 50 }).notNull(), // "triage", "consultation", "followup"
  confidenceScore: decimal("confidence_score", { precision: 5, scale: 2 }), // 0.00 - 100.00
  
  createdAt: timestamp("created_at").defaultNow().notNull(),
  expiresAt: timestamp("expires_at"), // Context vectors expire after 24 hours
}, (table) => ({
  userIdIdx: index("user_id_idx").on(table.userId),
  createdAtIdx: index("created_at_idx").on(table.createdAt),
}));

export type PatientContextVector = typeof patientContextVectors.$inferSelect;
export type InsertPatientContextVector = typeof patientContextVectors.$inferInsert;

// ============================================================================
// LAYER 2: Neuro-Symbolic Triage Engine
// ============================================================================

/**
 * Medical guardrails - hard rules that bypass AI for emergencies
 */
export const medicalGuardrails = mysqlTable("medical_guardrails", {
  id: int("id").autoincrement().primaryKey(),
  
  // Rule definition
  ruleName: varchar("rule_name", { length: 255 }).notNull().unique(),
  ruleDescription: text("rule_description").notNull(),
  ruleType: mysqlEnum("rule_type", ["emergency", "critical", "warning"]).notNull(),
  
  // Condition (stored as JSON for flexibility)
  condition: json("condition").$type<{
    vitalSign?: string;
    operator?: ">" | "<" | "=" | ">=" | "<=";
    threshold?: number;
    symptomKeywords?: string[];
    logicalOperator?: "AND" | "OR";
  }>().notNull(),
  
  // Action
  action: json("action").$type<{
    urgencyLevel: "emergency" | "urgent" | "semi-urgent";
    bypassAI: boolean;
    immediateAction?: string;
    alertMessage?: string;
  }>().notNull(),
  
  // Metadata
  priority: int("priority").notNull().default(0), // Higher = checked first
  isActive: boolean("is_active").notNull().default(true),
  timesTriggered: int("times_triggered").notNull().default(0),
  
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().onUpdateNow().notNull(),
}, (table) => ({
  priorityIdx: index("priority_idx").on(table.priority),
  isActiveIdx: index("is_active_idx").on(table.isActive),
}));

export type MedicalGuardrail = typeof medicalGuardrails.$inferSelect;
export type InsertMedicalGuardrail = typeof medicalGuardrails.$inferInsert;

/**
 * Medical reasoning prompts - versioned system prompts stored in DB
 * Enables AEC to patch AI reasoning without code deployment
 */
export const medicalReasoningPrompts = mysqlTable("medical_reasoning_prompts", {
  id: int("id").autoincrement().primaryKey(),
  
  // Prompt identification
  promptName: varchar("prompt_name", { length: 255 }).notNull(),
  promptVersion: int("prompt_version").notNull(),
  
  // Prompt content
  systemPrompt: text("system_prompt").notNull(),
  userPromptTemplate: text("user_prompt_template").notNull(),
  
  // Configuration
  temperature: decimal("temperature", { precision: 3, scale: 2 }).notNull().default("0.7"),
  maxTokens: int("max_tokens").notNull().default(2000),
  
  // Performance tracking
  usageCount: int("usage_count").notNull().default(0),
  avgConfidenceScore: decimal("avg_confidence_score", { precision: 5, scale: 2 }),
  accuracyRate: decimal("accuracy_rate", { precision: 5, scale: 2 }),
  
  // Metadata
  isActive: boolean("is_active").notNull().default(false),
  activatedAt: timestamp("activated_at"),
  deactivatedAt: timestamp("deactivated_at"),
  
  createdAt: timestamp("created_at").defaultNow().notNull(),
  createdBy: varchar("created_by", { length: 50 }).notNull(), // "human" or "aec"
}, (table) => ({
  promptNameVersionIdx: index("prompt_name_version_idx").on(table.promptName, table.promptVersion),
  isActiveIdx: index("is_active_idx").on(table.isActive),
}));

export type MedicalReasoningPrompt = typeof medicalReasoningPrompts.$inferSelect;
export type InsertMedicalReasoningPrompt = typeof medicalReasoningPrompts.$inferInsert;

// ============================================================================
// LAYER 3: Resource Auction Algorithm
// ============================================================================

/**
 * Doctor performance metrics - tracks connection quality and diagnosis accuracy
 */
export const doctorPerformance = mysqlTable("doctor_performance", {
  id: int("id").autoincrement().primaryKey(),
  doctorId: int("doctor_id").notNull().unique(),
  
  // Specialty matching
  specialty: varchar("specialty", { length: 100 }),
  subSpecialties: json("sub_specialties").$type<string[]>(),
  
  // Performance metrics
  diagnosisAccuracyRate: decimal("diagnosis_accuracy_rate", { precision: 5, scale: 2 }).notNull().default("0.00"), // 0.00 - 100.00
  connectionQualityScore: decimal("connection_quality_score", { precision: 5, scale: 2 }).notNull().default("0.00"), // 0.00 - 100.00
  avgResponseTime: int("avg_response_time").notNull().default(0), // seconds
  patientSatisfactionScore: decimal("patient_satisfaction_score", { precision: 5, scale: 2 }).notNull().default("0.00"), // 0.00 - 5.00
  
  // Connection stability tracking
  totalSessions: int("total_sessions").notNull().default(0),
  successfulSessions: int("successful_sessions").notNull().default(0),
  droppedConnections: int("dropped_connections").notNull().default(0),
  avgLatency: int("avg_latency").notNull().default(0), // milliseconds
  
  // Time-based patterns (e.g., "Dr. Ali better on weekdays")
  performanceByDayOfWeek: json("performance_by_day_of_week").$type<{
    monday?: number;
    tuesday?: number;
    wednesday?: number;
    thursday?: number;
    friday?: number;
    saturday?: number;
    sunday?: number;
  }>(),
  performanceByTimeOfDay: json("performance_by_time_of_day").$type<{
    morning?: number;   // 6am-12pm
    afternoon?: number; // 12pm-6pm
    evening?: number;   // 6pm-12am
    night?: number;     // 12am-6am
  }>(),
  
  // Last updated
  lastCalculated: timestamp("last_calculated").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().onUpdateNow().notNull(),
}, (table) => ({
  doctorIdIdx: index("doctor_id_idx").on(table.doctorId),
  connectionQualityIdx: index("connection_quality_idx").on(table.connectionQualityScore),
}));

export type DoctorPerformance = typeof doctorPerformance.$inferSelect;
export type InsertDoctorPerformance = typeof doctorPerformance.$inferInsert;

/**
 * Clinic resources - tracks equipment availability and network quality
 */
export const clinicResources = mysqlTable("clinic_resources", {
  id: int("id").autoincrement().primaryKey(),
  clinicId: int("clinic_id").notNull(),
  
  // Equipment tracking
  equipmentType: varchar("equipment_type", { length: 100 }).notNull(), // "xray", "mri", "ct", "ultrasound", "ecg"
  isAvailable: boolean("is_available").notNull().default(true),
  maintenanceScheduled: timestamp("maintenance_scheduled"),
  
  // Network quality
  networkQuality: mysqlEnum("network_quality", ["excellent", "good", "fair", "poor"]).notNull().default("good"),
  avgDownloadSpeed: decimal("avg_download_speed", { precision: 10, scale: 2 }), // Mbps
  avgUploadSpeed: decimal("avg_upload_speed", { precision: 10, scale: 2 }), // Mbps
  avgLatency: int("avg_latency"), // milliseconds
  
  // Operating hours
  operatingHours: json("operating_hours").$type<{
    monday?: { open: string; close: string };
    tuesday?: { open: string; close: string };
    wednesday?: { open: string; close: string };
    thursday?: { open: string; close: string };
    friday?: { open: string; close: string };
    saturday?: { open: string; close: string };
    sunday?: { open: string; close: string };
  }>(),
  isOpen: boolean("is_open").notNull().default(true),
  
  // Last checked
  lastChecked: timestamp("last_checked").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().onUpdateNow().notNull(),
}, (table) => ({
  clinicIdIdx: index("clinic_id_idx").on(table.clinicId),
  equipmentTypeIdx: index("equipment_type_idx").on(table.equipmentType),
  isAvailableIdx: index("is_available_idx").on(table.isAvailable),
}));

export type ClinicResource = typeof clinicResources.$inferSelect;
export type InsertClinicResource = typeof clinicResources.$inferInsert;

// ============================================================================
// LAYER 4: Epidemiology Tracking System
// ============================================================================

/**
 * Disease heatmap - tracks disease spikes by city for predictive triage
 */
export const diseaseHeatmap = mysqlTable("disease_heatmap", {
  id: int("id").autoincrement().primaryKey(),
  
  // Location
  city: varchar("city", { length: 100 }).notNull(),
  region: varchar("region", { length: 100 }),
  country: varchar("country", { length: 100 }).notNull().default("Iraq"),
  
  // Disease tracking
  diseaseName: varchar("disease_name", { length: 255 }).notNull(),
  diseaseCategory: varchar("disease_category", { length: 100 }), // "infectious", "chronic", "seasonal"
  
  // Statistics
  caseCount: int("case_count").notNull().default(0),
  severityAvg: decimal("severity_avg", { precision: 3, scale: 1 }), // 0.0 - 10.0
  growthRate: decimal("growth_rate", { precision: 5, scale: 2 }), // percentage change from previous period
  
  // Time window
  timeWindow: varchar("time_window", { length: 50 }).notNull(), // "hourly", "daily", "weekly"
  windowStart: timestamp("window_start").notNull(),
  windowEnd: timestamp("window_end").notNull(),
  
  // Risk assessment
  riskLevel: mysqlEnum("risk_level", ["low", "moderate", "high", "critical"]).notNull().default("low"),
  isOutbreak: boolean("is_outbreak").notNull().default(false),
  
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => ({
  cityDiseaseIdx: index("city_disease_idx").on(table.city, table.diseaseName),
  windowStartIdx: index("window_start_idx").on(table.windowStart),
  riskLevelIdx: index("risk_level_idx").on(table.riskLevel),
}));

export type DiseaseHeatmap = typeof diseaseHeatmap.$inferSelect;
export type InsertDiseaseHeatmap = typeof diseaseHeatmap.$inferInsert;

/**
 * Anonymized symptom reports - aggregated for epidemiology tracking
 */
export const anonymizedSymptomReports = mysqlTable("anonymized_symptom_reports", {
  id: int("id").autoincrement().primaryKey(),
  
  // Location (anonymized to city level)
  city: varchar("city", { length: 100 }).notNull(),
  region: varchar("region", { length: 100 }),
  
  // Symptom data
  symptomKeywords: json("symptom_keywords").$type<string[]>().notNull(),
  severityLevel: int("severity_level").notNull(), // 1-10
  urgencyLevel: varchar("urgency_level", { length: 50 }).notNull(),
  
  // Demographics (aggregated, not individual)
  ageGroup: varchar("age_group", { length: 20 }), // "0-10", "11-20", "21-30", etc.
  gender: varchar("gender", { length: 20 }),
  
  // Temporal data
  reportedAt: timestamp("reported_at").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => ({
  cityReportedAtIdx: index("city_reported_at_idx").on(table.city, table.reportedAt),
  urgencyLevelIdx: index("urgency_level_idx").on(table.urgencyLevel),
}));

export type AnonymizedSymptomReport = typeof anonymizedSymptomReports.$inferSelect;
export type InsertAnonymizedSymptomReport = typeof anonymizedSymptomReports.$inferInsert;

// ============================================================================
// LAYER 5: Medical AEC (Self-Correcting AI via RLHF)
// ============================================================================

/**
 * Medical corrections - captures AI vs doctor diagnosis deltas for RLHF
 */
export const medicalCorrections = mysqlTable("medical_corrections", {
  id: int("id").autoincrement().primaryKey(),
  
  // Participants
  userId: int("user_id").notNull(),
  doctorId: int("doctor_id").notNull(),
  triageRecordId: int("triage_record_id"),
  
  // Diagnosis comparison
  aiDiagnosis: json("ai_diagnosis").$type<{
    primaryDiagnosis: string;
    confidence: number;
    differentialDiagnoses?: string[];
  }>().notNull(),
  doctorDiagnosis: json("doctor_diagnosis").$type<{
    primaryDiagnosis: string;
    confidence: number;
    differentialDiagnoses?: string[];
  }>().notNull(),
  
  // Correction analysis
  correctionType: mysqlEnum("correction_type", [
    "completely_wrong",
    "missed_diagnosis",
    "incorrect_ranking",
    "severity_mismatch",
    "correct_but_imprecise"
  ]).notNull(),
  severityDelta: int("severity_delta"), // How much more/less severe than AI predicted
  
  // Feedback
  doctorFeedback: text("doctor_feedback"),
  patientOutcome: text("patient_outcome"),
  
  // Prompt patching
  promptPatchApplied: boolean("prompt_patch_applied").notNull().default(false),
  patchedPromptId: int("patched_prompt_id"),
  patchDescription: text("patch_description"),
  
  // Metadata
  createdAt: timestamp("created_at").defaultNow().notNull(),
  reviewedAt: timestamp("reviewed_at"),
  reviewedBy: int("reviewed_by"), // admin user id
}, (table) => ({
  doctorIdIdx: index("doctor_id_idx").on(table.doctorId),
  correctionTypeIdx: index("correction_type_idx").on(table.correctionType),
  promptPatchAppliedIdx: index("prompt_patch_applied_idx").on(table.promptPatchApplied),
}));

export type MedicalCorrection = typeof medicalCorrections.$inferSelect;
export type InsertMedicalCorrection = typeof medicalCorrections.$inferInsert;

/**
 * RLHF training data - structured examples for continuous AI improvement
 */
export const rlhfTrainingData = mysqlTable("rlhf_training_data", {
  id: int("id").autoincrement().primaryKey(),
  
  // Source
  correctionId: int("correction_id").notNull(),
  
  // Training example
  inputContext: json("input_context").$type<{
    symptoms: string[];
    vitals?: any;
    history?: string;
    demographics?: any;
  }>().notNull(),
  expectedOutput: json("expected_output").$type<{
    diagnosis: string;
    confidence: number;
    reasoning: string[];
  }>().notNull(),
  
  // Quality metrics
  qualityScore: decimal("quality_score", { precision: 5, scale: 2 }).notNull(), // 0.00 - 100.00
  usedInTraining: boolean("used_in_training").notNull().default(false),
  trainingRound: int("training_round"),
  
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => ({
  correctionIdIdx: index("correction_id_idx").on(table.correctionId),
  usedInTrainingIdx: index("used_in_training_idx").on(table.usedInTraining),
}));

export type RLHFTrainingData = typeof rlhfTrainingData.$inferSelect;
export type InsertRLHFTrainingData = typeof rlhfTrainingData.$inferInsert;

// ============================================================================
// LAYER 6: Orchestration Logs
// ============================================================================

/**
 * Orchestration logs - tracks every execution of the Avicenna-X loop
 */
export const orchestrationLogs = mysqlTable("orchestration_logs", {
  id: int("id").autoincrement().primaryKey(),
  
  // Request
  userId: int("user_id").notNull(),
  sessionId: varchar("session_id", { length: 255 }).notNull(),
  
  // Execution phases
  contextGatheringMs: int("context_gathering_ms"),
  epidemiologyCheckMs: int("epidemiology_check_ms"),
  hybridDiagnosisMs: int("hybrid_diagnosis_ms"),
  resourceOrchestrationMs: int("resource_orchestration_ms"),
  totalExecutionMs: int("total_execution_ms"),
  
  // Results
  actionTaken: varchar("action_taken", { length: 100 }).notNull(), // "NAVIGATE_TO_CLINIC", "CONNECT_SOCKET", "EMERGENCY_BYPASS"
  targetResourceId: int("target_resource_id"),
  targetResourceType: varchar("target_resource_type", { length: 50 }), // "doctor", "clinic", "emergency"
  
  // Context snapshot
  contextSnapshot: json("context_snapshot").$type<{
    symptomSeverity?: number;
    localRisks?: string[];
    guardrailsTriggered?: string[];
    resourceScore?: number;
  }>(),
  
  // Metadata
  success: boolean("success").notNull().default(true),
  errorMessage: text("error_message"),
  
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => ({
  userIdIdx: index("user_id_idx").on(table.userId),
  sessionIdIdx: index("session_id_idx").on(table.sessionId),
  createdAtIdx: index("created_at_idx").on(table.createdAt),
}));

export type OrchestrationLog = typeof orchestrationLogs.$inferSelect;
export type InsertOrchestrationLog = typeof orchestrationLogs.$inferInsert;
