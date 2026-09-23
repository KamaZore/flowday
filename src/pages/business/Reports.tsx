import { DateFilterBar } from "@/components/systems/DateFilterBar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useI18n } from "@/lib/i18n";
import { money } from "@/lib/format";
import {
  businessStats,
  filterOrders,
  useBusiness,
  type DateFilter,
} from "@/lib/store";
import { TrendingUp } from "lucide-react";
import { useMemo, useState } from "react";
import {
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
} from "recharts";

const COLORS = ["#8b5cf6", "#f43f5e", "#f59e0b", "#06b6d4", "#10b981", "#ec4899", "#64748b", "#84cc16"];

export default function BusinessReports() {
  const { t } = useI18n();
  const business = useBusiness();
  const [filter, setFilter] = useState<DateFilter>({ kind: "month" });

  const stats = businessStats(
    business.orders,
    business.expenses,
    business.purchases,
    filter,
  );
  const orders = useMemo(
    () => filterOrders(business.orders, filter),
    [business.orders, filter],
  );

  const expenseData = stats.byCategory.map((c, i) => ({
    name: t(`biz.cat.${c.category}`) !== `biz.cat.${c.category}` ? t(`biz.cat.${c.category}`) : c.category,
    value: c.total,
    color: COLORS[i % COLORS.length],
  }));

  const pnl = [
    { label: t("biz.revenue"), value: stats.revenue, bold: false, positive: true },
    { label: t("biz.cogs"), value: -stats.cogs, bold: false, positive: false },
    { label: t("biz.grossProfit"), value: stats.grossProfit, bold: true, positive: stats.grossProfit >= 0 },
    { label: t("biz.bizExpense"), value: -stats.expenses, bold: false, positive: false },
    { label: t("biz.netProfit"), value: stats.netProfit, bold: true, positive: stats.netProfit >= 0 },
  ];

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">{t("nav.biz.reports")}</h1>
        <p className="text-sm text-muted-foreground">{t("biz.profitFormula")}</p>
      </div>

      <DateFilterBar value={filter} onChange={setFilter} />

      <div className="grid gap-4 lg:grid-cols-2">
        {/* P&L */}
        <Card className="rounded-3xl">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-base">
              <TrendingUp className="size-4 text-emerald-600 dark:text-emerald-400" />
              {t("biz.netProfit")}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="divide-y divide-border/40">
              {pnl.map((row) => (
                <div
                  key={row.label}
                  className={
                    "flex items-center justify-between py-2.5 text-sm " +
                    (row.bold ? "font-bold" : "")
                  }
                >
                  <span className={row.bold ? "" : "text-muted-foreground"}>{row.label}</span>
                  <span
                    className={
                      row.positive
                        ? "text-emerald-600 dark:text-emerald-400"
                        : "text-rose-600 dark:text-rose-400"
                    }
                  >
                    {row.value < 0 ? "−" : ""}
                    {money(Math.abs(row.value))}
                  </span>
                </div>
              ))}
            </div>
            <p className="mt-3 rounded-xl bg-muted/60 px-3 py-2 text-xs text-muted-foreground">
              {t("biz.orders")}: {stats.orderCount} · {t("biz.avgOrder")}: {money(stats.avgOrder)} ·{" "}
              {t("nav.biz.purchases")}: {money(stats.purchases)}
            </p>
          </CardContent>
        </Card>

        {/* Expense breakdown */}
        <Card className="rounded-3xl">
          <CardHeader className="pb-2">
            <CardTitle className="text-base">{t("biz.expenseCategories")}</CardTitle>
          </CardHeader>
          <CardContent>
            {expenseData.length === 0 ? (
              <p className="py-16 text-center text-sm text-muted-foreground">
                {t("biz.bizExpensesEmpty")}
              </p>
            ) : (
              <div className="flex flex-col items-center gap-4 sm:flex-row">
                <div className="h-44 w-44 shrink-0">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie data={expenseData} dataKey="value" nameKey="name" innerRadius={45} outerRadius={75} paddingAngle={2}>
                        {expenseData.map((d) => (
                          <Cell key={d.name} fill={d.color} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(v) => money(Number(v))} contentStyle={{ borderRadius: 12, fontSize: 12 }} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <div className="w-full space-y-1.5">
                  {expenseData.map((d) => (
                    <div key={d.name} className="flex items-center gap-2 text-sm">
                      <span className="size-2.5 shrink-0 rounded-full" style={{ background: d.color }} />
                      <span className="min-w-0 flex-1 truncate">{d.name}</span>
                      <span className="font-semibold">{money(d.value)}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Orders list (compact) */}
      <Card className="rounded-3xl">
        <CardHeader className="pb-2">
          <CardTitle className="text-base">
            {t("nav.biz.sales")} · {t("exp.count", { n: orders.length })}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="max-h-72 space-y-1.5 overflow-y-auto">
            {orders.slice(0, 30).map((o) => (
              <div key={o.id} className="flex items-center justify-between gap-3 rounded-xl px-2 py-1.5 text-sm">
                <span className="shrink-0 font-mono text-xs text-muted-foreground">#{o.number}</span>
                <span className="min-w-0 flex-1 truncate text-xs text-muted-foreground">
                  {new Date(o.createdAt).toLocaleString()}
                </span>
                <span
                  className={
                    "shrink-0 rounded-full px-2 py-0.5 text-[10px] font-semibold " +
                    (o.status === "refunded" ? "bg-muted text-muted-foreground" : "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400")
                  }
                >
                  {o.status === "refunded" ? t("biz.refunded") : t("biz.completed")}
                </span>
                <span className="shrink-0 font-semibold">{money(o.total)}</span>
              </div>
            ))}
            {orders.length === 0 && (
              <p className="py-8 text-center text-sm text-muted-foreground">{t("biz.noSales")}</p>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
