import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  addHabit,
  deleteHabit,
  habitBestStreak,
  habitStreak,
  toggleHabitDate,
  updateHabit,
  useHabits,
} from "@/lib/store";
import type { Habit, Recurrence } from "@/lib/types";
import { cn } from "@/lib/utils";
import { toLocalDateKey, todayKey, addDaysKey } from "@/lib/date-utils";
import {
  Check,
  CheckCircle2,
  Circle,
  Flame,
  Pencil,
  Plus,
  Trash2,
} from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";

const HABIT_COLORS = ["#10b981", "#0ea5e9", "#8b5cf6", "#f59e0b", "#ef4444", "#ec4899"];

function lastDays(n: number): string[] {
  const out: string[] = [];
  for (let i = n - 1; i >= 0; i--) out.push(addDaysKey(todayKey(), -i));
  return out;
}

function HabitHeatmap({ habit, days = 91 }: { habit: Habit; days?: number }) {
  const cells = lastDays(days);
  const done = new Set(habit.completions);
  return (
    <div className="flex flex-wrap gap-[3px]">
      {cells.map((d) => (
        <button
          key={d}
          title={d}
          onClick={() => toggleHabitDate(habit.id, d)}
          className={cn(
            "size-3.5 rounded-[4px] transition-colors",
            done.has(d)
              ? "bg-emerald-500/90 hover:bg-emerald-400"
              : "bg-muted hover:bg-muted-foreground/25",
          )}
        />
      ))}
    </div>
  );
}

function WeekDots({ habit }: { habit: Habit }) {
  const week = lastDays(7);
  const done = new Set(habit.completions);
  return (
    <div className="flex gap-1.5">
      {week.map((d) => (
        <button
          key={d}
          onClick={() => toggleHabitDate(habit.id, d)}
          className={cn(
            "flex size-7 items-center justify-center rounded-full border text-[10px] font-semibold transition-colors",
            done.has(d)
              ? "border-transparent bg-emerald-500 text-white"
              : "text-muted-foreground hover:bg-muted",
          )}
          title={d}
        >
          {done.has(d) ? <Check className="size-3.5" /> : d.slice(8)}
        </button>
      ))}
    </div>
  );
}

export default function Habits() {
  const habits = useHabits();
  const [editorOpen, setEditorOpen] = useState(false);
  const [editing, setEditing] = useState<Habit | null>(null);
  const today = todayKey();

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Habits</h1>
          <p className="text-sm text-muted-foreground">
            Small daily reps compound
          </p>
        </div>
        <Button
          onClick={() => {
            setEditing(null);
            setEditorOpen(true);
          }}
          className="gap-1.5 rounded-xl"
        >
          <Plus className="size-4" /> New habit
        </Button>
      </div>

      <div className="grid gap-3 lg:grid-cols-2">
        {habits.map((habit) => {
          const doneToday = habit.completions.includes(today);
          const streak = habitStreak(habit);
          const best = habitBestStreak(habit);
          const last30 = lastDays(30);
          const monthPct = Math.round(
            (last30.filter((d) => habit.completions.includes(d)).length / 30) * 100,
          );
          return (
            <div
              key={habit.id}
              className="card-soft rounded-2xl border border-border/70 bg-card p-4"
            >
              <div className="flex items-center gap-3">
                {/* Big toggle */}
                <button
                  onClick={() => toggleHabitDate(habit.id, today)}
                  className={cn(
                    "flex size-12 shrink-0 items-center justify-center rounded-2xl transition-all active:scale-95",
                    doneToday
                      ? "bg-emerald-500 text-white shadow-sm"
                      : "border-2 border-dashed border-muted-foreground/30 text-muted-foreground/50 hover:border-emerald-400 hover:text-emerald-500",
                  )}
                  aria-label={doneToday ? "Mark not done" : "Mark done today"}
                >
                  {doneToday ? (
                    <Check className="size-6" />
                  ) : (
                    <Plus className="size-5" />
                  )}
                </button>

                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span
                      className="size-2.5 shrink-0 rounded-full"
                      style={{ backgroundColor: habit.color ?? "#10b981" }}
                    />
                    <p className="truncate text-sm font-semibold">{habit.name}</p>
                  </div>
                  <div className="mt-0.5 flex items-center gap-3 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1 font-semibold text-amber-500">
                      <Flame className="size-3.5" /> {streak}d streak
                    </span>
                    <span>Best {best}d</span>
                    <span>{monthPct}% / 30d</span>
                  </div>
                </div>

                <div className="flex shrink-0 gap-1">
                  <button
                    onClick={() => {
                      setEditing(habit);
                      setEditorOpen(true);
                    }}
                    className="p-1 text-muted-foreground/60 hover:text-foreground"
                    aria-label="Edit habit"
                  >
                    <Pencil className="size-4" />
                  </button>
                  <button
                    onClick={() => {
                      if (confirm(`Delete "${habit.name}"?`)) {
                        deleteHabit(habit.id);
                        toast.success("Habit deleted");
                      }
                    }}
                    className="p-1 text-muted-foreground/60 hover:text-destructive"
                    aria-label="Delete habit"
                  >
                    <Trash2 className="size-4" />
                  </button>
                </div>
              </div>

              <div className="mt-3">
                <WeekDots habit={habit} />
              </div>

              <div className="mt-3 border-t border-border/60 pt-3">
                <p className="mb-1.5 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
                  Last 12 weeks · tap a day to toggle
                </p>
                <HabitHeatmap habit={habit} />
              </div>
            </div>
          );
        })}
        {habits.length === 0 && (
          <div className="card-soft col-span-full flex flex-col items-center justify-center rounded-2xl border border-dashed py-14 text-center">
            <CheckCircle2 className="mb-2 size-8 text-muted-foreground/50" />
            <p className="text-sm font-medium">No habits yet</p>
            <p className="mt-1 text-xs text-muted-foreground">
              Start with one small daily action.
            </p>
          </div>
        )}
      </div>

      <HabitEditor open={editorOpen} onOpenChange={setEditorOpen} habit={editing} />
    </div>
  );
}

function HabitEditor({
  open,
  onOpenChange,
  habit,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  habit: Habit | null;
}) {
  const [name, setName] = useState("");
  const [recurrence, setRecurrence] = useState("daily");
  const [weekdays, setWeekdays] = useState<number[]>([]);
  const [timeOfDay, setTimeOfDay] = useState<"anytime" | "morning" | "afternoon" | "evening">("anytime");
  const [color, setColor] = useState(HABIT_COLORS[0]);

  useEffect(() => {
    if (!open) return;
    setName(habit?.name ?? "");
    setRecurrence(habit?.schedule?.type ?? "daily");
    setWeekdays(habit?.schedule?.type === "weekly" ? habit.schedule.weekdays ?? [] : []);
    setTimeOfDay(habit?.timeOfDay ?? "anytime");
    setColor(habit?.color ?? HABIT_COLORS[0]);
  }, [open, habit]);

  const buildRecurrence = (): Recurrence => {
    if (recurrence === "weekly") return { type: "weekly", weekdays };
    return { type: recurrence } as Recurrence;
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="card-soft rounded-3xl p-0 sm:max-w-md">
        <DialogHeader className="px-5 pt-5">
          <DialogTitle>{habit ? "Edit habit" : "New habit"}</DialogTitle>
        </DialogHeader>
        <div className="space-y-3 px-5 pb-6">
          <div className="space-y-1.5">
            <Label>Name</Label>
            <Input
              autoFocus
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Read 20 pages"
              className="h-10 rounded-xl"
            />
          </div>
          <div className="space-y-1.5">
            <Label>Repeat</Label>
            <Select value={recurrence} onValueChange={setRecurrence}>
              <SelectTrigger className="rounded-xl">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="daily">Every day</SelectItem>
                <SelectItem value="weekdays">Weekdays</SelectItem>
                <SelectItem value="weekly">Custom weekly…</SelectItem>
              </SelectContent>
            </Select>
            {recurrence === "weekly" && (
              <div className="flex gap-1 pt-1">
                {["S", "M", "T", "W", "T", "F", "S"].map((lbl, idx) => (
                  <button
                    key={idx}
                    onClick={() =>
                      setWeekdays((wd) =>
                        wd.includes(idx)
                          ? wd.filter((x) => x !== idx)
                          : [...wd, idx],
                      )
                    }
                    className={cn(
                      "size-8 rounded-full border text-xs font-semibold",
                      weekdays.includes(idx)
                        ? "border-primary bg-primary text-primary-foreground"
                        : "text-muted-foreground hover:bg-muted",
                    )}
                  >
                    {lbl}
                  </button>
                ))}
              </div>
            )}
          </div>
          <div className="space-y-1.5">
            <Label>Time of day</Label>
            <Select
              value={timeOfDay}
              onValueChange={(v) => setTimeOfDay(v as typeof timeOfDay)}
            >
              <SelectTrigger className="rounded-xl">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="anytime">Anytime</SelectItem>
                <SelectItem value="morning">Morning</SelectItem>
                <SelectItem value="afternoon">Afternoon</SelectItem>
                <SelectItem value="evening">Evening</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label>Color</Label>
            <div className="flex gap-2">
              {HABIT_COLORS.map((c) => (
                <button
                  key={c}
                  onClick={() => setColor(c)}
                  className={cn(
                    "size-7 rounded-full ring-offset-2 transition-all",
                    color === c && "ring-2 ring-primary ring-offset-background",
                  )}
                  style={{ backgroundColor: c }}
                  aria-label={`Color ${c}`}
                />
              ))}
            </div>
          </div>
          <div className="flex justify-end gap-2 pt-1">
            <Button variant="ghost" onClick={() => onOpenChange(false)} className="rounded-xl">
              Cancel
            </Button>
            <Button
              className="rounded-xl"
              onClick={() => {
                if (!name.trim()) return;
                if (habit) {
                  updateHabit(habit.id, {
                    name: name.trim(),
                    schedule: buildRecurrence(),
                    timeOfDay,
                    color,
                  });
                  toast.success("Habit updated");
                } else {
                  addHabit({
                    name: name.trim(),
                    schedule: buildRecurrence(),
                    timeOfDay,
                    color,
                  });
                  toast.success("Habit created");
                }
                onOpenChange(false);
              }}
            >
              {habit ? "Save" : "Create habit"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
