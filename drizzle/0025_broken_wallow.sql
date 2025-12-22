CREATE TABLE `patient_vitals` (
	`id` int AUTO_INCREMENT NOT NULL,
	`user_id` int NOT NULL,
	`heart_rate` int,
	`respiration_rate` int,
	`oxygen_saturation` int,
	`stress_level` varchar(20),
	`confidence_score` int,
	`method` varchar(50) DEFAULT 'OPTIC_CAMERA',
	`measurement_duration` int,
	`device_info` text,
	`environmental_factors` text,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `patient_vitals_id` PRIMARY KEY(`id`)
);
