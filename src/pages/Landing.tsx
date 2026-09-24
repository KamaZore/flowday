import { Button } from "@/components/ui/button";
import { useI18n } from "@/lib/i18n";
import { useAuth } from "@/hooks/use-auth";
import {
  ArrowRight,
  BarChart3,
  CalendarDays,
  CheckCircle2,
  Clock3,
  Flame,
  Inbox,
  Languages,
  ListChecks,
  TrendingUp,
  Repeat2,
  Smartphone,
  ShieldCheck,
  Sparkles,
  Target,
  WifiOff,
} from "lucide-react";
import { motion } from "framer-motion";
import { Link } from "react-router";

const SYSTEMS = [
  { icon: Target, titleKey: "system.life.name", descKey: "system.life.desc", metricKey: "landing.systemLifeMetric", tone: "text-rose-500 bg-rose-500/10" },
  { icon: BarChart3, titleKey: "system.expense.name", descKey: "system.expense.desc", metricKey: "landing.systemExpenseMetric", tone: "text-emerald-500 bg-emerald-500/10" },
  { icon: BarChart3, titleKey: "system.business.name", descKey: "system.business.desc", metricKey: "landing.systemBusinessMetric", tone: "text-violet-500 bg-violet-500/10" },
  { icon: ShieldCheck, titleKey: "system.admin.name", descKey: "system.admin.desc", metricKey: "landing.systemAdminMetric", tone: "text-amber-500 bg-amber-500/10" },
];

const FLOW = [
  { labelKey: "landing.goal", icon: Target, color: "text-rose-500" },
  { labelKey: "landing.project", icon: ListChecks, color: "text-amber-500" },
  { labelKey: "landing.process", icon: Repeat2, color: "text-violet-500" },
  { labelKey: "landing.tasks", icon: CheckCircle2, color: "text-primary" },
  { labelKey: "landing.progress", icon: Flame, color: "text-emerald-500" },
];

const FEATURES = [
  {
    icon: Inbox,
    titleKey: "landing.featureCaptureTitle",
    textKey: "landing.featureCaptureText",
  },
  {
    icon: Repeat2,
    titleKey: "landing.featureProcessesTitle",
    textKey: "landing.featureProcessesText",
  },
  {
    icon: Flame,
    titleKey: "landing.featureHabitsTitle",
    textKey: "landing.featureHabitsText",
  },
  {
    icon: Target,
    titleKey: "landing.featureGoalsTitle",
    textKey: "landing.featureGoalsText",
  },
  {
    icon: CalendarDays,
    titleKey: "landing.featureCalendarTitle",
    textKey: "landing.featureCalendarText",
  },
  {
    icon: WifiOff,
    titleKey: "landing.featureOfflineTitle",
    textKey: "landing.featureOfflineText",
  },
];

export default function Landing() {
  const { lang, setLang, t } = useI18n();
  const { isAuthenticated } = useAuth();
  const dayLetters = lang === "km" ? ["ច", "អ", "ព", "ព", "ព្រ", "ស", "ស"] : ["M", "T", "W", "T", "F", "S", "S"];

  // Smooth-scroll to a section. Plain <a href="#features"> would fight the
  // HashRouter (it treats "#features" as a route → 404), so we scroll manually.
  const scrollTo = (id: string) => {
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  return (
    <div className="min-h-dvh bg-background">
      {/* Nav */}
      <header className="sticky top-0 z-40 border-b border-border/60 bg-background/80 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4">
          <div className="flex items-center gap-2">
            <svg viewBox="0 0 512 512" className="size-8 text-primary" aria-hidden>
              <rect width="512" height="512" rx="112" fill="currentColor" />
              <path d="M150 176 L236 256 L150 336" stroke="#fff" strokeWidth="46" strokeLinecap="round" strokeLinejoin="round" fill="none" opacity="0.55" />
              <path d="M250 176 L336 256 L250 336" stroke="#fff" strokeWidth="46" strokeLinecap="round" strokeLinejoin="round" fill="none" opacity="0.8" />
              <path d="M350 176 L436 256 L350 336" stroke="#fff" strokeWidth="46" strokeLinecap="round" strokeLinejoin="round" fill="none" />
            </svg>
            <span className="text-lg font-bold">Flowday</span>
          </div>
          <nav className="hidden items-center gap-6 text-sm text-muted-foreground md:flex">
            <button type="button" onClick={() => scrollTo("features")} className="hover:text-foreground">{t("landing.navFeatures")}</button>
            <button type="button" onClick={() => scrollTo("insights")} className="hover:text-foreground">{t("landing.navInsights")}</button>
          </nav>
          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => setLang(lang === "en" ? "km" : "en")}
              aria-label={lang === "en" ? "Switch to Khmer" : "Switch to English"}
            >
              <Languages className="size-4" />
              <span className="hidden sm:inline">{lang === "en" ? "ខ្មែរ" : "EN"}</span>
            </Button>
            {isAuthenticated ? (
              <Button asChild className="rounded-xl">
                <Link to="/select-system">{t("landing.ctaOpen")}</Link>
              </Button>
            ) : (
              <>
                <Button asChild variant="ghost" className="rounded-xl">
                  <Link to="/auth">{t("landing.ctaSignin")}</Link>
                </Button>
                <Button asChild className="rounded-xl">
                  <Link to="/register">{t("landing.ctaStart")}</Link>
                </Button>
              </>
            )}
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="relative overflow-hidden px-4 pb-16 pt-14 md:pt-24">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-x-0 -top-40 mx-auto h-96 max-w-3xl rounded-full bg-primary/15 blur-3xl"
        />
        <div className="relative mx-auto max-w-3xl text-center">
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <span className="inline-flex items-center gap-1.5 rounded-full border border-primary/20 bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
              <Sparkles className="size-3.5" />
              {t("landing.badge")}
            </span>
            <h1 className="mt-5 text-4xl font-extrabold leading-[1.1] tracking-tight md:text-6xl">
              {t("landing.heroA")}
              <br />
              <span className="text-primary">{t("landing.heroB")}</span>
            </h1>
            <p className="mx-auto mt-5 max-w-xl text-base text-muted-foreground md:text-lg">
              {t("landing.heroSub")}
            </p>
          </motion.div>
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.15 }}
            className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row"
          >
            <Button asChild size="lg" className="h-12 rounded-2xl px-7 text-base">
              <Link to="/register">
                {t("landing.ctaStartFree")} <ArrowRight className="ml-1 size-4" />
              </Link>
            </Button>
            <Button asChild size="lg" variant="outline" className="h-12 rounded-2xl px-7 text-base">
              <Link to="/auth">{t("landing.ctaSignIn")}</Link>
            </Button>
          </motion.div>

          {/* App mockup */}
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="card-soft mx-auto mt-12 max-w-md rounded-[4px] border border-border/70 bg-card p-4 text-left"
          >
            <div className="flex items-center justify-between">
              <p className="text-sm font-bold">{t("landing.goodMorning")}</p>
              <span className="text-xs text-muted-foreground">{t("landing.today")} · 80%</span>
            </div>
            <div className="mt-2 h-2.5 overflow-hidden rounded-full bg-muted">
              <div className="h-full w-4/5 rounded-full bg-primary" />
            </div>
            <div className="mt-4 space-y-2">
              {[
                { t: t("landing.finishOutline"), done: false, chip: t("landing.personalWebsite") },
                { t: t("landing.runMinutes"), done: true, chip: t("landing.fitness") },
                { t: t("landing.readPages"), done: false, chip: null },
              ].map((row) => (
                <div
                  key={row.t}
                  className="flex items-center gap-2.5 rounded-xl border border-border/60 bg-background/60 px-3 py-2.5"
                >
                  <span
                    className={
                      row.done
                        ? "flex size-5 items-center justify-center rounded-full bg-primary text-[10px] text-primary-foreground"
                        : "size-5 rounded-full border-2 border-muted-foreground/30"
                    }
                  >
                    {row.done ? "✓" : ""}
                  </span>
                  <span
                    className={
                      row.done
                        ? "flex-1 text-sm text-muted-foreground line-through"
                        : "flex-1 text-sm font-medium"
                    }
                  >
                    {row.t}
                  </span>
                  {row.chip && (
                    <span className="rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-medium text-primary">
                      {row.chip}
                    </span>
                  )}
                </div>
              ))}
            </div>
            <div className="mt-4 flex items-center justify-between rounded-xl bg-muted/60 px-3 py-2">
              <span className="flex items-center gap-1.5 text-xs font-medium">
                <Flame className="size-3.5 text-amber-500" /> {t("landing.exerciseStreak")}
              </span>
              <span className="text-[10px] text-muted-foreground">{t("landing.tapComplete")}</span>
            </div>
            <div className="mt-3 grid grid-cols-3 gap-2">
              <div className="rounded-xl border border-border/60 bg-background/60 p-2.5">
                <p className="text-[10px] text-muted-foreground">{t("landing.focusTime")}</p>
                <p className="mt-1 text-sm font-bold">2h 40m</p>
              </div>
              <div className="rounded-xl border border-border/60 bg-background/60 p-2.5">
                <p className="text-[10px] text-muted-foreground">{t("landing.nextUp")}</p>
                <p className="mt-1 truncate text-sm font-bold">3:30 PM</p>
              </div>
              <div className="rounded-xl border border-border/60 bg-background/60 p-2.5">
                <p className="text-[10px] text-muted-foreground">{t("landing.thisWeek")}</p>
                <p className="mt-1 text-sm font-bold text-emerald-600">+18%</p>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Insights */}
      <section id="insights" className="border-t border-border/60 bg-muted/20 px-4 py-16">
        <div className="mx-auto max-w-5xl">
          <div className="text-center">
            <h2 className="text-2xl font-bold tracking-tight md:text-3xl">{t("landing.insightsTitle")}</h2>
            <p className="mx-auto mt-2 max-w-xl text-sm text-muted-foreground">{t("landing.insightsSub")}</p>
          </div>
          <div className="mt-10 grid gap-4 md:grid-cols-3">
            <div className="card-soft rounded-2xl border border-border/70 bg-card p-5">
              <div className="flex items-center justify-between">
                <span className="flex size-10 items-center justify-center rounded-xl bg-violet-500/10 text-violet-600"><BarChart3 className="size-5" /></span>
                <span className="rounded-full bg-emerald-500/10 px-2 py-1 text-[10px] font-bold text-emerald-600">+18%</span>
              </div>
              <p className="mt-4 text-2xl font-extrabold">86%</p>
              <p className="text-xs text-muted-foreground">{t("landing.completion")}</p>
              <div className="mt-4 h-2 overflow-hidden rounded-full bg-muted"><div className="h-full w-[86%] rounded-full bg-violet-500" /></div>
            </div>
            <div className="card-soft rounded-2xl border border-border/70 bg-card p-5">
              <div className="flex items-center justify-between">
                <span className="flex size-10 items-center justify-center rounded-xl bg-amber-500/10 text-amber-600"><Clock3 className="size-5" /></span>
                <span className="text-xs font-semibold text-muted-foreground">{t("landing.today")}</span>
              </div>
              <p className="mt-4 text-2xl font-extrabold">4h 20m</p>
              <p className="text-xs text-muted-foreground">{t("landing.focusPlanned")}</p>
              <div className="mt-4 flex gap-1">{[40, 65, 45, 80, 55, 90, 70].map((height, i) => <span key={i} className="flex-1 rounded-full bg-amber-500/70" style={{ height: `${height / 4}px` }} />)}</div>
            </div>
            <div className="card-soft rounded-2xl border border-border/70 bg-card p-5">
              <div className="flex items-center justify-between">
                <span className="flex size-10 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-600"><TrendingUp className="size-5" /></span>
                <span className="text-xs font-semibold text-emerald-600">{t("landing.onTrack")}</span>
              </div>
              <p className="mt-4 text-2xl font-extrabold">12 days</p>
              <p className="text-xs text-muted-foreground">{t("landing.habitStreak")}</p>
              <div className="mt-4 flex -space-x-1.5">{dayLetters.map((day, i) => <span key={i} className="flex size-6 items-center justify-center rounded-full border-2 border-card bg-emerald-500 text-[9px] font-bold text-white">{day}</span>)}</div>
            </div>
          </div>
        </div>
      </section>

      {/* System introduction */}
      <section className="border-t border-border/60 bg-card/30 px-4 py-16">
        <div className="mx-auto max-w-6xl">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="text-2xl font-bold tracking-tight md:text-3xl">{t("landing.systemIntroTitle")}</h2>
            <p className="mt-2 text-sm leading-6 text-muted-foreground">{t("landing.systemIntroSub")}</p>
          </div>
          <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {SYSTEMS.map((system) => (
              <div key={system.titleKey} className="card-soft rounded-2xl border border-border/70 bg-card p-5 transition hover:-translate-y-0.5 hover:border-primary/30">
                <div className={`flex size-10 items-center justify-center rounded-xl ${system.tone}`}><system.icon className="size-5" /></div>
                <h3 className="mt-4 text-sm font-bold">{t(system.titleKey)}</h3>
                <p className="mt-1 min-h-10 text-xs leading-5 text-muted-foreground">{t(system.descKey)}</p>
                <p className="mt-4 border-t border-border/60 pt-3 text-[11px] font-semibold text-primary">{t(system.metricKey)}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Flow */}
      <section id="flow" className="border-t border-border/60 bg-muted/30 px-4 py-16">
        <div className="mx-auto max-w-5xl">
          <h2 className="text-center text-2xl font-bold tracking-tight md:text-3xl">
            {t("landing.flowTitle")}
          </h2>
          <p className="mx-auto mt-2 max-w-lg text-center text-sm text-muted-foreground">
            {t("landing.flowSub")}
          </p>
          <div className="mt-10 flex flex-wrap items-center justify-center gap-2 md:gap-3">
            {FLOW.map((f, i) => (
              <div key={f.labelKey} className="flex items-center gap-2 md:gap-3">
                <div className="card-soft flex items-center gap-2 rounded-2xl border border-border/70 bg-card px-4 py-3">
                  <f.icon className={`size-5 ${f.color}`} />
                  <span className="text-sm font-semibold">{t(f.labelKey)}</span>
                </div>
                {i < FLOW.length - 1 && (
                  <ArrowRight className="size-4 text-muted-foreground/50" />
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="px-4 py-16">
        <div className="mx-auto max-w-5xl">
          <h2 className="text-center text-2xl font-bold tracking-tight md:text-3xl">
            {t("landing.featuresTitle")}
          </h2>
          <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {FEATURES.map((f) => (
              <div
                key={f.titleKey}
                className="card-soft rounded-2xl border border-border/70 bg-card p-5 transition-transform hover:-translate-y-0.5"
              >
                <div className="flex size-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
                  <f.icon className="size-5" />
                </div>
                <h3 className="mt-3 text-sm font-bold">{t(f.titleKey)}</h3>
                <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
                  {t(f.textKey)}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="px-4 pb-20">
        <div className="card-soft mx-auto max-w-3xl rounded-3xl border border-primary/20 bg-gradient-to-br from-primary/10 via-primary/5 to-transparent p-8 text-center md:p-12">
          <h2 className="text-2xl font-bold tracking-tight md:text-3xl">
            {t("landing.ctaTitle")}
          </h2>
          <p className="mx-auto mt-2 max-w-md text-sm text-muted-foreground">
            {t("landing.ctaSub")}
          </p>
          <Button asChild size="lg" className="mt-6 h-12 rounded-2xl px-8 text-base">
            <Link to={isAuthenticated ? "/select-system" : "/register"}>
              {isAuthenticated ? t("landing.ctaOpen") : t("landing.ctaButton")}{" "}
              <ArrowRight className="ml-1 size-4" />
            </Link>
          </Button>
          <p className="mt-4 flex items-center justify-center gap-1.5 text-xs text-muted-foreground">
            <Smartphone className="size-3.5" />
            {t("landing.installNote")}
          </p>
        </div>
      </section>

      <footer className="border-t border-border/60 px-4 py-8 text-center text-xs text-muted-foreground">
        {t("landing.footer")}
      </footer>
    </div>
  );
}
