CREATE TABLE `budget_limits` (
	`id` int AUTO_INCREMENT NOT NULL,
	`user_id` int,
	`clinic_id` int,
	`limit_type` enum('daily','weekly','monthly','total') NOT NULL,
	`limit_amount_cents` int NOT NULL,
	`current_usage_cents` int NOT NULL DEFAULT 0,
	`period_start` timestamp NOT NULL,
	`period_end` timestamp NOT NULL,
	`alert_threshold_percent` int DEFAULT 80,
	`alert_sent` enum('true','false') NOT NULL DEFAULT 'false',
	`active` enum('true','false') NOT NULL DEFAULT 'true',
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `budget_limits_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `budget_tracking` (
	`id` int AUTO_INCREMENT NOT NULL,
	`user_id` int NOT NULL,
	`session_id` varchar(255),
	`module` enum('brain_clinical_reasoning','pharma_guard','medical_imaging','lab_results','medical_reports','symptom_checker','soap_notes','bio_scanner','voice_transcription','image_generation','conversation_ai','other') NOT NULL,
	`api_provider` varchar(50) NOT NULL,
	`model` varchar(100),
	`operation_type` varchar(50),
	`input_tokens` int DEFAULT 0,
	`output_tokens` int DEFAULT 0,
	`total_tokens` int DEFAULT 0,
	`estimated_cost_cents` int DEFAULT 0,
	`request_duration` int,
	`status_code` int,
	`success` enum('true','false') NOT NULL DEFAULT 'true',
	`error_message` text,
	`metadata` text,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `budget_tracking_id` PRIMARY KEY(`id`)
);
