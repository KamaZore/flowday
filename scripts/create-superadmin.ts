/**
 * One-off: create (or promote) a super admin account.
 *
 *   bun scripts/create-superadmin.ts <email> <password>
 *
 * Uses the same Neon database and bcrypt hashing as the app. If the email
 * already exists, its role is set to superadmin and the password is reset.
 */
import { neon } from "@neondatabase/serverless";
import bcrypt from "bcryptjs";

const email = process.argv[2]?.trim().toLowerCase();
const password = process.argv[3];

if (!email || !password || password.length < 6) {
  console.error("usage: bun scripts/create-superadmin.ts <email> <password(min 6 chars)>");
  process.exit(1);
}

const url = process.env.VITE_NEON_DATABASE_URL;
if (!url) {
  console.error("VITE_NEON_DATABASE_URL not found in environment (.env)");
  process.exit(1);
}

const sql = neon(url);

const hash = await bcrypt.hash(password, 10);

// Make sure the columns exist (matches the app's ensureSchema migration)
await sql`ALTER TABLE users ADD COLUMN IF NOT EXISTS role TEXT NOT NULL DEFAULT 'user'`;
await sql`ALTER TABLE users ADD COLUMN IF NOT EXISTS permissions JSONB`;

const perms = JSON.stringify({ life: true, expense: true, business: true, admin: true });

const existing = await sql`SELECT id FROM users WHERE email = ${email} LIMIT 1`;
if (existing.length > 0) {
  await sql`
    UPDATE users
    SET role = 'superadmin', password_hash = ${hash}, permissions = ${perms}::jsonb
    WHERE email = ${email}
  `;
  console.log(`updated existing account → superadmin: ${email}`);
} else {
  const id = Date.now().toString(36) + Math.random().toString(36).slice(2, 8) + Date.now().toString(36);
  await sql`
    INSERT INTO users (id, name, email, password_hash, role, permissions)
    VALUES (${id}, 'Super Admin', ${email}, ${hash}, 'superadmin', ${perms}::jsonb)
  `;
  console.log(`created superadmin: ${email}`);
}

const check = await sql`SELECT email, role FROM users WHERE email = ${email}`;
console.log("verify:", check[0]);
