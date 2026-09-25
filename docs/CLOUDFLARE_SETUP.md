# Cloudflare Setup — flowday.com

Two independent things Cloudflare provides for Flowday:

1. **DNS / custom domain** — serve the site at `https://flowday.com` instead of `kamazore.github.io/my-life-flow`
2. **Turnstile** — bot protection on login / registration (already wired in code)

---

## Part 1 — Fix "Invalid nameservers" and point flowday.com at GitHub Pages

Your Cloudflare dashboard shows **Invalid nameservers** because your registrar
(currently `ns1.adman.com` / `ns2.adman.com`) has not been switched over yet.
Nameserver changes take 5 minutes – 24 h to propagate (Cloudflare re-checks
automatically every few hours; you can also click **Check nameservers now**).

### Step 1 — Change nameservers at your registrar

1. Log into the account where you bought `flowday.com` (ICANN Lookup →
   https://lookup.icann.org shows your registrar if unsure).
2. Open the domain's **DNS / Nameservers** settings.
3. Replace the existing nameservers with the two Cloudflare assigned you:

   - `adrian.ns.cloudflare.com`
   - `denver.ns.cloudflare.com`

4. Delete the old ones (`ns1.adman.com`, `ns2.adman.com`) and save.
5. Back in Cloudflare: **flowday.com → Check nameservers now**. Status flips to
   **Active** when done.

### Step 2 — Add the DNS records in Cloudflare (once Active)

Cloudflare → flowday.com → **DNS → Records**. Add:

| Type  | Name | Content                            | Proxy                |
| ----- | ---- | ---------------------------------- | -------------------- |
| A     | `@`  | `185.199.108.153`                  | Proxied (orange ☁️)  |
| A     | `@`  | `185.199.109.153`                  | Proxied (orange ☁️)  |
| A     | `@`  | `185.199.110.153`                  | Proxied (orange ☁️)  |
| A     | `@`  | `185.199.111.153`                  | Proxied (orange ☁️)  |
| CNAME | `www` | `kamazore.github.io`              | Proxied (orange ☁️)  |

> The four A records are GitHub Pages' apex-domain IPs.
> **Note:** with the orange-cloud proxy on, Cloudflare hides GitHub behind its
> own IPs — HTTPS still works because Cloudflare terminates TLS.

### Step 3 — Add the custom domain in GitHub

1. Repo **KamaZore/my-life-flow → Settings → Pages**.
2. Under **Custom domain**, enter `flowday.com` → **Save**.
3. Wait for the DNS check ✓ (this repo ships a `public/CNAME` file containing
   `flowday.com`, so the setting survives every deploy).
4. Once verified, enable **Enforce HTTPS**.

### Step 4 — Done

- https://flowday.com → Flowday
- https://www.flowday.com → Flowday (redirects/apex per DNS)
- `kamazore.github.io/my-life-flow/` keeps working too.
- Only hash-router URLs change form (`flowday.com/#/life/today` — same as now,
  shorter host).

---

## Part 2 — Turnstile (bot protection on login/register)

The widget is already integrated:

- `src/components/app/Turnstile.tsx` — invisible widget wrapper. Renders
  nothing until a site key is configured, so the app never breaks without it.
- `src/pages/Auth.tsx` / `src/pages/Register.tsx` — blocks submit until a
  human-verification token exists.
- `.github/workflows/deploy.yml` — injects `VITE_TURNSTILE_SITE_KEY` at build.

> **Honest limitation:** GitHub Pages is static — there is no server to call
> Cloudflare's `siteverify` API. The token is verified client-side by the
> widget itself, which stops naive scripted signups but not a determined
> attacker who bypasses the browser. For real enforcement, run a tiny
> Cloudflare Worker (`flowday.com/api/verify-turnstile`) that POSTs the token +
> `TURNSTILE_SECRET_KEY` to `https://challenges.cloudflare.com/turnstile/v0/siteverify`,
> then verify inside `signIn`/`signUp` (in `src/hooks/use-auth.tsx`) before
> hitting Neon. Ask and it can be added.

### Activate it (5 minutes)

1. Cloudflare dashboard → **Turnstile** → **Add site**.
2. Domain: `flowday.com` (add `kamazore.github.io` + `localhost` too for dev).
3. Widget mode: **Invisible** (matches the code). Copy the **Site Key**.
4. Add the secret to GitHub: repo **Settings → Secrets and variables →
   Actions → New repository secret**
   - Name: `VITE_TURNSTILE_SITE_KEY`
   - Value: *(the site key — this one is public by design, safe to embed)*
5. Keep the **Secret Key** private in your Cloudflare account (only needed if
   you later add the Worker verification above).
6. Push to `main` — the next Pages build bakes the key in and the widget goes
   live on /auth and /register.

### Local development

```bash
# .env.local (never committed)
VITE_TURNSTILE_SITE_KEY=0x4AAAAAAA_xxxxxxxx
```

---

## Security status after this setup

| Layer                          | Status                                        |
| ------------------------------ | --------------------------------------------- |
| Password storage               | bcrypt (10 rounds) in Neon Postgres           |
| Transport                      | HTTPS via Cloudflare + GitHub Pages           |
| Bot protection on auth forms   | Turnstile invisible widget (client-side)      |
| WAF / DDoS / cache             | Cloudflare proxy on flowday.com               |
| Server-side token verification | Needs a Worker (documented above)             |
