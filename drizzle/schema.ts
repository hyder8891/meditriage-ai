import { int, mysqlEnum, mysqlTable, text, timestamp, varchar, boolean } from "drizzle-orm/mysql-core";

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
