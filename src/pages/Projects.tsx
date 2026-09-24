import { TaskRow } from "@/components/app/tasks/TaskRow";
import { TaskEditor } from "@/components/app/tasks/TaskEditor";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { formatDateKey } from "@/lib/date-utils";
import {
  addProject,
  deleteProject,
  projectProgress,
  updateProject,
  useGoals,
  useProjects,
  useTasks,
} from "@/lib/store";
import type { Project, ProjectStatus } from "@/lib/types";
import { cn } from "@/lib/utils";
import {
  CalendarDays,
  FolderKanban,
  Pencil,
  Plus,
  Target,
  Trash2,
} from "lucide-react";
import { useEffect, useState } from "react";
import { useI18n } from "@/lib/i18n";
import { toast } from "sonner";

const COLORS = ["#6366f1", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6", "#0ea5e9", "#ec4899", "#14b8a6"];

const STATUS_LABELS: Record<ProjectStatus, string> = {
  planning: "Planning",
  active: "Active",
  paused: "Paused",
  done: "Done",
};

export default function Projects() {
  const { t } = useI18n();
  const projects = useProjects();
  const tasks = useTasks();
  const goals = useGoals();
  const [editorOpen, setEditorOpen] = useState(false);
  const [editing, setEditing] = useState<Project | null>(null);
  const [openProject, setOpenProject] = useState<Project | null>(null);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">{t("projects.title")}</h1>
          <p className="text-sm text-muted-foreground">{t("projects.active", { n: projects.filter((p) => p.status === "active").length })}</p>
        </div>
        <Button
          onClick={() => {
            setEditing(null);
            setEditorOpen(true);
          }}
          className="gap-1.5 rounded-xl"
        >
          <Plus className="size-4" /> {t("projects.new")}
        </Button>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        {projects.map((p) => {
          const pct = projectProgress(tasks, p.id);
          const open = tasks.filter((t) => t.projectId === p.id && t.status !== "completed").length;
          const goal = goals.find((g) => g.id === p.goalId);
          return (
            <div
              key={p.id}
              className="card-soft rounded-2xl border border-border/70 bg-card p-4 transition-transform hover:-translate-y-0.5"
            >
              <div className="flex items-start justify-between gap-2">
                <button
                  className="min-w-0 flex-1 text-left"
                  onClick={() => setOpenProject(p)}
                >
                  <div className="flex items-center gap-2">
                    <span
                      className="size-2.5 shrink-0 rounded-full"
                      style={{ backgroundColor: p.color ?? "#6366f1" }}
                    />
                    <span className="truncate text-sm font-semibold">{p.name}</span>
                  </div>
                  {p.description && (
                    <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">
                      {p.description}
                    </p>
                  )}
                </button>
                <div className="flex shrink-0 gap-1">
                  <button
                    onClick={() => {
                      setEditing(p);
                      setEditorOpen(true);
                    }}
                    className="text-muted-foreground/60 hover:text-foreground"
                    aria-label="Edit project"
                  >
                    <Pencil className="size-4" />
                  </button>
                  <button
                    onClick={() => {
                      if (confirm(`Delete "${p.name}"? Tasks will be kept.`)) {
                        deleteProject(p.id);
                        toast.success("Project deleted");
                      }
                    }}
                    className="text-muted-foreground/60 hover:text-destructive"
                    aria-label="Delete project"
                  >
                    <Trash2 className="size-4" />
                  </button>
                </div>
              </div>
              <div className="mt-3">
                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <span>{t("projects.complete", { n: pct })}</span>
                  <span>{t("projects.openTasks", { n: open })}</span>
                </div>
                <Progress value={pct} className="mt-1.5 h-2" />
              </div>
              <div className="mt-3 flex flex-wrap items-center gap-1.5 text-[11px]">
                <span className="rounded-full bg-muted px-2 py-0.5 font-medium">
                  {t(`projects.status.${p.status}`)}
                </span>
                {goal && (
                  <span className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-2 py-0.5 font-medium text-primary">
                    <Target className="size-3" /> {goal.title}
                  </span>
                )}
                {p.dueDate && (
                  <span className="inline-flex items-center gap-1 rounded-full bg-muted px-2 py-0.5">
                    <CalendarDays className="size-3" />
                    {formatDateKey(p.dueDate, "MMM d")}
                  </span>
                )}
              </div>
            </div>
          );
        })}
        {projects.length === 0 && (
          <div className="card-soft col-span-full flex flex-col items-center justify-center rounded-2xl border border-dashed py-14 text-center">
            <FolderKanban className="mb-2 size-8 text-muted-foreground/50" />
            <p className="text-sm font-medium">{t("projects.empty")}</p>
            <p className="mt-1 text-xs text-muted-foreground">{t("projects.emptySub")}</p>
          </div>
        )}
      </div>

      {/* Project editor */}
      <ProjectEditor
        open={editorOpen}
        onOpenChange={setEditorOpen}
        project={editing}
        goals={goals}
      />

      {/* Project detail drawer */}
      <Dialog open={!!openProject} onOpenChange={(v) => !v && setOpenProject(null)}>
        <DialogContent className="card-soft max-h-[90dvh] overflow-y-auto rounded-3xl p-0 sm:max-w-lg">
          <DialogHeader className="px-5 pt-5">
            <DialogTitle className="flex items-center gap-2">
              <span
                className="size-3 rounded-full"
                style={{ backgroundColor: openProject?.color }}
              />
              {openProject?.name}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-2 px-5 pb-6">
            {openProject?.description && (
              <p className="text-sm text-muted-foreground">
                {openProject.description}
              </p>
            )}
            <div className="space-y-2 pt-2">
              {tasks
                .filter((t) => t.projectId === openProject?.id)
                .sort((a, b) => a.order - b.order)
                .map((t) => (
                  <TaskRow key={t.id} task={t} />
                ))}
              {tasks.filter((t) => t.projectId === openProject?.id).length === 0 && (
                <p className="py-6 text-center text-sm text-muted-foreground">{t("projects.noTasks")}</p>
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function ProjectEditor({
  open,
  onOpenChange,
  project,
  goals,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  project: Project | null;
  goals: ReturnType<typeof useGoals>;
}) {
  const { t } = useI18n();
  const [name, setName] = useState(project?.name ?? "");
  const [description, setDescription] = useState(project?.description ?? "");
  const [goalId, setGoalId] = useState(project?.goalId ?? "none");
  const [dueDate, setDueDate] = useState(project?.dueDate ?? "");
  const [status, setStatus] = useState<ProjectStatus>(project?.status ?? "active");
  const [color, setColor] = useState(project?.color ?? COLORS[0]);

  // Reset form when the dialog opens for a different target
  useEffect(() => {
    if (!open) return;
    setName(project?.name ?? "");
    setDescription(project?.description ?? "");
    setGoalId(project?.goalId ?? "none");
    setDueDate(project?.dueDate ?? "");
    setStatus(project?.status ?? "active");
    setColor(project?.color ?? COLORS[0]);
  }, [open, project]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="card-soft rounded-3xl p-0 sm:max-w-md">
        <DialogHeader className="px-5 pt-5">
          <DialogTitle>{project ? "Edit project" : "New project"}</DialogTitle>
        </DialogHeader>
        <div className="space-y-3 px-5 pb-6">
          <div className="space-y-1.5">
            <Label>Name</Label>
            <Input
              autoFocus
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Learn English"
              className="h-10 rounded-xl"
            />
          </div>
          <div className="space-y-1.5">
            <Label>Description</Label>
            <Textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="What is this project about?"
              className="min-h-16 rounded-xl"
            />
          </div>
          <div className="grid grid-cols-1 min-[380px]:grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Goal</Label>
              <Select value={goalId} onValueChange={setGoalId}>
                <SelectTrigger className="rounded-xl">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">No goal</SelectItem>
                  {goals.map((g) => (
                    <SelectItem key={g.id} value={g.id}>
                      {g.title}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Status</Label>
              <Select
                value={status}
                onValueChange={(v) => setStatus(v as ProjectStatus)}
              >
                <SelectTrigger className="rounded-xl">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(STATUS_LABELS).map(([v]) => (
                    <SelectItem key={v} value={v}>
                      {t(`projects.status.${v}`)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="space-y-1.5">
            <Label>Due date</Label>
            <Input
              type="date"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
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
                if (!name.trim()) return;
                const payload = {
                  name: name.trim(),
                  description: description || undefined,
                  goalId: goalId === "none" ? undefined : goalId,
                  dueDate: dueDate || undefined,
                  status,
                  color,
                };
                if (project) {
                  updateProject(project.id, payload);
                  toast.success("Project updated");
                } else {
                  addProject(payload);
                  toast.success("Project created");
                }
                setName("");
                setDescription("");
                setGoalId("none");
                setDueDate("");
                setStatus("active");
                setColor(COLORS[0]);
                onOpenChange(false);
              }}
            >
              {project ? "Save" : "Create project"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
