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
import {
  addSupplier,
  deleteSupplier,
  useBusiness,
  useSuppliers,
} from "@/lib/store";
import { Plus, Trash2, Truck } from "lucide-react";
import { useState } from "react";

export default function BusinessSuppliers() {
  const { t } = useI18n();
  const suppliers = useSuppliers();
  const business = useBusiness();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ name: "", phone: "", note: "" });

  const spendBySupplier = new Map<string, number>();
  for (const p of business.purchases) {
    if (!p.supplierId) continue;
    spendBySupplier.set(p.supplierId, (spendBySupplier.get(p.supplierId) ?? 0) + p.total);
  }

  function handleSave() {
    if (!form.name.trim()) return;
    addSupplier({
      name: form.name.trim(),
      phone: form.phone.trim() || undefined,
      note: form.note.trim() || undefined,
    });
    setForm({ name: "", phone: "", note: "" });
    setOpen(false);
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">{t("nav.biz.suppliers")}</h1>
          <p className="text-sm text-muted-foreground">{t("exp.count", { n: suppliers.length })}</p>
        </div>
        <Button onClick={() => setOpen(true)} className="gap-2 rounded-xl">
          <Plus className="size-4" />
          {t("biz.addSupplier")}
        </Button>
      </div>

      <div className="grid gap-2.5 sm:grid-cols-2 xl:grid-cols-3">
        {suppliers.map((s) => (
          <div
            key={s.id}
            className="card-soft flex items-center gap-3 rounded-2xl border border-border/60 bg-card p-4"
          >
            <span className="flex size-10 shrink-0 items-center justify-center rounded-2xl bg-muted">
              <Truck className="size-5 text-muted-foreground" />
            </span>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-semibold">{s.name}</p>
              <p className="truncate text-xs text-muted-foreground">
                {s.phone || "—"}
                {spendBySupplier.get(s.id)
                  ? ` · ${money(spendBySupplier.get(s.id)!)}`
                  : ""}
              </p>
            </div>
            <Button
              variant="ghost"
              size="icon"
              className="size-7 shrink-0 rounded-lg text-destructive"
              onClick={() => deleteSupplier(s.id)}
            >
              <Trash2 className="size-3.5" />
            </Button>
          </div>
        ))}
        {suppliers.length === 0 && (
          <div className="col-span-full rounded-2xl border border-dashed border-border/70 p-10 text-center">
            <Truck className="mx-auto mb-2 size-8 text-muted-foreground/50" />
            <p className="text-sm font-medium">{t("biz.addSupplier")}</p>
          </div>
        )}
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="rounded-3xl sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>{t("biz.addSupplier")}</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div className="space-y-1.5">
              <Label htmlFor="s-name">{t("biz.name")}</Label>
              <Input
                id="s-name"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                className="h-10 rounded-xl"
                autoFocus
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="s-phone">{t("biz.phone")}</Label>
              <Input
                id="s-phone"
                value={form.phone}
                onChange={(e) => setForm({ ...form, phone: e.target.value })}
                className="h-10 rounded-xl"
                inputMode="tel"
              />
            </div>
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
