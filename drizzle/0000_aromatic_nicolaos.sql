CREATE TABLE `account_activity` (
	`id` int AUTO_INCREMENT NOT NULL,
	`user_id` int NOT NULL,
	`activity_type` enum('login','logout','password_change','email_change','profile_update','settings_change','failed_login') NOT NULL,
	`ip_address` varchar(45),
	`user_agent` text,
	`device_type` varchar(50),
	`browser` varchar(100),
	`location` varchar(255),
	`success` boolean NOT NULL DEFAULT true,
	`failure_reason` text,
	`metadata` text,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `account_activity_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
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
--> statement-breakpoint
CREATE TABLE `appointments` (
	`id` int AUTO_INCREMENT NOT NULL,
	`patient_id` int NOT NULL,
	`facility_id` int,
	`facility_name` varchar(255),
	`facility_address` text,
	`clinician_id` int,
	`appointment_date` timestamp NOT NULL,
	`duration` int DEFAULT 30,
	`appointment_type` enum('consultation','follow_up','emergency','screening','vaccination','other') NOT NULL DEFAULT 'consultation',
	`status` enum('pending','confirmed','completed','cancelled','no_show') NOT NULL DEFAULT 'pending',
	`chief_complaint` text,
	`notes` text,
	`reminder_sent` boolean DEFAULT false,
	`reminder_sent_at` timestamp,
	`cancelled_by` int,
	`cancellation_reason` text,
	`cancelled_at` timestamp,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `appointments_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `aqi_alerts` (
	`id` int AUTO_INCREMENT NOT NULL,
	`city` varchar(100) NOT NULL,
	`alert_type` enum('dust_storm','high_pm25','high_pm10','ozone_warning','general_pollution') NOT NULL,
	`severity` enum('low','medium','high','critical') NOT NULL,
	`trigger_aqi` int NOT NULL,
	`trigger_pollutant` varchar(20),
	`trigger_value` decimal(8,2),
	`title` varchar(255) NOT NULL,
	`message` text NOT NULL,
	`health_recommendations` text NOT NULL,
	`affected_groups` text NOT NULL,
	`is_active` boolean NOT NULL DEFAULT true,
	`start_time` timestamp NOT NULL,
	`end_time` timestamp,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `aqi_alerts_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `aqi_impact_logs` (
	`id` int AUTO_INCREMENT NOT NULL,
	`user_id` int NOT NULL,
	`triage_record_id` int,
	`aqi_at_symptom_onset` int,
	`pm25_at_symptom_onset` decimal(8,2),
	`pm10_at_symptom_onset` decimal(8,2),
	`symptoms` text NOT NULL,
	`symptom_severity` enum('mild','moderate','severe') NOT NULL,
	`likely_aqi_related` boolean NOT NULL DEFAULT false,
	`correlation_confidence` decimal(5,2),
	`symptom_resolved` boolean NOT NULL DEFAULT false,
	`resolution_time` timestamp,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `aqi_impact_logs_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `aqi_readings` (
	`id` int AUTO_INCREMENT NOT NULL,
	`city` varchar(100) NOT NULL,
	`latitude` decimal(10,7) NOT NULL,
	`longitude` decimal(10,7) NOT NULL,
	`aqi` int NOT NULL,
	`aqi_category` enum('good','moderate','unhealthy_sensitive','unhealthy','very_unhealthy','hazardous') NOT NULL,
	`pm25` decimal(8,2),
	`pm10` decimal(8,2),
	`o3` decimal(8,2),
	`no2` decimal(8,2),
	`so2` decimal(8,2),
	`co` decimal(8,2),
	`dominant_pollutant` varchar(20),
	`temperature` decimal(5,2),
	`humidity` int,
	`wind_speed` decimal(5,2),
	`data_source` varchar(100) NOT NULL DEFAULT 'OpenWeatherMap',
	`data_quality` enum('high','medium','low') DEFAULT 'high',
	`timestamp` timestamp NOT NULL,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `aqi_readings_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `aqi_subscriptions` (
	`id` int AUTO_INCREMENT NOT NULL,
	`user_id` int NOT NULL,
	`city` varchar(100) NOT NULL,
	`min_alert_severity` enum('low','medium','high','critical') NOT NULL DEFAULT 'medium',
	`notify_via_email` boolean NOT NULL DEFAULT false,
	`notify_via_push` boolean NOT NULL DEFAULT true,
	`has_respiratory_condition` boolean NOT NULL DEFAULT false,
	`has_cardiac_condition` boolean NOT NULL DEFAULT false,
	`is_pregnant` boolean NOT NULL DEFAULT false,
	`is_active` boolean NOT NULL DEFAULT true,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `aqi_subscriptions_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
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
--> statement-breakpoint
CREATE TABLE `bio_scanner_calibration` (
	`id` int AUTO_INCREMENT NOT NULL,
	`user_id` int NOT NULL,
	`reference_heart_rate` int NOT NULL,
	`measured_heart_rate` int NOT NULL,
	`correction_factor` decimal(10,4) NOT NULL,
	`calibration_date` timestamp NOT NULL DEFAULT (now()),
	`reference_device` varchar(100),
	`notes` text,
	`updated_at` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `bio_scanner_calibration_id` PRIMARY KEY(`id`),
	CONSTRAINT `bio_scanner_calibration_user_id_unique` UNIQUE(`user_id`)
);
--> statement-breakpoint
CREATE TABLE `brain_error_analysis` (
	`id` int AUTO_INCREMENT NOT NULL,
	`case_id` varchar(100) NOT NULL,
	`predicted_condition` varchar(255),
	`actual_condition` varchar(255) NOT NULL,
	`missed_symptoms` text,
	`error_type` enum('missed_diagnosis','incorrect_ranking','no_diagnosis','false_positive','unknown') NOT NULL,
	`severity` enum('low','medium','high','critical') DEFAULT 'medium',
	`root_cause` text,
	`correction_applied` text,
	`reviewed` boolean DEFAULT false,
	`reviewed_by` int,
	`reviewed_at` timestamp,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `brain_error_analysis_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `brain_knowledge_concepts` (
	`id` int AUTO_INCREMENT NOT NULL,
	`concept_type` enum('disease','symptom','treatment','investigation','risk_factor') NOT NULL,
	`name` varchar(255) NOT NULL,
	`description` text,
	`category` varchar(100),
	`icd10_code` varchar(20),
	`snomed_code` varchar(50),
	`prevalence` varchar(50),
	`severity` enum('mild','moderate','severe','critical'),
	`source` varchar(255),
	`evidence_level` varchar(50),
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `brain_knowledge_concepts_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `brain_knowledge_relationships` (
	`id` int AUTO_INCREMENT NOT NULL,
	`from_concept_id` int NOT NULL,
	`relationship_type` varchar(100) NOT NULL,
	`to_concept_id` int NOT NULL,
	`confidence` decimal(5,4),
	`strength` enum('weak','moderate','strong'),
	`context` text,
	`associated_symptoms` text,
	`distinguishing_features` text,
	`source` varchar(255),
	`times_used` int DEFAULT 0,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `brain_knowledge_relationships_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `brain_learned_patterns` (
	`id` int AUTO_INCREMENT NOT NULL,
	`pattern_type` varchar(100) NOT NULL,
	`pattern_data` text NOT NULL,
	`condition` varchar(255),
	`symptoms` text,
	`confidence` decimal(5,4) NOT NULL,
	`times_applied` int DEFAULT 0,
	`success_rate` decimal(5,4),
	`source_session_id` varchar(100),
	`derived_from_cases` int DEFAULT 1,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `brain_learned_patterns_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `brain_medical_literature` (
	`id` int AUTO_INCREMENT NOT NULL,
	`source` varchar(50) NOT NULL DEFAULT 'pubmed',
	`title` varchar(500) NOT NULL,
	`authors` text,
	`journal` varchar(255),
	`publication_date` varchar(50),
	`abstract` text,
	`literature_data` text,
	`pmid` varchar(50),
	`doi` varchar(255),
	`url` varchar(1024),
	`times_referenced` int DEFAULT 0,
	`relevance_score` decimal(5,4),
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `brain_medical_literature_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `brain_training_notifications` (
	`id` int AUTO_INCREMENT NOT NULL,
	`session_id` varchar(100),
	`notification_type` enum('training_complete','training_failed','accuracy_improved','accuracy_degraded','new_pattern_learned','error_threshold_exceeded','approval_required') NOT NULL,
	`message` text NOT NULL,
	`details` text,
	`priority` enum('low','medium','high','urgent') DEFAULT 'medium',
	`read` boolean DEFAULT false,
	`read_at` timestamp,
	`read_by` int,
	`action_required` boolean DEFAULT false,
	`action_taken` boolean DEFAULT false,
	`action_taken_at` timestamp,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `brain_training_notifications_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `brain_training_sessions` (
	`id` int AUTO_INCREMENT NOT NULL,
	`session_id` varchar(100) NOT NULL,
	`start_time` timestamp NOT NULL,
	`end_time` timestamp,
	`cases_processed` int DEFAULT 0,
	`accuracy_before` decimal(5,4),
	`accuracy_after` decimal(5,4),
	`improvement_rate` decimal(6,2),
	`status` enum('running','completed','failed') NOT NULL DEFAULT 'running',
	`error_message` text,
	`approved` boolean DEFAULT false,
	`approved_at` timestamp,
	`approved_by` int,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `brain_training_sessions_id` PRIMARY KEY(`id`),
	CONSTRAINT `brain_training_sessions_session_id_unique` UNIQUE(`session_id`)
);
--> statement-breakpoint
CREATE TABLE `budget_limits` (
	`id` int AUTO_INCREMENT NOT NULL,
	`user_id` int,
	`clinic_id` int,
	`limit_type` enum('daily','weekly','monthly','total') NOT NULL,
	`limit_amount_cents` int NOT NULL,
	`current_usage_cents` int NOT NULL DEFAULT 0,
	`period_start` timestamp NOT NULL,
	`period_end` timestamp NOT NULL,
	`alert_threshold_percent` int DEFAULT 80,
	`alert_sent` enum('true','false') NOT NULL DEFAULT 'false',
	`active` enum('true','false') NOT NULL DEFAULT 'true',
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `budget_limits_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `budget_tracking` (
	`id` int AUTO_INCREMENT NOT NULL,
	`user_id` int NOT NULL,
	`session_id` varchar(255),
	`module` enum('brain_clinical_reasoning','pharma_guard','medical_imaging','lab_results','medical_reports','symptom_checker','soap_notes','bio_scanner','voice_transcription','image_generation','conversation_ai','other') NOT NULL,
	`api_provider` varchar(50) NOT NULL,
	`model` varchar(100),
	`operation_type` varchar(50),
	`input_tokens` int DEFAULT 0,
	`output_tokens` int DEFAULT 0,
	`total_tokens` int DEFAULT 0,
	`estimated_cost_cents` int DEFAULT 0,
	`request_duration` int,
	`status_code` int,
	`success` enum('true','false') NOT NULL DEFAULT 'true',
	`error_message` text,
	`metadata` text,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `budget_tracking_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `cases` (
	`id` int AUTO_INCREMENT NOT NULL,
	`patient_name` varchar(255) NOT NULL,
	`patient_age` int,
	`patient_gender` enum('male','female','other'),
	`chief_complaint` text NOT NULL,
	`status` enum('active','completed','archived') NOT NULL DEFAULT 'active',
	`urgency` enum('emergency','urgent','semi-urgent','non-urgent','routine'),
	`clinician_id` int NOT NULL,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `cases_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `clinic_employees` (
	`id` int AUTO_INCREMENT NOT NULL,
	`clinic_id` int NOT NULL,
	`user_id` int NOT NULL,
	`role` enum('doctor','nurse','admin') NOT NULL,
	`specialty` varchar(100),
	`employment_type` enum('full_time','part_time','contract') DEFAULT 'full_time',
	`start_date` timestamp,
	`end_date` timestamp,
	`status` enum('pending','active','suspended','terminated') NOT NULL DEFAULT 'pending',
	`invitation_token` varchar(255),
	`invitation_expiry` timestamp,
	`can_manage_patients` boolean DEFAULT true,
	`can_manage_employees` boolean DEFAULT false,
	`can_manage_settings` boolean DEFAULT false,
	`can_view_reports` boolean DEFAULT true,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `clinic_employees_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `clinic_invitations` (
	`id` int AUTO_INCREMENT NOT NULL,
	`clinic_id` int NOT NULL,
	`email` varchar(320) NOT NULL,
	`role` enum('doctor','nurse','admin') NOT NULL,
	`specialty` varchar(100),
	`invitation_token` varchar(255) NOT NULL,
	`invited_by` int NOT NULL,
	`expires_at` timestamp NOT NULL,
	`status` enum('pending','accepted','expired','cancelled') NOT NULL DEFAULT 'pending',
	`accepted_at` timestamp,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `clinic_invitations_id` PRIMARY KEY(`id`),
	CONSTRAINT `clinic_invitations_invitation_token_unique` UNIQUE(`invitation_token`)
);
--> statement-breakpoint
CREATE TABLE `clinic_subscriptions` (
	`id` int AUTO_INCREMENT NOT NULL,
	`clinic_id` int NOT NULL,
	`tier` enum('individual','small','medium','enterprise') NOT NULL,
	`status` enum('trial','active','past_due','cancelled','expired') NOT NULL,
	`amount` int NOT NULL,
	`currency` varchar(3) DEFAULT 'USD',
	`billing_cycle` enum('monthly','yearly') DEFAULT 'monthly',
	`start_date` timestamp NOT NULL,
	`end_date` timestamp NOT NULL,
	`next_billing_date` timestamp,
	`payment_method` varchar(50),
	`last_payment_date` timestamp,
	`last_payment_amount` int,
	`is_trial_period` boolean DEFAULT false,
	`trial_ends_at` timestamp,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `clinic_subscriptions_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `clinical_guidelines` (
	`id` int AUTO_INCREMENT NOT NULL,
	`title` varchar(1000) NOT NULL,
	`title_ar` varchar(1000) NOT NULL,
	`category` varchar(100) NOT NULL,
	`disease_ids` text,
	`source` varchar(500) NOT NULL,
	`evidence_level` enum('A','B','C') NOT NULL,
	`recommendation` text NOT NULL,
	`recommendation_ar` text NOT NULL,
	`rationale` text,
	`iraqi_adaptations` text,
	`implementation_considerations` text,
	`references` text,
	`last_reviewed` timestamp,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	`version` int NOT NULL DEFAULT 1,
	CONSTRAINT `clinical_guidelines_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `clinical_notes` (
	`id` int AUTO_INCREMENT NOT NULL,
	`case_id` int NOT NULL,
	`note_type` enum('history','examination','assessment','plan','scribe') NOT NULL,
	`content` text NOT NULL,
	`created_by` int NOT NULL,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `clinical_notes_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `clinics` (
	`id` int AUTO_INCREMENT NOT NULL,
	`name` varchar(255) NOT NULL,
	`arabic_name` varchar(255),
	`email` varchar(320),
	`phone` varchar(50),
	`address` text,
	`city` varchar(100),
	`country` varchar(100) DEFAULT 'Iraq',
	`latitude` varchar(50),
	`longitude` varchar(50),
	`subscription_tier` enum('individual','small','medium','enterprise') NOT NULL DEFAULT 'small',
	`subscription_status` enum('trial','active','suspended','cancelled') NOT NULL DEFAULT 'trial',
	`subscription_start_date` timestamp,
	`subscription_end_date` timestamp,
	`max_doctors` int DEFAULT 5,
	`max_patients` int DEFAULT 500,
	`logo` varchar(1024),
	`primary_color` varchar(7) DEFAULT '#10b981',
	`working_hours` text,
	`specialties` text,
	`services` text,
	`owner_id` int NOT NULL,
	`is_active` boolean NOT NULL DEFAULT true,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `clinics_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `consultations` (
	`id` int AUTO_INCREMENT NOT NULL,
	`patient_id` int NOT NULL,
	`clinician_id` int NOT NULL,
	`appointment_id` int,
	`scheduled_time` timestamp NOT NULL,
	`start_time` timestamp,
	`end_time` timestamp,
	`duration` int,
	`status` enum('scheduled','waiting','in_progress','completed','cancelled','no_show') NOT NULL DEFAULT 'scheduled',
	`room_id` varchar(100) NOT NULL,
	`chief_complaint` text,
	`notes` text,
	`diagnosis` text,
	`prescription_generated` boolean DEFAULT false,
	`recording_url` varchar(500),
	`recording_enabled` boolean DEFAULT false,
	`chat_transcript` text,
	`payment_status` enum('pending','paid','failed','refunded') DEFAULT 'pending',
	`amount` int,
	`patient_rating` int,
	`patient_feedback` text,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `consultations_id` PRIMARY KEY(`id`),
	CONSTRAINT `consultations_room_id_unique` UNIQUE(`room_id`)
);
--> statement-breakpoint
CREATE TABLE `conversation_messages` (
	`id` int AUTO_INCREMENT NOT NULL,
	`session_id` int NOT NULL,
	`role` enum('user','assistant','system') NOT NULL,
	`content` text NOT NULL,
	`content_ar` text,
	`timestamp` timestamp NOT NULL DEFAULT (now()),
	`token_count` int,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `conversation_messages_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `conversation_results` (
	`id` int AUTO_INCREMENT NOT NULL,
	`session_id` int NOT NULL,
	`brain_case_id` varchar(100),
	`triage_level` enum('green','yellow','red') NOT NULL,
	`urgency` varchar(50) NOT NULL,
	`primary_diagnosis` varchar(255),
	`diagnosis_probability` decimal(5,4),
	`differential_diagnosis` text,
	`recommendations` text,
	`red_flags` text,
	`immediate_actions` text,
	`specialist_referral` varchar(255),
	`matched_doctor_id` int,
	`matched_clinic_id` int,
	`match_score` decimal(5,4),
	`estimated_wait_time` int,
	`google_maps_link` varchar(512),
	`uber_link` varchar(512),
	`created_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `conversation_results_id` PRIMARY KEY(`id`),
	CONSTRAINT `conversation_results_session_id_unique` UNIQUE(`session_id`)
);
--> statement-breakpoint
CREATE TABLE `conversation_sessions` (
	`id` int AUTO_INCREMENT NOT NULL,
	`user_id` int NOT NULL,
	`session_id` varchar(100) NOT NULL,
	`language` varchar(10) NOT NULL DEFAULT 'en',
	`status` enum('in_progress','completed','abandoned') NOT NULL DEFAULT 'in_progress',
	`started_at` timestamp NOT NULL DEFAULT (now()),
	`completed_at` timestamp,
	`last_activity_at` timestamp NOT NULL DEFAULT (now()),
	`context_vector` text,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `conversation_sessions_id` PRIMARY KEY(`id`),
	CONSTRAINT `conversation_sessions_session_id_unique` UNIQUE(`session_id`)
);
--> statement-breakpoint
CREATE TABLE `diagnoses` (
	`id` int AUTO_INCREMENT NOT NULL,
	`case_id` int NOT NULL,
	`diagnosis` varchar(500) NOT NULL,
	`probability` int,
	`reasoning` text,
	`red_flags` text,
	`recommended_actions` text,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `diagnoses_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `diseases` (
	`id` int AUTO_INCREMENT NOT NULL,
	`icd_code` varchar(20) NOT NULL,
	`name_en` varchar(500) NOT NULL,
	`name_ar` varchar(500) NOT NULL,
	`local_name` varchar(500),
	`category` varchar(100) NOT NULL,
	`prevalence_iraq` enum('high','medium','low','rare'),
	`description` text NOT NULL,
	`symptoms` text NOT NULL,
	`risk_factors` text,
	`complications` text,
	`differential_diagnosis` text,
	`red_flags` text,
	`treatment_protocol` text,
	`prognosis` text,
	`prevention_measures` text,
	`special_considerations` text,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	`version` int NOT NULL DEFAULT 1,
	CONSTRAINT `diseases_id` PRIMARY KEY(`id`),
	CONSTRAINT `diseases_icd_code_unique` UNIQUE(`icd_code`)
);
--> statement-breakpoint
CREATE TABLE `doctor_patient_relationships` (
	`id` int AUTO_INCREMENT NOT NULL,
	`doctor_id` int NOT NULL,
	`patient_id` int NOT NULL,
	`relationship_type` enum('primary','specialist','consultant','referral') NOT NULL DEFAULT 'primary',
	`status` enum('active','inactive','pending','terminated') NOT NULL DEFAULT 'pending',
	`can_view_records` boolean DEFAULT true,
	`can_prescribe` boolean DEFAULT true,
	`can_message` boolean DEFAULT true,
	`can_schedule_appointments` boolean DEFAULT true,
	`notes` text,
	`referred_by` int,
	`established_at` timestamp NOT NULL DEFAULT (now()),
	`terminated_at` timestamp,
	`termination_reason` text,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `doctor_patient_relationships_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
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
CREATE TABLE `drug_interactions` (
	`id` int AUTO_INCREMENT NOT NULL,
	`drug1_id` int NOT NULL,
	`drug2_id` int NOT NULL,
	`severity_level` enum('major','moderate','minor') NOT NULL,
	`interaction_type` varchar(200) NOT NULL,
	`mechanism` text,
	`clinical_effect` text NOT NULL,
	`management` text NOT NULL,
	`references` text,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `drug_interactions_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `email_preferences` (
	`id` int AUTO_INCREMENT NOT NULL,
	`user_id` int NOT NULL,
	`welcome_emails` boolean NOT NULL DEFAULT true,
	`verification_emails` boolean NOT NULL DEFAULT true,
	`password_reset_emails` boolean NOT NULL DEFAULT true,
	`security_alerts` boolean NOT NULL DEFAULT true,
	`appointment_confirmations` boolean NOT NULL DEFAULT true,
	`appointment_reminders` boolean NOT NULL DEFAULT true,
	`appointment_reminder_frequency` enum('instant','daily','weekly','off') NOT NULL DEFAULT 'instant',
	`medication_reminders` boolean NOT NULL DEFAULT true,
	`medication_reminder_frequency` enum('instant','daily','weekly','off') NOT NULL DEFAULT 'instant',
	`lab_result_notifications` boolean NOT NULL DEFAULT true,
	`critical_lab_alerts` boolean NOT NULL DEFAULT true,
	`new_message_notifications` boolean NOT NULL DEFAULT true,
	`message_notification_frequency` enum('instant','daily','weekly','off') NOT NULL DEFAULT 'instant',
	`unread_message_digest` boolean NOT NULL DEFAULT false,
	`subscription_confirmations` boolean NOT NULL DEFAULT true,
	`payment_receipts` boolean NOT NULL DEFAULT true,
	`invoice_emails` boolean NOT NULL DEFAULT true,
	`subscription_expiry_warnings` boolean NOT NULL DEFAULT true,
	`payment_failure_alerts` boolean NOT NULL DEFAULT true,
	`quiet_hours_enabled` boolean NOT NULL DEFAULT false,
	`quiet_hours_start` varchar(5) DEFAULT '22:00',
	`quiet_hours_end` varchar(5) DEFAULT '08:00',
	`all_emails_enabled` boolean NOT NULL DEFAULT true,
	`marketing_emails` boolean NOT NULL DEFAULT false,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `email_preferences_id` PRIMARY KEY(`id`),
	CONSTRAINT `email_preferences_user_id_unique` UNIQUE(`user_id`)
);
--> statement-breakpoint
CREATE TABLE `emergency_alerts` (
	`id` int AUTO_INCREMENT NOT NULL,
	`user_id` int NOT NULL,
	`session_id` int,
	`severity` enum('critical','high','medium') NOT NULL DEFAULT 'high',
	`alert_type` varchar(100) NOT NULL,
	`red_flags` text NOT NULL,
	`notification_sent` boolean NOT NULL DEFAULT false,
	`notification_method` varchar(50),
	`notification_sent_at` timestamp,
	`user_acknowledged` boolean NOT NULL DEFAULT false,
	`acknowledged_at` timestamp,
	`user_action` varchar(255),
	`follow_up_required` boolean NOT NULL DEFAULT false,
	`follow_up_completed_at` timestamp,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `emergency_alerts_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `epidemiology_events` (
	`id` int AUTO_INCREMENT NOT NULL,
	`city` varchar(100),
	`country` varchar(100) DEFAULT 'Iraq',
	`latitude` decimal(10,7),
	`longitude` decimal(10,7),
	`symptom_vector` text NOT NULL,
	`condition` varchar(255),
	`condition_confidence` decimal(5,2),
	`urgency_level` enum('low','moderate','high','emergency'),
	`temperature` decimal(5,2),
	`humidity` decimal(5,2),
	`air_quality_index` int,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`age_group` varchar(20),
	`gender` enum('male','female','other','unknown'),
	`data_source` varchar(50) DEFAULT 'avicenna_triage',
	`verified` boolean DEFAULT false,
	CONSTRAINT `epidemiology_events_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `facilities` (
	`id` int AUTO_INCREMENT NOT NULL,
	`name` varchar(255) NOT NULL,
	`type` enum('hospital','clinic','emergency','specialist') NOT NULL,
	`address` text NOT NULL,
	`city` varchar(100),
	`latitude` varchar(50),
	`longitude` varchar(50),
	`phone` varchar(50),
	`hours` varchar(255),
	`rating` varchar(10),
	`services` text,
	`specialties` text,
	`emergency_services` int DEFAULT 0,
	`website` varchar(512),
	CONSTRAINT `facilities_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `facility_types` (
	`id` int AUTO_INCREMENT NOT NULL,
	`name_en` varchar(200) NOT NULL,
	`name_ar` varchar(200) NOT NULL,
	`description` text,
	`capabilities` text,
	`typical_equipment` text,
	`staffing_requirements` text,
	`emergency_capable` boolean NOT NULL,
	`icu_capable` boolean NOT NULL,
	`surgery_capable` boolean NOT NULL,
	`diagnostic_capabilities` text,
	`common_in_iraq` boolean NOT NULL DEFAULT true,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `facility_types_id` PRIMARY KEY(`id`),
	CONSTRAINT `facility_types_name_en_unique` UNIQUE(`name_en`)
);
--> statement-breakpoint
CREATE TABLE `fhir_conditions` (
	`id` int AUTO_INCREMENT NOT NULL,
	`fhir_id` varchar(64) NOT NULL,
	`resource_type` varchar(50) NOT NULL DEFAULT 'Condition',
	`patient_fhir_id` varchar(64) NOT NULL,
	`clinical_status` varchar(50) NOT NULL,
	`verification_status` varchar(50),
	`category` text,
	`severity` varchar(50),
	`code` text NOT NULL,
	`body_site` text,
	`onset_date_time` timestamp,
	`onset_age` int,
	`onset_string` varchar(255),
	`abatement_date_time` timestamp,
	`abatement_age` int,
	`abatement_string` varchar(255),
	`recorded_date` timestamp,
	`recorder` varchar(255),
	`asserter` varchar(255),
	`stage` text,
	`evidence` text,
	`notes` text,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `fhir_conditions_id` PRIMARY KEY(`id`),
	CONSTRAINT `fhir_conditions_fhir_id_unique` UNIQUE(`fhir_id`)
);
--> statement-breakpoint
CREATE TABLE `fhir_medication_statements` (
	`id` int AUTO_INCREMENT NOT NULL,
	`fhir_id` varchar(64) NOT NULL,
	`resource_type` varchar(50) NOT NULL DEFAULT 'MedicationStatement',
	`patient_fhir_id` varchar(64) NOT NULL,
	`status` varchar(50) NOT NULL,
	`medication_codeable_concept` text,
	`medication_reference` varchar(255),
	`effective_date_time` timestamp,
	`effective_period_start` timestamp,
	`effective_period_end` timestamp,
	`date_asserted` timestamp,
	`information_source` varchar(255),
	`derived_from` text,
	`reason_code` text,
	`reason_reference` text,
	`notes` text,
	`dosage` text,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `fhir_medication_statements_id` PRIMARY KEY(`id`),
	CONSTRAINT `fhir_medication_statements_fhir_id_unique` UNIQUE(`fhir_id`)
);
--> statement-breakpoint
CREATE TABLE `fhir_observations` (
	`id` int AUTO_INCREMENT NOT NULL,
	`fhir_id` varchar(64) NOT NULL,
	`resource_type` varchar(50) NOT NULL DEFAULT 'Observation',
	`patient_fhir_id` varchar(64) NOT NULL,
	`status` varchar(50) NOT NULL,
	`category` text,
	`code` text NOT NULL,
	`effective_date_time` timestamp,
	`effective_period_start` timestamp,
	`effective_period_end` timestamp,
	`issued` timestamp,
	`performer` text,
	`value_quantity_value` decimal(10,2),
	`value_quantity_unit` varchar(50),
	`value_quantity_system` varchar(255),
	`value_quantity_code` varchar(50),
	`value_codeable_concept` text,
	`value_string` text,
	`value_boolean` boolean,
	`value_integer` int,
	`value_range` text,
	`value_ratio` text,
	`value_sampled_data` text,
	`value_time` time,
	`value_date_time` timestamp,
	`value_period` text,
	`data_absent_reason` text,
	`interpretation` text,
	`notes` text,
	`body_site` text,
	`method` text,
	`reference_range` text,
	`has_member` text,
	`derived_from` text,
	`component` text,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `fhir_observations_id` PRIMARY KEY(`id`),
	CONSTRAINT `fhir_observations_fhir_id_unique` UNIQUE(`fhir_id`)
);
--> statement-breakpoint
CREATE TABLE `fhir_patients` (
	`id` int AUTO_INCREMENT NOT NULL,
	`fhir_id` varchar(64) NOT NULL,
	`resource_type` varchar(50) NOT NULL DEFAULT 'Patient',
	`user_id` int,
	`identifiers` text NOT NULL,
	`family_name` varchar(255),
	`given_names` text,
	`prefix` varchar(50),
	`suffix` varchar(50),
	`gender` enum('male','female','other','unknown'),
	`birth_date` date,
	`telecom` text,
	`addresses` text,
	`marital_status` varchar(50),
	`languages` text,
	`general_practitioner` text,
	`managing_organization` varchar(255),
	`active` boolean DEFAULT true,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	`last_updated` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `fhir_patients_id` PRIMARY KEY(`id`),
	CONSTRAINT `fhir_patients_fhir_id_unique` UNIQUE(`fhir_id`)
);
--> statement-breakpoint
CREATE TABLE `knowledge_versions` (
	`id` int AUTO_INCREMENT NOT NULL,
	`entity_type` varchar(100) NOT NULL,
	`entity_id` int NOT NULL,
	`version` int NOT NULL,
	`change_type` enum('created','updated','deprecated') NOT NULL,
	`change_description` text,
	`changed_by` varchar(255),
	`reviewed_by` varchar(255),
	`approved_by` varchar(255),
	`created_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `knowledge_versions_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `lab_reference_ranges` (
	`id` int AUTO_INCREMENT NOT NULL,
	`test_name` varchar(255) NOT NULL,
	`test_code` varchar(100),
	`test_category` varchar(100),
	`age_min` int,
	`age_max` int,
	`gender` varchar(20),
	`reference_min` decimal(10,3),
	`reference_max` decimal(10,3),
	`unit` varchar(50) NOT NULL,
	`critical_low` decimal(10,3),
	`critical_high` decimal(10,3),
	`description` text,
	`clinical_context` text,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `lab_reference_ranges_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `lab_reports` (
	`id` int AUTO_INCREMENT NOT NULL,
	`user_id` int NOT NULL,
	`report_date` timestamp NOT NULL,
	`upload_date` timestamp NOT NULL DEFAULT (now()),
	`report_name` varchar(255),
	`lab_name` varchar(255),
	`ordering_physician` varchar(255),
	`file_url` text NOT NULL,
	`file_type` varchar(50),
	`file_size` int,
	`ocr_text` text,
	`extraction_status` varchar(50) DEFAULT 'pending',
	`extraction_error` text,
	`overall_interpretation` text,
	`risk_level` varchar(20),
	`recommended_actions` text,
	`status` varchar(50) DEFAULT 'uploaded',
	`reviewed_by` int,
	`reviewed_at` timestamp,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `lab_reports_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `lab_results` (
	`id` int AUTO_INCREMENT NOT NULL,
	`report_id` int NOT NULL,
	`user_id` int NOT NULL,
	`test_name` varchar(255) NOT NULL,
	`test_code` varchar(100),
	`test_category` varchar(100),
	`value` varchar(100) NOT NULL,
	`numeric_value` decimal(10,3),
	`unit` varchar(50),
	`reference_range_min` decimal(10,3),
	`reference_range_max` decimal(10,3),
	`reference_range_text` varchar(255),
	`status` varchar(20) NOT NULL,
	`abnormal_flag` boolean DEFAULT false,
	`critical_flag` boolean DEFAULT false,
	`interpretation` text,
	`clinical_significance` text,
	`possible_causes` text,
	`recommended_follow_up` text,
	`test_date` timestamp NOT NULL,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `lab_results_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `lab_trends` (
	`id` int AUTO_INCREMENT NOT NULL,
	`user_id` int NOT NULL,
	`test_name` varchar(255) NOT NULL,
	`trend_direction` varchar(20),
	`percent_change` decimal(10,2),
	`time_span` int,
	`measurement_count` int,
	`first_value` decimal(10,3),
	`last_value` decimal(10,3),
	`min_value` decimal(10,3),
	`max_value` decimal(10,3),
	`avg_value` decimal(10,3),
	`first_date` timestamp,
	`last_date` timestamp,
	`trend_interpretation` text,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `lab_trends_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `medical_documents` (
	`id` int AUTO_INCREMENT NOT NULL,
	`user_id` int NOT NULL,
	`triage_record_id` int,
	`file_name` varchar(255) NOT NULL,
	`file_key` varchar(512) NOT NULL,
	`file_url` varchar(1024) NOT NULL,
	`file_size` int NOT NULL,
	`mime_type` varchar(100) NOT NULL,
	`document_type` varchar(50) NOT NULL,
	`description` text,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `medical_documents_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `medical_knowledge_base` (
	`id` int AUTO_INCREMENT NOT NULL,
	`topic` varchar(500) NOT NULL,
	`category` varchar(100) NOT NULL,
	`content` text NOT NULL,
	`references` text,
	`confidence` int DEFAULT 0,
	`last_verified` timestamp,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `medical_knowledge_base_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `medication_adherence` (
	`id` int AUTO_INCREMENT NOT NULL,
	`prescription_id` int NOT NULL,
	`patient_id` int NOT NULL,
	`scheduled_time` timestamp NOT NULL,
	`taken` boolean DEFAULT false,
	`taken_at` timestamp,
	`missed` boolean DEFAULT false,
	`missed_reason` text,
	`reminder_sent` boolean DEFAULT false,
	`reminder_sent_at` timestamp,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `medication_adherence_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `medications` (
	`id` int AUTO_INCREMENT NOT NULL,
	`name` varchar(255) NOT NULL,
	`generic_name` varchar(255),
	`category` varchar(100),
	`interactions` text,
	`contraindications` text,
	`side_effects` text,
	CONSTRAINT `medications_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `medications_knowledge` (
	`id` int AUTO_INCREMENT NOT NULL,
	`generic_name` varchar(500) NOT NULL,
	`brand_names` text,
	`name_ar` varchar(500) NOT NULL,
	`drug_class` varchar(200) NOT NULL,
	`mechanism` text,
	`indications` text NOT NULL,
	`contraindications` text,
	`side_effects` text,
	`interactions` text,
	`dosage_adult` text,
	`dosage_pediatric` text,
	`dosage_elderly` text,
	`route_of_administration` varchar(100),
	`availability_iraq` enum('widely_available','limited','rare','not_available') NOT NULL,
	`approximate_cost` varchar(200),
	`requires_prescription` boolean NOT NULL,
	`pregnancy_category` varchar(10),
	`lactation_safety` varchar(100),
	`renal_adjustment` text,
	`hepatic_adjustment` text,
	`monitoring_required` text,
	`special_instructions` text,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	`version` int NOT NULL DEFAULT 1,
	CONSTRAINT `medications_knowledge_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `messages` (
	`id` int AUTO_INCREMENT NOT NULL,
	`sender_id` int NOT NULL,
	`recipient_id` int NOT NULL,
	`subject` varchar(255),
	`content` text NOT NULL,
	`encrypted` boolean DEFAULT true,
	`read` boolean DEFAULT false,
	`read_at` timestamp,
	`thread_id` int,
	`reply_to_id` int,
	`case_id` int,
	`attachments` text,
	`deleted_by_sender` boolean DEFAULT false,
	`deleted_by_recipient` boolean DEFAULT false,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `messages_id` PRIMARY KEY(`id`)
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
--> statement-breakpoint
CREATE TABLE `orchestration_logs` (
	`id` int AUTO_INCREMENT NOT NULL,
	`request_id` varchar(255) NOT NULL,
	`user_id` int,
	`session_id` varchar(255),
	`operation` varchar(255) NOT NULL,
	`module` varchar(100) NOT NULL,
	`action` varchar(100) NOT NULL,
	`status` enum('started','in_progress','completed','failed','cancelled') NOT NULL DEFAULT 'started',
	`start_time` timestamp NOT NULL,
	`end_time` timestamp,
	`duration_ms` int,
	`input_data` text,
	`output_data` text,
	`error_message` text,
	`error_stack` text,
	`error_code` varchar(50),
	`memory_usage_mb` decimal(10,2),
	`cpu_usage_percent` decimal(5,2),
	`parent_request_id` varchar(255),
	`depth` int DEFAULT 0,
	`metadata` text,
	`tags` text,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `orchestration_logs_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `patient_clinic_links` (
	`id` int AUTO_INCREMENT NOT NULL,
	`patient_id` int NOT NULL,
	`clinic_id` int NOT NULL,
	`primary_doctor_id` int,
	`registration_method` enum('in_clinic','online','qr_code','referral') DEFAULT 'in_clinic',
	`registration_date` timestamp NOT NULL DEFAULT (now()),
	`status` enum('active','inactive','transferred') NOT NULL DEFAULT 'active',
	`patient_number` varchar(50),
	`notes` text,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `patient_clinic_links_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `patient_invitations` (
	`id` int AUTO_INCREMENT NOT NULL,
	`doctor_id` int NOT NULL,
	`invitation_code` varchar(32) NOT NULL,
	`patient_email` varchar(320),
	`patient_phone` varchar(50),
	`patient_name` varchar(255),
	`status` enum('pending','accepted','expired','cancelled') NOT NULL DEFAULT 'pending',
	`accepted_by` int,
	`accepted_at` timestamp,
	`expires_at` timestamp NOT NULL,
	`personal_message` text,
	`sent_via` enum('email','sms','link','qr_code'),
	`times_viewed` int DEFAULT 0,
	`last_viewed_at` timestamp,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `patient_invitations_id` PRIMARY KEY(`id`),
	CONSTRAINT `patient_invitations_invitation_code_unique` UNIQUE(`invitation_code`)
);
--> statement-breakpoint
CREATE TABLE `patient_pressure_sensitivity` (
	`id` int AUTO_INCREMENT NOT NULL,
	`user_id` int NOT NULL,
	`condition_id` int NOT NULL,
	`confirmed` boolean NOT NULL DEFAULT false,
	`sensitivity` enum('low','moderate','high','severe') NOT NULL DEFAULT 'moderate',
	`typical_drop_trigger` decimal(5,2),
	`typical_rise_trigger` decimal(5,2),
	`typical_onset_delay` int,
	`last_symptom_date` date,
	`symptom_frequency` int,
	`average_severity` int,
	`notes` text,
	`management_strategies` text,
	`first_reported_at` timestamp NOT NULL DEFAULT (now()),
	`last_updated` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `patient_pressure_sensitivity_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `patient_vitals` (
	`id` int AUTO_INCREMENT NOT NULL,
	`user_id` int NOT NULL,
	`heart_rate` int,
	`respiration_rate` int,
	`oxygen_saturation` int,
	`stress_level` varchar(20),
	`hrv_rmssd` decimal(10,2),
	`hrv_sdnn` decimal(10,2),
	`hrv_pnn50` decimal(10,2),
	`hrv_lf_hf_ratio` decimal(10,2),
	`hrv_stress_score` int,
	`hrv_ans_balance` varchar(30),
	`confidence_score` int,
	`method` varchar(50) DEFAULT 'OPTIC_CAMERA',
	`measurement_duration` int,
	`device_info` text,
	`environmental_factors` text,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `patient_vitals_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `prescriptions` (
	`id` int AUTO_INCREMENT NOT NULL,
	`patient_id` int NOT NULL,
	`case_id` int,
	`clinician_id` int NOT NULL,
	`medication_name` varchar(255) NOT NULL,
	`generic_name` varchar(255),
	`dosage` varchar(100) NOT NULL,
	`frequency` varchar(100) NOT NULL,
	`route` varchar(50),
	`start_date` timestamp NOT NULL,
	`end_date` timestamp,
	`duration` int,
	`instructions` text,
	`warnings` text,
	`status` enum('active','completed','discontinued','on_hold') NOT NULL DEFAULT 'active',
	`refills_allowed` int DEFAULT 0,
	`refills_remaining` int DEFAULT 0,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `prescriptions_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `pressure_sensitive_conditions` (
	`id` int AUTO_INCREMENT NOT NULL,
	`condition_name` varchar(255) NOT NULL,
	`category` enum('migraine','headache','joint_pain','arthritis','respiratory','cardiovascular','neurological','other') NOT NULL,
	`pressure_drop_threshold` decimal(5,2),
	`pressure_rise_threshold` decimal(5,2),
	`change_velocity_threshold` decimal(5,2),
	`common_symptoms` text,
	`severity_factors` text,
	`description` text,
	`prevalence` varchar(50),
	`evidence_level` varchar(10),
	`references` text,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `pressure_sensitive_conditions_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `pressure_symptom_events` (
	`id` int AUTO_INCREMENT NOT NULL,
	`user_id` int NOT NULL,
	`sensitivity_id` int NOT NULL,
	`weather_id` int,
	`symptom_onset` timestamp NOT NULL,
	`symptom_resolution` timestamp,
	`severity` int NOT NULL,
	`pressure_at_onset` decimal(6,2),
	`pressure_change_1h` decimal(5,2),
	`pressure_change_3h` decimal(5,2),
	`temperature_at_onset` decimal(5,2),
	`humidity_at_onset` int,
	`symptoms` text,
	`intervention_taken` text,
	`intervention_effectiveness` int,
	`notes` text,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `pressure_symptom_events_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `procedures` (
	`id` int AUTO_INCREMENT NOT NULL,
	`cpt_code` varchar(20),
	`name_en` varchar(500) NOT NULL,
	`name_ar` varchar(500) NOT NULL,
	`category` varchar(100) NOT NULL,
	`description` text NOT NULL,
	`indications` text,
	`contraindications` text,
	`complications` text,
	`preparation_required` text,
	`procedure_steps` text,
	`post_procedure_care` text,
	`recovery_time` varchar(200),
	`availability_iraq` enum('widely_available','major_cities','baghdad_only','not_available') NOT NULL,
	`facility_requirements` text,
	`approximate_cost` varchar(200),
	`insurance_coverage` enum('typically_covered','partial','not_covered'),
	`special_considerations` text,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	`version` int NOT NULL DEFAULT 1,
	CONSTRAINT `procedures_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `processed_webhooks` (
	`id` int AUTO_INCREMENT NOT NULL,
	`event_id` varchar(255) NOT NULL,
	`event_type` varchar(100) NOT NULL,
	`processed_at` timestamp NOT NULL DEFAULT (now()),
	`processing_status` enum('success','failed','skipped') NOT NULL DEFAULT 'success',
	`error_message` text,
	`webhook_data` text,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `processed_webhooks_id` PRIMARY KEY(`id`),
	CONSTRAINT `processed_webhooks_event_id_unique` UNIQUE(`event_id`)
);
--> statement-breakpoint
CREATE TABLE `red_flags` (
	`id` int AUTO_INCREMENT NOT NULL,
	`name_en` varchar(500) NOT NULL,
	`name_ar` varchar(500) NOT NULL,
	`category` varchar(100) NOT NULL,
	`description` text NOT NULL,
	`clinical_significance` text NOT NULL,
	`associated_conditions` text,
	`urgency_level` enum('immediate','urgent','semi_urgent') NOT NULL,
	`recommended_action` text NOT NULL,
	`time_to_treatment` varchar(100),
	`facility_required` varchar(200),
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `red_flags_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `shared_records` (
	`id` int AUTO_INCREMENT NOT NULL,
	`doctor_id` int NOT NULL,
	`patient_id` int NOT NULL,
	`record_type` enum('case','vital','diagnosis','prescription','clinical_note','transcription','timeline_event','appointment','consultation','lab_result','imaging') NOT NULL,
	`record_id` int NOT NULL,
	`patient_can_view` boolean DEFAULT true,
	`patient_can_download` boolean DEFAULT false,
	`patient_can_comment` boolean DEFAULT false,
	`hide_from_patient` boolean DEFAULT false,
	`show_after` timestamp,
	`share_reason` text,
	`shared_at` timestamp NOT NULL DEFAULT (now()),
	`viewed_by_patient` boolean DEFAULT false,
	`first_viewed_at` timestamp,
	`last_viewed_at` timestamp,
	`view_count` int DEFAULT 0,
	`revoked_at` timestamp,
	`revocation_reason` text,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `shared_records_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `subscriptions` (
	`id` int AUTO_INCREMENT NOT NULL,
	`user_id` int NOT NULL,
	`plan_type` enum('patient_free','patient_lite','patient_pro','doctor_basic','doctor_premium','enterprise') NOT NULL,
	`price_per_month` decimal(10,2) NOT NULL,
	`currency` varchar(3) NOT NULL DEFAULT 'USD',
	`status` enum('active','trialing','past_due','cancelled','expired') NOT NULL DEFAULT 'active',
	`billing_cycle` enum('monthly','yearly') NOT NULL DEFAULT 'monthly',
	`current_period_start` timestamp NOT NULL,
	`current_period_end` timestamp NOT NULL,
	`trial_start` timestamp,
	`trial_end` timestamp,
	`cancel_at_period_end` boolean DEFAULT false,
	`cancelled_at` timestamp,
	`cancellation_reason` text,
	`stripe_customer_id` varchar(255),
	`stripe_subscription_id` varchar(255),
	`payment_method` enum('stripe','zain_cash','asia_hawala','bank_transfer','cash','manual'),
	`last_payment_date` timestamp,
	`last_payment_amount` decimal(10,2),
	`last_payment_status` enum('succeeded','failed','pending'),
	`next_payment_date` timestamp,
	`next_payment_amount` decimal(10,2),
	`metadata` text,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `subscriptions_id` PRIMARY KEY(`id`),
	CONSTRAINT `subscriptions_user_id_unique` UNIQUE(`user_id`)
);
--> statement-breakpoint
CREATE TABLE `symptom_disease_associations` (
	`id` int AUTO_INCREMENT NOT NULL,
	`symptom_id` int NOT NULL,
	`disease_id` int NOT NULL,
	`association_strength` float NOT NULL,
	`specificity` enum('high','medium','low') NOT NULL,
	`sensitivity` enum('high','medium','low') NOT NULL,
	`typical_presentation` boolean NOT NULL DEFAULT true,
	`atypical_presentation` boolean NOT NULL DEFAULT false,
	`notes` text,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `symptom_disease_associations_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `symptoms` (
	`id` int AUTO_INCREMENT NOT NULL,
	`name_en` varchar(500) NOT NULL,
	`name_ar` varchar(500) NOT NULL,
	`local_name` varchar(500),
	`category` varchar(100) NOT NULL,
	`description` text,
	`severity_indicators` text,
	`associated_conditions` text,
	`red_flag_symptom` boolean NOT NULL DEFAULT false,
	`urgency_level` enum('routine','urgent','emergency'),
	`common_in_iraq` boolean NOT NULL DEFAULT true,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `symptoms_id` PRIMARY KEY(`id`),
	CONSTRAINT `symptoms_name_en_unique` UNIQUE(`name_en`)
);
--> statement-breakpoint
CREATE TABLE `timeline_events` (
	`id` int AUTO_INCREMENT NOT NULL,
	`case_id` int NOT NULL,
	`event_type` enum('symptom','vital_signs','diagnosis','treatment','medication','procedure','lab_result','imaging','note') NOT NULL,
	`title` varchar(255) NOT NULL,
	`description` text,
	`event_data` json,
	`severity` enum('low','medium','high','critical'),
	`recorded_by` int,
	`event_time` timestamp NOT NULL,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `timeline_events_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `training_materials` (
	`id` int AUTO_INCREMENT NOT NULL,
	`title` varchar(500) NOT NULL,
	`category` varchar(100) NOT NULL,
	`source` varchar(500) NOT NULL,
	`source_url` varchar(1024),
	`content` text NOT NULL,
	`content_hash` varchar(64),
	`storage_key` varchar(512),
	`storage_url` varchar(1024),
	`summary` text,
	`key_findings` text,
	`clinical_relevance` text,
	`processed_at` timestamp,
	`training_status` varchar(50) DEFAULT 'pending',
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `training_materials_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `training_sessions` (
	`id` int AUTO_INCREMENT NOT NULL,
	`started_at` timestamp NOT NULL DEFAULT (now()),
	`completed_at` timestamp,
	`total_materials` int NOT NULL,
	`processed_materials` int NOT NULL,
	`successful_materials` int NOT NULL,
	`failed_materials` int NOT NULL,
	`duration` int,
	`status` varchar(50) NOT NULL DEFAULT 'running',
	`results` text,
	`error_message` text,
	`triggered_by` int NOT NULL,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `training_sessions_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `transcriptions` (
	`id` int AUTO_INCREMENT NOT NULL,
	`case_id` int,
	`clinician_id` int NOT NULL,
	`audio_key` varchar(512),
	`audio_url` varchar(1024),
	`duration` int,
	`transcription_text` text NOT NULL,
	`language` varchar(10) NOT NULL DEFAULT 'en',
	`speaker` enum('clinician','patient','mixed') DEFAULT 'clinician',
	`status` enum('draft','final','archived') NOT NULL DEFAULT 'draft',
	`saved_to_clinical_notes` boolean DEFAULT false,
	`clinical_note_id` int,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `transcriptions_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `triage_records` (
	`id` int AUTO_INCREMENT NOT NULL,
	`user_id` int NOT NULL,
	`language` varchar(10) NOT NULL DEFAULT 'en',
	`conversation_history` text NOT NULL,
	`urgency_level` varchar(50) NOT NULL,
	`chief_complaint` text NOT NULL,
	`symptoms` text NOT NULL,
	`assessment` text NOT NULL,
	`recommendations` text NOT NULL,
	`red_flags` text,
	`duration` int,
	`message_count` int NOT NULL DEFAULT 0,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `triage_records_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `triage_training_data` (
	`id` int AUTO_INCREMENT NOT NULL,
	`triage_record_id` int NOT NULL,
	`conversation_json` text NOT NULL,
	`symptoms` text NOT NULL,
	`patient_age` int,
	`patient_gender` varchar(20),
	`final_diagnosis` text,
	`urgency_level` varchar(50) NOT NULL,
	`attached_files` text,
	`xray_images` text,
	`used_for_training` timestamp,
	`training_epoch` int,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `triage_training_data_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `usage_tracking` (
	`id` int AUTO_INCREMENT NOT NULL,
	`user_id` int NOT NULL,
	`feature` varchar(100) NOT NULL,
	`count` int NOT NULL DEFAULT 0,
	`period_start` timestamp NOT NULL,
	`period_end` timestamp NOT NULL,
	`limit` int,
	`last_used_at` timestamp,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `usage_tracking_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `user_settings` (
	`id` int AUTO_INCREMENT NOT NULL,
	`user_id` int NOT NULL,
	`language` enum('en','ar') NOT NULL DEFAULT 'ar',
	`timezone` varchar(50) NOT NULL DEFAULT 'Asia/Baghdad',
	`date_format` varchar(20) NOT NULL DEFAULT 'DD/MM/YYYY',
	`time_format` enum('12h','24h') NOT NULL DEFAULT '24h',
	`desktop_notifications` boolean NOT NULL DEFAULT true,
	`sound_notifications` boolean NOT NULL DEFAULT true,
	`profile_visibility` enum('public','private','doctors_only') NOT NULL DEFAULT 'doctors_only',
	`show_online_status` boolean NOT NULL DEFAULT true,
	`auto_accept_patients` boolean NOT NULL DEFAULT false,
	`max_daily_consultations` int DEFAULT 20,
	`consultation_duration` int DEFAULT 30,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `user_settings_id` PRIMARY KEY(`id`),
	CONSTRAINT `user_settings_user_id_unique` UNIQUE(`user_id`)
);
--> statement-breakpoint
CREATE TABLE `users` (
	`id` int AUTO_INCREMENT NOT NULL,
	`openId` varchar(64),
	`name` text,
	`email` varchar(320),
	`password_hash` varchar(255),
	`loginMethod` varchar(64),
	`phone_number` varchar(20),
	`phone_verified` boolean NOT NULL DEFAULT false,
	`country_code` varchar(5) DEFAULT '+964',
	`role` enum('patient','doctor','nurse','clinic_admin','super_admin','admin','clinician') NOT NULL DEFAULT 'patient',
	`clinic_id` int,
	`license_number` varchar(100),
	`specialty` varchar(100),
	`verified` boolean NOT NULL DEFAULT false,
	`availability_status` enum('available','busy','offline') DEFAULT 'offline',
	`current_patient_count` int DEFAULT 0,
	`max_patients_per_day` int DEFAULT 50,
	`last_status_change` timestamp,
	`auto_offline_minutes` int DEFAULT 15,
	`date_of_birth` date,
	`gender` enum('male','female','other','prefer_not_to_say'),
	`blood_type` varchar(10),
	`height` int,
	`weight` decimal(5,2),
	`chronic_conditions` text,
	`allergies` text,
	`current_medications` text,
	`medical_history` text,
	`emergency_contact` varchar(20),
	`emergency_contact_name` varchar(255),
	`email_verified` boolean NOT NULL DEFAULT false,
	`verification_token` varchar(255),
	`verification_token_expiry` timestamp,
	`reset_token` varchar(255),
	`reset_token_expiry` timestamp,
	`token_version` int NOT NULL DEFAULT 0,
	`onboarding_completed` boolean NOT NULL DEFAULT false,
	`onboarding_completed_at` timestamp,
	`onboarding_skipped` boolean NOT NULL DEFAULT false,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	`lastSignedIn` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `users_id` PRIMARY KEY(`id`),
	CONSTRAINT `users_openId_unique` UNIQUE(`openId`),
	CONSTRAINT `users_email_unique` UNIQUE(`email`),
	CONSTRAINT `users_phone_number_unique` UNIQUE(`phone_number`)
);
--> statement-breakpoint
CREATE TABLE `vitals` (
	`id` int AUTO_INCREMENT NOT NULL,
	`case_id` int NOT NULL,
	`bp_systolic` int,
	`bp_diastolic` int,
	`heart_rate` int,
	`temperature` varchar(10),
	`oxygen_saturation` int,
	`respiratory_rate` int,
	`weight` varchar(20),
	`height` varchar(20),
	`recorded_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `vitals_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `voice_recordings` (
	`id` int AUTO_INCREMENT NOT NULL,
	`user_id` int NOT NULL,
	`triage_record_id` int,
	`audio_key` varchar(512) NOT NULL,
	`audio_url` varchar(1024) NOT NULL,
	`duration` int,
	`transcription` text,
	`language` varchar(10) NOT NULL,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `voice_recordings_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `wearable_connections` (
	`id` int AUTO_INCREMENT NOT NULL,
	`user_id` int NOT NULL,
	`device_type` enum('apple_watch','fitbit') NOT NULL,
	`device_id` varchar(255) NOT NULL,
	`device_name` varchar(255),
	`device_model` varchar(100),
	`status` enum('active','disconnected','error') NOT NULL DEFAULT 'active',
	`last_sync_at` timestamp,
	`access_token` text,
	`refresh_token` text,
	`token_expires_at` timestamp,
	`sync_enabled` boolean NOT NULL DEFAULT true,
	`sync_frequency` int NOT NULL DEFAULT 3600,
	`enabled_metrics` text NOT NULL,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `wearable_connections_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `wearable_data_points` (
	`id` int AUTO_INCREMENT NOT NULL,
	`user_id` int NOT NULL,
	`connection_id` int NOT NULL,
	`metric_type` enum('heart_rate','steps','distance','calories','active_minutes','sleep_duration','sleep_quality','blood_oxygen','hrv','resting_heart_rate','blood_pressure_systolic','blood_pressure_diastolic','respiratory_rate','body_temperature','weight','bmi') NOT NULL,
	`value` decimal(10,2) NOT NULL,
	`unit` varchar(50) NOT NULL,
	`measured_at` timestamp NOT NULL,
	`confidence` decimal(3,2) NOT NULL DEFAULT '1.00',
	`context` text,
	`source_device` varchar(100) NOT NULL,
	`source_app` varchar(100),
	`synced_at` timestamp NOT NULL DEFAULT (now()),
	`external_id` varchar(255),
	`created_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `wearable_data_points_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `wearable_metrics_summary` (
	`id` int AUTO_INCREMENT NOT NULL,
	`user_id` int NOT NULL,
	`period_type` enum('daily','weekly','monthly') NOT NULL,
	`period_start` date NOT NULL,
	`period_end` date NOT NULL,
	`avg_heart_rate` decimal(5,2),
	`min_heart_rate` int,
	`max_heart_rate` int,
	`resting_heart_rate` int,
	`avg_hrv` decimal(6,2),
	`total_steps` int,
	`total_distance` decimal(8,2),
	`total_calories` int,
	`total_active_minutes` int,
	`avg_sleep_duration` decimal(4,2),
	`avg_sleep_quality` decimal(3,2),
	`avg_blood_oxygen` decimal(5,2),
	`avg_respiratory_rate` decimal(4,2),
	`avg_systolic` int,
	`avg_diastolic` int,
	`avg_weight` decimal(5,2),
	`avg_bmi` decimal(4,2),
	`avg_body_temp` decimal(4,2),
	`data_completeness` decimal(3,2) NOT NULL DEFAULT '1.00',
	`measurement_count` int NOT NULL DEFAULT 0,
	`anomalies` text,
	`last_updated` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `wearable_metrics_summary_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `weather_conditions` (
	`id` int AUTO_INCREMENT NOT NULL,
	`latitude` decimal(10,7) NOT NULL,
	`longitude` decimal(10,7) NOT NULL,
	`city_name` varchar(255),
	`country_code` varchar(2),
	`pressure` decimal(6,2) NOT NULL,
	`temperature` decimal(5,2),
	`humidity` int,
	`weather_condition` varchar(100),
	`wind_speed` decimal(5,2),
	`pressure_change_1h` decimal(5,2),
	`pressure_change_3h` decimal(5,2),
	`pressure_change_24h` decimal(5,2),
	`source` varchar(50) NOT NULL DEFAULT 'openweather',
	`external_id` varchar(255),
	`observed_at` timestamp NOT NULL,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `weather_conditions_id` PRIMARY KEY(`id`)
);
