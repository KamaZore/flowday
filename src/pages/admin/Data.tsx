import { FadeIn } from "@/components/systems/Shared";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { moneyShort } from "@/lib/format";
import { useI18n } from "@/lib/i18n";
import {
  collectionCounts,
  formatBytes,
  storageFootprint,
} from "@/lib/admin";
import {
  clearAllData,
  exportData,
  importData,
  resetDemoData,
  useAppData,
} from "@/lib/store";
import {
  CalendarClock,
  CheckCircle2,
  ClipboardList,
  Coins,
  Database,
  Download,
  FileText,
  HandCoins,
  Package,
  Receipt,
  Repeat2,
  ShoppingCart,
  Target,
  Trash2,
  Upload,
  Users,
  Wallet,
  type LucideIcon,
} from "lucide-react";
import { useMemo, useState } from "react";
import { toast } from "sonner";

const COL_ICONS: Record<string, LucideIcon> = {
  "admin.col.tasks": ClipboardList,
  "admin.col.projects": Target,
  "admin.col.habits": CheckCircle2,
  "admin.col.goals": Target,
  "admin.col.notes": FileText,
  "admin.col.events": CalendarClock,
  "admin.col.transactions": Coins,
  "admin.col.accounts": Wallet,
  "admin.col.recurring": Repeat2,
  "admin.col.debts": HandCoins,
  "admin.col.products": Package,
  "admin.col.customers": Users,
  "admin.col.orders": ShoppingCart,
  "admin.col.purchases": Receipt,
  "admin.col.staff": Users,
  "admin.col.quotes": FileText,
};

export default function AdminData() {
  const { t } = useI18n();
  const data = useAppData();
  const bytes = useMemo(() => storageFootprint(), [data]);
  const cols = useMemo(() => collectionCounts(), [data]);
  const [importOpen, setImportOpen] = useState(false);
  const [importText, setImportText] = useState("");

  function doExport() {
    const blob = new Blob([exportData()], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `flowday-backup-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success(t("admin.exported"));
  }

  function doImport() {
    if (importData(importText)) {
      toast.success(t("admin.imported"));
      setImportOpen(false);
      setImportText("");
    } else {
      toast.error(t("admin.importFailed"));
    }
  }

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">{t("admin.data")}</h1>
        <p className="text-sm text-muted-foreground">{t("admin.dataSub")}</p>
      </div>

      {/* Footprint */}
      <div className="grid grid-cols-2 gap-2">
        <FadeIn>
          <div className="card-soft flex items-center gap-3 rounded-2xl border border-border/60 bg-card p-4">
            <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-sky-500/12 text-sky-600 dark:text-sky-400">
              <Database className="size-5" />
            </span>
            <div className="min-w-0">
              <p className="truncate text-xs font-medium text-muted-foreground">{t("admin.storage")}</p>
              <p className="truncate text-lg font-bold">{formatBytes(bytes)}</p>
            </div>
          </div>
        </FadeIn>
        <FadeIn delay={0.05}>
          <div className="card-soft flex items-center gap-3 rounded-2xl border border-border/60 bg-card p-4">
            <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-violet-500/12 text-violet-600 dark:text-violet-400">
              {data.business.shopName ? <ShoppingCart className="size-5" /> : <Database className="size-5" />}
            </span>
            <div className="min-w-0">
              <p className="truncate text-xs font-medium text-muted-foreground">{t("biz.shopName")}</p>
              <p className="truncate text-lg font-bold">{data.business.shopName || "—"}</p>
            </div>
          </div>
        </FadeIn>
      </div>

      {/* Collections */}
      <section className="space-y-2">
        <h2 className="text-sm font-semibold text-muted-foreground">{t("admin.collections")}</h2>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-4">
          {cols.map((c, i) => {
            const Icon = COL_ICONS[c.labelKey] ?? Database;
            return (
              <FadeIn key={c.labelKey} delay={Math.min(i * 0.02, 0.2)}>
                <div className="flex items-center gap-2.5 rounded-2xl border border-border/60 bg-card p-3">
                  <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-muted text-muted-foreground">
                    <Icon className="size-4" />
                  </span>
                  <div className="min-w-0">
                    <p className="truncate text-[11px] text-muted-foreground">{t(c.labelKey)}</p>
                    <p className="text-sm font-bold tabular-nums">{c.count}</p>
                  </div>
                </div>
              </FadeIn>
            );
          })}
        </div>
      </section>

      {/* Backup / restore */}
      <section className="card-soft space-y-3 rounded-2xl border border-border/60 bg-card p-4">
        <h2 className="text-sm font-semibold">{t("admin.backup")}</h2>
        <p className="text-xs text-muted-foreground">{t("admin.backupSub")}</p>
        <div className="flex flex-wrap gap-2">
          <Button onClick={doExport} className="gap-2 rounded-xl">
            <Download className="size-4" />
            {t("admin.export")}
          </Button>
          <Button variant="outline" onClick={() => setImportOpen(true)} className="gap-2 rounded-xl">
            <Upload className="size-4" />
            {t("admin.import")}
          </Button>
          <Button
            variant="outline"
            className="gap-2 rounded-xl"
            onClick={() => {
              resetDemoData();
              toast.success(t("admin.resetDemo"));
            }}
          >
            <Repeat2 className="size-4" />
            {t("admin.resetDemo")}
          </Button>
          <Button
            variant="destructive"
            className="gap-2 rounded-xl"
            onClick={() => {
              if (confirm(t("admin.clearConfirm"))) {
                clearAllData();
                toast.success(t("admin.cleared"));
              }
            }}
          >
            <Trash2 className="size-4" />
            {t("admin.clearAll")}
          </Button>
        </div>
      </section>

      {/* Import dialog */}
      <Dialog open={importOpen} onOpenChange={setImportOpen}>
        <DialogContent className="rounded-3xl sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{t("admin.import")}</DialogTitle>
          </DialogHeader>
          <Textarea
            rows={8}
            value={importText}
            onChange={(e) => setImportText(e.target.value)}
            placeholder={t("admin.importPlaceholder")}
            className="rounded-xl font-mono text-xs"
          />
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setImportOpen(false)} className="rounded-xl">
              {t("common.cancel")}
            </Button>
            <Button onClick={doImport} disabled={!importText.trim()} className="rounded-xl">
              {t("admin.import")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
