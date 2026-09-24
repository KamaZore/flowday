import { FadeIn, StatCard } from "@/components/systems/Shared";
import { Button } from "@/components/ui/button";
import { useI18n } from "@/lib/i18n";
import { useAuth } from "@/hooks/use-auth";
import { moneyShort } from "@/lib/format";
import { useAppData, useSyncState } from "@/lib/store";
import {
  CloudUpload,
  ShieldCheck,
  UserCog,
  UserRound,
  Users,
} from "lucide-react";
import { Link } from "react-router";

export default function AdminUsers() {
  const { t } = useI18n();
  const { user, isAuthenticated } = useAuth();
  const data = useAppData();
  const sync = useSyncState();

  const staff = data.business.staff;
  const payroll = staff.filter((s) => s.active).reduce((s, m) => s + m.salary, 0);

  const syncLabel = !isAuthenticated
    ? t("settings.syncState.local")
    : sync.syncing
      ? t("settings.syncState.syncing")
      : sync.error
        ? t("settings.syncState.error")
        : t("settings.syncState.saved");

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">{t("admin.users")}</h1>
        <p className="text-sm text-muted-foreground">{t("admin.usersSub")}</p>
      </div>

      {/* Owner card */}
      <FadeIn>
        <div className="card-soft flex items-center gap-3 rounded-2xl border border-border/60 bg-card p-4">
          <span className="flex size-12 shrink-0 items-center justify-center rounded-2xl bg-primary/10 text-primary">
            <UserRound className="size-6" />
          </span>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-bold">{user?.name ?? t("settings.guest")}</p>
            <p className="truncate text-xs text-muted-foreground">{user?.email ?? "—"}</p>
          </div>
          <span className="flex shrink-0 items-center gap-1 rounded-full bg-emerald-500/12 px-2.5 py-1 text-[11px] font-semibold text-emerald-600 dark:text-emerald-400">
            <ShieldCheck className="size-3.5" />
            {t("admin.owner")}
          </span>
        </div>
      </FadeIn>

      {/* Sync */}
      <FadeIn delay={0.05}>
        <div className="card-soft flex items-center gap-3 rounded-2xl border border-border/60 bg-card p-4">
          <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-sky-500/12 text-sky-600 dark:text-sky-400">
            <CloudUpload className="size-5" />
          </span>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-semibold">{t("settings.cloudSync")}</p>
            <p className="truncate text-xs text-muted-foreground">{syncLabel}</p>
          </div>
          <Button asChild variant="outline" size="sm" className="rounded-lg">
            <Link to="/admin/data">{t("admin.data")}</Link>
          </Button>
        </div>
      </FadeIn>

      {/* Staff summary */}
      <section className="space-y-2">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold text-muted-foreground">{t("biz.staff")}</h2>
          <Button asChild variant="ghost" size="sm" className="rounded-lg text-xs">
            <Link to="/business/staff">{t("common.edit")}</Link>
          </Button>
        </div>
        <div className="grid grid-cols-2 gap-2">
          <StatCard label={t("biz.activeStaff")} value={String(staff.filter((s) => s.active).length)} icon={UserCog} tone="text-violet-600 dark:text-violet-400" tint="bg-violet-500/12" />
          <StatCard label={t("biz.monthlyPayroll")} value={moneyShort(payroll)} icon={Users} tone="text-violet-600 dark:text-violet-400" tint="bg-violet-500/12" />
        </div>
        <div className="space-y-1.5">
          {staff.map((s, i) => (
            <FadeIn key={s.id} delay={Math.min(i * 0.03, 0.15)}>
              <div className="flex items-center gap-3 rounded-2xl border border-border/60 bg-card p-3">
                <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-violet-500/12 text-xs font-bold text-violet-600 dark:text-violet-400">
                  {s.name.slice(0, 2).toUpperCase()}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">{s.name}</p>
                  <p className="truncate text-xs text-muted-foreground">{s.role ?? "—"}</p>
                </div>
                <span
                  className={
                    "shrink-0 rounded-full px-2 py-0.5 text-[10px] font-semibold " +
                    (s.active
                      ? "bg-emerald-500/12 text-emerald-600 dark:text-emerald-400"
                      : "bg-muted text-muted-foreground")
                  }
                >
                  {s.active ? t("biz.activeStaff") : t("biz.inactiveStaff")}
                </span>
              </div>
            </FadeIn>
          ))}
          {staff.length === 0 && (
            <div className="rounded-2xl border border-dashed border-border/70 p-8 text-center">
              <p className="text-sm text-muted-foreground">{t("biz.staffSub")}</p>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
