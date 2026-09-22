import { useAuthActions } from "@convex-dev/auth/react";
import { Eye, EyeOff, Loader2 } from "lucide-react";
import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { classifyAuthError, useAuth } from "@/hooks/use-auth";
import { useI18n } from "@/lib/i18n";

function resolveRedirect(returnTo: string | null, fallback = "/today") {
  if (returnTo?.startsWith("/") && !returnTo.startsWith("//")) return returnTo;
  return fallback;
}

/**
 * Login page — email + password against the app's own database (Convex Auth).
 * New visitors can jump to /register to create an account.
 */
function AuthInner() {
  const { t } = useI18n();
  const { isAuthenticated, isLoading } = useAuth();
  const { signIn } = useAuthActions();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const returnTo = searchParams.get("returnTo");
  const redirect = resolveRedirect(returnTo);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Already signed in (e.g. revisiting /auth) → straight to the app.
  useEffect(() => {
    if (!isLoading && isAuthenticated) navigate(redirect, { replace: true });
  }, [isLoading, isAuthenticated, navigate, redirect]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (busy) return;
    setError(null);
    setBusy(true);
    try {
      const res = (await signIn("password", {
        email: email.trim(),
        password,
        flow: "signIn",
      })) as { signedIn?: boolean } | null | undefined;
      if (res && typeof res === "object" && res.signedIn === false) {
        setError(t("auth.errGeneric"));
        return;
      }
      // Auth state flip navigates via the effect above.
    } catch (err) {
      const kind = classifyAuthError(err);
      setError(kind === "invalid" ? t("auth.errInvalid") : t("auth.errGeneric"));
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="safe-top safe-bottom relative flex min-h-dvh flex-col items-center justify-center overflow-hidden px-4 py-10">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0 h-72 bg-primary/10 blur-3xl"
      />
      <button
        onClick={() => navigate("/")}
        className="relative mb-6 flex items-center gap-2"
      >
        <svg viewBox="0 0 512 512" className="size-10 text-primary" aria-hidden>
          <rect width="512" height="512" rx="112" fill="currentColor" />
          <path d="M150 176 L236 256 L150 336" stroke="#fff" strokeWidth="46" strokeLinecap="round" strokeLinejoin="round" fill="none" opacity="0.55" />
          <path d="M250 176 L336 256 L250 336" stroke="#fff" strokeWidth="46" strokeLinecap="round" strokeLinejoin="round" fill="none" opacity="0.8" />
          <path d="M350 176 L436 256 L350 336" stroke="#fff" strokeWidth="46" strokeLinecap="round" strokeLinejoin="round" fill="none" />
        </svg>
        <span className="text-xl font-bold">Flowday</span>
      </button>

      <div className="card-soft relative w-full max-w-sm rounded-3xl border border-border/70 bg-card p-6">
        <h1 className="text-xl font-bold tracking-tight">{t("auth.title")}</h1>
        <form onSubmit={handleSubmit} className="mt-5 space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="email">{t("auth.email")}</Label>
            <Input
              id="email"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder={t("auth.emailPlaceholder")}
              className="h-10 rounded-xl"
              autoComplete="email"
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="password">{t("auth.password")}</Label>
            <div className="relative">
              <Input
                id="password"
                type={showPw ? "text" : "password"}
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="h-10 rounded-xl pr-10"
                autoComplete="current-password"
              />
              <button
                type="button"
                onClick={() => setShowPw((v) => !v)}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground transition-colors hover:text-foreground"
                aria-label={showPw ? "Hide password" : "Show password"}
                tabIndex={-1}
              >
                {showPw ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
              </button>
            </div>
          </div>

          {error && (
            <p className="rounded-xl bg-destructive/10 px-3 py-2 text-xs font-medium text-destructive">
              {error}
            </p>
          )}

          <Button type="submit" className="h-10 w-full rounded-xl" disabled={busy}>
            {busy ? (
              <>
                <Loader2 className="size-4 animate-spin" />
                {t("auth.signingIn")}
              </>
            ) : (
              t("auth.signInBtn")
            )}
          </Button>
        </form>

        <p className="mt-4 text-center text-sm text-muted-foreground">
          {t("auth.noAccount")}{" "}
          <button
            onClick={() =>
              navigate(
                returnTo
                  ? `/register?returnTo=${encodeURIComponent(returnTo)}`
                  : "/register",
              )
            }
            className="font-semibold text-primary hover:underline"
          >
            {t("auth.goRegister")}
          </button>
        </p>
      </div>

      <p className="relative mt-4 text-center text-xs text-muted-foreground">
        {t("auth.localNote")}
      </p>
    </div>
  );
}

export default function AuthPage() {
  return <AuthInner />;
}
