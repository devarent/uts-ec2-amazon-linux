-- Dijalankan otomatis oleh image postgres saat volume db-data masih kosong.
-- App juga menjalankan CREATE TABLE IF NOT EXISTS yang sama (lihat lib/db.ts),
-- jadi schema tetap aman bila volume sudah pernah dibuat sebelumnya.

CREATE TABLE IF NOT EXISTS guestbook (
  id BIGSERIAL PRIMARY KEY,
  name VARCHAR(80) NOT NULL,
  message VARCHAR(500) NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS guestbook_created_at_idx
  ON guestbook (created_at DESC, id DESC);

CREATE TABLE IF NOT EXISTS app_users (
  id BIGSERIAL PRIMARY KEY,
  name VARCHAR(80) NOT NULL,
  email VARCHAR(254) NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS app_sessions (
  token_hash CHAR(64) PRIMARY KEY,
  user_id BIGINT NOT NULL REFERENCES app_users(id) ON DELETE CASCADE,
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS app_sessions_user_id_idx
  ON app_sessions (user_id);
CREATE INDEX IF NOT EXISTS app_sessions_expires_at_idx
  ON app_sessions (expires_at);

CREATE TABLE IF NOT EXISTS deployment_progress (
  user_id BIGINT NOT NULL REFERENCES app_users(id) ON DELETE CASCADE,
  step_id SMALLINT NOT NULL CHECK (step_id BETWEEN 1 AND 9),
  selected_option_id VARCHAR(80) NOT NULL,
  completed BOOLEAN NOT NULL DEFAULT FALSE,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (user_id, step_id)
);

CREATE TABLE IF NOT EXISTS pipeline_configurations (
  user_id BIGINT PRIMARY KEY REFERENCES app_users(id) ON DELETE CASCADE,
  configuration JSONB NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS database_configurations (
  user_id BIGINT PRIMARY KEY REFERENCES app_users(id) ON DELETE CASCADE,
  configuration JSONB NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS lab_section_configurations (
  user_id BIGINT NOT NULL REFERENCES app_users(id) ON DELETE CASCADE,
  step_id SMALLINT NOT NULL CHECK (step_id BETWEEN 1 AND 9),
  configuration JSONB NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (user_id, step_id)
);
