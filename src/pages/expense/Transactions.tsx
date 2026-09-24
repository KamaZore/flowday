import { DateFilterBar } from "@/components/systems/DateFilterBar";
import { downloadCsv } from "@/lib/export";
import { TransactionDialog } from "@/components/systems/TransactionDialog";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useI18n } from "@/lib/i18n";
import { money } from "@/lib/format";
import {
  deleteTransaction,
  filterTransactions,
  resolveDateRange,
  sumTransactions,
  useTransactions,
  type DateFilter,
} from "@/lib/store";
import {
  EXPENSE_CATEGORIES,
  INCOME_CATEGORIES,
  PAYMENT_METHODS,
  type Transaction,
} from "@/lib/types";
import { ArrowDownLeft, ArrowUpRight, Download, Pencil, Plus, Trash2 } from "lucide-react";
import { useMemo, useState } from "react";

export default function ExpenseTransactions() {
  const { t } = useI18n();
  const transactions = useTransactions();
  const [filter, setFilter] = useState<DateFilter>({ kind: "month" });
  const [type, setType] = useState<"all" | "income" | "expense">("all");
  const [category, setCategory] = useState("all");
  const [method, setMethod] = useState("all");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Transaction | null>(null);
  const [defaultType, setDefaultType] = useState<"income" | "expense">("expense");

  const filtered = useMemo(
    () =>
      filterTransactions(transactions, filter, {
        type,
        category,
        method: method as Transaction["method"] | "all",
      }),
    [transactions, filter, type, category, method],
  );
  const totals = sumTransactions(filtered);

  function openEdit(tx: Transaction) {
    setEditing(tx);
    setDialogOpen(true);
  }

  function openNew() {
    setEditing(null);
    setDefaultType("expense");
    setDialogOpen(true);
  }

  function exportCsv() {
    const range = resolveDateRange(filter);
    downloadCsv(`transactions-${range.from}-to-${range.to}.csv`, [
      ["Date", "Type", "Category", "Method", "Amount", "Note"],
      ...filtered.map((tx) => [
        tx.date,
        tx.type,
        t(`exp.cat.${tx.category}`),
        t(`pay.${tx.method}`),
        tx.amount.toFixed(2),
        tx.note ?? "",
      ]),
    ]);
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">{t("nav.exp.transactions")}</h1>
          <p className="text-sm text-muted-foreground">{t("exp.count", { n: filtered.length })}</p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={exportCsv}
            disabled={filtered.length === 0}
            className="gap-2 rounded-xl"
          >
            <Download className="size-4" />
            CSV
          </Button>
          <Button onClick={openNew} className="gap-2 rounded-xl">
            <Plus className="size-4" />
            {t("exp.new")}
          </Button>
        </div>
      </div>

      <DateFilterBar value={filter} onChange={setFilter} />

      {/* Filters */}
      <div className="grid grid-cols-3 gap-2">
        <Select value={type} onValueChange={(v) => setType(v as typeof type)}>
          <SelectTrigger className="h-9 rounded-xl text-xs">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{t("filter.all")}</SelectItem>
            <SelectItem value="income">{t("exp.type.income")}</SelectItem>
            <SelectItem value="expense">{t("exp.type.expense")}</SelectItem>
          </SelectContent>
        </Select>
        <Select value={category} onValueChange={setCategory}>
          <SelectTrigger className="h-9 rounded-xl text-xs">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{t("exp.category")}: {t("filter.all")}</SelectItem>
            {[...EXPENSE_CATEGORIES, ...INCOME_CATEGORIES].map((c) => (
              <SelectItem key={c} value={c}>
                {t(`exp.cat.${c}`)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={method} onValueChange={setMethod}>
          <SelectTrigger className="h-9 rounded-xl text-xs">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{t("exp.method")}: {t("filter.all")}</SelectItem>
            {PAYMENT_METHODS.map((m) => (
              <SelectItem key={m} value={m}>
                {t(`pay.${m}`)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Period summary */}
      <div className="grid grid-cols-3 gap-2 text-center">
        <div className="rounded-2xl bg-muted/60 p-3">
          <p className="text-xs text-muted-foreground">{t("exp.totalIncome")}</p>
          <p className="text-sm font-bold text-emerald-600 dark:text-emerald-400">
            {money(totals.income)}
          </p>
        </div>
        <div className="rounded-2xl bg-muted/60 p-3">
          <p className="text-xs text-muted-foreground">{t("exp.totalExpense")}</p>
          <p className="text-sm font-bold text-rose-600 dark:text-rose-400">
            {money(totals.expense)}
          </p>
        </div>
        <div className="rounded-2xl bg-muted/60 p-3">
          <p className="text-xs text-muted-foreground">{t("exp.balance")}</p>
          <p className="text-sm font-bold">{money(totals.balance)}</p>
        </div>
      </div>

      {/* List */}
      <div className="space-y-1.5">
        {filtered.map((tx) => (
          <div
            key={tx.id}
            className="card-soft flex items-center gap-3 rounded-2xl border border-border/60 bg-card p-3"
          >
            <span
              className={
                "flex size-9 shrink-0 items-center justify-center rounded-xl bg-muted " +
                (tx.type === "income"
                  ? "text-emerald-600 dark:text-emerald-400"
                  : "text-rose-600 dark:text-rose-400")
              }
            >
              {tx.type === "income" ? (
                <ArrowDownLeft className="size-4" />
              ) : (
                <ArrowUpRight className="size-4" />
              )}
            </span>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium">
                {t(`exp.cat.${tx.category}`)}
                {tx.note ? <span className="text-muted-foreground"> · {tx.note}</span> : null}
              </p>
              <p className="text-xs text-muted-foreground">
                {tx.date} · {t(`pay.${tx.method}`)}
              </p>
            </div>
            <span
              className={
                "shrink-0 text-sm font-semibold " +
                (tx.type === "income"
                  ? "text-emerald-600 dark:text-emerald-400"
                  : "text-rose-600 dark:text-rose-400")
              }
            >
              {tx.type === "income" ? "+" : "−"}
              {money(tx.amount)}
            </span>
            <div className="flex shrink-0 gap-0.5">
              <Button variant="ghost" size="icon" className="size-8 rounded-lg" onClick={() => openEdit(tx)}>
                <Pencil className="size-3.5" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="size-8 rounded-lg text-destructive"
                onClick={() => deleteTransaction(tx.id)}
              >
                <Trash2 className="size-3.5" />
              </Button>
            </div>
          </div>
        ))}
        {filtered.length === 0 && (
          <div className="rounded-2xl border border-dashed border-border/70 p-8 text-center">
            <p className="text-sm font-medium">{t("exp.empty")}</p>
            <p className="mt-1 text-xs text-muted-foreground">{t("exp.emptySub")}</p>
          </div>
        )}
      </div>

      <TransactionDialog
        open={dialogOpen}
        onOpenChange={(v) => {
          setDialogOpen(v);
          if (!v) setEditing(null);
        }}
        editing={editing}
        defaultType={defaultType}
      />
    </div>
  );
}
