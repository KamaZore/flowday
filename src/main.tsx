import { Toaster } from "@/components/ui/sonner";
import { RequireAuth } from "@/components/RequireAuth";
import { AuthProvider } from "@/hooks/use-auth";
import React, { StrictMode, useEffect, lazy, Suspense } from "react";
import { createRoot } from "react-dom/client";
import {
  createHashRouter,
  RouterProvider,
} from "react-router";
import { I18nProvider } from "@/lib/i18n";
import { initOnlineSync, switchUser } from "@/lib/store";
import { useAuth } from "@/hooks/use-auth";
import "./index.css";

// Lazy load route components for better code splitting
const Landing = lazy(() => import("./pages/Landing.tsx"));
const AuthPage = lazy(() => import("./pages/Auth.tsx"));
const RegisterPage = lazy(() => import("./pages/Register.tsx"));
const NotFound = lazy(() => import("./pages/NotFound.tsx"));
const Today = lazy(() => import("./pages/Today.tsx"));
const InboxPage = lazy(() => import("./pages/Inbox.tsx"));
const Tasks = lazy(() => import("./pages/Tasks.tsx"));
const Projects = lazy(() => import("./pages/Projects.tsx"));
const Processes = lazy(() => import("./pages/Processes.tsx"));
const CalendarPage = lazy(() => import("./pages/Calendar.tsx"));
const Habits = lazy(() => import("./pages/Habits.tsx"));
const Goals = lazy(() => import("./pages/Goals.tsx"));
const Progress = lazy(() => import("./pages/Progress.tsx"));
const Settings = lazy(() => import("./pages/Settings.tsx"));

// Simple loading fallback for route transitions
function RouteLoading() {
  return (
    <div className="flex min-h-dvh items-center justify-center">
      <div className="animate-pulse text-muted-foreground">Loading…</div>
    </div>
  );
}

/** Hard guard so runtime errors never leave the preview as a blank page. */
class RootErrorBoundary extends React.Component<
  { children: React.ReactNode },
  { hasError: boolean; message: string; stack: string }
> {
  state = { hasError: false, message: "", stack: "" };
  static getDerivedStateFromError(error: Error) {
    return {
      hasError: true,
      message: error.message || "Unknown runtime error",
      stack: error.stack || "",
    };
  }
  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-background text-foreground p-6">
          <div className="max-w-lg text-center">
            <p className="text-sm font-semibold">Preview runtime error</p>
            <p className="mt-2 text-xs text-muted-foreground break-words">
              {this.state.message}
            </p>
            {this.state.stack && (
              <pre className="mt-3 text-left text-[10px] leading-4 text-muted-foreground/80 max-h-40 overflow-auto rounded border border-border/60 p-2">
                {this.state.stack}
              </pre>
            )}
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

/**
 * Bridges auth state to the local store: each signed-in account gets its own
 * isolated dataset (its own "table") via switchUser(). Signing out returns
 * the app to the shared signed-out dataset. Data also syncs to the Neon
 * Postgres `app_data` table per user (see lib/store.ts).
 */
function UserStoreBridge() {
  const { isLoading, isAuthenticated, user } = useAuth();
  // Key on the stable user id (not the user object, whose identity changes
  // every render) so the store only swaps when the account actually changes.
  const userId = user?._id ?? null;
  useEffect(() => {
    if (isLoading) return;
    if (isAuthenticated && userId) {
      switchUser(userId);
    } else if (!isAuthenticated) {
      switchUser(null);
    }
  }, [isLoading, isAuthenticated, userId]);
  return null;
}

/** App pages share the AppLayout (sidebar / bottom nav / quick add). */
function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<Landing />} />
      <Route path="/auth" element={<AuthPage />} />
      <Route path="/register" element={<RegisterPage />} />
      <Route
        path="/today"
        element={
          <RequireAuth>
            <AppLayoutMount view="today" />
          </RequireAuth>
        }
      />
      <Route
        path="/inbox"
        element={
          <RequireAuth>
            <AppLayoutMount view="inbox" />
          </RequireAuth>
        }
      />
      <Route
        path="/tasks"
        element={
          <RequireAuth>
            <AppLayoutMount view="tasks" />
          </RequireAuth>
        }
      />
      <Route
        path="/projects"
        element={
          <RequireAuth>
            <AppLayoutMount view="projects" />
          </RequireAuth>
        }
      />
      <Route
        path="/processes"
        element={
          <RequireAuth>
            <AppLayoutMount view="processes" />
          </RequireAuth>
        }
      />
      <Route
        path="/calendar"
        element={
          <RequireAuth>
            <AppLayoutMount view="calendar" />
          </RequireAuth>
        }
      />
      <Route
        path="/habits"
        element={
          <RequireAuth>
            <AppLayoutMount view="habits" />
          </RequireAuth>
        }
      />
      <Route
        path="/goals"
        element={
          <RequireAuth>
            <AppLayoutMount view="goals" />
          </RequireAuth>
        }
      />
      <Route
        path="/progress"
        element={
          <RequireAuth>
            <AppLayoutMount view="progress" />
          </RequireAuth>
        }
      />
      <Route
        path="/settings"
        element={
          <RequireAuth>
            <AppLayoutMount view="settings" />
          </RequireAuth>
        }
      />
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}

// Imported after AppRoutes definition to avoid circular import confusion.
import { AppLayout } from "@/components/app/AppLayout";
import { Routes, Route } from "react-router";

/** Renders the AppLayout chrome around the active page. */
function AppLayoutMount({ view }: { view: string }) {
  const page = (() => {
    switch (view) {
      case "today":
        return <Today />;
      case "inbox":
        return <InboxPage />;
      case "tasks":
        return <Tasks />;
      case "projects":
        return <Projects />;
      case "processes":
        return <Processes />;
      case "calendar":
        return <CalendarPage />;
      case "habits":
        return <Habits />;
      case "goals":
        return <Goals />;
      case "progress":
        return <Progress />;
      case "settings":
        return <Settings />;
      default:
        return <Today />;
    }
  })();
  return <AppLayout>{page}</AppLayout>;
}

/**
 * Registers the service worker (offline support) and the online/offline
 * listeners (auto re-sync when connectivity returns).
 */
function ServiceWorkerRegistrar() {
  useEffect(() => {
    if ("serviceWorker" in navigator) {
      // Relative path so the SW also works under a GitHub Pages subpath.
      navigator.serviceWorker.register("sw.js").catch((err) => {
        console.warn("Service worker registration skipped:", err);
      });
    }
    return initOnlineSync();
  }, []);
  return null;
}

function Root() {
  return (
    <AuthProvider>
      <I18nProvider>
        <RouterProvider router={router} />
        <Toaster />
      </I18nProvider>
    </AuthProvider>
  );
}

/**
 * Hash router: GitHub Pages serves static files with no server-side routing,
 * so /today lives at /#/today. Works identically in local dev.
 */
const router = createHashRouter([
  {
    path: "/*",
    element: (
      <Suspense fallback={<RouteLoading />}>
        <ServiceWorkerRegistrar />
        <UserStoreBridge />
        <AppRoutes />
      </Suspense>
    ),
  },
]);

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <RootErrorBoundary>
      <Root />
    </RootErrorBoundary>
  </StrictMode>,
);
