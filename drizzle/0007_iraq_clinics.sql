-- Iraq Clinics/Hospitals table
CREATE TABLE IF NOT EXISTS `iraq_clinics` (
  `id` int AUTO_INCREMENT NOT NULL,
  `name` varchar(255) NOT NULL,
  `name_arabic` varchar(255),
  `governorate` varchar(100) NOT NULL,
  `governorate_arabic` varchar(100),
  `city` varchar(100) NOT NULL,
  `city_arabic` varchar(100),
  `district` varchar(100),
  `district_arabic` varchar(100),
  `address` text,
  `address_arabic` text,
  `latitude` decimal(10,7),
  `longitude` decimal(10,7),
  `phone` varchar(50),
  `phone2` varchar(50),
  `email` varchar(255),
  `website` varchar(500),
  `facility_type` enum('teaching_hospital','general_hospital','private_hospital','military_hospital','maternity_hospital','children_hospital','specialized_hospital','medical_city','clinic','health_center','emergency_center') NOT NULL,
  `specialties` text,
  `bed_count` int,
  `has_emergency` boolean DEFAULT false,
  `has_24_hours` boolean DEFAULT false,
  `operating_hours` text,
  `services` text,
  `insurance_accepted` text,
  `rating` decimal(2,1),
  `review_count` int DEFAULT 0,
  `is_active` boolean NOT NULL DEFAULT true,
  `is_verified` boolean DEFAULT false,
  `source` varchar(100),
  `last_updated` timestamp,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT `iraq_clinics_id` PRIMARY KEY(`id`)
);

-- Iraq Governorates reference table
CREATE TABLE IF NOT EXISTS `iraq_governorates` (
  `id` int AUTO_INCREMENT NOT NULL,
  `name` varchar(100) NOT NULL,
  `name_arabic` varchar(100) NOT NULL,
  `capital` varchar(100) NOT NULL,
  `capital_arabic` varchar(100),
  `latitude` decimal(10,7) NOT NULL,
  `longitude` decimal(10,7) NOT NULL,
  `region` enum('central','southern','northern','kurdistan','western') NOT NULL,
  `population` int,
  `area_km2` int,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT `iraq_governorates_id` PRIMARY KEY(`id`),
  CONSTRAINT `iraq_governorates_name_unique` UNIQUE(`name`)
);

-- User Location Cache table
CREATE TABLE IF NOT EXISTS `user_location_cache` (
  `id` int AUTO_INCREMENT NOT NULL,
  `ip_address` varchar(45) NOT NULL,
  `country` varchar(100),
  `country_code` varchar(5),
  `governorate` varchar(100),
  `city` varchar(100),
  `latitude` decimal(10,7),
  `longitude` decimal(10,7),
  `governorate_id` int,
  `expires_at` timestamp NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT `user_location_cache_id` PRIMARY KEY(`id`)
);

-- Create index for faster clinic lookups by governorate
CREATE INDEX `idx_clinics_governorate` ON `iraq_clinics` (`governorate`);
CREATE INDEX `idx_clinics_city` ON `iraq_clinics` (`city`);
CREATE INDEX `idx_clinics_active` ON `iraq_clinics` (`is_active`);

-- Create index for IP cache lookups
CREATE INDEX `idx_location_cache_ip` ON `user_location_cache` (`ip_address`);
