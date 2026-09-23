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
import { Textarea } from "@/components/ui/textarea";
import { recurrenceLabel, todayKey, formatDateKey } from "@/lib/date-utils";
import {
  addProcess,
  addProcessStep,
  deleteProcess,
  deleteProcessStep,
  moveProcessStep,
  scheduleProcess,
  updateProcess,
  updateProcessStep,
  useProcesses,
  useTasks,
} from "@/lib/store";
import type { Process, Recurrence } from "@/lib/types";
import { cn } from "@/lib/utils";
import {
  ArrowDown,
  ChevronDown,
  Clock,
  ListChecks,
  Pencil,
  Play,
  Plus,
  Repeat2,
  Trash2,
} from "lucide-react";
import { useEffect, useState } from "react";
import { useLocation } from "react-router";
import { toast } from "sonner";

export default function Processes() {
  const processes = useProcesses();
  const tasks = useTasks();
  const location = useLocation();
  const [expanded, setExpanded] = useState<string | null>(null);
  const [editorOpen, setEditorOpen] = useState(false);
  const [editing, setEditing] = useState<Process | null>(null);
  const [scheduleFor, setScheduleFor] = useState<Process | null>(null);
  const [scheduleDate, setScheduleDate] = useState(todayKey());

  // Deep link /processes?id=xxx
  useEffect(() => {
    const id = new URLSearchParams(location.search).get("id");
    if (id && processes.some((p) => p.id === id)) setExpanded(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.search]);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Processes</h1>
          <p className="text-sm text-muted-foreground">
            Reusable routines that turn into tasks
          </p>
        </div>
        <Button
          onClick={() => {
            setEditing(null);
            setEditorOpen(true);
          }}
          className="gap-1.5 rounded-xl"
        >
          <Plus className="size-4" /> New process
        </Button>
      </div>

      <div className="space-y-3">
        {processes.map((proc) => {
          const isExpanded = expanded === proc.id;
          const sorted = [...proc.steps].sort((a, b) => a.order - b.order);
          const totalMin = proc.steps.reduce(
            (sum, s) => sum + (s.durationMin ?? 0),
            0,
          );
          const todayCount = tasks.filter(
            (t) => t.processId === proc.id && t.dueDate === todayKey(),
          ).length;

          return (
            <div
              key={proc.id}
              className="card-soft overflow-hidden rounded-2xl border border-border/70 bg-card"
            >
              {/* Header */}
              <div className="flex items-center gap-3 p-4">
                <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                  <Repeat2 className="size-5" />
                </div>
                <button
                  className="min-w-0 flex-1 text-left"
                  onClick={() => setExpanded(isExpanded ? null : proc.id)}
                >
                  <p className="truncate text-sm font-semibold">{proc.name}</p>
                  <p className="mt-0.5 text-xs text-muted-foreground">
                    {proc.steps.length} step{proc.steps.length === 1 ? "" : "s"}
                    {totalMin > 0 && ` · ~${totalMin} min`}
                    {proc.recurrence && ` · ${recurrenceLabel(proc.recurrence)}`}
                    {todayCount > 0 && ` · ${todayCount} today`}
                  </p>
                </button>
                <div className="flex shrink-0 items-center gap-1">
                  <Button
                    variant="outline"
                    size="sm"
                    className="rounded-lg"
                    onClick={() => {
                      setScheduleFor(proc);
                      setScheduleDate(todayKey());
                    }}
                  >
                    <Play className="mr-1 size-3.5" />
                    Run
                  </Button>
                  <button
                    onClick={() => {
                      setEditing(proc);
                      setEditorOpen(true);
                    }}
                    className="p-1 text-muted-foreground/60 hover:text-foreground"
                    aria-label="Edit process"
                  >
                    <Pencil className="size-4" />
                  </button>
                  <button
                    onClick={() => {
                      if (confirm(`Delete "${proc.name}"?`)) {
                        deleteProcess(proc.id);
                        toast.success("Process deleted");
                      }
                    }}
                    className="p-1 text-muted-foreground/60 hover:text-destructive"
                    aria-label="Delete process"
                  >
                    <Trash2 className="size-4" />
                  </button>
                  <button
                    onClick={() => setExpanded(isExpanded ? null : proc.id)}
                    aria-label="Toggle"
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

              {/* Visual flow */}
              {isExpanded && (
                <div className="border-t border-border/60 bg-muted/20 px-4 py-4">
                  {proc.description && (
                    <p className="pb-3 text-xs text-muted-foreground">
                      {proc.description}
                    </p>
                  )}
                  <div className="mx-auto max-w-xs">
                    <FlowNode label="START" kind="start" />
                    {sorted.map((step, i) => (
                      <div key={step.id}>
                        <FlowArrow />
                        <div className="flex items-center gap-1.5">
                          <div className="min-w-0 flex-1">
                            <StepCard
                              processId={proc.id}
                              stepId={step.id}
                              title={step.title}
                              durationMin={step.durationMin}
                              index={i}
                              total={sorted.length}
                            />
                          </div>
                        </div>
                      </div>
                    ))}
                    <FlowArrow />
                    <FlowNode label="END" kind="end" />

                    {/* Add step */}
                    <AddStepInput processId={proc.id} />
                  </div>
                </div>
              )}
            </div>
          );
        })}
        {processes.length === 0 && (
          <div className="card-soft flex flex-col items-center justify-center rounded-2xl border border-dashed py-14 text-center">
            <Repeat2 className="mb-2 size-8 text-muted-foreground/50" />
            <p className="text-sm font-medium">No processes yet</p>
            <p className="mt-1 text-xs text-muted-foreground">
              Turn routines into repeatable, schedulable flows.
            </p>
          </div>
        )}
      </div>

      {/* Process editor (name/desc/recurrence) */}
      <ProcessEditor
        open={editorOpen}
        onOpenChange={setEditorOpen}
        process={editing}
      />

      {/* Schedule dialog */}
      <Dialog open={!!scheduleFor} onOpenChange={(v) => !v && setScheduleFor(null)}>
        <DialogContent className="card-soft rounded-3xl p-0 sm:max-w-sm">
          <DialogHeader className="px-5 pt-5">
            <DialogTitle>Run “{scheduleFor?.name}”</DialogTitle>
          </DialogHeader>
          <div className="space-y-3 px-5 pb-6">
            <p className="text-sm text-muted-foreground">
              Creates one task per step, scheduled for the chosen day.
            </p>
            <div className="space-y-1.5">
              <Label>Date</Label>
              <Input
                type="date"
                value={scheduleDate}
                onChange={(e) => setScheduleDate(e.target.value)}
                className="h-10 rounded-xl"
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="ghost" className="rounded-xl" onClick={() => setScheduleFor(null)}>
                Cancel
              </Button>
              <Button
                className="rounded-xl"
                onClick={() => {
                  if (!scheduleFor) return;
                  const created = scheduleProcess(scheduleFor.id, scheduleDate);
                  if (created) {
                    toast.success(
                      `${scheduleFor.steps.length} tasks scheduled for ${formatDateKey(scheduleDate)}`,
                    );
                  } else {
                    toast.info("Already scheduled for that day");
                  }
                  setScheduleFor(null);
                }}
              >
                <Play className="mr-1.5 size-4" />
                Create tasks
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function FlowNode({ label, kind }: { label: string; kind: "start" | "end" }) {
  return (
    <div className="flex justify-center">
      <span
        className={cn(
          "rounded-full px-4 py-1 text-[10px] font-bold tracking-widest",
          kind === "start"
            ? "bg-primary text-primary-foreground"
            : "bg-muted text-muted-foreground",
        )}
      >
        {label}
      </span>
    </div>
  );
}

function FlowArrow() {
  return (
    <div className="flex justify-center py-0.5">
      <ArrowDown className="size-4 text-muted-foreground/40" />
    </div>
  );
}

function StepCard({
  processId,
  stepId,
  title,
  durationMin,
  index,
  total,
}: {
  processId: string;
  stepId: string;
  title: string;
  durationMin?: number;
  index: number;
  total: number;
}) {
  const [editingTitle, setEditingTitle] = useState(title);
  const [isEditing, setIsEditing] = useState(false);

  useEffect(() => setEditingTitle(title), [title]);

  return (
    <div className="card-soft rounded-xl border border-border/60 bg-card px-3 py-2">
      {isEditing ? (
        <div className="space-y-1.5">
          <Input
            value={editingTitle}
            onChange={(e) => setEditingTitle(e.target.value)}
            className="h-8 rounded-lg text-sm"
            autoFocus
            onKeyDown={(e) => {
              if (e.key === "Enter" && editingTitle.trim()) {
                updateProcessStep(processId, stepId, { title: editingTitle.trim() });
                setIsEditing(false);
              }
              if (e.key === "Escape") {
                setEditingTitle(title);
                setIsEditing(false);
              }
            }}
          />
          <div className="flex items-center gap-1.5">
            <Clock className="size-3 text-muted-foreground" />
            <Input
              type="number"
              min={0}
              placeholder="min"
              value={durationMin ?? ""}
              onChange={(e) =>
                updateProcessStep(processId, stepId, {
                  durationMin: e.target.value ? Number(e.target.value) : undefined,
                })
              }
              className="h-7 w-16 rounded-lg text-xs"
            />
          </div>
        </div>
      ) : (
        <button
          onClick={() => setIsEditing(true)}
          className="flex w-full items-center justify-between gap-2 text-left"
        >
          <span className="min-w-0 flex-1 truncate text-sm font-medium">
            {title}
          </span>
          <span className="shrink-0 text-[10px] text-muted-foreground">
            {durationMin ? `${durationMin}m` : `Step ${index + 1}`}
          </span>
        </button>
      )}
      <div className="mt-1.5 flex items-center gap-0.5 border-t border-border/40 pt-1.5">
        <button
          onClick={() => moveProcessStep(processId, stepId, -1)}
          disabled={index === 0}
          className="rounded p-0.5 text-muted-foreground/60 hover:bg-muted hover:text-foreground disabled:opacity-30"
          aria-label="Move up"
        >
          <ArrowDown className="size-3.5 rotate-180" />
        </button>
        <button
          onClick={() => moveProcessStep(processId, stepId, 1)}
          disabled={index === total - 1}
          className="rounded p-0.5 text-muted-foreground/60 hover:bg-muted hover:text-foreground disabled:opacity-30"
          aria-label="Move down"
        >
          <ArrowDown className="size-3.5" />
        </button>
        <button
          onClick={() => setIsEditing((v) => !v)}
          className="rounded p-0.5 text-muted-foreground/60 hover:bg-muted hover:text-foreground"
          aria-label="Edit step"
        >
          <Pencil className="size-3.5" />
        </button>
        <button
          onClick={() => deleteProcessStep(processId, stepId)}
          className="ml-auto rounded p-0.5 text-muted-foreground/60 hover:text-destructive"
          aria-label="Delete step"
        >
          <Trash2 className="size-3.5" />
        </button>
      </div>
    </div>
  );
}

function AddStepInput({ processId }: { processId: string }) {
  const [value, setValue] = useState("");
  return (
    <div className="mt-3">
      <FlowArrow />
      <div className="flex gap-1.5">
        <Input
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && value.trim()) {
              addProcessStep(processId, value.trim());
              setValue("");
            }
          }}
          placeholder="Add a step…"
          className="h-9 flex-1 rounded-xl text-sm"
        />
        <Button
          variant="outline"
          size="icon"
          className="size-9 rounded-xl"
          onClick={() => {
            if (value.trim()) {
              addProcessStep(processId, value.trim());
              setValue("");
            }
          }}
          aria-label="Add step"
        >
          <Plus className="size-4" />
        </Button>
      </div>
    </div>
  );
}

function ProcessEditor({
  open,
  onOpenChange,
  process,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  process: Process | null;
}) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [recurrence, setRecurrence] = useState("none");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  useEffect(() => {
    if (!open) return;
    setName(process?.name ?? "");
    setDescription(process?.description ?? "");
    setRecurrence(process?.recurrence?.type ?? "none");
    setStartDate(process?.startDate ?? "");
    setEndDate(process?.endDate ?? "");
  }, [open, process]);

  const save = () => {
    if (!name.trim()) return;
    const rec: Recurrence | undefined =
      recurrence === "none"
        ? undefined
        : recurrence === "weekly"
          ? { type: "weekly", weekdays: [] }
          : ({ type: recurrence } as Recurrence);
    if (process) {
      updateProcess(process.id, {
        name: name.trim(),
        description: description || undefined,
        recurrence: rec,
        startDate: startDate || undefined,
        endDate: endDate || undefined,
      });
      toast.success("Process updated");
    } else {
      addProcess({
        name: name.trim(),
        description: description || undefined,
        recurrence: rec,
        startDate: startDate || undefined,
        endDate: endDate || undefined,
      });
      toast.success("Process created — open it to add steps");
    }
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="card-soft rounded-3xl p-0 sm:max-w-md">
        <DialogHeader className="px-5 pt-5">
          <DialogTitle>{process ? "Edit process" : "New process"}</DialogTitle>
        </DialogHeader>
        <div className="space-y-3 px-5 pb-6">
          <div className="space-y-1.5">
            <Label>Name</Label>
            <Input
              autoFocus
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Morning Routine"
              className="h-10 rounded-xl"
            />
          </div>
          <div className="space-y-1.5">
            <Label>Description</Label>
            <Textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="What is this routine for?"
              className="min-h-16 rounded-xl"
            />
          </div>
          <div className="grid grid-cols-1 min-[380px]:grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Repeat</Label>
              <Select value={recurrence} onValueChange={setRecurrence}>
                <SelectTrigger className="rounded-xl">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">On demand</SelectItem>
                  <SelectItem value="daily">Every day</SelectItem>
                  <SelectItem value="weekdays">Weekdays</SelectItem>
                  <SelectItem value="weekly">Weekly</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="grid grid-cols-1 min-[380px]:grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Start date</Label>
              <Input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="h-10 rounded-xl"
              />
            </div>
            <div className="space-y-1.5">
              <Label>End date</Label>
              <Input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="h-10 rounded-xl"
              />
            </div>
          </div>
          <div className="flex justify-end gap-2 pt-1">
            <Button variant="ghost" onClick={() => onOpenChange(false)} className="rounded-xl">
              Cancel
            </Button>
            <Button onClick={save} className="rounded-xl">
              {process ? "Save" : "Create process"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
