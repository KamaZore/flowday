import { QuickAddDialog, type QuickAddType } from "@/components/app/QuickAddDialog";
import { TaskEditor } from "@/components/app/tasks/TaskEditor";
import { TaskRow } from "@/components/app/tasks/TaskRow";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { formatDateKey, todayKey, addDaysKey } from "@/lib/date-utils";
import {
  habitStreak,
  recurrenceMatches,
  toggleHabitDate,
  toggleTask,
  useHabits,
  useProcesses,
  useTasks,
} from "@/lib/store";
import type { Task } from "@/lib/types";
import { cn } from "@/lib/utils";
import {
  AlarmClock,
  CalendarDays,
  CheckCircle2,
  Circle,
  Flame,
  ListChecks,
  Plus,
  Repeat2,
  Sun,
  Sunset,
  Moon,
} from "lucide-react";
import { useMemo, useState } from "react";
import { Link } from "react-router";

function greeting(): string {
  const h = new Date().getHours();
  if (h < 5) return "Good night";
  if (h < 12) return "Good morning";
  if (h < 17) return "Good afternoon";
  return "Good evening";
}

function greetingIcon() {
  const h = new Date().getHours();
  if (h < 5) return Moon;
  if (h < 17) return Sun;
  return Sunset;
}

export default function Today() {
  const tasks = useTasks();
  const habits = useHabits();
  const processes = useProcesses();
  const today = todayKey();
  const [editing, setEditing] = useState<Task | null>(null);
  const [editorOpen, setEditorOpen] = useState(false);
  const [quickOpen, setQuickOpen] = useState(false);
  const [quickType, setQuickType] = useState<QuickAddType>("task");

  const todaysTasks = useMemo(
    () =>
      tasks
        .filter((t) => t.dueDate === today && t.status !== "inbox")
        .sort((a, b) => {
          const aDone = a.status === "completed";
          const bDone = b.status === "completed";
          if (aDone !== bDone) return aDone ? 1 : -1;
          if (a.dueTime !== b.dueTime) {
            return (a.dueTime ?? "99") < (b.dueTime ?? "99") ? -1 : 1;
          }
          return a.order - b.order;
        }),
    [tasks, today],
  );

  const overdue = useMemo(
    () =>
      tasks.filter(
        (t) =>
          t.dueDate &&
          t.dueDate < today &&
          t.status !== "completed" &&
          t.status !== "inbox",
      ),
    [tasks, today],
  );

  const todayHabits = useMemo(
    () => habits.filter((h) => recurrenceMatches(h.schedule, today)),
    [habits, today],
  );

  const scheduledProcesses = useMemo(
    () =>
      processes.filter(
        (p) =>
          p.recurrence &&
          recurrenceMatches(p.recurrence, today) &&
          tasks.some(
            (t) =>
              t.processId === p.id &&
              t.dueDate === today &&
              t.status !== "completed",
          ),
      ),
    [processes, tasks, today],
  );

  const totalToday = todaysTasks.length;
  const doneToday = todaysTasks.filter((t) => t.status === "completed").length;
  const pct = totalToday ? Math.round((doneToday / totalToday) * 100) : 0;

  const openQuick = (type: QuickAddType) => {
    setQuickType(type);
    setQuickOpen(true);
  };

  const GreetingIcon = greetingIcon();

  return (
    <div className="space-y-5">
      {/* Greeting */}
      <div>
        <h1 className="flex items-center gap-2 text-2xl font-bold tracking-tight">
          {greeting()} <span>👋</span>
        </h1>
        <p className="text-sm text-muted-foreground">
          {formatDateKey(today, "EEEE, MMMM d")}
        </p>
      </div>

      {/* Progress card */}
      <div className="card-soft rounded-3xl border border-border/70 bg-card p-5">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-semibold">Today's progress</p>
            <p className="text-xs text-muted-foreground">
              {doneToday} of {totalToday} tasks done
              {overdue.length > 0 && ` · ${overdue.length} overdue`}
            </p>
          </div>
          <div className="text-right">
            <span className="text-3xl font-extrabold tracking-tight text-primary">
              {pct}%
            </span>
          </div>
        </div>
        <Progress value={pct} className="mt-3 h-2.5 rounded-full" />
        {overdue.length > 0 && (
          <div className="mt-3 rounded-2xl bg-destructive/10 p-3">
            <p className="flex items-center gap-1.5 text-xs font-semibold text-destructive">
              <AlarmClock className="size-3.5" />
              {overdue.length} overdue {overdue.length === 1 ? "task" : "tasks"}
            </p>
            <div className="mt-2 space-y-1.5">
              {overdue.slice(0, 3).map((t) => (
                <TaskRow key={t.id} task={t} onEdit={(x) => { setEditing(x); setEditorOpen(true); }} compact />
              ))}
              {overdue.length > 3 && (
                <Link
                  to="/tasks?filter=overdue"
                  className="block pt-1 text-xs font-medium text-destructive/80 hover:underline"
                >
                  View all overdue →
                </Link>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Quick actions */}
      <div className="no-scrollbar -mx-4 flex gap-2 overflow-x-auto px-4">
        <Button
          onClick={() => openQuick("task")}
          className="shrink-0 gap-1.5 rounded-full"
        >
          <Plus className="size-4" /> Add task
        </Button>
        {(
          [
            ["project", "New project"],
            ["process", "New process"],
            ["habit", "New habit"],
            ["goal", "New goal"],
          ] as [QuickAddType, string][]
        ).map(([type, label]) => (
          <Button
            key={type}
            variant="outline"
            onClick={() => openQuick(type)}
            className="shrink-0 rounded-full"
          >
            {label}
          </Button>
        ))}
      </div>

      {/* Today's tasks */}
      <section>
        <h2 className="mb-2 flex items-center gap-2 text-sm font-semibold text-muted-foreground">
          <ListChecks className="size-4" /> Today
        </h2>
        <div className="space-y-2">
          {todaysTasks.map((task) => (
            <TaskRow
              key={task.id}
              task={task}
              onEdit={(t) => {
                setEditing(t);
                setEditorOpen(true);
              }}
            />
          ))}
          {totalToday === 0 && (
            <button
              onClick={() => openQuick("task")}
              className="card-soft flex w-full items-center justify-center gap-2 rounded-2xl border border-dashed py-8 text-sm font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground"
            >
              <Plus className="size-4" /> Plan your day — add a task
            </button>
          )}
        </div>
      </section>

      {/* Habits */}
      {todayHabits.length > 0 && (
        <section>
          <h2 className="mb-2 flex items-center gap-2 text-sm font-semibold text-muted-foreground">
            <Flame className="size-4" /> Habits
          </h2>
          <div className="card-soft divide-y divide-border/60 rounded-2xl border border-border/70 bg-card">
            {todayHabits.map((h) => {
              const done = h.completions.includes(today);
              return (
                <button
                  key={h.id}
                  onClick={() => toggleHabitDate(h.id, today)}
                  className="flex w-full items-center gap-3 px-4 py-3 text-left transition-colors hover:bg-accent/50"
                >
                  {done ? (
                    <CheckCircle2 className="size-5 shrink-0 text-emerald-500" />
                  ) : (
                    <Circle className="size-5 shrink-0 text-muted-foreground/40" />
                  )}
                  <span
                    className={cn(
                      "flex-1 text-sm font-medium",
                      done && "text-muted-foreground line-through",
                    )}
                  >
                    {h.name}
                  </span>
                  <span className="flex items-center gap-1 text-xs font-semibold text-amber-500">
                    <Flame className="size-3.5" />
                    {habitStreak(h)}d
                  </span>
                </button>
              );
            })}
          </div>
        </section>
      )}

      {/* Processes running today */}
      {scheduledProcesses.length > 0 && (
        <section>
          <h2 className="mb-2 flex items-center gap-2 text-sm font-semibold text-muted-foreground">
            <Repeat2 className="size-4" /> Process routines
          </h2>
          <div className="space-y-2">
            {scheduledProcesses.map((p) => {
              const steps = tasks.filter(
                (t) => t.processId === p.id && t.dueDate === today,
              );
              const done = steps.filter((t) => t.status === "completed").length;
              return (
                <Link
                  key={p.id}
                  to={`/processes?id=${p.id}`}
                  className="card-soft block rounded-2xl border border-border/70 bg-card p-4 transition-colors hover:bg-accent/40"
                >
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-semibold">{p.name}</p>
                    <span className="text-xs font-medium text-muted-foreground">
                      {done}/{steps.length}
                    </span>
                  </div>
                  <Progress
                    value={steps.length ? (done / steps.length) * 100 : 0}
                    className="mt-2 h-1.5"
                  />
                </Link>
              );
            })}
          </div>
        </section>
      )}

      {/* Tomorrow peek */}
      <section>
        <h2 className="mb-2 flex items-center gap-2 text-sm font-semibold text-muted-foreground">
          <CalendarDays className="size-4" /> Tomorrow
        </h2>
        <div className="space-y-2 opacity-80">
          {tasks
            .filter((t) => t.dueDate === addDaysKey(today, 1) && t.status !== "inbox")
            .slice(0, 3)
            .map((task) => (
              <TaskRow key={task.id} task={task} onEdit={(t) => { setEditing(t); setEditorOpen(true); }} compact />
            ))}
        </div>
      </section>

      <TaskEditor open={editorOpen} onOpenChange={setEditorOpen} task={editing} />
      <QuickAddDialog open={quickOpen} onOpenChange={setQuickOpen} defaultType={quickType} />
    </div>
  );
}
