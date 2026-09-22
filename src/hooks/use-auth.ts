import { useClerk, useUser } from "@clerk/clerk-react";

/**
 * Auth hook with the same app-facing shape the app already consumes
 * (isLoading / isAuthenticated / user / signOut), backed by Clerk.
 *
 * `signIn`/`signUp` are not exposed here: Clerk's <SignIn/> / <SignUp/>
 * components on /auth and /register handle those flows in the UI.
 *
 * user shape: { _id, email, name } — a normalized view of the Clerk user.
 */
export function useAuth() {
  const { isLoaded, isSignedIn, user: clerkUser } = useUser();
  const { signOut } = useClerk();

  const user = clerkUser
    ? {
        _id: clerkUser.id,
        email:
          clerkUser.primaryEmailAddress?.emailAddress ?? clerkUser.id,
        name:
          clerkUser.fullName ??
          clerkUser.username ??
          clerkUser.primaryEmailAddress?.emailAddress ??
          "",
      }
    : null;

  return {
    isLoading: !isLoaded,
    isAuthenticated: !!isSignedIn,
    user,
    signOut: async () => {
      await signOut({ redirectUrl: "/" });
    },
  };
}
