import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
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
import { Textarea } from "@/components/ui/textarea";
import { recurrenceLabel, todayKey } from "@/lib/date-utils";
import {
  addSubtask,
  addTask,
  addTag,
  deleteTask,
  removeSubtask,
  toggleSubtask,
  updateTask,
  useGoals,
  useProcesses,
  useProjects,
  useTags,
} from "@/lib/store";
import {
  PRIORITIES,
  PRIORITY_LABELS,
  TASK_STATUSES,
  TASK_STATUS_LABELS,
  type Priority,
  type Recurrence,
  type Task,
  type TaskStatus,
} from "@/lib/types";
import { cn } from "@/lib/utils";
import { Plus, Trash2, X } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";

const emptyDraft = {
  title: "",
  description: "",
  notes: "",
  status: "inbox" as TaskStatus,
  priority: "medium" as Priority,
  dueDate: "",
  dueTime: "",
  projectId: "none",
  goalId: "none",
  tagIds: [] as string[],
  recurrence: "" as string,
  weekdaySelection: [] as number[],
  monthlyDay: 1,
  reminder: "",
};

export function TaskEditor({
  open,
  onOpenChange,
  task,
  defaults,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  task?: Task | null;
  defaults?: Partial<typeof emptyDraft>;
}) {
  const projects = useProjects();
  const processes = useProcesses();
  const goals = useGoals();
  const tags = useTags();
  const [draft, setDraft] = useState(emptyDraft);
  const [newTag, setNewTag] = useState("");

  useEffect(() => {
    if (!open) return;
    if (task) {
      setDraft({
        title: task.title,
        description: task.description ?? "",
        notes: task.notes ?? "",
        status: task.status,
        priority: task.priority,
        dueDate: task.dueDate ?? "",
        dueTime: task.dueTime ?? "",
        projectId: task.projectId ?? "none",
        goalId: task.goalId ?? "none",
        tagIds: task.tagIds ?? [],
        recurrence: task.recurrence?.type ?? "",
        weekdaySelection: task.recurrence?.type === "weekly" ? task.recurrence.weekdays ?? [] : [],
        monthlyDay: task.recurrence?.type === "monthly" ? task.recurrence.dayOfMonth : 1,
        reminder: task.reminder ?? "",
      });
    } else {
      setDraft({
        ...emptyDraft,
        status: "todo",
        dueDate: defaults?.dueDate ?? todayKey(),
        ...defaults,
      });
    }
  }, [open, task, defaults]);

  const set = <K extends keyof typeof emptyDraft>(
    key: K,
    value: (typeof emptyDraft)[K],
  ) => setDraft((d) => ({ ...d, [key]: value }));

  const save = () => {
    if (!draft.title.trim()) {
      toast.error("Give your task a title");
      return;
    }
    const recurrence: Recurrence | undefined = draft.recurrence
      ? draft.recurrence === "weekly"
        ? { type: "weekly", weekdays: draft.weekdaySelection }
        : draft.recurrence === "monthly"
          ? { type: "monthly", dayOfMonth: draft.monthlyDay }
          : { type: draft.recurrence as "daily" | "weekdays" }
      : undefined;

    const payload = {
      title: draft.title.trim(),
      description: draft.description || undefined,
      notes: draft.notes || undefined,
      status: draft.status,
      priority: draft.priority,
      dueDate: draft.dueDate || undefined,
      dueTime: draft.dueTime || undefined,
      projectId: draft.projectId === "none" ? undefined : draft.projectId,
      goalId: draft.goalId === "none" ? undefined : draft.goalId,
      tagIds: draft.tagIds,
      recurrence,
      reminder: draft.reminder || undefined,
    };

    if (task) {
      updateTask(task.id, payload);
      toast.success("Task updated");
    } else {
      addTask(payload);
      toast.success("Task created");
    }
    onOpenChange(false);
  };

  const toggleTag = (tagId: string) =>
    setDraft((d) => ({
      ...d,
      tagIds: d.tagIds.includes(tagId)
        ? d.tagIds.filter((t) => t !== tagId)
        : [...d.tagIds, tagId],
    }));

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="card-soft max-h-[92dvh] overflow-y-auto rounded-3xl p-0 sm:max-w-lg">
        <DialogHeader className="px-5 pb-1 pt-5">
          <DialogTitle>{task ? "Edit task" : "New task"}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 px-5 pb-6">
          <div className="space-y-1.5">
            <Label>Title</Label>
            <Input
              autoFocus
              value={draft.title}
              onChange={(e) => set("title", e.target.value)}
              placeholder="What needs doing?"
              className="h-11 rounded-xl"
            />
          </div>

          <div className="grid grid-cols-1 min-[380px]:grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Status</Label>
              <Select
                value={draft.status}
                onValueChange={(v) => set("status", v as TaskStatus)}
              >
                <SelectTrigger className="rounded-xl">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {TASK_STATUSES.map((s) => (
                    <SelectItem key={s} value={s}>
                      {TASK_STATUS_LABELS[s]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Priority</Label>
              <Select
                value={draft.priority}
                onValueChange={(v) => set("priority", v as Priority)}
              >
                <SelectTrigger className="rounded-xl">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {PRIORITIES.map((p) => (
                    <SelectItem key={p} value={p}>
                      {PRIORITY_LABELS[p]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-1 min-[380px]:grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Due date</Label>
              <Input
                type="date"
                value={draft.dueDate}
                onChange={(e) => set("dueDate", e.target.value)}
                className="h-10 rounded-xl"
              />
            </div>
            <div className="space-y-1.5">
              <Label>Due time</Label>
              <Input
                type="time"
                value={draft.dueTime}
                onChange={(e) => set("dueTime", e.target.value)}
                className="h-10 rounded-xl"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 min-[380px]:grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Project</Label>
              <Select
                value={draft.projectId}
                onValueChange={(v) => set("projectId", v)}
              >
                <SelectTrigger className="rounded-xl">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">No project</SelectItem>
                  {projects.map((p) => (
                    <SelectItem key={p.id} value={p.id}>
                      {p.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Goal</Label>
              <Select
                value={draft.goalId}
                onValueChange={(v) => set("goalId", v)}
              >
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
          </div>

          {/* Tags */}
          <div className="space-y-1.5">
            <Label>Tags</Label>
            <div className="flex flex-wrap gap-1.5">
              {tags.map((t) => (
                <button
                  key={t.id}
                  onClick={() => toggleTag(t.id)}
                  className={cn(
                    "rounded-full border px-2.5 py-1 text-xs font-medium transition-colors",
                    draft.tagIds.includes(t.id)
                      ? "border-primary bg-primary/10 text-primary"
                      : "text-muted-foreground hover:bg-muted",
                  )}
                >
                  #{t.name}
                </button>
              ))}
            </div>
            <div className="flex gap-2 pt-1">
              <Input
                value={newTag}
                onChange={(e) => setNewTag(e.target.value)}
                placeholder="New tag name"
                className="h-9 flex-1 rounded-xl"
                onKeyDown={(e) => {
                  if (e.key === "Enter" && newTag.trim()) {
                    e.preventDefault();
                    const id = addTag(newTag.trim());
                    setDraft((d) => ({ ...d, tagIds: [...d.tagIds, id] }));
                    setNewTag("");
                  }
                }}
              />
            </div>
          </div>

          {/* Recurrence */}
          <div className="space-y-1.5">
            <Label>Repeat</Label>
            <Select
              value={draft.recurrence || "none"}
              onValueChange={(v) => set("recurrence", v === "none" ? "" : v)}
            >
              <SelectTrigger className="rounded-xl">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">Does not repeat</SelectItem>
                <SelectItem value="daily">Every day</SelectItem>
                <SelectItem value="weekdays">Weekdays</SelectItem>
                <SelectItem value="weekly">Custom weekly…</SelectItem>
                <SelectItem value="monthly">Monthly</SelectItem>
              </SelectContent>
            </Select>
            {draft.recurrence === "weekly" && (
              <div className="flex gap-1 pt-1">
                {["S", "M", "T", "W", "T", "F", "S"].map((lbl, idx) => (
                  <button
                    key={idx}
                    onClick={() =>
                      setDraft((d) => ({
                        ...d,
                        weekdaySelection: d.weekdaySelection.includes(idx)
                          ? d.weekdaySelection.filter((x) => x !== idx)
                          : [...d.weekdaySelection, idx],
                      }))
                    }
                    className={cn(
                      "size-8 rounded-full border text-xs font-semibold",
                      draft.weekdaySelection.includes(idx)
                        ? "border-primary bg-primary text-primary-foreground"
                        : "text-muted-foreground hover:bg-muted",
                    )}
                  >
                    {lbl}
                  </button>
                ))}
              </div>
            )}
            {draft.recurrence === "monthly" && (
              <Input
                type="number"
                min={1}
                max={31}
                value={draft.monthlyDay}
                onChange={(e) =>
                  set("monthlyDay", Math.max(1, Math.min(31, Number(e.target.value))))
                }
                className="h-9 w-28 rounded-xl"
              />
            )}
          </div>

          <div className="grid grid-cols-1 min-[380px]:grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Reminder</Label>
              <Input
                type="time"
                value={draft.reminder}
                onChange={(e) => set("reminder", e.target.value)}
                className="h-10 rounded-xl"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label>Description</Label>
            <Textarea
              value={draft.description}
              onChange={(e) => set("description", e.target.value)}
              placeholder="Details…"
              className="min-h-16 rounded-xl"
            />
          </div>

          <div className="space-y-1.5">
            <Label>Notes</Label>
            <Textarea
              value={draft.notes}
              onChange={(e) => set("notes", e.target.value)}
              placeholder="Private notes…"
              className="min-h-16 rounded-xl"
            />
          </div>

          {/* Subtasks */}
          {task && (
            <div className="space-y-2">
              <Label>Subtasks</Label>
              <div className="space-y-1">
                {task.subtasks.map((s) => (
                  <div
                    key={s.id}
                    className="flex items-center gap-2 rounded-xl bg-muted/50 px-3 py-2"
                  >
                    <Checkbox
                      checked={s.completed}
                      onCheckedChange={() => toggleSubtask(task.id, s.id)}
                      className="size-4"
                    />
                    <span
                      className={cn(
                        "flex-1 text-sm",
                        s.completed && "text-muted-foreground line-through",
                      )}
                    >
                      {s.title}
                    </span>
                    <button
                      onClick={() => removeSubtask(task.id, s.id)}
                      className="text-muted-foreground/60 hover:text-destructive"
                      aria-label="Remove subtask"
                    >
                      <X className="size-4" />
                    </button>
                  </div>
                ))}
              </div>
              <SubtaskInput taskId={task.id} />
            </div>
          )}

          {/* Actions */}
          <div className="flex items-center justify-between gap-2 pt-2">
            {task ? (
              <DeleteTaskButton taskId={task.id} onDone={() => onOpenChange(false)} />
            ) : (
              <span />
            )}
            <div className="flex gap-2">
              <Button
                variant="ghost"
                onClick={() => onOpenChange(false)}
                className="rounded-xl"
              >
                Cancel
              </Button>
              <Button onClick={save} className="rounded-xl">
                {task ? "Save changes" : "Create task"}
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function SubtaskInput({ taskId }: { taskId: string }) {
  const [value, setValue] = useState("");
  return (
    <div className="flex gap-2">
      <Input
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder="Add subtask…"
        className="h-9 flex-1 rounded-xl"
        onKeyDown={(e) => {
          if (e.key === "Enter" && value.trim()) {
            e.preventDefault();
            addSubtask(taskId, value.trim());
            setValue("");
          }
        }}
      />
      <Button
        variant="outline"
        size="icon"
        className="size-9 rounded-xl"
        onClick={() => {
          if (value.trim()) {
            addSubtask(taskId, value.trim());
            setValue("");
          }
        }}
        aria-label="Add subtask"
      >
        <Plus className="size-4" />
      </Button>
    </div>
  );
}

function DeleteTaskButton({
  taskId,
  onDone,
}: {
  taskId: string;
  onDone: () => void;
}) {
  return (
    <Button
      variant="ghost"
      className="rounded-xl text-destructive hover:text-destructive"
      onClick={() => {
        deleteTask(taskId);
        onDone();
        toast.success("Task deleted");
      }}
    >
      <Trash2 className="mr-1 size-4" />
      Delete
    </Button>
  );
}
