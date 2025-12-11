CREATE TABLE `medical_documents` (
	`id` int AUTO_INCREMENT NOT NULL,
	`user_id` int NOT NULL,
	`triage_record_id` int,
	`file_name` varchar(255) NOT NULL,
	`file_key` varchar(512) NOT NULL,
	`file_url` varchar(1024) NOT NULL,
	`file_size` int NOT NULL,
	`mime_type` varchar(100) NOT NULL,
	`document_type` varchar(50) NOT NULL,
	`description` text,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `medical_documents_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `triage_records` (
	`id` int AUTO_INCREMENT NOT NULL,
	`user_id` int NOT NULL,
	`language` varchar(10) NOT NULL DEFAULT 'en',
	`conversation_history` text NOT NULL,
	`urgency_level` varchar(50) NOT NULL,
	`chief_complaint` text NOT NULL,
	`symptoms` text NOT NULL,
	`assessment` text NOT NULL,
	`recommendations` text NOT NULL,
	`red_flags` text,
	`duration` int,
	`message_count` int NOT NULL DEFAULT 0,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `triage_records_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `voice_recordings` (
	`id` int AUTO_INCREMENT NOT NULL,
	`user_id` int NOT NULL,
	`triage_record_id` int,
	`audio_key` varchar(512) NOT NULL,
	`audio_url` varchar(1024) NOT NULL,
	`duration` int,
	`transcription` text,
	`language` varchar(10) NOT NULL,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `voice_recordings_id` PRIMARY KEY(`id`)
);
