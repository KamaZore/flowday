import { Checkbox } from "@/components/ui/checkbox";
import {
  addDaysKey,
  formatDateKey,
  formatTime,
  isOverdue,
  todayKey,
} from "@/lib/date-utils";
import { useProcesses, useProjects, useTags, toggleTask } from "@/lib/store";
import type { Task } from "@/lib/types";
import { cn } from "@/lib/utils";
import {
  CalendarDays,
  Clock,
  GripVertical,
  Repeat2,
  Tag as TagIcon,
} from "lucide-react";
import { useMemo, type DragEvent } from "react";

const PRIORITY_ACCENT: Record<string, string> = {
  high: "bg-rose-500",
  medium: "bg-amber-400",
  low: "bg-sky-400",
};

export function TaskRow({
  task,
  onEdit,
  draggable = false,
  compact = false,
  isDragging = false,
  isDragOver = false,
  onDragStart,
  onDragEnter,
  onDragEnd,
  onDrop,
}: {
  task: Task;
  onEdit?: (task: Task) => void;
  draggable?: boolean;
  compact?: boolean;
  isDragging?: boolean;
  isDragOver?: boolean;
  onDragStart?: () => void;
  onDragEnter?: () => void;
  onDragEnd?: () => void;
  onDrop?: (e: DragEvent) => void;
}) {
  const projects = useProjects();
  const processes = useProcesses();
  const tags = useTags();
  const project = projects.find((p) => p.id === task.projectId);
  const process = processes.find((p) => p.id === task.processId);
  const taskTags = tags.filter((t) => task.tagIds.includes(t.id));

  const due = useMemo(() => {
    if (!task.dueDate) return null;
    const today = todayKey();
    const overdue = isOverdue(task.dueDate, task.status === "completed");
    if (task.dueDate === today) return { text: "Today", overdue };
    if (task.dueDate === addDaysKey(today, 1))
      return { text: "Tomorrow", overdue };
    return { text: formatDateKey(task.dueDate, "MMM d"), overdue };
  }, [task.dueDate, task.status]);

  const subtaskProgress = task.subtasks.length
    ? `${task.subtasks.filter((s) => s.completed).length}/${task.subtasks.length}`
    : null;

  return (
    <div
      draggable={draggable}
      onDragStart={onDragStart}
      onDragEnter={onDragEnter}
      onDragEnd={onDragEnd}
      onDragOver={(e) => e.preventDefault()}
      onDrop={onDrop}
      className={cn(
        "card-soft group relative overflow-hidden rounded-2xl border bg-card text-card-foreground transition-shadow",
        draggable ? "cursor-grab border-border/70 active:cursor-grabbing" : "border-border/70",
        isDragging && "opacity-40",
        isDragOver && "ring-2 ring-primary/40",
      )}
    >
      <div
        className={cn(
          "absolute inset-y-0 left-0 w-1",
          PRIORITY_ACCENT[task.priority],
        )}
      />
      <div className={cn("flex items-center gap-2 px-3 py-2.5", compact && "py-2")}>
        {draggable && (
          <span
            className="hidden cursor-grab text-muted-foreground/40 transition-opacity group-hover:opacity-100 md:block"
            aria-label="Reorder task"
            title="Drag to reorder"
          >
            <GripVertical className="size-4" />
          </span>
        )}
        <Checkbox
          checked={task.status === "completed"}
          onCheckedChange={() => toggleTask(task.id)}
          className="size-5 shrink-0 rounded-full border-2 data-[state=checked]:border-primary data-[state=checked]:bg-primary"
          aria-label={`Complete ${task.title}`}
        />
        <button
          onClick={() => onEdit?.(task)}
          className="min-w-0 flex-1 text-left"
        >
          <div className="flex items-center gap-2">
            <span
              className={cn(
                "truncate text-sm font-medium",
                task.status === "completed" &&
                  "text-muted-foreground line-through",
              )}
            >
              {task.title}
            </span>
            {task.recurrence && (
              <Repeat2 className="size-3.5 shrink-0 text-emerald-500" />
            )}
          </div>
          {!compact && (
            <div className="mt-1 flex flex-wrap items-center gap-1.5 text-[11px] text-muted-foreground">
              {due && (
                <span
                  className={cn(
                    "inline-flex items-center gap-1 rounded-full px-1.5 py-0.5",
                    due.overdue
                      ? "bg-destructive/10 font-medium text-destructive"
                      : "bg-muted",
                  )}
                >
                  <CalendarDays className="size-3" />
                  {due.text}
                </span>
              )}
              {task.dueTime && (
                <span className="inline-flex items-center gap-1 rounded-full bg-muted px-1.5 py-0.5">
                  <Clock className="size-3" />
                  {formatTime(task.dueTime)}
                </span>
              )}
              {project && (
                <span
                  className="inline-flex items-center rounded-full px-1.5 py-0.5 font-medium"
                  style={{
                    backgroundColor: `${project.color ?? "#6366f1"}1a`,
                    color: project.color ?? "#6366f1",
                  }}
                >
                  {project.name}
                </span>
              )}
              {process && !project && (
                <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 px-1.5 py-0.5 text-emerald-600 dark:text-emerald-400">
                  <Repeat2 className="size-3" />
                  {process.name}
                </span>
              )}
              {taskTags.map((t) => (
                <span
                  key={t.id}
                  className="inline-flex items-center gap-1 rounded-full bg-muted px-1.5 py-0.5"
                >
                  <TagIcon className="size-3" />
                  {t.name}
                </span>
              ))}
              {subtaskProgress && (
                <span className="rounded-full bg-muted px-1.5 py-0.5">
                  ☑ {subtaskProgress}
                </span>
              )}
            </div>
          )}
        </button>
      </div>
    </div>
  );
}
