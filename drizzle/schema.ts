import { int, mysqlEnum, mysqlTable, text, timestamp, varchar, boolean, json, date, decimal, time, float } from "drizzle-orm/mysql-core";
import { relations } from "drizzle-orm";

/**
 * Core user table backing auth flow.
 */
export const users = mysqlTable("users", {
  id: int("id").autoincrement().primaryKey(),
  openId: varchar("openId", { length: 64 }).unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }).unique(),
  passwordHash: varchar("password_hash", { length: 255 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  
  // Phone authentication
  phoneNumber: varchar("phone_number", { length: 20 }).unique(),
  phoneVerified: boolean("phone_verified").default(false).notNull(),
  countryCode: varchar("country_code", { length: 5 }).default("+964"), // Iraq default
  role: mysqlEnum("role", ["patient", "doctor", "nurse", "clinic_admin", "super_admin", "admin", "clinician"]).default("patient").notNull(),
  
  // Clinic association
  clinicId: int("clinic_id"), // null for patients not linked to clinic, or super_admins
  
  // Clinician-specific fields
  licenseNumber: varchar("license_number", { length: 100 }),
  specialty: varchar("specialty", { length: 100 }),
  verified: boolean("verified").default(false).notNull(),
  
  // Doctor verification status (document-based verification)
  verificationStatus: mysqlEnum("verification_status", ["unverified", "pending_documents", "pending_review", "verified", "rejected"]).default("unverified"),
  adminVerified: boolean("admin_verified").default(false).notNull(), // Admin bypass flag
  adminVerifiedBy: int("admin_verified_by"), // Admin who manually verified
  adminVerifiedAt: timestamp("admin_verified_at"),
  documentsSubmittedAt: timestamp("documents_submitted_at"),
  autoVerifiedAt: timestamp("auto_verified_at"), // When auto-verification passed
  
  // Doctor availability status (for B2B2C platform)
  availabilityStatus: mysqlEnum("availability_status", ["available", "busy", "offline"]).default("offline"),
  currentPatientCount: int("current_patient_count").default(0), // Number of patients in queue
  maxPatientsPerDay: int("max_patients_per_day").default(50), // Daily limit
  lastStatusChange: timestamp("last_status_change"),
  autoOfflineMinutes: int("auto_offline_minutes").default(15), // Auto-offline after inactivity
  
  // Patient medical profile fields (for BRAIN diagnostic accuracy)
  dateOfBirth: date("date_of_birth"),
  gender: mysqlEnum("gender", ["male", "female", "other", "prefer_not_to_say"]),
  bloodType: varchar("blood_type", { length: 10 }),
  height: int("height"), // in cm
  weight: decimal("weight", { precision: 5, scale: 2 }), // in kg
  chronicConditions: text("chronic_conditions"), // JSON array of conditions
  allergies: text("allergies"), // JSON array of allergies
  currentMedications: text("current_medications"), // JSON array of medications
  medicalHistory: text("medical_history"), // JSON object with detailed history
  emergencyContact: varchar("emergency_contact", { length: 20 }),
  emergencyContactName: varchar("emergency_contact_name", { length: 255 }),
  
  // Email verification
  emailVerified: boolean("email_verified").default(false).notNull(),
  verificationToken: varchar("verification_token", { length: 255 }),
  verificationTokenExpiry: timestamp("verification_token_expiry"),
  
  // Password reset
  resetToken: varchar("reset_token", { length: 255 }),
  resetTokenExpiry: timestamp("reset_token_expiry"),
  
  // Token version for immediate JWT revocation
  // Increment this when password changes or logout-all-devices is triggered
  tokenVersion: int("token_version").default(0).notNull(),
  
  // Onboarding tour tracking
  onboardingCompleted: boolean("onboarding_completed").default(false).notNull(),
  onboardingCompletedAt: timestamp("onboarding_completed_at"),
  onboardingSkipped: boolean("onboarding_skipped").default(false).notNull(),
  
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

/**
 * Triage records - stores complete triage sessions
 */
export const triageRecords = mysqlTable("triage_records", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("user_id").notNull(),
  language: varchar("language", { length: 10 }).notNull().default("en"),
  
  // Conversation data
  conversationHistory: text("conversation_history").notNull(), // JSON stringified
  
  // Final assessment
  urgencyLevel: varchar("urgency_level", { length: 50 }).notNull(),
  chiefComplaint: text("chief_complaint").notNull(),
  symptoms: text("symptoms").notNull(), // JSON array
  assessment: text("assessment").notNull(),
  recommendations: text("recommendations").notNull(),
  redFlags: text("red_flags"), // JSON array
  
  // Metadata
  duration: int("duration"), // in seconds
  messageCount: int("message_count").notNull().default(0),
  
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().onUpdateNow().notNull(),
});

export type TriageRecord = typeof triageRecords.$inferSelect;
export type InsertTriageRecord = typeof triageRecords.$inferInsert;

/**
 * Medical documents - stores uploaded files (lab results, imaging, etc.)
 */
export const medicalDocuments = mysqlTable("medical_documents", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("user_id").notNull(),
  triageRecordId: int("triage_record_id"), // Optional link to specific triage
  
  // File information
  fileName: varchar("file_name", { length: 255 }).notNull(),
  fileKey: varchar("file_key", { length: 512 }).notNull(), // S3 key
  fileUrl: varchar("file_url", { length: 1024 }).notNull(), // S3 URL
  fileSize: int("file_size").notNull(), // in bytes
  mimeType: varchar("mime_type", { length: 100 }).notNull(),
  
  // Document metadata
  documentType: varchar("document_type", { length: 50 }).notNull(), // lab_result, imaging, prescription, etc.
  description: text("description"),
  
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export type MedicalDocument = typeof medicalDocuments.$inferSelect;
export type InsertMedicalDocument = typeof medicalDocuments.$inferInsert;

/**
 * Voice recordings - stores metadata for voice inputs
 */
export const voiceRecordings = mysqlTable("voice_recordings", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("user_id").notNull(),
  triageRecordId: int("triage_record_id"),
  
  // Audio file info
  audioKey: varchar("audio_key", { length: 512 }).notNull(),
  audioUrl: varchar("audio_url", { length: 1024 }).notNull(),
  duration: int("duration"), // in seconds
  
  // Transcription
  transcription: text("transcription"),
  language: varchar("language", { length: 10 }).notNull(),
  
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export type VoiceRecording = typeof voiceRecordings.$inferSelect;
export type InsertVoiceRecording = typeof voiceRecordings.$inferInsert;

/**
 * Medical training materials - stores medical literature for AI training
 */
export const trainingMaterials = mysqlTable("training_materials", {
  id: int("id").autoincrement().primaryKey(),
  
  title: varchar("title", { length: 500 }).notNull(),
  category: varchar("category", { length: 100 }).notNull(),
  source: varchar("source", { length: 500 }).notNull(),
  sourceUrl: varchar("source_url", { length: 1024 }),
  
  content: text("content").notNull(),
  contentHash: varchar("content_hash", { length: 64 }),
  
  storageKey: varchar("storage_key", { length: 512 }),
  storageUrl: varchar("storage_url", { length: 1024 }),
  
  summary: text("summary"),
  keyFindings: text("key_findings"),
  clinicalRelevance: text("clinical_relevance"),
  
  processedAt: timestamp("processed_at"),
  trainingStatus: varchar("training_status", { length: 50 }).default("pending"),
  
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().onUpdateNow().notNull(),
});

export type TrainingMaterial = typeof trainingMaterials.$inferSelect;
export type InsertTrainingMaterial = typeof trainingMaterials.$inferInsert;

/**
 * Triage training data - stores all triage sessions for model improvement
 */
export const triageTrainingData = mysqlTable("triage_training_data", {
  id: int("id").autoincrement().primaryKey(),
  triageRecordId: int("triage_record_id").notNull(),
  
  conversationJson: text("conversation_json").notNull(),
  
  symptoms: text("symptoms").notNull(),
  patientAge: int("patient_age"),
  patientGender: varchar("patient_gender", { length: 20 }),
  
  finalDiagnosis: text("final_diagnosis"),
  urgencyLevel: varchar("urgency_level", { length: 50 }).notNull(),
  
  attachedFiles: text("attached_files"),
  xrayImages: text("xray_images"),
  
  usedForTraining: timestamp("used_for_training"),
  trainingEpoch: int("training_epoch"),
  
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export type TriageTrainingData = typeof triageTrainingData.$inferSelect;
export type InsertTriageTrainingData = typeof triageTrainingData.$inferInsert;

/**
 * Medical knowledge base - stores processed medical facts
 */
export const medicalKnowledgeBase = mysqlTable("medical_knowledge_base", {
  id: int("id").autoincrement().primaryKey(),
  
  topic: varchar("topic", { length: 500 }).notNull(),
  category: varchar("category", { length: 100 }).notNull(),
  
  content: text("content").notNull(),
  references: text("references"),
  
  confidence: int("confidence").default(0),
  lastVerified: timestamp("last_verified"),
  
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().onUpdateNow().notNull(),
});

export type MedicalKnowledgeBase = typeof medicalKnowledgeBase.$inferSelect;
export type InsertMedicalKnowledgeBase = typeof medicalKnowledgeBase.$inferInsert;

/**
 * Training sessions - tracks all model training runs
 */
export const trainingSessions = mysqlTable("training_sessions", {
  id: int("id").autoincrement().primaryKey(),
  
  startedAt: timestamp("started_at").defaultNow().notNull(),
  completedAt: timestamp("completed_at"),
  
  totalMaterials: int("total_materials").notNull(),
  processedMaterials: int("processed_materials").notNull(),
  successfulMaterials: int("successful_materials").notNull(),
  failedMaterials: int("failed_materials").notNull(),
  
  duration: int("duration"), // in seconds
  status: varchar("status", { length: 50 }).notNull().default("running"), // running, completed, failed
  
  results: text("results"), // JSON stringified array of results
  errorMessage: text("error_message"),
  
  triggeredBy: int("triggered_by").notNull(), // user ID
  
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export type TrainingSession = typeof trainingSessions.$inferSelect;
export type InsertTrainingSession = typeof trainingSessions.$inferInsert;

/**
 * Training datasets - tracks data sources for model training
 */
export const trainingDatasets = mysqlTable("training_datasets", {
  id: int("id").autoincrement().primaryKey(),
  
  name: varchar("name", { length: 255 }).notNull(),
  description: text("description"),
  dataSource: varchar("data_source", { length: 100 }).notNull(), // pubmed, pmc, medgen, clinvar, regional
  
  // Dataset statistics
  totalRecords: int("total_records").default(0),
  processedRecords: int("processed_records").default(0),
  validRecords: int("valid_records").default(0),
  
  // Data quality metrics
  qualityScore: int("quality_score").default(0), // 0-100
  completeness: int("completeness").default(0), // 0-100
  
  // Regional specificity
  isRegionalData: boolean("is_regional_data").default(false),
  region: varchar("region", { length: 100 }), // iraq, mena, global
  
  // Status tracking
  status: mysqlEnum("status", ["pending", "downloading", "processing", "ready", "failed"]).default("pending").notNull(),
  lastUpdated: timestamp("last_updated").defaultNow().onUpdateNow(),
  nextUpdateDue: timestamp("next_update_due"),
  
  // Storage info
  storageKey: varchar("storage_key", { length: 512 }),
  storageSize: int("storage_size"), // in bytes
  
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().onUpdateNow().notNull(),
});

export type TrainingDataset = typeof trainingDatasets.$inferSelect;
export type InsertTrainingDataset = typeof trainingDatasets.$inferInsert;

/**
 * Training jobs - manages training execution and configuration
 */
export const trainingJobs = mysqlTable("training_jobs", {
  id: int("id").autoincrement().primaryKey(),
  
  jobName: varchar("job_name", { length: 255 }).notNull(),
  jobType: mysqlEnum("job_type", ["full_training", "incremental", "fine_tuning", "evaluation"]).notNull(),
  
  // Configuration
  baseModel: varchar("base_model", { length: 100 }).notNull(), // gpt-4, claude, gemini
  trainingConfig: text("training_config"), // JSON with hyperparameters
  
  // Dataset selection
  datasetIds: text("dataset_ids"), // JSON array of dataset IDs
  totalDataPoints: int("total_data_points").default(0),
  
  // Progress tracking
  status: mysqlEnum("status", ["queued", "running", "paused", "completed", "failed", "cancelled"]).default("queued").notNull(),
  progress: int("progress").default(0), // 0-100
  currentEpoch: int("current_epoch").default(0),
  totalEpochs: int("total_epochs").default(1),
  
  // Timing
  startedAt: timestamp("started_at"),
  completedAt: timestamp("completed_at"),
  estimatedCompletion: timestamp("estimated_completion"),
  duration: int("duration"), // in seconds
  
  // Results
  outputModelId: int("output_model_id"),
  trainingMetrics: text("training_metrics"), // JSON with loss, accuracy, etc.
  errorMessage: text("error_message"),
  
  // Resource usage
  cpuUsage: int("cpu_usage"), // percentage
  memoryUsage: int("memory_usage"), // in MB
  gpuUsage: int("gpu_usage"), // percentage
  
  // User tracking
  triggeredBy: int("triggered_by").notNull(),
  
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().onUpdateNow().notNull(),
});

export type TrainingJob = typeof trainingJobs.$inferSelect;
export type InsertTrainingJob = typeof trainingJobs.$inferInsert;

/**
 * Training progress - real-time progress updates for training jobs
 */
export const trainingProgress = mysqlTable("training_progress", {
  id: int("id").autoincrement().primaryKey(),
  jobId: int("job_id").notNull(),
  
  // Progress details
  epoch: int("epoch").notNull(),
  step: int("step").notNull(),
  totalSteps: int("total_steps").notNull(),
  
  // Metrics
  loss: float("loss"),
  accuracy: float("accuracy"),
  validationLoss: float("validation_loss"),
  validationAccuracy: float("validation_accuracy"),
  perplexity: float("perplexity"),
  
  // Additional metrics
  learningRate: float("learning_rate"),
  batchSize: int("batch_size"),
  
  // Timing
  stepDuration: int("step_duration"), // in milliseconds
  
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export type TrainingProgress = typeof trainingProgress.$inferSelect;
export type InsertTrainingProgress = typeof trainingProgress.$inferInsert;

/**
 * Model versions - stores trained model metadata and versioning
 */
export const modelVersions = mysqlTable("model_versions", {
  id: int("id").autoincrement().primaryKey(),
  
  versionName: varchar("version_name", { length: 255 }).notNull(),
  versionNumber: varchar("version_number", { length: 50 }).notNull(),
  
  // Model info
  baseModel: varchar("base_model", { length: 100 }).notNull(),
  modelType: varchar("model_type", { length: 100 }).notNull(), // triage, diagnosis, general
  
  // Training info
  trainingJobId: int("training_job_id"),
  trainedOnDatasets: text("trained_on_datasets"), // JSON array
  totalTrainingData: int("total_training_data"),
  
  // Performance metrics
  accuracy: float("accuracy"),
  f1Score: float("f1_score"),
  precision: float("precision"),
  recall: float("recall"),
  bleuScore: float("bleu_score"),
  
  // Regional performance
  regionalAccuracy: text("regional_accuracy"), // JSON with region-specific metrics
  
  // Model storage
  modelKey: varchar("model_key", { length: 512 }),
  modelUrl: varchar("model_url", { length: 1024 }),
  modelSize: int("model_size"), // in bytes
  
  // Deployment status
  isDeployed: boolean("is_deployed").default(false),
  deployedAt: timestamp("deployed_at"),
  isActive: boolean("is_active").default(false),
  
  // Metadata
  description: text("description"),
  releaseNotes: text("release_notes"),
  
  createdBy: int("created_by").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().onUpdateNow().notNull(),
});

export type ModelVersion = typeof modelVersions.$inferSelect;
export type InsertModelVersion = typeof modelVersions.$inferInsert;

/**
 * Medical articles - stores parsed medical literature from various sources
 */
export const medicalArticles = mysqlTable("medical_articles", {
  id: int("id").autoincrement().primaryKey(),
  
  // Article identifiers
  pmid: varchar("pmid", { length: 50 }), // PubMed ID
  pmcid: varchar("pmcid", { length: 50 }), // PMC ID
  doi: varchar("doi", { length: 255 }), // Digital Object Identifier
  
  // Article metadata
  title: text("title").notNull(),
  abstract: text("abstract"),
  fullText: text("full_text"),
  
  // Authors and publication
  authors: text("authors"), // JSON array
  journal: varchar("journal", { length: 500 }),
  publicationDate: date("publication_date"),
  publicationYear: int("publication_year"),
  
  // Classification
  articleType: varchar("article_type", { length: 100 }), // research, review, case_study
  medicalField: varchar("medical_field", { length: 100 }),
  meshTerms: text("mesh_terms"), // JSON array of MeSH terms
  keywords: text("keywords"), // JSON array
  
  // Regional relevance
  isRegionallyRelevant: boolean("is_regionally_relevant").default(false),
  relevantRegions: text("relevant_regions"), // JSON array
  regionalDiseases: text("regional_diseases"), // JSON array
  
  // Quality metrics
  citationCount: int("citation_count").default(0),
  impactFactor: float("impact_factor"),
  qualityScore: int("quality_score").default(0), // 0-100
  
  // Processing status
  processingStatus: mysqlEnum("processing_status", ["pending", "processed", "indexed", "failed"]).default("pending"),
  processedAt: timestamp("processed_at"),
  
  // Training usage
  usedInTraining: boolean("used_in_training").default(false),
  trainingJobIds: text("training_job_ids"), // JSON array
  
  // Storage
  storageKey: varchar("storage_key", { length: 512 }),
  sourceUrl: varchar("source_url", { length: 1024 }),
  
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().onUpdateNow().notNull(),
});

export type MedicalArticle = typeof medicalArticles.$inferSelect;
export type InsertMedicalArticle = typeof medicalArticles.$inferInsert;

/**
 * Medical entities - extracted medical terms, diseases, drugs, etc.
 */
export const medicalEntities = mysqlTable("medical_entities", {
  id: int("id").autoincrement().primaryKey(),
  
  // Entity identification
  entityType: mysqlEnum("entity_type", ["disease", "symptom", "drug", "procedure", "anatomy", "gene"]).notNull(),
  entityName: varchar("entity_name", { length: 500 }).notNull(),
  entityNameAr: varchar("entity_name_ar", { length: 500 }), // Arabic translation
  
  // Standard codes
  icd10Code: varchar("icd10_code", { length: 50 }),
  snomedCode: varchar("snomed_code", { length: 50 }),
  meshCode: varchar("mesh_code", { length: 50 }),
  umlsCode: varchar("umls_code", { length: 50 }),
  
  // Entity details
  description: text("description"),
  descriptionAr: text("description_ar"),
  synonyms: text("synonyms"), // JSON array
  
  // Regional data
  regionalPrevalence: text("regional_prevalence"), // JSON with region-specific data
  menaSpecific: boolean("mena_specific").default(false),
  
  // Relationships
  relatedEntities: text("related_entities"), // JSON array of entity IDs
  
  // Source tracking
  sourceArticleIds: text("source_article_ids"), // JSON array
  occurrenceCount: int("occurrence_count").default(1),
  
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().onUpdateNow().notNull(),
});

export type MedicalEntity = typeof medicalEntities.$inferSelect;
export type InsertMedicalEntity = typeof medicalEntities.$inferInsert;

/**
 * Regional medical data - MENA and Iraq-specific medical information
 */
export const regionalMedicalData = mysqlTable("regional_medical_data", {
  id: int("id").autoincrement().primaryKey(),
  
  region: varchar("region", { length: 100 }).notNull(), // iraq, syria, jordan, etc.
  dataType: mysqlEnum("data_type", ["disease_prevalence", "treatment_protocol", "medication_availability", "health_statistics", "environmental_factors"]).notNull(),
  
  // Data content
  title: varchar("title", { length: 500 }).notNull(),
  titleAr: varchar("title_ar", { length: 500 }),
  content: text("content").notNull(),
  contentAr: text("content_ar"),
  
  // Medical classification
  diseaseCategory: varchar("disease_category", { length: 100 }),
  affectedPopulation: text("affected_population"), // JSON with demographics
  
  // Statistics
  prevalenceRate: float("prevalence_rate"),
  incidenceRate: float("incidence_rate"),
  mortalityRate: float("mortality_rate"),
  
  // Data source
  dataSource: varchar("data_source", { length: 500 }).notNull(),
  sourceUrl: varchar("source_url", { length: 1024 }),
  dataYear: int("data_year"),
  
  // Validation
  isVerified: boolean("is_verified").default(false),
  verifiedBy: int("verified_by"),
  verifiedAt: timestamp("verified_at"),
  
  // Training usage
  usedInTraining: boolean("used_in_training").default(false),
  
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().onUpdateNow().notNull(),
});

export type RegionalMedicalData = typeof regionalMedicalData.$inferSelect;
export type InsertRegionalMedicalData = typeof regionalMedicalData.$inferInsert;

/**
 * Training metrics - detailed metrics for training analysis
 */
export const trainingMetrics = mysqlTable("training_metrics", {
  id: int("id").autoincrement().primaryKey(),
  jobId: int("job_id").notNull(),
  modelVersionId: int("model_version_id"),
  
  // Performance metrics
  metricType: varchar("metric_type", { length: 100 }).notNull(), // accuracy, loss, f1, precision, recall
  metricValue: float("metric_value").notNull(),
  
  // Context
  datasetType: varchar("dataset_type", { length: 50 }), // training, validation, test
  epoch: int("epoch"),
  
  // Regional breakdown
  region: varchar("region", { length: 100 }),
  regionalValue: float("regional_value"),
  
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export type TrainingMetric = typeof trainingMetrics.$inferSelect;
export type InsertTrainingMetric = typeof trainingMetrics.$inferInsert;

/**
 * Clinical cases table for case management
 */
export const cases = mysqlTable("cases", {
  id: int("id").autoincrement().primaryKey(),
  patientName: varchar("patient_name", { length: 255 }).notNull(),
  patientAge: int("patient_age"),
  patientGender: mysqlEnum("patient_gender", ["male", "female", "other"]),
  chiefComplaint: text("chief_complaint").notNull(),
  status: mysqlEnum("status", ["active", "completed", "archived"]).default("active").notNull(),
  urgency: mysqlEnum("urgency", ["emergency", "urgent", "semi-urgent", "non-urgent", "routine"]),
  clinicianId: int("clinician_id").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().onUpdateNow().notNull(),
});

export type Case = typeof cases.$inferSelect;
export type InsertCase = typeof cases.$inferInsert;

/**
 * Patient vitals table
 */
export const vitals = mysqlTable("vitals", {
  id: int("id").autoincrement().primaryKey(),
  caseId: int("case_id").notNull(),
  bloodPressureSystolic: int("bp_systolic"),
  bloodPressureDiastolic: int("bp_diastolic"),
  heartRate: int("heart_rate"),
  temperature: varchar("temperature", { length: 10 }),
  oxygenSaturation: int("oxygen_saturation"),
  respiratoryRate: int("respiratory_rate"),
  weight: varchar("weight", { length: 20 }),
  height: varchar("height", { length: 20 }),
  recordedAt: timestamp("recorded_at").defaultNow().notNull(),
});

export type Vitals = typeof vitals.$inferSelect;
export type InsertVitals = typeof vitals.$inferInsert;

/**
 * Differential diagnoses table - stores AI-generated diagnoses with likelihood scores
 */
export const differentialDiagnoses = mysqlTable("differential_diagnoses", {
  id: int("id").autoincrement().primaryKey(),
  triageRecordId: int("triage_record_id").notNull(),
  caseId: int("case_id"),
  
  // Diagnosis information
  diagnosisName: varchar("diagnosis_name", { length: 500 }).notNull(),
  diagnosisNameAr: varchar("diagnosis_name_ar", { length: 500 }),
  likelihoodScore: int("likelihood_score").notNull(), // 0-100 percentage
  
  // Clinical reasoning
  clinicalReasoning: text("clinical_reasoning").notNull(),
  clinicalReasoningAr: text("clinical_reasoning_ar"),
  
  // Supporting evidence
  matchingSymptoms: text("matching_symptoms"), // JSON array
  riskFactors: text("risk_factors"), // JSON array
  
  // Recommended actions
  recommendedTests: text("recommended_tests"), // JSON array
  recommendedTestsAr: text("recommended_tests_ar"), // JSON array
  
  // Red flags
  redFlags: text("red_flags"), // JSON array
  redFlagsAr: text("red_flags_ar"), // JSON array
  
  // Urgency assessment
  urgencyLevel: mysqlEnum("urgency_level", ["emergency", "urgent", "semi-urgent", "non-urgent", "routine"]).notNull(),
  urgencyReasoning: text("urgency_reasoning"),
  urgencyReasoningAr: text("urgency_reasoning_ar"),
  
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export type DifferentialDiagnosis = typeof differentialDiagnoses.$inferSelect;
export type InsertDifferentialDiagnosis = typeof differentialDiagnoses.$inferInsert;

/**
 * Differential diagnoses table
 */
export const diagnoses = mysqlTable("diagnoses", {
  id: int("id").autoincrement().primaryKey(),
  caseId: int("case_id").notNull(),
  diagnosis: varchar("diagnosis", { length: 500 }).notNull(),
  probability: int("probability"),
  reasoning: text("reasoning"),
  redFlags: text("red_flags"),
  recommendedActions: text("recommended_actions"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export type Diagnosis = typeof diagnoses.$inferSelect;
export type InsertDiagnosis = typeof diagnoses.$inferInsert;

/**
 * Clinical notes table
 */
export const clinicalNotes = mysqlTable("clinical_notes", {
  id: int("id").autoincrement().primaryKey(),
  caseId: int("case_id").notNull(),
  noteType: mysqlEnum("note_type", ["history", "examination", "assessment", "plan", "scribe"]).notNull(),
  content: text("content").notNull(),
  createdBy: int("created_by").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export type ClinicalNote = typeof clinicalNotes.$inferSelect;
export type InsertClinicalNote = typeof clinicalNotes.$inferInsert;

/**
 * Medications table for drug interaction checking
 */
export const medications = mysqlTable("medications", {
  id: int("id").autoincrement().primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  genericName: varchar("generic_name", { length: 255 }),
  category: varchar("category", { length: 100 }),
  interactions: text("interactions"),
  contraindications: text("contraindications"),
  sideEffects: text("side_effects"),
});

export type Medication = typeof medications.$inferSelect;
export type InsertMedication = typeof medications.$inferInsert;

/**
 * Medical facilities table for care locator
 */
export const facilities = mysqlTable("facilities", {
  id: int("id").autoincrement().primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  type: mysqlEnum("type", ["hospital", "clinic", "emergency", "specialist"]).notNull(),
  address: text("address").notNull(),
  city: varchar("city", { length: 100 }),
  latitude: varchar("latitude", { length: 50 }),
  longitude: varchar("longitude", { length: 50 }),
  phone: varchar("phone", { length: 50 }),
  hours: varchar("hours", { length: 255 }),
  rating: varchar("rating", { length: 10 }),
  services: text("services"), // JSON array
  specialties: text("specialties"),
  emergencyServices: int("emergency_services").default(0),
  website: varchar("website", { length: 512 }),
});

export type Facility = typeof facilities.$inferSelect;
export type InsertFacility = typeof facilities.$inferInsert;

/**
 * Transcriptions table for Live Scribe feature
 */
export const transcriptions = mysqlTable("transcriptions", {
  id: int("id").autoincrement().primaryKey(),
  caseId: int("case_id"),
  clinicianId: int("clinician_id").notNull(),
  
  // Audio file info
  audioKey: varchar("audio_key", { length: 512 }),
  audioUrl: varchar("audio_url", { length: 1024 }),
  duration: int("duration"), // in seconds
  
  // Transcription content
  transcriptionText: text("transcription_text").notNull(),
  language: varchar("language", { length: 10 }).notNull().default("en"),
  
  // Metadata
  speaker: mysqlEnum("speaker", ["clinician", "patient", "mixed"]).default("clinician"),
  status: mysqlEnum("status", ["draft", "final", "archived"]).default("draft").notNull(),
  
  // Integration
  savedToClinicalNotes: boolean("saved_to_clinical_notes").default(false),
  clinicalNoteId: int("clinical_note_id"),
  
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().onUpdateNow().notNull(),
});

export type Transcription = typeof transcriptions.$inferSelect;
export type InsertTranscription = typeof transcriptions.$inferInsert;

/**
 * Timeline events table for case history visualization
 */
export const timelineEvents = mysqlTable("timeline_events", {
  id: int("id").autoincrement().primaryKey(),
  caseId: int("case_id").notNull(),
  
  // Event details
  eventType: mysqlEnum("event_type", [
    "symptom",
    "vital_signs",
    "diagnosis",
    "treatment",
    "medication",
    "procedure",
    "lab_result",
    "imaging",
    "note",
  ]).notNull(),
  
  title: varchar("title", { length: 255 }).notNull(),
  description: text("description"),
  
  // Event data (JSON for flexibility)
  eventData: json("event_data"),
  
  // Metadata
  severity: mysqlEnum("severity", ["low", "medium", "high", "critical"]),
  recordedBy: int("recorded_by"),
  
  eventTime: timestamp("event_time").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export type TimelineEvent = typeof timelineEvents.$inferSelect;
export type InsertTimelineEvent = typeof timelineEvents.$inferInsert;

/**
 * Appointments table for booking system
 */
export const appointments = mysqlTable("appointments", {
  id: int("id").autoincrement().primaryKey(),
  
  // Patient and facility info
  patientId: int("patient_id").notNull(), // user ID
  facilityId: int("facility_id"), // Optional: from facilities table
  facilityName: varchar("facility_name", { length: 255 }), // For Google Places facilities
  facilityAddress: text("facility_address"),
  
  // Clinician info
  clinicianId: int("clinician_id"), // Optional: assigned clinician
  
  // Appointment details
  appointmentDate: timestamp("appointment_date").notNull(),
  duration: int("duration").default(30), // in minutes
  appointmentType: mysqlEnum("appointment_type", [
    "consultation",
    "follow_up",
    "emergency",
    "screening",
    "vaccination",
    "other"
  ]).default("consultation").notNull(),
  
  status: mysqlEnum("status", [
    "pending",
    "confirmed",
    "completed",
    "cancelled",
    "no_show"
  ]).default("pending").notNull(),
  
  // Additional info
  chiefComplaint: text("chief_complaint"),
  notes: text("notes"),
  
  // Reminders
  reminderSent: boolean("reminder_sent").default(false),
  reminderSentAt: timestamp("reminder_sent_at"),
  
  // Cancellation
  cancelledBy: int("cancelled_by"),
  cancellationReason: text("cancellation_reason"),
  cancelledAt: timestamp("cancelled_at"),
  
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().onUpdateNow().notNull(),
});

export type Appointment = typeof appointments.$inferSelect;
export type InsertAppointment = typeof appointments.$inferInsert;

/**
 * Prescriptions table for medication tracking
 */
export const prescriptions = mysqlTable("prescriptions", {
  id: int("id").autoincrement().primaryKey(),
  
  // Patient and case info
  patientId: int("patient_id").notNull(),
  caseId: int("case_id"),
  clinicianId: int("clinician_id").notNull(),
  
  // Medication details
  medicationName: varchar("medication_name", { length: 255 }).notNull(),
  genericName: varchar("generic_name", { length: 255 }),
  dosage: varchar("dosage", { length: 100 }).notNull(), // e.g., "500mg"
  frequency: varchar("frequency", { length: 100 }).notNull(), // e.g., "twice daily"
  route: varchar("route", { length: 50 }), // oral, injection, topical, etc.
  
  // Schedule
  startDate: timestamp("start_date").notNull(),
  endDate: timestamp("end_date"),
  duration: int("duration"), // in days
  
  // Instructions
  instructions: text("instructions"),
  warnings: text("warnings"),
  
  // Status
  status: mysqlEnum("status", [
    "active",
    "completed",
    "discontinued",
    "on_hold"
  ]).default("active").notNull(),
  
  // Refills
  refillsAllowed: int("refills_allowed").default(0),
  refillsRemaining: int("refills_remaining").default(0),
  
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().onUpdateNow().notNull(),
});

export type Prescription = typeof prescriptions.$inferSelect;
export type InsertPrescription = typeof prescriptions.$inferInsert;

/**
 * Medication adherence tracking
 */
export const medicationAdherence = mysqlTable("medication_adherence", {
  id: int("id").autoincrement().primaryKey(),
  
  prescriptionId: int("prescription_id").notNull(),
  patientId: int("patient_id").notNull(),
  
  // Scheduled dose
  scheduledTime: timestamp("scheduled_time").notNull(),
  
  // Actual intake
  taken: boolean("taken").default(false),
  takenAt: timestamp("taken_at"),
  
  // Missed dose tracking
  missed: boolean("missed").default(false),
  missedReason: text("missed_reason"),
  
  // Reminder
  reminderSent: boolean("reminder_sent").default(false),
  reminderSentAt: timestamp("reminder_sent_at"),
  
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export type MedicationAdherence = typeof medicationAdherence.$inferSelect;
export type InsertMedicationAdherence = typeof medicationAdherence.$inferInsert;

/**
 * Video consultations table for telemedicine
 */
export const consultations = mysqlTable("consultations", {
  id: int("id").autoincrement().primaryKey(),
  
  // Participants
  patientId: int("patient_id").notNull(),
  clinicianId: int("clinician_id").notNull(),
  appointmentId: int("appointment_id"), // Optional: link to appointment
  
  // Consultation details
  scheduledTime: timestamp("scheduled_time").notNull(),
  startTime: timestamp("start_time"),
  endTime: timestamp("end_time"),
  duration: int("duration"), // actual duration in minutes
  
  // Status
  status: mysqlEnum("status", [
    "scheduled",
    "waiting",
    "in_progress",
    "completed",
    "cancelled",
    "no_show"
  ]).default("scheduled").notNull(),
  
  // Room info
  roomId: varchar("room_id", { length: 100 }).notNull().unique(),
  
  // Consultation data
  chiefComplaint: text("chief_complaint"),
  notes: text("notes"), // Clinician notes during consultation
  diagnosis: text("diagnosis"),
  prescriptionGenerated: boolean("prescription_generated").default(false),
  
  // Recording (optional)
  recordingUrl: varchar("recording_url", { length: 500 }),
  recordingEnabled: boolean("recording_enabled").default(false),
  
  // Chat transcript
  chatTranscript: text("chat_transcript"), // JSON stringified
  
  // Payment
  paymentStatus: mysqlEnum("payment_status", [
    "pending",
    "paid",
    "failed",
    "refunded"
  ]).default("pending"),
  amount: int("amount"), // in cents/fils
  
  // Ratings
  patientRating: int("patient_rating"), // 1-5
  patientFeedback: text("patient_feedback"),
  
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().onUpdateNow().notNull(),
});

export type Consultation = typeof consultations.$inferSelect;
export type InsertConsultation = typeof consultations.$inferInsert;

/**
 * Secure messaging between patients and clinicians
 */
export const messages = mysqlTable("messages", {
  id: int("id").autoincrement().primaryKey(),
  
  // Participants
  senderId: int("sender_id").notNull(),
  recipientId: int("recipient_id").notNull(),
  
  // Message content
  subject: varchar("subject", { length: 255 }),
  content: text("content").notNull(),
  
  // Encryption (content is encrypted before storage)
  encrypted: boolean("encrypted").default(true),
  
  // Status
  read: boolean("read").default(false),
  readAt: timestamp("read_at"),
  
  // Thread management
  threadId: int("thread_id"), // For grouping related messages
  replyToId: int("reply_to_id"), // For direct replies
  
  // Related case
  caseId: int("case_id"),
  
  // Attachments
  attachments: text("attachments"), // JSON array of file URLs
  
  // Soft delete
  deletedBySender: boolean("deleted_by_sender").default(false),
  deletedByRecipient: boolean("deleted_by_recipient").default(false),
  
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().onUpdateNow().notNull(),
});

export type Message = typeof messages.$inferSelect;
export type InsertMessage = typeof messages.$inferInsert;


/**
 * FHIR R4 Patient Resource
 * Stores patient demographics and identifiers following FHIR standard
 */
export const fhirPatients = mysqlTable("fhir_patients", {
  id: int("id").autoincrement().primaryKey(),
  
  // FHIR Resource metadata
  fhirId: varchar("fhir_id", { length: 64 }).notNull().unique(), // FHIR resource ID
  resourceType: varchar("resource_type", { length: 50 }).default("Patient").notNull(),
  
  // Link to system user (if patient has app account)
  userId: int("user_id"),
  
  // Patient identifiers (FHIR Identifier)
  identifiers: text("identifiers").notNull(), // JSON array of {system, value, type}
  
  // Patient name (FHIR HumanName)
  familyName: varchar("family_name", { length: 255 }),
  givenNames: text("given_names"), // JSON array
  prefix: varchar("prefix", { length: 50 }),
  suffix: varchar("suffix", { length: 50 }),
  
  // Demographics
  gender: mysqlEnum("gender", ["male", "female", "other", "unknown"]),
  birthDate: date("birth_date"),
  
  // Contact information (FHIR ContactPoint)
  telecom: text("telecom"), // JSON array of {system: phone|email|fax, value, use: home|work|mobile}
  
  // Address (FHIR Address)
  addresses: text("addresses"), // JSON array of {use, type, line[], city, state, postalCode, country}
  
  // Marital status
  maritalStatus: varchar("marital_status", { length: 50 }),
  
  // Communication preferences (FHIR Communication)
  languages: text("languages"), // JSON array of {language, preferred}
  
  // General practitioner references
  generalPractitioner: text("general_practitioner"), // JSON array of practitioner FHIR IDs
  
  // Managing organization
  managingOrganization: varchar("managing_organization", { length: 255 }),
  
  // Active status
  active: boolean("active").default(true),
  
  // Metadata
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().onUpdateNow().notNull(),
  lastUpdated: timestamp("last_updated").defaultNow().onUpdateNow().notNull(),
});

export type FhirPatient = typeof fhirPatients.$inferSelect;
export type InsertFhirPatient = typeof fhirPatients.$inferInsert;

/**
 * FHIR R4 Condition Resource
 * Medical conditions, problems, diagnoses
 */
export const fhirConditions = mysqlTable("fhir_conditions", {
  id: int("id").autoincrement().primaryKey(),
  
  // FHIR Resource metadata
  fhirId: varchar("fhir_id", { length: 64 }).notNull().unique(),
  resourceType: varchar("resource_type", { length: 50 }).default("Condition").notNull(),
  
  // Subject (patient reference)
  patientFhirId: varchar("patient_fhir_id", { length: 64 }).notNull(),
  
  // Clinical status (active, recurrence, relapse, inactive, remission, resolved)
  clinicalStatus: varchar("clinical_status", { length: 50 }).notNull(),
  
  // Verification status (unconfirmed, provisional, differential, confirmed, refuted, entered-in-error)
  verificationStatus: varchar("verification_status", { length: 50 }),
  
  // Category (problem-list-item, encounter-diagnosis)
  category: text("category"), // JSON array
  
  // Severity (severe, moderate, mild)
  severity: varchar("severity", { length: 50 }),
  
  // Condition code (SNOMED CT, ICD-10, etc.)
  code: text("code").notNull(), // JSON {coding: [{system, code, display}], text}
  
  // Body site
  bodySite: text("body_site"), // JSON array
  
  // Onset (when condition started)
  onsetDateTime: timestamp("onset_date_time"),
  onsetAge: int("onset_age"),
  onsetString: varchar("onset_string", { length: 255 }),
  
  // Abatement (when condition resolved)
  abatementDateTime: timestamp("abatement_date_time"),
  abatementAge: int("abatement_age"),
  abatementString: varchar("abatement_string", { length: 255 }),
  
  // Recorded date
  recordedDate: timestamp("recorded_date"),
  
  // Recorder (practitioner who recorded)
  recorder: varchar("recorder", { length: 255 }),
  
  // Asserter (who asserted the condition)
  asserter: varchar("asserter", { length: 255 }),
  
  // Stage
  stage: text("stage"), // JSON
  
  // Evidence
  evidence: text("evidence"), // JSON array
  
  // Notes
  notes: text("notes"),
  
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().onUpdateNow().notNull(),
});

export type FhirCondition = typeof fhirConditions.$inferSelect;
export type InsertFhirCondition = typeof fhirConditions.$inferInsert;

/**
 * FHIR R4 MedicationStatement Resource
 * Record of medication being taken by a patient
 */
export const fhirMedicationStatements = mysqlTable("fhir_medication_statements", {
  id: int("id").autoincrement().primaryKey(),
  
  // FHIR Resource metadata
  fhirId: varchar("fhir_id", { length: 64 }).notNull().unique(),
  resourceType: varchar("resource_type", { length: 50 }).default("MedicationStatement").notNull(),
  
  // Subject (patient reference)
  patientFhirId: varchar("patient_fhir_id", { length: 64 }).notNull(),
  
  // Status (active, completed, entered-in-error, intended, stopped, on-hold, unknown, not-taken)
  status: varchar("status", { length: 50 }).notNull(),
  
  // Medication (CodeableConcept or Reference)
  medicationCodeableConcept: text("medication_codeable_concept"), // JSON {coding, text}
  medicationReference: varchar("medication_reference", { length: 255 }),
  
  // Effective period
  effectiveDateTime: timestamp("effective_date_time"),
  effectivePeriodStart: timestamp("effective_period_start"),
  effectivePeriodEnd: timestamp("effective_period_end"),
  
  // Date asserted
  dateAsserted: timestamp("date_asserted"),
  
  // Information source
  informationSource: varchar("information_source", { length: 255 }),
  
  // Derived from (supporting information)
  derivedFrom: text("derived_from"), // JSON array
  
  // Reason code
  reasonCode: text("reason_code"), // JSON array
  
  // Reason reference
  reasonReference: text("reason_reference"), // JSON array
  
  // Notes
  notes: text("notes"),
  
  // Dosage
  dosage: text("dosage"), // JSON array of dosage instructions
  
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().onUpdateNow().notNull(),
});

export type FhirMedicationStatement = typeof fhirMedicationStatements.$inferSelect;
export type InsertFhirMedicationStatement = typeof fhirMedicationStatements.$inferInsert;

/**
 * FHIR R4 Observation Resource
 * Vital signs, lab results, clinical observations
 */
export const fhirObservations = mysqlTable("fhir_observations", {
  id: int("id").autoincrement().primaryKey(),
  
  // FHIR Resource metadata
  fhirId: varchar("fhir_id", { length: 64 }).notNull().unique(),
  resourceType: varchar("resource_type", { length: 50 }).default("Observation").notNull(),
  
  // Subject (patient reference)
  patientFhirId: varchar("patient_fhir_id", { length: 64 }).notNull(),
  
  // Status (registered, preliminary, final, amended, corrected, cancelled, entered-in-error, unknown)
  status: varchar("status", { length: 50 }).notNull(),
  
  // Category (vital-signs, laboratory, imaging, survey, exam, therapy, social-history, etc.)
  category: text("category"), // JSON array
  
  // Observation code (LOINC, SNOMED CT)
  code: text("code").notNull(), // JSON {coding: [{system, code, display}], text}
  
  // Effective time
  effectiveDateTime: timestamp("effective_date_time"),
  effectivePeriodStart: timestamp("effective_period_start"),
  effectivePeriodEnd: timestamp("effective_period_end"),
  
  // Issued (when result was released)
  issued: timestamp("issued"),
  
  // Performer (who performed the observation)
  performer: text("performer"), // JSON array
  
  // Value (result)
  valueQuantityValue: decimal("value_quantity_value", { precision: 10, scale: 2 }),
  valueQuantityUnit: varchar("value_quantity_unit", { length: 50 }),
  valueQuantitySystem: varchar("value_quantity_system", { length: 255 }),
  valueQuantityCode: varchar("value_quantity_code", { length: 50 }),
  
  valueCodeableConcept: text("value_codeable_concept"), // JSON
  valueString: text("value_string"),
  valueBoolean: boolean("value_boolean"),
  valueInteger: int("value_integer"),
  valueRange: text("value_range"), // JSON
  valueRatio: text("value_ratio"), // JSON
  valueSampledData: text("value_sampled_data"), // JSON
  valueTime: time("value_time"),
  valueDateTime: timestamp("value_date_time"),
  valuePeriod: text("value_period"), // JSON
  
  // Data absent reason
  dataAbsentReason: text("data_absent_reason"), // JSON
  
  // Interpretation (normal, abnormal, critical, etc.)
  interpretation: text("interpretation"), // JSON array
  
  // Notes
  notes: text("notes"),
  
  // Body site
  bodySite: text("body_site"), // JSON
  
  // Method
  method: text("method"), // JSON
  
  // Reference range
  referenceRange: text("reference_range"), // JSON array
  
  // Has member (for grouped observations)
  hasMember: text("has_member"), // JSON array of observation references
  
  // Derived from
  derivedFrom: text("derived_from"), // JSON array
  
  // Component (for multi-component observations like blood pressure)
  component: text("component"), // JSON array
  
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().onUpdateNow().notNull(),
});

export type FhirObservation = typeof fhirObservations.$inferSelect;
export type InsertFhirObservation = typeof fhirObservations.$inferInsert;

/**
 * Clinics table - stores clinic information
 */
export const clinics = mysqlTable("clinics", {
  id: int("id").autoincrement().primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  arabicName: varchar("arabic_name", { length: 255 }),
  
  // Contact information
  email: varchar("email", { length: 320 }),
  phone: varchar("phone", { length: 50 }),
  address: text("address"),
  city: varchar("city", { length: 100 }),
  country: varchar("country", { length: 100 }).default("Iraq"),
  
  // Location
  latitude: varchar("latitude", { length: 50 }),
  longitude: varchar("longitude", { length: 50 }),
  
  // Subscription
  subscriptionTier: mysqlEnum("subscription_tier", ["individual", "small", "medium", "enterprise"]).default("small").notNull(),
  subscriptionStatus: mysqlEnum("subscription_status", ["trial", "active", "suspended", "cancelled"]).default("trial").notNull(),
  subscriptionStartDate: timestamp("subscription_start_date"),
  subscriptionEndDate: timestamp("subscription_end_date"),
  
  // Limits based on subscription
  maxDoctors: int("max_doctors").default(5),
  maxPatients: int("max_patients").default(500),
  
  // Settings
  logo: varchar("logo", { length: 1024 }),
  primaryColor: varchar("primary_color", { length: 7 }).default("#10b981"),
  workingHours: text("working_hours"), // JSON
  specialties: text("specialties"), // JSON array
  services: text("services"), // JSON array
  
  // Owner
  ownerId: int("owner_id").notNull(),
  
  // Status
  isActive: boolean("is_active").default(true).notNull(),
  
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().onUpdateNow().notNull(),
});

export type Clinic = typeof clinics.$inferSelect;
export type InsertClinic = typeof clinics.$inferInsert;

/**
 * Clinic employees table - links users to clinics with roles
 */
export const clinicEmployees = mysqlTable("clinic_employees", {
  id: int("id").autoincrement().primaryKey(),
  clinicId: int("clinic_id").notNull(),
  userId: int("user_id").notNull(),
  
  role: mysqlEnum("role", ["doctor", "nurse", "admin"]).notNull(),
  specialty: varchar("specialty", { length: 100 }),
  
  // Employment details
  employmentType: mysqlEnum("employment_type", ["full_time", "part_time", "contract"]).default("full_time"),
  startDate: timestamp("start_date"),
  endDate: timestamp("end_date"),
  
  // Status
  status: mysqlEnum("status", ["pending", "active", "suspended", "terminated"]).default("pending").notNull(),
  invitationToken: varchar("invitation_token", { length: 255 }),
  invitationExpiry: timestamp("invitation_expiry"),
  
  // Permissions
  canManagePatients: boolean("can_manage_patients").default(true),
  canManageEmployees: boolean("can_manage_employees").default(false),
  canManageSettings: boolean("can_manage_settings").default(false),
  canViewReports: boolean("can_view_reports").default(true),
  
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().onUpdateNow().notNull(),
});

export type ClinicEmployee = typeof clinicEmployees.$inferSelect;
export type InsertClinicEmployee = typeof clinicEmployees.$inferInsert;

/**
 * Patient-Clinic links table - manages patient associations with clinics
 */
export const patientClinicLinks = mysqlTable("patient_clinic_links", {
  id: int("id").autoincrement().primaryKey(),
  patientId: int("patient_id").notNull(),
  clinicId: int("clinic_id").notNull(),
  
  // Primary doctor assignment
  primaryDoctorId: int("primary_doctor_id"),
  
  // Registration details
  registrationMethod: mysqlEnum("registration_method", ["in_clinic", "online", "qr_code", "referral"]).default("in_clinic"),
  registrationDate: timestamp("registration_date").defaultNow().notNull(),
  
  // Status
  status: mysqlEnum("status", ["active", "inactive", "transferred"]).default("active").notNull(),
  
  // Patient number at this clinic
  patientNumber: varchar("patient_number", { length: 50 }),
  
  // Notes
  notes: text("notes"),
  
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().onUpdateNow().notNull(),
});

export type PatientClinicLink = typeof patientClinicLinks.$inferSelect;
export type InsertPatientClinicLink = typeof patientClinicLinks.$inferInsert;

/**
 * Clinic invitations table - tracks pending employee invitations
 */
export const clinicInvitations = mysqlTable("clinic_invitations", {
  id: int("id").autoincrement().primaryKey(),
  clinicId: int("clinic_id").notNull(),
  
  // Invitee information
  email: varchar("email", { length: 320 }).notNull(),
  role: mysqlEnum("role", ["doctor", "nurse", "admin"]).notNull(),
  specialty: varchar("specialty", { length: 100 }),
  
  // Invitation details
  invitationToken: varchar("invitation_token", { length: 255 }).notNull().unique(),
  invitedBy: int("invited_by").notNull(),
  expiresAt: timestamp("expires_at").notNull(),
  
  // Status
  status: mysqlEnum("status", ["pending", "accepted", "expired", "cancelled"]).default("pending").notNull(),
  acceptedAt: timestamp("accepted_at"),
  
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export type ClinicInvitation = typeof clinicInvitations.$inferSelect;
export type InsertClinicInvitation = typeof clinicInvitations.$inferInsert;

/**
 * Clinic subscriptions table - tracks subscription history and payments
 */
export const clinicSubscriptions = mysqlTable("clinic_subscriptions", {
  id: int("id").autoincrement().primaryKey(),
  clinicId: int("clinic_id").notNull(),
  
  tier: mysqlEnum("tier", ["individual", "small", "medium", "enterprise"]).notNull(),
  status: mysqlEnum("status", ["trial", "active", "past_due", "cancelled", "expired"]).notNull(),
  
  // Billing
  amount: int("amount").notNull(), // in cents
  currency: varchar("currency", { length: 3 }).default("USD"),
  billingCycle: mysqlEnum("billing_cycle", ["monthly", "yearly"]).default("monthly"),
  
  // Dates
  startDate: timestamp("start_date").notNull(),
  endDate: timestamp("end_date").notNull(),
  nextBillingDate: timestamp("next_billing_date"),
  
  // Payment
  paymentMethod: varchar("payment_method", { length: 50 }),
  lastPaymentDate: timestamp("last_payment_date"),
  lastPaymentAmount: int("last_payment_amount"),
  
  // Trial
  isTrialPeriod: boolean("is_trial_period").default(false),
  trialEndsAt: timestamp("trial_ends_at"),
  
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().onUpdateNow().notNull(),
});

export type ClinicSubscription = typeof clinicSubscriptions.$inferSelect;
export type InsertClinicSubscription = typeof clinicSubscriptions.$inferInsert;


/**
 * BRAIN Training Sessions - tracks automated training runs
 */
export const brainTrainingSessions = mysqlTable("brain_training_sessions", {
  id: int("id").autoincrement().primaryKey(),
  sessionId: varchar("session_id", { length: 100 }).notNull().unique(),
  
  // Training metrics
  startTime: timestamp("start_time").notNull(),
  endTime: timestamp("end_time"),
  casesProcessed: int("cases_processed").default(0),
  accuracyBefore: decimal("accuracy_before", { precision: 5, scale: 4 }),
  accuracyAfter: decimal("accuracy_after", { precision: 5, scale: 4 }),
  improvementRate: decimal("improvement_rate", { precision: 6, scale: 2 }),
  
  // Status
  status: mysqlEnum("status", ["running", "completed", "failed"]).notNull().default("running"),
  errorMessage: text("error_message"),
  
  // Approval
  approved: boolean("approved").default(false),
  approvedAt: timestamp("approved_at"),
  approvedBy: int("approved_by"),
  
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().onUpdateNow().notNull(),
});

export type BrainTrainingSession = typeof brainTrainingSessions.$inferSelect;
export type InsertBrainTrainingSession = typeof brainTrainingSessions.$inferInsert;

/**
 * BRAIN Learned Patterns - stores diagnostic patterns extracted from training
 */
export const brainLearnedPatterns = mysqlTable("brain_learned_patterns", {
  id: int("id").autoincrement().primaryKey(),
  
  // Pattern information
  patternType: varchar("pattern_type", { length: 100 }).notNull(), // diagnostic_pattern, symptom_cluster, etc.
  patternData: text("pattern_data").notNull(), // JSON with pattern details
  
  // Metadata
  condition: varchar("condition", { length: 255 }),
  symptoms: text("symptoms"), // JSON array
  confidence: decimal("confidence", { precision: 5, scale: 4 }).notNull(),
  
  // Usage tracking
  timesApplied: int("times_applied").default(0),
  successRate: decimal("success_rate", { precision: 5, scale: 4 }),
  
  // Source
  sourceSessionId: varchar("source_session_id", { length: 100 }),
  derivedFromCases: int("derived_from_cases").default(1),
  
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().onUpdateNow().notNull(),
});

export type BrainLearnedPattern = typeof brainLearnedPatterns.$inferSelect;
export type InsertBrainLearnedPattern = typeof brainLearnedPatterns.$inferInsert;

/**
 * BRAIN Error Analysis - tracks diagnostic errors for learning
 */
export const brainErrorAnalysis = mysqlTable("brain_error_analysis", {
  id: int("id").autoincrement().primaryKey(),
  
  // Case reference
  caseId: varchar("case_id", { length: 100 }).notNull(),
  
  // Error details
  predictedCondition: varchar("predicted_condition", { length: 255 }),
  actualCondition: varchar("actual_condition", { length: 255 }).notNull(),
  missedSymptoms: text("missed_symptoms"),
  
  // Error classification
  errorType: mysqlEnum("error_type", [
    "missed_diagnosis",
    "incorrect_ranking",
    "no_diagnosis",
    "false_positive",
    "unknown"
  ]).notNull(),
  
  // Severity
  severity: mysqlEnum("severity", ["low", "medium", "high", "critical"]).default("medium"),
  
  // Analysis
  rootCause: text("root_cause"),
  correctionApplied: text("correction_applied"),
  
  // Learning status
  reviewed: boolean("reviewed").default(false),
  reviewedBy: int("reviewed_by"),
  reviewedAt: timestamp("reviewed_at"),
  
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export type BrainErrorAnalysis = typeof brainErrorAnalysis.$inferSelect;
export type InsertBrainErrorAnalysis = typeof brainErrorAnalysis.$inferInsert;

/**
 * BRAIN Training Notifications - alerts for training events
 */
export const brainTrainingNotifications = mysqlTable("brain_training_notifications", {
  id: int("id").autoincrement().primaryKey(),
  
  // Notification details
  sessionId: varchar("session_id", { length: 100 }),
  notificationType: mysqlEnum("notification_type", [
    "training_complete",
    "training_failed",
    "accuracy_improved",
    "accuracy_degraded",
    "new_pattern_learned",
    "error_threshold_exceeded",
    "approval_required"
  ]).notNull(),
  
  // Message
  message: text("message").notNull(),
  details: text("details"), // JSON with additional info
  
  // Priority
  priority: mysqlEnum("priority", ["low", "medium", "high", "urgent"]).default("medium"),
  
  // Status
  read: boolean("read").default(false),
  readAt: timestamp("read_at"),
  readBy: int("read_by"),
  
  // Action
  actionRequired: boolean("action_required").default(false),
  actionTaken: boolean("action_taken").default(false),
  actionTakenAt: timestamp("action_taken_at"),
  
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export type BrainTrainingNotification = typeof brainTrainingNotifications.$inferSelect;
export type InsertBrainTrainingNotification = typeof brainTrainingNotifications.$inferInsert;

/**
 * BRAIN Knowledge Concepts - stores medical concepts (diseases, symptoms, treatments)
 */
export const brainKnowledgeConcepts = mysqlTable("brain_knowledge_concepts", {
  id: int("id").autoincrement().primaryKey(),
  
  // Concept identification
  conceptType: mysqlEnum("concept_type", ["disease", "symptom", "treatment", "investigation", "risk_factor"]).notNull(),
  name: varchar("name", { length: 255 }).notNull(),
  description: text("description"),
  
  // Clinical data
  category: varchar("category", { length: 100 }),
  icd10Code: varchar("icd10_code", { length: 20 }),
  snomedCode: varchar("snomed_code", { length: 50 }),
  
  // Metadata
  prevalence: varchar("prevalence", { length: 50 }),
  severity: mysqlEnum("severity", ["mild", "moderate", "severe", "critical"]),
  
  // Knowledge source
  source: varchar("source", { length: 255 }),
  evidenceLevel: varchar("evidence_level", { length: 50 }),
  
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().onUpdateNow().notNull(),
});

export type BrainKnowledgeConcept = typeof brainKnowledgeConcepts.$inferSelect;
export type InsertBrainKnowledgeConcept = typeof brainKnowledgeConcepts.$inferInsert;

/**
 * BRAIN Knowledge Relationships - stores relationships between medical concepts
 */
export const brainKnowledgeRelationships = mysqlTable("brain_knowledge_relationships", {
  id: int("id").autoincrement().primaryKey(),
  
  // Relationship definition
  fromConceptId: int("from_concept_id").notNull(),
  relationshipType: varchar("relationship_type", { length: 100 }).notNull(), // e.g., "may_indicate", "treats", "causes", "risk_factor_for"
  toConceptId: int("to_concept_id").notNull(),
  
  // Relationship strength
  confidence: decimal("confidence", { precision: 5, scale: 4 }), // 0.0 to 1.0
  strength: mysqlEnum("strength", ["weak", "moderate", "strong"]),
  
  // Clinical context
  context: text("context"), // Additional clinical context or conditions
  associatedSymptoms: text("associated_symptoms"), // JSON array
  distinguishingFeatures: text("distinguishing_features"), // JSON array
  
  // Metadata
  source: varchar("source", { length: 255 }),
  timesUsed: int("times_used").default(0),
  
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().onUpdateNow().notNull(),
});

export type BrainKnowledgeRelationship = typeof brainKnowledgeRelationships.$inferSelect;
export type InsertBrainKnowledgeRelationship = typeof brainKnowledgeRelationships.$inferInsert;

/**
 * BRAIN Medical Literature Cache - stores PubMed search results
 */
export const brainMedicalLiterature = mysqlTable("brain_medical_literature", {
  id: int("id").autoincrement().primaryKey(),
  
  // Literature metadata
  source: varchar("source", { length: 50 }).notNull().default("pubmed"),
  title: varchar("title", { length: 500 }).notNull(),
  authors: text("authors"),
  journal: varchar("journal", { length: 255 }),
  publicationDate: varchar("publication_date", { length: 50 }),
  
  // Content
  abstract: text("abstract"),
  literatureData: text("literature_data"), // Full JSON data
  
  // References
  pmid: varchar("pmid", { length: 50 }),
  doi: varchar("doi", { length: 255 }),
  url: varchar("url", { length: 1024 }),
  
  // Usage
  timesReferenced: int("times_referenced").default(0),
  relevanceScore: decimal("relevance_score", { precision: 5, scale: 4 }),
  
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().onUpdateNow().notNull(),
});

export type BrainMedicalLiterature = typeof brainMedicalLiterature.$inferSelect;
export type InsertBrainMedicalLiterature = typeof brainMedicalLiterature.$inferInsert;

/**
 * Doctor-Patient Relationships - links doctors to their patients
 */
export const doctorPatientRelationships = mysqlTable("doctor_patient_relationships", {
  id: int("id").autoincrement().primaryKey(),
  
  // Relationship participants
  doctorId: int("doctor_id").notNull(), // user ID with role='doctor' or 'clinician'
  patientId: int("patient_id").notNull(), // user ID with role='patient'
  
  // Relationship type
  relationshipType: mysqlEnum("relationship_type", [
    "primary",      // Primary care physician
    "specialist",   // Specialist consultant
    "consultant",   // One-time consultation
    "referral"      // Referred by another doctor
  ]).default("primary").notNull(),
  
  // Status
  status: mysqlEnum("status", [
    "active",       // Currently active relationship
    "inactive",     // Temporarily inactive
    "pending",      // Invitation sent, not yet accepted
    "terminated"    // Relationship ended
  ]).default("pending").notNull(),
  
  // Permissions - what doctor can see/do
  canViewRecords: boolean("can_view_records").default(true),
  canPrescribe: boolean("can_prescribe").default(true),
  canMessage: boolean("can_message").default(true),
  canScheduleAppointments: boolean("can_schedule_appointments").default(true),
  
  // Metadata
  notes: text("notes"), // Internal notes about relationship
  referredBy: int("referred_by"), // Doctor ID who made referral
  
  // Timestamps
  establishedAt: timestamp("established_at").defaultNow().notNull(),
  terminatedAt: timestamp("terminated_at"),
  terminationReason: text("termination_reason"),
  
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().onUpdateNow().notNull(),
});

export type DoctorPatientRelationship = typeof doctorPatientRelationships.$inferSelect;
export type InsertDoctorPatientRelationship = typeof doctorPatientRelationships.$inferInsert;

/**
 * Patient Invitations - tracks invitation codes for patients to join doctor's practice
 */
export const patientInvitations = mysqlTable("patient_invitations", {
  id: int("id").autoincrement().primaryKey(),
  
  // Invitation details
  doctorId: int("doctor_id").notNull(),
  invitationCode: varchar("invitation_code", { length: 32 }).unique().notNull(), // Unique code
  
  // Patient contact info (before they register)
  patientEmail: varchar("patient_email", { length: 320 }),
  patientPhone: varchar("patient_phone", { length: 50 }),
  patientName: varchar("patient_name", { length: 255 }),
  
  // Status
  status: mysqlEnum("status", [
    "pending",      // Sent, not yet accepted
    "accepted",     // Patient accepted and registered
    "expired",      // Invitation expired
    "cancelled"     // Doctor cancelled invitation
  ]).default("pending").notNull(),
  
  // Acceptance
  acceptedBy: int("accepted_by"), // user ID of patient who accepted
  acceptedAt: timestamp("accepted_at"),
  
  // Expiration
  expiresAt: timestamp("expires_at").notNull(), // Default 7 days from creation
  
  // Invitation message
  personalMessage: text("personal_message"), // Optional message from doctor
  
  // Metadata
  sentVia: mysqlEnum("sent_via", ["email", "sms", "link", "qr_code"]),
  timesViewed: int("times_viewed").default(0),
  lastViewedAt: timestamp("last_viewed_at"),
  
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().onUpdateNow().notNull(),
});

export type PatientInvitation = typeof patientInvitations.$inferSelect;
export type InsertPatientInvitation = typeof patientInvitations.$inferInsert;

/**
 * Subscriptions - manages user subscription plans and billing
 */
export const subscriptions = mysqlTable("subscriptions", {
  id: int("id").autoincrement().primaryKey(),
  
  // User and plan
  userId: int("user_id").notNull().unique(), // One subscription per user
  
  // Plan details
  planType: mysqlEnum("plan_type", [
    // Patient plans
    "patient_free",
    "patient_lite",
    "patient_pro",
    // Doctor plans
    "doctor_basic",
    "doctor_premium",
    // Enterprise
    "enterprise"
  ]).notNull(),
  
  // Pricing
  pricePerMonth: decimal("price_per_month", { precision: 10, scale: 2 }).notNull(), // In USD
  currency: varchar("currency", { length: 3 }).default("USD").notNull(),
  
  // Status
  status: mysqlEnum("status", [
    "active",       // Currently active and paid
    "trialing",     // In trial period
    "past_due",     // Payment failed, grace period
    "cancelled",    // Cancelled, active until period end
    "expired"       // Subscription ended
  ]).default("active").notNull(),
  
  // Billing cycle
  billingCycle: mysqlEnum("billing_cycle", ["monthly", "yearly"]).default("monthly").notNull(),
  currentPeriodStart: timestamp("current_period_start").notNull(),
  currentPeriodEnd: timestamp("current_period_end").notNull(),
  
  // Trial
  trialStart: timestamp("trial_start"),
  trialEnd: timestamp("trial_end"),
  
  // Cancellation
  cancelAtPeriodEnd: boolean("cancel_at_period_end").default(false),
  cancelledAt: timestamp("cancelled_at"),
  cancellationReason: text("cancellation_reason"),
  
  // Payment integration
  stripeCustomerId: varchar("stripe_customer_id", { length: 255 }),
  stripeSubscriptionId: varchar("stripe_subscription_id", { length: 255 }),
  paymentMethod: mysqlEnum("payment_method", [
    "stripe",
    "zain_cash",
    "asia_hawala",
    "bank_transfer",
    "cash",
    "manual"
  ]),
  
  // Last payment
  lastPaymentDate: timestamp("last_payment_date"),
  lastPaymentAmount: decimal("last_payment_amount", { precision: 10, scale: 2 }),
  lastPaymentStatus: mysqlEnum("last_payment_status", ["succeeded", "failed", "pending"]),
  
  // Next payment
  nextPaymentDate: timestamp("next_payment_date"),
  nextPaymentAmount: decimal("next_payment_amount", { precision: 10, scale: 2 }),
  
  // Metadata
  metadata: text("metadata"), // JSON for additional data
  
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().onUpdateNow().notNull(),
});

export type Subscription = typeof subscriptions.$inferSelect;
export type InsertSubscription = typeof subscriptions.$inferInsert;

/**
 * Usage Tracking - tracks feature usage for enforcing plan limits
 */
export const usageTracking = mysqlTable("usage_tracking", {
  id: int("id").autoincrement().primaryKey(),
  
  // User and feature
  userId: int("user_id").notNull(),
  feature: varchar("feature", { length: 100 }).notNull(), // 'symptom_check', 'message', 'patient_invite', etc.
  
  // Usage count
  count: int("count").default(0).notNull(),
  
  // Period (resets monthly)
  periodStart: timestamp("period_start").notNull(),
  periodEnd: timestamp("period_end").notNull(),
  
  // Limit for this period
  limit: int("limit"), // null = unlimited
  
  // Metadata
  lastUsedAt: timestamp("last_used_at"),
  
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().onUpdateNow().notNull(),
});

export type UsageTracking = typeof usageTracking.$inferSelect;
export type InsertUsageTracking = typeof usageTracking.$inferInsert;

/**
 * Shared Records - controls what medical records patients can see
 */
export const sharedRecords = mysqlTable("shared_records", {
  id: int("id").autoincrement().primaryKey(),
  
  // Participants
  doctorId: int("doctor_id").notNull(), // Doctor who shared
  patientId: int("patient_id").notNull(), // Patient who can view
  
  // Record reference
  recordType: mysqlEnum("record_type", [
    "case",
    "vital",
    "diagnosis",
    "prescription",
    "clinical_note",
    "transcription",
    "timeline_event",
    "appointment",
    "consultation",
    "lab_result",
    "imaging"
  ]).notNull(),
  recordId: int("record_id").notNull(), // ID of the actual record
  
  // Permissions
  patientCanView: boolean("patient_can_view").default(true),
  patientCanDownload: boolean("patient_can_download").default(false),
  patientCanComment: boolean("patient_can_comment").default(false),
  
  // Visibility settings
  hideFromPatient: boolean("hide_from_patient").default(false), // Temporarily hide
  showAfter: timestamp("show_after"), // Delay visibility
  
  // Sharing metadata
  shareReason: text("share_reason"), // Why this was shared
  sharedAt: timestamp("shared_at").defaultNow().notNull(),
  
  // Patient interaction
  viewedByPatient: boolean("viewed_by_patient").default(false),
  firstViewedAt: timestamp("first_viewed_at"),
  lastViewedAt: timestamp("last_viewed_at"),
  viewCount: int("view_count").default(0),
  
  // Revocation
  revokedAt: timestamp("revoked_at"),
  revocationReason: text("revocation_reason"),
  
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().onUpdateNow().notNull(),
});

export type SharedRecord = typeof sharedRecords.$inferSelect;
export type InsertSharedRecord = typeof sharedRecords.$inferInsert;

/**
 * Audit Logs - Security and compliance tracking
 * Logs all sensitive operations for security monitoring and compliance
 */
export const auditLogs = mysqlTable("audit_logs", {
  id: int("id").autoincrement().primaryKey(),
  
  // User who performed the action
  userId: int("user_id"),
  
  // Action details
  action: varchar("action", { length: 100 }).notNull(), // e.g., 'user.login', 'doctor.patient_access'
  resourceType: varchar("resource_type", { length: 50 }), // e.g., 'user', 'patient', 'triage'
  resourceId: varchar("resource_id", { length: 100 }), // ID of the affected resource
  
  // Request metadata
  ipAddress: varchar("ip_address", { length: 45 }), // IPv4 or IPv6
  userAgent: text("user_agent"),
  
  // Additional context
  details: text("details"), // JSON stringified additional information
  
  // Result
  success: boolean("success").notNull(),
  errorMessage: text("error_message"),
  
  timestamp: timestamp("timestamp").defaultNow().notNull(),
});

export type AuditLog = typeof auditLogs.$inferSelect;
export type InsertAuditLog = typeof auditLogs.$inferInsert;

// ============================================================================
// AEC (Autonomous Error Correction) System Tables
// ============================================================================

/**
 * AEC Detected Errors - Tracks all errors detected by the Sentinel Layer
 */
export const aecDetectedErrors = mysqlTable("aec_detected_errors", {
  id: int("id").autoincrement().primaryKey(),
  
  // Error identification
  errorType: varchar("error_type", { length: 100 }).notNull(), // e.g., 'RUNTIME_ERROR', 'API_ERROR'
  severity: varchar("severity", { length: 20 }).notNull(), // 'low', 'medium', 'high', 'critical'
  message: text("message").notNull(),
  stackTrace: text("stack_trace"),
  
  // Error context
  source: varchar("source", { length: 255 }), // File or module where error occurred
  endpoint: varchar("endpoint", { length: 255 }), // API endpoint if applicable
  userContext: text("user_context"), // JSON with user/session info
  
  // Occurrence tracking
  firstOccurrence: timestamp("first_occurrence").defaultNow().notNull(),
  lastOccurrence: timestamp("last_occurrence").defaultNow().notNull(),
  occurrenceCount: int("occurrence_count").default(1).notNull(),
  
  // Status
  status: varchar("status", { length: 20 }).default("detected").notNull(), // detected, analyzing, patched, resolved
  resolvedAt: timestamp("resolved_at"),
  
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().onUpdateNow().notNull(),
});

export type AecDetectedError = typeof aecDetectedErrors.$inferSelect;
export type InsertAecDetectedError = typeof aecDetectedErrors.$inferInsert;

/**
 * AEC Diagnostics - Analysis results from the Diagnostic Layer
 */
export const aecDiagnostics = mysqlTable("aec_diagnostics", {
  id: int("id").autoincrement().primaryKey(),
  errorId: int("error_id").notNull(),
  
  // Root cause analysis
  rootCause: text("root_cause").notNull(), // JSON with detailed analysis
  impact: varchar("impact", { length: 20 }).notNull(), // 'low', 'medium', 'high'
  affectedFeatures: text("affected_features"), // JSON array of affected features
  
  // Solution proposal
  proposedSolution: text("proposed_solution").notNull(),
  confidence: decimal("confidence", { precision: 5, scale: 2 }), // 0-100
  
  // Context
  codeContext: text("code_context"), // Relevant code snippets
  relatedFiles: text("related_files"), // JSON array of file paths
  
  // Analysis metadata
  analysisModel: varchar("analysis_model", { length: 50 }), // AI model used
  analysisDuration: int("analysis_duration"), // milliseconds
  
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export type AecDiagnostic = typeof aecDiagnostics.$inferSelect;
export type InsertAecDiagnostic = typeof aecDiagnostics.$inferInsert;

/**
 * AEC Patches - Code patches generated by the Surgical Layer
 */
export const aecPatches = mysqlTable("aec_patches", {
  id: int("id").autoincrement().primaryKey(),
  errorId: int("error_id").notNull(),
  
  // Patch details
  patchVersion: varchar("patch_version", { length: 50 }).notNull(), // e.g., 'v1.0.1-aec-001'
  branchName: varchar("branch_name", { length: 100 }), // Git branch name
  
  // Code changes
  filesModified: text("files_modified"), // JSON array of modified files
  diffContent: text("diff_content"), // Git diff
  
  // Validation
  testResults: text("test_results"), // JSON with test results
  validationStatus: varchar("validation_status", { length: 20 }), // 'pending', 'testing', 'passed', 'failed'
  
  // Deployment
  status: varchar("status", { length: 20 }).default("generated").notNull(), // generated, testing, approved, deployed, rolled_back, rejected
  deployedAt: timestamp("deployed_at"),
  deploymentNotes: text("deployment_notes"),
  
  // Rollback info
  rolledBackAt: timestamp("rolled_back_at"),
  rollbackReason: text("rollback_reason"),
  
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().onUpdateNow().notNull(),
});

export type AecPatch = typeof aecPatches.$inferSelect;
export type InsertAecPatch = typeof aecPatches.$inferInsert;

/**
 * AEC Health Checks - Post-deployment health monitoring
 */
export const aecHealthChecks = mysqlTable("aec_health_checks", {
  id: int("id").autoincrement().primaryKey(),
  patchId: int("patch_id"), // null for scheduled checks
  
  // Health status
  status: varchar("status", { length: 20 }).notNull(), // 'healthy', 'degraded', 'unhealthy'
  responseTime: int("response_time"), // milliseconds
  
  // Check results
  apiHealthy: boolean("api_healthy").notNull(),
  databaseHealthy: boolean("database_healthy").notNull(),
  criticalEndpointsHealthy: boolean("critical_endpoints_healthy").notNull(),
  
  // Details
  failedChecks: text("failed_checks"), // JSON array of failed check names
  errorDetails: text("error_details"), // JSON with error information
  
  timestamp: timestamp("timestamp").defaultNow().notNull(),
});

export type AecHealthCheck = typeof aecHealthChecks.$inferSelect;
export type InsertAecHealthCheck = typeof aecHealthChecks.$inferInsert;

/**
 * AEC Configuration - System configuration and thresholds
 */
export const aecConfig = mysqlTable("aec_config", {
  id: int("id").autoincrement().primaryKey(),
  
  // Configuration key-value
  configKey: varchar("config_key", { length: 100 }).notNull().unique(),
  configValue: text("config_value").notNull(),
  
  // Metadata
  description: text("description"),
  category: varchar("category", { length: 50 }), // 'alerts', 'thresholds', 'features'
  
  updatedAt: timestamp("updated_at").defaultNow().onUpdateNow().notNull(),
});

export type AecConfig = typeof aecConfig.$inferSelect;
export type InsertAecConfig = typeof aecConfig.$inferInsert;


/**
 * Lab Result Interpretation System
 * Comprehensive lab report management and AI-powered interpretation
 */

/**
 * Lab Reports - Uploaded lab report documents
 */
export const labReports = mysqlTable("lab_reports", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("user_id").notNull(),
  
  // Report metadata
  reportDate: timestamp("report_date").notNull(),
  uploadDate: timestamp("upload_date").defaultNow().notNull(),
  reportName: varchar("report_name", { length: 255 }),
  labName: varchar("lab_name", { length: 255 }),
  orderingPhysician: varchar("ordering_physician", { length: 255 }),
  
  // File storage
  fileUrl: text("file_url").notNull(),
  fileType: varchar("file_type", { length: 50 }),
  fileSize: int("file_size"),
  
  // OCR and extraction
  ocrText: text("ocr_text"),
  extractionStatus: varchar("extraction_status", { length: 50 }).default("pending"),
  extractionError: text("extraction_error"),
  
  // AI interpretation
  overallInterpretation: text("overall_interpretation"),
  riskLevel: varchar("risk_level", { length: 20 }),
  recommendedActions: text("recommended_actions"),
  
  // Status
  status: varchar("status", { length: 50 }).default("uploaded"),
  reviewedBy: int("reviewed_by"),
  reviewedAt: timestamp("reviewed_at"),
  
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().onUpdateNow().notNull(),
});

export type LabReport = typeof labReports.$inferSelect;
export type InsertLabReport = typeof labReports.$inferInsert;

/**
 * Lab Results - Individual test results extracted from reports
 */
export const labResults = mysqlTable("lab_results", {
  id: int("id").autoincrement().primaryKey(),
  reportId: int("report_id").notNull(),
  userId: int("user_id").notNull(),
  
  // Test identification
  testName: varchar("test_name", { length: 255 }).notNull(),
  testCode: varchar("test_code", { length: 100 }),
  testCategory: varchar("test_category", { length: 100 }),
  
  // Result value
  value: varchar("value", { length: 100 }).notNull(),
  numericValue: decimal("numeric_value", { precision: 10, scale: 3 }),
  unit: varchar("unit", { length: 50 }),
  
  // Reference range
  referenceRangeMin: decimal("reference_range_min", { precision: 10, scale: 3 }),
  referenceRangeMax: decimal("reference_range_max", { precision: 10, scale: 3 }),
  referenceRangeText: varchar("reference_range_text", { length: 255 }),
  
  // Status and flags
  status: varchar("status", { length: 20 }).notNull(),
  abnormalFlag: boolean("abnormal_flag").default(false),
  criticalFlag: boolean("critical_flag").default(false),
  
  // AI interpretation
  interpretation: text("interpretation"),
  clinicalSignificance: text("clinical_significance"),
  possibleCauses: text("possible_causes"),
  recommendedFollowUp: text("recommended_follow_up"),
  
  // Metadata
  testDate: timestamp("test_date").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().onUpdateNow().notNull(),
});

export type LabResult = typeof labResults.$inferSelect;
export type InsertLabResult = typeof labResults.$inferInsert;

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
  ageMin: int("age_min"),
  ageMax: int("age_max"),
  gender: varchar("gender", { length: 20 }),
  
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

export type LabReferenceRange = typeof labReferenceRanges.$inferSelect;
export type InsertLabReferenceRange = typeof labReferenceRanges.$inferInsert;

/**
 * Lab Trends - Track changes in lab values over time
 */
export const labTrends = mysqlTable("lab_trends", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("user_id").notNull(),
  testName: varchar("test_name", { length: 255 }).notNull(),
  
  // Trend analysis
  trendDirection: varchar("trend_direction", { length: 20 }),
  percentChange: decimal("percent_change", { precision: 10, scale: 2 }),
  timeSpan: int("time_span"),
  measurementCount: int("measurement_count"),
  
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

export type LabTrend = typeof labTrends.$inferSelect;
export type InsertLabTrend = typeof labTrends.$inferInsert;

/**
 * Processed Webhooks - Prevent duplicate webhook processing (idempotency)
 * Critical for payment systems like Stripe that may send duplicate webhooks
 */
export const processedWebhooks = mysqlTable("processed_webhooks", {
  id: int("id").autoincrement().primaryKey(),
  
  // Webhook identification
  eventId: varchar("event_id", { length: 255 }).notNull().unique(), // Stripe event.id
  eventType: varchar("event_type", { length: 100 }).notNull(), // e.g., "checkout.session.completed"
  
  // Processing metadata
  processedAt: timestamp("processed_at").defaultNow().notNull(),
  processingStatus: mysqlEnum("processing_status", ["success", "failed", "skipped"]).default("success").notNull(),
  errorMessage: text("error_message"), // If processing failed
  
  // Webhook data (for debugging)
  webhookData: text("webhook_data"), // JSON stringified event data
  
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export type ProcessedWebhook = typeof processedWebhooks.$inferSelect;
export type InsertProcessedWebhook = typeof processedWebhooks.$inferInsert;


/**
 * Email Preferences - User notification settings
 */
export const emailPreferences = mysqlTable("email_preferences", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("user_id").notNull().unique(),
  
  // Authentication emails
  welcomeEmails: boolean("welcome_emails").default(true).notNull(),
  verificationEmails: boolean("verification_emails").default(true).notNull(),
  passwordResetEmails: boolean("password_reset_emails").default(true).notNull(),
  securityAlerts: boolean("security_alerts").default(true).notNull(),
  
  // Medical notification emails
  appointmentConfirmations: boolean("appointment_confirmations").default(true).notNull(),
  appointmentReminders: boolean("appointment_reminders").default(true).notNull(),
  appointmentReminderFrequency: mysqlEnum("appointment_reminder_frequency", ["instant", "daily", "weekly", "off"]).default("instant").notNull(),
  
  medicationReminders: boolean("medication_reminders").default(true).notNull(),
  medicationReminderFrequency: mysqlEnum("medication_reminder_frequency", ["instant", "daily", "weekly", "off"]).default("instant").notNull(),
  
  labResultNotifications: boolean("lab_result_notifications").default(true).notNull(),
  criticalLabAlerts: boolean("critical_lab_alerts").default(true).notNull(), // Always instant
  
  // Messaging notification emails
  newMessageNotifications: boolean("new_message_notifications").default(true).notNull(),
  messageNotificationFrequency: mysqlEnum("message_notification_frequency", ["instant", "daily", "weekly", "off"]).default("instant").notNull(),
  unreadMessageDigest: boolean("unread_message_digest").default(false).notNull(),
  
  // Transactional emails
  subscriptionConfirmations: boolean("subscription_confirmations").default(true).notNull(),
  paymentReceipts: boolean("payment_receipts").default(true).notNull(),
  invoiceEmails: boolean("invoice_emails").default(true).notNull(),
  subscriptionExpiryWarnings: boolean("subscription_expiry_warnings").default(true).notNull(),
  paymentFailureAlerts: boolean("payment_failure_alerts").default(true).notNull(),
  
  // Quiet hours
  quietHoursEnabled: boolean("quiet_hours_enabled").default(false).notNull(),
  quietHoursStart: varchar("quiet_hours_start", { length: 5 }).default("22:00"), // HH:MM format
  quietHoursEnd: varchar("quiet_hours_end", { length: 5 }).default("08:00"), // HH:MM format
  
  // Bulk controls
  allEmailsEnabled: boolean("all_emails_enabled").default(true).notNull(),
  marketingEmails: boolean("marketing_emails").default(false).notNull(),
  
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().onUpdateNow().notNull(),
});

export type EmailPreferences = typeof emailPreferences.$inferSelect;
export type InsertEmailPreferences = typeof emailPreferences.$inferInsert;

/**
 * User Settings - General application preferences
 */
export const userSettings = mysqlTable("user_settings", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("user_id").notNull().unique(),
  
  // Language and localization
  language: mysqlEnum("language", ["en", "ar"]).default("ar").notNull(),
  timezone: varchar("timezone", { length: 50 }).default("Asia/Baghdad").notNull(),
  dateFormat: varchar("date_format", { length: 20 }).default("DD/MM/YYYY").notNull(),
  timeFormat: mysqlEnum("time_format", ["12h", "24h"]).default("24h").notNull(),
  
  // Notification preferences (in-app)
  desktopNotifications: boolean("desktop_notifications").default(true).notNull(),
  soundNotifications: boolean("sound_notifications").default(true).notNull(),
  
  // Privacy settings
  profileVisibility: mysqlEnum("profile_visibility", ["public", "private", "doctors_only"]).default("doctors_only").notNull(),
  showOnlineStatus: boolean("show_online_status").default(true).notNull(),
  
  // Doctor-specific settings
  autoAcceptPatients: boolean("auto_accept_patients").default(false).notNull(),
  maxDailyConsultations: int("max_daily_consultations").default(20),
  consultationDuration: int("consultation_duration").default(30), // minutes
  
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().onUpdateNow().notNull(),
});

export type UserSettings = typeof userSettings.$inferSelect;
export type InsertUserSettings = typeof userSettings.$inferInsert;

/**
 * Account Activity - Login history and statistics
 */
export const accountActivity = mysqlTable("account_activity", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("user_id").notNull(),
  
  // Activity type
  activityType: mysqlEnum("activity_type", [
    "login", "logout", "password_change", "email_change", 
    "profile_update", "settings_change", "failed_login"
  ]).notNull(),
  
  // Activity details
  ipAddress: varchar("ip_address", { length: 45 }), // IPv6 support
  userAgent: text("user_agent"),
  deviceType: varchar("device_type", { length: 50 }), // mobile, desktop, tablet
  browser: varchar("browser", { length: 100 }),
  location: varchar("location", { length: 255 }), // City, Country
  
  // Success/failure
  success: boolean("success").default(true).notNull(),
  failureReason: text("failure_reason"),
  
  // Metadata
  metadata: text("metadata"), // JSON for additional data
  
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export type AccountActivity = typeof accountActivity.$inferSelect;
export type InsertAccountActivity = typeof accountActivity.$inferInsert;

/**
 * Epidemiology Events - Privacy-preserving disease tracking
 * Used by Avicenna-X for Bayesian epidemiology updates and disease heatmaps
 * NO user_id to preserve privacy (HIPAA/GDPR compliance)
 */
export const epidemiologyEvents = mysqlTable("epidemiology_events", {
  id: int("id").autoincrement().primaryKey(),
  
  // Location data (city-level only for privacy)
  city: varchar("city", { length: 100 }),
  country: varchar("country", { length: 100 }).default("Iraq"),
  latitude: decimal("latitude", { precision: 10, scale: 7 }),
  longitude: decimal("longitude", { precision: 10, scale: 7 }),
  
  // Symptom vector (normalized 0-1 for Bayesian analysis)
  // Stored as JSON array: [fever_intensity, cough_intensity, fatigue_intensity, ...]
  symptomVector: text("symptom_vector").notNull(),
  
  // Suspected condition (from BRAIN analysis)
  suspectedCondition: varchar("condition", { length: 255 }),
  conditionConfidence: decimal("condition_confidence", { precision: 5, scale: 2 }), // 0-100%
  
  // Urgency level for spike detection
  urgencyLevel: mysqlEnum("urgency_level", ["low", "moderate", "high", "emergency"]),
  
  // Environmental context (for correlation analysis)
  temperature: decimal("temperature", { precision: 5, scale: 2 }), // Celsius
  humidity: decimal("humidity", { precision: 5, scale: 2 }), // Percentage
  airQualityIndex: int("air_quality_index"),
  
  // Temporal data
  timestamp: timestamp("created_at").defaultNow().notNull(),
  
  // Metadata for analysis
  ageGroup: varchar("age_group", { length: 20 }), // "0-10", "11-20", etc. (not exact age)
  gender: mysqlEnum("gender", ["male", "female", "other", "unknown"]),
  
  // Data quality flags
  dataSource: varchar("data_source", { length: 50 }).default("avicenna_triage"), // triage, lab, imaging
  verified: boolean("verified").default(false), // true if confirmed by doctor
});

export type EpidemiologyEvent = typeof epidemiologyEvents.$inferSelect;
export type InsertEpidemiologyEvent = typeof epidemiologyEvents.$inferInsert;

/**
 * Patient Vitals - Camera-based vital signs monitoring (Optic-Vitals)
 * Uses rPPG (remote photoplethysmography) to measure heart rate from camera
 */
export const patientVitals = mysqlTable("patient_vitals", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("user_id").notNull(),
  
  // Vital signs measurements
  heartRate: int("heart_rate"), // BPM (beats per minute)
  respirationRate: int("respiration_rate"), // Breaths per minute
  oxygenSaturation: int("oxygen_saturation"), // SpO2 percentage (estimated)
  stressLevel: varchar("stress_level", { length: 20 }), // "LOW", "NORMAL", "HIGH" based on HRV
  
  // HRV (Heart Rate Variability) metrics for stress and ANS assessment
  hrvRmssd: decimal("hrv_rmssd", { precision: 10, scale: 2 }), // Root Mean Square of Successive Differences (ms)
  hrvSdnn: decimal("hrv_sdnn", { precision: 10, scale: 2 }), // Standard Deviation of NN intervals (ms)
  hrvPnn50: decimal("hrv_pnn50", { precision: 10, scale: 2 }), // Percentage of NN intervals > 50ms different (%)
  hrvLfHfRatio: decimal("hrv_lf_hf_ratio", { precision: 10, scale: 2 }), // Low Frequency / High Frequency ratio
  hrvStressScore: int("hrv_stress_score"), // 0-100 (0=relaxed, 100=highly stressed)
  hrvAnsBalance: varchar("hrv_ans_balance", { length: 30 }), // "PARASYMPATHETIC", "BALANCED", "SYMPATHETIC"
  
  // Measurement quality
  confidenceScore: int("confidence_score"), // 0-100% (how steady was the camera?)
  measurementMethod: varchar("method", { length: 50 }).default("OPTIC_CAMERA"),
  measurementDuration: int("measurement_duration"), // in seconds
  
  // Metadata
  deviceInfo: text("device_info"), // JSON: browser, camera resolution, etc.
  environmentalFactors: text("environmental_factors"), // JSON: lighting, movement, etc.
  
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export type PatientVital = typeof patientVitals.$inferSelect;
export type InsertPatientVital = typeof patientVitals.$inferInsert;

/**
 * Bio-Scanner Calibration - User-specific correction factors
 * Allows users to calibrate camera-based readings against reference devices
 */
export const bioScannerCalibration = mysqlTable("bio_scanner_calibration", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("user_id").notNull().unique(), // One calibration per user
  
  // Calibration data
  referenceHeartRate: int("reference_heart_rate").notNull(), // From pulse oximeter or other device
  measuredHeartRate: int("measured_heart_rate").notNull(), // From Bio-Scanner
  correctionFactor: decimal("correction_factor", { precision: 10, scale: 4 }).notNull(), // referenceHeartRate / measuredHeartRate
  
  // Metadata
  calibrationDate: timestamp("calibration_date").defaultNow().notNull(),
  referenceDevice: varchar("reference_device", { length: 100 }), // e.g., "Pulse Oximeter", "Apple Watch"
  notes: text("notes"),
  
  updatedAt: timestamp("updated_at").defaultNow().onUpdateNow().notNull(),
});

export type BioScannerCalibration = typeof bioScannerCalibration.$inferSelect;
export type InsertBioScannerCalibration = typeof bioScannerCalibration.$inferInsert;

// ============================================================================
// AVICENNA-X: RESOURCE AUCTION ALGORITHM
// ============================================================================

/**
 * Doctor performance metrics for resource auction algorithm
 * Tracks historical performance to score doctors
 */
export const doctorPerformanceMetrics = mysqlTable("doctor_performance_metrics", {
  id: int("id").autoincrement().primaryKey(),
  doctorId: int("doctor_id").notNull().unique(),
  
  // Consultation statistics
  totalConsultations: int("total_consultations").default(0).notNull(),
  successfulConsultations: int("successful_consultations").default(0).notNull(),
  cancelledConsultations: int("cancelled_consultations").default(0).notNull(),
  
  // Response metrics
  avgResponseTime: int("avg_response_time").default(180).notNull(), // seconds
  avgConsultationDuration: int("avg_consultation_duration").default(20).notNull(), // minutes
  
  // Patient satisfaction
  patientSatisfactionAvg: decimal("patient_satisfaction_avg", { precision: 3, scale: 2 }).default("4.20").notNull(), // 0-5 scale
  totalRatings: int("total_ratings").default(0).notNull(),
  
  // Specialty-specific success rates (JSON)
  specialtySuccessRates: text("specialty_success_rates").notNull(), // { "cardiology": 0.95, "internal medicine": 0.92 }
  
  // Availability metrics
  avgDailyAvailableHours: decimal("avg_daily_available_hours", { precision: 4, scale: 2 }).default("8.00").notNull(),
  totalOnlineHours: int("total_online_hours").default(0).notNull(),
  
  // Quality indicators
  followUpRate: decimal("follow_up_rate", { precision: 3, scale: 2 }).default("0.80").notNull(), // 0-1
  prescriptionAccuracyRate: decimal("prescription_accuracy_rate", { precision: 3, scale: 2 }).default("0.95").notNull(), // 0-1
  
  lastUpdated: timestamp("last_updated").defaultNow().onUpdateNow().notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export type DoctorPerformanceMetric = typeof doctorPerformanceMetrics.$inferSelect;
export type InsertDoctorPerformanceMetric = typeof doctorPerformanceMetrics.$inferInsert;

/**
 * Network quality logs for telemedicine readiness scoring
 * Tracks connection quality for each doctor
 */
export const networkQualityLogs = mysqlTable("network_quality_logs", {
  id: int("id").autoincrement().primaryKey(),
  doctorId: int("doctor_id").notNull(),
  
  // Connection metrics
  latency: int("latency").notNull(), // milliseconds
  bandwidth: decimal("bandwidth", { precision: 6, scale: 2 }).notNull(), // Mbps
  packetLoss: decimal("packet_loss", { precision: 5, scale: 4 }).default("0.0000").notNull(), // 0-1
  jitter: int("jitter").default(0).notNull(), // milliseconds
  
  // Connection quality assessment
  quality: mysqlEnum("quality", ["EXCELLENT", "GOOD", "FAIR", "POOR"]).notNull(),
  
  // Session information
  consultationId: int("consultation_id"), // null if standalone test
  sessionDuration: int("session_duration"), // seconds
  disconnectionCount: int("disconnection_count").default(0).notNull(),
  
  // Device/network info
  deviceType: varchar("device_type", { length: 50 }), // "desktop", "mobile", "tablet"
  networkType: varchar("network_type", { length: 50 }), // "wifi", "4g", "5g", "ethernet"
  
  measuredAt: timestamp("measured_at").defaultNow().notNull(),
});

export type NetworkQualityLog = typeof networkQualityLogs.$inferSelect;
export type InsertNetworkQualityLog = typeof networkQualityLogs.$inferInsert;

/**
 * Aggregated network quality metrics per doctor
 * Pre-computed for faster auction algorithm execution
 */
export const networkQualityMetrics = mysqlTable("network_quality_metrics", {
  id: int("id").autoincrement().primaryKey(),
  doctorId: int("doctor_id").notNull().unique(),
  
  // Aggregated metrics (last 30 days)
  avgLatency: int("avg_latency").notNull(), // milliseconds
  avgBandwidth: decimal("avg_bandwidth", { precision: 6, scale: 2 }).notNull(), // Mbps
  connectionDropRate: decimal("connection_drop_rate", { precision: 5, scale: 4 }).default("0.0000").notNull(), // 0-1
  avgJitter: int("avg_jitter").default(0).notNull(), // milliseconds
  
  // Quality distribution
  excellentCount: int("excellent_count").default(0).notNull(),
  goodCount: int("good_count").default(0).notNull(),
  fairCount: int("fair_count").default(0).notNull(),
  poorCount: int("poor_count").default(0).notNull(),
  
  // Current status
  lastConnectionQuality: mysqlEnum("last_connection_quality", ["EXCELLENT", "GOOD", "FAIR", "POOR"]).notNull(),
  measurementCount: int("measurement_count").default(0).notNull(),
  
  lastMeasured: timestamp("last_measured").defaultNow().notNull(),
  lastUpdated: timestamp("last_updated").defaultNow().onUpdateNow().notNull(),
});

export type NetworkQualityMetric = typeof networkQualityMetrics.$inferSelect;
export type InsertNetworkQualityMetric = typeof networkQualityMetrics.$inferInsert;

/**
 * Wearable device connections
 * Tracks which wearable devices are connected to each user
 */
export const wearableConnections = mysqlTable("wearable_connections", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("user_id").notNull(),
  
  // Device information
  deviceType: mysqlEnum("device_type", ["apple_watch", "fitbit"]).notNull(),
  deviceId: varchar("device_id", { length: 255 }).notNull(), // External device identifier
  deviceName: varchar("device_name", { length: 255 }), // User-friendly name
  deviceModel: varchar("device_model", { length: 100 }), // e.g., "Apple Watch Series 8", "Fitbit Charge 5"
  
  // Connection status
  status: mysqlEnum("status", ["active", "disconnected", "error"]).default("active").notNull(),
  lastSyncAt: timestamp("last_sync_at"),
  
  // OAuth tokens (encrypted)
  accessToken: text("access_token"), // Encrypted OAuth access token
  refreshToken: text("refresh_token"), // Encrypted OAuth refresh token
  tokenExpiresAt: timestamp("token_expires_at"),
  
  // Sync settings
  syncEnabled: boolean("sync_enabled").default(true).notNull(),
  syncFrequency: int("sync_frequency").default(3600).notNull(), // seconds, default 1 hour
  
  // Data type preferences (JSON array of enabled metrics)
  enabledMetrics: text("enabled_metrics").notNull(), // ["heart_rate", "steps", "sleep", "blood_oxygen", "hrv"]
  
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().onUpdateNow().notNull(),
});

export type WearableConnection = typeof wearableConnections.$inferSelect;
export type InsertWearableConnection = typeof wearableConnections.$inferInsert;

/**
 * Wearable data points
 * Stores time-series health metrics from wearable devices
 */
export const wearableDataPoints = mysqlTable("wearable_data_points", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("user_id").notNull(),
  connectionId: int("connection_id").notNull(), // FK to wearable_connections
  
  // Metric information
  metricType: mysqlEnum("metric_type", [
    "heart_rate",
    "steps",
    "distance",
    "calories",
    "active_minutes",
    "sleep_duration",
    "sleep_quality",
    "blood_oxygen",
    "hrv",
    "resting_heart_rate",
    "blood_pressure_systolic",
    "blood_pressure_diastolic",
    "respiratory_rate",
    "body_temperature",
    "weight",
    "bmi"
  ]).notNull(),
  
  // Data value
  value: decimal("value", { precision: 10, scale: 2 }).notNull(),
  unit: varchar("unit", { length: 50 }).notNull(), // "bpm", "steps", "km", "kcal", "minutes", "hours", "%", "mmHg", "breaths/min", "°C", "kg"
  
  // Timestamp (when the measurement was taken, not when it was synced)
  measuredAt: timestamp("measured_at").notNull(),
  
  // Context and quality
  confidence: decimal("confidence", { precision: 3, scale: 2 }).default("1.00").notNull(), // 0-1, data quality score
  context: text("context"), // JSON: {"activity": "sleeping", "location": "home", "device_battery": 85}
  
  // Source tracking
  sourceDevice: varchar("source_device", { length: 100 }).notNull(), // "Apple Watch Series 8", "Fitbit Charge 5"
  sourceApp: varchar("source_app", { length: 100 }), // "Health", "Fitbit", "Strava"
  
  // Sync metadata
  syncedAt: timestamp("synced_at").defaultNow().notNull(),
  externalId: varchar("external_id", { length: 255 }), // Original ID from wearable API
  
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export type WearableDataPoint = typeof wearableDataPoints.$inferSelect;
export type InsertWearableDataPoint = typeof wearableDataPoints.$inferInsert;

/**
 * Aggregated wearable metrics
 * Pre-computed daily/weekly summaries for faster Context Vector queries
 */
export const wearableMetricsSummary = mysqlTable("wearable_metrics_summary", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("user_id").notNull(),
  
  // Time period
  periodType: mysqlEnum("period_type", ["daily", "weekly", "monthly"]).notNull(),
  periodStart: date("period_start").notNull(),
  periodEnd: date("period_end").notNull(),
  
  // Heart rate metrics
  avgHeartRate: decimal("avg_heart_rate", { precision: 5, scale: 2 }),
  minHeartRate: int("min_heart_rate"),
  maxHeartRate: int("max_heart_rate"),
  restingHeartRate: int("resting_heart_rate"),
  avgHRV: decimal("avg_hrv", { precision: 6, scale: 2 }), // Heart Rate Variability in ms
  
  // Activity metrics
  totalSteps: int("total_steps"),
  totalDistance: decimal("total_distance", { precision: 8, scale: 2 }), // km
  totalCalories: int("total_calories"),
  totalActiveMinutes: int("total_active_minutes"),
  
  // Sleep metrics
  avgSleepDuration: decimal("avg_sleep_duration", { precision: 4, scale: 2 }), // hours
  avgSleepQuality: decimal("avg_sleep_quality", { precision: 3, scale: 2 }), // 0-100 score
  
  // Respiratory metrics
  avgBloodOxygen: decimal("avg_blood_oxygen", { precision: 5, scale: 2 }), // %
  avgRespiratoryRate: decimal("avg_respiratory_rate", { precision: 4, scale: 2 }), // breaths/min
  
  // Blood pressure (if available)
  avgSystolic: int("avg_systolic"),
  avgDiastolic: int("avg_diastolic"),
  
  // Body metrics
  avgWeight: decimal("avg_weight", { precision: 5, scale: 2 }), // kg
  avgBMI: decimal("avg_bmi", { precision: 4, scale: 2 }),
  avgBodyTemp: decimal("avg_body_temp", { precision: 4, scale: 2 }), // °C
  
  // Data quality
  dataCompleteness: decimal("data_completeness", { precision: 3, scale: 2 }).default("1.00").notNull(), // 0-1
  measurementCount: int("measurement_count").default(0).notNull(),
  
  // Anomalies detected (JSON array)
  anomalies: text("anomalies"), // [{"type": "elevated_heart_rate", "severity": "moderate", "timestamp": "..."}]
  
  lastUpdated: timestamp("last_updated").defaultNow().onUpdateNow().notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export type WearableMetricsSummary = typeof wearableMetricsSummary.$inferSelect;
export type InsertWearableMetricsSummary = typeof wearableMetricsSummary.$inferInsert;

/**
 * Weather conditions
 * Stores historical weather data including barometric pressure
 */
export const weatherConditions = mysqlTable("weather_conditions", {
  id: int("id").autoincrement().primaryKey(),
  
  // Location
  latitude: decimal("latitude", { precision: 10, scale: 7 }).notNull(),
  longitude: decimal("longitude", { precision: 10, scale: 7 }).notNull(),
  cityName: varchar("city_name", { length: 255 }),
  countryCode: varchar("country_code", { length: 2 }),
  
  // Weather metrics
  pressure: decimal("pressure", { precision: 6, scale: 2 }).notNull(), // millibars (hPa)
  temperature: decimal("temperature", { precision: 5, scale: 2 }), // Celsius
  humidity: int("humidity"), // percentage
  weatherCondition: varchar("weather_condition", { length: 100 }), // clear, rain, storm, etc.
  windSpeed: decimal("wind_speed", { precision: 5, scale: 2 }), // m/s
  
  // Pressure change metrics
  pressureChange1h: decimal("pressure_change_1h", { precision: 5, scale: 2 }), // mb/hour
  pressureChange3h: decimal("pressure_change_3h", { precision: 5, scale: 2 }), // mb/3hours
  pressureChange24h: decimal("pressure_change_24h", { precision: 5, scale: 2 }), // mb/day
  
  // Data source
  source: varchar("source", { length: 50 }).default("openweather").notNull(),
  externalId: varchar("external_id", { length: 255 }), // API-specific ID
  
  // Timestamps
  observedAt: timestamp("observed_at").notNull(), // When weather was observed
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export type WeatherCondition = typeof weatherConditions.$inferSelect;
export type InsertWeatherCondition = typeof weatherConditions.$inferInsert;

/**
 * Pressure sensitive conditions
 * Medical conditions known to be triggered by barometric pressure changes
 */
export const pressureSensitiveConditions = mysqlTable("pressure_sensitive_conditions", {
  id: int("id").autoincrement().primaryKey(),
  
  conditionName: varchar("condition_name", { length: 255 }).notNull(),
  category: mysqlEnum("category", [
    "migraine",
    "headache",
    "joint_pain",
    "arthritis",
    "respiratory",
    "cardiovascular",
    "neurological",
    "other"
  ]).notNull(),
  
  // Trigger thresholds
  pressureDropThreshold: decimal("pressure_drop_threshold", { precision: 5, scale: 2 }), // mb drop that triggers
  pressureRiseThreshold: decimal("pressure_rise_threshold", { precision: 5, scale: 2 }), // mb rise that triggers
  changeVelocityThreshold: decimal("change_velocity_threshold", { precision: 5, scale: 2 }), // mb/hour
  
  // Symptom information
  commonSymptoms: text("common_symptoms"), // JSON array
  severityFactors: text("severity_factors"), // JSON array
  
  // Clinical information
  description: text("description"),
  prevalence: varchar("prevalence", { length: 50 }), // common, uncommon, rare
  evidenceLevel: varchar("evidence_level", { length: 10 }), // A, B, C (clinical evidence strength)
  
  // References
  references: text("references"), // JSON array of medical sources
  
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().onUpdateNow().notNull(),
});

export type PressureSensitiveCondition = typeof pressureSensitiveConditions.$inferSelect;
export type InsertPressureSensitiveCondition = typeof pressureSensitiveConditions.$inferInsert;

/**
 * Patient pressure sensitivity tracking
 * Tracks individual patient sensitivity to barometric pressure changes
 */
export const patientPressureSensitivity = mysqlTable("patient_pressure_sensitivity", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("user_id").notNull(),
  conditionId: int("condition_id").notNull(), // FK to pressure_sensitive_conditions
  
  // Sensitivity profile
  confirmed: boolean("confirmed").default(false).notNull(), // Doctor-confirmed vs self-reported
  sensitivity: mysqlEnum("sensitivity", ["low", "moderate", "high", "severe"]).default("moderate").notNull(),
  
  // Trigger patterns (learned from patient history)
  typicalDropTrigger: decimal("typical_drop_trigger", { precision: 5, scale: 2 }), // mb
  typicalRiseTrigger: decimal("typical_rise_trigger", { precision: 5, scale: 2 }), // mb
  typicalOnsetDelay: int("typical_onset_delay"), // minutes from pressure change to symptoms
  
  // Symptom tracking
  lastSymptomDate: date("last_symptom_date"),
  symptomFrequency: int("symptom_frequency"), // episodes per month
  averageSeverity: int("average_severity"), // 1-10 scale
  
  // Notes
  notes: text("notes"),
  managementStrategies: text("management_strategies"), // JSON array
  
  // Metadata
  firstReportedAt: timestamp("first_reported_at").defaultNow().notNull(),
  lastUpdated: timestamp("last_updated").defaultNow().onUpdateNow().notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export type PatientPressureSensitivity = typeof patientPressureSensitivity.$inferSelect;
export type InsertPatientPressureSensitivity = typeof patientPressureSensitivity.$inferInsert;

/**
 * Pressure symptom events
 * Records when patients experience pressure-triggered symptoms
 */
export const pressureSymptomEvents = mysqlTable("pressure_symptom_events", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("user_id").notNull(),
  sensitivityId: int("sensitivity_id").notNull(), // FK to patient_pressure_sensitivity
  weatherId: int("weather_id"), // FK to weather_conditions (optional)
  
  // Event details
  symptomOnset: timestamp("symptom_onset").notNull(),
  symptomResolution: timestamp("symptom_resolution"),
  severity: int("severity").notNull(), // 1-10 scale
  
  // Weather context at onset
  pressureAtOnset: decimal("pressure_at_onset", { precision: 6, scale: 2 }),
  pressureChange1h: decimal("pressure_change_1h", { precision: 5, scale: 2 }),
  pressureChange3h: decimal("pressure_change_3h", { precision: 5, scale: 2 }),
  temperatureAtOnset: decimal("temperature_at_onset", { precision: 5, scale: 2 }),
  humidityAtOnset: int("humidity_at_onset"),
  
  // Symptoms
  symptoms: text("symptoms"), // JSON array
  
  // Treatment/management
  interventionTaken: text("intervention_taken"),
  interventionEffectiveness: int("intervention_effectiveness"), // 1-10 scale
  
  // Notes
  notes: text("notes"),
  
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export type PressureSymptomEvent = typeof pressureSymptomEvents.$inferSelect;
export type InsertPressureSymptomEvent = typeof pressureSymptomEvents.$inferInsert;

/**
 * Conversation sessions - stores symptom assessment conversations
 * Allows patients to view and resume previous assessments
 */
export const conversationSessions = mysqlTable("conversation_sessions", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("user_id").notNull(),
  
  // Session metadata
  sessionId: varchar("session_id", { length: 100 }).unique().notNull(),
  language: varchar("language", { length: 10 }).default("en").notNull(),
  
  // Status tracking
  status: mysqlEnum("status", ["in_progress", "completed", "abandoned"]).default("in_progress").notNull(),
  
  // Timestamps
  startedAt: timestamp("started_at").defaultNow().notNull(),
  completedAt: timestamp("completed_at"),
  lastActivityAt: timestamp("last_activity_at").defaultNow().notNull(),
  
  // Context preservation
  contextVector: text("context_vector"), // JSON serialized ConversationalContextVector
  
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().onUpdateNow().notNull(),
});

export type ConversationSession = typeof conversationSessions.$inferSelect;
export type InsertConversationSession = typeof conversationSessions.$inferInsert;

/**
 * Conversation messages - stores individual messages in a conversation
 */
export const conversationMessages = mysqlTable("conversation_messages", {
  id: int("id").autoincrement().primaryKey(),
  sessionId: int("session_id").notNull(), // FK to conversation_sessions
  
  // Message content
  role: mysqlEnum("role", ["user", "assistant", "system"]).notNull(),
  content: text("content").notNull(),
  contentAr: text("content_ar"), // Arabic translation if applicable
  
  // Metadata
  timestamp: timestamp("timestamp").defaultNow().notNull(),
  tokenCount: int("token_count"),
  
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export type ConversationMessage = typeof conversationMessages.$inferSelect;
export type InsertConversationMessage = typeof conversationMessages.$inferInsert;

/**
 * Conversation results - stores final BRAIN assessment results
 */
export const conversationResults = mysqlTable("conversation_results", {
  id: int("id").autoincrement().primaryKey(),
  sessionId: int("session_id").notNull().unique(), // FK to conversation_sessions
  
  // BRAIN assessment results
  brainCaseId: varchar("brain_case_id", { length: 100 }),
  triageLevel: mysqlEnum("triage_level", ["green", "yellow", "red"]).notNull(),
  urgency: varchar("urgency", { length: 50 }).notNull(),
  
  // Diagnosis
  primaryDiagnosis: varchar("primary_diagnosis", { length: 255 }),
  diagnosisProbability: decimal("diagnosis_probability", { precision: 5, scale: 4 }),
  differentialDiagnosis: text("differential_diagnosis"), // JSON array
  
  // Recommendations
  recommendations: text("recommendations"), // JSON array
  redFlags: text("red_flags"), // JSON array
  immediateActions: text("immediate_actions"), // JSON array
  specialistReferral: varchar("specialist_referral", { length: 255 }),
  
  // Avicenna-X resource matching
  matchedDoctorId: int("matched_doctor_id"),
  matchedClinicId: int("matched_clinic_id"),
  matchScore: decimal("match_score", { precision: 5, scale: 4 }),
  estimatedWaitTime: int("estimated_wait_time"), // minutes
  
  // Deep links
  googleMapsLink: varchar("google_maps_link", { length: 512 }),
  uberLink: varchar("uber_link", { length: 512 }),
  
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export type ConversationResult = typeof conversationResults.$inferSelect;
export type InsertConversationResult = typeof conversationResults.$inferInsert;

/**
 * Emergency alerts - stores critical red flag notifications
 */
export const emergencyAlerts = mysqlTable("emergency_alerts", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("user_id").notNull(),
  sessionId: int("session_id"), // FK to conversation_sessions (optional)
  
  // Alert details
  severity: mysqlEnum("severity", ["critical", "high", "medium"]).default("high").notNull(),
  alertType: varchar("alert_type", { length: 100 }).notNull(), // e.g., "chest_pain", "stroke_symptoms"
  redFlags: text("red_flags").notNull(), // JSON array of detected red flags
  
  // Notification status
  notificationSent: boolean("notification_sent").default(false).notNull(),
  notificationMethod: varchar("notification_method", { length: 50 }), // "push", "email", "sms"
  notificationSentAt: timestamp("notification_sent_at"),
  
  // User response
  userAcknowledged: boolean("user_acknowledged").default(false).notNull(),
  acknowledgedAt: timestamp("acknowledged_at"),
  userAction: varchar("user_action", { length: 255 }), // "called_emergency", "went_to_hospital", "dismissed"
  
  // Follow-up
  followUpRequired: boolean("follow_up_required").default(false).notNull(),
  followUpCompletedAt: timestamp("follow_up_completed_at"),
  
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export type EmergencyAlert = typeof emergencyAlerts.$inferSelect;
export type InsertEmergencyAlert = typeof emergencyAlerts.$inferInsert;

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

/**
 * Orchestration logs table - tracks system operations and AI workflows
 * Enables debugging, monitoring, and performance analysis
 */
export const orchestrationLogs = mysqlTable("orchestration_logs", {
  id: int("id").autoincrement().primaryKey(),
  
  // Request tracking
  requestId: varchar("request_id", { length: 255 }).notNull(), // Unique request identifier
  userId: int("user_id"), // null for system operations
  sessionId: varchar("session_id", { length: 255 }), // Optional session identifier
  
  // Operation details
  operation: varchar("operation", { length: 255 }).notNull(), // e.g., "brain_analysis", "image_processing"
  module: varchar("module", { length: 100 }).notNull(), // e.g., "brain", "pharma_guard"
  action: varchar("action", { length: 100 }).notNull(), // e.g., "analyze", "process", "validate"
  
  // Status tracking
  status: mysqlEnum("status", ["started", "in_progress", "completed", "failed", "cancelled"]).default("started").notNull(),
  
  // Timing
  startTime: timestamp("start_time").notNull(),
  endTime: timestamp("end_time"),
  durationMs: int("duration_ms"), // Duration in milliseconds
  
  // Input/Output
  inputData: text("input_data"), // JSON stringified input
  outputData: text("output_data"), // JSON stringified output
  
  // Error handling
  errorMessage: text("error_message"),
  errorStack: text("error_stack"),
  errorCode: varchar("error_code", { length: 50 }),
  
  // Performance metrics
  memoryUsageMb: decimal("memory_usage_mb", { precision: 10, scale: 2 }),
  cpuUsagePercent: decimal("cpu_usage_percent", { precision: 5, scale: 2 }),
  
  // Nested operations (for tracking sub-operations)
  parentRequestId: varchar("parent_request_id", { length: 255 }), // FK to parent operation
  depth: int("depth").default(0), // Nesting depth
  
  // Additional metadata
  metadata: text("metadata"), // JSON object for additional tracking data
  tags: text("tags"), // JSON array of tags for filtering
  
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export type OrchestrationLog = typeof orchestrationLogs.$inferSelect;
export type InsertOrchestrationLog = typeof orchestrationLogs.$inferInsert;

/**
 * ============================================================================
 * MEDICAL KNOWLEDGE SYSTEM
 * ============================================================================
 * Comprehensive medical knowledge database adapted for Iraqi healthcare context.
 * Replaces brain-embedded knowledge with maintainable, auditable, and scalable
 * database-backed knowledge.
 */

/**
 * Diseases Database
 * Comprehensive disease information with Iraqi context
 */
export const diseases = mysqlTable("diseases", {
  id: int("id").autoincrement().primaryKey(),
  icdCode: varchar("icd_code", { length: 20 }).notNull().unique(), // ICD-10 or ICD-11 code
  nameEn: varchar("name_en", { length: 500 }).notNull(),
  nameAr: varchar("name_ar", { length: 500 }).notNull(),
  localName: varchar("local_name", { length: 500 }), // Common Iraqi/Arabic colloquial name
  category: varchar("category", { length: 100 }).notNull(), // infectious, chronic, acute, etc.
  prevalenceIraq: mysqlEnum("prevalence_iraq", ["high", "medium", "low", "rare"]),
  description: text("description").notNull(),
  symptoms: text("symptoms").notNull(), // JSON array of symptom IDs
  riskFactors: text("risk_factors"), // JSON array
  complications: text("complications"), // JSON array
  differentialDiagnosis: text("differential_diagnosis"), // JSON array of disease IDs
  redFlags: text("red_flags"), // JSON array of red flag IDs
  treatmentProtocol: text("treatment_protocol"), // JSON object
  prognosis: text("prognosis"),
  preventionMeasures: text("prevention_measures"), // JSON array
  specialConsiderations: text("special_considerations"), // Iraqi-specific considerations
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().onUpdateNow().notNull(),
  version: int("version").notNull().default(1),
});

export type Disease = typeof diseases.$inferSelect;
export type InsertDisease = typeof diseases.$inferInsert;

/**
 * Medications Knowledge Database
 * Comprehensive medication information with Iraqi availability
 * Extends the basic medications table with detailed clinical information
 */
export const medicationsKnowledge = mysqlTable("medications_knowledge", {
  id: int("id").autoincrement().primaryKey(),
  genericName: varchar("generic_name", { length: 500 }).notNull(),
  brandNames: text("brand_names"), // JSON array of brand names available in Iraq
  nameAr: varchar("name_ar", { length: 500 }).notNull(),
  drugClass: varchar("drug_class", { length: 200 }).notNull(),
  mechanism: text("mechanism"),
  indications: text("indications").notNull(), // JSON array
  contraindications: text("contraindications"), // JSON array
  sideEffects: text("side_effects"), // JSON array
  interactions: text("interactions"), // JSON array of drug IDs
  dosageAdult: text("dosage_adult"),
  dosagePediatric: text("dosage_pediatric"),
  dosageElderly: text("dosage_elderly"),
  routeOfAdministration: varchar("route_of_administration", { length: 100 }), // oral, IV, IM, etc.
  availabilityIraq: mysqlEnum("availability_iraq", ["widely_available", "limited", "rare", "not_available"]).notNull(),
  approximateCost: varchar("approximate_cost", { length: 200 }), // price range in IQD
  requiresPrescription: boolean("requires_prescription").notNull(),
  pregnancyCategory: varchar("pregnancy_category", { length: 10 }),
  lactationSafety: varchar("lactation_safety", { length: 100 }),
  renalAdjustment: text("renal_adjustment"),
  hepaticAdjustment: text("hepatic_adjustment"),
  monitoringRequired: text("monitoring_required"), // JSON array
  specialInstructions: text("special_instructions"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().onUpdateNow().notNull(),
  version: int("version").notNull().default(1),
});

export type MedicationKnowledge = typeof medicationsKnowledge.$inferSelect;
export type InsertMedicationKnowledge = typeof medicationsKnowledge.$inferInsert;

/**
 * Symptoms Database
 * Comprehensive symptom catalog with severity indicators
 */
export const symptoms = mysqlTable("symptoms", {
  id: int("id").autoincrement().primaryKey(),
  nameEn: varchar("name_en", { length: 500 }).notNull().unique(),
  nameAr: varchar("name_ar", { length: 500 }).notNull(),
  localName: varchar("local_name", { length: 500 }), // Common Iraqi description
  category: varchar("category", { length: 100 }).notNull(), // pain, respiratory, neurological, etc.
  description: text("description"),
  severityIndicators: text("severity_indicators"), // JSON object: mild, moderate, severe
  associatedConditions: text("associated_conditions"), // JSON array of disease IDs
  redFlagSymptom: boolean("red_flag_symptom").notNull().default(false),
  urgencyLevel: mysqlEnum("urgency_level", ["routine", "urgent", "emergency"]),
  commonInIraq: boolean("common_in_iraq").notNull().default(true),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().onUpdateNow().notNull(),
});

export type Symptom = typeof symptoms.$inferSelect;
export type InsertSymptom = typeof symptoms.$inferInsert;

/**
 * Medical Procedures Database
 * Procedures available in Iraqi healthcare system
 */
export const procedures = mysqlTable("procedures", {
  id: int("id").autoincrement().primaryKey(),
  cptCode: varchar("cpt_code", { length: 20 }), // CPT code if applicable
  nameEn: varchar("name_en", { length: 500 }).notNull(),
  nameAr: varchar("name_ar", { length: 500 }).notNull(),
  category: varchar("category", { length: 100 }).notNull(), // diagnostic, therapeutic, surgical, etc.
  description: text("description").notNull(),
  indications: text("indications"), // JSON array
  contraindications: text("contraindications"), // JSON array
  complications: text("complications"), // JSON array
  preparationRequired: text("preparation_required"),
  procedureSteps: text("procedure_steps"), // JSON array
  postProcedureCare: text("post_procedure_care"),
  recoveryTime: varchar("recovery_time", { length: 200 }),
  availabilityIraq: mysqlEnum("availability_iraq", ["widely_available", "major_cities", "baghdad_only", "not_available"]).notNull(),
  facilityRequirements: text("facility_requirements"), // JSON array of facility type IDs
  approximateCost: varchar("approximate_cost", { length: 200 }), // price range in IQD
  insuranceCoverage: mysqlEnum("insurance_coverage", ["typically_covered", "partial", "not_covered"]),
  specialConsiderations: text("special_considerations"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().onUpdateNow().notNull(),
  version: int("version").notNull().default(1),
});

export type Procedure = typeof procedures.$inferSelect;
export type InsertProcedure = typeof procedures.$inferInsert;

/**
 * Red Flags Database
 * Critical warning signs requiring immediate attention
 */
export const redFlags = mysqlTable("red_flags", {
  id: int("id").autoincrement().primaryKey(),
  nameEn: varchar("name_en", { length: 500 }).notNull(),
  nameAr: varchar("name_ar", { length: 500 }).notNull(),
  category: varchar("category", { length: 100 }).notNull(), // cardiovascular, neurological, respiratory, etc.
  description: text("description").notNull(),
  clinicalSignificance: text("clinical_significance").notNull(),
  associatedConditions: text("associated_conditions"), // JSON array of disease IDs
  urgencyLevel: mysqlEnum("urgency_level", ["immediate", "urgent", "semi_urgent"]).notNull(),
  recommendedAction: text("recommended_action").notNull(),
  timeToTreatment: varchar("time_to_treatment", { length: 100 }), // minutes, hours
  facilityRequired: varchar("facility_required", { length: 200 }), // emergency_room, hospital, specialist
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().onUpdateNow().notNull(),
});

export type RedFlag = typeof redFlags.$inferSelect;
export type InsertRedFlag = typeof redFlags.$inferInsert;

/**
 * Healthcare Facility Types
 * Types of healthcare facilities in Iraqi system
 */
export const facilityTypes = mysqlTable("facility_types", {
  id: int("id").autoincrement().primaryKey(),
  nameEn: varchar("name_en", { length: 200 }).notNull().unique(),
  nameAr: varchar("name_ar", { length: 200 }).notNull(),
  description: text("description"),
  capabilities: text("capabilities"), // JSON array of services/procedures
  typicalEquipment: text("typical_equipment"), // JSON array
  staffingRequirements: text("staffing_requirements"), // JSON array
  emergencyCapable: boolean("emergency_capable").notNull(),
  icuCapable: boolean("icu_capable").notNull(),
  surgeryCapable: boolean("surgery_capable").notNull(),
  diagnosticCapabilities: text("diagnostic_capabilities"), // JSON array
  commonInIraq: boolean("common_in_iraq").notNull().default(true),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().onUpdateNow().notNull(),
});

export type FacilityType = typeof facilityTypes.$inferSelect;
export type InsertFacilityType = typeof facilityTypes.$inferInsert;

/**
 * Clinical Guidelines
 * Evidence-based clinical guidelines adapted for Iraqi context
 */
export const clinicalGuidelines = mysqlTable("clinical_guidelines", {
  id: int("id").autoincrement().primaryKey(),
  title: varchar("title", { length: 1000 }).notNull(),
  titleAr: varchar("title_ar", { length: 1000 }).notNull(),
  category: varchar("category", { length: 100 }).notNull(), // diagnosis, treatment, prevention, etc.
  diseaseIds: text("disease_ids"), // JSON array of related disease IDs
  source: varchar("source", { length: 500 }).notNull(), // WHO, ACC/AHA, Iraqi MOH, etc.
  evidenceLevel: mysqlEnum("evidence_level", ["A", "B", "C"]).notNull(),
  recommendation: text("recommendation").notNull(),
  recommendationAr: text("recommendation_ar").notNull(),
  rationale: text("rationale"),
  iraqiAdaptations: text("iraqi_adaptations"), // Modifications for Iraqi context
  implementationConsiderations: text("implementation_considerations"),
  references: text("references"), // JSON array
  lastReviewed: timestamp("last_reviewed"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().onUpdateNow().notNull(),
  version: int("version").notNull().default(1),
});

export type ClinicalGuideline = typeof clinicalGuidelines.$inferSelect;
export type InsertClinicalGuideline = typeof clinicalGuidelines.$inferInsert;

/**
 * Symptom-Disease Associations
 * Mapping between symptoms and diseases with probability weights
 */
export const symptomDiseaseAssociations = mysqlTable("symptom_disease_associations", {
  id: int("id").autoincrement().primaryKey(),
  symptomId: int("symptom_id").notNull(),
  diseaseId: int("disease_id").notNull(),
  associationStrength: float("association_strength").notNull(), // 0.0 to 1.0
  specificity: mysqlEnum("specificity", ["high", "medium", "low"]).notNull(),
  sensitivity: mysqlEnum("sensitivity", ["high", "medium", "low"]).notNull(),
  typicalPresentation: boolean("typical_presentation").notNull().default(true),
  atypicalPresentation: boolean("atypical_presentation").notNull().default(false),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export type SymptomDiseaseAssociation = typeof symptomDiseaseAssociations.$inferSelect;
export type InsertSymptomDiseaseAssociation = typeof symptomDiseaseAssociations.$inferInsert;

/**
 * Drug Interactions
 * Comprehensive drug-drug interaction database
 */
export const drugInteractions = mysqlTable("drug_interactions", {
  id: int("id").autoincrement().primaryKey(),
  drug1Id: int("drug1_id").notNull(),
  drug2Id: int("drug2_id").notNull(),
  severityLevel: mysqlEnum("severity_level", ["major", "moderate", "minor"]).notNull(),
  interactionType: varchar("interaction_type", { length: 200 }).notNull(), // pharmacokinetic, pharmacodynamic
  mechanism: text("mechanism"),
  clinicalEffect: text("clinical_effect").notNull(),
  management: text("management").notNull(),
  references: text("references"), // JSON array
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().onUpdateNow().notNull(),
});

export type DrugInteraction = typeof drugInteractions.$inferSelect;
export type InsertDrugInteraction = typeof drugInteractions.$inferInsert;

/**
 * Knowledge Version Tracking
 * Track updates and versions of medical knowledge
 */
export const knowledgeVersions = mysqlTable("knowledge_versions", {
  id: int("id").autoincrement().primaryKey(),
  entityType: varchar("entity_type", { length: 100 }).notNull(), // disease, medication, procedure, etc.
  entityId: int("entity_id").notNull(),
  version: int("version").notNull(),
  changeType: mysqlEnum("change_type", ["created", "updated", "deprecated"]).notNull(),
  changeDescription: text("change_description"),
  changedBy: varchar("changed_by", { length: 255 }),
  reviewedBy: varchar("reviewed_by", { length: 255 }),
  approvedBy: varchar("approved_by", { length: 255 }),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export type KnowledgeVersion = typeof knowledgeVersions.$inferSelect;
export type InsertKnowledgeVersion = typeof knowledgeVersions.$inferInsert;

/**
 * Air Quality Readings
 * Stores real-time and historical air quality data for Iraqi cities
 */
export const aqiReadings = mysqlTable("aqi_readings", {
  id: int("id").autoincrement().primaryKey(),
  city: varchar("city", { length: 100 }).notNull(), // Baghdad, Basra, Erbil, Mosul, etc.
  latitude: decimal("latitude", { precision: 10, scale: 7 }).notNull(),
  longitude: decimal("longitude", { precision: 10, scale: 7 }).notNull(),
  
  // Air Quality Index (AQI) - US EPA standard
  aqi: int("aqi").notNull(), // 0-500 scale
  aqiCategory: mysqlEnum("aqi_category", [
    "good",           // 0-50
    "moderate",       // 51-100
    "unhealthy_sensitive", // 101-150
    "unhealthy",      // 151-200
    "very_unhealthy", // 201-300
    "hazardous"       // 301-500
  ]).notNull(),
  
  // Pollutant concentrations (μg/m³)
  pm25: decimal("pm25", { precision: 8, scale: 2 }), // Fine particulate matter
  pm10: decimal("pm10", { precision: 8, scale: 2 }), // Coarse particulate matter
  o3: decimal("o3", { precision: 8, scale: 2 }),    // Ozone
  no2: decimal("no2", { precision: 8, scale: 2 }),  // Nitrogen dioxide
  so2: decimal("so2", { precision: 8, scale: 2 }),  // Sulfur dioxide
  co: decimal("co", { precision: 8, scale: 2 }),    // Carbon monoxide
  
  // Dominant pollutant
  dominantPollutant: varchar("dominant_pollutant", { length: 20 }), // pm25, pm10, o3, etc.
  
  // Weather context
  temperature: decimal("temperature", { precision: 5, scale: 2 }), // Celsius
  humidity: int("humidity"), // Percentage
  windSpeed: decimal("wind_speed", { precision: 5, scale: 2 }), // m/s
  
  // Data source and quality
  dataSource: varchar("data_source", { length: 100 }).notNull().default("OpenWeatherMap"),
  dataQuality: mysqlEnum("data_quality", ["high", "medium", "low"]).default("high"),
  
  timestamp: timestamp("timestamp").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export type AQIReading = typeof aqiReadings.$inferSelect;
export type InsertAQIReading = typeof aqiReadings.$inferInsert;

/**
 * Air Quality Alerts
 * Stores health alerts triggered by poor air quality
 */
export const aqiAlerts = mysqlTable("aqi_alerts", {
  id: int("id").autoincrement().primaryKey(),
  city: varchar("city", { length: 100 }).notNull(),
  
  // Alert details
  alertType: mysqlEnum("alert_type", [
    "dust_storm",
    "high_pm25",
    "high_pm10",
    "ozone_warning",
    "general_pollution"
  ]).notNull(),
  severity: mysqlEnum("severity", ["low", "medium", "high", "critical"]).notNull(),
  
  // Triggering conditions
  triggerAQI: int("trigger_aqi").notNull(),
  triggerPollutant: varchar("trigger_pollutant", { length: 20 }),
  triggerValue: decimal("trigger_value", { precision: 8, scale: 2 }),
  
  // Alert message
  title: varchar("title", { length: 255 }).notNull(),
  message: text("message").notNull(),
  healthRecommendations: text("health_recommendations").notNull(), // JSON array
  
  // Affected populations
  affectedGroups: text("affected_groups").notNull(), // JSON array: respiratory, cardiac, children, elderly
  
  // Alert lifecycle
  isActive: boolean("is_active").default(true).notNull(),
  startTime: timestamp("start_time").notNull(),
  endTime: timestamp("end_time"),
  
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().onUpdateNow().notNull(),
});

export type AQIAlert = typeof aqiAlerts.$inferSelect;
export type InsertAQIAlert = typeof aqiAlerts.$inferInsert;

/**
 * User Air Quality Subscriptions
 * Tracks which users want air quality alerts for specific cities
 */
export const aqiSubscriptions = mysqlTable("aqi_subscriptions", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("user_id").notNull(),
  city: varchar("city", { length: 100 }).notNull(),
  
  // Alert preferences
  minAlertSeverity: mysqlEnum("min_alert_severity", ["low", "medium", "high", "critical"]).default("medium").notNull(),
  notifyViaEmail: boolean("notify_via_email").default(false).notNull(),
  notifyViaPush: boolean("notify_via_push").default(true).notNull(),
  
  // Health conditions (for personalized alerts)
  hasRespiratoryCondition: boolean("has_respiratory_condition").default(false).notNull(),
  hasCardiacCondition: boolean("has_cardiac_condition").default(false).notNull(),
  isPregnant: boolean("is_pregnant").default(false).notNull(),
  
  isActive: boolean("is_active").default(true).notNull(),
  
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().onUpdateNow().notNull(),
});

export type AQISubscription = typeof aqiSubscriptions.$inferSelect;
export type InsertAQISubscription = typeof aqiSubscriptions.$inferInsert;

/**
 * Air Quality Impact Logs
 * Tracks correlation between air quality and patient symptoms
 */
export const aqiImpactLogs = mysqlTable("aqi_impact_logs", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("user_id").notNull(),
  triageRecordId: int("triage_record_id"),
  
  // Air quality at time of symptoms
  aqiAtSymptomOnset: int("aqi_at_symptom_onset"),
  pm25AtSymptomOnset: decimal("pm25_at_symptom_onset", { precision: 8, scale: 2 }),
  pm10AtSymptomOnset: decimal("pm10_at_symptom_onset", { precision: 8, scale: 2 }),
  
  // Symptom details
  symptoms: text("symptoms").notNull(), // JSON array
  symptomSeverity: mysqlEnum("symptom_severity", ["mild", "moderate", "severe"]).notNull(),
  
  // Correlation analysis
  likelyAQIRelated: boolean("likely_aqi_related").default(false).notNull(),
  correlationConfidence: decimal("correlation_confidence", { precision: 5, scale: 2 }), // 0-100%
  
  // Outcome tracking
  symptomResolved: boolean("symptom_resolved").default(false).notNull(),
  resolutionTime: timestamp("resolution_time"),
  
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().onUpdateNow().notNull(),
});

export type AQIImpactLog = typeof aqiImpactLogs.$inferSelect;
export type InsertAQIImpactLog = typeof aqiImpactLogs.$inferInsert;

/**
 * Patient Medications - Active medication tracking for personalized interaction checking
 * Tracks what medications a patient is currently taking
 */
export const patientMedications = mysqlTable("patient_medications", {
  id: int("id").autoincrement().primaryKey(),
  patientId: int("patient_id").notNull(), // references users.id
  
  // Medication details
  drugName: varchar("drug_name", { length: 255 }).notNull(),
  genericName: varchar("generic_name", { length: 255 }),
  brandName: varchar("brand_name", { length: 255 }),
  dosage: varchar("dosage", { length: 100 }), // e.g., "500mg"
  frequency: varchar("frequency", { length: 100 }), // e.g., "twice daily"
  route: varchar("route", { length: 50 }), // e.g., "oral", "topical", "injection"
  
  // Timing
  startDate: timestamp("start_date").defaultNow().notNull(),
  endDate: timestamp("end_date"), // null if ongoing
  isActive: boolean("is_active").default(true).notNull(),
  
  // Source tracking
  prescribedBy: int("prescribed_by"), // clinician user_id, null if self-reported
  prescriptionId: int("prescription_id"), // link to prescriptions table if available
  source: mysqlEnum("source", ["prescription", "otc", "self_reported"]).default("self_reported").notNull(),
  
  // Image recognition data
  identifiedFromImage: boolean("identified_from_image").default(false).notNull(),
  medicineImageId: int("medicine_image_id"), // link to medicineImages table
  
  // Notes
  purpose: text("purpose"), // why patient is taking this
  notes: text("notes"),
  
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().onUpdateNow().notNull(),
});

export type PatientMedication = typeof patientMedications.$inferSelect;
export type InsertPatientMedication = typeof patientMedications.$inferInsert;

/**
 * Medical Conditions - Patient health conditions for interaction checking
 * Tracks chronic conditions, allergies, and contraindications
 */
export const medicalConditions = mysqlTable("medical_conditions", {
  id: int("id").autoincrement().primaryKey(),
  patientId: int("patient_id").notNull(), // references users.id
  
  // Condition details
  conditionName: varchar("condition_name", { length: 255 }).notNull(),
  conditionCode: varchar("condition_code", { length: 50 }), // ICD-10 or SNOMED code
  conditionType: mysqlEnum("condition_type", [
    "chronic_disease",
    "allergy",
    "contraindication",
    "risk_factor",
    "past_condition"
  ]).notNull(),
  
  // Severity and status
  severity: mysqlEnum("severity", ["mild", "moderate", "severe"]).default("moderate"),
  status: mysqlEnum("status", ["active", "resolved", "in_remission"]).default("active").notNull(),
  
  // Timing
  diagnosedDate: date("diagnosed_date"),
  resolvedDate: date("resolved_date"),
  
  // Clinical details
  diagnosedBy: int("diagnosed_by"), // clinician user_id
  notes: text("notes"),
  affectsMedications: boolean("affects_medications").default(true).notNull(), // should this be considered in drug interactions?
  
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().onUpdateNow().notNull(),
});

export type MedicalCondition = typeof medicalConditions.$inferSelect;
export type InsertMedicalCondition = typeof medicalConditions.$inferInsert;

/**
 * Medicine Images - Stores uploaded medicine box/strip photos for identification
 */
export const medicineImages = mysqlTable("medicine_images", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("user_id").notNull(), // who uploaded it
  
  // Image storage
  imageUrl: varchar("image_url", { length: 500 }).notNull(), // S3 URL
  imageKey: varchar("image_key", { length: 500 }).notNull(), // S3 key for deletion
  thumbnailUrl: varchar("thumbnail_url", { length: 500 }),
  
  // Image metadata
  fileSize: int("file_size"), // bytes
  mimeType: varchar("mime_type", { length: 50 }),
  width: int("width"), // pixels
  height: int("height"), // pixels
  
  // AI identification results
  identificationStatus: mysqlEnum("identification_status", [
    "pending",
    "identified",
    "failed",
    "manual_review"
  ]).default("pending").notNull(),
  
  identifiedDrugName: varchar("identified_drug_name", { length: 255 }),
  identifiedGenericName: varchar("identified_generic_name", { length: 255 }),
  identifiedBrandName: varchar("identified_brand_name", { length: 255 }),
  identifiedDosage: varchar("identified_dosage", { length: 100 }),
  
  // Confidence and verification
  identificationConfidence: decimal("identification_confidence", { precision: 5, scale: 2 }), // 0-100%
  verifiedByUser: boolean("verified_by_user").default(false).notNull(),
  verifiedByClinician: boolean("verified_by_clinician").default(false).notNull(),
  verifiedBy: int("verified_by"), // clinician user_id
  
  // OCR extracted text
  extractedText: text("extracted_text"), // raw OCR output
  
  // Processing metadata
  processingAttempts: int("processing_attempts").default(0).notNull(),
  lastProcessedAt: timestamp("last_processed_at"),
  errorMessage: text("error_message"),
  
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().onUpdateNow().notNull(),
});

export type MedicineImage = typeof medicineImages.$inferSelect;
export type InsertMedicineImage = typeof medicineImages.$inferInsert;

/**
 * Drug Interaction Checks - Log of all interaction checks performed
 * Useful for analytics and improving the system
 */
export const drugInteractionChecks = mysqlTable("drug_interaction_checks", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("user_id").notNull(),
  performedBy: int("performed_by"), // clinician who ran the check, null if patient
  
  // Check details
  medicationsChecked: text("medications_checked").notNull(), // JSON array of drug names
  conditionsConsidered: text("conditions_considered"), // JSON array of conditions
  
  // Results
  interactionsFound: int("interactions_found").default(0).notNull(),
  highestSeverity: mysqlEnum("highest_severity", ["none", "minor", "moderate", "major", "contraindicated"]).default("none").notNull(),
  overallRisk: mysqlEnum("overall_risk", ["low", "moderate", "high"]).default("low").notNull(),
  
  // Full results (for history/audit)
  fullResults: text("full_results").notNull(), // JSON of complete interaction analysis
  
  // Action taken
  actionTaken: text("action_taken"), // what did the clinician/patient do with this info
  
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export type DrugInteractionCheck = typeof drugInteractionChecks.$inferSelect;
export type InsertDrugInteractionCheck = typeof drugInteractionChecks.$inferInsert;

/**
 * SOAP Note Templates - Pre-built templates for common medical scenarios
 * Optimized for Iraqi healthcare context
 */
export const soapNoteTemplates = mysqlTable("soap_note_templates", {
  id: int("id").autoincrement().primaryKey(),
  
  // Template identification
  name: varchar("name", { length: 255 }).notNull(),
  nameAr: varchar("name_ar", { length: 255 }).notNull(), // Arabic name
  category: mysqlEnum("category", [
    "chest_pain",
    "fever",
    "trauma",
    "pediatric",
    "respiratory",
    "gastrointestinal",
    "neurological",
    "general"
  ]).notNull(),
  
  // Template content structure
  subjectiveTemplate: text("subjective_template").notNull(), // JSON structure with prompts
  objectiveTemplate: text("objective_template").notNull(), // JSON structure with common findings
  assessmentTemplate: text("assessment_template").notNull(), // JSON structure with differential diagnoses
  planTemplate: text("plan_template").notNull(), // JSON structure with treatment options
  
  // Template metadata
  description: text("description").notNull(),
  descriptionAr: text("description_ar").notNull(),
  keywords: text("keywords"), // JSON array for search
  keywordsAr: text("keywords_ar"), // Arabic keywords
  
  // Clinical context
  commonSymptoms: text("common_symptoms"), // JSON array
  redFlags: text("red_flags"), // JSON array of warning signs
  typicalDiagnoses: text("typical_diagnoses"), // JSON array
  
  // Usage tracking
  usageCount: int("usage_count").default(0).notNull(),
  lastUsed: timestamp("last_used"),
  
  // Template management
  isActive: boolean("is_active").default(true).notNull(),
  isSystemTemplate: boolean("is_system_template").default(true).notNull(), // vs custom
  createdBy: int("created_by"), // user_id of creator (null for system templates)
  
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().onUpdateNow().notNull(),
});

export type SoapNoteTemplate = typeof soapNoteTemplates.$inferSelect;
export type InsertSoapNoteTemplate = typeof soapNoteTemplates.$inferInsert;

/**
 * SOAP Export Logs - Tracks all EMR exports for audit and compliance
 */
export const soapExportLogs = mysqlTable("soap_export_logs", {
  id: int("id").autoincrement().primaryKey(),
  
  // Export identification
  exportId: varchar("export_id", { length: 64 }).unique().notNull(), // UUID for tracking
  
  // SOAP note reference
  patientId: int("patient_id").notNull(),
  clinicianId: int("clinician_id").notNull(),
  encounterDate: timestamp("encounter_date").notNull(),
  
  // SOAP content snapshot (for audit trail)
  soapContent: text("soap_content").notNull(), // JSON snapshot of complete SOAP note
  
  // Export details
  exportFormat: mysqlEnum("export_format", [
    "pdf_with_qr",
    "pdf_simple",
    "hl7_v2",
    "hl7_v3",
    "fhir_json",
    "fhir_xml"
  ]).notNull(),
  
  // File storage
  fileKey: varchar("file_key", { length: 512 }), // S3 key for exported file
  fileUrl: varchar("file_url", { length: 1024 }), // S3 URL
  fileSize: int("file_size"), // in bytes
  
  // QR code details (for PDF exports)
  qrCodeData: text("qr_code_data"), // JSON with verification URL and metadata
  qrCodeImageKey: varchar("qr_code_image_key", { length: 512 }), // S3 key for QR image
  
  // HL7 message details (for HL7 exports)
  hl7MessageType: varchar("hl7_message_type", { length: 50 }), // e.g., "ADT^A01", "ORU^R01"
  hl7Version: varchar("hl7_version", { length: 20 }), // e.g., "2.5", "2.7"
  hl7MessageId: varchar("hl7_message_id", { length: 255 }), // unique message control ID
  
  // Destination system
  destinationSystem: varchar("destination_system", { length: 255 }), // hospital/EMR system name
  destinationFacilityId: varchar("destination_facility_id", { length: 100 }), // facility identifier
  
  // Export status
  status: mysqlEnum("status", [
    "pending",
    "generated",
    "delivered",
    "failed",
    "expired"
  ]).default("pending").notNull(),
  
  errorMessage: text("error_message"),
  
  // Audit and compliance
  exportedBy: int("exported_by").notNull(), // user_id who initiated export
  exportPurpose: varchar("export_purpose", { length: 255 }), // reason for export
  accessedCount: int("accessed_count").default(0).notNull(), // how many times downloaded/viewed
  lastAccessedAt: timestamp("last_accessed_at"),
  expiresAt: timestamp("expires_at"), // for temporary access links
  
  // Verification and security
  verificationCode: varchar("verification_code", { length: 64 }), // for QR code verification
  checksumMd5: varchar("checksum_md5", { length: 32 }), // file integrity check
  
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().onUpdateNow().notNull(),
});

export type SoapExportLog = typeof soapExportLogs.$inferSelect;
export type InsertSoapExportLog = typeof soapExportLogs.$inferInsert;

/**
 * Doctor Working Hours - Recurring weekly schedule
 * Defines when doctors are generally available each week
 */
export const doctorWorkingHours = mysqlTable("doctor_working_hours", {
  id: int("id").autoincrement().primaryKey(),
  
  doctorId: int("doctor_id").notNull(),
  
  // Day of week (0 = Sunday, 6 = Saturday)
  dayOfWeek: int("day_of_week").notNull(), // 0-6
  
  // Time range
  startTime: time("start_time").notNull(), // e.g., "09:00:00"
  endTime: time("end_time").notNull(), // e.g., "17:00:00"
  
  // Slot configuration
  slotDuration: int("slot_duration").notNull().default(30), // in minutes (15, 30, 60)
  bufferTime: int("buffer_time").default(0), // minutes between appointments
  
  // Status
  isActive: boolean("is_active").default(true).notNull(),
  
  // Effective date range (for temporary schedule changes)
  effectiveFrom: date("effective_from"),
  effectiveTo: date("effective_to"),
  
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().onUpdateNow().notNull(),
});

export type DoctorWorkingHours = typeof doctorWorkingHours.$inferSelect;
export type InsertDoctorWorkingHours = typeof doctorWorkingHours.$inferInsert;

/**
 * Calendar Slots - Individual time slots for booking
 * Generated from working hours or manually created/blocked by doctors
 */
export const calendarSlots = mysqlTable("calendar_slots", {
  id: int("id").autoincrement().primaryKey(),
  
  doctorId: int("doctor_id").notNull(),
  
  // Slot timing
  slotDate: date("slot_date").notNull(),
  startTime: time("start_time").notNull(),
  endTime: time("end_time").notNull(),
  
  // Full timestamp for easier querying
  slotStart: timestamp("slot_start").notNull(),
  slotEnd: timestamp("slot_end").notNull(),
  
  // Slot status
  status: mysqlEnum("status", [
    "available",      // Open for booking
    "booked",        // Patient has booked
    "blocked",       // Manually blocked by doctor
    "completed",     // Appointment completed
    "cancelled",     // Appointment was cancelled
    "no_show",       // Patient didn't show up
    "past"           // Slot time has passed
  ]).default("available").notNull(),
  
  // Linked appointment (when booked)
  appointmentId: int("appointment_id").unique(),
  patientId: int("patient_id"),
  
  // Slot metadata
  slotType: mysqlEnum("slot_type", [
    "regular",       // Normal consultation
    "emergency",     // Emergency slot
    "follow_up",     // Follow-up appointment
    "break",         // Doctor's break time
    "personal"       // Personal time off
  ]).default("regular").notNull(),
  
  // Blocking information (for manually blocked slots)
  blockedBy: int("blocked_by"), // doctor_id who blocked it
  blockReason: varchar("block_reason", { length: 255 }),
  
  // Notes
  notes: text("notes"),
  
  // Automatic generation tracking
  generatedFrom: int("generated_from"), // working_hours_id if auto-generated
  isManual: boolean("is_manual").default(false), // true if manually created
  
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().onUpdateNow().notNull(),
});

export type CalendarSlot = typeof calendarSlots.$inferSelect;
export type InsertCalendarSlot = typeof calendarSlots.$inferInsert;

/**
 * Doctor Availability Exceptions - Special dates when schedule differs
 * Overrides regular working hours for specific dates
 */
export const doctorAvailabilityExceptions = mysqlTable("doctor_availability_exceptions", {
  id: int("id").autoincrement().primaryKey(),
  
  doctorId: int("doctor_id").notNull(),
  
  // Exception date
  exceptionDate: date("exception_date").notNull(),
  
  // Exception type
  exceptionType: mysqlEnum("exception_type", [
    "unavailable",   // Doctor is completely unavailable
    "custom_hours",  // Different working hours
    "holiday",       // Public holiday
    "vacation",      // Personal vacation
    "conference",    // Medical conference
    "emergency"      // Emergency leave
  ]).notNull(),
  
  // Custom hours (if exception_type = 'custom_hours')
  customStartTime: time("custom_start_time"),
  customEndTime: time("custom_end_time"),
  
  // Reason and notes
  reason: varchar("reason", { length: 255 }),
  notes: text("notes"),
  
  // Whether to cancel existing appointments
  cancelExistingAppointments: boolean("cancel_existing_appointments").default(false),
  
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().onUpdateNow().notNull(),
});

export type DoctorAvailabilityException = typeof doctorAvailabilityExceptions.$inferSelect;
export type InsertDoctorAvailabilityException = typeof doctorAvailabilityExceptions.$inferInsert;

/**
 * Appointment Booking Requests - Tracks booking workflow
 * Manages the Pending → Confirmed/Rejected flow
 */
export const appointmentBookingRequests = mysqlTable("appointment_booking_requests", {
  id: int("id").autoincrement().primaryKey(),
  
  // Participants
  patientId: int("patient_id").notNull(),
  doctorId: int("doctor_id").notNull(),
  
  // Requested slot
  slotId: int("slot_id").notNull(),
  
  // Booking status
  status: mysqlEnum("status", [
    "pending",       // Waiting for doctor confirmation
    "confirmed",     // Doctor confirmed
    "rejected",      // Doctor rejected
    "cancelled",     // Patient cancelled
    "expired"        // Request expired (no response)
  ]).default("pending").notNull(),
  
  // Patient information
  chiefComplaint: text("chief_complaint"),
  symptoms: text("symptoms"), // JSON array
  urgencyLevel: varchar("urgency_level", { length: 50 }),
  
  // Triage link
  triageRecordId: int("triage_record_id"),
  
  // Doctor response
  confirmedBy: int("confirmed_by"), // doctor_id
  confirmedAt: timestamp("confirmed_at"),
  rejectedBy: int("rejected_by"), // doctor_id
  rejectedAt: timestamp("rejected_at"),
  rejectionReason: text("rejection_reason"),
  
  // Alternative slot suggestions (if rejected)
  suggestedSlots: text("suggested_slots"), // JSON array of slot_ids
  
  // Linked appointment (when confirmed)
  appointmentId: int("appointment_id").unique(),
  
  // Expiration
  expiresAt: timestamp("expires_at"), // Auto-reject if no response
  
  // Notifications
  patientNotified: boolean("patient_notified").default(false),
  doctorNotified: boolean("doctor_notified").default(false),
  
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().onUpdateNow().notNull(),
});

export type AppointmentBookingRequest = typeof appointmentBookingRequests.$inferSelect;
export type InsertAppointmentBookingRequest = typeof appointmentBookingRequests.$inferInsert;

/**
 * Slot Generation History - Tracks automatic slot generation
 * Helps prevent duplicate generation and tracks changes
 */
export const slotGenerationHistory = mysqlTable("slot_generation_history", {
  id: int("id").autoincrement().primaryKey(),
  
  doctorId: int("doctor_id").notNull(),
  
  // Generation parameters
  startDate: date("start_date").notNull(),
  endDate: date("end_date").notNull(),
  
  // Results
  slotsGenerated: int("slots_generated").notNull(),
  workingHoursUsed: text("working_hours_used"), // JSON array of working_hours_ids
  
  // Generation type
  generationType: mysqlEnum("generation_type", [
    "manual",        // Manually triggered by doctor
    "automatic",     // System auto-generation
    "bulk",          // Bulk generation for date range
    "recurring"      // Recurring schedule setup
  ]).notNull(),
  
  // Triggered by
  triggeredBy: int("triggered_by"), // user_id
  
  // Status
  status: mysqlEnum("status", [
    "success",
    "partial",
    "failed"
  ]).notNull(),
  
  errorMessage: text("error_message"),
  
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export type SlotGenerationHistory = typeof slotGenerationHistory.$inferSelect;
export type InsertSlotGenerationHistory = typeof slotGenerationHistory.$inferInsert;


// ============================================================================
// Self-Healing System Tables
// ============================================================================

export * from "./self-healing-schema";

/**
 * ============================================================================
 * CRITICAL IMPROVEMENTS: Enterprise-Grade Systems
 * ============================================================================
 */

/**
 * LLM Cache - Semantic caching for 30-40% cost reduction
 */
export const llmCache = mysqlTable("llm_cache", {
  id: int("id").autoincrement().primaryKey(),
  
  // Cache key components
  promptHash: varchar("prompt_hash", { length: 64 }).notNull().unique(), // SHA-256 hash
  model: varchar("model", { length: 100 }).notNull(),
  temperature: decimal("temperature", { precision: 3, scale: 2 }),
  
  // Cached data
  prompt: text("prompt").notNull(),
  response: text("response").notNull(),
  tokens: int("tokens"),
  
  // Cache metadata
  hitCount: int("hit_count").default(0).notNull(),
  lastHit: timestamp("last_hit"),
  expiresAt: timestamp("expires_at").notNull(),
  
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export type LlmCache = typeof llmCache.$inferSelect;
export type InsertLlmCache = typeof llmCache.$inferInsert;

/**
 * System Health Metrics - Monitoring for 99.9% availability
 */
export const systemHealthMetrics = mysqlTable("system_health_metrics", {
  id: int("id").autoincrement().primaryKey(),
  
  // Service identification
  service: varchar("service", { length: 100 }).notNull(), // llm, database, api, etc.
  endpoint: varchar("endpoint", { length: 255 }),
  
  // Health metrics
  status: mysqlEnum("status", ["healthy", "degraded", "down"]).notNull(),
  responseTime: int("response_time"), // in milliseconds
  errorRate: decimal("error_rate", { precision: 5, scale: 4 }), // 0.0000 to 1.0000
  
  // Failure detection
  consecutiveFailures: int("consecutive_failures").default(0).notNull(),
  lastFailure: timestamp("last_failure"),
  failureReason: text("failure_reason"),
  
  // Recovery tracking
  recoveryAction: varchar("recovery_action", { length: 100 }),
  recoveryAttempts: int("recovery_attempts").default(0).notNull(),
  lastRecovery: timestamp("last_recovery"),
  
  timestamp: timestamp("timestamp").defaultNow().notNull(),
});

export type SystemHealthMetric = typeof systemHealthMetrics.$inferSelect;
export type InsertSystemHealthMetric = typeof systemHealthMetrics.$inferInsert;

/**
 * Circuit Breaker State - Prevents cascading failures
 */
export const circuitBreakerState = mysqlTable("circuit_breaker_state", {
  id: int("id").autoincrement().primaryKey(),
  
  service: varchar("service", { length: 100 }).notNull().unique(),
  state: mysqlEnum("state", ["closed", "open", "half_open"]).default("closed").notNull(),
  
  failureCount: int("failure_count").default(0).notNull(),
  failureThreshold: int("failure_threshold").default(5).notNull(),
  
  lastFailure: timestamp("last_failure"),
  openedAt: timestamp("opened_at"),
  nextRetryAt: timestamp("next_retry_at"),
  
  successCount: int("success_count").default(0).notNull(),
  halfOpenSuccessThreshold: int("half_open_success_threshold").default(2).notNull(),
  
  updatedAt: timestamp("updated_at").defaultNow().onUpdateNow().notNull(),
});

export type CircuitBreakerState = typeof circuitBreakerState.$inferSelect;
export type InsertCircuitBreakerState = typeof circuitBreakerState.$inferInsert;

/**
 * Algorithm Performance Metrics - Precision, Recall, F1, AUROC tracking
 */
export const algorithmPerformanceMetrics = mysqlTable("algorithm_performance_metrics", {
  id: int("id").autoincrement().primaryKey(),
  
  // Algorithm identification
  algorithmName: varchar("algorithm_name", { length: 100 }).notNull(),
  version: varchar("version", { length: 50 }).notNull(),
  
  // Classification metrics
  truePositives: int("true_positives").default(0).notNull(),
  trueNegatives: int("true_negatives").default(0).notNull(),
  falsePositives: int("false_positives").default(0).notNull(),
  falseNegatives: int("false_negatives").default(0).notNull(),
  
  // Calculated metrics
  precision: decimal("precision", { precision: 5, scale: 4 }),
  recall: decimal("recall", { precision: 5, scale: 4 }),
  f1Score: decimal("f1_score", { precision: 5, scale: 4 }),
  auroc: decimal("auroc", { precision: 5, scale: 4 }),
  
  // Performance metrics
  avgResponseTime: int("avg_response_time"), // milliseconds
  totalPredictions: int("total_predictions").default(0).notNull(),
  
  // Time window
  windowStart: timestamp("window_start").notNull(),
  windowEnd: timestamp("window_end").notNull(),
  
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export type AlgorithmPerformanceMetric = typeof algorithmPerformanceMetrics.$inferSelect;
export type InsertAlgorithmPerformanceMetric = typeof algorithmPerformanceMetrics.$inferInsert;

/**
 * RL Treatment Outcomes - Stores patient outcomes for reinforcement learning
 */
export const rlTreatmentOutcomes = mysqlTable("rl_treatment_outcomes", {
  id: int("id").autoincrement().primaryKey(),
  
  // Patient and treatment context
  userId: int("user_id").notNull(),
  triageRecordId: int("triage_record_id"),
  diagnosis: text("diagnosis").notNull(),
  
  // Treatment recommendation
  treatmentId: varchar("treatment_id", { length: 100 }).notNull(),
  treatmentDescription: text("treatment_description").notNull(),
  recommendedBy: varchar("recommended_by", { length: 50 }).notNull(), // algorithm, doctor, hybrid
  
  // Patient state (context vector)
  patientAge: int("patient_age"),
  patientGender: varchar("patient_gender", { length: 20 }),
  chronicConditions: text("chronic_conditions"), // JSON
  currentMedications: text("current_medications"), // JSON
  symptomSeverity: int("symptom_severity"), // 1-10 scale
  
  // Outcome tracking
  outcome: mysqlEnum("outcome", ["improved", "no_change", "worsened", "adverse_event", "unknown"]),
  outcomeScore: decimal("outcome_score", { precision: 5, scale: 2 }), // -100 to +100
  followUpDate: timestamp("follow_up_date"),
  
  // Reward calculation
  reward: decimal("reward", { precision: 10, scale: 4 }),
  rewardComponents: text("reward_components"), // JSON breakdown
  
  // Feedback source
  feedbackSource: varchar("feedback_source", { length: 50 }), // patient, doctor, automated
  feedbackNotes: text("feedback_notes"),
  
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().onUpdateNow().notNull(),
});

export type RlTreatmentOutcome = typeof rlTreatmentOutcomes.$inferSelect;
export type InsertRlTreatmentOutcome = typeof rlTreatmentOutcomes.$inferInsert;

/**
 * RL Q-Values - Stores Q-learning state-action values
 */
export const rlQValues = mysqlTable("rl_q_values", {
  id: int("id").autoincrement().primaryKey(),
  
  // State representation (hashed for efficiency)
  stateHash: varchar("state_hash", { length: 64 }).notNull(),
  stateDescription: text("state_description").notNull(), // JSON
  
  // Action (treatment)
  actionId: varchar("action_id", { length: 100 }).notNull(),
  actionDescription: text("action_description").notNull(),
  
  // Q-learning values
  qValue: decimal("q_value", { precision: 10, scale: 4 }).notNull(),
  visitCount: int("visit_count").default(0).notNull(),
  
  // Thompson Sampling parameters
  successCount: int("success_count").default(0).notNull(),
  failureCount: int("failure_count").default(0).notNull(),
  alpha: decimal("alpha", { precision: 10, scale: 4 }).default("1.0").notNull(), // Beta distribution alpha
  beta: decimal("beta", { precision: 10, scale: 4 }).default("1.0").notNull(), // Beta distribution beta
  
  // Learning metadata
  lastUpdated: timestamp("last_updated").defaultNow().onUpdateNow().notNull(),
  learningRate: decimal("learning_rate", { precision: 5, scale: 4 }).default("0.1").notNull(),
  discountFactor: decimal("discount_factor", { precision: 5, scale: 4 }).default("0.95").notNull(),
  
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export type RlQValue = typeof rlQValues.$inferSelect;
export type InsertRlQValue = typeof rlQValues.$inferInsert;

/**
 * RL Training Episodes - Tracks RL model training sessions
 */
export const rlTrainingEpisodes = mysqlTable("rl_training_episodes", {
  id: int("id").autoincrement().primaryKey(),
  
  episodeNumber: int("episode_number").notNull(),
  
  // Training configuration
  algorithm: varchar("algorithm", { length: 50 }).notNull(), // q_learning, thompson_sampling, hybrid
  learningRate: decimal("learning_rate", { precision: 5, scale: 4 }).notNull(),
  explorationRate: decimal("exploration_rate", { precision: 5, scale: 4 }).notNull(),
  
  // Episode metrics
  totalReward: decimal("total_reward", { precision: 10, scale: 4 }),
  averageReward: decimal("average_reward", { precision: 10, scale: 4 }),
  stepsCount: int("steps_count"),
  
  // Performance tracking
  successRate: decimal("success_rate", { precision: 5, scale: 4 }),
  convergenceMetric: decimal("convergence_metric", { precision: 10, scale: 6 }),
  
  startedAt: timestamp("started_at").notNull(),
  completedAt: timestamp("completed_at"),
  
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export type RlTrainingEpisode = typeof rlTrainingEpisodes.$inferSelect;
export type InsertRlTrainingEpisode = typeof rlTrainingEpisodes.$inferInsert;

/**
 * Medical Certificates - Stores professional medical certifications and credentials
 */
export const medicalCertificates = mysqlTable("medical_certificates", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("user_id").notNull(),
  
  // Certificate details
  certificateType: varchar("certificate_type", { length: 100 }).notNull(), // medical_license, board_certification, specialty, etc.
  certificateName: varchar("certificate_name", { length: 255 }).notNull(),
  issuingOrganization: varchar("issuing_organization", { length: 255 }).notNull(),
  certificateNumber: varchar("certificate_number", { length: 100 }).notNull(),
  
  // Dates
  issueDate: date("issue_date").notNull(),
  expiryDate: date("expiry_date"),
  
  // Verification
  verificationStatus: mysqlEnum("verification_status", ["pending", "verified", "rejected", "expired"]).default("pending").notNull(),
  verifiedBy: int("verified_by"), // Admin user ID who verified
  verifiedAt: timestamp("verified_at"),
  verificationNotes: text("verification_notes"),
  
  // Document storage
  documentKey: varchar("document_key", { length: 512 }), // S3 key for certificate document
  documentUrl: varchar("document_url", { length: 1024 }), // S3 URL for certificate document
  
  // Additional info
  specialty: varchar("specialty", { length: 100 }),
  country: varchar("country", { length: 100 }),
  state: varchar("state", { length: 100 }),
  
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().onUpdateNow().notNull(),
});

export type MedicalCertificate = typeof medicalCertificates.$inferSelect;
export type InsertMedicalCertificate = typeof medicalCertificates.$inferInsert;

/**
 * API Keys - Stores third-party API keys for users
 */
export const apiKeys = mysqlTable("api_keys", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("user_id").notNull(),
  service: varchar("service", { length: 50 }).notNull(), // vitallens, openai, etc.
  apiKey: varchar("api_key", { length: 512 }).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().onUpdateNow().notNull(),
});

export type ApiKey = typeof apiKeys.$inferSelect;
export type InsertApiKey = typeof apiKeys.$inferInsert;

/**
 * Virtual Consultation Rooms - For telemedicine sessions
 */
export const virtualConsultationRooms = mysqlTable("virtual_consultation_rooms", {
  id: int("id").autoincrement().primaryKey(),
  consultationId: int("consultation_id").notNull(), // Links to consultations table
  
  // Room configuration
  roomId: varchar("room_id", { length: 100 }).unique().notNull(), // Unique room identifier
  roomStatus: mysqlEnum("room_status", ["waiting", "active", "ended", "cancelled"]).default("waiting").notNull(),
  
  // Participants
  doctorId: int("doctor_id").notNull(),
  patientId: int("patient_id").notNull(),
  
  // Session details
  scheduledStartTime: timestamp("scheduled_start_time").notNull(),
  actualStartTime: timestamp("actual_start_time"),
  endTime: timestamp("end_time"),
  duration: int("duration"), // in seconds
  
  // Media settings
  videoEnabled: boolean("video_enabled").default(true).notNull(),
  audioEnabled: boolean("audio_enabled").default(true).notNull(),
  screenSharingEnabled: boolean("screen_sharing_enabled").default(false).notNull(),
  recordingEnabled: boolean("recording_enabled").default(false).notNull(),
  
  // Recording storage
  recordingKey: varchar("recording_key", { length: 512 }),
  recordingUrl: varchar("recording_url", { length: 1024 }),
  transcriptionKey: varchar("transcription_key", { length: 512 }),
  
  // Quality metrics
  connectionQuality: varchar("connection_quality", { length: 20 }), // excellent, good, fair, poor
  technicalIssues: text("technical_issues"), // JSON array of issues
  
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().onUpdateNow().notNull(),
});

export type VirtualConsultationRoom = typeof virtualConsultationRooms.$inferSelect;
export type InsertVirtualConsultationRoom = typeof virtualConsultationRooms.$inferInsert;

/**
 * Hospital Affiliations - Tracks doctor relationships with hospitals
 */
export const hospitalAffiliations = mysqlTable("hospital_affiliations", {
  id: int("id").autoincrement().primaryKey(),
  doctorId: int("doctor_id").notNull(),
  facilityId: int("facility_id").notNull(), // Links to facilities table
  
  // Affiliation details
  affiliationType: mysqlEnum("affiliation_type", ["staff", "visiting", "consultant", "resident", "fellow", "temporary"]).notNull(),
  department: varchar("department", { length: 100 }),
  position: varchar("position", { length: 100 }),
  
  // Privileges
  admittingPrivileges: boolean("admitting_privileges").default(false).notNull(),
  surgicalPrivileges: boolean("surgical_privileges").default(false).notNull(),
  emrAccess: boolean("emr_access").default(false).notNull(),
  emrAccessLevel: mysqlEnum("emr_access_level", ["read_only", "read_write", "full"]).default("read_only"),
  
  // Status
  status: mysqlEnum("status", ["active", "inactive", "pending", "suspended", "expired"]).default("pending").notNull(),
  startDate: date("start_date").notNull(),
  endDate: date("end_date"),
  
  // Verification
  verificationStatus: mysqlEnum("verification_status", ["pending", "verified", "rejected"]).default("pending").notNull(),
  verifiedBy: int("verified_by"), // Admin/facility admin who verified
  verifiedAt: timestamp("verified_at"),
  verificationDocumentKey: varchar("verification_document_key", { length: 512 }),
  
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().onUpdateNow().notNull(),
});

export type HospitalAffiliation = typeof hospitalAffiliations.$inferSelect;
export type InsertHospitalAffiliation = typeof hospitalAffiliations.$inferInsert;

/**
 * Doctor Shifts - Tracks hospital shift schedules for new graduate doctors
 */
export const doctorShifts = mysqlTable("doctor_shifts", {
  id: int("id").autoincrement().primaryKey(),
  doctorId: int("doctor_id").notNull(),
  facilityId: int("facility_id").notNull(),
  
  // Shift details
  shiftDate: date("shift_date").notNull(),
  startTime: time("start_time").notNull(),
  endTime: time("end_time").notNull(),
  shiftType: mysqlEnum("shift_type", ["day", "evening", "night", "on_call", "emergency"]).notNull(),
  
  // Status
  status: mysqlEnum("status", ["scheduled", "confirmed", "in_progress", "completed", "cancelled", "no_show"]).default("scheduled").notNull(),
  
  // Check-in/out
  checkInTime: timestamp("check_in_time"),
  checkOutTime: timestamp("check_out_time"),
  actualDuration: int("actual_duration"), // in minutes
  
  // Shift notes
  notes: text("notes"),
  patientsSeenCount: int("patients_seen_count").default(0),
  
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().onUpdateNow().notNull(),
});

export type DoctorShift = typeof doctorShifts.$inferSelect;
export type InsertDoctorShift = typeof doctorShifts.$inferInsert;

/**
 * Referral Requests - Patient referrals between doctors
 */
export const referralRequests = mysqlTable("referral_requests", {
  id: int("id").autoincrement().primaryKey(),
  
  // Referral parties
  referringDoctorId: int("referring_doctor_id").notNull(),
  referredDoctorId: int("referred_doctor_id"), // null if open referral
  patientId: int("patient_id").notNull(),
  
  // Referral details
  referralType: mysqlEnum("referral_type", ["specialist", "second_opinion", "emergency", "follow_up", "procedure"]).notNull(),
  specialty: varchar("specialty", { length: 100 }),
  urgency: mysqlEnum("urgency", ["routine", "urgent", "emergency"]).default("routine").notNull(),
  
  // Clinical information
  reason: text("reason").notNull(),
  clinicalSummary: text("clinical_summary").notNull(),
  relevantHistory: text("relevant_history"),
  currentMedications: text("current_medications"),
  attachedDocuments: text("attached_documents"), // JSON array of document IDs
  
  // Status tracking
  status: mysqlEnum("status", ["pending", "accepted", "declined", "completed", "cancelled"]).default("pending").notNull(),
  responseNotes: text("response_notes"),
  respondedAt: timestamp("responded_at"),
  
  // Appointment linkage
  appointmentId: int("appointment_id"),
  consultationId: int("consultation_id"),
  
  // Follow-up
  followUpRequired: boolean("follow_up_required").default(false).notNull(),
  followUpNotes: text("follow_up_notes"),
  
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().onUpdateNow().notNull(),
});

export type ReferralRequest = typeof referralRequests.$inferSelect;
export type InsertReferralRequest = typeof referralRequests.$inferInsert;

/**
 * Clinical Guidelines Library - Evidence-based guidelines for doctors
 */
export const clinicalGuidelinesLibrary = mysqlTable("clinical_guidelines_library", {
  id: int("id").autoincrement().primaryKey(),
  
  // Guideline information
  title: varchar("title", { length: 500 }).notNull(),
  category: varchar("category", { length: 100 }).notNull(), // cardiology, neurology, etc.
  subcategory: varchar("subcategory", { length: 100 }),
  
  // Content
  summary: text("summary").notNull(),
  fullContent: text("full_content").notNull(),
  algorithmFlowchart: text("algorithm_flowchart"), // JSON or URL to flowchart
  
  // Source and credibility
  source: varchar("source", { length: 255 }).notNull(), // WHO, AHA, etc.
  sourceUrl: varchar("source_url", { length: 1024 }),
  evidenceLevel: mysqlEnum("evidence_level", ["A", "B", "C", "D"]), // Evidence quality
  
  // Versioning
  version: varchar("version", { length: 50 }),
  publishedDate: date("published_date"),
  lastReviewedDate: date("last_reviewed_date"),
  nextReviewDate: date("next_review_date"),
  
  // Regional relevance
  regionalAdaptation: boolean("regional_adaptation").default(false).notNull(),
  applicableRegions: text("applicable_regions"), // JSON array of regions
  
  // Usage tracking
  viewCount: int("view_count").default(0),
  bookmarkCount: int("bookmark_count").default(0),
  
  // Status
  status: mysqlEnum("status", ["active", "archived", "under_review", "deprecated"]).default("active").notNull(),
  
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().onUpdateNow().notNull(),
});

export type ClinicalGuidelineLibrary = typeof clinicalGuidelinesLibrary.$inferSelect;
export type InsertClinicalGuidelineLibrary = typeof clinicalGuidelinesLibrary.$inferInsert;

/**
 * Medical Calculators - Clinical calculation tools
 */
export const medicalCalculators = mysqlTable("medical_calculators", {
  id: int("id").autoincrement().primaryKey(),
  
  // Calculator information
  name: varchar("name", { length: 255 }).notNull(),
  category: varchar("category", { length: 100 }).notNull(), // cardiology, nephrology, etc.
  description: text("description").notNull(),
  
  // Calculator configuration
  calculatorType: varchar("calculator_type", { length: 50 }).notNull(), // bmi, gfr, apache, etc.
  inputFields: text("input_fields").notNull(), // JSON schema for inputs
  calculationFormula: text("calculation_formula").notNull(), // Formula or algorithm
  outputFormat: text("output_format").notNull(), // JSON schema for outputs
  
  // Reference information
  referenceSource: varchar("reference_source", { length: 255 }),
  referenceUrl: varchar("reference_url", { length: 1024 }),
  clinicalUse: text("clinical_use"),
  limitations: text("limitations"),
  
  // Usage tracking
  usageCount: int("usage_count").default(0),
  
  // Status
  status: mysqlEnum("status", ["active", "deprecated"]).default("active").notNull(),
  
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().onUpdateNow().notNull(),
});

export type MedicalCalculator = typeof medicalCalculators.$inferSelect;
export type InsertMedicalCalculator = typeof medicalCalculators.$inferInsert;

/**
 * Calculator Usage History - Tracks calculator usage by doctors
 */
export const calculatorUsageHistory = mysqlTable("calculator_usage_history", {
  id: int("id").autoincrement().primaryKey(),
  calculatorId: int("calculator_id").notNull(),
  userId: int("user_id").notNull(),
  patientId: int("patient_id"), // Optional link to patient
  
  // Calculation data
  inputData: text("input_data").notNull(), // JSON of input values
  outputData: text("output_data").notNull(), // JSON of calculated results
  
  // Context
  consultationId: int("consultation_id"),
  notes: text("notes"),
  
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export type CalculatorUsageHistory = typeof calculatorUsageHistory.$inferSelect;
export type InsertCalculatorUsageHistory = typeof calculatorUsageHistory.$inferInsert;

/**
 * Doctor Public Profiles - Public-facing doctor profiles for patient discovery
 */
export const doctorPublicProfiles = mysqlTable("doctor_public_profiles", {
  id: int("id").autoincrement().primaryKey(),
  doctorId: int("doctor_id").unique().notNull(),
  
  // Profile visibility
  isPublic: boolean("is_public").default(false).notNull(),
  acceptingNewPatients: boolean("accepting_new_patients").default(true).notNull(),
  
  // Professional information
  displayName: varchar("display_name", { length: 255 }).notNull(),
  title: varchar("title", { length: 100 }), // Dr., Prof., etc.
  bio: text("bio"),
  specialties: text("specialties"), // JSON array
  languages: text("languages"), // JSON array
  education: text("education"), // JSON array of education history
  certifications: text("certifications"), // JSON array
  
  // Practice information
  yearsOfExperience: int("years_of_experience"),
  consultationTypes: text("consultation_types"), // JSON array: video, audio, chat
  consultationFee: decimal("consultation_fee", { precision: 10, scale: 2 }),
  currency: varchar("currency", { length: 10 }).default("USD"),
  averageResponseTime: int("average_response_time"), // in minutes
  
  // Ratings and reviews
  averageRating: decimal("average_rating", { precision: 3, scale: 2 }).default("0.00"),
  totalReviews: int("total_reviews").default(0),
  totalConsultations: int("total_consultations").default(0),
  
  // Media
  profilePhotoKey: varchar("profile_photo_key", { length: 512 }),
  profilePhotoUrl: varchar("profile_photo_url", { length: 1024 }),
  
  // SEO
  profileSlug: varchar("profile_slug", { length: 255 }).unique(), // URL-friendly identifier
  metaDescription: text("meta_description"),
  
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().onUpdateNow().notNull(),
});

export type DoctorPublicProfile = typeof doctorPublicProfiles.$inferSelect;
export type InsertDoctorPublicProfile = typeof doctorPublicProfiles.$inferInsert;

/**
 * Doctor Reviews - Patient reviews and ratings for doctors
 */
export const doctorReviews = mysqlTable("doctor_reviews", {
  id: int("id").autoincrement().primaryKey(),
  doctorId: int("doctor_id").notNull(),
  patientId: int("patient_id").notNull(),
  consultationId: int("consultation_id"), // Link to specific consultation
  
  // Rating
  rating: int("rating").notNull(), // 1-5 stars
  
  // Review content
  reviewTitle: varchar("review_title", { length: 255 }),
  reviewText: text("review_text"),
  
  // Detailed ratings
  communicationRating: int("communication_rating"), // 1-5
  professionalismRating: int("professionalism_rating"), // 1-5
  knowledgeRating: int("knowledge_rating"), // 1-5
  
  // Moderation
  status: mysqlEnum("status", ["pending", "approved", "rejected", "flagged"]).default("pending").notNull(),
  moderatedBy: int("moderated_by"),
  moderatedAt: timestamp("moderated_at"),
  moderationNotes: text("moderation_notes"),
  
  // Response from doctor
  doctorResponse: text("doctor_response"),
  respondedAt: timestamp("responded_at"),
  
  // Verification
  isVerifiedPatient: boolean("is_verified_patient").default(false).notNull(),
  
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().onUpdateNow().notNull(),
});

export type DoctorReview = typeof doctorReviews.$inferSelect;
export type InsertDoctorReview = typeof doctorReviews.$inferInsert;

/**
 * CME (Continuing Medical Education) Tracking
 */
export const cmeTracking = mysqlTable("cme_tracking", {
  id: int("id").autoincrement().primaryKey(),
  doctorId: int("doctor_id").notNull(),
  
  // Activity information
  activityType: mysqlEnum("activity_type", ["course", "conference", "workshop", "webinar", "journal_review", "case_study", "other"]).notNull(),
  activityTitle: varchar("activity_title", { length: 500 }).notNull(),
  provider: varchar("provider", { length: 255 }),
  
  // Credits
  creditsEarned: decimal("credits_earned", { precision: 5, scale: 2 }).notNull(),
  creditType: varchar("credit_type", { length: 50 }).default("CME"), // CME, CEU, etc.
  
  // Dates
  activityDate: date("activity_date").notNull(),
  completionDate: date("completion_date"),
  expiryDate: date("expiry_date"),
  
  // Verification
  certificateKey: varchar("certificate_key", { length: 512 }),
  certificateUrl: varchar("certificate_url", { length: 1024 }),
  verificationCode: varchar("verification_code", { length: 100 }),
  
  // Category
  category: varchar("category", { length: 100 }), // cardiology, emergency medicine, etc.
  
  // Status
  status: mysqlEnum("status", ["completed", "in_progress", "expired"]).default("completed").notNull(),
  
  notes: text("notes"),
  
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().onUpdateNow().notNull(),
});

export type CmeTracking = typeof cmeTracking.$inferSelect;
export type InsertCmeTracking = typeof cmeTracking.$inferInsert;

/**
 * Peer Consultation Network - Doctor-to-doctor consultation requests
 */
export const peerConsultations = mysqlTable("peer_consultations", {
  id: int("id").autoincrement().primaryKey(),
  
  // Parties
  requestingDoctorId: int("requesting_doctor_id").notNull(),
  consultingDoctorId: int("consulting_doctor_id"),
  
  // Case information
  patientId: int("patient_id"), // Optional, may be anonymized
  caseTitle: varchar("case_title", { length: 255 }).notNull(),
  caseDescription: text("case_description").notNull(),
  specialty: varchar("specialty", { length: 100 }),
  
  // Urgency
  urgency: mysqlEnum("urgency", ["routine", "urgent", "emergency"]).default("routine").notNull(),
  
  // Anonymization
  isAnonymized: boolean("is_anonymized").default(false).notNull(),
  
  // Attachments
  attachedDocuments: text("attached_documents"), // JSON array
  
  // Response
  status: mysqlEnum("status", ["open", "in_progress", "answered", "closed"]).default("open").notNull(),
  response: text("response"),
  respondedAt: timestamp("responded_at"),
  
  // Follow-up discussion
  discussionThreadId: int("discussion_thread_id"),
  
  // Ratings
  helpfulnessRating: int("helpfulness_rating"), // 1-5
  
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().onUpdateNow().notNull(),
});

export type PeerConsultation = typeof peerConsultations.$inferSelect;
export type InsertPeerConsultation = typeof peerConsultations.$inferInsert;

/**
 * Mentorship Relationships - Connects experienced doctors with new graduates
 */
export const mentorshipRelationships = mysqlTable("mentorship_relationships", {
  id: int("id").autoincrement().primaryKey(),
  
  // Parties
  mentorId: int("mentor_id").notNull(),
  menteeId: int("mentee_id").notNull(),
  
  // Relationship details
  specialty: varchar("specialty", { length: 100 }),
  startDate: date("start_date").notNull(),
  endDate: date("end_date"),
  
  // Status
  status: mysqlEnum("status", ["pending", "active", "completed", "cancelled"]).default("pending").notNull(),
  
  // Goals and progress
  goals: text("goals"), // JSON array of mentorship goals
  progressNotes: text("progress_notes"),
  
  // Meeting tracking
  totalMeetings: int("total_meetings").default(0),
  lastMeetingDate: date("last_meeting_date"),
  nextMeetingDate: date("next_meeting_date"),
  
  // Feedback
  mentorFeedback: text("mentor_feedback"),
  menteeFeedback: text("mentee_feedback"),
  
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().onUpdateNow().notNull(),
});

export type MentorshipRelationship = typeof mentorshipRelationships.$inferSelect;
export type InsertMentorshipRelationship = typeof mentorshipRelationships.$inferInsert;

/**
 * Case Studies Library - Educational case studies for learning
 */
export const caseStudiesLibrary = mysqlTable("case_studies_library", {
  id: int("id").autoincrement().primaryKey(),
  
  // Case information
  title: varchar("title", { length: 500 }).notNull(),
  category: varchar("category", { length: 100 }).notNull(),
  specialty: varchar("specialty", { length: 100 }),
  difficulty: mysqlEnum("difficulty", ["beginner", "intermediate", "advanced"]).notNull(),
  
  // Patient presentation
  patientPresentation: text("patient_presentation").notNull(),
  clinicalFindings: text("clinical_findings").notNull(),
  diagnosticTests: text("diagnostic_tests"),
  
  // Case progression
  differentialDiagnosis: text("differential_diagnosis"),
  finalDiagnosis: text("final_diagnosis").notNull(),
  treatment: text("treatment").notNull(),
  outcome: text("outcome"),
  
  // Learning points
  learningObjectives: text("learning_objectives"), // JSON array
  keyTakeaways: text("key_takeaways"),
  clinicalPearls: text("clinical_pearls"),
  
  // Media
  imageKeys: text("image_keys"), // JSON array of S3 keys
  imageUrls: text("image_urls"), // JSON array of S3 URLs
  
  // Metadata
  authorId: int("author_id"),
  source: varchar("source", { length: 255 }),
  references: text("references"),
  
  // Engagement
  viewCount: int("view_count").default(0),
  completionCount: int("completion_count").default(0),
  averageRating: decimal("average_rating", { precision: 3, scale: 2 }),
  
  // Status
  status: mysqlEnum("status", ["draft", "published", "archived"]).default("draft").notNull(),
  
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().onUpdateNow().notNull(),
});

export type CaseStudyLibrary = typeof caseStudiesLibrary.$inferSelect;
export type InsertCaseStudyLibrary = typeof caseStudiesLibrary.$inferInsert;

/**
 * Doctor Revenue Tracking - Financial management for freelance doctors
 */
export const doctorRevenueTracking = mysqlTable("doctor_revenue_tracking", {
  id: int("id").autoincrement().primaryKey(),
  doctorId: int("doctor_id").notNull(),
  
  // Transaction details
  transactionType: mysqlEnum("transaction_type", ["consultation", "procedure", "follow_up", "certificate", "other"]).notNull(),
  consultationId: int("consultation_id"),
  
  // Financial information
  amount: decimal("amount", { precision: 10, scale: 2 }).notNull(),
  currency: varchar("currency", { length: 10 }).default("USD").notNull(),
  paymentMethod: varchar("payment_method", { length: 50 }),
  
  // Platform fees
  platformFee: decimal("platform_fee", { precision: 10, scale: 2 }).default("0.00"),
  netAmount: decimal("net_amount", { precision: 10, scale: 2 }).notNull(),
  
  // Status
  status: mysqlEnum("status", ["pending", "completed", "refunded", "cancelled"]).default("pending").notNull(),
  
  // Payment processing
  paymentIntentId: varchar("payment_intent_id", { length: 255 }),
  payoutId: varchar("payout_id", { length: 255 }),
  payoutDate: date("payout_date"),
  
  // Tax information
  taxYear: int("tax_year"),
  taxQuarter: int("tax_quarter"),
  includedInTaxReport: boolean("included_in_tax_report").default(false).notNull(),
  
  // Notes
  description: text("description"),
  
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().onUpdateNow().notNull(),
});

export type DoctorRevenueTracking = typeof doctorRevenueTracking.$inferSelect;
export type InsertDoctorRevenueTracking = typeof doctorRevenueTracking.$inferInsert;

// Export consultations schema
export * from "./schema-consultations";

// Export Avicenna-X Orchestration System schema
export * from "./avicenna-schema";

// Export intelligent matching system schema
export * from "./matching-schema";


/**
 * Doctor Verification Requests - Tracks doctor registration approval workflow
 */
export const doctorVerificationRequests = mysqlTable("doctor_verification_requests", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("user_id").notNull(), // The doctor user requesting verification
  
  // Request status
  status: mysqlEnum("status", ["pending", "under_review", "approved", "rejected", "requires_more_info"]).default("pending").notNull(),
  
  // Personal information
  fullName: varchar("full_name", { length: 255 }).notNull(),
  dateOfBirth: date("date_of_birth"),
  nationalIdNumber: varchar("national_id_number", { length: 100 }),
  
  // Professional information
  medicalLicenseNumber: varchar("medical_license_number", { length: 100 }).notNull(),
  licenseIssuingAuthority: varchar("license_issuing_authority", { length: 255 }).notNull(),
  licenseIssueDate: date("license_issue_date").notNull(),
  licenseExpiryDate: date("license_expiry_date"),
  specialty: varchar("specialty", { length: 100 }),
  subspecialty: varchar("subspecialty", { length: 100 }),
  yearsOfExperience: int("years_of_experience"),
  
  // Education
  medicalSchool: varchar("medical_school", { length: 255 }),
  graduationYear: int("graduation_year"),
  
  // Documents (S3 keys)
  nationalIdDocumentKey: varchar("national_id_document_key", { length: 512 }),
  nationalIdDocumentUrl: varchar("national_id_document_url", { length: 1024 }),
  medicalLicenseDocumentKey: varchar("medical_license_document_key", { length: 512 }),
  medicalLicenseDocumentUrl: varchar("medical_license_document_url", { length: 1024 }),
  medicalDegreeDocumentKey: varchar("medical_degree_document_key", { length: 512 }),
  medicalDegreeDocumentUrl: varchar("medical_degree_document_url", { length: 1024 }),
  additionalDocumentsJson: text("additional_documents_json"), // JSON array of additional documents
  
  // Admin review
  reviewedBy: int("reviewed_by"), // Admin user ID who reviewed
  reviewedAt: timestamp("reviewed_at"),
  reviewNotes: text("review_notes"),
  rejectionReason: text("rejection_reason"),
  additionalInfoRequested: text("additional_info_requested"),
  
  // Timestamps
  submittedAt: timestamp("submitted_at").defaultNow().notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().onUpdateNow().notNull(),
});

export type DoctorVerificationRequest = typeof doctorVerificationRequests.$inferSelect;
export type InsertDoctorVerificationRequest = typeof doctorVerificationRequests.$inferInsert;


/**
 * Doctor Verification Documents - Stores uploaded ID and medical certificate documents
 * Used for automatic verification by matching names on both documents
 */
export const doctorVerificationDocuments = mysqlTable("doctor_verification_documents", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("user_id").notNull(), // The doctor user
  
  // Document type
  documentType: mysqlEnum("document_type", ["national_id", "medical_certificate"]).notNull(),
  
  // File storage
  fileKey: varchar("file_key", { length: 512 }).notNull(), // S3 key
  fileUrl: varchar("file_url", { length: 1024 }).notNull(), // S3 URL
  fileName: varchar("file_name", { length: 255 }).notNull(),
  fileSize: int("file_size").notNull(), // in bytes
  mimeType: varchar("mime_type", { length: 100 }).notNull(),
  
  // Extracted information from document (via LLM/OCR)
  extractedName: varchar("extracted_name", { length: 255 }),
  extractedNameArabic: varchar("extracted_name_arabic", { length: 255 }),
  extractedDateOfBirth: date("extracted_date_of_birth"),
  extractedIdNumber: varchar("extracted_id_number", { length: 100 }),
  extractedLicenseNumber: varchar("extracted_license_number", { length: 100 }),
  extractedSpecialty: varchar("extracted_specialty", { length: 100 }),
  extractedIssuingAuthority: varchar("extracted_issuing_authority", { length: 255 }),
  extractedIssueDate: date("extracted_issue_date"),
  extractedExpiryDate: date("extracted_expiry_date"),
  extractedMedicalSchool: varchar("extracted_medical_school", { length: 255 }),
  extractedGraduationYear: int("extracted_graduation_year"),
  extractedRawData: text("extracted_raw_data"), // Full JSON of all extracted data
  
  // Processing status
  processingStatus: mysqlEnum("processing_status", ["pending", "processing", "completed", "failed"]).default("pending").notNull(),
  processingError: text("processing_error"),
  processedAt: timestamp("processed_at"),
  
  // Verification status
  verificationStatus: mysqlEnum("verification_status", ["pending", "verified", "rejected", "needs_review"]).default("pending").notNull(),
  verificationNotes: text("verification_notes"),
  
  // Name matching result (for automatic verification)
  nameMatchScore: decimal("name_match_score", { precision: 5, scale: 2 }), // 0-100 similarity score
  nameMatchPassed: boolean("name_match_passed"),
  
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().onUpdateNow().notNull(),
});

export type DoctorVerificationDocument = typeof doctorVerificationDocuments.$inferSelect;
export type InsertDoctorVerificationDocument = typeof doctorVerificationDocuments.$inferInsert;
