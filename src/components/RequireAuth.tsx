import { useAuth } from "@/hooks/use-auth";
import { type ReactNode, useEffect, useState } from "react";
import { Navigate, useLocation } from "react-router";
import { IosSpinner } from "@/components/ui/IosSpinner";

/**
 * If the auth backend is unreachable (e.g. the installed PWA opened offline),
 * don't hang forever — fall through so the user can reach the sign-in page
 * (which will show a clear error) instead of a frozen spinner.
 */
const AUTH_TIMEOUT_MS = 6000;

export function RequireAuth({ children }: { children: ReactNode }) {
  const { isLoading, isAuthenticated } = useAuth();
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
        <IosSpinner />
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

  return children;
}
