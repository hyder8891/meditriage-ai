CREATE TABLE `brain_knowledge_concepts` (
	`id` int AUTO_INCREMENT NOT NULL,
	`concept_type` enum('disease','symptom','treatment','investigation','risk_factor') NOT NULL,
	`name` varchar(255) NOT NULL,
	`description` text,
	`category` varchar(100),
	`icd10_code` varchar(20),
	`snomed_code` varchar(50),
	`prevalence` varchar(50),
	`severity` enum('mild','moderate','severe','critical'),
	`source` varchar(255),
	`evidence_level` varchar(50),
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `brain_knowledge_concepts_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `brain_knowledge_relationships` (
	`id` int AUTO_INCREMENT NOT NULL,
	`from_concept_id` int NOT NULL,
	`relationship_type` varchar(100) NOT NULL,
	`to_concept_id` int NOT NULL,
	`confidence` decimal(5,4),
	`strength` enum('weak','moderate','strong'),
	`context` text,
	`associated_symptoms` text,
	`distinguishing_features` text,
	`source` varchar(255),
	`times_used` int DEFAULT 0,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `brain_knowledge_relationships_id` PRIMARY KEY(`id`)
);
