CREATE TABLE `bio_scanner_calibration` (
	`id` int AUTO_INCREMENT NOT NULL,
	`user_id` int NOT NULL,
	`reference_heart_rate` int NOT NULL,
	`measured_heart_rate` int NOT NULL,
	`correction_factor` decimal(10,4) NOT NULL,
	`calibration_date` timestamp NOT NULL DEFAULT (now()),
	`reference_device` varchar(100),
	`notes` text,
	`updated_at` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `bio_scanner_calibration_id` PRIMARY KEY(`id`),
	CONSTRAINT `bio_scanner_calibration_user_id_unique` UNIQUE(`user_id`)
);
