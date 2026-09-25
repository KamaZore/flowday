/**
 * Server-side Turnstile token verification.
 *
 * When VITE_TURNSTILE_VERIFY_URL is set (the flowday-turnstile-verify Worker),
 * auth requests POST the widget token there; the Worker holds the SECRET key
 * and calls Cloudflare's siteverify API. Tokens that fail verification are
 * rejected before any database call happens.
 *
 * With no verifier URL configured, verification is widget-only (client side)
 * and auth proceeds as before — the app never hard-breaks on missing config.
 */
const VERIFY_URL = import.meta.env.VITE_TURNSTILE_VERIFY_URL as string | undefined;

export async function verifyTurnstileToken(
  token: string | null | undefined,
): Promise<boolean> {
  if (!VERIFY_URL) return true; // verifier not configured → client-side only
  if (!token) return false;
  try {
    const res = await fetch(VERIFY_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token }),
    });
    if (!res.ok) return false;
    const data = (await res.json()) as { success?: boolean };
    return data.success === true;
  } catch {
    return false;
  }
}
