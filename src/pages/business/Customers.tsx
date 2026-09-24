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
import { Textarea } from "@/components/ui/textarea";
import { useI18n } from "@/lib/i18n";
import { money } from "@/lib/format";
import {
  addCustomer,
  deleteCustomer,
  updateCustomer,
  useCustomers,
  useBusiness,
} from "@/lib/store";
import type { Customer } from "@/lib/types";
import { Contact, Pencil, Plus, Trash2, Users } from "lucide-react";
import { useState } from "react";

const empty = { name: "", phone: "", email: "", note: "", image: undefined as string | undefined };

export default function BusinessCustomers() {
  const { t } = useI18n();
  const customers = useCustomers();
  const business = useBusiness();
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Customer | null>(null);
  const [form, setForm] = useState(empty);

  /** Total completed spend per customer (refunds excluded). */
  const spendByCustomer = new Map<string, number>();
  for (const o of business.orders) {
    if (o.status !== "completed" || !o.customerId) continue;
    spendByCustomer.set(o.customerId, (spendByCustomer.get(o.customerId) ?? 0) + o.total);
  }

  function openNew() {
    setEditing(null);
    setForm(empty);
    setOpen(true);
  }

  function openEdit(c: Customer) {
    setEditing(c);
    setForm({
      name: c.name,
      phone: c.phone ?? "",
      email: c.email ?? "",
      note: c.note ?? "",
      image: c.image,
    });
    setOpen(true);
  }

  function handleSave() {
    if (!form.name.trim()) return;
    const payload = {
      name: form.name.trim(),
      phone: form.phone.trim() || undefined,
      email: form.email.trim() || undefined,
      note: form.note.trim() || undefined,
      image: form.image,
    };
    if (editing) updateCustomer(editing.id, payload);
    else addCustomer(payload);
    setOpen(false);
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">{t("nav.biz.customers")}</h1>
          <p className="text-sm text-muted-foreground">{t("exp.count", { n: customers.length })}</p>
        </div>
        <Button onClick={openNew} className="gap-2 rounded-xl">
          <Plus className="size-4" />
          {t("biz.addCustomer")}
        </Button>
      </div>

      <div className="grid gap-2.5 sm:grid-cols-2 xl:grid-cols-3">
        {customers.map((c) => (
          <div
            key={c.id}
            className="card-soft flex items-center gap-3 rounded-2xl border border-border/60 bg-card p-4"
          >
            {c.image ? (
              <img
                src={c.image}
                alt=""
                loading="lazy"
                className="size-10 shrink-0 rounded-full object-cover ring-1 ring-border/60"
              />
            ) : (
              <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-primary/10 text-sm font-bold text-primary">
                {c.name.slice(0, 2).toUpperCase()}
              </span>
            )}
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-semibold">{c.name}</p>
              <p className="truncate text-xs text-muted-foreground">
                {c.phone || c.email || "—"}
                {spendByCustomer.get(c.id)
                  ? ` · ${money(spendByCustomer.get(c.id)!)}`
                  : ""}
              </p>
            </div>
            <div className="flex shrink-0 gap-0.5">
              <Button variant="ghost" size="icon" className="size-7 rounded-lg" onClick={() => openEdit(c)}>
                <Pencil className="size-3.5" />
              </Button>
              <Button
                variant="ghost" size="icon" className="size-7 rounded-lg text-destructive"
                onClick={() => deleteCustomer(c.id)}
              >
                <Trash2 className="size-3.5" />
              </Button>
            </div>
          </div>
        ))}
        {customers.length === 0 && (
          <div className="col-span-full rounded-2xl border border-dashed border-border/70 p-10 text-center">
            <Users className="mx-auto mb-2 size-8 text-muted-foreground/50" />
            <p className="text-sm font-medium">{t("biz.addCustomer")}</p>
            <Contact className="mx-auto mt-1 size-4 text-muted-foreground/40" />
          </div>
        )}
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="rounded-3xl sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>{editing ? t("biz.editCustomer") : t("biz.addCustomer")}</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <ImagePicker value={form.image} onChange={(v) => setForm({ ...form, image: v })} />
              <div className="min-w-0 flex-1 space-y-1.5">
                <Label htmlFor="c-name">{t("biz.name")}</Label>
                <Input
                  id="c-name"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  className="h-10 rounded-xl"
                  autoFocus
                />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="c-phone">{t("biz.phone")}</Label>
              <Input
                id="c-phone"
                value={form.phone}
                onChange={(e) => setForm({ ...form, phone: e.target.value })}
                className="h-10 rounded-xl"
                inputMode="tel"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="c-email">{t("biz.email")}</Label>
              <Input
                id="c-email"
                type="email"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                className="h-10 rounded-xl"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="c-note">{t("exp.note")}</Label>
              <Textarea
                id="c-note"
                rows={2}
                value={form.note}
                onChange={(e) => setForm({ ...form, note: e.target.value })}
                className="rounded-xl"
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
