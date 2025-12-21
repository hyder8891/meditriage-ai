import { int, mysqlEnum, mysqlTable, text, timestamp, varchar, boolean, json, date, decimal, time } from "drizzle-orm/mysql-core";

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
  
  // Doctor availability status (for B2B2C platform)
  availabilityStatus: mysqlEnum("availability_status", ["available", "busy", "offline"]).default("offline"),
  currentPatientCount: int("current_patient_count").default(0), // Number of patients in queue
  maxPatientsPerDay: int("max_patients_per_day").default(50), // Daily limit
  lastStatusChange: timestamp("last_status_change"),
  autoOfflineMinutes: int("auto_offline_minutes").default(15), // Auto-offline after inactivity
  
  // Email verification
  emailVerified: boolean("email_verified").default(false).notNull(),
  verificationToken: varchar("verification_token", { length: 255 }),
  verificationTokenExpiry: timestamp("verification_token_expiry"),
  
  // Password reset
  resetToken: varchar("reset_token", { length: 255 }),
  resetTokenExpiry: timestamp("reset_token_expiry"),
  
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
