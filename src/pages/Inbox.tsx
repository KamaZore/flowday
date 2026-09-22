import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { addInboxItem, deleteInboxItem, organizeInboxItem, useInboxItems } from "@/lib/store";
import { useI18n } from "@/lib/i18n";
import { cn } from "@/lib/utils";
import {
  ArrowRightCircle,
  CheckCircle2,
  CornerDownLeft,
  Inbox as InboxIcon,
  ListTodo,
  Repeat2,
  Sparkles,
  Target,
  Trash2,
  FolderKanban,
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

const ORGANIZE_OPTIONS = [
  { type: "task" as const, label: "Task", icon: ListTodo, color: "text-primary" },
  { type: "project" as const, label: "Project", icon: FolderKanban, color: "text-amber-500" },
  { type: "goal" as const, label: "Goal", icon: Target, color: "text-rose-500" },
  { type: "habit" as const, label: "Habit", icon: CheckCircle2, color: "text-emerald-500" },
  { type: "process" as const, label: "Process", icon: Repeat2, color: "text-violet-500" },
];

export default function Inbox() {
  const { t } = useI18n();
  const items = useInboxItems();
  const [text, setText] = useState("");

  const capture = () => {
    if (!text.trim()) return;
    addInboxItem(text.trim());
    setText("");
  };

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">{t("inbox.title")}</h1>
        <p className="text-sm text-muted-foreground">
          {t("inbox.subtitle")}
        </p>
      </div>

      {/* Fast capture */}
      <div className="card-soft rounded-2xl border border-border/70 bg-card p-3">
        <div className="flex items-center gap-2">
          <Sparkles className="size-4 shrink-0 text-primary" />
          <Input
            autoFocus
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                capture();
              }
            }}
            placeholder={t("inbox.placeholder")}
            className="h-10 border-0 bg-transparent px-0 text-base shadow-none focus-visible:ring-0"
          />
          <Button size="sm" onClick={capture} disabled={!text.trim()} className="rounded-xl">
            {t("common.save")}
          </Button>
        </div>
        <div className="flex items-center gap-1 border-t border-border/60 pt-2 text-[11px] text-muted-foreground">
          <CornerDownLeft className="size-3" /> {t("inbox.enterHint")}
        </div>
      </div>

      {/* Items */}
      <div className="space-y-2">
        {items.map((item) => (
          <div
            key={item.id}
            className="card-soft rounded-2xl border border-border/70 bg-card p-3"
          >
            <div className="flex items-start justify-between gap-2">
              <p className="min-w-0 flex-1 text-sm font-medium leading-relaxed">
                {item.text}
              </p>
              <button
                onClick={() => deleteInboxItem(item.id)}
                className="shrink-0 text-muted-foreground/50 transition-colors hover:text-destructive"
                aria-label="Delete item"
              >
                <Trash2 className="size-4" />
              </button>
            </div>
            {item.organizedType ? (
              <p className="mt-2 flex items-center gap-1 text-xs font-medium text-emerald-600 dark:text-emerald-400">
                <CheckCircle2 className="size-3.5" />
                {t("inbox.organizedAs", { type: item.organizedType ?? "" })}
              </p>
            ) : (
              <div className="mt-2.5 flex flex-wrap gap-1.5">
                {ORGANIZE_OPTIONS.map((opt) => (
                  <button
                    key={opt.type}
                    onClick={() => {
                      organizeInboxItem(item.id, opt.type);
                      toast.success(`Organized as ${opt.label}`);
                    }}
                    className="inline-flex items-center gap-1 rounded-full bg-muted/70 px-2.5 py-1 text-[11px] font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground"
                  >
                    <opt.icon className={cn("size-3", opt.color)} />
                    {opt.label}
                  </button>
                ))}
              </div>
            )}
          </div>
        ))}
        {items.length === 0 && (
          <div className="card-soft flex flex-col items-center justify-center rounded-2xl border border-dashed py-14 text-center">
            <InboxIcon className="mb-2 size-8 text-muted-foreground/50" />
            <p className="text-sm font-medium">{t("inbox.empty")}</p>
            <p className="mt-1 max-w-60 text-xs text-muted-foreground">
              {t("inbox.emptySub")}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
