/**
 * flowday-turnstile-verify — Cloudflare Worker
 *
 * Proxies Turnstile tokens to Cloudflare's siteverify API. Holds the SECRET
 * key server-side (never exposed to the browser) so auth forms on the static
 * site get real, server-side human verification.
 *
 * Endpoints:
 *   POST /          { token: string }  → { success: boolean }
 *   GET  /health    —                  → { ok: true }
 *
 * Deploy:
 *   cd workers/turnstile-verify
 *   npx wrangler login
 *   npx wrangler secret put TURNSTILE_SECRET_KEY
 *   npx wrangler deploy
 */
export interface Env {
  TURNSTILE_SECRET_KEY: string;
}

const SITEVERIFY_URL = "https://challenges.cloudflare.com/turnstile/v0/siteverify";

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
};

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);

    if (request.method === "OPTIONS") return new Response(null, { status: 204, headers: CORS });

    if (request.method === "GET" && url.pathname === "/health") {
      return new Response(JSON.stringify({ ok: true }), {
        headers: { "Content-Type": "application/json", ...CORS },
      });
    }

    if (request.method !== "POST" || url.pathname !== "/") {
      return new Response(JSON.stringify({ success: false, error: "not_found" }), {
        status: 404,
        headers: { "Content-Type": "application/json", ...CORS },
      });
    }

    let token = "";
    try {
      const body = (await request.json()) as { token?: unknown };
      if (typeof body.token === "string") token = body.token;
    } catch {
      // fallthrough — token stays empty and siteverify will reject it
    }

    if (!token) {
      return new Response(JSON.stringify({ success: false, error: "missing_token" }), {
        status: 400,
        headers: { "Content-Type": "application/json", ...CORS },
      });
    }

    const form = new FormData();
    form.append("secret", env.TURNSTILE_SECRET_KEY);
    form.append("response", token);

    try {
      const upstream = await fetch(SITEVERIFY_URL, { method: "POST", body: form });
      const result = (await upstream.json()) as {
        success: boolean;
        "error-codes"?: string[];
      };
      return new Response(
        JSON.stringify({ success: result.success === true, errors: result["error-codes"] ?? [] }),
        { headers: { "Content-Type": "application/json", ...CORS } },
      );
    } catch {
      return new Response(JSON.stringify({ success: false, error: "upstream_error" }), {
        status: 502,
        headers: { "Content-Type": "application/json", ...CORS },
      });
    }
  },
};
