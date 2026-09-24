import { useAuth } from "@/hooks/use-auth";
import { Loader2, ShieldOff } from "lucide-react";
import { type ReactNode, useEffect, useState } from "react";
import { Navigate, useLocation } from "react-router";
import { useI18n } from "@/lib/i18n";

/**
 * If the auth backend is unreachable (e.g. the installed PWA opened offline),
 * don't hang forever — fall through so the user can reach the sign-in page
 * (which will show a clear error) instead of a frozen spinner.
 */
const AUTH_TIMEOUT_MS = 6000;

/**
 * Wraps a system route: requires sign-in AND the per-system permission.
 * Users without access see a friendly denied screen (their other systems
 * stay reachable) — the nav simply never shows them forbidden systems.
 */
export function RequireSystem({
  system,
  children,
}: {
  system: "life" | "expense" | "business" | "admin";
  children: ReactNode;
}) {
  const { isLoading, isAuthenticated, can } = useAuth();
  const { t } = useI18n();
  const location = useLocation();
  const [timedOut, setTimedOut] = useState(false);

  useEffect(() => {
    if (!isLoading) return;
    const id = setTimeout(() => setTimedOut(true), AUTH_TIMEOUT_MS);
    return () => clearTimeout(id);
  }, [isLoading]);

  if (isLoading && !timedOut) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-background">
        <Loader2 className="size-6 animate-spin text-muted-foreground" />
      </main>
    );
  }

  if (!isAuthenticated) {
    const returnTo = `${location.pathname}${location.search}`;
    return (
      <Navigate
        to={`/auth?returnTo=${encodeURIComponent(returnTo)}`}
        replace
      />
    );
  }

  if (!can(system)) {
    return (
      <main className="flex min-h-dvh flex-col items-center justify-center gap-3 bg-background p-6 text-center">
        <span className="flex size-14 items-center justify-center rounded-2xl bg-amber-500/12 text-amber-600 dark:text-amber-400">
          <ShieldOff className="size-7" />
        </span>
        <h1 className="text-lg font-bold">{t("perm.deniedTitle")}</h1>
        <p className="max-w-xs text-sm text-muted-foreground">
          {t("perm.deniedSub")}
        </p>
      </main>
    );
  }

  return children;
}
