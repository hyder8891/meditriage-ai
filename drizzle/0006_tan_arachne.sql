CREATE TABLE `timeline_events` (
	`id` int AUTO_INCREMENT NOT NULL,
	`case_id` int NOT NULL,
	`event_type` enum('symptom','vital_signs','diagnosis','treatment','medication','procedure','lab_result','imaging','note') NOT NULL,
	`title` varchar(255) NOT NULL,
	`description` text,
	`event_data` json,
	`severity` enum('low','medium','high','critical'),
	`recorded_by` int,
	`event_time` timestamp NOT NULL,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `timeline_events_id` PRIMARY KEY(`id`)
);
