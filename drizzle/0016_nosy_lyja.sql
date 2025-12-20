CREATE TABLE `audit_logs` (
	`id` int AUTO_INCREMENT NOT NULL,
	`user_id` int,
	`action` varchar(100) NOT NULL,
	`resource_type` varchar(50),
	`resource_id` varchar(100),
	`ip_address` varchar(45),
	`user_agent` text,
	`details` text,
	`success` boolean NOT NULL,
	`error_message` text,
	`timestamp` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `audit_logs_id` PRIMARY KEY(`id`)
);
