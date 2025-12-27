CREATE TABLE `circuit_breaker_states` (
	`id` bigint AUTO_INCREMENT NOT NULL,
	`circuit_name` varchar(255) NOT NULL,
	`state` varchar(50) NOT NULL,
	`failure_count` int NOT NULL DEFAULT 0,
	`success_count` int NOT NULL DEFAULT 0,
	`last_failure_at` timestamp,
	`last_success_at` timestamp,
	`opened_at` timestamp,
	`next_retry_at` timestamp,
	`configuration` json,
	`updated_at` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `circuit_breaker_states_id` PRIMARY KEY(`id`),
	CONSTRAINT `circuit_breaker_states_circuit_name_unique` UNIQUE(`circuit_name`)
);
--> statement-breakpoint
CREATE TABLE `failure_events` (
	`id` bigint AUTO_INCREMENT NOT NULL,
	`event_id` varchar(100) NOT NULL,
	`timestamp` timestamp NOT NULL DEFAULT (now()),
	`failure_category` varchar(100) NOT NULL,
	`failure_type` varchar(100) NOT NULL,
	`severity` varchar(50) NOT NULL,
	`affected_service` varchar(255) NOT NULL,
	`error_message` text,
	`error_stack` text,
	`context` json,
	`detection_method` varchar(100) NOT NULL,
	`user_id` varchar(255),
	`request_id` varchar(255),
	`resolved` boolean NOT NULL DEFAULT false,
	`resolved_at` timestamp,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `failure_events_id` PRIMARY KEY(`id`),
	CONSTRAINT `failure_events_event_id_unique` UNIQUE(`event_id`)
);
--> statement-breakpoint
CREATE TABLE `recovery_actions` (
	`id` bigint AUTO_INCREMENT NOT NULL,
	`action_id` varchar(100) NOT NULL,
	`failure_event_id` bigint NOT NULL,
	`timestamp` timestamp NOT NULL DEFAULT (now()),
	`action_type` varchar(100) NOT NULL,
	`action_strategy` varchar(255) NOT NULL,
	`status` varchar(50) NOT NULL,
	`automated` boolean NOT NULL,
	`triggered_by` varchar(255),
	`parameters` json,
	`result` json,
	`duration_ms` int,
	`completed_at` timestamp,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `recovery_actions_id` PRIMARY KEY(`id`),
	CONSTRAINT `recovery_actions_action_id_unique` UNIQUE(`action_id`)
);
--> statement-breakpoint
CREATE TABLE `system_health_baselines` (
	`id` bigint AUTO_INCREMENT NOT NULL,
	`metric_type` varchar(100) NOT NULL,
	`metric_name` varchar(255) NOT NULL,
	`source` varchar(255) NOT NULL,
	`time_window` varchar(50) NOT NULL,
	`mean` bigint NOT NULL,
	`median` bigint NOT NULL,
	`std_dev` bigint NOT NULL,
	`p50` bigint NOT NULL,
	`p95` bigint NOT NULL,
	`p99` bigint NOT NULL,
	`min` bigint NOT NULL,
	`max` bigint NOT NULL,
	`sample_count` int NOT NULL,
	`calculated_at` timestamp NOT NULL,
	`valid_until` timestamp NOT NULL,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `system_health_baselines_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `system_health_metrics` (
	`id` bigint AUTO_INCREMENT NOT NULL,
	`timestamp` timestamp NOT NULL DEFAULT (now()),
	`metric_type` varchar(100) NOT NULL,
	`metric_name` varchar(255) NOT NULL,
	`value` bigint NOT NULL,
	`unit` varchar(50) NOT NULL,
	`tags` json,
	`source` varchar(255) NOT NULL,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `system_health_metrics_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `recovery_actions` ADD CONSTRAINT `recovery_actions_failure_event_id_failure_events_id_fk` FOREIGN KEY (`failure_event_id`) REFERENCES `failure_events`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX `circuit_breaker_state_idx` ON `circuit_breaker_states` (`state`);--> statement-breakpoint
CREATE INDEX `circuit_breaker_next_retry_idx` ON `circuit_breaker_states` (`next_retry_at`);--> statement-breakpoint
CREATE INDEX `failure_events_timestamp_idx` ON `failure_events` (`timestamp`);--> statement-breakpoint
CREATE INDEX `failure_events_category_idx` ON `failure_events` (`failure_category`);--> statement-breakpoint
CREATE INDEX `failure_events_severity_idx` ON `failure_events` (`severity`);--> statement-breakpoint
CREATE INDEX `failure_events_resolved_idx` ON `failure_events` (`resolved`);--> statement-breakpoint
CREATE INDEX `failure_events_request_id_idx` ON `failure_events` (`request_id`);--> statement-breakpoint
CREATE INDEX `recovery_actions_failure_idx` ON `recovery_actions` (`failure_event_id`);--> statement-breakpoint
CREATE INDEX `recovery_actions_timestamp_idx` ON `recovery_actions` (`timestamp`);--> statement-breakpoint
CREATE INDEX `recovery_actions_status_idx` ON `recovery_actions` (`status`);--> statement-breakpoint
CREATE INDEX `baselines_metric_idx` ON `system_health_baselines` (`metric_type`,`metric_name`,`source`);--> statement-breakpoint
CREATE INDEX `baselines_valid_until_idx` ON `system_health_baselines` (`valid_until`);--> statement-breakpoint
CREATE INDEX `health_metrics_timestamp_idx` ON `system_health_metrics` (`timestamp`);--> statement-breakpoint
CREATE INDEX `health_metrics_type_idx` ON `system_health_metrics` (`metric_type`);--> statement-breakpoint
CREATE INDEX `health_metrics_source_idx` ON `system_health_metrics` (`source`);