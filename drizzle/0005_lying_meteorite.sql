CREATE TABLE `transcriptions` (
	`id` int AUTO_INCREMENT NOT NULL,
	`case_id` int,
	`clinician_id` int NOT NULL,
	`audio_key` varchar(512),
	`audio_url` varchar(1024),
	`duration` int,
	`transcription_text` text NOT NULL,
	`language` varchar(10) NOT NULL DEFAULT 'en',
	`speaker` enum('clinician','patient','mixed') DEFAULT 'clinician',
	`status` enum('draft','final','archived') NOT NULL DEFAULT 'draft',
	`saved_to_clinical_notes` boolean DEFAULT false,
	`clinical_note_id` int,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `transcriptions_id` PRIMARY KEY(`id`)
);
