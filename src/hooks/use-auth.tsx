import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import bcrypt from "bcryptjs";
import {
  createUser,
  findUserByEmail,
  getUserHash,
} from "@/lib/db";
import {
  readSession,
  uid,
  writeSession,
} from "@/lib/store";

/**
 * Auth backend backed by the app's own Neon Postgres `users` table
 * (bcrypt-hashed passwords). The session token in localStorage authorizes
 * the signed-in user's data sync; sessions live entirely client-side.
 */

export type AppUser = { _id: string; email: string; name: string };

export type AuthContextValue = {
  isLoading: boolean;
  isAuthenticated: boolean;
  user: AppUser | null;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (name: string, email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<ReturnType<typeof readSession>>(readSession);
  const [isLoading, setIsLoading] = useState(false);

  const isAuthenticated = Boolean(session);

  const signIn = useCallback(async (email: string, password: string) => {
    setIsLoading(true);
    try {
      const normalized = email.trim().toLowerCase();
      const user = await findUserByEmail(normalized);
      if (!user) throw new Error("invalid");
      const hash = await getUserHash(normalized);
      const ok = hash && (await bcrypt.compare(password, hash));
      if (!ok) throw new Error("invalid");
      const next = {
        token: uid() + uid(),
        userId: user.id,
        email: user.email,
        name: user.name,
      };
      writeSession(next);
      setSession(next);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const signUp = useCallback(
    async (name: string, email: string, password: string) => {
      setIsLoading(true);
      try {
        const normalized = email.trim().toLowerCase();
        const existing = await findUserByEmail(normalized);
        if (existing) throw new Error("exists");
        const hash = await bcrypt.hash(password, 10);
        const created = await createUser(
          uid() + uid(),
          name.trim(),
          normalized,
          hash,
        );
        const next = {
          token: uid() + uid(),
          userId: created.id,
          email: created.email,
          name: created.name,
        };
        writeSession(next);
        setSession(next);
      } finally {
        setIsLoading(false);
      }
    },
    [],
  );

  const signOut = useCallback(async () => {
    writeSession(null);
    setSession(null);
    // Reload at the app's base path. BASE_URL is "./" on GitHub Pages
    // (resolves to /my-life-flow/) and "/" in local dev, so signing out
    // never escapes the app's subpath (a bare "/" lands on GitHub's 404).
    window.location.assign(import.meta.env.BASE_URL);
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      isLoading,
      isAuthenticated,
      user: session
        ? { _id: session.userId, email: session.email, name: session.name }
        : null,
      signIn,
      signUp,
      signOut,
    }),
    [isLoading, isAuthenticated, session, signIn, signUp, signOut],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside <AuthProvider>");
  return ctx;
}
