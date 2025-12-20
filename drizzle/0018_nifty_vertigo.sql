CREATE TABLE `aec_config` (
	`id` int AUTO_INCREMENT NOT NULL,
	`config_key` varchar(100) NOT NULL,
	`config_value` text NOT NULL,
	`description` text,
	`category` varchar(50),
	`updated_at` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `aec_config_id` PRIMARY KEY(`id`),
	CONSTRAINT `aec_config_config_key_unique` UNIQUE(`config_key`)
);
--> statement-breakpoint
CREATE TABLE `aec_detected_errors` (
	`id` int AUTO_INCREMENT NOT NULL,
	`error_type` varchar(100) NOT NULL,
	`severity` varchar(20) NOT NULL,
	`message` text NOT NULL,
	`stack_trace` text,
	`source` varchar(255),
	`endpoint` varchar(255),
	`user_context` text,
	`first_occurrence` timestamp NOT NULL DEFAULT (now()),
	`last_occurrence` timestamp NOT NULL DEFAULT (now()),
	`occurrence_count` int NOT NULL DEFAULT 1,
	`status` varchar(20) NOT NULL DEFAULT 'detected',
	`resolved_at` timestamp,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `aec_detected_errors_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `aec_diagnostics` (
	`id` int AUTO_INCREMENT NOT NULL,
	`error_id` int NOT NULL,
	`root_cause` text NOT NULL,
	`impact` varchar(20) NOT NULL,
	`affected_features` text,
	`proposed_solution` text NOT NULL,
	`confidence` decimal(5,2),
	`code_context` text,
	`related_files` text,
	`analysis_model` varchar(50),
	`analysis_duration` int,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `aec_diagnostics_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `aec_health_checks` (
	`id` int AUTO_INCREMENT NOT NULL,
	`patch_id` int,
	`status` varchar(20) NOT NULL,
	`response_time` int,
	`api_healthy` boolean NOT NULL,
	`database_healthy` boolean NOT NULL,
	`critical_endpoints_healthy` boolean NOT NULL,
	`failed_checks` text,
	`error_details` text,
	`timestamp` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `aec_health_checks_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `aec_patches` (
	`id` int AUTO_INCREMENT NOT NULL,
	`error_id` int NOT NULL,
	`patch_version` varchar(50) NOT NULL,
	`branch_name` varchar(100),
	`files_modified` text,
	`diff_content` text,
	`test_results` text,
	`validation_status` varchar(20),
	`status` varchar(20) NOT NULL DEFAULT 'generated',
	`deployed_at` timestamp,
	`deployment_notes` text,
	`rolled_back_at` timestamp,
	`rollback_reason` text,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `aec_patches_id` PRIMARY KEY(`id`)
);
