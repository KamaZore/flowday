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
import { Progress } from "@/components/ui/progress";
import { Textarea } from "@/components/ui/textarea";
import { formatDateKey } from "@/lib/date-utils";
import {
  addGoal,
  deleteGoal,
  goalProgress,
  updateGoal,
  useGoals,
  useProcesses,
  useProjects,
  useTasks,
} from "@/lib/store";
import type { Goal } from "@/lib/types";
import { cn } from "@/lib/utils";
import {
  ChevronDown,
  ListChecks,
  Pencil,
  Plus,
  Repeat2,
  Target,
  Trash2,
} from "lucide-react";
import { useEffect, useState } from "react";
import { useI18n } from "@/lib/i18n";
import { toast } from "sonner";

const COLORS = ["#6366f1", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6", "#0ea5e9", "#ec4899", "#14b8a6"];

export default function Goals() {
  const { t } = useI18n();
  const goals = useGoals();
  const projects = useProjects();
  const processes = useProcesses();
  const tasks = useTasks();
  const [editorOpen, setEditorOpen] = useState(false);
  const [editing, setEditing] = useState<Goal | null>(null);
  const [expanded, setExpanded] = useState<string | null>(null);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">{t("goals.title")}</h1>
          <p className="text-sm text-muted-foreground">{t("goals.subtitle")}</p>
        </div>
        <Button
          onClick={() => {
            setEditing(null);
            setEditorOpen(true);
          }}
          className="gap-1.5 rounded-xl"
        >
          <Plus className="size-4" /> {t("goals.new")}
        </Button>
      </div>

      <div className="space-y-3">
        {goals.map((g) => {
          const pct = goalProgress(tasks, projects, g.id);
          const gProjects = projects.filter((p) => p.goalId === g.id);
          const gProcesses = processes.filter(
            (p) => p.tagIds.some((t) => gProjects.some((pr) => pr.id === p.id)) || false,
          );
          const gTasks = tasks.filter(
            (t) =>
              t.goalId === g.id ||
              (t.projectId && gProjects.some((p) => p.id === t.projectId)),
          );
          const doneTasks = gTasks.filter((t) => t.status === "completed").length;
          const isExpanded = expanded === g.id;
          return (
            <div
              key={g.id}
              className="card-soft overflow-hidden rounded-2xl border border-border/70 bg-card"
            >
              <div className="flex items-center gap-4 p-4">
                {/* Progress ring */}
                <div className="relative size-14 shrink-0">
                  <svg viewBox="0 0 36 36" className="size-14 -rotate-90">
                    <circle
                      cx="18"
                      cy="18"
                      r="15.5"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="3.5"
                      className="text-muted"
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
                  <span className="absolute inset-0 flex items-center justify-center text-xs font-bold">
                    {pct}%
                  </span>
                </div>

                <button
                  className="min-w-0 flex-1 text-left"
                  onClick={() => setExpanded(isExpanded ? null : g.id)}
                >
                  <div className="flex items-center gap-2">
                    <Target className="size-4 shrink-0" style={{ color: g.color }} />
                    <span className="truncate text-sm font-semibold">{g.title}</span>
                  </div>
                  <p className="mt-0.5 text-xs text-muted-foreground">
                    {t("goals.projects", { n: gProjects.length })} ·{" "}
                    {t("goals.tasksDone", { done: doneTasks, total: gTasks.length })}
                    {g.targetDate && ` · ${t("goals.by", { date: formatDateKey(g.targetDate, "MMM yyyy") })}`}
                  </p>
                </button>

                <div className="flex shrink-0 items-center gap-1">
                  <button
                    onClick={() => {
                      setEditing(g);
                      setEditorOpen(true);
                    }}
                    className="text-muted-foreground/60 hover:text-foreground"
                    aria-label="Edit goal"
                  >
                    <Pencil className="size-4" />
                  </button>
                  <button
                    onClick={() => {
                      if (confirm(`Delete "${g.title}"? Projects stay.`)) {
                        deleteGoal(g.id);
                        toast.success("Goal deleted");
                      }
                    }}
                    className="text-muted-foreground/60 hover:text-destructive"
                    aria-label="Delete goal"
                  >
                    <Trash2 className="size-4" />
                  </button>
                  <button
                    onClick={() => setExpanded(isExpanded ? null : g.id)}
                    aria-label="Toggle details"
                  >
                    <ChevronDown
                      className={cn(
                        "size-4 text-muted-foreground transition-transform",
                        isExpanded && "rotate-180",
                      )}
                    />
                  </button>
                </div>
              </div>

              {isExpanded && (
                <div className="border-t border-border/60 bg-muted/30 px-4 py-3">
                  {g.description && (
                    <p className="pb-2 text-xs text-muted-foreground">{g.description}</p>
                  )}
                  <div className="grid gap-3 sm:grid-cols-2">
                    <div>
                      <p className="mb-1.5 flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                        <ListChecks className="size-3" /> {t("goals.tasks")}
                      </p>
                      <div className="space-y-1.5">
                        {gTasks.slice(0, 5).map((t) => (
                          <TaskRow key={t.id} task={t} compact />
                        ))}
                        {gTasks.length === 0 && (
                          <p className="text-xs text-muted-foreground">
                            No tasks linked yet.
                          </p>
                        )}
                      </div>
                    </div>
                    <div>
                      <p className="mb-1.5 flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                        <Repeat2 className="size-3" /> Projects
                      </p>
                      <div className="space-y-1.5">
                        {gProjects.map((p) => {
                          const pp = tasks.filter(
                            (t) => t.projectId === p.id,
                          );
                          const done = pp.filter((t) => t.status === "completed").length;
                          return (
                            <div
                              key={p.id}
                              className="flex items-center gap-2 rounded-xl bg-card px-3 py-2"
                            >
                              <span
                                className="size-2 rounded-full"
                                style={{ backgroundColor: p.color }}
                              />
                              <span className="flex-1 truncate text-xs font-medium">
                                {p.name}
                              </span>
                              <span className="text-xs text-muted-foreground">
                                {done}/{pp.length}
                              </span>
                            </div>
                          );
                        })}
                        {gProjects.length === 0 && (
                          <p className="text-xs text-muted-foreground">
                            No projects linked yet.
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          );
        })}
        {goals.length === 0 && (
          <div className="card-soft flex flex-col items-center justify-center rounded-2xl border border-dashed py-14 text-center">
            <Target className="mb-2 size-8 text-muted-foreground/50" />
            <p className="text-sm font-medium">No goals yet</p>
            <p className="mt-1 text-xs text-muted-foreground">
              Goals give your projects a direction.
            </p>
          </div>
        )}
      </div>

      <GoalEditor
        open={editorOpen}
        onOpenChange={setEditorOpen}
        goal={editing}
      />
    </div>
  );
}

function GoalEditor({
  open,
  onOpenChange,
  goal,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  goal: Goal | null;
}) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [targetDate, setTargetDate] = useState("");
  const [color, setColor] = useState(COLORS[0]);

  useEffect(() => {
    if (!open) return;
    setTitle(goal?.title ?? "");
    setDescription(goal?.description ?? "");
    setTargetDate(goal?.targetDate ?? "");
    setColor(goal?.color ?? COLORS[0]);
  }, [open, goal]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="card-soft rounded-3xl p-0 sm:max-w-md">
        <DialogHeader className="px-5 pt-5">
          <DialogTitle>{goal ? "Edit goal" : "New goal"}</DialogTitle>
        </DialogHeader>
        <div className="space-y-3 px-5 pb-6">
          <div className="space-y-1.5">
            <Label>Title</Label>
            <Input
              autoFocus
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Become healthier"
              className="h-10 rounded-xl"
            />
          </div>
          <div className="space-y-1.5">
            <Label>Why does this matter?</Label>
            <Textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Description…"
              className="min-h-16 rounded-xl"
            />
          </div>
          <div className="space-y-1.5">
            <Label>Target date</Label>
            <Input
              type="date"
              value={targetDate}
              onChange={(e) => setTargetDate(e.target.value)}
              className="h-10 rounded-xl"
            />
          </div>
          <div className="space-y-1.5">
            <Label>Color</Label>
            <div className="flex gap-2">
              {COLORS.map((c) => (
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
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="ghost" onClick={() => onOpenChange(false)} className="rounded-xl">
              Cancel
            </Button>
            <Button
              className="rounded-xl"
              onClick={() => {
                if (!title.trim()) return;
                const payload = {
                  title: title.trim(),
                  description: description || undefined,
                  targetDate: targetDate || undefined,
                  color,
                };
                if (goal) {
                  updateGoal(goal.id, payload);
                  toast.success("Goal updated");
                } else {
                  addGoal(payload);
                  toast.success("Goal created");
                }
                onOpenChange(false);
              }}
            >
              {goal ? "Save" : "Create goal"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
