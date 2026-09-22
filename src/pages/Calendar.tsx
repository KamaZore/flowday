import { TaskRow } from "@/components/app/tasks/TaskRow";
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
  addDaysKey,
  buildMonthGrid,
  formatDateKey,
  recurrenceMatches,
  todayKey,
  weekdayHeaders,
} from "@/lib/date-utils";
import {
  addEvent,
  deleteEvent,
  useCalendarEvents,
  useHabits,
  useTasks,
  useSettings,
} from "@/lib/store";
import { cn } from "@/lib/utils";
import {
  CalendarPlus,
  CalendarDays as CalIcon,
  ChevronLeft,
  ChevronRight,
  MapPin,
  Repeat2,
  Trash2,
} from "lucide-react";
import { useMemo, useState } from "react";
import { toast } from "sonner";

export default function CalendarPage() {
  const tasks = useTasks();
  const habits = useHabits();
  const events = useCalendarEvents();
  const settings = useSettings();
  const [month, setMonth] = useState(() => {
    const d = new Date();
    return new Date(d.getFullYear(), d.getMonth(), 1);
  });
  const [selected, setSelected] = useState(todayKey());
  const [eventDialog, setEventDialog] = useState(false);
  const [newEventTitle, setNewEventTitle] = useState("");
  const [newEventTime, setNewEventTime] = useState("");
  const [newEventKind, setNewEventKind] = useState<"event" | "deadline">("event");

  const weeks = useMemo(
    () => buildMonthGrid(month, settings.weekStartsMonday),
    [month, settings.weekStartsMonday],
  );

  const monthTasks = useMemo(() => {
    const map = new Map<string, { tasks: number; habits: number; events: number }>();
    for (const week of weeks) {
      for (const day of week) {
        const key = toLocalDateKeySafe(day);
        map.set(key, {
          tasks: tasks.filter((t) => t.dueDate === key && t.status !== "inbox").length,
          habits: habits.filter(
            (h) => recurrenceMatches(h.schedule, key),
          ).length,
          events: events.filter((e) => e.date === key).length,
        });
      }
    }
    return map;
  }, [weeks, tasks, habits, events]);

  const selectedTasks = tasks
    .filter((t) => t.dueDate === selected && t.status !== "inbox")
    .sort((a, b) => (a.dueTime ?? "99") < (b.dueTime ?? "99") ? -1 : 1);
  const selectedEvents = events.filter((e) => e.date === selected);
  const selectedHabits = habits.filter((h) => recurrenceMatches(h.schedule, selected));

  const shiftMonth = (dir: number) => {
    setMonth((m) => new Date(m.getFullYear(), m.getMonth() + dir, 1));
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Calendar</h1>
          <p className="text-sm text-muted-foreground">
            Tasks, habits and events at a glance
          </p>
        </div>
      </div>

      <div className="card-soft rounded-2xl border border-border/70 bg-card p-4">
        {/* Month header */}
        <div className="mb-3 flex items-center justify-between">
          <button
            onClick={() => shiftMonth(-1)}
            className="rounded-lg p-1.5 text-muted-foreground hover:bg-muted"
            aria-label="Previous month"
          >
            <ChevronLeft className="size-5" />
          </button>
          <h2 className="text-sm font-bold">
            {month.toLocaleDateString("en-US", { month: "long", year: "numeric" })}
          </h2>
          <button
            onClick={() => shiftMonth(1)}
            className="rounded-lg p-1.5 text-muted-foreground hover:bg-muted"
            aria-label="Next month"
          >
            <ChevronRight className="size-5" />
          </button>
        </div>

        {/* Weekday header */}
        <div className="grid grid-cols-7 gap-1 pb-1">
          {weekdayHeaders(settings.weekStartsMonday).map((d, i) => (
            <div
              key={i}
              className="text-center text-[10px] font-semibold uppercase tracking-wide text-muted-foreground"
            >
              {d}
            </div>
          ))}
        </div>

        {/* Grid */}
        <div className="grid grid-cols-7 gap-1">
          {weeks.flat().map((day) => {
            const key = toLocalDateKeySafe(day);
            const counts = monthTasks.get(key)!;
            const isCurrentMonth = day.getMonth() === month.getMonth();
            const isToday = key === todayKey();
            const isSelected = key === selected;
            return (
              <button
                key={key}
                onClick={() => setSelected(key)}
                className={cn(
                  "flex aspect-square flex-col items-center justify-start gap-0.5 rounded-xl border p-1 transition-colors",
                  isCurrentMonth ? "bg-card" : "bg-muted/30 text-muted-foreground/50",
                  isSelected
                    ? "border-primary bg-primary/10"
                    : "border-transparent hover:bg-muted/50",
                )}
              >
                <span
                  className={cn(
                    "flex size-6 items-center justify-center rounded-full text-xs font-semibold",
                    isToday && "bg-primary text-primary-foreground",
                  )}
                >
                  {day.getDate()}
                </span>
                <div className="flex items-center gap-0.5">
                  {counts.tasks > 0 && (
                    <span className="size-1.5 rounded-full bg-primary" />
                  )}
                  {counts.habits > 0 && (
                    <span className="size-1.5 rounded-full bg-emerald-500" />
                  )}
                  {counts.events > 0 && (
                    <span className="size-1.5 rounded-full bg-amber-500" />
                  )}
                </div>
              </button>
            );
          })}
        </div>

        {/* Legend */}
        <div className="mt-3 flex items-center justify-center gap-4 border-t border-border/60 pt-3 text-[10px] text-muted-foreground">
          <span className="flex items-center gap-1">
            <span className="size-1.5 rounded-full bg-primary" /> Tasks
          </span>
          <span className="flex items-center gap-1">
            <span className="size-1.5 rounded-full bg-emerald-500" /> Habits
          </span>
          <span className="flex items-center gap-1">
            <span className="size-1.5 rounded-full bg-amber-500" /> Events
          </span>
        </div>
      </div>

      {/* Day detail */}
      <div className="card-soft rounded-2xl border border-border/70 bg-card p-4">
        <div className="flex items-center justify-between pb-3">
          <h2 className="text-sm font-bold">{formatDateKey(selected, "EEEE, MMMM d")}</h2>
          <Button
            variant="outline"
            size="sm"
            className="rounded-lg"
            onClick={() => setEventDialog(true)}
          >
            <CalendarPlus className="mr-1 size-3.5" /> Event
          </Button>
        </div>

        {/* Events */}
        {selectedEvents.length > 0 && (
          <div className="mb-3 space-y-1.5">
            {selectedEvents.map((ev) => (
              <div
                key={ev.id}
                className={cn(
                  "flex items-center gap-2.5 rounded-xl px-3 py-2",
                  ev.kind === "deadline"
                    ? "bg-rose-500/10 text-rose-600 dark:text-rose-400"
                    : "bg-amber-500/10 text-amber-700 dark:text-amber-400",
                )}
              >
                {ev.kind === "deadline" ? (
                  <MapPin className="size-4 shrink-0" />
                ) : (
                  <CalIcon className="size-4 shrink-0" />
                )}
                <span className="flex-1 truncate text-sm font-medium">{ev.title}</span>
                {ev.time && <span className="text-xs">{ev.time}</span>}
                <button
                  onClick={() => deleteEvent(ev.id)}
                  className="opacity-60 hover:opacity-100"
                  aria-label="Delete event"
                >
                  <Trash2 className="size-3.5" />
                </button>
              </div>
            ))}
          </div>
        )}

        {/* Habits scheduled */}
        {selectedHabits.length > 0 && (
          <div className="mb-3">
            <p className="mb-1.5 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
              Habits
            </p>
            <div className="flex flex-wrap gap-1.5">
              {selectedHabits.map((h) => (
                <span
                  key={h.id}
                  className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 px-2.5 py-1 text-xs font-medium text-emerald-600 dark:text-emerald-400"
                >
                  <Repeat2 className="size-3" />
                  {h.name}
                  {h.completions.includes(selected) && " ✓"}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Tasks */}
        <p className="mb-1.5 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
          Tasks
        </p>
        <div className="space-y-2">
          {selectedTasks.map((t) => (
            <TaskRow key={t.id} task={t} compact />
          ))}
          {selectedTasks.length === 0 && (
            <p className="py-3 text-center text-xs text-muted-foreground">
              No tasks scheduled.
            </p>
          )}
        </div>
      </div>

      {/* Add event dialog */}
      <Dialog open={eventDialog} onOpenChange={setEventDialog}>
        <DialogContent className="card-soft rounded-3xl p-0 sm:max-w-sm">
          <DialogHeader className="px-5 pt-5">
            <DialogTitle>New event on {formatDateKey(selected, "MMM d")}</DialogTitle>
          </DialogHeader>
          <div className="space-y-3 px-5 pb-6">
            <div className="space-y-1.5">
              <Label>Title</Label>
              <Input
                autoFocus
                value={newEventTitle}
                onChange={(e) => setNewEventTitle(e.target.value)}
                placeholder="e.g. Dentist appointment"
                className="h-10 rounded-xl"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Time</Label>
                <Input
                  type="time"
                  value={newEventTime}
                  onChange={(e) => setNewEventTime(e.target.value)}
                  className="h-10 rounded-xl"
                />
              </div>
              <div className="space-y-1.5">
                <Label>Type</Label>
                <Select
                  value={newEventKind}
                  onValueChange={(v) => setNewEventKind(v as "event" | "deadline")}
                >
                  <SelectTrigger className="rounded-xl">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="event">Event</SelectItem>
                    <SelectItem value="deadline">Deadline</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="ghost" className="rounded-xl" onClick={() => setEventDialog(false)}>
                Cancel
              </Button>
              <Button
                className="rounded-xl"
                onClick={() => {
                  if (!newEventTitle.trim()) return;
                  addEvent({
                    title: newEventTitle.trim(),
                    date: selected,
                    time: newEventTime || undefined,
                    kind: newEventKind,
                  });
                  toast.success("Event added");
                  setNewEventTitle("");
                  setNewEventTime("");
                  setEventDialog(false);
                }}
              >
                Add event
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// small shim so the import stays local
function toLocalDateKeySafe(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}
