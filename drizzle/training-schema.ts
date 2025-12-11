import { int, mysqlTable, text, timestamp, varchar } from "drizzle-orm/mysql-core";

/**
 * Medical training materials - stores medical literature for AI training
 */
export const trainingMaterials = mysqlTable("training_materials", {
  id: int("id").autoincrement().primaryKey(),
  
  // Material metadata
  title: varchar("title", { length: 500 }).notNull(),
  category: varchar("category", { length: 100 }).notNull(), // pharmacology, radiology, pathology, etc.
  source: varchar("source", { length: 500 }).notNull(), // OpenFDA, PubMed, etc.
  sourceUrl: varchar("source_url", { length: 1024 }),
  
  // Content
  content: text("content").notNull(),
  contentHash: varchar("content_hash", { length: 64 }), // For deduplication
  
  // Cloud storage
  storageKey: varchar("storage_key", { length: 512 }), // S3 key for full document
  storageUrl: varchar("storage_url", { length: 1024 }), // S3 URL
  
  // AI processing results
  summary: text("summary"),
  keyFindings: text("key_findings"), // JSON array
  clinicalRelevance: text("clinical_relevance"),
  
  // Training metadata
  processedAt: timestamp("processed_at"),
  trainingStatus: varchar("training_status", { length: 50 }).default("pending"), // pending, processed, trained
  
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
  
  // Full conversation data
  conversationJson: text("conversation_json").notNull(), // Complete Q&A pairs
  
  // Extracted features
  symptoms: text("symptoms").notNull(), // JSON array
  patientAge: int("patient_age"),
  patientGender: varchar("patient_gender", { length: 20 }),
  
  // Outcomes
  finalDiagnosis: text("final_diagnosis"),
  urgencyLevel: varchar("urgency_level", { length: 50 }).notNull(),
  
  // Cloud storage for attachments
  attachedFiles: text("attached_files"), // JSON array of S3 URLs
  xrayImages: text("xray_images"), // JSON array of S3 URLs
  
  // Training metadata
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
  
  // Knowledge entry
  topic: varchar("topic", { length: 500 }).notNull(),
  category: varchar("category", { length: 100 }).notNull(),
  
  // Content
  content: text("content").notNull(),
  references: text("references"), // JSON array of source IDs
  
  // Metadata
  confidence: int("confidence").default(0), // 0-100
  lastVerified: timestamp("last_verified"),
  
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().onUpdateNow().notNull(),
});

export type MedicalKnowledgeBase = typeof medicalKnowledgeBase.$inferSelect;
export type InsertMedicalKnowledgeBase = typeof medicalKnowledgeBase.$inferInsert;
