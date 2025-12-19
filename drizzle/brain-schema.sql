-- BRAIN (Biomedical Reasoning and Intelligence Network) Database Schema
-- This schema supports the core BRAIN system with knowledge base, case history, and learning mechanisms

-- Medical knowledge concepts from UMLS and other sources
CREATE TABLE IF NOT EXISTS brain_knowledge_concepts (
  concept_id VARCHAR(20) PRIMARY KEY,
  concept_name TEXT NOT NULL,
  semantic_type VARCHAR(50),
  definition TEXT,
  source VARCHAR(50) COMMENT 'UMLS, SNOMED, ICD-10, etc.',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_concept_name (concept_name(255)),
  INDEX idx_semantic_type (semantic_type),
  INDEX idx_source (source)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Relationships between medical concepts
CREATE TABLE IF NOT EXISTS brain_knowledge_relationships (
  id INT AUTO_INCREMENT PRIMARY KEY,
  concept_id_1 VARCHAR(20) NOT NULL,
  relationship_type VARCHAR(50) NOT NULL COMMENT 'is_a, part_of, treats, causes, associated_with',
  concept_id_2 VARCHAR(20) NOT NULL,
  confidence FLOAT DEFAULT 1.0 COMMENT 'Confidence score 0-1',
  source VARCHAR(50),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_concept_1 (concept_id_1),
  INDEX idx_concept_2 (concept_id_2),
  INDEX idx_relationship_type (relationship_type),
  FOREIGN KEY (concept_id_1) REFERENCES brain_knowledge_concepts(concept_id) ON DELETE CASCADE,
  FOREIGN KEY (concept_id_2) REFERENCES brain_knowledge_concepts(concept_id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Medical literature and research papers
CREATE TABLE IF NOT EXISTS brain_medical_literature (
  id INT AUTO_INCREMENT PRIMARY KEY,
  title TEXT NOT NULL,
  abstract TEXT,
  full_text LONGTEXT,
  authors TEXT,
  publication_date DATE,
  journal VARCHAR(255),
  pmid VARCHAR(20) COMMENT 'PubMed ID',
  doi VARCHAR(100),
  medical_specialty VARCHAR(100),
  evidence_level VARCHAR(20) COMMENT 'Level I-V evidence quality',
  embedding_id VARCHAR(100) COMMENT 'Reference to vector DB embedding',
  indexed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_pmid (pmid),
  INDEX idx_doi (doi),
  INDEX idx_specialty (medical_specialty),
  INDEX idx_evidence_level (evidence_level)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Case history for every BRAIN analysis
CREATE TABLE IF NOT EXISTS brain_case_history (
  id INT AUTO_INCREMENT PRIMARY KEY,
  case_id VARCHAR(50) UNIQUE NOT NULL,
  patient_demographics JSON COMMENT 'age, gender, location (anonymized)',
  symptoms JSON COMMENT 'array of symptom concepts with IDs',
  vital_signs JSON COMMENT 'BP, HR, temp, SpO2, etc.',
  lab_results JSON,
  imaging_findings JSON,
  medical_history JSON,
  diagnosis JSON COMMENT 'differential diagnosis with probabilities',
  treatment JSON,
  outcome VARCHAR(50) COMMENT 'improved, stable, deteriorated, unknown',
  confidence_score FLOAT COMMENT 'BRAIN confidence 0-1',
  evidence_sources JSON COMMENT 'array of literature IDs used',
  clinician_feedback JSON,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_case_id (case_id),
  INDEX idx_outcome (outcome),
  INDEX idx_created_at (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Learning feedback from clinicians
CREATE TABLE IF NOT EXISTS brain_learning_feedback (
  id INT AUTO_INCREMENT PRIMARY KEY,
  case_id VARCHAR(50) NOT NULL,
  brain_diagnosis JSON COMMENT 'what BRAIN suggested',
  actual_diagnosis JSON COMMENT 'what it actually was',
  clinician_correction TEXT,
  accuracy_score FLOAT COMMENT '0-1 score',
  feedback_type VARCHAR(50) COMMENT 'correct, incorrect, partially_correct',
  learning_applied BOOLEAN DEFAULT FALSE,
  clinician_id INT COMMENT 'user who provided feedback',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_case_id (case_id),
  INDEX idx_feedback_type (feedback_type),
  INDEX idx_learning_applied (learning_applied),
  INDEX idx_created_at (created_at),
  FOREIGN KEY (case_id) REFERENCES brain_case_history(case_id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Performance metrics tracking
CREATE TABLE IF NOT EXISTS brain_performance_metrics (
  id INT AUTO_INCREMENT PRIMARY KEY,
  metric_date DATE NOT NULL UNIQUE,
  total_cases INT DEFAULT 0,
  correct_diagnoses INT DEFAULT 0,
  accuracy_rate FLOAT COMMENT 'correct/total',
  avg_confidence FLOAT COMMENT 'average BRAIN confidence',
  avg_response_time_ms INT COMMENT 'average processing time',
  knowledge_base_size INT COMMENT 'number of documents',
  model_version VARCHAR(50),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_metric_date (metric_date)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Training sessions log
CREATE TABLE IF NOT EXISTS brain_training_sessions (
  id INT AUTO_INCREMENT PRIMARY KEY,
  session_type VARCHAR(50) NOT NULL COMMENT 'fine_tuning, knowledge_update, pattern_learning',
  data_source VARCHAR(100),
  records_processed INT DEFAULT 0,
  improvements JSON COMMENT 'what improved after training',
  model_checkpoint VARCHAR(255) COMMENT 'saved model path or version',
  started_at TIMESTAMP,
  completed_at TIMESTAMP,
  status VARCHAR(20) DEFAULT 'pending' COMMENT 'pending, running, completed, failed',
  error_log TEXT,
  INDEX idx_session_type (session_type),
  INDEX idx_status (status),
  INDEX idx_started_at (started_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Insert initial performance metrics record
INSERT INTO brain_performance_metrics (metric_date, total_cases, correct_diagnoses, accuracy_rate, model_version)
VALUES (CURDATE(), 0, 0, 0.0, 'BRAIN-v1.0.0')
ON DUPLICATE KEY UPDATE updated_at = CURRENT_TIMESTAMP;

-- Insert sample medical concepts (will be replaced with actual UMLS data)
INSERT INTO brain_knowledge_concepts (concept_id, concept_name, semantic_type, definition, source) VALUES
('C0008031', 'Chest Pain', 'Sign or Symptom', 'Pain in the chest', 'UMLS'),
('C0013404', 'Dyspnea', 'Sign or Symptom', 'Shortness of breath', 'UMLS'),
('C0018802', 'Heart Failure', 'Disease or Syndrome', 'Inability of the heart to pump sufficient blood', 'UMLS'),
('C0027051', 'Myocardial Infarction', 'Disease or Syndrome', 'Heart attack', 'UMLS'),
('C0032285', 'Pneumonia', 'Disease or Syndrome', 'Lung infection', 'UMLS')
ON DUPLICATE KEY UPDATE updated_at = CURRENT_TIMESTAMP;

-- Insert sample relationships
INSERT INTO brain_knowledge_relationships (concept_id_1, relationship_type, concept_id_2, confidence, source) VALUES
('C0008031', 'may_indicate', 'C0027051', 0.8, 'Clinical'),
('C0008031', 'may_indicate', 'C0018802', 0.6, 'Clinical'),
('C0013404', 'may_indicate', 'C0018802', 0.7, 'Clinical'),
('C0013404', 'may_indicate', 'C0032285', 0.6, 'Clinical')
ON DUPLICATE KEY UPDATE confidence = VALUES(confidence);
