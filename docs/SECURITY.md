# Flowday security and multi-user deployment

## What this repository can guarantee today

The client store scopes local data to `flowday-data-v1:u:<userId>` and only calls
`getAppData` / `saveAppData` with the signed-in user's id. The UI also enforces
route and system permissions. These checks prevent normal application usage from
mixing accounts.

## Important limitation

Flowday is a static GitHub Pages app. If `VITE_NEON_DATABASE_URL` is present in
the browser bundle, the URL is public and the browser can execute arbitrary SQL
against the Neon role. Frontend guards cannot prevent a user from changing a
request or opening the Neon console. Therefore the current static deployment
must **not** be treated as a secure backend.

Before accepting private or business data, move the data/auth calls behind a
server or edge function. Keep the private Neon URL only in that service.

## Required server contract

The server must:

1. Verify the signed session (HttpOnly, Secure, SameSite cookie or a server
   signed token). Never trust `userId`, `role`, or `permissions` in request JSON.
2. Run `scripts/security-migration.sql` once in Neon.
3. For every request, set transaction-local claims before querying:
   - `SET LOCAL flowday.user_id = '<verified user id>';`
   - `SET LOCAL flowday.is_superadmin = 'true|false';`
4. Expose narrow operations such as `GET/PUT /api/me/data` and admin-only
   `GET /api/admin/users`, `PATCH /api/admin/users/:id`, and config operations.
5. Check role/permissions on the server for every admin operation. The Super
   Admin panel is useful UI, not an authorization boundary.
6. Keep the private Neon credential out of Vite variables and GitHub Pages
   secrets. Remove `VITE_NEON_DATABASE_URL` from the public client after the
   proxy is live.

The included RLS migration is a defense-in-depth layer. It is not a substitute
for the proxy, because a public database role can otherwise bypass application
intentions.
