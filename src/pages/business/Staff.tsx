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
import { Switch } from "@/components/ui/switch";
import { money } from "@/lib/format";
import { useI18n } from "@/lib/i18n";
import {
  addStaff,
  deleteStaff,
  updateStaff,
  useStaff,
} from "@/lib/store";
import type { StaffMember } from "@/lib/types";
import { Phone, Pencil, Plus, Trash2, UserCog, Users } from "lucide-react";
import { useMemo, useState } from "react";
import { toast } from "sonner";

const emptyForm = {
  name: "",
  role: "",
  phone: "",
  salary: "",
  active: true,
};

export default function BusinessStaff() {
  const { t } = useI18n();
  const staff = useStaff();
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<StaffMember | null>(null);
  const [form, setForm] = useState(emptyForm);

  const payroll = useMemo(
    () => staff.filter((s) => s.active).reduce((sum, s) => sum + s.salary, 0),
    [staff],
  );
  const activeCount = staff.filter((s) => s.active).length;

  function openAdd() {
    setEditing(null);
    setForm(emptyForm);
    setOpen(true);
  }

  function openEdit(s: StaffMember) {
    setEditing(s);
    setForm({
      name: s.name,
      role: s.role ?? "",
      phone: s.phone ?? "",
      salary: String(s.salary),
      active: s.active,
    });
    setOpen(true);
  }

  function save() {
    const name = form.name.trim();
    if (!name) return;
    const payload = {
      name,
      role: form.role.trim() || undefined,
      phone: form.phone.trim() || undefined,
      salary: Math.max(0, Number(form.salary) || 0),
      active: form.active,
    };
    if (editing) updateStaff(editing.id, payload);
    else addStaff(payload);
    toast.success(t("biz.staffSaved"));
    setOpen(false);
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">{t("biz.staff")}</h1>
          <p className="text-sm text-muted-foreground">{t("biz.staffSub")}</p>
        </div>
        <Button onClick={openAdd} className="gap-2 rounded-xl">
          <Plus className="size-4" />
          {t("biz.addStaff")}
        </Button>
      </div>

      <div className="grid grid-cols-3 gap-2 sm:gap-3">
        <StatCard label={t("biz.monthlyPayroll")} value={money(payroll)} icon={UserCog} tone="text-violet-600 dark:text-violet-400" tint="bg-violet-500/12" />
        <StatCard label={t("biz.activeStaff")} value={String(activeCount)} icon={Users} tone="text-emerald-600 dark:text-emerald-400" tint="bg-emerald-500/12" />
        <StatCard label={t("biz.inactiveStaff")} value={String(staff.length - activeCount)} icon={UserCog} tone="text-muted-foreground" tint="bg-muted" />
      </div>

      <div className="grid gap-2.5 sm:grid-cols-2 xl:grid-cols-3">
        {staff.map((s, i) => (
          <FadeIn key={s.id} delay={i * 0.03}>
            <div className="card-soft flex items-center gap-3 rounded-2xl border border-border/60 bg-card p-4">
              <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-violet-500/12 text-sm font-bold text-violet-600 dark:text-violet-400">
                {s.name.slice(0, 2).toUpperCase()}
              </span>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <p className="truncate text-sm font-semibold">{s.name}</p>
                  <span
                    className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${
                      s.active
                        ? "bg-emerald-500/12 text-emerald-600 dark:text-emerald-400"
                        : "bg-muted text-muted-foreground"
                    }`}
                  >
                    {s.active ? t("biz.activeStaff") : t("biz.inactiveStaff")}
                  </span>
                </div>
                <p className="truncate text-xs text-muted-foreground">
                  {s.role ?? "—"}
                  {s.phone ? ` · ${s.phone}` : ""}
                </p>
              </div>
              <div className="flex shrink-0 items-center gap-1">
                <p className="text-sm font-bold tabular-nums">{money(s.salary)}</p>
                <Button variant="ghost" size="icon" className="size-7 rounded-lg" onClick={() => openEdit(s)}>
                  <Pencil className="size-3.5" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="size-7 rounded-lg text-destructive"
                  onClick={() => deleteStaff(s.id)}
                >
                  <Trash2 className="size-3.5" />
                </Button>
              </div>
            </div>
          </FadeIn>
        ))}
        {staff.length === 0 && (
          <div className="col-span-full rounded-2xl border border-dashed border-border/70 p-10 text-center">
            <Users className="mx-auto mb-2 size-8 text-muted-foreground/50" />
            <p className="text-sm font-medium">{t("biz.addStaff")}</p>
            <p className="mt-1 text-xs text-muted-foreground">{t("biz.staffSub")}</p>
          </div>
        )}
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="rounded-3xl sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>{editing ? t("biz.editStaff") : t("biz.addStaff")}</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div className="space-y-1.5">
              <Label htmlFor="staff-name">{t("biz.name")}</Label>
              <Input
                id="staff-name"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                className="h-10 rounded-xl"
                autoFocus
              />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-1.5">
                <Label htmlFor="staff-role">{t("biz.role")}</Label>
                <Input
                  id="staff-role"
                  value={form.role}
                  onChange={(e) => setForm({ ...form, role: e.target.value })}
                  className="h-10 rounded-xl"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="staff-salary">{t("biz.salary")}</Label>
                <Input
                  id="staff-salary"
                  type="number"
                  min="0"
                  step="0.01"
                  value={form.salary}
                  onChange={(e) => setForm({ ...form, salary: e.target.value })}
                  className="h-10 rounded-xl"
                  inputMode="decimal"
                />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="staff-phone">{t("biz.phone")}</Label>
              <Input
                id="staff-phone"
                value={form.phone}
                onChange={(e) => setForm({ ...form, phone: e.target.value })}
                className="h-10 rounded-xl"
                inputMode="tel"
              />
            </div>
            <label className="flex items-center justify-between rounded-xl bg-muted/50 px-3 py-2.5">
              <span className="text-sm font-medium">{t("biz.activeStaff")}</span>
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
            <Button onClick={save} disabled={!form.name.trim()} className="rounded-xl">
              {t("common.save")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
