ALTER TABLE `patient_vitals` ADD `hrv_rmssd` decimal(10,2);--> statement-breakpoint
ALTER TABLE `patient_vitals` ADD `hrv_sdnn` decimal(10,2);--> statement-breakpoint
ALTER TABLE `patient_vitals` ADD `hrv_pnn50` decimal(10,2);--> statement-breakpoint
ALTER TABLE `patient_vitals` ADD `hrv_lf_hf_ratio` decimal(10,2);--> statement-breakpoint
ALTER TABLE `patient_vitals` ADD `hrv_stress_score` int;--> statement-breakpoint
ALTER TABLE `patient_vitals` ADD `hrv_ans_balance` varchar(30);