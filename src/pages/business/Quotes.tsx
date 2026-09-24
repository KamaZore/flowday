import { FadeIn, StatCard } from "@/components/systems/Shared";
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
import { money } from "@/lib/format";
import { useI18n } from "@/lib/i18n";
import {
  acceptQuote,
  addQuote,
  deleteQuote,
  updateQuoteStatus,
  useProducts,
  useQuotes,
} from "@/lib/store";
import { updateQuote } from "@/lib/quotes";
import type { OrderLine, Quote, QuoteStatus } from "@/lib/types";
import {
  Check,
  FilePlus2,
  Pencil,
  Plus,
  Send,
  ShoppingCart,
  Trash2,
  X,
} from "lucide-react";
import { useMemo, useState } from "react";
import { toast } from "sonner";

const STATUS_TINT: Record<QuoteStatus, string> = {
  draft: "bg-muted text-muted-foreground",
  sent: "bg-sky-500/12 text-sky-600 dark:text-sky-400",
  accepted: "bg-emerald-500/12 text-emerald-600 dark:text-emerald-400",
  declined: "bg-rose-500/12 text-rose-600 dark:text-rose-400",
};

export default function BusinessQuotes() {
  const { t } = useI18n();
  const quotes = useQuotes();
  const products = useProducts();
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Quote | null>(null);
  const [customerName, setCustomerName] = useState("");
  const [note, setNote] = useState("");
  const [lines, setLines] = useState<OrderLine[]>([]);

  const stats = useMemo(() => {
    let openValue = 0;
    let acceptedValue = 0;
    let acceptedCount = 0;
    for (const q of quotes) {
      if (q.status === "accepted") {
        acceptedValue += q.total;
        acceptedCount++;
      } else if (q.status !== "declined") {
        openValue += q.total;
      }
    }
    return { openValue, acceptedValue, acceptedCount };
  }, [quotes]);

  function openAdd() {
    setEditing(null);
    setCustomerName("");
    setNote("");
    const p = products[0];
    setLines(
      p
        ? [{ productId: p.id, name: p.name, qty: 1, price: p.price, cost: p.cost, discount: 0 }]
        : [],
    );
    setOpen(true);
  }

  function openEdit(q: Quote) {
    setEditing(q);
    setCustomerName(q.customerName);
    setNote(q.note ?? "");
    setLines(q.lines.map((l) => ({ ...l })));
    setOpen(true);
  }

  function updateLine(idx: number, patch: Partial<OrderLine>) {
    setLines((ls) => ls.map((l, i) => (i === idx ? { ...l, ...patch } : l)));
  }

  function removeLine(idx: number) {
    setLines((ls) => ls.filter((_, i) => i !== idx));
  }

  function addLine() {
    const p = products[0];
    setLines((ls) => [
      ...ls,
      {
        productId: p?.id,
        name: p?.name ?? "",
        qty: 1,
        price: p?.price ?? 0,
        cost: p?.cost ?? 0,
        discount: 0,
      },
    ]);
  }

  const draftTotal = lines.reduce(
    (s, l) => s + l.qty * l.price * (1 - l.discount / 100),
    0,
  );

  function save() {
    const name = customerName.trim();
    const usable = lines.filter((l) => l.productId && l.qty > 0);
    if (!name || usable.length === 0) return;
    if (editing) {
      // Editable quotes keep their totals in sync manually (quotes carry
      // precomputed totals, so recompute them here).
      const subtotal = usable.reduce((s, l) => s + l.qty * l.price, 0);
      const discountTotal = usable.reduce(
        (s, l) => s + l.qty * l.price * (l.discount / 100),
        0,
      );
      const costTotal = usable.reduce((s, l) => s + l.qty * l.cost, 0);
      updateQuote(editing.id, {
        customerName: name,
        lines: usable,
        note: note.trim() || undefined,
        subtotal,
        discountTotal,
        total: subtotal - discountTotal,
        costTotal,
      });
      toast.success(t("biz.quoteSaved"));
    } else {
      addQuote({ customerName: name, lines: usable, note: note.trim() || undefined });
      toast.success(t("biz.quoteSaved"));
    }
    setOpen(false);
  }

  function markSent(q: Quote) {
    updateQuoteStatus(q.id, "sent");
    toast.success(t("biz.markSent"));
  }

  function accept(q: Quote) {
    const order = acceptQuote(q.id);
    if (order) toast.success(`${t("biz.quoteAccepted")} · #${order.number}`);
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">{t("biz.quotes")}</h1>
          <p className="text-sm text-muted-foreground">{t("biz.quotesSub")}</p>
        </div>
        <Button onClick={openAdd} className="gap-2 rounded-xl">
          <Plus className="size-4" />
          {t("biz.addQuote")}
        </Button>
      </div>

      <div className="grid grid-cols-3 gap-3">
        <StatCard label={t("biz.quoteValue")} value={money(stats.openValue)} icon={FilePlus2} tone="text-violet-600 dark:text-violet-400" tint="bg-violet-500/12" />
        <StatCard label={t("biz.status.accepted")} value={String(stats.acceptedCount)} icon={Check} tone="text-emerald-600 dark:text-emerald-400" tint="bg-emerald-500/12" />
        <StatCard label={t("biz.revenue")} value={money(stats.acceptedValue)} icon={ShoppingCart} tone="text-sky-600 dark:text-sky-400" tint="bg-sky-500/12" />
      </div>

      <div className="space-y-2.5">
        {quotes.map((q, i) => (
          <FadeIn key={q.id} delay={i * 0.03}>
            <div className="card-soft rounded-2xl border border-border/60 bg-card p-4">
              <div className="flex items-center gap-3">
                <span className="flex size-10 shrink-0 items-center justify-center rounded-2xl bg-violet-500/12 text-xs font-bold text-violet-600 dark:text-violet-400">
                  #{q.number}
                </span>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="truncate text-sm font-semibold">{q.customerName}</p>
                    <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${STATUS_TINT[q.status]}`}>
                      {t(`biz.status.${q.status}`)}
                    </span>
                  </div>
                  <p className="mt-0.5 truncate text-xs text-muted-foreground">
                    {q.lines.map((l) => `${l.qty}× ${l.name}`).join(", ")}
                    {q.note ? ` · ${q.note}` : ""}
                  </p>
                </div>
                <div className="flex shrink-0 items-center gap-1">
                  <p className="text-sm font-bold tabular-nums">{money(q.total)}</p>
                  {q.status === "draft" && (
                    <Button variant="ghost" size="icon" className="size-7 rounded-lg" onClick={() => openEdit(q)} aria-label={t("common.edit")}>
                      <Pencil className="size-3.5" />
                    </Button>
                  )}
                  {q.status === "draft" && (
                    <Button variant="ghost" size="icon" className="size-7 rounded-lg text-sky-600 dark:text-sky-400" onClick={() => markSent(q)} aria-label={t("biz.markSent")}>
                      <Send className="size-3.5" />
                    </Button>
                  )}
                  {(q.status === "draft" || q.status === "sent") && (
                    <Button variant="ghost" size="icon" className="size-7 rounded-lg text-emerald-600 dark:text-emerald-400" onClick={() => accept(q)} aria-label={t("biz.acceptQuote")}>
                      <Check className="size-3.5" />
                    </Button>
                  )}
                  <Button
                    variant="ghost"
                    size="icon"
                    className="size-7 rounded-lg text-destructive"
                    onClick={() => deleteQuote(q.id)}
                  >
                    <Trash2 className="size-3.5" />
                  </Button>
                </div>
              </div>
            </div>
          </FadeIn>
        ))}
        {quotes.length === 0 && (
          <div className="rounded-2xl border border-dashed border-border/70 p-10 text-center">
            <FilePlus2 className="mx-auto mb-2 size-8 text-muted-foreground/50" />
            <p className="text-sm font-medium">{t("biz.addQuote")}</p>
            <p className="mt-1 text-xs text-muted-foreground">{t("biz.quotesSub")}</p>
          </div>
        )}
      </div>

      {/* Add / edit dialog */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="rounded-3xl sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{editing ? t("biz.editQuote") : t("biz.addQuote")}</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div className="space-y-1.5">
              <Label htmlFor="quote-cust">{t("biz.quoteFor")}</Label>
              <Input
                id="quote-cust"
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                className="h-10 rounded-xl"
                autoFocus
              />
            </div>

            <div className="space-y-1.5">
              <Label>{t("biz.purchaseItems")}</Label>
              <div className="space-y-2">
                {lines.map((l, idx) => (
                  <div key={idx} className="flex items-center gap-1.5">
                    <Select
                      value={l.productId ?? ""}
                      onValueChange={(pid) => {
                        const p = products.find((x) => x.id === pid);
                        if (p)
                          updateLine(idx, {
                            productId: p.id,
                            name: p.name,
                            price: p.price,
                            cost: p.cost,
                          });
                      }}
                    >
                      <SelectTrigger className="h-9 flex-1 rounded-xl text-xs">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {products.map((p) => (
                          <SelectItem key={p.id} value={p.id}>
                            {p.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Input
                      type="number"
                      min="1"
                      value={l.qty}
                      onChange={(e) =>
                        updateLine(idx, { qty: Math.max(1, Number(e.target.value) || 1) })
                      }
                      className="h-9 w-16 rounded-xl text-xs"
                      inputMode="numeric"
                      aria-label="qty"
                    />
                    <button
                      onClick={() => removeLine(idx)}
                      className="rounded-lg p-1.5 text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive"
                      aria-label="remove line"
                    >
                      <X className="size-3.5" />
                    </button>
                  </div>
                ))}
                <Button type="button" variant="outline" size="sm" onClick={addLine} className="gap-1.5 rounded-xl text-xs">
                  <Plus className="size-3.5" />
                  {t("biz.addItem")}
                </Button>
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="quote-note">{t("exp.note")}</Label>
              <Input
                id="quote-note"
                value={note}
                onChange={(e) => setNote(e.target.value)}
                className="h-10 rounded-xl"
              />
            </div>

            <div className="flex items-center justify-between rounded-xl bg-muted/60 px-3 py-2.5">
              <span className="text-xs font-medium text-muted-foreground">{t("biz.total")}</span>
              <span className="text-sm font-bold tabular-nums">{money(draftTotal)}</span>
            </div>
          </div>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setOpen(false)} className="rounded-xl">
              {t("common.cancel")}
            </Button>
            <Button
              onClick={save}
              disabled={!(customerName.trim() && lines.some((l) => l.productId && l.qty > 0))}
              className="rounded-xl"
            >
              {t("common.save")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
