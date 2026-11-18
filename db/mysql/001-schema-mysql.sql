-- ============================================================
-- VERSI MySQL/MariaDB dari schema proyek.
--
-- PENTING:
-- Stack utama proyek ini memakai PostgreSQL 17 (lihat
-- db/init/001-schema.sql). File ini hanya untuk kasus kamu
-- memang ingin menjalankan schema di MySQL/MariaDB, misalnya
-- phpMyAdmin cPanel.
--
-- Aplikasi Next.js di folder app/ TIDAK memakai file ini:
-- lib/db.ts memakai driver "pg" (PostgreSQL), bukan "mysql2".
--
-- Cara pakai di phpMyAdmin:
--   1. Buat database dulu (cPanel > MySQL Databases) atau
--      pilih database yang sudah ada di sidebar kiri.
--   2. Tab SQL > paste isi file ini > Kirim.
-- Jangan jalankan tanpa memilih database, nanti muncul
-- error #1046 "No database selected".
-- ============================================================

CREATE TABLE IF NOT EXISTS guestbook (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  name VARCHAR(80) NOT NULL,
  message VARCHAR(500) NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY guestbook_created_at_idx (created_at, id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS app_users (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  name VARCHAR(80) NOT NULL,
  email VARCHAR(254) NOT NULL,
  password_hash TEXT NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY app_users_email_key (email)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS app_sessions (
  token_hash CHAR(64) NOT NULL,
  user_id BIGINT UNSIGNED NOT NULL,
  expires_at TIMESTAMP NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (token_hash),
  KEY app_sessions_user_id_idx (user_id),
  KEY app_sessions_expires_at_idx (expires_at),
  CONSTRAINT app_sessions_user_id_fkey
    FOREIGN KEY (user_id) REFERENCES app_users (id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS deployment_progress (
  user_id BIGINT UNSIGNED NOT NULL,
  step_id SMALLINT NOT NULL,
  selected_option_id VARCHAR(80) NOT NULL,
  completed BOOLEAN NOT NULL DEFAULT FALSE,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (user_id, step_id),
  CONSTRAINT deployment_progress_step_id_check
    CHECK (step_id BETWEEN 1 AND 9),
  CONSTRAINT deployment_progress_user_id_fkey
    FOREIGN KEY (user_id) REFERENCES app_users (id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS pipeline_configurations (
  user_id BIGINT UNSIGNED NOT NULL,
  configuration JSON NOT NULL,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (user_id),
  CONSTRAINT pipeline_configurations_user_id_fkey
    FOREIGN KEY (user_id) REFERENCES app_users (id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS database_configurations (
  user_id BIGINT UNSIGNED NOT NULL,
  configuration JSON NOT NULL,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (user_id),
  CONSTRAINT database_configurations_user_id_fkey
    FOREIGN KEY (user_id) REFERENCES app_users (id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS lab_section_configurations (
  user_id BIGINT UNSIGNED NOT NULL,
  step_id SMALLINT NOT NULL,
  configuration JSON NOT NULL,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (user_id, step_id),
  CONSTRAINT lab_section_configurations_step_id_check
    CHECK (step_id BETWEEN 1 AND 9),
  CONSTRAINT lab_section_configurations_user_id_fkey
    FOREIGN KEY (user_id) REFERENCES app_users (id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
