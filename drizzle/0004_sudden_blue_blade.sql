CREATE TABLE `appointment_booking_requests` (
	`id` int AUTO_INCREMENT NOT NULL,
	`patient_id` int NOT NULL,
	`doctor_id` int NOT NULL,
	`slot_id` int NOT NULL,
	`status` enum('pending','confirmed','rejected','cancelled','expired') NOT NULL DEFAULT 'pending',
	`chief_complaint` text,
	`symptoms` text,
	`urgency_level` varchar(50),
	`triage_record_id` int,
	`confirmed_by` int,
	`confirmed_at` timestamp,
	`rejected_by` int,
	`rejected_at` timestamp,
	`rejection_reason` text,
	`suggested_slots` text,
	`appointment_id` int,
	`expires_at` timestamp,
	`patient_notified` boolean DEFAULT false,
	`doctor_notified` boolean DEFAULT false,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `appointment_booking_requests_id` PRIMARY KEY(`id`),
	CONSTRAINT `appointment_booking_requests_appointment_id_unique` UNIQUE(`appointment_id`)
);
--> statement-breakpoint
CREATE TABLE `calendar_slots` (
	`id` int AUTO_INCREMENT NOT NULL,
	`doctor_id` int NOT NULL,
	`slot_date` date NOT NULL,
	`start_time` time NOT NULL,
	`end_time` time NOT NULL,
	`slot_start` timestamp NOT NULL,
	`slot_end` timestamp NOT NULL,
	`status` enum('available','booked','blocked','completed','cancelled','no_show','past') NOT NULL DEFAULT 'available',
	`appointment_id` int,
	`patient_id` int,
	`slot_type` enum('regular','emergency','follow_up','break','personal') NOT NULL DEFAULT 'regular',
	`blocked_by` int,
	`block_reason` varchar(255),
	`notes` text,
	`generated_from` int,
	`is_manual` boolean DEFAULT false,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `calendar_slots_id` PRIMARY KEY(`id`),
	CONSTRAINT `calendar_slots_appointment_id_unique` UNIQUE(`appointment_id`)
);
--> statement-breakpoint
CREATE TABLE `doctor_availability_exceptions` (
	`id` int AUTO_INCREMENT NOT NULL,
	`doctor_id` int NOT NULL,
	`exception_date` date NOT NULL,
	`exception_type` enum('unavailable','custom_hours','holiday','vacation','conference','emergency') NOT NULL,
	`custom_start_time` time,
	`custom_end_time` time,
	`reason` varchar(255),
	`notes` text,
	`cancel_existing_appointments` boolean DEFAULT false,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `doctor_availability_exceptions_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `doctor_working_hours` (
	`id` int AUTO_INCREMENT NOT NULL,
	`doctor_id` int NOT NULL,
	`day_of_week` int NOT NULL,
	`start_time` time NOT NULL,
	`end_time` time NOT NULL,
	`slot_duration` int NOT NULL DEFAULT 30,
	`buffer_time` int DEFAULT 0,
	`is_active` boolean NOT NULL DEFAULT true,
	`effective_from` date,
	`effective_to` date,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `doctor_working_hours_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `slot_generation_history` (
	`id` int AUTO_INCREMENT NOT NULL,
	`doctor_id` int NOT NULL,
	`start_date` date NOT NULL,
	`end_date` date NOT NULL,
	`slots_generated` int NOT NULL,
	`working_hours_used` text,
	`generation_type` enum('manual','automatic','bulk','recurring') NOT NULL,
	`triggered_by` int,
	`status` enum('success','partial','failed') NOT NULL,
	`error_message` text,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `slot_generation_history_id` PRIMARY KEY(`id`)
);
