import { Pool, type QueryResultRow } from "pg";
import { LAB_STEPS } from "@/lib/lab";
import {
  DEFAULT_PIPELINE_CONFIGURATION,
  type PipelineConfiguration,
} from "@/lib/pipeline";
import {
  DATABASE_PROVIDER_CHECKLIST_OPTIONS,
  DEFAULT_DATABASE_CONFIGURATION,
  type DatabaseConfiguration,
} from "@/lib/database-config";
import {
  defaultSectionConfiguration,
  type SectionConfiguration,
} from "@/lib/section-config";

export type GuestbookEntry = {
  id: number;
  name: string;
  message: string;
  created_at: string;
};

export type DbHealth = {
  status: "up" | "down" | "not_configured";
  latency_ms: number | null;
};

export type AppUser = {
  id: number;
  name: string;
  email: string;
};

export type DeploymentProgress = {
  step_id: number;
  selected_option_id: string;
  completed: boolean;
  updated_at: string;
};

export type LabSectionConfiguration = {
  step_id: number;
  configuration: SectionConfiguration;
  updated_at: string;
};

let pool: Pool | null = null;
let schemaReady: Promise<void> | null = null;

/**
 * Pool dibuat lazy supaya `next build` tidak pernah mencoba konek ke database.
 * Di dalam EC2, DATABASE_URL diarahkan ke service `db` pada jaringan Docker.
 */
function getPool(): Pool | null {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) return null;

  if (!pool) {
    pool = new Pool({
      connectionString,
      max: Number(process.env.DB_POOL_MAX ?? 5),
      idleTimeoutMillis: 30_000,
      connectionTimeoutMillis: 4_000,
      ssl:
        process.env.DATABASE_SSL === "true"
          ? { rejectUnauthorized: true }
          : undefined,
    });
    pool.on("error", (error) => {
      console.error("[db] idle client error:", error.message);
    });
  }

  return pool;
}

// Init script di db/init juga membuat tabel ini. Query di sini membuat app
// tetap bisa jalan pada volume database yang sudah ada / database eksternal.
const SCHEMA_SQL = `
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
`;

async function ensureSchema(client: Pool): Promise<void> {
  if (!schemaReady) {
    schemaReady = client.query(SCHEMA_SQL).then(() => undefined);
  }
  try {
    await schemaReady;
  } catch (error) {
    schemaReady = null;
    throw error;
  }
}

function normalize(row: QueryResultRow): GuestbookEntry {
  return {
    id: Number(row.id),
    name: String(row.name),
    message: String(row.message),
    created_at: new Date(row.created_at).toISOString(),
  };
}

export function isDbConfigured(): boolean {
  return Boolean(process.env.DATABASE_URL);
}

export async function dbHealth(): Promise<DbHealth> {
  const client = getPool();
  if (!client) return { status: "not_configured", latency_ms: null };

  const startedAt = Date.now();
  try {
    await client.query("SELECT 1");
    return { status: "up", latency_ms: Date.now() - startedAt };
  } catch {
    return { status: "down", latency_ms: Date.now() - startedAt };
  }
}

export async function listEntries(limit = 50): Promise<GuestbookEntry[]> {
  const client = getPool();
  if (!client) throw new Error("DATABASE_URL belum di-set");

  await ensureSchema(client);
  const safeLimit = Math.min(Math.max(Math.trunc(limit), 1), 100);
  const result = await client.query(
    `SELECT id, name, message, created_at
       FROM guestbook
      ORDER BY created_at DESC, id DESC
      LIMIT $1`,
    [safeLimit],
  );
  return result.rows.map(normalize);
}

export async function createEntry(input: {
  name: string;
  message: string;
}): Promise<GuestbookEntry> {
  const client = getPool();
  if (!client) throw new Error("DATABASE_URL belum di-set");

  await ensureSchema(client);
  const result = await client.query(
    `INSERT INTO guestbook (name, message)
     VALUES ($1, $2)
     RETURNING id, name, message, created_at`,
    [input.name, input.message],
  );
  return normalize(result.rows[0]);
}

export async function deleteEntry(id: number): Promise<boolean> {
  const client = getPool();
  if (!client) throw new Error("DATABASE_URL belum di-set");

  await ensureSchema(client);
  const result = await client.query("DELETE FROM guestbook WHERE id = $1", [id]);
  return (result.rowCount ?? 0) > 0;
}

function normalizeUser(row: QueryResultRow): AppUser {
  return {
    id: Number(row.id),
    name: String(row.name),
    email: String(row.email),
  };
}

export async function createUser(input: {
  name: string;
  email: string;
  passwordHash: string;
}): Promise<AppUser> {
  const client = getPool();
  if (!client) throw new Error("DATABASE_URL belum di-set");
  await ensureSchema(client);

  const connection = await client.connect();
  try {
    await connection.query("BEGIN");
    const result = await connection.query(
      `INSERT INTO app_users (name, email, password_hash)
       VALUES ($1, $2, $3)
       RETURNING id, name, email`,
      [input.name, input.email, input.passwordHash],
    );
    const user = normalizeUser(result.rows[0]);
    for (const step of LAB_STEPS) {
      await connection.query(
        `INSERT INTO deployment_progress (user_id, step_id, selected_option_id)
         VALUES ($1, $2, $3)`,
        [user.id, step.id, step.recommendedOptionId],
      );
    }
    await connection.query("COMMIT");
    return user;
  } catch (error) {
    await connection.query("ROLLBACK");
    throw error;
  } finally {
    connection.release();
  }
}

export async function findUserByEmail(email: string): Promise<
  (AppUser & { password_hash: string }) | null
> {
  const client = getPool();
  if (!client) throw new Error("DATABASE_URL belum di-set");
  await ensureSchema(client);
  const result = await client.query(
    `SELECT id, name, email, password_hash
       FROM app_users
      WHERE email = $1`,
    [email],
  );
  const row = result.rows[0];
  return row ? { ...normalizeUser(row), password_hash: String(row.password_hash) } : null;
}

export async function createUserSession(
  userId: number,
  tokenHash: string,
  expiresAt: Date,
): Promise<void> {
  const client = getPool();
  if (!client) throw new Error("DATABASE_URL belum di-set");
  await ensureSchema(client);
  await client.query("DELETE FROM app_sessions WHERE expires_at <= NOW()");
  await client.query(
    `INSERT INTO app_sessions (token_hash, user_id, expires_at)
     VALUES ($1, $2, $3)`,
    [tokenHash, userId, expiresAt],
  );
}

export async function findUserBySession(
  tokenHash: string,
): Promise<AppUser | null> {
  const client = getPool();
  if (!client) throw new Error("DATABASE_URL belum di-set");
  await ensureSchema(client);
  const result = await client.query(
    `SELECT users.id, users.name, users.email
       FROM app_sessions AS sessions
       JOIN app_users AS users ON users.id = sessions.user_id
      WHERE sessions.token_hash = $1
        AND sessions.expires_at > NOW()`,
    [tokenHash],
  );
  return result.rows[0] ? normalizeUser(result.rows[0]) : null;
}

export async function deleteUserSession(tokenHash: string): Promise<void> {
  const client = getPool();
  if (!client) throw new Error("DATABASE_URL belum di-set");
  await ensureSchema(client);
  await client.query("DELETE FROM app_sessions WHERE token_hash = $1", [tokenHash]);
}

export async function listDeploymentProgress(
  userId: number,
): Promise<DeploymentProgress[]> {
  const client = getPool();
  if (!client) throw new Error("DATABASE_URL belum di-set");
  await ensureSchema(client);

  for (const step of LAB_STEPS) {
    await client.query(
      `INSERT INTO deployment_progress (user_id, step_id, selected_option_id)
       VALUES ($1, $2, $3)
       ON CONFLICT (user_id, step_id) DO NOTHING`,
      [userId, step.id, step.recommendedOptionId],
    );
  }

  const result = await client.query(
    `SELECT step_id, selected_option_id, completed, updated_at
       FROM deployment_progress
      WHERE user_id = $1
      ORDER BY step_id`,
    [userId],
  );
  return result.rows.map((row) => ({
    step_id: Number(row.step_id),
    selected_option_id: String(row.selected_option_id),
    completed: Boolean(row.completed),
    updated_at: new Date(row.updated_at).toISOString(),
  }));
}

export async function listLabSectionConfigurations(
  userId: number,
): Promise<LabSectionConfiguration[]> {
  const client = getPool();
  if (!client) throw new Error("DATABASE_URL belum di-set");
  await ensureSchema(client);

  await client.query(
    `INSERT INTO database_configurations (user_id, configuration)
     VALUES ($1, $2::jsonb)
     ON CONFLICT (user_id) DO NOTHING`,
    [userId, JSON.stringify(DEFAULT_DATABASE_CONFIGURATION)],
  );
  for (const step of LAB_STEPS) {
    if (step.id === 4) {
      await client.query(
        `INSERT INTO lab_section_configurations (user_id, step_id, configuration)
         SELECT user_id, 4, configuration
           FROM database_configurations
          WHERE user_id = $1
         ON CONFLICT (user_id, step_id) DO NOTHING`,
        [userId],
      );
      continue;
    }
    const configuration = defaultSectionConfiguration(step.id);
    if (!configuration) throw new Error(`Missing section defaults for step ${step.id}`);
    await client.query(
      `INSERT INTO lab_section_configurations (user_id, step_id, configuration)
       VALUES ($1, $2, $3::jsonb)
       ON CONFLICT (user_id, step_id) DO NOTHING`,
      [userId, step.id, JSON.stringify(configuration)],
    );
  }

  const result = await client.query(
    `SELECT step_id, configuration, updated_at
       FROM lab_section_configurations
      WHERE user_id = $1
      ORDER BY step_id`,
    [userId],
  );
  return result.rows.map((row) => {
    const stepId = Number(row.step_id);
    const configuration: SectionConfiguration = {
      ...(defaultSectionConfiguration(stepId) ?? {}),
      ...(row.configuration as SectionConfiguration),
    };
    if (stepId === 2 && configuration.adminAccess === "ssm-only") {
      try {
        const rules = JSON.parse(String(configuration.inboundRules)) as Array<{
          port?: number;
        }>;
        if (Array.isArray(rules)) {
          configuration.inboundRules = JSON.stringify(
            rules.filter((rule) => rule.port !== 22),
          );
        }
      } catch (parseError) {
        console.error("[db] invalid saved inbound rules:", parseError);
      }
    }
    return {
      step_id: stepId,
      configuration,
      updated_at: new Date(row.updated_at).toISOString(),
    };
  });
}

export async function saveDeploymentProgress(input: {
  userId: number;
  stepId: number;
  selectedOptionId: string;
  completed: boolean;
  configuration?: SectionConfiguration;
}): Promise<DeploymentProgress> {
  const client = getPool();
  if (!client) throw new Error("DATABASE_URL belum di-set");
  await ensureSchema(client);
  const connection = await client.connect();
  try {
    await connection.query("BEGIN");
    const result = await connection.query(
      `INSERT INTO deployment_progress
         (user_id, step_id, selected_option_id, completed, updated_at)
       VALUES ($1, $2, $3, $4, NOW())
       ON CONFLICT (user_id, step_id) DO UPDATE SET
         selected_option_id = EXCLUDED.selected_option_id,
         completed = EXCLUDED.completed,
         updated_at = NOW()
       RETURNING step_id, selected_option_id, completed, updated_at`,
      [
        input.userId,
        input.stepId,
        input.selectedOptionId,
        input.completed,
      ],
    );
    if (input.stepId !== 4) {
      if (!input.configuration) {
        throw new Error(`Missing section configuration for step ${input.stepId}`);
      }
      await connection.query(
        `INSERT INTO lab_section_configurations
           (user_id, step_id, configuration, updated_at)
         VALUES ($1, $2, $3::jsonb, NOW())
         ON CONFLICT (user_id, step_id) DO UPDATE SET
           configuration = EXCLUDED.configuration,
           updated_at = NOW()`,
        [input.userId, input.stepId, JSON.stringify(input.configuration)],
      );
    }
    await connection.query("COMMIT");
    const row = result.rows[0];
    return {
      step_id: Number(row.step_id),
      selected_option_id: String(row.selected_option_id),
      completed: Boolean(row.completed),
      updated_at: new Date(row.updated_at).toISOString(),
    };
  } catch (error) {
    await connection.query("ROLLBACK");
    throw error;
  } finally {
    connection.release();
  }
}

export async function getPipelineConfiguration(
  userId: number,
): Promise<unknown> {
  const client = getPool();
  if (!client) throw new Error("DATABASE_URL belum di-set");
  await ensureSchema(client);

  await client.query(
    `INSERT INTO pipeline_configurations (user_id, configuration)
     VALUES ($1, $2::jsonb)
     ON CONFLICT (user_id) DO NOTHING`,
    [userId, JSON.stringify(DEFAULT_PIPELINE_CONFIGURATION)],
  );
  const result = await client.query(
    `SELECT configuration
       FROM pipeline_configurations
      WHERE user_id = $1`,
    [userId],
  );
  return result.rows[0]?.configuration ?? null;
}

export async function savePipelineConfiguration(input: {
  userId: number;
  configuration: PipelineConfiguration;
}): Promise<PipelineConfiguration> {
  const client = getPool();
  if (!client) throw new Error("DATABASE_URL belum di-set");
  await ensureSchema(client);

  const result = await client.query(
    `INSERT INTO pipeline_configurations (user_id, configuration, updated_at)
     VALUES ($1, $2::jsonb, NOW())
     ON CONFLICT (user_id) DO UPDATE SET
       configuration = EXCLUDED.configuration,
       updated_at = NOW()
     RETURNING configuration`,
    [input.userId, JSON.stringify(input.configuration)],
  );
  return result.rows[0].configuration as PipelineConfiguration;
}

export async function getDatabaseConfiguration(userId: number): Promise<unknown> {
  const client = getPool();
  if (!client) throw new Error("DATABASE_URL belum di-set");
  await ensureSchema(client);

  await client.query(
    `INSERT INTO database_configurations (user_id, configuration)
     VALUES ($1, $2::jsonb)
     ON CONFLICT (user_id) DO NOTHING`,
    [userId, JSON.stringify(DEFAULT_DATABASE_CONFIGURATION)],
  );
  const result = await client.query(
    `SELECT configuration FROM database_configurations WHERE user_id = $1`,
    [userId],
  );
  return result.rows[0]?.configuration ?? null;
}

export async function saveDatabaseConfiguration(input: {
  userId: number;
  configuration: DatabaseConfiguration;
}): Promise<DatabaseConfiguration> {
  const client = getPool();
  if (!client) throw new Error("DATABASE_URL belum di-set");
  await ensureSchema(client);

  const connection = await client.connect();
  try {
    await connection.query("BEGIN");
    const saved = await connection.query(
      `INSERT INTO database_configurations (user_id, configuration, updated_at)
       VALUES ($1, $2::jsonb, NOW())
       ON CONFLICT (user_id) DO UPDATE SET
         configuration = EXCLUDED.configuration,
         updated_at = NOW()
       RETURNING configuration`,
      [input.userId, JSON.stringify(input.configuration)],
    );
    const selectedOptionId =
      DATABASE_PROVIDER_CHECKLIST_OPTIONS[input.configuration.provider];
    await connection.query(
      `INSERT INTO deployment_progress
         (user_id, step_id, selected_option_id, completed, updated_at)
       VALUES ($1, 4, $2, FALSE, NOW())
       ON CONFLICT (user_id, step_id) DO UPDATE SET
         selected_option_id = EXCLUDED.selected_option_id,
         updated_at = NOW()`,
      [input.userId, selectedOptionId],
    );
    await connection.query(
      `INSERT INTO lab_section_configurations
         (user_id, step_id, configuration, updated_at)
       VALUES ($1, 4, $2::jsonb, NOW())
       ON CONFLICT (user_id, step_id) DO UPDATE SET
         configuration = EXCLUDED.configuration,
         updated_at = NOW()`,
      [input.userId, JSON.stringify(input.configuration)],
    );
    await connection.query("COMMIT");
    return saved.rows[0].configuration as DatabaseConfiguration;
  } catch (error) {
    await connection.query("ROLLBACK");
    throw error;
  } finally {
    connection.release();
  }
}
