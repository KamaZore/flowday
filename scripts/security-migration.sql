-- Flowday security boundary (run in Neon SQL editor)
-- IMPORTANT: the browser-only deployment must not use a public privileged URL.
-- Run this against the same database used by a private server/edge API.

CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL DEFAULT '',
  email TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'user' CHECK (role IN ('user', 'superadmin')),
  permissions JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS app_data (
  user_id TEXT PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  data JSONB NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS app_config (
  key TEXT PRIMARY KEY,
  value JSONB NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE app_data ENABLE ROW LEVEL SECURITY;
ALTER TABLE app_data FORCE ROW LEVEL SECURITY;

-- The API sets these transaction-local claims after validating its bearer
-- session. Normal users can only touch their own document. Super admins have
-- an explicit administrative path in the API, never a client-supplied user id.
CREATE OR REPLACE FUNCTION flowday_user_id() RETURNS text
LANGUAGE sql STABLE AS $$
  SELECT nullif(current_setting('flowday.user_id', true), '')
$$;

CREATE OR REPLACE FUNCTION flowday_is_superadmin() RETURNS boolean
LANGUAGE sql STABLE AS $$
  SELECT coalesce(current_setting('flowday.is_superadmin', true), 'false') = 'true'
$$;

DROP POLICY IF EXISTS app_data_owner_policy ON app_data;
CREATE POLICY app_data_owner_policy ON app_data
  USING (user_id = flowday_user_id() OR flowday_is_superadmin())
  WITH CHECK (user_id = flowday_user_id() OR flowday_is_superadmin());

CREATE INDEX IF NOT EXISTS app_data_updated_at_idx ON app_data(updated_at DESC);
CREATE INDEX IF NOT EXISTS users_role_idx ON users(role);

-- The server API must set these claims with SET LOCAL after verifying the
-- signed session, for every request:
--   SET LOCAL flowday.user_id = '<verified user id>';
--   SET LOCAL flowday.is_superadmin = 'true|false';
-- Never trust userId, role, or permissions from request JSON.
