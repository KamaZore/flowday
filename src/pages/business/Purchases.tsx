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
import { useI18n } from "@/lib/i18n";
import { money } from "@/lib/format";
import { addPurchase, deletePurchase, useProducts, useSuppliers, useBusiness } from "@/lib/store";
import { Plus, Trash2, Truck, X } from "lucide-react";
import { useState } from "react";

type DraftItem = { productId: string; qty: string; cost: string };

export default function BusinessPurchases() {
  const { t } = useI18n();
  const products = useProducts();
  const suppliers = useSuppliers();
  const business = useBusiness();
  const [open, setOpen] = useState(false);
  const [supplierId, setSupplierId] = useState("none");
  const [items, setItems] = useState<DraftItem[]>([]);
  const [note, setNote] = useState("");

  const total = items.reduce((s, it) => s + (Number(it.qty) || 0) * (Number(it.cost) || 0), 0);

  function addItem() {
    const first = products[0];
    if (!first) return;
    setItems([...items, { productId: first.id, qty: "1", cost: String(first.cost) }]);
  }

  function handleSave() {
    const valid = items
      .map((it) => ({
        productId: it.productId,
        qty: Number(it.qty) || 0,
        cost: Number(it.cost) || 0,
      }))
      .filter((it) => it.qty > 0 && it.productId);
    if (valid.length === 0) return;
    addPurchase({
      supplierId: supplierId === "none" ? undefined : supplierId,
      items: valid,
      note: note.trim() || undefined,
    });
    setItems([]);
    setNote("");
    setSupplierId("none");
    setOpen(false);
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">{t("nav.biz.purchases")}</h1>
          <p className="text-sm text-muted-foreground">
            {t("exp.count", { n: business.purchases.length })}
          </p>
        </div>
        <Button onClick={() => { setItems([]); setOpen(true); }} className="gap-2 rounded-xl">
          <Plus className="size-4" />
          {t("biz.addPurchase")}
        </Button>
      </div>

      <div className="space-y-2">
        {business.purchases.map((p) => {
          const supplier = suppliers.find((s) => s.id === p.supplierId);
          return (
            <div
              key={p.id}
              className="card-soft flex items-center gap-3 rounded-2xl border border-border/60 bg-card p-3.5"
            >
              <span className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-muted">
                <Truck className="size-4 text-muted-foreground" />
              </span>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium">
                  {supplier?.name ?? t("biz.supplier")}
                </p>
                <p className="truncate text-xs text-muted-foreground">
                  {new Date(p.createdAt).toLocaleString()} ·{" "}
                  {p.items
                    .map((it) => {
                      const prod = products.find((x) => x.id === it.productId);
                      return `${prod?.name ?? "?"} ×${it.qty}`;
                    })
                    .join(", ")}
                </p>
              </div>
              <span className="shrink-0 text-sm font-bold">{money(p.total)}</span>
              <Button
                variant="ghost"
                size="icon"
                className="size-8 shrink-0 rounded-lg text-destructive"
                onClick={() => deletePurchase(p.id)}
              >
                <Trash2 className="size-3.5" />
              </Button>
            </div>
          );
        })}
        {business.purchases.length === 0 && (
          <div className="rounded-2xl border border-dashed border-border/70 p-10 text-center">
            <Truck className="mx-auto mb-2 size-8 text-muted-foreground/50" />
            <p className="text-sm font-medium">{t("biz.purchasesEmpty")}</p>
          </div>
        )}
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-h-[85dvh] overflow-y-auto rounded-3xl sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>{t("biz.addPurchase")}</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div className="space-y-1.5">
              <Label>{t("biz.supplier")}</Label>
              <Select value={supplierId} onValueChange={setSupplierId}>
                <SelectTrigger className="h-10 rounded-xl">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">—</SelectItem>
                  {suppliers.map((s) => (
                    <SelectItem key={s.id} value={s.id}>
                      {s.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label>{t("biz.purchaseItems")}</Label>
              {products.length === 0 && (
                <p className="rounded-xl bg-amber-500/10 px-3 py-2 text-xs text-amber-700 dark:text-amber-400">
                  {t("biz.productsEmptySub")}
                </p>
              )}
              <div className="space-y-2">
                {items.map((it, idx) => (
                  <div key={idx} className="flex items-center gap-2">
                    <Select
                      value={it.productId}
                      onValueChange={(v) =>
                        setItems(items.map((x, i) => (i === idx ? { ...x, productId: v } : x)))
                      }
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
                      value={it.qty}
                      onChange={(e) =>
                        setItems(items.map((x, i) => (i === idx ? { ...x, qty: e.target.value } : x)))
                      }
                      className="h-9 w-16 rounded-xl text-xs"
                      placeholder="qty"
                    />
                    <Input
                      type="number"
                      min="0"
                      step="0.01"
                      value={it.cost}
                      onChange={(e) =>
                        setItems(items.map((x, i) => (i === idx ? { ...x, cost: e.target.value } : x)))
                      }
                      className="h-9 w-24 rounded-xl text-xs"
                      placeholder="cost"
                    />
                    <Button
                      variant="ghost"
                      size="icon"
                      className="size-8 shrink-0 rounded-lg text-destructive"
                      onClick={() => setItems(items.filter((_, i) => i !== idx))}
                    >
                      <X className="size-3.5" />
                    </Button>
                  </div>
                ))}
                {products.length > 0 && (
                  <Button variant="outline" size="sm" onClick={addItem} className="rounded-xl text-xs">
                    <Plus className="size-3.5" />
                    {t("common.add")}
                  </Button>
                )}
              </div>
            </div>

            <div className="flex items-center justify-between rounded-xl bg-muted/60 px-3 py-2 text-sm">
              <span className="font-medium">{t("biz.total")}</span>
              <span className="font-bold">{money(total)}</span>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="pu-note">{t("exp.note")}</Label>
              <Input
                id="pu-note"
                value={note}
                onChange={(e) => setNote(e.target.value)}
                className="h-10 rounded-xl"
              />
            </div>
          </div>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setOpen(false)} className="rounded-xl">
              {t("common.cancel")}
            </Button>
            <Button onClick={handleSave} disabled={items.length === 0} className="rounded-xl">
              {t("common.save")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
