import { DateFilterBar } from "@/components/systems/DateFilterBar";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
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
import { useI18n } from "@/lib/i18n";
import { money } from "@/lib/format";
import { todayKey } from "@/lib/date-utils";
import {
  addBusinessExpense,
  deleteBusinessExpense,
  filterBusinessExpenses,
  updateBusinessExpense,
  useBusiness,
  type DateFilter,
} from "@/lib/store";
import { BUSINESS_EXPENSE_CATEGORIES, PAYMENT_METHODS, type BusinessExpense } from "@/lib/types";
import { Pencil, Plus, Receipt, Trash2 } from "lucide-react";
import { useEffect, useState } from "react";

export default function BusinessExpenses() {
  const { t } = useI18n();
  const business = useBusiness();
  const [filter, setFilter] = useState<DateFilter>({ kind: "month" });
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<BusinessExpense | null>(null);
  const [form, setForm] = useState({
    category: "rent",
    amount: "",
    method: "cash",
    date: todayKey(),
    note: "",
  });

  const filtered = filterBusinessExpenses(business.expenses, filter);
  const total = filtered.reduce((s, e) => s + e.amount, 0);

  useEffect(() => {
    if (!open) return;
    if (editing) {
      setForm({
        category: editing.category,
        amount: String(editing.amount),
        method: editing.method,
        date: editing.date,
        note: editing.note ?? "",
      });
    } else {
      setForm({ category: "rent", amount: "", method: "cash", date: todayKey(), note: "" });
    }
  }, [open, editing]);

  function handleSave() {
    const amount = Number(form.amount);
    if (!amount || amount <= 0) return;
    const payload = {
      category: form.category,
      amount: Math.round(amount * 100) / 100,
      method: form.method as BusinessExpense["method"],
      date: form.date,
      note: form.note.trim() || undefined,
    };
    if (editing) updateBusinessExpense(editing.id, payload);
    else addBusinessExpense(payload);
    setOpen(false);
    setEditing(null);
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">{t("nav.biz.expenses")}</h1>
          <p className="text-sm text-muted-foreground">{t("biz.bizExpense")}</p>
        </div>
        <Button
          onClick={() => {
            setEditing(null);
            setOpen(true);
          }}
          className="gap-2 rounded-xl"
        >
          <Plus className="size-4" />
          {t("biz.addBizExpense")}
        </Button>
      </div>

      <DateFilterBar value={filter} onChange={setFilter} />

      <div className="rounded-2xl bg-muted/60 p-4">
        <p className="text-xs text-muted-foreground">{t("biz.monthExpenses")}</p>
        <p className="text-2xl font-bold">{money(total)}</p>
      </div>

      <div className="space-y-2">
        {filtered.map((e) => (
          <div
            key={e.id}
            className="card-soft flex items-center gap-3 rounded-2xl border border-border/60 bg-card p-3.5"
          >
            <span className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-rose-500/10 text-rose-600 dark:text-rose-400">
              <Receipt className="size-4" />
            </span>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium">
                {t(`biz.cat.${e.category}`) !== `biz.cat.${e.category}`
                  ? t(`biz.cat.${e.category}`)
                  : e.category}
                {e.note ? <span className="text-muted-foreground"> · {e.note}</span> : null}
              </p>
              <p className="text-xs text-muted-foreground">
                {e.date} · {t(`pay.${e.method}`)}
              </p>
            </div>
            <span className="shrink-0 text-sm font-semibold text-rose-600 dark:text-rose-400">
              −{money(e.amount)}
            </span>
            <div className="flex shrink-0 gap-0.5">
              <Button
                variant="ghost"
                size="icon"
                className="size-8 rounded-lg"
                onClick={() => {
                  setEditing(e);
                  setOpen(true);
                }}
              >
                <Pencil className="size-3.5" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="size-8 rounded-lg text-destructive"
                onClick={() => deleteBusinessExpense(e.id)}
              >
                <Trash2 className="size-3.5" />
              </Button>
            </div>
          </div>
        ))}
        {filtered.length === 0 && (
          <div className="rounded-2xl border border-dashed border-border/70 p-10 text-center">
            <Receipt className="mx-auto mb-2 size-8 text-muted-foreground/50" />
            <p className="text-sm font-medium">{t("biz.bizExpensesEmpty")}</p>
          </div>
        )}
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="rounded-3xl sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>{t("biz.addBizExpense")}</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div className="space-y-1.5">
              <Label>{t("exp.category")}</Label>
              <Select value={form.category} onValueChange={(v) => setForm({ ...form, category: v })}>
                <SelectTrigger className="h-10 rounded-xl">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {BUSINESS_EXPENSE_CATEGORIES.map((c) => (
                    <SelectItem key={c} value={c}>
                      {t(`biz.cat.${c}`)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="be-amount">{t("exp.amount")}</Label>
              <Input
                id="be-amount"
                type="number"
                min="0"
                step="0.01"
                value={form.amount}
                onChange={(e) => setForm({ ...form, amount: e.target.value })}
                className="h-11 rounded-xl text-lg font-semibold"
                autoFocus
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>{t("exp.method")}</Label>
                <Select value={form.method} onValueChange={(v) => setForm({ ...form, method: v })}>
                  <SelectTrigger className="h-10 rounded-xl">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {PAYMENT_METHODS.map((m) => (
                      <SelectItem key={m} value={m}>
                        {t(`pay.${m}`)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="be-date">{t("exp.date")}</Label>
                <Input
                  id="be-date"
                  type="date"
                  value={form.date}
                  onChange={(e) => setForm({ ...form, date: e.target.value })}
                  className="h-10 rounded-xl"
                />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="be-note">{t("exp.note")}</Label>
              <Input
                id="be-note"
                value={form.note}
                onChange={(e) => setForm({ ...form, note: e.target.value })}
                className="h-10 rounded-xl"
              />
            </div>
          </div>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setOpen(false)} className="rounded-xl">
              {t("common.cancel")}
            </Button>
            <Button onClick={handleSave} disabled={!Number(form.amount)} className="rounded-xl">
              {t("common.save")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
