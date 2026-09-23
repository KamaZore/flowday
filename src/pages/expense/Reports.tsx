import { DateFilterBar } from "@/components/systems/DateFilterBar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useI18n } from "@/lib/i18n";
import { money, moneyShort } from "@/lib/format";
import {
  dailyTotals,
  filterTransactions,
  resolveDateRange,
  sumTransactions,
  useTransactions,
  type DateFilter,
} from "@/lib/store";
import { PAYMENT_METHODS } from "@/lib/types";
import { useMemo, useState } from "react";
import {
  Area,
  AreaChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

export default function ExpenseReports() {
  const { t } = useI18n();
  const transactions = useTransactions();
  const [filter, setFilter] = useState<DateFilter>({ kind: "month" });

  const filtered = useMemo(
    () => filterTransactions(transactions, filter),
    [transactions, filter],
  );
  const totals = sumTransactions(filtered);
  const range = resolveDateRange(filter);

  const areaData = useMemo(
    () =>
      dailyTotals(transactions, range.from, range.to).map((d) => ({
        date: d.date.slice(5),
        income: d.income,
        expense: d.expense,
        balance:
          d.income - d.expense,
      })),
    [transactions, range],
  );

  // Payment method breakdown
  const byMethod = useMemo(() => {
    const map = new Map<string, number>();
    for (const tx of filtered) {
      map.set(tx.method, (map.get(tx.method) ?? 0) + tx.amount);
    }
    return PAYMENT_METHODS.map((m) => ({ method: m, total: map.get(m) ?? 0 })).filter(
      (x) => x.total > 0,
    );
  }, [filtered]);

  const avgExpense = filtered.length
    ? filtered.filter((x) => x.type === "expense").reduce((s, x) => s + x.amount, 0) /
      Math.max(1, filtered.filter((x) => x.type === "expense").length)
    : 0;
  const days = Math.max(
    1,
    Math.round(
      (new Date(range.to).getTime() - new Date(range.from).getTime()) / 864e5,
    ) + 1,
  );

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">{t("nav.exp.reports")}</h1>
        <p className="text-sm text-muted-foreground">{range.from} → {range.to}</p>
      </div>

      <DateFilterBar value={filter} onChange={setFilter} />

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <MiniStat label={t("exp.totalIncome")} value={money(totals.income)} tone="text-emerald-600 dark:text-emerald-400" />
        <MiniStat label={t("exp.totalExpense")} value={money(totals.expense)} tone="text-rose-600 dark:text-rose-400" />
        <MiniStat label={t("exp.balance")} value={money(totals.balance)} />
        <MiniStat label={t("exp.count", { n: totals.count })} value={money(avgExpense)} />
      </div>

      <Card className="rounded-3xl">
        <CardHeader className="pb-0">
          <CardTitle className="text-base">{t("exp.chart.daily")}</CardTitle>
        </CardHeader>
        <CardContent className="pt-4">
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={areaData} margin={{ top: 4, right: 4, bottom: 0, left: -14 }}>
                <defs>
                  <linearGradient id="inc" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#10b981" stopOpacity={0.35} />
                    <stop offset="100%" stopColor="#10b981" stopOpacity={0.02} />
                  </linearGradient>
                  <linearGradient id="exp" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#f43f5e" stopOpacity={0.35} />
                    <stop offset="100%" stopColor="#f43f5e" stopOpacity={0.02} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} className="stroke-border" />
                <XAxis dataKey="date" tick={{ fontSize: 10 }} tickLine={false} axisLine={false} interval="preserveStartEnd" />
                <YAxis tick={{ fontSize: 10 }} tickLine={false} axisLine={false} tickFormatter={(v: number) => moneyShort(v)} width={52} />
                <Tooltip formatter={(v) => money(Number(v))} contentStyle={{ borderRadius: 12, fontSize: 12 }} />
                <Legend wrapperStyle={{ fontSize: 12 }} />
                <Area type="monotone" dataKey="income" stroke="#10b981" fill="url(#inc)" strokeWidth={2} />
                <Area type="monotone" dataKey="expense" stroke="#f43f5e" fill="url(#exp)" strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      <Card className="rounded-3xl">
        <CardHeader className="pb-2">
          <CardTitle className="text-base">{t("biz.byMethod")}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2.5">
          {byMethod.length === 0 && (
            <p className="text-sm text-muted-foreground">{t("exp.empty")}</p>
          )}
          {byMethod.map((m) => {
            const totalVolume = byMethod.reduce((s, x) => s + x.total, 0);
            const pct = totalVolume ? Math.round((m.total / totalVolume) * 100) : 0;
            return (
              <div key={m.method}>
                <div className="mb-1 flex items-center justify-between text-xs">
                  <span className="font-medium">{t(`pay.${m.method}`)}</span>
                  <span className="text-muted-foreground">{money(m.total)} · {pct}%</span>
                </div>
                <div className="h-2 overflow-hidden rounded-full bg-muted">
                  <div className="h-full rounded-full bg-sky-500" style={{ width: `${pct}%` }} />
                </div>
              </div>
            );
          })}
        </CardContent>
      </Card>
    </div>
  );
}

function MiniStat({ label, value, tone }: { label: string; value: string; tone?: string }) {
  return (
    <div className="rounded-2xl bg-muted/60 p-3.5">
      <p className="truncate text-xs text-muted-foreground">{label}</p>
      <p className={`truncate text-base font-bold ${tone ?? ""}`}>{value}</p>
    </div>
  );
}
