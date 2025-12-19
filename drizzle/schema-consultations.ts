import { mysqlTable, int, varchar, text, timestamp, boolean, mysqlEnum } from "drizzle-orm/mysql-core";

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
