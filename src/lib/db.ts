import { neon, type NeonQueryFunction } from "@neondatabase/serverless";

/**
 * Neon Postgres backend (replaces Convex).
 *
 * The browser talks directly to Neon using its HTTP driver — no server
 * needed, which keeps the app deployable as a static site (GitHub Pages).
 *
 * Required env var (set via Keys/API keys): VITE_NEON_DATABASE_URL
 * A read-only Neon connection string also works (recommended for a public
 * deployment) as long as it can read/write the public tables below.
 */

export const DATABASE_URL = import.meta.env.VITE_NEON_DATABASE_URL as
  | string
  | undefined;

/** True when the Neon connection string is present. */
export const hasDb = Boolean(DATABASE_URL);

let sql: NeonQueryFunction<false, false> | null = null;

function getSql(): NeonQueryFunction<false, false> {
  if (!sql) {
    if (!DATABASE_URL) {
      throw new Error("Missing VITE_NEON_DATABASE_URL");
    }
    sql = neon(DATABASE_URL);
  }
  return sql;
}

/* ------------------------------------------------------------------ */
/* Schema                                                              */
/* ------------------------------------------------------------------ */

let schemaPromise: Promise<void> | null = null;

/** Idempotently create the users + app_data tables. Memoized per session. */
export function ensureSchema(): Promise<void> {
  if (!schemaPromise) {
    schemaPromise = (async () => {
      const s = getSql();
      await s`
        CREATE TABLE IF NOT EXISTS users (
          id            TEXT PRIMARY KEY,
          name          TEXT NOT NULL DEFAULT '',
          email         TEXT NOT NULL UNIQUE,
          password_hash TEXT NOT NULL,
          created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
        )
      `;
      await s`
        CREATE TABLE IF NOT EXISTS app_data (
          user_id    TEXT PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
          data       JSONB NOT NULL,
          updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
        )
      `;
    })().catch((err) => {
      schemaPromise = null; // allow retry (e.g. transient offline)
      throw err;
    });
  }
  return schemaPromise;
}

/* ------------------------------------------------------------------ */
/* Users                                                               */
/* ------------------------------------------------------------------ */

export type DbUser = { id: string; name: string; email: string };

export async function findUserByEmail(email: string): Promise<DbUser | null> {
  await ensureSchema();
  const rows = await getSql()`
    SELECT id, name, email FROM users WHERE email = ${email} LIMIT 1
  `;
  const row = rows[0] as DbUser | undefined;
  return row ?? null;
}

export async function getUserHash(email: string): Promise<string | null> {
  await ensureSchema();
  const rows = await getSql()`
    SELECT password_hash FROM users WHERE email = ${email} LIMIT 1
  `;
  const row = rows[0] as { password_hash: string } | undefined;
  return row ? row.password_hash : null;
}

export async function createUser(
  id: string,
  name: string,
  email: string,
  passwordHash: string,
): Promise<DbUser> {
  await ensureSchema();
  const rows = await getSql()`
    INSERT INTO users (id, name, email, password_hash)
    VALUES (${id}, ${name}, ${email}, ${passwordHash})
    RETURNING id, name, email
  `;
  return rows[0] as DbUser;
}

/* ------------------------------------------------------------------ */
/* Per-user app data (JSON document)                                   */
/* ------------------------------------------------------------------ */

export async function getAppData(userId: string): Promise<unknown | null> {
  await ensureSchema();
  const rows = await getSql()`
    SELECT data FROM app_data WHERE user_id = ${userId} LIMIT 1
  `;
  const row = rows[0] as { data: unknown } | undefined;
  return row ? row.data : null;
}

export async function hasAppData(userId: string): Promise<boolean> {
  await ensureSchema();
  const rows = await getSql()`
    SELECT 1 AS one FROM app_data WHERE user_id = ${userId} LIMIT 1
  `;
  return rows.length > 0;
}

export async function saveAppData(userId: string, data: unknown): Promise<void> {
  await ensureSchema();
  await getSql()`
    INSERT INTO app_data (user_id, data, updated_at)
    VALUES (${userId}, ${JSON.stringify(data)}::jsonb, now())
    ON CONFLICT (user_id)
    DO UPDATE SET data = EXCLUDED.data, updated_at = now()
  `;
}
