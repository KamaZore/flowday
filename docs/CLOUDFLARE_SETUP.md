# Cloudflare Setup — flowdaykh.com

This project integrates Cloudflare in three layers:

1. **DNS + CDN/WAF** — `https://flowdaykh.com` served from GitHub Pages behind Cloudflare
2. **Turnstile** — invisible bot protection on `/auth` and `/register`
3. **Verify Worker** — server-side token verification (real enforcement, secret key never in the browser)

All frontend code is already wired (`Turnstile.tsx`, `turnstile-verify.ts`,
`use-auth.tsx`, deploy workflow). What remains is dashboard/account setup.

---

## Part 1 — DNS: point flowday.com at GitHub Pages

### 1.1 Fix "Invalid nameservers"

At your registrar, replace the current nameservers with the two
Cloudflare nameservers shown on the zone's Overview page
(e.g. `dante.ns.cloudflare.com`, `elisa.ns.cloudflare.com` — use exactly the
pair Cloudflare assigns). Cloudflare status flips to **Active** within
5 min – 24 h (**Check nameservers now**).

### 1.2 DNS records (once Active)

| Type | Name | Content | Proxy |
|------|------|---------|-------|
| A | `@` | `185.199.108.153` | DNS only first |
| A | `@` | `185.199.109.153` | DNS only first |
| A | `@` | `185.199.110.153` | DNS only first |
| A | `@` | `185.199.111.153` | DNS only first |
| CNAME | `www` | `kamazore.github.io` | DNS only first |

Grey cloud first so GitHub can verify the domain and issue its certificate.

### 1.3 GitHub Pages

Repo **Settings → Pages → Custom domain** → `flowdaykh.com` → Save
(the repo already contains `public/CNAME`). When the ✓ appears, enable
**Enforce HTTPS**. Confirm `https://flowdaykh.com` loads the app.

### 1.4 Security settings

| Where | Setting | Value |
|---|---|---|
| SSL/TLS → Overview | Encryption mode | **Full** |
| SSL/TLS → Edge Certificates | Always Use HTTPS | **ON** |
| Security → Bots | Bot Fight Mode | **ON** |
| Security → WAF | Cloudflare Free Managed Ruleset | **ON** |
| DNS | Switch all 5 records | **Proxied (orange)** |

---

## Part 2 — Turnstile keys

1. Dashboard → **Turnstile → Add site**
2. Domains: `flowdaykh.com`, `kamazore.github.io`, `localhost`
3. Widget type: **Invisible** (matches the code)
4. You get two keys — they go to different places:

| Key | Where it goes |
|-----|---------------|
| **Site Key** (public by design) | Project **Keys/API keys tab** as `VITE_TURNSTILE_SITE_KEY` — and/or GitHub Actions secret of the same name so Pages builds bake it in |
| **Secret Key** (must stay server-side) | The Worker only (step 3.2). Never in `VITE_*` vars, never in the repo |

After adding the site key, `/auth` and `/register` show the invisible widget
and block submit until a human token exists.

---

## Part 3 — Verify Worker (server-side enforcement)

### 3.1 Deploy

```bash
cd workers/turnstile-verify
npm install
npx wrangler login
npx wrangler secret put TURNSTILE_SECRET_KEY   # paste the Turnstile SECRET key
npx wrangler deploy
```

Wrangler prints the URL:
`https://flowday-turnstile-verify.<account>.workers.dev`

Sanity check: `curl https://flowday-turnstile-verify.<account>.workers.dev/health`
→ `{"ok":true}`

Optional (after flowdaykh.com is proxied): uncomment the `routes` block in
`wrangler.toml` and redeploy to serve it at
`https://flowday.com/api/verify-turnstile`.

### 3.2 Connect the app

Project **Keys/API keys tab** → add:

| Key | Value |
|-----|-------|
| `VITE_TURNSTILE_VERIFY_URL` | the Worker URL from 3.1 |

When set, `signIn`/`signUp` POST the widget token to the Worker; failed
tokens are rejected **before** touching the database. When unset, the app
falls back to widget-only verification and never breaks.

### 3.3 How verification flows

```
Browser: Turnstile widget issues token (tsToken)
  → signIn/signUp(..., tsToken)
  → verifyTurnstileToken()  POST { token } → Worker
  → Worker: siteverify(secret, token)      [secret stays here]
  → success:true → continue to bcrypt + Neon
  → success:false → "Verification failed" error, DB untouched
```

---

## Keys/API keys tab — exact entries

| Name | Value | Notes |
|------|-------|-------|
| `VITE_TURNSTILE_SITE_KEY` | Turnstile **Site Key** (`0x4AAA…`) | Public widget key; also add as GitHub Actions secret for production builds |
| `VITE_TURNSTILE_VERIFY_URL` | `https://flowday-turnstile-verify.<account>.workers.dev` | Only after deploying the Worker (Part 3) |
| `TURNSTILE_SECRET_KEY` | *(not in this tab)* | Set via `wrangler secret put` — Worker-side only |

Note: `CLOUDFLARE_API_TOKEN` / `CLOUDFLARE_ZONE_ID` (account-level API keys)
are **not** needed by this app — DNS/security are configured in the
dashboard, and the Worker only holds the Turnstile secret.
