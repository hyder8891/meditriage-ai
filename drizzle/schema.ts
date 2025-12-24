import { int, mysqlEnum, mysqlTable, text, timestamp, varchar, boolean, json, date, decimal, time, float } from "drizzle-orm/mysql-core";

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
