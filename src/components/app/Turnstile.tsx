import { Turnstile, type TurnstileInstance } from "@marsidev/react-turnstile";
import { useRef } from "react";

/**
 * Cloudflare Turnstile bot-protection widget (invisible mode).
 *
 * Behavior:
 * - No site key configured → renders nothing; forms submit as before.
 *   (App never breaks because of a missing/incorrect key.)
 * - Site key configured → widget renders in the form and the human-verified
 *   token is exposed via onToken. The app then forwards the token to
 *   siteverify for real server-side enforcement.
 *
 * Key is read from VITE_TURNSTILE_SITE_KEY (set via GitHub Actions secrets /
 * .env — see docs/CLOUDFLARE_SETUP.md).
 */
const SITE_KEY = import.meta.env.VITE_TURNSTILE_SITE_KEY as string | undefined;

export function turnstileEnabled(): boolean {
  return Boolean(SITE_KEY);
}

export { TurnstileInstance };

interface TurnstileWidgetProps {
  /** Called when Cloudflare issues a fresh human-verification token. */
  onToken: (token: string) => void;
  /** Called when the widget expires and the user must re-verify. */
  onExpire?: () => void;
}

export function TurnstileWidget({ onToken, onExpire }: TurnstileWidgetProps) {
  const ref = useRef<TurnstileInstance>(undefined);

  if (!SITE_KEY) return null;

  return (
    <Turnstile
      ref={ref}
      siteKey={SITE_KEY}
      options={{ size: "invisible", appearance: "interaction-only" }}
      onSuccess={onToken}
      onExpire={onExpire}
    />
  );
}
