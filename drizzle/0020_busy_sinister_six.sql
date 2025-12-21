ALTER TABLE `users` ADD `phone_number` varchar(20);--> statement-breakpoint
ALTER TABLE `users` ADD `phone_verified` boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE `users` ADD `country_code` varchar(5) DEFAULT '+964';--> statement-breakpoint
ALTER TABLE `users` ADD CONSTRAINT `users_phone_number_unique` UNIQUE(`phone_number`);