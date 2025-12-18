import { int, mysqlEnum, mysqlTable, text, timestamp, varchar, boolean, json } from "drizzle-orm/mysql-core";

/**
 * Core user table backing auth flow.
 */
export const users = mysqlTable("users", {
  id: int("id").autoincrement().primaryKey(),
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", ["user", "admin"]).default("user").notNull(),
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
