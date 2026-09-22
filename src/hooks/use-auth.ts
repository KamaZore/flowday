import { useAuthActions } from "@convex-dev/auth/react";
import { useConvexAuth, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";

/**
 * Auth hook with the same app-facing shape the app already consumes
 * (isLoading / isAuthenticated / user / signOut), backed by Convex Auth —
 * email + password accounts stored in the project's own database.
 *
 * `signIn` is not exposed here: the /auth and /register pages call
 * `useAuthActions().signIn("password", …)` directly in their forms.
 *
 * user shape: { _id, email, name } — a normalized view of the users table row.
 */
export function useAuth() {
  const { isLoading, isAuthenticated } = useConvexAuth();
  // Returns null when signed out, undefined while the query is in flight.
  const userDoc = useQuery(api.users.currentUser);
  const { signOut } = useAuthActions();

  const user =
    isAuthenticated && userDoc
      ? {
          _id: userDoc._id,
          email: userDoc.email ?? "",
          name: userDoc.name ?? "",
        }
      : null;

  return {
    isLoading: isLoading || (isAuthenticated && userDoc === undefined),
    isAuthenticated,
    user,
    signOut: async () => {
      await signOut();
      // Full navigation resets all local state (store bridge, query cache).
      window.location.assign("/");
    },
  };
}

/**
 * Map a Convex Auth error to a UI-facing kind so pages can show the right
 * bilingual message. Verified against the real backend:
 *   - wrong password  → throws "InvalidSecret"
 *   - unknown email   → throws "InvalidAccountId"
 *   - duplicate email → signUp silently succeeds, so the register page
 *     pre-checks via the accountCheck.exists query instead.
 */
export type AuthErrorKind = "invalid" | "exists" | "generic";

export function classifyAuthError(err: unknown): AuthErrorKind {
  const msg = err instanceof Error ? err.message : String(err);
  if (/InvalidSecret|InvalidAccountId|invalid credentials/i.test(msg)) {
    return "invalid";
  }
  if (/exist|already/i.test(msg)) return "exists";
  return "generic";
}
