import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { parseCapture } from "@/lib/parse";
import {
  addGoal,
  addHabit,
  addNote,
  addProcess,
  addProject,
  addTask,
  ensureTagIds,
} from "@/lib/store";
import type { Recurrence } from "@/lib/types";
import { cn } from "@/lib/utils";
import {
  CalendarDays,
  CheckCircle2,
  CornerDownLeft,
  Flag,
  FolderKanban,
  Hash,
  ListTodo,
  Repeat2,
  Sparkles,
  StickyNote,
  Target,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";

type Kind = "task" | "project" | "process" | "habit" | "goal" | "note";

export type { Kind as QuickAddType };

const KINDS: { value: Kind; label: string; icon: typeof ListTodo }[] = [
  { value: "task", label: "Task", icon: ListTodo },
  { value: "project", label: "Project", icon: FolderKanban },
  { value: "process", label: "Process", icon: Repeat2 },
  { value: "habit", label: "Habit", icon: CheckCircle2 },
  { value: "goal", label: "Goal", icon: Target },
  { value: "note", label: "Note", icon: StickyNote },
];

export function QuickAddDialog({
  open,
  onOpenChange,
  defaultType = "task",
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  defaultType?: Kind;
}) {
  const [kind, setKind] = useState<Kind>(defaultType);
  const [text, setText] = useState("");
  const [projectBody, setProjectBody] = useState("");
  const [habitRecurrence, setHabitRecurrence] = useState<Recurrence>({
    type: "daily",
  });
  const [habitTime, setHabitTime] =
    useState<"anytime" | "morning" | "afternoon" | "evening">("anytime");

  useEffect(() => {
    if (open) {
      setKind(defaultType);
      setText("");
      setProjectBody("");
    }
  }, [open, defaultType]);

  const parsed = useMemo(
    () => (kind === "task" && text.trim() ? parseCapture(text) : null),
    [kind, text],
  );

  const createByKind = () => {
    const value = text.trim();
    if (!value) return;
    switch (kind) {
      case "task": {
        const p = parseCapture(value);
        addTask({
          title: p.title,
          dueDate: p.dueDate,
          dueTime: p.dueTime,
          priority: p.priority ?? "medium",
          status: p.dueDate ? "todo" : "inbox",
          tagIds: ensureTagIds(p.tagNames),
          recurrence: p.recurrence,
        });
        toast("Task added", {
          description: p.dueDate
            ? `Scheduled for ${p.dueDate}${p.dueTime ? ` at ${p.dueTime}` : ""}`
            : "Saved to Inbox — organize it later",
        });
        break;
      }
      case "project":
        addProject({ name: value, description: projectBody });
        toast.success("Project created");
        break;
      case "process": {
        const proc = addProcess({
          name: value,
          steps: [],
        });
        void proc;
        toast.success("Process created", {
          description: "Open Processes to add steps",
        });
        break;
      }
      case "habit":
        addHabit({
          name: value,
          schedule: habitRecurrence,
          timeOfDay: habitTime,
        });
        toast.success("Habit created");
        break;
      case "goal":
        addGoal({ title: value });
        toast.success("Goal created");
        break;
      case "note":
        addNote(value, projectBody);
        toast.success("Note saved");
        break;
    }
    setText("");
    setProjectBody("");
    onOpenChange(false);
  };

  const activeKind = KINDS.find((k) => k.value === kind)!;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="card-soft top-auto bottom-0 translate-y-0 gap-0 rounded-t-3xl p-0 sm:bottom-auto sm:top-1/2 sm:-translate-y-1/2 sm:rounded-3xl">
        <DialogHeader className="px-5 pb-3 pt-5">
          <DialogTitle className="flex items-center gap-2 text-base">
            <Sparkles className="size-4 text-primary" />
            Quick add
          </DialogTitle>
          <DialogDescription className="text-xs">
            Capture anything in seconds
          </DialogDescription>
        </DialogHeader>

        {/* Kind selector */}
        <div className="no-scrollbar flex gap-2 overflow-x-auto px-5 pb-3">
          {KINDS.map((k) => (
            <button
              key={k.value}
              onClick={() => setKind(k.value)}
              className={cn(
                "flex shrink-0 items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-medium transition-colors",
                kind === k.value
                  ? "border-primary bg-primary text-primary-foreground"
                  : "bg-muted/60 text-muted-foreground hover:bg-muted",
              )}
            >
              <k.icon className="size-3.5" />
              {k.label}
            </button>
          ))}
        </div>

        <div className="px-5 pb-5">
          {kind === "task" ? (
            <Input
              autoFocus
              value={text}
              onChange={(e) => setText(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  createByKind();
                }
              }}
              placeholder='e.g. "Call John tomorrow 3pm !high #errand"'
              className="h-11 rounded-xl"
            />
          ) : kind === "note" || kind === "project" ? (
            <div className="space-y-2">
              <Input
                autoFocus
                value={text}
                onChange={(e) => setText(e.target.value)}
                placeholder={kind === "note" ? "Note title" : "Project name"}
                className="h-11 rounded-xl"
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    createByKind();
                  }
                }}
              />
              <Textarea
                value={projectBody}
                onChange={(e) => setProjectBody(e.target.value)}
                placeholder={
                  kind === "note" ? "Write something…" : "Description (optional)"
                }
                className="min-h-20 rounded-xl"
              />
            </div>
          ) : (
            <div className="space-y-2">
              <Input
                autoFocus
                value={text}
                onChange={(e) => setText(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    createByKind();
                  }
                }}
                placeholder={
                  kind === "habit"
                    ? "Habit name — e.g. Read 20 minutes"
                    : kind === "process"
                      ? "Process name — e.g. Morning Routine"
                      : "Goal — e.g. Run a 10k"
                }
                className="h-11 rounded-xl"
              />
              {kind === "habit" && (
                <div className="flex flex-wrap items-center gap-2 pt-1">
                  <span className="text-xs text-muted-foreground">Repeat:</span>
                  {(
                    [
                      { label: "Daily", value: { type: "daily" } },
                      { label: "Weekdays", value: { type: "weekdays" } },
                      {
                        label: "Weekly",
                        value: { type: "weekly", weekdays: [] },
                      },
                    ] as { label: string; value: Recurrence }[]
                  ).map((opt) => (
                    <button
                      key={opt.label}
                      onClick={() => setHabitRecurrence(opt.value)}
                      className={cn(
                        "rounded-full border px-2.5 py-1 text-xs font-medium transition-colors",
                        JSON.stringify(habitRecurrence) ===
                          JSON.stringify(opt.value)
                          ? "border-primary bg-primary/10 text-primary"
                          : "text-muted-foreground hover:bg-muted",
                      )}
                    >
                      {opt.label}
                    </button>
                  ))}
                  <span className="ml-2 text-xs text-muted-foreground">Time:</span>
                  {(
                    [
                      "anytime",
                      "morning",
                      "afternoon",
                      "evening",
                    ] as const
                  ).map((t) => (
                    <button
                      key={t}
                      onClick={() => setHabitTime(t)}
                      className={cn(
                        "rounded-full border px-2.5 py-1 text-xs font-medium capitalize transition-colors",
                        habitTime === t
                          ? "border-primary bg-primary/10 text-primary"
                          : "text-muted-foreground hover:bg-muted",
                      )}
                    >
                      {t}
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Smart-parse preview chips */}
          {parsed && (parsed.dueDate || parsed.dueTime || parsed.priority || parsed.recurrence || parsed.tagNames.length > 0) && (
            <div className="mt-3 flex flex-wrap items-center gap-1.5 text-[11px]">
              {parsed.dueDate && (
                <span className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-2 py-0.5 font-medium text-primary">
                  <CalendarDays className="size-3" />
                  {parsed.dueDate}
                </span>
              )}
              {parsed.dueTime && (
                <span className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-2 py-0.5 font-medium text-primary">
                  <Flag className="size-3" />
                  {parsed.dueTime}
                </span>
              )}
              {parsed.priority && (
                <span className="inline-flex items-center gap-1 rounded-full bg-amber-500/15 px-2 py-0.5 font-medium text-amber-600 dark:text-amber-400">
                  {parsed.priority}
                </span>
              )}
              {parsed.recurrence && (
                <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/15 px-2 py-0.5 font-medium text-emerald-600 dark:text-emerald-400">
                  <Repeat2 className="size-3" /> repeats
                </span>
              )}
              {parsed.tagNames.map((t) => (
                <span
                  key={t}
                  className="inline-flex items-center gap-1 rounded-full bg-muted px-2 py-0.5 font-medium text-muted-foreground"
                >
                  <Hash className="size-3" />
                  {t}
                </span>
              ))}
              <span className="text-muted-foreground/70">
                detected — press Enter to save
              </span>
              <CornerDownLeft className="size-3 text-muted-foreground/70" />
            </div>
          )}

          <div className="mt-4 flex justify-end gap-2">
            <Button
              variant="ghost"
              onClick={() => onOpenChange(false)}
              className="rounded-xl"
            >
              Cancel
            </Button>
            <Button
              onClick={createByKind}
              disabled={!text.trim()}
              className="gap-1.5 rounded-xl"
            >
              <activeKind.icon className="size-4" />
              Add {activeKind.label.toLowerCase()}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
