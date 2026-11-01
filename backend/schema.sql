-- ====================================================================
-- PathFinder: Gen-Z Career Navigator & Skill Gap Analyzer
-- Production Relational MySQL Database Schema
-- B.Tech Final Project Specification (Strict MySQL Only)
-- ====================================================================

-- Drop tables in reverse dependency order
DROP TABLE IF EXISTS `milestone_quiz_attempts`;
DROP TABLE IF EXISTS `milestone_questions`;
DROP TABLE IF EXISTS `option_weights`;
DROP TABLE IF EXISTS `quiz_options`;
DROP TABLE IF EXISTS `quiz_questions`;
DROP TABLE IF EXISTS `user_skill_ratings`;
DROP TABLE IF EXISTS `career_skills`;
DROP TABLE IF EXISTS `daily_streaks`;
DROP TABLE IF EXISTS `user_milestone_progress`;
DROP TABLE IF EXISTS `milestones`;
DROP TABLE IF EXISTS `users`;
DROP TABLE IF EXISTS `career_paths`;

-- 1. career_paths
CREATE TABLE `career_paths` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `title` VARCHAR(100) NOT NULL,
  `category` ENUM('tech', 'non-tech', 'govt') NOT NULL,
  `coding_level` ENUM('none', 'some', 'heavy') NOT NULL,
  `min_salary` DECIMAL(5,2) NOT NULL,
  `max_salary` DECIMAL(5,2) NOT NULL,
  `demand_tag` VARCHAR(50) NOT NULL,
  `description` TEXT NOT NULL,
  `daily_work` TEXT NOT NULL,
  `source_note` TEXT NOT NULL,
  `salary_source` VARCHAR(255) NOT NULL,
  `last_verified` DATE NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 2. users
CREATE TABLE `users` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `name` VARCHAR(100) NOT NULL,
  `email` VARCHAR(100) NOT NULL UNIQUE,
  `password_hash` VARCHAR(255) NOT NULL,
  `role` ENUM('student', 'admin') NOT NULL DEFAULT 'student',
  `target_career_id` INT NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (`target_career_id`) REFERENCES `career_paths`(`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 3. milestones
CREATE TABLE `milestones` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `career_id` INT NOT NULL,
  `phase_number` INT NOT NULL, -- 1: Foundations, 2: Core tools, 3: Practice
  `title` VARCHAR(200) NOT NULL,
  `resource_url` VARCHAR(255) NOT NULL,
  FOREIGN KEY (`career_id`) REFERENCES `career_paths`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 4. user_milestone_progress
CREATE TABLE `user_milestone_progress` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `user_id` INT NOT NULL,
  `milestone_id` INT NOT NULL,
  `status` ENUM('pending', 'completed') NOT NULL DEFAULT 'completed',
  `proof_note` TEXT NULL,
  `completed_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY `uk_user_milestone` (`user_id`, `milestone_id`),
  FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE,
  FOREIGN KEY (`milestone_id`) REFERENCES `milestones`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 5. daily_streaks
CREATE TABLE `daily_streaks` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `user_id` INT NOT NULL UNIQUE,
  `last_active_date` DATE NOT NULL,
  `streak_count` INT NOT NULL DEFAULT 1,
  FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 6. career_skills
CREATE TABLE `career_skills` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `career_id` INT NOT NULL,
  `skill_name` VARCHAR(100) NOT NULL,
  `required_level` INT NOT NULL, -- 1 to 5 scale
  FOREIGN KEY (`career_id`) REFERENCES `career_paths`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 7. user_skill_ratings
CREATE TABLE `user_skill_ratings` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `user_id` INT NOT NULL,
  `career_skill_id` INT NOT NULL,
  `rating` INT NOT NULL, -- 1 to 5 scale
  UNIQUE KEY `uk_user_skill` (`user_id`, `career_skill_id`),
  FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE,
  FOREIGN KEY (`career_skill_id`) REFERENCES `career_skills`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 8. quiz_questions
CREATE TABLE `quiz_questions` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `question_text` TEXT NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 9. quiz_options
CREATE TABLE `quiz_options` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `question_id` INT NOT NULL,
  `option_text` TEXT NOT NULL,
  FOREIGN KEY (`question_id`) REFERENCES `quiz_questions`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 10. option_weights
CREATE TABLE `option_weights` (
  `option_id` INT NOT NULL,
  `career_id` INT NOT NULL,
  `weight` INT NOT NULL,
  PRIMARY KEY (`option_id`, `career_id`),
  FOREIGN KEY (`option_id`) REFERENCES `quiz_options`(`id`) ON DELETE CASCADE,
  FOREIGN KEY (`career_id`) REFERENCES `career_paths`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 11. milestone_questions
CREATE TABLE `milestone_questions` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `milestone_id` INT NOT NULL,
  `question_text` TEXT NOT NULL,
  `option_a` VARCHAR(255) NOT NULL,
  `option_b` VARCHAR(255) NOT NULL,
  `option_c` VARCHAR(255) NOT NULL,
  `option_d` VARCHAR(255) NOT NULL,
  `correct_option` CHAR(1) NOT NULL, -- 'a', 'b', 'c', or 'd'
  FOREIGN KEY (`milestone_id`) REFERENCES `milestones`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 12. milestone_quiz_attempts
CREATE TABLE `milestone_quiz_attempts` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `user_id` INT NOT NULL,
  `milestone_id` INT NOT NULL,
  `score` INT NOT NULL,
  `total` INT NOT NULL,
  `passed` BOOLEAN NOT NULL,
  `attempted_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE,
  FOREIGN KEY (`milestone_id`) REFERENCES `milestones`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
