CREATE TABLE `patient_pressure_sensitivity` (
	`id` int AUTO_INCREMENT NOT NULL,
	`user_id` int NOT NULL,
	`condition_id` int NOT NULL,
	`confirmed` boolean NOT NULL DEFAULT false,
	`sensitivity` enum('low','moderate','high','severe') NOT NULL DEFAULT 'moderate',
	`typical_drop_trigger` decimal(5,2),
	`typical_rise_trigger` decimal(5,2),
	`typical_onset_delay` int,
	`last_symptom_date` date,
	`symptom_frequency` int,
	`average_severity` int,
	`notes` text,
	`management_strategies` text,
	`first_reported_at` timestamp NOT NULL DEFAULT (now()),
	`last_updated` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `patient_pressure_sensitivity_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `pressure_sensitive_conditions` (
	`id` int AUTO_INCREMENT NOT NULL,
	`condition_name` varchar(255) NOT NULL,
	`category` enum('migraine','headache','joint_pain','arthritis','respiratory','cardiovascular','neurological','other') NOT NULL,
	`pressure_drop_threshold` decimal(5,2),
	`pressure_rise_threshold` decimal(5,2),
	`change_velocity_threshold` decimal(5,2),
	`common_symptoms` text,
	`severity_factors` text,
	`description` text,
	`prevalence` varchar(50),
	`evidence_level` varchar(10),
	`references` text,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `pressure_sensitive_conditions_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `pressure_symptom_events` (
	`id` int AUTO_INCREMENT NOT NULL,
	`user_id` int NOT NULL,
	`sensitivity_id` int NOT NULL,
	`weather_id` int,
	`symptom_onset` timestamp NOT NULL,
	`symptom_resolution` timestamp,
	`severity` int NOT NULL,
	`pressure_at_onset` decimal(6,2),
	`pressure_change_1h` decimal(5,2),
	`pressure_change_3h` decimal(5,2),
	`temperature_at_onset` decimal(5,2),
	`humidity_at_onset` int,
	`symptoms` text,
	`intervention_taken` text,
	`intervention_effectiveness` int,
	`notes` text,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `pressure_symptom_events_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `weather_conditions` (
	`id` int AUTO_INCREMENT NOT NULL,
	`latitude` decimal(10,7) NOT NULL,
	`longitude` decimal(10,7) NOT NULL,
	`city_name` varchar(255),
	`country_code` varchar(2),
	`pressure` decimal(6,2) NOT NULL,
	`temperature` decimal(5,2),
	`humidity` int,
	`weather_condition` varchar(100),
	`wind_speed` decimal(5,2),
	`pressure_change_1h` decimal(5,2),
	`pressure_change_3h` decimal(5,2),
	`pressure_change_24h` decimal(5,2),
	`source` varchar(50) NOT NULL DEFAULT 'openweather',
	`external_id` varchar(255),
	`observed_at` timestamp NOT NULL,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `weather_conditions_id` PRIMARY KEY(`id`)
);
