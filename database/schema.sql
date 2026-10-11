-- =====================================================================
-- CollabX — Research & Innovation Collaboration Portal
-- Database Management System (DBMS) Schema
-- Course: CSE 222 (DBMS Sessional), Port City International University
-- Engine: MySQL 8.0+ / MariaDB 10.6+ (InnoDB, utf8mb4_unicode_ci)
-- =====================================================================

SET FOREIGN_KEY_CHECKS = 0;
DROP TABLE IF EXISTS `newsletter_subscribers`;
DROP TABLE IF EXISTS `contact_messages`;
DROP TABLE IF EXISTS `search_history`;
DROP TABLE IF EXISTS `search_cache`;
DROP TABLE IF EXISTS `ai_usage_log`;
DROP TABLE IF EXISTS `ai_drafts`;
DROP TABLE IF EXISTS `external_papers_saved`;
DROP TABLE IF EXISTS `paper_comments`;
DROP TABLE IF EXISTS `paper_likes`;
DROP TABLE IF EXISTS `paper_bookmarks`;
DROP TABLE IF EXISTS `paper_keywords`;
DROP TABLE IF EXISTS `paper_authors`;
DROP TABLE IF EXISTS `papers`;
DROP TABLE IF EXISTS `events`;
DROP TABLE IF EXISTS `notifications`;
DROP TABLE IF EXISTS `message_reads`;
DROP TABLE IF EXISTS `messages`;
DROP TABLE IF EXISTS `project_files`;
DROP TABLE IF EXISTS `milestones`;
DROP TABLE IF EXISTS `saved_projects`;
DROP TABLE IF EXISTS `project_invitations`;
DROP TABLE IF EXISTS `project_members`;
DROP TABLE IF EXISTS `applications`;
DROP TABLE IF EXISTS `project_tags`;
DROP TABLE IF EXISTS `tags`;
DROP TABLE IF EXISTS `project_skills`;
DROP TABLE IF EXISTS `projects`;
DROP TABLE IF EXISTS `user_interests`;
DROP TABLE IF EXISTS `user_skills`;
DROP TABLE IF EXISTS `skills`;
DROP TABLE IF EXISTS `research_areas`;
DROP TABLE IF EXISTS `remember_tokens`;
DROP TABLE IF EXISTS `password_resets`;
DROP TABLE IF EXISTS `login_attempts`;
DROP TABLE IF EXISTS `oauth_accounts`;
DROP TABLE IF EXISTS `activity_logs`;
DROP TABLE IF EXISTS `settings`;
DROP TABLE IF EXISTS `users`;
DROP TABLE IF EXISTS `departments`;
SET FOREIGN_KEY_CHECKS = 1;

-- ---------------------------------------------------------------------
-- 1. Departments Table
-- ---------------------------------------------------------------------
CREATE TABLE `departments` (
  `id` INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  `name` VARCHAR(150) NOT NULL UNIQUE,
  `code` VARCHAR(20) NOT NULL UNIQUE,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ---------------------------------------------------------------------
-- 2. Users Table
-- ---------------------------------------------------------------------
CREATE TABLE `users` (
  `id` VARCHAR(50) PRIMARY KEY,
  `name` VARCHAR(120) NOT NULL,
  `email` VARCHAR(150) NOT NULL UNIQUE,
  `password_hash` VARCHAR(255) NOT NULL,
  `university_id` VARCHAR(50) NULL UNIQUE,
  `role` ENUM('student', 'researcher', 'supervisor', 'admin') NOT NULL DEFAULT 'student',
  `status` ENUM('active', 'inactive', 'pending') NOT NULL DEFAULT 'active',
  `email_verified_at` TIMESTAMP NULL DEFAULT NULL,
  `avatar_path` VARCHAR(255) NULL,
  `headline` VARCHAR(200) NULL,
  `department_id` INT UNSIGNED NULL,
  `institution` VARCHAR(180) NOT NULL DEFAULT 'Port City International University',
  `bio` TEXT NULL,
  `links_json` JSON NULL,
  `last_login_at` TIMESTAMP NULL DEFAULT NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT `fk_users_dept` FOREIGN KEY (`department_id`) REFERENCES `departments` (`id`) ON DELETE SET NULL,
  INDEX `idx_users_role` (`role`),
  INDEX `idx_users_status` (`status`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ---------------------------------------------------------------------
-- 3. Research Areas Table (Hierarchical Domain Taxonomy)
-- ---------------------------------------------------------------------
CREATE TABLE `research_areas` (
  `id` VARCHAR(50) PRIMARY KEY,
  `parent_id` VARCHAR(50) NULL,
  `name` VARCHAR(120) NOT NULL,
  `slug` VARCHAR(120) NOT NULL UNIQUE,
  `icon` VARCHAR(50) NOT NULL DEFAULT 'Brain',
  `color` VARCHAR(20) NOT NULL DEFAULT '#0B6BE6',
  `bg_pastel` VARCHAR(20) NOT NULL DEFAULT '#DEEBFB',
  `sort_order` INT NOT NULL DEFAULT 0,
  `is_active` TINYINT(1) NOT NULL DEFAULT 1,
  CONSTRAINT `fk_areas_parent` FOREIGN KEY (`parent_id`) REFERENCES `research_areas` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ---------------------------------------------------------------------
-- 4. Skills Table
-- ---------------------------------------------------------------------
CREATE TABLE `skills` (
  `id` INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  `name` VARCHAR(80) NOT NULL UNIQUE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `user_skills` (
  `user_id` VARCHAR(50) NOT NULL,
  `skill_id` INT UNSIGNED NOT NULL,
  PRIMARY KEY (`user_id`, `skill_id`),
  CONSTRAINT `fk_uskill_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_uskill_skill` FOREIGN KEY (`skill_id`) REFERENCES `skills` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `user_interests` (
  `user_id` VARCHAR(50) NOT NULL,
  `area_id` VARCHAR(50) NOT NULL,
  PRIMARY KEY (`user_id`, `area_id`),
  CONSTRAINT `fk_uint_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_uint_area` FOREIGN KEY (`area_id`) REFERENCES `research_areas` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ---------------------------------------------------------------------
-- 5. Projects Table
-- ---------------------------------------------------------------------
CREATE TABLE `projects` (
  `id` VARCHAR(50) PRIMARY KEY,
  `supervisor_id` VARCHAR(50) NOT NULL,
  `title` VARCHAR(255) NOT NULL,
  `slug` VARCHAR(255) NOT NULL UNIQUE,
  `summary` VARCHAR(500) NOT NULL,
  `description` TEXT NOT NULL,
  `objectives_json` JSON NULL,
  `expected_outcome` TEXT NULL,
  `methodology` TEXT NULL,
  `area_id` VARCHAR(50) NOT NULL,
  `subarea` VARCHAR(100) NULL,
  `project_type` ENUM('Thesis', 'Funded Research', 'Course Project', 'Open Source', 'Competition', 'Industry') NOT NULL DEFAULT 'Thesis',
  `difficulty` ENUM('Beginner', 'Intermediate', 'Advanced') NOT NULL DEFAULT 'Intermediate',
  `duration_months` INT UNSIGNED NOT NULL DEFAULT 6,
  `total_positions` INT UNSIGNED NOT NULL DEFAULT 4,
  `filled_positions` INT UNSIGNED NOT NULL DEFAULT 1,
  `deadline` DATE NOT NULL,
  `start_date` DATE NOT NULL,
  `end_date` DATE NOT NULL,
  `status` ENUM('draft', 'pending', 'approved', 'rejected', 'active', 'completed', 'upcoming', 'closed') NOT NULL DEFAULT 'active',
  `reject_reason` TEXT NULL,
  `thumbnail_path` VARCHAR(255) NOT NULL,
  `views` INT UNSIGNED NOT NULL DEFAULT 0,
  `progress_percent` TINYINT UNSIGNED NOT NULL DEFAULT 0,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT `fk_proj_supervisor` FOREIGN KEY (`supervisor_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_proj_area` FOREIGN KEY (`area_id`) REFERENCES `research_areas` (`id`) ON DELETE RESTRICT,
  FULLTEXT `ft_proj_search` (`title`, `summary`, `description`),
  INDEX `idx_proj_status` (`status`),
  INDEX `idx_proj_deadline` (`deadline`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `project_skills` (
  `project_id` VARCHAR(50) NOT NULL,
  `skill_id` INT UNSIGNED NOT NULL,
  PRIMARY KEY (`project_id`, `skill_id`),
  CONSTRAINT `fk_pskill_proj` FOREIGN KEY (`project_id`) REFERENCES `projects` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_pskill_skill` FOREIGN KEY (`skill_id`) REFERENCES `skills` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ---------------------------------------------------------------------
-- 6. Applications Table
-- ---------------------------------------------------------------------
CREATE TABLE `applications` (
  `id` VARCHAR(50) PRIMARY KEY,
  `project_id` VARCHAR(50) NOT NULL,
  `user_id` VARCHAR(50) NOT NULL,
  `message` TEXT NOT NULL,
  `skills_note` VARCHAR(255) NULL,
  `cv_path` VARCHAR(255) NULL,
  `status` ENUM('pending', 'approved', 'rejected', 'withdrawn') NOT NULL DEFAULT 'pending',
  `response_note` TEXT NULL,
  `decided_by` VARCHAR(50) NULL,
  `decided_at` TIMESTAMP NULL DEFAULT NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY `uk_app_user_proj` (`project_id`, `user_id`),
  CONSTRAINT `fk_app_proj` FOREIGN KEY (`project_id`) REFERENCES `projects` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_app_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ---------------------------------------------------------------------
-- 7. Project Members Table
-- ---------------------------------------------------------------------
CREATE TABLE `project_members` (
  `id` VARCHAR(50) PRIMARY KEY,
  `project_id` VARCHAR(50) NOT NULL,
  `user_id` VARCHAR(50) NOT NULL,
  `role` ENUM('supervisor', 'member', 'owner') NOT NULL DEFAULT 'member',
  `position_title` VARCHAR(100) NOT NULL DEFAULT 'Research Assistant',
  `status` ENUM('active', 'removed') NOT NULL DEFAULT 'active',
  `joined_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY `uk_member_proj_user` (`project_id`, `user_id`),
  CONSTRAINT `fk_pmember_proj` FOREIGN KEY (`project_id`) REFERENCES `projects` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_pmember_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ---------------------------------------------------------------------
-- 8. Milestones Table
-- ---------------------------------------------------------------------
CREATE TABLE `milestones` (
  `id` VARCHAR(50) PRIMARY KEY,
  `project_id` VARCHAR(50) NOT NULL,
  `title` VARCHAR(180) NOT NULL,
  `percent` TINYINT UNSIGNED NOT NULL DEFAULT 0,
  `sort_order` INT NOT NULL DEFAULT 1,
  `due_date` DATE NOT NULL,
  `completed` TINYINT(1) NOT NULL DEFAULT 0,
  CONSTRAINT `fk_milestone_proj` FOREIGN KEY (`project_id`) REFERENCES `projects` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ---------------------------------------------------------------------
-- 9. Discussion Messages Table
-- ---------------------------------------------------------------------
CREATE TABLE `messages` (
  `id` VARCHAR(50) PRIMARY KEY,
  `project_id` VARCHAR(50) NOT NULL,
  `sender_id` VARCHAR(50) NOT NULL,
  `body` TEXT NOT NULL,
  `attachment_path` VARCHAR(255) NULL,
  `attachment_name` VARCHAR(150) NULL,
  `attachment_size` VARCHAR(50) NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT `fk_msg_proj` FOREIGN KEY (`project_id`) REFERENCES `projects` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_msg_sender` FOREIGN KEY (`sender_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ---------------------------------------------------------------------
-- 10. Research Papers Table
-- ---------------------------------------------------------------------
CREATE TABLE `papers` (
  `id` VARCHAR(50) PRIMARY KEY,
  `uploader_id` VARCHAR(50) NOT NULL,
  `title` VARCHAR(255) NOT NULL,
  `abstract` TEXT NOT NULL,
  `paper_type` ENUM('Journal', 'Conference', 'Thesis', 'Preprint', 'Report') NOT NULL DEFAULT 'Conference',
  `area_id` VARCHAR(50) NOT NULL,
  `year` INT UNSIGNED NOT NULL DEFAULT 2026,
  `doi` VARCHAR(100) NULL,
  `authors_json` JSON NOT NULL,
  `keywords_json` JSON NOT NULL,
  `pdf_path` VARCHAR(255) NULL,
  `cover_path` VARCHAR(255) NULL,
  `visibility` ENUM('public', 'members', 'private') NOT NULL DEFAULT 'public',
  `ai_assisted` TINYINT(1) NOT NULL DEFAULT 0,
  `views` INT UNSIGNED NOT NULL DEFAULT 0,
  `downloads` INT UNSIGNED NOT NULL DEFAULT 0,
  `likes` INT UNSIGNED NOT NULL DEFAULT 0,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT `fk_paper_uploader` FOREIGN KEY (`uploader_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  FULLTEXT `ft_paper_search` (`title`, `abstract`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ---------------------------------------------------------------------
-- 11. Activity Logs Table
-- ---------------------------------------------------------------------
CREATE TABLE `activity_logs` (
  `id` VARCHAR(50) PRIMARY KEY,
  `user_id` VARCHAR(50) NOT NULL,
  `user_name` VARCHAR(120) NOT NULL,
  `user_avatar` VARCHAR(255) NULL,
  `action` VARCHAR(100) NOT NULL,
  `entity_type` VARCHAR(50) NOT NULL,
  `entity_title` VARCHAR(200) NOT NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
