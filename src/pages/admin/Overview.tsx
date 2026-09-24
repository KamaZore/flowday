import { DateFilterBar } from "@/components/systems/DateFilterBar";
import { FadeIn, StatCard } from "@/components/systems/Shared";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { money } from "@/lib/format";
import { useI18n } from "@/lib/i18n";
import { adminSnapshot } from "@/lib/admin";
import {
  useAppData,
  type DateFilter,
} from "@/lib/store";
import {
  Banknote,
  CheckCircle2,
  Coins,
  Flame,
  HandCoins,
  LayoutDashboard,
  Package,
  Receipt,
  ShoppingCart,
  TrendingUp,
  Users,
  Wallet,
} from "lucide-react";
import { useMemo, useState } from "react";
import { Link } from "react-router";

export default function AdminOverview() {
  const { t } = useI18n();
  const data = useAppData();
  const [filter, setFilter] = useState<DateFilter>({ kind: "month" });
  const snap = useMemo(() => adminSnapshot(filter), [data, filter]);

  const shop = data.business.shopName;

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">{t("admin.overview")}</h1>
        <p className="text-sm text-muted-foreground">{t("admin.overviewSub")}</p>
      </div>

      <DateFilterBar value={filter} onChange={setFilter} />

      {/* Business KPIs */}
      <section className="space-y-2">
        <h2 className="flex items-center gap-2 text-sm font-semibold text-muted-foreground">
          <ShoppingCart className="size-4 text-violet-500" />
          {t("admin.bizSection")}
        </h2>
        <div className="grid grid-cols-2 gap-2 lg:grid-cols-4">
          <StatCard label={t("biz.revenue")} value={money(snap.bizMonthRevenue)} icon={Banknote} tone="text-violet-600 dark:text-violet-400" tint="bg-violet-500/12" />
          <StatCard label={t("biz.todayProfit")} value={money(snap.bizMonthProfit)} icon={TrendingUp} tone="text-emerald-600 dark:text-emerald-400" tint="bg-emerald-500/12" />
          <StatCard label={t("biz.receiptNum")} value={String(snap.bizMonthOrders)} icon={Receipt} tone="text-sky-600 dark:text-sky-400" tint="bg-sky-500/12" />
          <StatCard label={t("biz.lowStock")} value={String(snap.bizLowStock)} icon={Package} tone={snap.bizLowStock > 0 ? "text-amber-600 dark:text-amber-400" : "text-muted-foreground"} tint={snap.bizLowStock > 0 ? "bg-amber-500/12" : "bg-muted"} />
        </div>
      </section>

      {/* Expense KPIs */}
      <section className="space-y-2">
        <h2 className="flex items-center gap-2 text-sm font-semibold text-muted-foreground">
          <Wallet className="size-4 text-sky-500" />
          {t("admin.expenseSection")}
        </h2>
        <div className="grid grid-cols-2 gap-2 lg:grid-cols-4">
          <StatCard label={t("exp.totalIncome")} value={money(snap.expenseMonthIncome)} icon={Coins} tone="text-emerald-600 dark:text-emerald-400" tint="bg-emerald-500/12" />
          <StatCard label={t("exp.totalExpense")} value={money(snap.expenseMonthExpense)} icon={Banknote} tone="text-rose-600 dark:text-rose-400" tint="bg-rose-500/12" />
          <StatCard label={t("exp.count", { n: snap.expenseTxCount })} value={String(snap.expenseTxCount)} icon={Receipt} tone="text-sky-600 dark:text-sky-400" tint="bg-sky-500/12" />
          <StatCard label={t("exp.debts")} value={money(snap.debtOutstanding)} icon={HandCoins} tone={snap.debtOutstanding > 0 ? "text-amber-600 dark:text-amber-400" : "text-muted-foreground"} tint={snap.debtOutstanding > 0 ? "bg-amber-500/12" : "bg-muted"} />
        </div>
      </section>

      {/* Life KPIs */}
      <section className="space-y-2">
        <h2 className="flex items-center gap-2 text-sm font-semibold text-muted-foreground">
          <Flame className="size-4 text-emerald-500" />
          {t("admin.lifeSection")}
        </h2>
        <div className="grid grid-cols-2 gap-2 lg:grid-cols-4">
          <StatCard label={t("admin.tasksDone")} value={`${snap.tasksCompleted}/${snap.tasksTotal}`} icon={CheckCircle2} tone="text-emerald-600 dark:text-emerald-400" tint="bg-emerald-500/12" />
          <StatCard label={t("admin.habitsToday")} value={`${snap.habitsToday}/${snap.habitsTotal}`} icon={Flame} tone="text-sky-600 dark:text-sky-400" tint="bg-sky-500/12" />
          <StatCard label={t("biz.activeStaff")} value={String(snap.staffCount)} icon={Users} tone="text-violet-600 dark:text-violet-400" tint="bg-violet-500/12" />
          <StatCard label={t("biz.monthlyPayroll")} value={money(snap.monthlyPayroll)} icon={Users} tone="text-violet-600 dark:text-violet-400" tint="bg-violet-500/12" />
        </div>
      </section>

      {/* Quick jumps */}
      <FadeIn>
        <Card className="card-soft rounded-2xl border-border/60">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">{t("admin.quickJump")}</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-2 gap-2 sm:grid-cols-3">
            {[
              { to: "/business/inventory", label: t("nav.biz.inventory"), icon: Package },
              { to: "/business/staff", label: t("nav.biz.staff"), icon: Users },
              { to: "/expense/reports", label: t("nav.exp.reports"), icon: TrendingUp },
              { to: "/expense/debts", label: t("nav.exp.debts"), icon: HandCoins },
              { to: "/admin/data", label: t("admin.data"), icon: LayoutDashboard },
            ].map((a) => (
              <Link
                key={a.to}
                to={a.to}
                className="flex items-center gap-2 rounded-xl border border-border/60 px-3 py-2.5 text-xs font-medium text-muted-foreground transition-colors hover:border-primary/40 hover:bg-primary/5 hover:text-primary"
              >
                <a.icon className="size-4" />
                {a.label}
              </Link>
            ))}
          </CardContent>
        </Card>
      </FadeIn>
    </div>
  );
}
