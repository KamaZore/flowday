import { FadeIn } from "@/components/systems/Shared";
import { useI18n } from "@/lib/i18n";
import { money } from "@/lib/format";
import { formatDateKey } from "@/lib/date-utils";
import { useAppData } from "@/lib/store";
import {
  ArrowDownLeft,
  ArrowUpRight,
  CheckCircle2,
  ClipboardList,
  Coins,
  Receipt,
  ShoppingCart,
} from "lucide-react";
import { useMemo } from "react";

type Activity = {
  id: string;
  kind: "task" | "tx" | "order";
  icon: typeof Coins;
  tint: string;
  title: string;
  sub: string;
  amount?: string;
  at: number;
};

const MAX = 40;

export default function AdminActivity() {
  const { t, lang } = useI18n();
  const data = useAppData();

  const items = useMemo<Activity[]>(() => {
    const out: Activity[] = [];

    for (const task of data.tasks) {
      if (task.status !== "completed" || !task.completedAt) continue;
      out.push({
        id: `task-${task.id}`,
        kind: "task",
        icon: CheckCircle2,
        tint: "bg-emerald-500/12 text-emerald-600 dark:text-emerald-400",
        title: task.title,
        sub: t("admin.act.taskDone"),
        at: task.completedAt,
      });
    }
    for (const tx of data.transactions.slice(0, 30)) {
      out.push({
        id: `tx-${tx.id}`,
        kind: "tx",
        icon: tx.type === "income" ? ArrowDownLeft : ArrowUpRight,
        tint:
          tx.type === "income"
            ? "bg-emerald-500/12 text-emerald-600 dark:text-emerald-400"
            : "bg-rose-500/12 text-rose-600 dark:text-rose-400",
        title: t(`exp.cat.${tx.category}`),
        sub: `${formatDateKey(tx.date)} · ${t(`pay.${tx.method}`)}`,
        amount: `${tx.type === "income" ? "+" : "−"}${money(tx.amount)}`,
        at: tx.createdAt,
      });
    }
    for (const o of data.business.orders.slice(0, 30)) {
      if (o.status !== "completed") continue;
      out.push({
        id: `ord-${o.id}`,
        kind: "order",
        icon: ShoppingCart,
        tint: "bg-violet-500/12 text-violet-600 dark:text-violet-400",
        title: `${t("biz.saleRecorded")} #${o.number}`,
        sub: `${o.lines.map((l) => `${l.qty}× ${l.name}`).join(", ")}`,
        amount: money(o.total),
        at: o.createdAt,
      });
    }
    return out.sort((a, b) => b.at - a.at).slice(0, MAX);
  }, [data, t]);

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">{t("admin.activity")}</h1>
        <p className="text-sm text-muted-foreground">{t("admin.activitySub")}</p>
      </div>

      <div className="space-y-1.5">
        {items.map((a, i) => (
          <FadeIn key={a.id} delay={Math.min(i * 0.02, 0.2)}>
            <div className="card-soft flex items-center gap-3 rounded-2xl border border-border/60 bg-card p-3">
              <span className={"flex size-9 shrink-0 items-center justify-center rounded-xl " + a.tint}>
                <a.icon className="size-4" />
              </span>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium">{a.title}</p>
                <p className="truncate text-xs text-muted-foreground">{a.sub}</p>
              </div>
              {a.amount && (
                <span className="shrink-0 text-sm font-semibold tabular-nums">{a.amount}</span>
              )}
            </div>
          </FadeIn>
        ))}
        {items.length === 0 && (
          <div className="rounded-2xl border border-dashed border-border/70 p-10 text-center">
            <ClipboardList className="mx-auto mb-2 size-8 text-muted-foreground/50" />
            <p className="text-sm text-muted-foreground">{t("admin.activityEmpty")}</p>
          </div>
        )}
      </div>
    </div>
  );
}
