CREATE TABLE `brain_error_analysis` (
	`id` int AUTO_INCREMENT NOT NULL,
	`case_id` varchar(100) NOT NULL,
	`predicted_condition` varchar(255),
	`actual_condition` varchar(255) NOT NULL,
	`missed_symptoms` text,
	`error_type` enum('missed_diagnosis','incorrect_ranking','no_diagnosis','false_positive','unknown') NOT NULL,
	`severity` enum('low','medium','high','critical') DEFAULT 'medium',
	`root_cause` text,
	`correction_applied` text,
	`reviewed` boolean DEFAULT false,
	`reviewed_by` int,
	`reviewed_at` timestamp,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `brain_error_analysis_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `brain_learned_patterns` (
	`id` int AUTO_INCREMENT NOT NULL,
	`pattern_type` varchar(100) NOT NULL,
	`pattern_data` text NOT NULL,
	`condition` varchar(255),
	`symptoms` text,
	`confidence` decimal(5,4) NOT NULL,
	`times_applied` int DEFAULT 0,
	`success_rate` decimal(5,4),
	`source_session_id` varchar(100),
	`derived_from_cases` int DEFAULT 1,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `brain_learned_patterns_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `brain_medical_literature` (
	`id` int AUTO_INCREMENT NOT NULL,
	`source` varchar(50) NOT NULL DEFAULT 'pubmed',
	`title` varchar(500) NOT NULL,
	`authors` text,
	`journal` varchar(255),
	`publication_date` varchar(50),
	`abstract` text,
	`literature_data` text,
	`pmid` varchar(50),
	`doi` varchar(255),
	`url` varchar(1024),
	`times_referenced` int DEFAULT 0,
	`relevance_score` decimal(5,4),
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `brain_medical_literature_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `brain_training_notifications` (
	`id` int AUTO_INCREMENT NOT NULL,
	`session_id` varchar(100),
	`notification_type` enum('training_complete','training_failed','accuracy_improved','accuracy_degraded','new_pattern_learned','error_threshold_exceeded','approval_required') NOT NULL,
	`message` text NOT NULL,
	`details` text,
	`priority` enum('low','medium','high','urgent') DEFAULT 'medium',
	`read` boolean DEFAULT false,
	`read_at` timestamp,
	`read_by` int,
	`action_required` boolean DEFAULT false,
	`action_taken` boolean DEFAULT false,
	`action_taken_at` timestamp,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `brain_training_notifications_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `brain_training_sessions` (
	`id` int AUTO_INCREMENT NOT NULL,
	`session_id` varchar(100) NOT NULL,
	`start_time` timestamp NOT NULL,
	`end_time` timestamp,
	`cases_processed` int DEFAULT 0,
	`accuracy_before` decimal(5,4),
	`accuracy_after` decimal(5,4),
	`improvement_rate` decimal(6,2),
	`status` enum('running','completed','failed') NOT NULL DEFAULT 'running',
	`error_message` text,
	`approved` boolean DEFAULT false,
	`approved_at` timestamp,
	`approved_by` int,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `brain_training_sessions_id` PRIMARY KEY(`id`),
	CONSTRAINT `brain_training_sessions_session_id_unique` UNIQUE(`session_id`)
);
