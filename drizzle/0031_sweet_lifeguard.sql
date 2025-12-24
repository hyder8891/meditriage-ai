ALTER TABLE `users` ADD `date_of_birth` date;--> statement-breakpoint
ALTER TABLE `users` ADD `gender` enum('male','female','other','prefer_not_to_say');--> statement-breakpoint
ALTER TABLE `users` ADD `blood_type` varchar(10);--> statement-breakpoint
ALTER TABLE `users` ADD `height` int;--> statement-breakpoint
ALTER TABLE `users` ADD `weight` decimal(5,2);--> statement-breakpoint
ALTER TABLE `users` ADD `chronic_conditions` text;--> statement-breakpoint
ALTER TABLE `users` ADD `allergies` text;--> statement-breakpoint
ALTER TABLE `users` ADD `current_medications` text;--> statement-breakpoint
ALTER TABLE `users` ADD `medical_history` text;--> statement-breakpoint
ALTER TABLE `users` ADD `emergency_contact` varchar(20);--> statement-breakpoint
ALTER TABLE `users` ADD `emergency_contact_name` varchar(255);