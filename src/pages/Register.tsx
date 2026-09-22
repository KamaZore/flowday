import { SignUp, useUser } from "@clerk/clerk-react";
import { useI18n } from "@/lib/i18n";
import { useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router";

function resolveRedirect(returnTo: string | null, fallback = "/today") {
  if (returnTo?.startsWith("/") && !returnTo.startsWith("//")) return returnTo;
  return fallback;
}

/**
 * Register page — creates a new Clerk account. Each account gets its own
 * isolated data table on this device (see UserStoreBridge in main.tsx).
 */
function RegisterInner() {
  const { t } = useI18n();
  const { isSignedIn, isLoaded } = useUser();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const redirect = resolveRedirect(searchParams.get("returnTo"));

  useEffect(() => {
    if (isLoaded && isSignedIn) navigate(redirect, { replace: true });
  }, [isLoaded, isSignedIn, navigate, redirect]);

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

      <div className="w-full max-w-sm">
        <SignUp
          signInUrl="/auth"
          fallbackRedirectUrl={redirect}
          appearance={{
            variables: {
              colorPrimary: "#4f46e5",
              colorBackground: "transparent",
              borderRadius: "0.875rem",
            },
            elements: {
              card: "shadow-none bg-transparent",
            },
          }}
        />
        <p className="mt-4 text-center text-sm text-muted-foreground">
          {t("auth.haveAccount")}{" "}
          <button
            onClick={() =>
              navigate(
                searchParams.get("returnTo")
                  ? `/auth?returnTo=${encodeURIComponent(searchParams.get("returnTo")!)}`
                  : "/auth",
              )
            }
            className="font-semibold text-primary hover:underline"
          >
            {t("auth.goSignin")}
          </button>
        </p>
        <p className="mt-2 text-center text-xs text-muted-foreground">
          {t("auth.localNote")}
        </p>
      </div>
    </div>
  );
}

export default function RegisterPage() {
  return <RegisterInner />;
}
