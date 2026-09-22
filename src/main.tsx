import '@vly-ai/integrations';
import { Toaster } from "@/components/ui/sonner";
import { RequireAuth } from "@/components/RequireAuth";
import { VlyToolbar } from "../vly-toolbar-readonly.tsx";
import { ConvexAuthProvider } from "@convex-dev/auth/react";
import { ConvexReactClient } from "convex/react";
import React, { StrictMode, useEffect, lazy, Suspense } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter, Route, Routes, useLocation } from "react-router";
import "./index.css";

// Lazy load route components for better code splitting
const Landing = lazy(() => import("./pages/Landing.tsx"));
const AuthPage = lazy(() => import("./pages/Auth.tsx"));
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

/** Silent error boundary — if VlyToolbar crashes it renders nothing instead of
 *  crashing the whole app (e.g. hook errors in WebContainer environment). */
class ToolbarErrorBoundary extends React.Component<
  { children: React.ReactNode },
  { hasError: boolean }
> {
  state = { hasError: false };
  static getDerivedStateFromError() {
    return { hasError: true };
  }
  componentDidCatch(err: Error) {
    console.warn("[VlyToolbar] Caught error, toolbar disabled:", err.message);
  }
  render() {
    return this.state.hasError ? null : this.props.children;
  }
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
  componentDidCatch(err: Error) {
    console.error("[WebContainer preview] Root crash:", err);
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

const convex = new ConvexReactClient(import.meta.env.VITE_CONVEX_URL as string);

/** App pages share the AppLayout (sidebar / bottom nav / quick add). */
function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<Landing />} />
      <Route
        path="/auth"
        element={<AuthPage redirectAfterAuth="/today" />}
      />
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

function RouteSyncer() {
  const location = useLocation();
  useEffect(() => {
    window.parent.postMessage(
      { type: "iframe-route-change", path: location.pathname },
      "*",
    );
  }, [location.pathname]);

  useEffect(() => {
    function handleMessage(event: MessageEvent) {
      if (event.data?.type === "navigate") {
        if (event.data.direction === "back") window.history.back();
        if (event.data.direction === "forward") window.history.forward();
      }
    }
    window.addEventListener("message", handleMessage);
    return () => window.removeEventListener("message", handleMessage);
  }, []);

  return null;
}

/** Register the service worker for offline support (production + preview). */
function ServiceWorkerRegistrar() {
  useEffect(() => {
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker.register("/sw.js").catch((err) => {
        console.warn("Service worker registration skipped:", err);
      });
    }
  }, []);
  return null;
}

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <RootErrorBoundary>
      <ToolbarErrorBoundary>
        <VlyToolbar />
      </ToolbarErrorBoundary>
      <ConvexAuthProvider client={convex}>
        <BrowserRouter>
          <RouteSyncer />
          <ServiceWorkerRegistrar />
          <Suspense fallback={<RouteLoading />}>
            <AppRoutes />
          </Suspense>
        </BrowserRouter>
        <Toaster />
      </ConvexAuthProvider>
    </RootErrorBoundary>
  </StrictMode>,
);
