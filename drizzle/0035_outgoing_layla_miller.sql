ALTER TABLE `users` ADD `onboarding_completed` boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE `users` ADD `onboarding_completed_at` timestamp;--> statement-breakpoint
ALTER TABLE `users` ADD `onboarding_skipped` boolean DEFAULT false NOT NULL;