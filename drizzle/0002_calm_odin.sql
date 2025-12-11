CREATE TABLE `medical_knowledge_base` (
	`id` int AUTO_INCREMENT NOT NULL,
	`topic` varchar(500) NOT NULL,
	`category` varchar(100) NOT NULL,
	`content` text NOT NULL,
	`references` text,
	`confidence` int DEFAULT 0,
	`last_verified` timestamp,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `medical_knowledge_base_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `training_materials` (
	`id` int AUTO_INCREMENT NOT NULL,
	`title` varchar(500) NOT NULL,
	`category` varchar(100) NOT NULL,
	`source` varchar(500) NOT NULL,
	`source_url` varchar(1024),
	`content` text NOT NULL,
	`content_hash` varchar(64),
	`storage_key` varchar(512),
	`storage_url` varchar(1024),
	`summary` text,
	`key_findings` text,
	`clinical_relevance` text,
	`processed_at` timestamp,
	`training_status` varchar(50) DEFAULT 'pending',
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `training_materials_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `triage_training_data` (
	`id` int AUTO_INCREMENT NOT NULL,
	`triage_record_id` int NOT NULL,
	`conversation_json` text NOT NULL,
	`symptoms` text NOT NULL,
	`patient_age` int,
	`patient_gender` varchar(20),
	`final_diagnosis` text,
	`urgency_level` varchar(50) NOT NULL,
	`attached_files` text,
	`xray_images` text,
	`used_for_training` timestamp,
	`training_epoch` int,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `triage_training_data_id` PRIMARY KEY(`id`)
);
