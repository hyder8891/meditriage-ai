ALTER TABLE `users` MODIFY COLUMN `openId` varchar(64);--> statement-breakpoint
ALTER TABLE `users` MODIFY COLUMN `role` enum('patient','clinician','admin') NOT NULL DEFAULT 'patient';--> statement-breakpoint
ALTER TABLE `users` ADD `password_hash` varchar(255);--> statement-breakpoint
ALTER TABLE `users` ADD `license_number` varchar(100);--> statement-breakpoint
ALTER TABLE `users` ADD `specialty` varchar(100);--> statement-breakpoint
ALTER TABLE `users` ADD `verified` boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE `users` ADD `email_verified` boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE `users` ADD `verification_token` varchar(255);--> statement-breakpoint
ALTER TABLE `users` ADD `verification_token_expiry` timestamp;--> statement-breakpoint
ALTER TABLE `users` ADD `reset_token` varchar(255);--> statement-breakpoint
ALTER TABLE `users` ADD `reset_token_expiry` timestamp;--> statement-breakpoint
ALTER TABLE `users` ADD CONSTRAINT `users_email_unique` UNIQUE(`email`);