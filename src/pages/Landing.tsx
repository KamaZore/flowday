import { Button } from "@/components/ui/button";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { useI18n } from "@/lib/i18n";
import { useAuth } from "@/hooks/use-auth";
import { loadSiteContent, useSiteContent, type CarouselSlide } from "@/lib/site-content";
import {
  ArrowRight,
  BarChart3,
  CalendarDays,
  CheckCircle2,
  Clock3,
  Flame,
  Inbox,
  Languages,
  LayoutGrid,
  ListChecks,
  Repeat2,
  Smartphone,
  ShieldCheck,
  Sparkles,
  Store,
  Target,
  TrendingUp,
  Wallet,
  WifiOff,
} from "lucide-react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { useEffect, useState } from "react";
import { Link } from "react-router";

const SYSTEMS = [
  { icon: Target, titleKey: "system.life.name", descKey: "system.life.desc", metricKey: "landing.systemLifeMetric", tone: "text-rose-500 bg-rose-500/10" },
  { icon: Wallet, titleKey: "system.expense.name", descKey: "system.expense.desc", metricKey: "landing.systemExpenseMetric", tone: "text-emerald-500 bg-emerald-500/10" },
  { icon: Store, titleKey: "system.business.name", descKey: "system.business.desc", metricKey: "landing.systemBusinessMetric", tone: "text-violet-500 bg-violet-500/10" },
];

const STATS = [
  { icon: LayoutGrid, labelKey: "landing.statSystems" },
  { icon: WifiOff, labelKey: "landing.statOffline" },
  { icon: Languages, labelKey: "landing.statLangs" },
];

const STEPS = [
  { icon: Target, titleKey: "landing.goal", descKey: "landing.flowGoalD", tone: "text-rose-500 bg-rose-500/10" },
  { icon: ListChecks, titleKey: "landing.project", descKey: "landing.flowProjectD", tone: "text-amber-500 bg-amber-500/10" },
  { icon: Repeat2, titleKey: "landing.process", descKey: "landing.flowProcessD", tone: "text-violet-500 bg-violet-500/10" },
  { icon: CheckCircle2, titleKey: "landing.tasks", descKey: "landing.flowTasksD", tone: "text-primary bg-primary/10" },
  { icon: Flame, titleKey: "landing.progress", descKey: "landing.flowProgressD", tone: "text-emerald-500 bg-emerald-500/10" },
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
  {
    icon: ShieldCheck,
    titleKey: "landing.featureSecurityTitle",
    textKey: "landing.featureSecurityText",
  },
  {
    icon: Languages,
    titleKey: "landing.featureKhmerTitle",
    textKey: "landing.featureKhmerText",
  },
];

const FAQS = [
  { q: "landing.faq1Q", a: "landing.faq1A" },
  { q: "landing.faq2Q", a: "landing.faq2A" },
  { q: "landing.faq3Q", a: "landing.faq3A" },
  { q: "landing.faq4Q", a: "landing.faq4A" },
  { q: "landing.faq5Q", a: "landing.faq5A" },
];

export default function Landing() {
  const { lang, setLang, t } = useI18n();
  const { isAuthenticated } = useAuth();
  const reduceMotion = useReducedMotion();
  const siteContent = useSiteContent();
  const [mockupSlide, setMockupSlide] = useState(0);

  useEffect(() => {
    void loadSiteContent();
  }, []);

  const localizedSiteName = lang === "km" ? siteContent.siteNameKm : siteContent.siteName;
  const localizedHeaderTitle = lang === "km" ? siteContent.headerTitleKm : siteContent.headerTitle;
  const localizedHeaderSubtitle = lang === "km" ? siteContent.headerSubtitleKm : siteContent.headerSubtitle;
  const dayLetters = lang === "km" ? ["ច", "អ", "ព", "ព", "ព្រ", "ស", "ស"] : ["M", "T", "W", "T", "F", "S", "S"];
  const activeSlides: CarouselSlide[] = siteContent.slides.filter((slide) => slide.enabled);
  const publicSlides = activeSlides.length > 0 ? activeSlides : siteContent.slides;
  const mergedSlides = publicSlides.map((slide) => ({
    ...slide,
    id: slide.id,
    title: lang === "km" ? slide.titleKm || slide.title : slide.title,
    subtitle: lang === "km" ? slide.subtitleKm || slide.subtitle : slide.subtitle,
  }));
  const safeSlideIndex = publicSlides.length > 0 ? mockupSlide % publicSlides.length : 0;
  const mockup = mergedSlides[safeSlideIndex] ?? mergedSlides[0];

  useEffect(() => {
    if (reduceMotion || publicSlides.length < 2) return;
    const timer = window.setInterval(() => {
      setMockupSlide((slide) => (slide + 1) % publicSlides.length);
    }, 4200);
    return () => window.clearInterval(timer);
  }, [publicSlides.length, reduceMotion]);

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
            {siteContent.logoUrl ? (
              <img src={siteContent.logoUrl} alt={localizedSiteName || "Flowday"} className="size-9 rounded-xl object-contain" />
            ) : (
              <svg viewBox="0 0 512 512" className="size-8 text-primary" aria-hidden>
                <rect width="512" height="512" rx="112" fill="currentColor" />
                <path d="M150 176 L236 256 L150 336" stroke="#fff" strokeWidth="46" strokeLinecap="round" strokeLinejoin="round" fill="none" opacity="0.55" />
                <path d="M250 176 L336 256 L250 336" stroke="#fff" strokeWidth="46" strokeLinecap="round" strokeLinejoin="round" fill="none" opacity="0.8" />
                <path d="M350 176 L436 256 L350 336" stroke="#fff" strokeWidth="46" strokeLinecap="round" strokeLinejoin="round" fill="none" />
              </svg>
            )}
            <span className="text-lg font-bold">{localizedSiteName || "Flowday"}</span>
          </div>
          <nav className="hidden items-center gap-6 text-sm text-muted-foreground md:flex">
            <button type="button" onClick={() => scrollTo("how")} className="transition-colors hover:text-foreground">{t("landing.navHow")}</button>
            <button type="button" onClick={() => scrollTo("features")} className="transition-colors hover:text-foreground">{t("landing.navFeatures")}</button>
            <button type="button" onClick={() => scrollTo("insights")} className="transition-colors hover:text-foreground">{t("landing.navInsights")}</button>
            <button type="button" onClick={() => scrollTo("faq")} className="transition-colors hover:text-foreground">{t("landing.navFaq")}</button>
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
      <section className="relative overflow-hidden px-4 pb-14 pt-14 md:pb-20 md:pt-24">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-x-0 -top-40 mx-auto h-96 max-w-3xl rounded-full bg-primary/15 blur-3xl"
        />
        <div className="relative mx-auto max-w-6xl">
          <div className="grid items-center gap-12 text-center md:grid-cols-[1.05fr_.95fr] md:gap-16 md:text-left">
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
            >
              <span className="inline-flex items-center gap-1.5 rounded-full border border-primary/20 bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
                <Sparkles className="size-3.5" />
                {t("landing.badge")}
              </span>
              <h1 className="mt-5 text-4xl font-extrabold leading-[1.08] tracking-tight md:text-6xl">
                {localizedHeaderTitle || t("landing.heroA")}
              </h1>
              <p className="mx-auto mt-5 max-w-xl text-base leading-relaxed text-muted-foreground md:mx-0 md:text-lg">
                {localizedHeaderSubtitle || t("landing.heroSub")}
              </p>
              <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row md:justify-start">
                <Button asChild size="lg" className="h-12 rounded-2xl px-7 text-base">
                  <Link to="/register">
                    {t("landing.ctaStartFree")} <ArrowRight className="ml-1 size-4" />
                  </Link>
                </Button>
                <Button asChild size="lg" variant="outline" className="h-12 rounded-2xl px-7 text-base">
                  <Link to="/auth">{t("landing.ctaSignIn")}</Link>
                </Button>
              </div>
            </motion.div>

            {/* App mockup carousel */}
            <AnimatePresence mode="wait" initial={false}>
              <motion.div
                key={mockup?.id ?? safeSlideIndex}
                initial={{ opacity: 0, x: reduceMotion ? 0 : 28 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: reduceMotion ? 0 : -28 }}
                transition={{ duration: 0.45, ease: "easeInOut" }}
                className="mx-auto w-full max-w-md text-left"
              >
                {mockup?.imageUrl ? (
                  <img
                    src={mockup.imageUrl}
                    alt={mockup.title || "Flowday carousel slide"}
                    className="h-auto w-full"
                    loading="lazy"
                    onError={(event) => { event.currentTarget.style.display = "none"; }}
                  />
                ) : null}
                <div className="mt-4 flex items-center justify-center gap-1.5" aria-label="Preview slides">
                  {mergedSlides.map((slide, index) => (
                    <button
                      key={slide.id}
                      type="button"
                      aria-label={`Show preview slide ${index + 1}`}
                      aria-current={safeSlideIndex === index}
                      onClick={() => setMockupSlide(index)}
                      className={safeSlideIndex === index ? "h-1.5 w-6 rounded-full bg-primary" : "h-1.5 w-1.5 rounded-full bg-muted-foreground/30 transition hover:bg-primary/60"}
                    />
                  ))}
                </div>
              </motion.div>
            </AnimatePresence>
          </div>

          {/* Quick facts strip */}
          <div className="mt-14 grid grid-cols-1 gap-3 border-t border-border/60 pt-8 sm:grid-cols-3">
            {STATS.map((s) => (
              <div key={s.labelKey} className="flex items-center justify-center gap-2.5 text-sm font-medium text-muted-foreground">
                <span className="flex size-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
                  <s.icon className="size-4" />
                </span>
                {t(s.labelKey)}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* System introduction */}
      <section className="border-t border-border/60 bg-card/30 px-4 py-20">
        <div className="mx-auto max-w-6xl">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="text-2xl font-bold tracking-tight md:text-3xl">{t("landing.systemIntroTitle")}</h2>
            <p className="mt-3 text-sm leading-6 text-muted-foreground md:text-base">{t("landing.systemIntroSub")}</p>
          </div>
          <div className="mt-12 grid gap-4 md:grid-cols-3">
            {SYSTEMS.map((system) => (
              <div key={system.titleKey} className="group rounded-3xl border border-border/60 bg-card p-6 transition hover:-translate-y-1 hover:border-primary/30 hover:shadow-lg hover:shadow-primary/5">
                <div className={`flex size-12 items-center justify-center rounded-2xl ${system.tone}`}><system.icon className="size-6" /></div>
                <h3 className="mt-5 text-base font-bold">{t(system.titleKey)}</h3>
                <p className="mt-2 min-h-10 text-sm leading-6 text-muted-foreground">{t(system.descKey)}</p>
                <p className="mt-5 flex items-center gap-1 border-t border-border/60 pt-4 text-xs font-semibold text-primary">
                  {t(system.metricKey)}
                  <ArrowRight className="size-3.5 transition-transform group-hover:translate-x-0.5" />
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How it works — numbered flow */}
      <section id="how" className="scroll-mt-20 border-t border-border/60 px-4 py-20">
        <div className="mx-auto max-w-5xl">
          <h2 className="text-center text-2xl font-bold tracking-tight md:text-3xl">
            {t("landing.flowTitle")}
          </h2>
          <p className="mx-auto mt-3 max-w-lg text-center text-sm text-muted-foreground md:text-base">
            {t("landing.flowSub")}
          </p>
          <ol className="mt-12 grid gap-8 sm:grid-cols-2 lg:grid-cols-5 lg:gap-4">
            {STEPS.map((step, i) => (
              <li key={step.titleKey} className="relative flex flex-col items-center text-center lg:items-start lg:text-left">
                <div className="flex items-center gap-3">
                  <span className={`relative flex size-11 shrink-0 items-center justify-center rounded-2xl ${step.tone}`}>
                    <step.icon className="size-5" />
                    <span className="absolute -right-1.5 -top-1.5 flex size-5 items-center justify-center rounded-full bg-foreground text-[10px] font-bold text-background">
                      {i + 1}
                    </span>
                  </span>
                  <span className="hidden h-px flex-1 bg-border lg:block" aria-hidden />
                </div>
                <h3 className="mt-4 text-sm font-bold">{t(step.titleKey)}</h3>
                <p className="mt-1 text-xs leading-5 text-muted-foreground">{t(step.descKey)}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="scroll-mt-20 border-t border-border/60 bg-card/30 px-4 py-20">
        <div className="mx-auto max-w-5xl">
          <h2 className="text-center text-2xl font-bold tracking-tight md:text-3xl">
            {t("landing.featuresTitle")}
          </h2>
          <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {FEATURES.map((f) => (
              <div
                key={f.titleKey}
                className="rounded-3xl border border-border/60 bg-card p-5 transition hover:-translate-y-1 hover:border-primary/30 hover:shadow-lg hover:shadow-primary/5"
              >
                <div className="flex size-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
                  <f.icon className="size-5" />
                </div>
                <h3 className="mt-4 text-sm font-bold">{t(f.titleKey)}</h3>
                <p className="mt-1.5 text-xs leading-5 text-muted-foreground">
                  {t(f.textKey)}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Insights */}
      <section id="insights" className="scroll-mt-20 border-t border-border/60 px-4 py-20">
        <div className="mx-auto max-w-5xl">
          <div className="text-center">
            <h2 className="text-2xl font-bold tracking-tight md:text-3xl">{t("landing.insightsTitle")}</h2>
            <p className="mx-auto mt-3 max-w-xl text-sm text-muted-foreground md:text-base">{t("landing.insightsSub")}</p>
          </div>
          <div className="mt-12 grid gap-4 md:grid-cols-3">
            <div className="rounded-3xl border border-border/60 bg-card p-6">
              <div className="flex items-center justify-between">
                <span className="flex size-10 items-center justify-center rounded-xl bg-violet-500/10 text-violet-600"><BarChart3 className="size-5" /></span>
                <span className="rounded-full bg-emerald-500/10 px-2 py-1 text-[10px] font-bold text-emerald-600">+18%</span>
              </div>
              <p className="mt-5 text-3xl font-extrabold tracking-tight">86%</p>
              <p className="text-xs text-muted-foreground">{t("landing.completion")}</p>
              <div className="mt-4 h-2 overflow-hidden rounded-full bg-muted"><div className="h-full w-[86%] rounded-full bg-violet-500" /></div>
            </div>
            <div className="rounded-3xl border border-border/60 bg-card p-6">
              <div className="flex items-center justify-between">
                <span className="flex size-10 items-center justify-center rounded-xl bg-amber-500/10 text-amber-600"><Clock3 className="size-5" /></span>
                <span className="text-xs font-semibold text-muted-foreground">{t("landing.today")}</span>
              </div>
              <p className="mt-5 text-3xl font-extrabold tracking-tight">4h 20m</p>
              <p className="text-xs text-muted-foreground">{t("landing.focusPlanned")}</p>
              <div className="mt-4 flex h-8 items-end gap-1">{[40, 65, 45, 80, 55, 90, 70].map((height, i) => <span key={i} className="flex-1 rounded-full bg-amber-500/70" style={{ height: `${height}%` }} />)}</div>
            </div>
            <div className="rounded-3xl border border-border/60 bg-card p-6">
              <div className="flex items-center justify-between">
                <span className="flex size-10 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-600"><TrendingUp className="size-5" /></span>
                <span className="text-xs font-semibold text-emerald-600">{t("landing.onTrack")}</span>
              </div>
              <p className="mt-5 text-3xl font-extrabold tracking-tight">12</p>
              <p className="text-xs text-muted-foreground">{t("landing.habitStreak")}</p>
              <div className="mt-4 flex -space-x-1.5">{dayLetters.map((day, i) => <span key={i} className="flex size-6 items-center justify-center rounded-full border-2 border-card bg-emerald-500 text-[9px] font-bold text-white">{day}</span>)}</div>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section id="faq" className="scroll-mt-20 border-t border-border/60 bg-card/30 px-4 py-20">
        <div className="mx-auto max-w-2xl">
          <div className="text-center">
            <h2 className="text-2xl font-bold tracking-tight md:text-3xl">{t("landing.faqTitle")}</h2>
            <p className="mt-3 text-sm text-muted-foreground md:text-base">{t("landing.faqSub")}</p>
          </div>
          <Accordion type="single" collapsible className="mt-10 space-y-3">
            {FAQS.map((faq, i) => (
              <AccordionItem
                key={faq.q}
                value={`faq-${i}`}
                className="rounded-2xl border border-border/60 bg-card px-5 last:border-b"
              >
                <AccordionTrigger className="text-left text-sm font-bold hover:no-underline">
                  {t(faq.q)}
                </AccordionTrigger>
                <AccordionContent className="text-sm leading-6 text-muted-foreground">
                  {t(faq.a)}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>
      </section>

      {/* CTA */}
      <section className="px-4 py-20">
        <div className="mx-auto max-w-3xl rounded-3xl border border-primary/20 bg-gradient-to-br from-primary/10 via-primary/5 to-transparent p-8 text-center md:p-12">
          <h2 className="text-2xl font-bold tracking-tight md:text-3xl">
            {t("landing.ctaTitle")}
          </h2>
          <p className="mx-auto mt-3 max-w-md text-sm text-muted-foreground md:text-base">
            {t("landing.ctaSub")}
          </p>
          <Button asChild size="lg" className="mt-7 h-12 rounded-2xl px-8 text-base">
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
        {lang === "km" ? "Flowday — ថ្ងៃរបស់អ្នក ជាលំហូរ។ បង្កើតដោយ Roeung Nak។" : t("landing.footer")}
      </footer>
    </div>
  );
}
