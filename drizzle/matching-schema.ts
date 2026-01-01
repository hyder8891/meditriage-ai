import { int, mysqlEnum, mysqlTable, text, timestamp, varchar, boolean, decimal, float, json, index } from "drizzle-orm/mysql-core";

/**
 * Hierarchical Specialty System
 * Supports primary specialties and sub-specialties
 */
export const specialties = mysqlTable("specialties", {
  id: int("id").autoincrement().primaryKey(),
  name: varchar("name", { length: 100 }).notNull().unique(),
  nameAr: varchar("name_ar", { length: 100 }),
  parentSpecialtyId: int("parent_specialty_id"), // null for primary specialties
  level: int("level").notNull().default(1), // 1 = primary, 2 = sub-specialty, etc.
  description: text("description"),
  isActive: boolean("is_active").default(true).notNull(),
  sortOrder: int("sort_order").default(0),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().onUpdateNow().notNull(),
}, (table) => ({
  parentIdx: index("parent_specialty_idx").on(table.parentSpecialtyId),
}));

export type Specialty = typeof specialties.$inferSelect;
export type InsertSpecialty = typeof specialties.$inferInsert;

/**
 * Doctor Specialties - Links doctors to their specialties
 */
export const doctorSpecialties = mysqlTable("doctor_specialties", {
  id: int("id").autoincrement().primaryKey(),
  doctorId: int("doctor_id").notNull(),
  specialtyId: int("specialty_id").notNull(),
  isPrimary: boolean("is_primary").default(false).notNull(), // Primary specialty
  proficiencyLevel: mysqlEnum("proficiency_level", ["beginner", "intermediate", "advanced", "expert"]).default("intermediate"),
  yearsOfExperience: int("years_of_experience").default(0),
  certificationVerified: boolean("certification_verified").default(false).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => ({
  doctorIdx: index("doctor_idx").on(table.doctorId),
  specialtyIdx: index("specialty_idx").on(table.specialtyId),
}));

export type DoctorSpecialty = typeof doctorSpecialties.$inferSelect;
export type InsertDoctorSpecialty = typeof doctorSpecialties.$inferInsert;

/**
 * Patient-Doctor Matching History
 * Tracks all matching attempts and outcomes
 */
export const matchingHistory = mysqlTable("matching_history", {
  id: int("id").autoincrement().primaryKey(),
  patientId: int("patient_id").notNull(),
  doctorId: int("doctor_id").notNull(),
  triageRecordId: int("triage_record_id"), // Link to triage assessment
  
  // Matching details
  matchScore: float("match_score").notNull(), // 0-100 score
  matchReason: text("match_reason"), // JSON explanation of why this doctor was matched
  matchAlgorithmVersion: varchar("match_algorithm_version", { length: 50 }),
  
  // Assignment status
  status: mysqlEnum("status", ["suggested", "assigned", "accepted", "declined", "completed", "cancelled"]).default("suggested").notNull(),
  assignedAt: timestamp("assigned_at"),
  respondedAt: timestamp("responded_at"),
  
  // Patient response
  patientDeclineReason: text("patient_decline_reason"),
  patientFeedback: text("patient_feedback"),
  patientRating: int("patient_rating"), // 1-5
  
  // Outcome tracking
  consultationCompleted: boolean("consultation_completed").default(false).notNull(),
  treatmentSuccessful: boolean("treatment_successful"),
  followUpRequired: boolean("follow_up_required").default(false).notNull(),
  
  // Metadata
  urgencyLevel: mysqlEnum("urgency_level", ["routine", "urgent", "emergency"]).default("routine"),
  specialtyRequired: varchar("specialty_required", { length: 100 }),
  
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().onUpdateNow().notNull(),
}, (table) => ({
  patientIdx: index("patient_idx").on(table.patientId),
  doctorIdx: index("doctor_idx").on(table.doctorId),
  statusIdx: index("status_idx").on(table.status),
  triageIdx: index("triage_idx").on(table.triageRecordId),
}));

export type MatchingHistory = typeof matchingHistory.$inferSelect;
export type InsertMatchingHistory = typeof matchingHistory.$inferInsert;

/**
 * Matching Algorithm Configuration
 * Stores weights and parameters for the matching algorithm
 */
export const matchingAlgorithmConfig = mysqlTable("matching_algorithm_config", {
  id: int("id").autoincrement().primaryKey(),
  version: varchar("version", { length: 50 }).notNull().unique(),
  isActive: boolean("is_active").default(false).notNull(),
  
  // Weights for different factors (0-1)
  specialtyMatchWeight: float("specialty_match_weight").default(0.35).notNull(),
  availabilityWeight: float("availability_weight").default(0.25).notNull(),
  experienceWeight: float("experience_weight").default(0.15).notNull(),
  ratingWeight: float("rating_weight").default(0.10).notNull(),
  distanceWeight: float("distance_weight").default(0.10).notNull(),
  languageMatchWeight: float("language_match_weight").default(0.05).notNull(),
  
  // Capacity limits
  maxPatientsPerDoctorPerDay: int("max_patients_per_doctor_per_day").default(50),
  maxPatientsPerDoctorPerHour: int("max_patients_per_doctor_per_hour").default(4),
  
  // Distance thresholds (in km)
  maxDistanceKm: float("max_distance_km").default(50),
  preferredDistanceKm: float("preferred_distance_km").default(10),
  
  // Emergency overrides
  emergencyBypassCapacity: boolean("emergency_bypass_capacity").default(true).notNull(),
  emergencyMaxWaitMinutes: int("emergency_max_wait_minutes").default(5),
  
  // ML model settings
  mlModelEnabled: boolean("ml_model_enabled").default(false).notNull(),
  mlModelEndpoint: varchar("ml_model_endpoint", { length: 500 }),
  mlModelVersion: varchar("ml_model_version", { length: 50 }),
  
  description: text("description"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().onUpdateNow().notNull(),
});

export type MatchingAlgorithmConfig = typeof matchingAlgorithmConfig.$inferSelect;
export type InsertMatchingAlgorithmConfig = typeof matchingAlgorithmConfig.$inferInsert;

/**
 * Patient Preferences for Doctor Matching
 */
export const patientMatchingPreferences = mysqlTable("patient_matching_preferences", {
  id: int("id").autoincrement().primaryKey(),
  patientId: int("patient_id").notNull().unique(),
  
  // Preferred doctor characteristics
  preferredGender: mysqlEnum("preferred_gender", ["male", "female", "any"]).default("any"),
  preferredLanguages: text("preferred_languages"), // JSON array
  preferredSpecialties: text("preferred_specialties"), // JSON array
  
  // Communication preferences
  preferredCommunicationStyle: mysqlEnum("preferred_communication_style", ["direct", "detailed", "empathetic", "any"]).default("any"),
  preferredConsultationType: text("preferred_consultation_type"), // JSON: ["video", "audio", "chat"]
  
  // Availability preferences
  preferredTimeSlots: text("preferred_time_slots"), // JSON array of time ranges
  maxWaitingTimeMinutes: int("max_waiting_time_minutes").default(30),
  
  // Location preferences
  maxDistanceKm: float("max_distance_km").default(20),
  preferInPersonConsultation: boolean("prefer_in_person_consultation").default(false),
  
  // Experience preferences
  minDoctorExperienceYears: int("min_doctor_experience_years").default(0),
  preferHighlyRated: boolean("prefer_highly_rated").default(true),
  
  // Historical learning (auto-updated by ML)
  learnedPreferences: text("learned_preferences"), // JSON object with ML-derived preferences
  lastUpdatedByML: timestamp("last_updated_by_ml"),
  
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().onUpdateNow().notNull(),
}, (table) => ({
  patientIdx: index("patient_idx").on(table.patientId),
}));

export type PatientMatchingPreference = typeof patientMatchingPreferences.$inferSelect;
export type InsertPatientMatchingPreference = typeof patientMatchingPreferences.$inferInsert;

/**
 * Doctor Availability Slots (Real-time)
 * Tracks current availability and capacity
 */
export const doctorAvailabilityStatus = mysqlTable("doctor_availability_status", {
  id: int("id").autoincrement().primaryKey(),
  doctorId: int("doctor_id").notNull().unique(),
  
  // Current status
  isAvailable: boolean("is_available").default(false).notNull(),
  availabilityStatus: mysqlEnum("availability_status", ["online", "busy", "offline", "in_consultation"]).default("offline").notNull(),
  
  // Capacity tracking
  currentPatientsToday: int("current_patients_today").default(0).notNull(),
  currentPatientsThisHour: int("current_patients_this_hour").default(0).notNull(),
  maxPatientsPerDay: int("max_patients_per_day").default(50).notNull(),
  maxPatientsPerHour: int("max_patients_per_hour").default(4).notNull(),
  
  // Queue information
  currentQueueLength: int("current_queue_length").default(0).notNull(),
  estimatedWaitTimeMinutes: int("estimated_wait_time_minutes").default(0).notNull(),
  
  // Location (for distance matching)
  currentLatitude: float("current_latitude"),
  currentLongitude: float("current_longitude"),
  locationUpdatedAt: timestamp("location_updated_at"),
  
  // Status timestamps
  lastStatusChange: timestamp("last_status_change").defaultNow().notNull(),
  lastConsultationStart: timestamp("last_consultation_start"),
  lastConsultationEnd: timestamp("last_consultation_end"),
  
  // Auto-offline settings
  autoOfflineAfterMinutes: int("auto_offline_after_minutes").default(15),
  
  updatedAt: timestamp("updated_at").defaultNow().onUpdateNow().notNull(),
}, (table) => ({
  doctorIdx: index("doctor_idx").on(table.doctorId),
  availabilityIdx: index("availability_idx").on(table.isAvailable, table.availabilityStatus),
}));

export type DoctorAvailabilityStatus = typeof doctorAvailabilityStatus.$inferSelect;
export type InsertDoctorAvailabilityStatus = typeof doctorAvailabilityStatus.$inferInsert;

/**
 * Matching Success Metrics
 * Tracks success rates for continuous improvement
 */
export const matchingSuccessMetrics = mysqlTable("matching_success_metrics", {
  id: int("id").autoincrement().primaryKey(),
  doctorId: int("doctor_id").notNull(),
  specialtyId: int("specialty_id"),
  
  // Time period
  periodStart: timestamp("period_start").notNull(),
  periodEnd: timestamp("period_end").notNull(),
  
  // Matching metrics
  totalMatches: int("total_matches").default(0).notNull(),
  acceptedMatches: int("accepted_matches").default(0).notNull(),
  declinedMatches: int("declined_matches").default(0).notNull(),
  acceptanceRate: float("acceptance_rate").default(0).notNull(), // 0-1
  
  // Outcome metrics
  completedConsultations: int("completed_consultations").default(0).notNull(),
  successfulTreatments: int("successful_treatments").default(0).notNull(),
  successRate: float("success_rate").default(0).notNull(), // 0-1
  
  // Patient satisfaction
  averagePatientRating: float("average_patient_rating").default(0).notNull(), // 0-5
  totalRatings: int("total_ratings").default(0).notNull(),
  
  // Response time
  averageResponseTimeMinutes: float("average_response_time_minutes").default(0).notNull(),
  
  // Follow-up rate
  followUpRate: float("follow_up_rate").default(0).notNull(), // 0-1
  
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().onUpdateNow().notNull(),
}, (table) => ({
  doctorIdx: index("doctor_idx").on(table.doctorId),
  specialtyIdx: index("specialty_idx").on(table.specialtyId),
  periodIdx: index("period_idx").on(table.periodStart, table.periodEnd),
}));

export type MatchingSuccessMetric = typeof matchingSuccessMetrics.$inferSelect;
export type InsertMatchingSuccessMetric = typeof matchingSuccessMetrics.$inferInsert;

/**
 * Emergency Assignment Queue
 * Handles emergency cases with priority
 */
export const emergencyAssignmentQueue = mysqlTable("emergency_assignment_queue", {
  id: int("id").autoincrement().primaryKey(),
  patientId: int("patient_id").notNull(),
  triageRecordId: int("triage_record_id").notNull(),
  
  // Priority
  urgencyLevel: mysqlEnum("urgency_level", ["critical", "urgent", "semi_urgent"]).notNull(),
  priorityScore: int("priority_score").notNull(), // Higher = more urgent
  
  // Required specialty
  requiredSpecialtyId: int("required_specialty_id"),
  requiredSpecialtyName: varchar("required_specialty_name", { length: 100 }),
  
  // Assignment status
  status: mysqlEnum("status", ["pending", "assigned", "in_progress", "completed", "expired"]).default("pending").notNull(),
  assignedDoctorId: int("assigned_doctor_id"),
  assignedAt: timestamp("assigned_at"),
  
  // Queue position
  queuePosition: int("queue_position"),
  estimatedWaitTimeMinutes: int("estimated_wait_time_minutes"),
  
  // Timeout
  expiresAt: timestamp("expires_at").notNull(), // Auto-escalate if not assigned
  
  // Attempted assignments
  attemptedDoctorIds: text("attempted_doctor_ids"), // JSON array of doctor IDs already tried
  attemptCount: int("attempt_count").default(0).notNull(),
  
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().onUpdateNow().notNull(),
}, (table) => ({
  patientIdx: index("patient_idx").on(table.patientId),
  statusIdx: index("status_idx").on(table.status),
  urgencyIdx: index("urgency_idx").on(table.urgencyLevel, table.priorityScore),
  expiresIdx: index("expires_idx").on(table.expiresAt),
}));

export type EmergencyAssignmentQueue = typeof emergencyAssignmentQueue.$inferSelect;
export type InsertEmergencyAssignmentQueue = typeof emergencyAssignmentQueue.$inferInsert;
