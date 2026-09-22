import { useAuthActions, useConvexAuth } from "@convex-dev/auth/react";
import { useQuery } from "convex/react";
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
 * bilingual message. Convex Auth throws plain Errors like
 * "Invalid credentials" (wrong email/password) or an "already exists"-style
 * message when registering a duplicate email.
 */
export type AuthErrorKind = "invalid" | "exists" | "generic";

export function classifyAuthError(err: unknown): AuthErrorKind {
  const msg = err instanceof Error ? err.message : String(err);
  if (/invalid credentials/i.test(msg)) return "invalid";
  if (/exist|already/i.test(msg)) return "exists";
  return "generic";
}
