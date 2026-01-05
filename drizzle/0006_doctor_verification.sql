-- Add doctor verification status fields to users table
ALTER TABLE `users` ADD COLUMN `verification_status` enum('unverified','pending_documents','pending_review','verified','rejected') DEFAULT 'unverified';
ALTER TABLE `users` ADD COLUMN `admin_verified` boolean NOT NULL DEFAULT false;
ALTER TABLE `users` ADD COLUMN `admin_verified_by` int;
ALTER TABLE `users` ADD COLUMN `admin_verified_at` timestamp;
ALTER TABLE `users` ADD COLUMN `documents_submitted_at` timestamp;
ALTER TABLE `users` ADD COLUMN `auto_verified_at` timestamp;

-- Create doctor verification documents table
CREATE TABLE IF NOT EXISTS `doctor_verification_documents` (
  `id` int AUTO_INCREMENT NOT NULL,
  `user_id` int NOT NULL,
  `document_type` enum('national_id','medical_certificate') NOT NULL,
  `file_key` varchar(512) NOT NULL,
  `file_url` varchar(1024) NOT NULL,
  `file_name` varchar(255) NOT NULL,
  `file_size` int NOT NULL,
  `mime_type` varchar(100) NOT NULL,
  `extracted_name` varchar(255),
  `extracted_name_arabic` varchar(255),
  `extracted_date_of_birth` date,
  `extracted_id_number` varchar(100),
  `extracted_license_number` varchar(100),
  `extracted_specialty` varchar(100),
  `extracted_issuing_authority` varchar(255),
  `extracted_issue_date` date,
  `extracted_expiry_date` date,
  `extracted_medical_school` varchar(255),
  `extracted_graduation_year` int,
  `extracted_raw_data` text,
  `processing_status` enum('pending','processing','completed','failed') NOT NULL DEFAULT 'pending',
  `processing_error` text,
  `processed_at` timestamp,
  `verification_status` enum('pending','verified','rejected','needs_review') NOT NULL DEFAULT 'pending',
  `verification_notes` text,
  `name_match_score` decimal(5,2),
  `name_match_passed` boolean,
  `created_at` timestamp NOT NULL DEFAULT (now()),
  `updated_at` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT `doctor_verification_documents_id` PRIMARY KEY(`id`)
);
