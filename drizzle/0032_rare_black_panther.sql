CREATE TABLE `conversation_messages` (
	`id` int AUTO_INCREMENT NOT NULL,
	`session_id` int NOT NULL,
	`role` enum('user','assistant','system') NOT NULL,
	`content` text NOT NULL,
	`content_ar` text,
	`timestamp` timestamp NOT NULL DEFAULT (now()),
	`token_count` int,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `conversation_messages_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `conversation_results` (
	`id` int AUTO_INCREMENT NOT NULL,
	`session_id` int NOT NULL,
	`brain_case_id` varchar(100),
	`triage_level` enum('green','yellow','red') NOT NULL,
	`urgency` varchar(50) NOT NULL,
	`primary_diagnosis` varchar(255),
	`diagnosis_probability` decimal(5,4),
	`differential_diagnosis` text,
	`recommendations` text,
	`red_flags` text,
	`immediate_actions` text,
	`specialist_referral` varchar(255),
	`matched_doctor_id` int,
	`matched_clinic_id` int,
	`match_score` decimal(5,4),
	`estimated_wait_time` int,
	`google_maps_link` varchar(512),
	`uber_link` varchar(512),
	`created_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `conversation_results_id` PRIMARY KEY(`id`),
	CONSTRAINT `conversation_results_session_id_unique` UNIQUE(`session_id`)
);
--> statement-breakpoint
CREATE TABLE `conversation_sessions` (
	`id` int AUTO_INCREMENT NOT NULL,
	`user_id` int NOT NULL,
	`session_id` varchar(100) NOT NULL,
	`language` varchar(10) NOT NULL DEFAULT 'en',
	`status` enum('in_progress','completed','abandoned') NOT NULL DEFAULT 'in_progress',
	`started_at` timestamp NOT NULL DEFAULT (now()),
	`completed_at` timestamp,
	`last_activity_at` timestamp NOT NULL DEFAULT (now()),
	`context_vector` text,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `conversation_sessions_id` PRIMARY KEY(`id`),
	CONSTRAINT `conversation_sessions_session_id_unique` UNIQUE(`session_id`)
);
--> statement-breakpoint
CREATE TABLE `emergency_alerts` (
	`id` int AUTO_INCREMENT NOT NULL,
	`user_id` int NOT NULL,
	`session_id` int,
	`severity` enum('critical','high','medium') NOT NULL DEFAULT 'high',
	`alert_type` varchar(100) NOT NULL,
	`red_flags` text NOT NULL,
	`notification_sent` boolean NOT NULL DEFAULT false,
	`notification_method` varchar(50),
	`notification_sent_at` timestamp,
	`user_acknowledged` boolean NOT NULL DEFAULT false,
	`acknowledged_at` timestamp,
	`user_action` varchar(255),
	`follow_up_required` boolean NOT NULL DEFAULT false,
	`follow_up_completed_at` timestamp,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `emergency_alerts_id` PRIMARY KEY(`id`)
);
