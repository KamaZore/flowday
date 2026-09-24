import { useI18n } from "@/lib/i18n";
import { useAuth } from "@/hooks/use-auth";
import { OfflineBanner } from "@/components/app/OfflineBanner";
import { Button } from "@/components/ui/button";
import { useActiveSystem, setActiveSystem, useSettings } from "@/lib/store";
import { SYSTEMS } from "@/systems";
import { motion } from "framer-motion";
import { ArrowRight, LogOut } from "lucide-react";
import { useEffect } from "react";
import { useNavigate } from "react-router";
import { cn } from "@/lib/utils";

function greetingKey(): string {
  const h = new Date().getHours();
  if (h < 5) return "today.greeting.night";
  if (h < 12) return "today.greeting.morning";
  if (h < 17) return "today.greeting.afternoon";
  return "today.greeting.evening";
}

/**
 * System selection — the hub between authentication and the three
 * workspaces. Preselects the last used system; entering a system records
 * it on the user's document (activeSystem).
 */
export default function SelectSystem() {
  const { t } = useI18n();
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const activeSystem = useActiveSystem();
  const settings = useSettings();

  // Keyboard shortcuts 1/2/3 (desktop convenience)
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const idx = Number(e.key) - 1;
      if (idx >= 0 && idx < SYSTEMS.length) {
        enter(SYSTEMS[idx].id);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function enter(id: (typeof SYSTEMS)[number]["id"]) {
    setActiveSystem(id);
    const def = SYSTEMS.find((s) => s.id === id)!;
    navigate(def.root, { replace: true });
  }

  return (
    <div className="safe-top safe-bottom relative flex min-h-dvh flex-col overflow-hidden bg-background px-4 py-6">
      <OfflineBanner />
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0 h-72 bg-primary/10 blur-3xl"
      />

      <header className="relative mx-auto flex w-full max-w-3xl items-center justify-between">
        <div>
          <p className="text-sm text-muted-foreground">{t(greetingKey())} 👋</p>
          <h1 className="text-xl font-bold tracking-tight">
            {user?.name || settings.name || t("select.title")}
          </h1>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => void signOut()}
          className="gap-1.5 rounded-xl text-muted-foreground"
        >
          <LogOut className="size-4" />
          {t("common.signOut")}
        </Button>
      </header>

      <div className="relative mx-auto mt-8 w-full max-w-3xl">
        <h2 className="mb-1 text-center text-lg font-bold">{t("select.choose")}</h2>
        <p className="mb-6 text-center text-sm text-muted-foreground">
          {t("select.subtitle")}
        </p>

        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {SYSTEMS.map((s, i) => {
            const isLast = activeSystem === s.id;
            return (
              <motion.button
                key={s.id}
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.06, duration: 0.35, ease: "easeOut" }}
                whileTap={{ scale: 0.98 }}
                onClick={() => enter(s.id)}
                className={cn(
                  "card-soft group relative flex flex-col items-start gap-3 rounded-3xl border bg-card p-5 text-left transition-all hover:shadow-md",
                  isLast ? s.ring : "border-border/70",
                )}
              >
                <div
                  aria-hidden
                  className={cn(
                    "pointer-events-none absolute inset-x-0 top-0 h-24 rounded-t-3xl bg-gradient-to-b to-transparent opacity-60",
                    s.glow,
                  )}
                />
                <span
                  className={cn(
                    "relative flex size-11 items-center justify-center rounded-2xl bg-muted",
                  )}
                >
                  <s.icon className={cn("size-5.5", s.accent)} />
                </span>
                <span className="relative">
                  <span className="flex items-center gap-2 text-base font-bold">
                    {t(s.labelKey)}
                    {isLast && (
                      <span className="rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-semibold text-primary">
                        {t("select.lastUsed")}
                      </span>
                    )}
                  </span>
                  <span className="mt-1 block text-xs leading-relaxed text-muted-foreground">
                    {t(s.descKey)}
                  </span>
                </span>
                <span
                  className={cn(
                    "relative mt-auto flex items-center gap-1 text-xs font-semibold",
                    s.accent,
                  )}
                >
                  {t("select.enter")}
                  <ArrowRight className="size-3.5 transition-transform group-hover:translate-x-0.5" />
                </span>
              </motion.button>
            );
          })}
        </div>

        <p className="mt-6 text-center text-xs text-muted-foreground">
          {t("select.hint")}
        </p>
      </div>
    </div>
  );
}
