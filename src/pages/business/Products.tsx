import { ImagePicker } from "@/components/systems/ImagePicker";
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
import { Switch } from "@/components/ui/switch";
import { useI18n } from "@/lib/i18n";
import { money } from "@/lib/format";
import { addProduct, deleteProduct, updateProduct, useProducts } from "@/lib/store";
import type { Product } from "@/lib/types";
import { Package, Pencil, Plus, Search, Trash2 } from "lucide-react";
import { useEffect, useState } from "react";

const emptyForm = {
  name: "",
  sku: "",
  barcode: "",
  category: "general",
  price: "",
  cost: "",
  stock: "",
  lowStockThreshold: "5",
  active: true,
  image: undefined as string | undefined,
};

export default function BusinessProducts() {
  const { t } = useI18n();
  const products = useProducts();
  const [search, setSearch] = useState("");
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Product | null>(null);
  const [form, setForm] = useState(emptyForm);

  const filtered = products.filter((p) => {
    const q = search.trim().toLowerCase();
    if (!q) return true;
    return (
      p.name.toLowerCase().includes(q) ||
      p.sku?.toLowerCase().includes(q) ||
      p.barcode?.toLowerCase().includes(q) ||
      p.category.toLowerCase().includes(q)
    );
  });

  function openNew() {
    setEditing(null);
    setForm(emptyForm);
    setOpen(true);
  }

  function openEdit(p: Product) {
    setEditing(p);
    setForm({
      name: p.name,
      sku: p.sku ?? "",
      barcode: p.barcode ?? "",
      category: p.category,
      price: String(p.price),
      cost: String(p.cost),
      stock: String(p.stock),
      lowStockThreshold: String(p.lowStockThreshold),
      active: p.active,
      image: p.image,
    });
    setOpen(true);
  }

  function handleSave() {
    const payload = {
      name: form.name.trim(),
      sku: form.sku.trim() || undefined,
      barcode: form.barcode.trim() || undefined,
      category: form.category.trim() || "general",
      price: Number(form.price) || 0,
      cost: Number(form.cost) || 0,
      stock: Number(form.stock) || 0,
      lowStockThreshold: Number(form.lowStockThreshold) || 0,
      active: form.active,
      image: form.image,
    };
    if (!payload.name) return;
    if (editing) updateProduct(editing.id, payload);
    else addProduct(payload);
    setOpen(false);
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">{t("nav.biz.products")}</h1>
          <p className="text-sm text-muted-foreground">
            {t("exp.count", { n: products.length })}
          </p>
        </div>
        <Button onClick={openNew} className="gap-2 rounded-xl">
          <Plus className="size-4" />
          {t("biz.addProduct")}
        </Button>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder={t("biz.searchOrScan")}
          className="h-10 rounded-xl pl-9"
        />
      </div>

      <div className="grid gap-2.5 sm:grid-cols-2 xl:grid-cols-3">
        {filtered.map((p) => (
          <div
            key={p.id}
            className="card-soft flex gap-3 rounded-2xl border border-border/60 bg-card p-4"
          >
            {p.image ? (
              <img
                src={p.image}
                alt=""
                loading="lazy"
                className="size-14 shrink-0 rounded-xl object-cover ring-1 ring-border/60"
              />
            ) : (
              <span className="flex size-14 shrink-0 items-center justify-center rounded-xl bg-muted text-muted-foreground/60">
                <Package className="size-6" />
              </span>
            )}
            <div className="flex min-w-0 flex-1 flex-col gap-2">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold">{p.name}</p>
                  <p className="truncate text-xs text-muted-foreground">
                    {t(`biz.cat.${p.category}`) !== `biz.cat.${p.category}`
                      ? t(`biz.cat.${p.category}`)
                      : p.category}
                    {p.sku ? ` · ${p.sku}` : ""}
                  </p>
                </div>
                <div className="flex shrink-0 gap-0.5">
                  <Button variant="ghost" size="icon" className="size-7 rounded-lg" onClick={() => openEdit(p)}>
                    <Pencil className="size-3.5" />
                  </Button>
                  <Button
                    variant="ghost" size="icon" className="size-7 rounded-lg text-destructive"
                    onClick={() => deleteProduct(p.id)}
                  >
                    <Trash2 className="size-3.5" />
                  </Button>
                </div>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="font-bold">{money(p.price)}</span>
                <span className="text-xs text-muted-foreground">
                  {t("biz.cost")}: {money(p.cost)}
                </span>
                <span
                  className={
                    "rounded-full px-2 py-0.5 text-[11px] font-semibold " +
                    (!p.active
                      ? "bg-muted text-muted-foreground"
                      : p.stock <= p.lowStockThreshold
                        ? "bg-amber-500/15 text-amber-600 dark:text-amber-400"
                        : "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400")
                  }
                >
                  {p.stock} {t("biz.units")}
                </span>
              </div>
            </div>
          </div>
        ))}
        {filtered.length === 0 && (
          <div className="col-span-full rounded-2xl border border-dashed border-border/70 p-10 text-center">
            <Package className="mx-auto mb-2 size-8 text-muted-foreground/50" />
            <p className="text-sm font-medium">{t("biz.productsEmpty")}</p>
            <p className="mt-1 text-xs text-muted-foreground">{t("biz.productsEmptySub")}</p>
          </div>
        )}
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="rounded-3xl sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{editing ? t("biz.editProduct") : t("biz.addProduct")}</DialogTitle>
          </DialogHeader>
          <div className="grid grid-cols-2 gap-3">
            <div className="col-span-2 flex items-center gap-3">
              <ImagePicker
                value={form.image}
                onChange={(v) => setForm({ ...form, image: v })}
              />
              <div className="min-w-0 flex-1 space-y-1.5">
                <Label htmlFor="p-name">{t("biz.name")}</Label>
                <Input
                  id="p-name"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  className="h-10 rounded-xl"
                  autoFocus
                />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="p-price">{t("biz.price")}</Label>
              <Input
                id="p-price"
                type="number"
                min="0"
                step="0.01"
                value={form.price}
                onChange={(e) => setForm({ ...form, price: e.target.value })}
                className="h-10 rounded-xl"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="p-cost">{t("biz.cost")}</Label>
              <Input
                id="p-cost"
                type="number"
                min="0"
                step="0.01"
                value={form.cost}
                onChange={(e) => setForm({ ...form, cost: e.target.value })}
                className="h-10 rounded-xl"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="p-stock">{t("biz.stock")}</Label>
              <Input
                id="p-stock"
                type="number"
                min="0"
                value={form.stock}
                onChange={(e) => setForm({ ...form, stock: e.target.value })}
                className="h-10 rounded-xl"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="p-low">{t("biz.lowStockAt")}</Label>
              <Input
                id="p-low"
                type="number"
                min="0"
                value={form.lowStockThreshold}
                onChange={(e) => setForm({ ...form, lowStockThreshold: e.target.value })}
                className="h-10 rounded-xl"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="p-cat">{t("exp.category")}</Label>
              <Input
                id="p-cat"
                value={form.category}
                onChange={(e) => setForm({ ...form, category: e.target.value })}
                className="h-10 rounded-xl"
                placeholder="general / drinks / snacks"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="p-sku">{t("biz.sku")}</Label>
              <Input
                id="p-sku"
                value={form.sku}
                onChange={(e) => setForm({ ...form, sku: e.target.value })}
                className="h-10 rounded-xl"
              />
            </div>
            <div className="col-span-2 space-y-1.5">
              <Label htmlFor="p-barcode">{t("biz.barcode")}</Label>
              <Input
                id="p-barcode"
                value={form.barcode}
                onChange={(e) => setForm({ ...form, barcode: e.target.value })}
                className="h-10 rounded-xl"
                inputMode="numeric"
              />
            </div>
            <label className="col-span-2 flex items-center justify-between rounded-xl bg-muted/50 px-3 py-2.5">
              <span className="text-sm font-medium">{t("biz.productActive")}</span>
              <Switch
                checked={form.active}
                onCheckedChange={(v) => setForm({ ...form, active: v })}
              />
            </label>
          </div>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setOpen(false)} className="rounded-xl">
              {t("common.cancel")}
            </Button>
            <Button onClick={handleSave} disabled={!form.name.trim()} className="rounded-xl">
              {t("common.save")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
