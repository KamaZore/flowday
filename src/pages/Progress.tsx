import {
  addDaysKey,
  formatDateKey,
  todayKey,
  toLocalDateKey,
} from "@/lib/date-utils";
import { Progress as ProgressBar } from "@/components/ui/progress";
import {
  goalProgress,
  habitStreak,
  projectProgress,
  useGoals,
  useHabits,
  useProjects,
  useTasks,
} from "@/lib/store";
import { cn } from "@/lib/utils";
import {
  CheckCircle2,
  Flame,
  ListChecks,
  Target,
  TrendingUp,
} from "lucide-react";
import { useMemo } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { useTheme } from "@/hooks/use-theme";
import { useI18n } from "@/lib/i18n";

export default function Progress() {
  const { t } = useI18n();
  const tasks = useTasks();
  const habits = useHabits();
  const projects = useProjects();
  const goals = useGoals();
  const { resolved } = useTheme();

  const today = todayKey();

  const weekData = useMemo(() => {
    const days: { day: string; done: number; added: number }[] = [];
    for (let i = 6; i >= 0; i--) {
      const key = addDaysKey(today, -i);
      const label = formatDateKey(key, "EEEEEE").replace(".", "");
      days.push({
        day: label,
        done: tasks.filter(
          (t) => t.completedAt && toLocalDateKey(new Date(t.completedAt)) === key,
        ).length,
        added: tasks.filter(
          (t) => toLocalDateKey(new Date(t.createdAt)) === key,
        ).length,
      });
    }
    return days;
  }, [tasks, today]);

  const doneToday = weekData[weekData.length - 1]?.done ?? 0;
  const doneWeek = weekData.reduce((s, d) => s + d.done, 0);
  const weekTasks = tasks.filter(
    (t) =>
      t.completedAt &&
      toLocalDateKey(new Date(t.completedAt)) >= addDaysKey(today, -6),
  ).length;
  const completionPct = tasks.length
    ? Math.round((tasks.filter((t) => t.status === "completed").length / tasks.length) * 100)
    : 0;
  const completedRuns = new Set(
    tasks.filter((t) => t.status === "completed" && t.processRunId).map((t) => t.processRunId),
  ).size;

  const topStreaks = [...habits]
    .map((h) => ({ name: h.name, streak: habitStreak(h), color: h.color }))
    .sort((a, b) => b.streak - a.streak)
    .slice(0, 5);

  const estMinutes = tasks
    .filter((t) => t.status === "completed" && t.completedAt && toLocalDateKey(new Date(t.completedAt)) >= addDaysKey(today, -6))
    .reduce(
      (sum, t) =>
        sum +
        (t.processId
          ? 0
          : 25), // rough 25min per task placeholder for time-tracking
      0,
    );

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">{t("progress.title")}</h1>
        <p className="text-sm text-muted-foreground">{t("progress.subtitle")}</p>
      </div>

      {/* KPI cards */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {[
          {
            label: t("progress.doneToday"),
            value: doneToday,
            icon: CheckCircle2,
            tint: "text-emerald-500",
          },
          { label: t("progress.doneWeek"), value: doneWeek, icon: TrendingUp, tint: "text-primary" },
          {
            label: t("progress.completion"),
            value: `${completionPct}%`,
            icon: ListChecks,
            tint: "text-sky-500",
          },
          {
            label: t("progress.processes"),
            value: completedRuns,
            icon: Target,
            tint: "text-violet-500",
          },
        ].map((kpi) => (
          <div
            key={kpi.label}
            className="card-soft rounded-2xl border border-border/70 bg-card p-4"
          >
            <kpi.icon className={cn("size-4", kpi.tint)} />
            <p className="mt-2 text-2xl font-extrabold tracking-tight">{kpi.value}</p>
            <p className="text-[11px] text-muted-foreground">{kpi.label}</p>
          </div>
        ))}
      </div>

      {/* Weekly chart */}
      <div className="card-soft rounded-2xl border border-border/70 bg-card p-4">
        <p className="pb-3 text-sm font-semibold">{t("progress.last7")}</p>
        <div className="h-52">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={weekData} barGap={2}>
              <CartesianGrid
                strokeDasharray="3 3"
                vertical={false}
                stroke={resolved === "dark" ? "#333" : "#eee"}
              />
              <XAxis
                dataKey="day"
                tickLine={false}
                axisLine={false}
                tick={{ fontSize: 11 }}
                stroke="currentColor"
                className="text-muted-foreground"
              />
              <YAxis
                allowDecimals={false}
                width={24}
                tickLine={false}
                axisLine={false}
                tick={{ fontSize: 11 }}
                stroke="currentColor"
              />
              <Tooltip
                cursor={{ fill: "rgba(128,128,128,0.08)" }}
                contentStyle={{
                  borderRadius: 12,
                  border: "1px solid rgba(128,128,128,0.2)",
                  fontSize: 12,
                  background: resolved === "dark" ? "#26252f" : "#fff",
                }}
              />
              <Bar dataKey="done" name={t("progress.completed")} fill="#6366f1" radius={[6, 6, 0, 0]} />
              <Bar dataKey="added" name={t("progress.created")} fill="#c7d2fe" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="grid gap-3 lg:grid-cols-2">
        {/* Habit streaks */}
        <div className="card-soft rounded-2xl border border-border/70 bg-card p-4">
          <p className="pb-3 text-sm font-semibold">{t("progress.streaks")}</p>
          <div className="space-y-2.5">
            {topStreaks.map((h) => (
              <div key={h.name} className="flex items-center gap-3">
                <Flame className="size-4 shrink-0 text-amber-500" />
                <span className="flex-1 truncate text-sm">{h.name}</span>
                <span className="text-sm font-bold">{h.streak}d</span>
              </div>
            ))}
            {topStreaks.length === 0 && (
              <p className="text-xs text-muted-foreground">{t("progress.noHabits")}</p>
            )}
          </div>
        </div>

        {/* Time focus */}
        <div className="card-soft rounded-2xl border border-border/70 bg-card p-4">
          <p className="pb-1 text-sm font-semibold">{t("progress.timeTasks")}</p>
          <p className="pb-3 text-[11px] text-muted-foreground">
            {t("progress.focusedWeek", { hours: (estMinutes / 60).toFixed(1) })}
          </p>
          <div className="space-y-2.5">
            {projects.slice(0, 4).map((p) => (
              <div key={p.id}>
                <div className="flex items-center justify-between text-xs">
                  <span className="truncate font-medium">{p.name}</span>
                  <span className="text-muted-foreground">
                    {projectProgress(tasks, p.id)}%
                  </span>
                </div>
                <ProgressBar value={projectProgress(tasks, p.id)} className="mt-1 h-1.5" />
              </div>
            ))}
            {projects.length === 0 && (
              <p className="text-xs text-muted-foreground">{t("progress.noProjects")}</p>
            )}
          </div>
        </div>
      </div>

      {/* Goal progress */}
      <div className="card-soft rounded-2xl border border-border/70 bg-card p-4">
        <p className="pb-3 text-sm font-semibold">{t("progress.goalProgress")}</p>
        <div className="grid gap-3 sm:grid-cols-2">
          {goals.map((g) => {
            const pct = goalProgress(tasks, projects, g.id);
            return (
              <div key={g.id} className="flex items-center gap-3">
                <div className="relative size-11 shrink-0">
                  <svg viewBox="0 0 36 36" className="size-11 -rotate-90">
                    <circle
                      cx="18"
                      cy="18"
                      r="15.5"
                      fill="none"
                      strokeWidth="3.5"
                      className="text-muted"
                      stroke="currentColor"
                    />
                    <circle
                      cx="18"
                      cy="18"
                      r="15.5"
                      fill="none"
                      strokeWidth="3.5"
                      strokeLinecap="round"
                      strokeDasharray={`${(pct / 100) * 97.4} 97.4`}
                      stroke={g.color ?? "#6366f1"}
                    />
                  </svg>
                  <span className="absolute inset-0 flex items-center justify-center text-[10px] font-bold">
                    {pct}%
                  </span>
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold">{g.title}</p>
                  <p className="text-xs text-muted-foreground">
                    {t("progress.linkedProjects", { n: projects.filter((p) => p.goalId === g.id).length })}
                  </p>
                </div>
              </div>
            );
          })}
          {goals.length === 0 && (
            <p className="text-xs text-muted-foreground">{t("progress.noGoals")}</p>
          )}
        </div>
      </div>
    </div>
  );
}
