import { int, mysqlEnum, mysqlTable, text, timestamp, varchar, boolean, json, date, decimal, time } from "drizzle-orm/mysql-core";

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
