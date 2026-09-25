import { TaskEditor } from "@/components/app/tasks/TaskEditor";
import { useI18n } from "@/lib/i18n";
import { TaskRow } from "@/components/app/tasks/TaskRow";
import { Button } from "@/components/ui/button";
import { addDaysKey, todayKey } from "@/lib/date-utils";
import { reorderTasks, useProjects, useTags, useTasks } from "@/lib/store";
import type { Task } from "@/lib/types";
import { cn } from "@/lib/utils";
import { ListChecks, Plus } from "lucide-react";
import { useEffect, useMemo, useRef, useState, type DragEvent } from "react";
import { useSearchParams } from "react-router";

type FilterKey =
  | "all"
  | "today"
  | "upcoming"
  | "overdue"
  | "completed"
  | "inbox"
  | `priority:${string}`
  | `project:${string}`
  | `tag:${string}`;

export default function Tasks() {
  const { t } = useI18n();
  const tasks = useTasks();
  const projects = useProjects();
  const tags = useTags();
  const [params] = useSearchParams();
  const [filter, setFilter] = useState<FilterKey>("all");
  const [editing, setEditing] = useState<Task | null>(null);
  const [editorOpen, setEditorOpen] = useState(false);
  const [newOpen, setNewOpen] = useState(false);
  const dragId = useRef<string | null>(null);
  const [dragOverId, setDragOverId] = useState<string | null>(null);

  // Allow /tasks?project=xxx and /tasks?filter=overdue deep links
  const presetProject = params.get("project");
  const presetFilter = params.get("filter");
  useEffect(() => {
    if (presetProject) setFilter(`project:${presetProject}`);
    else if (presetFilter && ["today", "upcoming", "overdue", "completed", "inbox"].includes(presetFilter)) {
      setFilter(presetFilter as FilterKey);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [presetProject, presetFilter]);

  const filtered = useMemo(() => {
    const today = todayKey();
    let list = tasks.filter((t) => t.status !== "inbox");
    switch (true) {
      case filter === "today":
        list = tasks.filter(
          (t) => t.dueDate === today && t.status !== "inbox",
        );
        break;
      case filter === "upcoming":
        list = tasks.filter(
          (t) =>
            t.dueDate &&
            t.dueDate > today &&
            t.status !== "completed" &&
            t.status !== "inbox",
        );
        break;
      case filter === "overdue":
        list = tasks.filter(
          (t) =>
            t.dueDate &&
            t.dueDate < today &&
            t.status !== "completed" &&
            t.status !== "inbox",
        );
        break;
      case filter === "completed":
        list = tasks.filter((t) => t.status === "completed");
        break;
      case filter === "inbox":
        list = tasks.filter((t) => t.status === "inbox");
        break;
      case filter.startsWith("priority:"):
        list = tasks.filter((t) => `priority:${t.priority}` === filter);
        break;
      case filter.startsWith("project:"):
        list = tasks.filter((t) => `project:${t.projectId}` === filter);
        break;
      case filter.startsWith("tag:"):
        list = tasks.filter((t) => t.tagIds.includes(filter.slice(4)));
        break;
      default:
        break;
    }
    return list;
  }, [tasks, filter]);

  const sorted = useMemo(() => {
    const list = [...filtered];
    // Date-based views sort chronologically; everything else respects the
    // user's manual drag order (order is renormalized on every reorder).
    const dateView =
      filter === "today" || filter === "upcoming" || filter === "overdue";
    list.sort((a, b) => {
      if (dateView) {
        if (a.dueDate !== b.dueDate) {
          return (a.dueDate ?? "9999") < (b.dueDate ?? "9999") ? -1 : 1;
        }
        if (a.dueTime !== b.dueTime) {
          return (a.dueTime ?? "99") < (b.dueTime ?? "99") ? -1 : 1;
        }
      }
      return a.order - b.order;
    });
    return list;
  }, [filtered, filter]);

  const onDrop = (e: DragEvent, overId: string) => {
    e.preventDefault();
    if (dragId.current && dragId.current !== overId) {
      reorderTasks(dragId.current, overId);
    }
    dragId.current = null;
    setDragOverId(null);
  };

  const chip = (key: FilterKey, label: string) => (
    <button
      key={key}
      onClick={() => setFilter(key)}
      className={cn(
        "shrink-0 rounded-full border px-3 py-1.5 text-xs font-medium transition-colors",
        filter === key
          ? "border-primary bg-primary text-primary-foreground"
          : "text-muted-foreground hover:bg-muted",
      )}
    >
      {label}
    </button>
  );

  const filterLabel = (key: FilterKey): string => {
    switch (key) {
      case "all": return t("filter.all");
      case "today": return t("filter.today");
      case "upcoming": return t("filter.upcoming");
      case "overdue": return t("filter.overdue");
      case "completed": return t("filter.completed");
      case "inbox": return t("filter.inbox");
      default:
        if (key.startsWith("priority:")) {
          const p = key.slice(9);
          return t(
            p === "high" ? "quick.priorityHigh" : p === "low" ? "quick.priorityLow" : "quick.priorityMedium",
          );
        }
        return key.split(":")[1] ?? key;
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">{t("tasks.title")}</h1>
          <p className="text-sm text-muted-foreground">
            {sorted.filter((t) => t.status !== "completed").length} open · {t("tasks.subtitle")}
          </p>
        </div>
        <Button onClick={() => setNewOpen(true)} className="gap-1.5 rounded-xl">
          <Plus className="size-4" /> {t("tasks.newTask")}
        </Button>
        <TaskEditor open={newOpen} onOpenChange={setNewOpen} />
      </div>

      {/* Filters */}
      <div className="no-scrollbar -mx-2 flex gap-2 overflow-x-auto px-2 pb-1">
        {chip("all", t("filter.all"))}
        {chip("today", t("filter.today"))}
        {chip("upcoming", t("filter.upcoming"))}
        {chip("overdue", t("filter.overdue"))}
        {chip("completed", t("filter.completed"))}
        {chip("inbox", t("filter.inbox"))}
        {["high", "medium", "low"].map((p) => chip(`priority:${p}`, filterLabel(`priority:${p}`)))}
        {projects.map((p) => chip(`project:${p.id}`, p.name))}
        {tags.map((tag) => chip(`tag:${tag.id}`, `#${tag.name}`))}
      </div>

      {/* List */}
      <div className="space-y-2">
        {sorted.map((task) => (
          <TaskRow
            key={task.id}
            task={task}
            onEdit={(t) => {
              setEditing(t);
              setEditorOpen(true);
            }}
            draggable={filter === "all" || filter === "today"}
            isDragging={dragId.current === task.id}
            isDragOver={dragOverId === task.id}
            onDragStart={() => (dragId.current = task.id)}
            onDragEnter={() => setDragOverId(task.id)}
            onDragEnd={() => {
              if (dragId.current && dragOverId && dragId.current !== dragOverId) {
                reorderTasks(dragId.current, dragOverId);
              }
              dragId.current = null;
              setDragOverId(null);
            }}
            onDrop={(e) => onDrop(e, task.id)}
          />
        ))}
        {sorted.length === 0 && (
          <div className="card-soft flex flex-col items-center justify-center rounded-2xl border border-dashed py-12 text-center">
            <ListChecks className="mb-2 size-8 text-muted-foreground/50" />
            <p className="text-sm font-medium">Nothing here</p>
            <p className="mt-1 text-xs text-muted-foreground">
              Try another filter or add a new task.
            </p>
          </div>
        )}
      </div>

      <TaskEditor
        open={editorOpen}
        onOpenChange={setEditorOpen}
        task={editing}
      />
    </div>
  );
}
