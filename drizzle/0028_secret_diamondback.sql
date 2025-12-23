CREATE TABLE `doctor_performance_metrics` (
	`id` int AUTO_INCREMENT NOT NULL,
	`doctor_id` int NOT NULL,
	`total_consultations` int NOT NULL DEFAULT 0,
	`successful_consultations` int NOT NULL DEFAULT 0,
	`cancelled_consultations` int NOT NULL DEFAULT 0,
	`avg_response_time` int NOT NULL DEFAULT 180,
	`avg_consultation_duration` int NOT NULL DEFAULT 20,
	`patient_satisfaction_avg` decimal(3,2) NOT NULL DEFAULT '4.20',
	`total_ratings` int NOT NULL DEFAULT 0,
	`specialty_success_rates` text NOT NULL,
	`avg_daily_available_hours` decimal(4,2) NOT NULL DEFAULT '8.00',
	`total_online_hours` int NOT NULL DEFAULT 0,
	`follow_up_rate` decimal(3,2) NOT NULL DEFAULT '0.80',
	`prescription_accuracy_rate` decimal(3,2) NOT NULL DEFAULT '0.95',
	`last_updated` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `doctor_performance_metrics_id` PRIMARY KEY(`id`),
	CONSTRAINT `doctor_performance_metrics_doctor_id_unique` UNIQUE(`doctor_id`)
);
--> statement-breakpoint
CREATE TABLE `network_quality_logs` (
	`id` int AUTO_INCREMENT NOT NULL,
	`doctor_id` int NOT NULL,
	`latency` int NOT NULL,
	`bandwidth` decimal(6,2) NOT NULL,
	`packet_loss` decimal(5,4) NOT NULL DEFAULT '0.0000',
	`jitter` int NOT NULL DEFAULT 0,
	`quality` enum('EXCELLENT','GOOD','FAIR','POOR') NOT NULL,
	`consultation_id` int,
	`session_duration` int,
	`disconnection_count` int NOT NULL DEFAULT 0,
	`device_type` varchar(50),
	`network_type` varchar(50),
	`measured_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `network_quality_logs_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `network_quality_metrics` (
	`id` int AUTO_INCREMENT NOT NULL,
	`doctor_id` int NOT NULL,
	`avg_latency` int NOT NULL,
	`avg_bandwidth` decimal(6,2) NOT NULL,
	`connection_drop_rate` decimal(5,4) NOT NULL DEFAULT '0.0000',
	`avg_jitter` int NOT NULL DEFAULT 0,
	`excellent_count` int NOT NULL DEFAULT 0,
	`good_count` int NOT NULL DEFAULT 0,
	`fair_count` int NOT NULL DEFAULT 0,
	`poor_count` int NOT NULL DEFAULT 0,
	`last_connection_quality` enum('EXCELLENT','GOOD','FAIR','POOR') NOT NULL,
	`measurement_count` int NOT NULL DEFAULT 0,
	`last_measured` timestamp NOT NULL DEFAULT (now()),
	`last_updated` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `network_quality_metrics_id` PRIMARY KEY(`id`),
	CONSTRAINT `network_quality_metrics_doctor_id_unique` UNIQUE(`doctor_id`)
);
