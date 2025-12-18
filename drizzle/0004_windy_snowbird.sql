CREATE TABLE `cases` (
	`id` int AUTO_INCREMENT NOT NULL,
	`patient_name` varchar(255) NOT NULL,
	`patient_age` int,
	`patient_gender` enum('male','female','other'),
	`chief_complaint` text NOT NULL,
	`status` enum('active','completed','archived') NOT NULL DEFAULT 'active',
	`urgency` enum('emergency','urgent','semi-urgent','non-urgent','routine'),
	`clinician_id` int NOT NULL,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `cases_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `clinical_notes` (
	`id` int AUTO_INCREMENT NOT NULL,
	`case_id` int NOT NULL,
	`note_type` enum('history','examination','assessment','plan','scribe') NOT NULL,
	`content` text NOT NULL,
	`created_by` int NOT NULL,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `clinical_notes_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `diagnoses` (
	`id` int AUTO_INCREMENT NOT NULL,
	`case_id` int NOT NULL,
	`diagnosis` varchar(500) NOT NULL,
	`probability` int,
	`reasoning` text,
	`red_flags` text,
	`recommended_actions` text,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `diagnoses_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `facilities` (
	`id` int AUTO_INCREMENT NOT NULL,
	`name` varchar(255) NOT NULL,
	`type` enum('hospital','clinic','emergency','specialist') NOT NULL,
	`address` text NOT NULL,
	`latitude` varchar(50),
	`longitude` varchar(50),
	`phone` varchar(50),
	`specialties` text,
	`emergency_services` int DEFAULT 0,
	CONSTRAINT `facilities_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `medications` (
	`id` int AUTO_INCREMENT NOT NULL,
	`name` varchar(255) NOT NULL,
	`generic_name` varchar(255),
	`category` varchar(100),
	`interactions` text,
	`contraindications` text,
	`side_effects` text,
	CONSTRAINT `medications_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `vitals` (
	`id` int AUTO_INCREMENT NOT NULL,
	`case_id` int NOT NULL,
	`bp_systolic` int,
	`bp_diastolic` int,
	`heart_rate` int,
	`temperature` varchar(10),
	`oxygen_saturation` int,
	`respiratory_rate` int,
	`weight` varchar(20),
	`height` varchar(20),
	`recorded_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `vitals_id` PRIMARY KEY(`id`)
);
