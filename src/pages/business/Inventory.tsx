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
import { useI18n } from "@/lib/i18n";
import { money } from "@/lib/format";
import { adjustStock, addPurchase, lowStockProducts, updateProduct, useProducts } from "@/lib/store";
import { AlertTriangle, Boxes, Minus, PackagePlus, Plus, Wallet } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

export default function BusinessInventory() {
  const { t } = useI18n();
  const products = useProducts();
  const [restockFor, setRestockFor] = useState<string | null>(null);
  const [restockQty, setRestockQty] = useState("10");
  const [restockCost, setRestockCost] = useState("");
  const [adjustFor, setAdjustFor] = useState<string | null>(null);
  const [adjustQty, setAdjustQty] = useState("1");
  const [adjustDir, setAdjustDir] = useState<1 | -1>(1);

  const low = lowStockProducts(products);
  const totalValue = products.reduce((s, p) => s + p.stock * p.cost, 0);
  const totalUnits = products.reduce((s, p) => s + p.stock, 0);

  function handleRestock() {
    if (!restockFor) return;
    const product = products.find((p) => p.id === restockFor);
    const qty = Number(restockQty);
    if (!product || !qty) return;
    // Quick restock: creates a purchase record so finances stay consistent.
    addPurchase({
      items: [
        {
          productId: product.id,
          qty,
          cost: Number(restockCost) || product.cost,
        },
      ],
    });
    setRestockFor(null);
    setRestockQty("10");
    setRestockCost("");
    toast.success(t("biz.restocked", { name: product.name }));
  }

  function openAdjust(p: { id: string; stock: number }) {
    setAdjustFor(p.id);
    setAdjustQty("1");
    setAdjustDir(1);
  }

  function handleAdjust() {
    if (!adjustFor) return;
    const product = products.find((p) => p.id === adjustFor);
    const qty = Number(adjustQty);
    if (!product || !qty) return;
    adjustStock(product.id, adjustDir * qty);
    setAdjustFor(null);
    toast.success(
      t(adjustDir === 1 ? "biz.stockAdded" : "biz.stockRemoved", { name: product.name }),
    );
  }

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">{t("nav.biz.inventory")}</h1>
        <p className="text-sm text-muted-foreground">
          {totalUnits} {t("biz.units")} · {t("biz.inventoryValue")}: {money(totalValue)}
        </p>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        <StatCard
          label={t("biz.totalProducts")}
          value={String(products.length)}
          icon={Boxes}
          tone="text-violet-600 dark:text-violet-400"
          delay={0}
        />
        <StatCard
          label={t("biz.units")}
          value={String(totalUnits)}
          icon={PackagePlus}
          tone="text-sky-600 dark:text-sky-400"
          delay={0.05}
        />
        <StatCard
          label={t("biz.inventoryValue")}
          value={money(totalValue)}
          icon={Wallet}
          tone="text-emerald-600 dark:text-emerald-400"
          delay={0.1}
        />
      </div>

      {low.length > 0 && (
        <FadeIn delay={0.15}>
          <div className="flex items-start gap-3 rounded-2xl border border-amber-500/40 bg-amber-500/10 p-4">
            <AlertTriangle className="mt-0.5 size-5 shrink-0 text-amber-600 dark:text-amber-400" />
            <div>
              <p className="text-sm font-semibold text-amber-700 dark:text-amber-400">
                {t("biz.lowStock")}: {low.length}
              </p>
              <p className="mt-0.5 text-xs text-amber-700/80 dark:text-amber-400/80">
                {low.map((p) => p.name).join(", ")}
              </p>
            </div>
          </div>
        </FadeIn>
      )}

      <div className="card-soft overflow-hidden rounded-2xl border border-border/60 bg-card">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border/60 text-left text-xs text-muted-foreground">
              <th className="px-4 py-3 font-medium">{t("biz.name")}</th>
              <th className="px-4 py-3 text-right font-medium">{t("biz.stock")}</th>
              <th className="hidden px-4 py-3 text-right font-medium sm:table-cell">{t("biz.cost")}</th>
              <th className="px-4 py-3 text-right font-medium">{t("biz.price")}</th>
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody>
            {products.map((p) => (
              <tr key={p.id} className="border-b border-border/40 last:border-0">
                <td className="px-4 py-2.5">
                  <p className="font-medium">{p.name}</p>
                  {p.sku && <p className="text-xs text-muted-foreground">{p.sku}</p>}
                </td>
                <td className="px-4 py-2.5 text-right">
                  <span
                    className={
                      "rounded-full px-2 py-0.5 text-xs font-semibold " +
                      (p.stock <= p.lowStockThreshold
                        ? "bg-amber-500/15 text-amber-600 dark:text-amber-400"
                        : "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400")
                    }
                  >
                    {p.stock}
                  </span>
                </td>
                <td className="hidden px-4 py-2.5 text-right text-muted-foreground sm:table-cell">
                  {money(p.cost)}
                </td>
                <td className="px-4 py-2.5 text-right font-semibold">{money(p.price)}</td>
                <td className="px-4 py-2.5 text-right">
                  <div className="flex justify-end gap-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="size-7 rounded-lg text-destructive"
                      onClick={() => {
                        setAdjustFor(p.id);
                        setAdjustDir(-1);
                        setAdjustQty("1");
                      }}
                      aria-label={t("biz.stockOut")}
                    >
                      <Minus className="size-3.5" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="size-7 rounded-lg text-emerald-600 dark:text-emerald-400"
                      onClick={() => {
                        setAdjustFor(p.id);
                        setAdjustDir(1);
                        setAdjustQty("1");
                      }}
                      aria-label={t("biz.stockIn")}
                    >
                      <Plus className="size-3.5" />
                      </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-7 rounded-lg px-2 text-xs"
                      onClick={() => {
                        setRestockFor(p.id);
                        setRestockCost(String(p.cost));
                      }}
                    >
                      <PackagePlus className="size-3" />
                      {t("biz.restock")}
                    </Button>
                  </div>
                </td>
              </tr>
            ))}
            {products.length === 0 && (
              <tr>
                <td colSpan={5} className="px-4 py-10 text-center text-muted-foreground">
                  <Boxes className="mx-auto mb-2 size-8 opacity-40" />
                  {t("biz.productsEmpty")}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Restock dialog (creates a purchase record) */}
      <Dialog open={Boolean(restockFor)} onOpenChange={(v) => !v && setRestockFor(null)}>
        <DialogContent className="rounded-3xl sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>{t("biz.restock")}</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div className="space-y-1.5">
              <Label htmlFor="r-qty">{t("biz.stock")}</Label>
              <Input
                id="r-qty"
                type="number"
                min="1"
                value={restockQty}
                onChange={(e) => setRestockQty(e.target.value)}
                className="h-10 rounded-xl"
                autoFocus
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="r-cost">{t("biz.cost")}</Label>
              <Input
                id="r-cost"
                type="number"
                min="0"
                step="0.01"
                value={restockCost}
                onChange={(e) => setRestockCost(e.target.value)}
                className="h-10 rounded-xl"
              />
            </div>
            <p className="text-xs text-muted-foreground">{t("biz.restockNote")}</p>
          </div>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setRestockFor(null)} className="rounded-xl">
              {t("common.cancel")}
            </Button>
            <Button onClick={handleRestock} className="rounded-xl">
              {t("common.save")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Quick adjust dialog (no purchase record — corrections only) */}
      <Dialog open={Boolean(adjustFor)} onOpenChange={(v) => !v && setAdjustFor(null)}>
        <DialogContent className="rounded-3xl sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>
              {adjustDir === 1 ? t("biz.stockIn") : t("biz.stockOut")}
              {adjustFor
                ? ` — ${products.find((p) => p.id === adjustFor)?.name ?? ""}`
                : ""}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div className="space-y-1.5">
              <Label htmlFor="a-qty">{t("biz.stock")}</Label>
              <Input
                id="a-qty"
                type="number"
                min="1"
                value={adjustQty}
                onChange={(e) => setAdjustQty(e.target.value)}
                className="h-10 rounded-xl"
                autoFocus
                onKeyDown={(e) => e.key === "Enter" && handleAdjust()}
              />
            </div>
            <p className="text-xs text-muted-foreground">{t("biz.adjustNote")}</p>
          </div>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setAdjustFor(null)} className="rounded-xl">
              {t("common.cancel")}
            </Button>
            <Button onClick={handleAdjust} className="rounded-xl">
              {t("common.save")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
