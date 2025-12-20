ALTER TABLE `users` ADD `availability_status` enum('available','busy','offline') DEFAULT 'offline';--> statement-breakpoint
ALTER TABLE `users` ADD `current_patient_count` int DEFAULT 0;--> statement-breakpoint
ALTER TABLE `users` ADD `max_patients_per_day` int DEFAULT 50;--> statement-breakpoint
ALTER TABLE `users` ADD `last_status_change` timestamp;--> statement-breakpoint
ALTER TABLE `users` ADD `auto_offline_minutes` int DEFAULT 15;