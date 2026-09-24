import { DateFilterBar } from "@/components/systems/DateFilterBar";
import { FadeIn } from "@/components/systems/Shared";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useI18n } from "@/lib/i18n";
import { money, moneyShort } from "@/lib/format";
import { downloadCsv, printReceipt } from "@/lib/export";
import {
  businessStats,
  filterOrders,
  refundOrder,
  resolveDateRange,
  useBusiness,
  type DateFilter,
} from "@/lib/store";
import { type Order } from "@/lib/types";
import { Download, FileText, Printer, RotateCcw } from "lucide-react";
import { useMemo, useState } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

export default function BusinessSales() {
  const { t } = useI18n();
  const business = useBusiness();
  const [filter, setFilter] = useState<DateFilter>({ kind: "week" });
  const [viewing, setViewing] = useState<Order | null>(null);
  const [refunding, setRefunding] = useState<Order | null>(null);

  const orders = useMemo(
    () => filterOrders(business.orders, filter),
    [business.orders, filter],
  );
  const stats = businessStats(
    business.orders,
    business.expenses,
    business.purchases,
    filter,
  );
  const range = resolveDateRange(filter);
  const customerName = (id?: string) =>
    business.customers.find((c) => c.id === id)?.name ?? t("biz.noCustomer");

  const chartData = useMemo(() => {
    const map = new Map<string, number>();
    for (const o of orders) {
      if (o.status !== "completed") continue;
      const day = new Date(o.createdAt).toISOString().slice(0, 10);
      map.set(day, (map.get(day) ?? 0) + o.total);
    }
    return [...map.entries()]
      .sort((a, b) => a[0].localeCompare(b[0]))
      .map(([date, v]) => ({ date: date.slice(5), sales: v }));
  }, [orders]);

  function exportCsv() {
    downloadCsv(`sales-${range.from}-to-${range.to}.csv`, [
      [
        "Receipt #",
        "Date",
        "Customer",
        "Items",
        "Subtotal",
        "Discount",
        "Tax",
        "Total",
        "COGS",
        "Method",
        "Status",
      ],
      ...orders.map((o) => [
        o.number,
        new Date(o.createdAt).toLocaleString(),
        customerName(o.customerId),
        o.lines.map((l) => `${l.name} x${l.qty}`).join("; "),
        o.subtotal.toFixed(2),
        o.discountTotal.toFixed(2),
        o.taxTotal.toFixed(2),
        o.total.toFixed(2),
        o.costTotal.toFixed(2),
        t(`pay.${o.method}`),
        o.status,
      ]),
    ]);
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">{t("nav.biz.sales")}</h1>
          <p className="text-sm text-muted-foreground">
            {t("biz.orders")}: {stats.orderCount} · {t("biz.avgOrder")}: {money(stats.avgOrder)}
          </p>
        </div>
        <Button
          variant="outline"
          onClick={exportCsv}
          disabled={orders.length === 0}
          className="gap-2 rounded-xl"
        >
          <Download className="size-4" />
          CSV
        </Button>
      </div>

      <DateFilterBar value={filter} onChange={setFilter} />

      <Card className="card-soft rounded-3xl border-border/60">
        <CardHeader className="pb-0">
          <CardTitle className="text-base">{t("biz.todaySales")}</CardTitle>
        </CardHeader>
        <CardContent className="pt-4">
          <div className="h-52">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} margin={{ top: 4, right: 4, bottom: 0, left: -14 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} className="stroke-border" />
                <XAxis dataKey="date" tick={{ fontSize: 10 }} tickLine={false} axisLine={false} />
                <YAxis
                  tick={{ fontSize: 10 }}
                  tickLine={false}
                  axisLine={false}
                  tickFormatter={(v: number) => moneyShort(v)}
                  width={52}
                />
                <Tooltip formatter={(v) => money(Number(v))} contentStyle={{ borderRadius: 12, fontSize: 12 }} />
                <Bar dataKey="sales" fill="#8b5cf6" radius={[3, 3, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      <div className="space-y-2">
        {orders.map((o, i) => (
          <FadeIn key={o.id} delay={Math.min(i * 0.03, 0.3)}>
            <div className="card-soft flex items-center gap-3 rounded-2xl border border-border/60 bg-card p-3.5 transition-shadow hover:shadow-md">
              <span
                className={
                  "flex size-9 shrink-0 items-center justify-center rounded-xl " +
                  (o.status === "refunded"
                    ? "bg-muted text-muted-foreground"
                    : "bg-violet-500/10 text-violet-600 dark:text-violet-400")
                }
              >
                <FileText className="size-4" />
              </span>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold">
                  #{o.number} · {customerName(o.customerId)}
                </p>
                <p className="truncate text-xs text-muted-foreground">
                  {new Date(o.createdAt).toLocaleString()} · {t(`pay.${o.method}`)} ·{" "}
                  {o.lines.reduce((s, l) => s + l.qty, 0)} items
                </p>
              </div>
              <div className="hidden shrink-0 items-center gap-2 sm:flex">
                <span
                  className={
                    "rounded-full px-2 py-0.5 text-[10px] font-semibold " +
                    (o.status === "refunded"
                      ? "bg-muted text-muted-foreground"
                      : "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400")
                  }
                >
                  {o.status === "refunded" ? t("biz.refunded") : t("biz.completed")}
                </span>
                <span className="text-sm font-bold">{money(o.total)}</span>
              </div>
              <div className="flex shrink-0 gap-0.5">
                <Button variant="ghost" size="sm" className="h-8 rounded-lg px-2 text-xs" onClick={() => setViewing(o)}>
                  {t("biz.receipt")}
                </Button>
                {o.status === "completed" && (
                  <Button
                    variant="ghost"
                    size="icon"
                    className="size-8 rounded-lg text-amber-600 dark:text-amber-400"
                    onClick={() => setRefunding(o)}
                  >
                    <RotateCcw className="size-3.5" />
                  </Button>
                )}
              </div>
            </div>
          </FadeIn>
        ))}
        {orders.length === 0 && (
          <div className="rounded-2xl border border-dashed border-border/70 p-10 text-center">
            <FileText className="mx-auto mb-2 size-8 text-muted-foreground/50" />
            <p className="text-sm font-medium">{t("biz.noSales")}</p>
          </div>
        )}
      </div>

      {/* Receipt viewer */}
      <Dialog open={Boolean(viewing)} onOpenChange={(v) => !v && setViewing(null)}>
        <DialogContent className="rounded-3xl sm:max-w-sm">
          <DialogHeader className="flex-row items-center justify-between space-y-0 pr-10">
            <DialogTitle>
              {t("biz.receipt")} #{viewing?.number}
            </DialogTitle>
            {viewing && (
              <Button
                variant="outline"
                size="sm"
                className="gap-1.5 rounded-lg text-xs"
                onClick={() =>
                  printReceipt({
                    shopName: business.shopName,
                    number: viewing.number,
                    createdAt: viewing.createdAt,
                    method: viewing.method,
                    lines: viewing.lines,
                    subtotal: viewing.subtotal,
                    discountTotal: viewing.discountTotal,
                    taxTotal: viewing.taxTotal,
                    total: viewing.total,
                    amountPaid: viewing.amountPaid,
                    change: viewing.change,
                  })
                }
              >
                <Printer className="size-3.5" />
                {t("biz.print")}
              </Button>
            )}
          </DialogHeader>
          {viewing && (
            <div className="space-y-2 font-mono text-sm">
              {viewing.lines.map((l, i) => (
                <div key={i} className="flex justify-between gap-2 text-xs">
                  <span className="min-w-0 flex-1 truncate">
                    {l.name} ×{l.qty}
                  </span>
                  <span>{money(l.qty * l.price * (1 - l.discount / 100))}</span>
                </div>
              ))}
              <div className="flex justify-between border-t border-dashed border-border/60 pt-2 font-bold">
                <span>{t("biz.total")}</span>
                <span>{money(viewing.total)}</span>
              </div>
              <p className="text-xs text-muted-foreground">
                {t(`pay.${viewing.method}`)} · {new Date(viewing.createdAt).toLocaleString()}
              </p>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Refund confirm */}
      <AlertDialog open={Boolean(refunding)} onOpenChange={(v) => !v && setRefunding(null)}>
        <AlertDialogContent className="rounded-3xl">
          <AlertDialogHeader>
            <AlertDialogTitle>
              {t("biz.refund")} #{refunding?.number}?
            </AlertDialogTitle>
            <AlertDialogDescription>{t("biz.confirmRefund")}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="rounded-xl">{t("common.cancel")}</AlertDialogCancel>
            <AlertDialogAction
              className="rounded-xl"
              onClick={() => {
                if (refunding) refundOrder(refunding.id);
                setRefunding(null);
              }}
            >
              {t("biz.refund")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
