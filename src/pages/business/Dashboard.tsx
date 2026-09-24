import { OfflineBanner } from "@/components/app/OfflineBanner";
import { DateFilterBar } from "@/components/systems/DateFilterBar";
import { FadeIn, StatCard } from "@/components/systems/Shared";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useI18n } from "@/lib/i18n";
import { money, moneyShort } from "@/lib/format";
import {
  businessStats,
  dailySales,
  lowStockProducts,
  resolveDateRange,
  useBusiness,
  useProducts,
  type DateFilter,
} from "@/lib/store";
import { PAYMENT_METHODS } from "@/lib/types";
import {
  AlertTriangle,
  Banknote,
  Boxes,
  FileText,
  Percent,
  Receipt,
  ShoppingCart,
  TrendingUp,
} from "lucide-react";
import { useMemo, useState } from "react";
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { Link } from "react-router";

export default function BusinessDashboard() {
  const { t } = useI18n();
  const business = useBusiness();
  const products = useProducts();
  const [filter, setFilter] = useState<DateFilter>({ kind: "month" });

  const stats = businessStats(
    business.orders,
    business.expenses,
    business.purchases,
    filter,
  );
  const range = resolveDateRange(filter);
  const chart = useMemo(
    () =>
      dailySales(business.orders, business.expenses, range.from, range.to).map((d) => ({
        date: d.date.slice(5),
        revenue: d.revenue,
        profit: d.profit,
      })),
    [business.orders, range],
  );

  // Today / this month KPI sets (independent of the filter for the quick glance)
  const todayStats = businessStats(
    business.orders,
    business.expenses,
    business.purchases,
    { kind: "today" },
  );
  const monthStats = businessStats(
    business.orders,
    business.expenses,
    business.purchases,
    { kind: "month" },
  );
  const low = lowStockProducts(products);

  return (
    <div className="space-y-5">
      <OfflineBanner />
      <div>
        <h1 className="text-2xl font-bold tracking-tight">{t("system.business.name")}</h1>
        <p className="text-sm text-muted-foreground">{t("biz.profitFormula")}</p>
      </div>

      <DateFilterBar value={filter} onChange={setFilter} />

      {/* Filtered KPIs */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard
          label={t("biz.revenue")}
          value={money(stats.revenue)}
          sub={`${stats.orderCount} ${t("biz.orders")}`}
          icon={Banknote}
          tone="text-violet-600 dark:text-violet-400"
          delay={0}
        />
        <StatCard
          label={t("biz.cogs")}
          value={money(stats.cogs)}
          sub={`${t("biz.refunds")}: ${money(stats.refunds)}`}
          icon={Receipt}
          tone="text-amber-600 dark:text-amber-400"
          delay={0.05}
        />
        <StatCard
          label={t("biz.grossProfit")}
          value={money(stats.grossProfit)}
          sub={`${t("biz.expenses")}: ${money(stats.expenses)}`}
          icon={Percent}
          tone="text-sky-600 dark:text-sky-400"
          delay={0.1}
        />
        <StatCard
          label={t("biz.netProfit")}
          value={money(stats.netProfit)}
          sub={t("biz.profitFormula")}
          icon={TrendingUp}
          tone={stats.netProfit >= 0 ? "text-emerald-600 dark:text-emerald-400" : "text-rose-600 dark:text-rose-400"}
          delay={0.15}
        />
      </div>

      {/* Today / month quick glance */}
      <FadeIn delay={0.2}>
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          <MiniKpi label={t("biz.todaySales")} value={money(todayStats.revenue)} />
          <MiniKpi label={t("biz.todayProfit")} value={money(todayStats.grossProfit - todayStats.expenses)} />
          <MiniKpi label={t("biz.monthSales")} value={money(monthStats.revenue)} />
          <MiniKpi label={t("biz.monthProfit")} value={money(monthStats.grossProfit - monthStats.expenses)} />
        </div>
      </FadeIn>

      {/* Revenue & profit chart */}
      <Card className="rounded-3xl">
        <CardHeader className="pb-0">
          <CardTitle className="text-base">{t("biz.revenue")} / {t("biz.profit")}</CardTitle>
        </CardHeader>
        <CardContent className="pt-4">
          <div className="h-60">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chart} margin={{ top: 4, right: 4, bottom: 0, left: -14 }}>
                <defs>
                  <linearGradient id="rev" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#8b5cf6" stopOpacity={0.35} />
                    <stop offset="100%" stopColor="#8b5cf6" stopOpacity={0.02} />
                  </linearGradient>
                  <linearGradient id="prof" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#10b981" stopOpacity={0.35} />
                    <stop offset="100%" stopColor="#10b981" stopOpacity={0.02} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} className="stroke-border" />
                <XAxis dataKey="date" tick={{ fontSize: 10 }} tickLine={false} axisLine={false} interval="preserveStartEnd" />
                <YAxis tick={{ fontSize: 10 }} tickLine={false} axisLine={false} tickFormatter={(v: number) => moneyShort(v)} width={52} />
                <Tooltip formatter={(v) => money(Number(v))} contentStyle={{ borderRadius: 12, fontSize: 12 }} />
                <Area type="monotone" dataKey="revenue" stroke="#8b5cf6" fill="url(#rev)" strokeWidth={2} />
                <Area type="monotone" dataKey="profit" stroke="#10b981" fill="url(#prof)" strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-4 lg:grid-cols-3">
        {/* Top products */}
        <Card className="rounded-3xl">
          <CardHeader className="pb-2">
            <CardTitle className="text-base">{t("biz.topProducts")}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {stats.topProducts.length === 0 && (
              <p className="text-sm text-muted-foreground">{t("biz.noSales")}</p>
            )}
            {stats.topProducts.map((p, i) => (
              <div key={p.name} className="flex items-center gap-2.5">
                <span className="flex size-6 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-xs font-bold text-primary">
                  {i + 1}
                </span>
                <span className="min-w-0 flex-1 truncate text-sm font-medium">{p.name}</span>
                <span className="shrink-0 text-xs text-muted-foreground">×{p.qty}</span>
                <span className="shrink-0 text-sm font-semibold">{money(p.revenue)}</span>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Payment methods */}
        <Card className="rounded-3xl">
          <CardHeader className="pb-2">
            <CardTitle className="text-base">{t("biz.byMethod")}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2.5">
            {PAYMENT_METHODS.map((m) => {
              const total = stats.byMethod[m];
              const pct = stats.revenue ? Math.round((total / stats.revenue) * 100) : 0;
              if (total === 0) return null;
              return (
                <div key={m}>
                  <div className="mb-1 flex items-center justify-between text-xs">
                    <span className="font-medium">{t(`pay.${m}`)}</span>
                    <span className="text-muted-foreground">{money(total)} · {pct}%</span>
                  </div>
                  <div className="h-2 overflow-hidden rounded-full bg-muted">
                    <div className="h-full rounded-full bg-violet-500" style={{ width: `${pct}%` }} />
                  </div>
                </div>
              );
            })}
            {stats.revenue === 0 && (
              <p className="text-sm text-muted-foreground">{t("biz.noSales")}</p>
            )}
          </CardContent>
        </Card>

        {/* Inventory health */}
        <Card className="rounded-3xl">
          <CardHeader className="pb-2">
            <CardTitle className="text-base">{t("nav.biz.inventory")}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">{t("biz.totalProducts")}</span>
              <span className="font-bold">{products.length}</span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">{t("biz.inventoryValue")}</span>
              <span className="font-bold">
                {money(products.reduce((s, p) => s + p.stock * p.cost, 0))}
              </span>
            </div>
            {low.length > 0 && (
              <Link
                to="/business/inventory"
                className="flex items-start gap-2 rounded-xl border border-amber-500/40 bg-amber-500/10 p-2.5 text-xs font-medium text-amber-700 dark:text-amber-400"
              >
                <AlertTriangle className="mt-0.5 size-4 shrink-0" />
                {t("biz.lowStock")}: {low.length} — {low.slice(0, 3).map((p) => p.name).join(", ")}
              </Link>
            )}
            <Link
              to="/business/pos"
              className="flex items-center justify-center gap-2 rounded-xl bg-primary px-3 py-2.5 text-sm font-bold text-primary-foreground"
            >
              <ShoppingCart className="size-4" />
              {t("nav.biz.pos")}
            </Link>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function MiniKpi({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl bg-muted/60 p-3.5 transition-colors hover:bg-muted">
      <p className="truncate text-xs text-muted-foreground">{label}</p>
      <p className="truncate text-base font-bold">{value}</p>
    </div>
  );
}
