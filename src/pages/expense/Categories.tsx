import { DateFilterBar } from "@/components/systems/DateFilterBar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useI18n } from "@/lib/i18n";
import { money } from "@/lib/format";
import {
  byCategory,
  filterTransactions,
  sumTransactions,
  useTransactions,
  type DateFilter,
} from "@/lib/store";
import { EXPENSE_CATEGORIES, INCOME_CATEGORIES } from "@/lib/types";
import { useMemo, useState } from "react";
import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";

const EXP_COLORS = [
  "#f43f5e", "#f59e0b", "#8b5cf6", "#06b6d4", "#10b981", "#ec4899", "#64748b", "#84cc16", "#94a3b8",
];
const INC_COLORS = ["#10b981", "#22d3ee", "#a3e635", "#facc15", "#94a3b8"];

/** All expense categories present in the doc, even custom ones. */
function categoriesOf(
  txs: { category: string; type: "income" | "expense" }[],
  type: "income" | "expense",
): string[] {
  const set = new Set(txs.filter((t) => t.type === type).map((t) => t.category));
  const defaults = type === "expense" ? EXPENSE_CATEGORIES : INCOME_CATEGORIES;
  return [...new Set([...defaults, ...set])];
}

export default function ExpenseCategories() {
  const { t } = useI18n();
  const transactions = useTransactions();
  const [filter, setFilter] = useState<DateFilter>({ kind: "month" });
  const [tab, setTab] = useState<"expense" | "income">("expense");

  const filtered = useMemo(
    () => filterTransactions(transactions, filter, { type: tab }),
    [transactions, filter, tab],
  );
  const totals = sumTransactions(filtered);
  const cats = byCategory(filtered, tab);
  const allCats = categoriesOf(transactions, tab);

  const chartData = cats.map((c, i) => ({
    name: t(`exp.cat.${c.category}`),
    value: c.total,
    color: (tab === "expense" ? EXP_COLORS : INC_COLORS)[i % 8] ?? "#94a3b8",
  }));

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">{t("nav.exp.categories")}</h1>
        <p className="text-sm text-muted-foreground">{t("exp.chart.categories")}</p>
      </div>

      <DateFilterBar value={filter} onChange={setFilter} />

      <div className="grid grid-cols-2 gap-1.5 rounded-2xl bg-muted p-1 sm:max-w-xs">
        {(["expense", "income"] as const).map((tx) => (
          <button
            key={tx}
            onClick={() => setTab(tx)}
            className={
              "rounded-xl py-2 text-sm font-semibold transition-colors " +
              (tab === tx ? "bg-background shadow-sm" : "text-muted-foreground hover:text-foreground")
            }
          >
            {t(tx === "expense" ? "exp.type.expense" : "exp.type.income")}
          </button>
        ))}
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card className="rounded-3xl">
          <CardContent className="pt-6">
            {chartData.length === 0 ? (
              <p className="py-16 text-center text-sm text-muted-foreground">{t("exp.empty")}</p>
            ) : (
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={chartData}
                      dataKey="value"
                      nameKey="name"
                      innerRadius={60}
                      outerRadius={95}
                      paddingAngle={2}
                    >
                      {chartData.map((d) => (
                        <Cell key={d.name} fill={d.color} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(v) => money(Number(v))} contentStyle={{ borderRadius: 12, fontSize: 12 }} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="rounded-3xl">
          <CardHeader className="pb-2">
            <CardTitle className="text-base">{t("exp.report.period")}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-1.5">
            {cats.map((c) => {
              const pct = totals.expense + totals.income
                ? Math.round((c.total / (tab === "expense" ? totals.expense : totals.income)) * 100)
                : 0;
              return (
                <div key={c.category} className="flex items-center gap-3 rounded-xl px-1 py-1.5">
                  <span className="size-2.5 rounded-full bg-primary/70" />
                  <span className="flex-1 text-sm font-medium">{t(`exp.cat.${c.category}`)}</span>
                  <span className="text-xs text-muted-foreground">{pct}%</span>
                  <span className="w-20 text-right text-sm font-semibold">{money(c.total)}</span>
                </div>
              );
            })}
            {cats.length === 0 && (
              <p className="py-8 text-center text-sm text-muted-foreground">{t("exp.empty")}</p>
            )}
            {cats.length > 0 && (
              <div className="mt-2 flex items-center justify-between border-t border-border/60 pt-3 text-sm">
                <span className="font-semibold">{t(tab === "expense" ? "exp.type.expense" : "exp.type.income")}</span>
                <span className="font-bold">
                  {money(tab === "expense" ? totals.expense : totals.income)}
                </span>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
      {allCats.length === 0 && null}
    </div>
  );
}
