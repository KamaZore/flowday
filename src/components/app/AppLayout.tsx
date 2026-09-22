import { QuickAddDialog } from "@/components/app/QuickAddDialog";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useI18n } from "@/lib/i18n";
import { NAV_ITEMS } from "@/components/app/nav";
import { useTheme } from "@/hooks/use-theme";
import { cn } from "@/lib/utils";
import { Languages, LayoutGrid, Moon, Plus, Sun } from "lucide-react";
import { useEffect, useState, type ReactNode } from "react";
import { NavLink, Outlet, useLocation, useNavigate } from "react-router";

export type QuickAddType =
  | "task"
  | "project"
  | "process"
  | "habit"
  | "goal"
  | "note";

function FlowdayLogo({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 512 512" className={className} aria-hidden>
      <rect width="512" height="512" rx="112" fill="currentColor" />
      <path
        d="M150 176 L236 256 L150 336"
        stroke="#fff"
        strokeWidth="46"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
        opacity="0.55"
      />
      <path
        d="M250 176 L336 256 L250 336"
        stroke="#fff"
        strokeWidth="46"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
        opacity="0.8"
      />
      <path
        d="M350 176 L436 256 L350 336"
        stroke="#fff"
        strokeWidth="46"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
    </svg>
  );
}

function SidebarNav() {
  const { t } = useI18n();
  return (
    <nav className="flex flex-col gap-1">
      {NAV_ITEMS.map((item) => (
        <NavLink
          key={item.path}
          to={item.path}
          className={({ isActive }) =>
            cn(
              "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground",
              isActive && "bg-primary/10 font-semibold text-primary",
            )
          }
        >
          <item.icon className="size-4" />
          {t(item.labelKey)}
        </NavLink>
      ))}
    </nav>
  );
}

function LangToggle() {
  const { lang, setLang } = useI18n();
  const next = lang === "en" ? "km" : "en";
  return (
    <Button
      variant="outline"
      size="sm"
      className="h-8 gap-1.5 rounded-lg px-2.5 text-xs font-semibold"
      onClick={() => setLang(next)}
      aria-label="Switch language / ប្ដូរភាសា"
    >
      <Languages className="size-4" />
      {next === "km" ? "ខ្មែរ" : "EN"}
    </Button>
  );
}

export function AppLayout({ children }: { children?: ReactNode }) {
  const { resolved, toggle } = useTheme();
  const { t } = useI18n();
  const navigate = useNavigate();
  const location = useLocation();
  const [quickAddOpen, setQuickAddOpen] = useState(false);
  const [quickAddType, setQuickAddType] = useState<QuickAddType>("task");

  const openQuickAdd = (type: QuickAddType = "task") => {
    setQuickAddType(type);
    setQuickAddOpen(true);
  };

  // Support ?quickadd=task deep link (PWA shortcuts)
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const qa = params.get("quickadd");
    if (qa) {
      openQuickAdd(qa as QuickAddType);
      params.delete("quickadd");
      const qs = params.toString();
      navigate({ pathname: location.pathname, search: qs ? `?${qs}` : "" }, {
        replace: true,
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="min-h-dvh bg-background">
      {/* Desktop sidebar */}
      <aside className="safe-x fixed inset-y-0 left-0 z-30 hidden w-60 flex-col border-r border-sidebar-border bg-sidebar px-4 py-6 md:flex">
        <button
          onClick={() => navigate("/today")}
          className="mb-6 flex items-center gap-2.5 px-2 text-left"
        >
          <FlowdayLogo className="size-9 rounded-xl text-primary" />
          <span>
            <span className="block text-[15px] font-bold leading-tight">
              Flowday
            </span>
            <span className="block text-[11px] text-muted-foreground">
              {t("app.tagline")}
            </span>
          </span>
        </button>
        <SidebarNav />
        <div className="mt-auto flex items-center gap-2 px-2 pt-4">
          <Button
            variant="outline"
            size="icon"
            className="size-8 rounded-lg"
            onClick={toggle}
            aria-label="Toggle theme"
          >
            {resolved === "dark" ? (
              <Sun className="size-4" />
            ) : (
              <Moon className="size-4" />
            )}
          </Button>
          <span className="text-xs text-muted-foreground">
            {resolved === "dark" ? t("theme.darkMode") : t("theme.lightMode")}
          </span>
          <LangToggle />
        </div>
      </aside>

      {/* Mobile header — safe-area aware */}
      <header className="safe-top sticky top-0 z-30 border-b border-border/60 bg-background/80 backdrop-blur md:hidden">
        <div className="flex h-14 items-center justify-between px-4">
          <button
            onClick={() => navigate("/today")}
            className="flex items-center gap-2"
          >
            <FlowdayLogo className="size-7 rounded-lg text-primary" />
            <span className="text-base font-bold">Flowday</span>
          </button>
          <div className="flex items-center gap-1.5">
            <LangToggle />
            <Button
              variant="ghost"
              size="icon"
              className="size-9"
              onClick={toggle}
              aria-label="Toggle theme"
            >
              {resolved === "dark" ? (
                <Sun className="size-4" />
              ) : (
                <Moon className="size-4" />
              )}
            </Button>
          </div>
        </div>
      </header>

      {/* Main content — extra bottom padding clears the safe-area nav */}
      <main className="safe-x px-4 pb-36 pt-4 md:ml-60 md:px-8 md:pb-16 md:pt-8">
        <div className="mx-auto max-w-5xl">{children ?? <Outlet />}</div>
      </main>

      {/* Mobile bottom nav — grows with the home indicator inset */}
      <nav className="safe-nav safe-x fixed inset-x-0 bottom-0 z-30 flex items-stretch justify-around border-t border-border/60 bg-background/90 backdrop-blur md:hidden">
        {[0, 1, 2].map((idx) => {
          const item = NAV_ITEMS[idx];
          return (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) =>
                cn(
                  // Container .safe-nav already covers the home-indicator inset;
                  // adding it here too double-counted it on notched phones.
                  "flex flex-1 flex-col items-center justify-center gap-0.5 pt-2 text-[10px] font-medium text-muted-foreground transition-colors",
                  isActive && "text-primary",
                )
              }
            >
              <item.icon className="size-5" />
              {t(item.labelKey)}
            </NavLink>
          );
        })}
        <MobileMoreMenu />
      </nav>

      {/* Center FAB (mobile) — lifts above the safe-area nav */}
      <button
        onClick={() => openQuickAdd("task")}
        className="card-soft fab-safe fixed left-1/2 z-40 flex size-12 -translate-x-1/2 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-lg md:hidden"
        aria-label={t("quick.title")}
      >
        <Plus className="size-6" />
      </button>

      {/* Desktop quick add button */}
      <Button
        onClick={() => openQuickAdd("task")}
        className="card-soft fixed bottom-6 right-6 z-40 hidden h-12 gap-2 rounded-full px-5 shadow-lg md:inline-flex"
      >
        <Plus className="size-5" />
        {t("quick.title")}
      </Button>

      <QuickAddDialog
        open={quickAddOpen}
        onOpenChange={setQuickAddOpen}
        defaultType={quickAddType}
      />
    </div>
  );
}

/** Mobile “More” menu covering the nav items that don't fit in the bottom bar. */
function MobileMoreMenu() {
  const { t } = useI18n();
  const location = useLocation();
  const moreItems = NAV_ITEMS.slice(3);
  // useLocation re-renders on every navigation, so the active state is never
  // stale (the old window.location.pathname read was — it didn't update).
  const moreActive = moreItems.some((i) => location.pathname === i.path);
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          className="flex flex-1 flex-col items-center justify-center gap-0.5 pt-2 text-[10px] font-medium text-muted-foreground transition-colors data-[active=true]:text-primary"
          data-active={moreActive}
        >
          <LayoutGrid className={cn("size-5", moreActive && "text-primary")} />
          {t("nav.more")}
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent side="top" align="end" className="mb-2 grid grid-cols-3 gap-1 rounded-2xl p-2">
        {moreItems.map((item) => (
          <DropdownMenuItem key={item.path} asChild>
            <NavLink
              to={item.path}
              className={({ isActive }) =>
                cn(
                  "flex flex-col items-center gap-1 rounded-xl px-3 py-2.5 text-[10px] font-medium text-muted-foreground",
                  isActive && "bg-primary/10 text-primary",
                )
              }
            >
              <item.icon className="size-5" />
              {t(item.labelKey)}
            </NavLink>
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
