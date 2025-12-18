CREATE TABLE `training_sessions` (
	`id` int AUTO_INCREMENT NOT NULL,
	`started_at` timestamp NOT NULL DEFAULT (now()),
	`completed_at` timestamp,
	`total_materials` int NOT NULL,
	`processed_materials` int NOT NULL,
	`successful_materials` int NOT NULL,
	`failed_materials` int NOT NULL,
	`duration` int,
	`status` varchar(50) NOT NULL DEFAULT 'running',
	`results` text,
	`error_message` text,
	`triggered_by` int NOT NULL,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `training_sessions_id` PRIMARY KEY(`id`)
);
