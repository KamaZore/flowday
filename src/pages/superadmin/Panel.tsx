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
import {
  deleteUser,
  getAppData,
  listUsers,
  resetUserPassword,
  setUserPermissions,
  setUserRole,
  updateUserProfile,
  createUser,
  DEFAULT_PERMS,
  type SystemPerms,
  type UserRole,
} from "@/lib/db";
import { readSaSession, writeSaSession } from "@/lib/superadmin";
import bcrypt from "bcryptjs";
import { uid } from "@/lib/store";
import {
  Database,
  KeyRound,
  Loader2,
  Pencil,
  Plus,
  RefreshCw,
  ShieldCheck,
  Trash2,
  UserPlus,
  Users,
} from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { Link, useNavigate } from "react-router";
import { toast } from "sonner";

type PanelUser = Awaited<ReturnType<typeof listUsers>>[number];

const SYSTEMS: { key: keyof SystemPerms; labelKey: string }[] = [
  { key: "life", labelKey: "system.life.name" },
  { key: "expense", labelKey: "system.expense.name" },
  { key: "business", labelKey: "system.business.name" },
  { key: "admin", labelKey: "system.admin.name" },
];

/** Counts records inside a user's data doc per system. */
function summarize(d: unknown): { life: number; expense: number; business: number } | null {
  if (!d || typeof d !== "object") return null;
  const doc = d as Record<string, unknown>;
  const arr = (v: unknown) => (Array.isArray(v) ? v.length : 0);
  const biz = doc.business as Record<string, unknown> | undefined;
  return {
    life: arr(doc.tasks) + arr(doc.habits) + arr(doc.projects) + arr(doc.notes),
    expense: arr(doc.transactions) + arr(doc.accounts) + arr(doc.debts),
    business: biz
      ? arr(biz.products) + arr(biz.orders) + arr(biz.customers) + arr(biz.expenses)
      : 0,
  };
}

export default function SuperAdminPanel() {
  const { t } = useI18n();
  const navigate = useNavigate();
  const [users, setUsers] = useState<PanelUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [createOpen, setCreateOpen] = useState(false);
  const [editFor, setEditFor] = useState<PanelUser | null>(null);
  const [dataFor, setDataFor] = useState<PanelUser | null>(null);
  const [dataSummary, setDataSummary] = useState<ReturnType<typeof summarize>>(null);
  const [dataBusy, setDataBusy] = useState(false);

  // create form
  const [nName, setNName] = useState("");
  const [nEmail, setNEmail] = useState("");
  const [nPassword, setNPassword] = useState("");
  const [nPerms, setNPerms] = useState<SystemPerms>({ ...DEFAULT_PERMS });
  const [nBusy, setNBusy] = useState(false);

  // edit form
  const [eName, setEName] = useState("");
  const [eEmail, setEEmail] = useState("");
  const [ePerms, setEPerms] = useState<SystemPerms>({ ...DEFAULT_PERMS });
  const [newPassword, setNewPassword] = useState("");
  const [eBusy, setEBusy] = useState(false);

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      setUsers(await listUsers());
    } catch {
      toast.error(t("sa.loadFailed"));
    } finally {
      setLoading(false);
    }
  }, [t]);

  useEffect(() => {
    if (!readSaSession()) {
      navigate("/superadmin", { replace: true });
      return;
    }
    void refresh();
  }, [navigate, refresh]);

  async function openData(u: PanelUser) {
    setDataFor(u);
    setDataSummary(null);
    setDataBusy(true);
    try {
      const doc = await getAppData(u.id);
      setDataSummary(summarize(doc));
    } catch {
      setDataSummary(null);
    } finally {
      setDataBusy(false);
    }
  }

  async function createAccount() {
    setNBusy(true);
    try {
      const email = nEmail.trim().toLowerCase();
      const hash = await bcrypt.hash(nPassword, 10);
      await createUser(uid() + uid(), nName.trim(), email, hash, "user", nPerms);
      toast.success(t("sa.created"));
      setCreateOpen(false);
      setNName("");
      setNEmail("");
      setNPassword("");
      setNPerms({ ...DEFAULT_PERMS });
      await refresh();
    } catch {
      toast.error(t("sa.createFailed"));
    } finally {
      setNBusy(false);
    }
  }

  async function saveEdit() {
    if (!editFor) return;
    setEBusy(true);
    try {
      await updateUserProfile(editFor.id, eName.trim(), eEmail.trim().toLowerCase());
      await setUserRole(editFor.id, editFor.role);
      await setUserPermissions(editFor.id, ePerms);
      if (newPassword) {
        const hash = await bcrypt.hash(newPassword, 10);
        await resetUserPassword(editFor.id, hash);
      }
      toast.success(t("sa.saved"));
      setEditFor(null);
      setNewPassword("");
      await refresh();
    } catch {
      toast.error(t("sa.saveFailed"));
    } finally {
      setEBusy(false);
    }
  }

  async function toggleRole(u: PanelUser) {
    const next: UserRole = u.role === "superadmin" ? "user" : "superadmin";
    await setUserRole(u.id, next);
    await refresh();
    toast.success(t("sa.saved"));
  }

  async function remove(u: PanelUser) {
    if (!confirm(t("sa.deleteConfirm", { email: u.email }))) return;
    try {
      await deleteUser(u.id);
      toast.success(t("sa.deleted"));
      await refresh();
    } catch {
      toast.error(t("sa.saveFailed"));
    }
  }

  function openEdit(u: PanelUser) {
    setEditFor(u);
    setEName(u.name);
    setEEmail(u.email);
    setEPerms({ ...u.permissions });
    setNewPassword("");
  }

  return (
    <main className="min-h-dvh bg-background px-4 py-8">
      <div className="mx-auto max-w-4xl space-y-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <span className="flex size-11 items-center justify-center rounded-2xl bg-amber-500/12 text-amber-600 dark:text-amber-400">
              <ShieldCheck className="size-6" />
            </span>
            <div>
              <h1 className="text-xl font-bold tracking-tight">{t("sa.panel")}</h1>
              <p className="text-xs text-muted-foreground">{t("sa.panelSub")}</p>
            </div>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={refresh} className="gap-1.5 rounded-lg">
              <RefreshCw className={"size-3.5" + (loading ? " animate-spin" : "")} />
              {t("common.refresh") ?? "Refresh"}
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="rounded-lg"
              onClick={() => {
                writeSaSession(null);
                navigate("/superadmin", { replace: true });
              }}
            >
              {t("common.signOut")}
            </Button>
          </div>
        </div>

        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            <Users className="mr-1 inline size-4" />
            {t("sa.count", { n: users.length })}
          </p>
          <Button onClick={() => setCreateOpen(true)} className="gap-2 rounded-xl">
            <UserPlus className="size-4" />
            {t("sa.createUser")}
          </Button>
        </div>

        {/* User list */}
        <div className="space-y-2">
          {users.map((u) => (
            <div
              key={u.id}
              className="card-soft flex flex-wrap items-center gap-3 rounded-2xl border border-border/60 bg-card p-4"
            >
              <span
                className={
                  "flex size-10 shrink-0 items-center justify-center rounded-full text-xs font-bold " +
                  (u.role === "superadmin"
                    ? "bg-amber-500/15 text-amber-600 dark:text-amber-400"
                    : "bg-primary/10 text-primary")
                }
              >
                {u.name.slice(0, 2).toUpperCase()}
              </span>
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <p className="truncate text-sm font-semibold">{u.name}</p>
                  <span
                    className={
                      "rounded-full px-2 py-0.5 text-[10px] font-semibold " +
                      (u.role === "superadmin"
                        ? "bg-amber-500/15 text-amber-600 dark:text-amber-400"
                        : "bg-muted text-muted-foreground")
                    }
                  >
                    {u.role === "superadmin" ? t("sa.roleSuper") : t("sa.roleUser")}
                  </span>
                  {!u.hasData && (
                    <span className="rounded-full bg-muted px-2 py-0.5 text-[10px] text-muted-foreground">
                      {t("sa.noData")}
                    </span>
                  )}
                </div>
                <p className="truncate text-xs text-muted-foreground">{u.email}</p>
                <div className="mt-1 flex flex-wrap gap-1">
                  {SYSTEMS.map((s) =>
                    u.role === "superadmin" || u.permissions[s.key] ? (
                      <span key={s.key} className="rounded-md bg-emerald-500/10 px-1.5 py-0.5 text-[9px] font-semibold text-emerald-600 dark:text-emerald-400">
                        {t(s.labelKey)}
                      </span>
                    ) : null,
                  )}
                </div>
              </div>
              <div className="flex shrink-0 gap-1">
                <Button variant="ghost" size="icon" className="size-8 rounded-lg" onClick={() => openData(u)} aria-label={t("sa.viewData")}>
                  <Database className="size-4" />
                </Button>
                <Button variant="ghost" size="icon" className="size-8 rounded-lg" onClick={() => openEdit(u)} aria-label={t("common.edit")}>
                  <Pencil className="size-4" />
                </Button>
                <Button variant="ghost" size="icon" className="size-8 rounded-lg text-destructive" onClick={() => remove(u)} aria-label={t("common.delete")}>
                  <Trash2 className="size-4" />
                </Button>
              </div>
            </div>
          ))}
          {loading && (
            <div className="flex items-center justify-center gap-2 py-10 text-sm text-muted-foreground">
              <Loader2 className="size-4 animate-spin" />
              {t("sa.loading")}
            </div>
          )}
          {!loading && users.length === 0 && (
            <div className="rounded-2xl border border-dashed border-border/70 p-10 text-center">
              <Users className="mx-auto mb-2 size-8 text-muted-foreground/50" />
              <p className="text-sm text-muted-foreground">{t("sa.empty")}</p>
            </div>
          )}
        </div>

        <div className="text-center">
          <Link to="/" className="text-xs font-medium text-muted-foreground hover:text-foreground">
            {t("sa.backToApp")}
          </Link>
        </div>
      </div>

      {/* Create dialog */}
      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent className="rounded-3xl sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <UserPlus className="size-4 text-primary" />
              {t("sa.createUser")}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div className="space-y-1.5">
              <Label htmlFor="nu-name">{t("settings.name")}</Label>
              <Input id="nu-name" value={nName} onChange={(e) => setNName(e.target.value)} className="h-10 rounded-xl" autoFocus />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="nu-email">{t("auth.email")}</Label>
              <Input id="nu-email" type="email" value={nEmail} onChange={(e) => setNEmail(e.target.value)} className="h-10 rounded-xl" />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="nu-pass">{t("auth.password")}</Label>
              <Input id="nu-pass" type="password" value={nPassword} onChange={(e) => setNPassword(e.target.value)} className="h-10 rounded-xl" />
            </div>
            <div className="space-y-1.5">
              <Label>{t("sa.systemAccess")}</Label>
              <div className="grid grid-cols-2 gap-2">
                {SYSTEMS.map((s) => (
                  <label key={s.key} className="flex items-center justify-between rounded-xl bg-muted/50 px-3 py-2 text-xs font-medium">
                    {t(s.labelKey)}
                    <Switch checked={nPerms[s.key]} onCheckedChange={(v) => setNPerms({ ...nPerms, [s.key]: v })} />
                  </label>
                ))}
              </div>
            </div>
          </div>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setCreateOpen(false)} className="rounded-xl">
              {t("common.cancel")}
            </Button>
            <Button
              onClick={createAccount}
              disabled={nBusy || !nName.trim() || !nEmail.trim() || nPassword.length < 6}
              className="gap-2 rounded-xl"
            >
              {nBusy && <Loader2 className="size-4 animate-spin" />}
              {t("common.save")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit dialog */}
      <Dialog open={!!editFor} onOpenChange={(v) => !v && setEditFor(null)}>
        <DialogContent className="rounded-3xl sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Pencil className="size-4 text-primary" />
              {t("sa.editUser")}
            </DialogTitle>
          </DialogHeader>
          {editFor && (
            <div className="space-y-3">
              <div className="space-y-1.5">
                <Label htmlFor="eu-name">{t("settings.name")}</Label>
                <Input id="eu-name" value={eName} onChange={(e) => setEName(e.target.value)} className="h-10 rounded-xl" />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="eu-email">{t("auth.email")}</Label>
                <Input id="eu-email" type="email" value={eEmail} onChange={(e) => setEEmail(e.target.value)} className="h-10 rounded-xl" />
              </div>
              <label className="flex items-center justify-between rounded-xl bg-muted/50 px-3 py-2.5">
                <span className="text-sm font-medium">{t("sa.makeSuper")}</span>
                <Switch checked={editFor.role === "superadmin"} onCheckedChange={() => toggleRole(editFor)} />
              </label>
              <div className="space-y-1.5">
                <Label>{t("sa.systemAccess")}</Label>
                <div className="grid grid-cols-2 gap-2">
                  {SYSTEMS.map((s) => (
                    <label key={s.key} className="flex items-center justify-between rounded-xl bg-muted/50 px-3 py-2 text-xs font-medium">
                      {t(s.labelKey)}
                      <Switch
                        checked={editFor.role === "superadmin" || ePerms[s.key]}
                        disabled={editFor.role === "superadmin"}
                        onCheckedChange={(v) => setEPerms({ ...ePerms, [s.key]: v })}
                      />
                    </label>
                  ))}
                </div>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="eu-pass">{t("sa.resetPass")}</Label>
                <div className="flex gap-2">
                  <Input
                    id="eu-pass"
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="h-10 rounded-xl"
                    placeholder="••••••••"
                  />
                  <KeyRound className="mt-3 size-4 text-muted-foreground" />
                </div>
                <p className="text-[11px] text-muted-foreground">{t("sa.resetPassHint")}</p>
              </div>
            </div>
          )}
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setEditFor(null)} className="rounded-xl">
              {t("common.cancel")}
            </Button>
            <Button onClick={saveEdit} disabled={eBusy || !eName.trim() || !eEmail.trim()} className="gap-2 rounded-xl">
              {eBusy && <Loader2 className="size-4 animate-spin" />}
              {t("common.save")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Per-user data dialog */}
      <Dialog open={!!dataFor} onOpenChange={(v) => !v && setDataFor(null)}>
        <DialogContent className="rounded-3xl sm:max-w-sm">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Database className="size-4 text-primary" />
              {t("sa.viewData")}
            </DialogTitle>
          </DialogHeader>
          {dataFor && (
            <div className="space-y-3">
              <p className="text-xs text-muted-foreground">{dataFor.email}</p>
              {dataBusy ? (
                <div className="flex items-center justify-center gap-2 py-6 text-sm text-muted-foreground">
                  <Loader2 className="size-4 animate-spin" />
                  {t("sa.loading")}
                </div>
              ) : dataSummary ? (
                <div className="grid grid-cols-3 gap-2 text-center">
                  {(
                    [
                      ["system.life.name", dataSummary.life],
                      ["system.expense.name", dataSummary.expense],
                      ["system.business.name", dataSummary.business],
                    ] as const
                  ).map(([k, n]) => (
                    <div key={k} className="rounded-2xl bg-muted/60 p-3">
                      <p className="text-[10px] text-muted-foreground">{t(k)}</p>
                      <p className="text-lg font-bold tabular-nums">{n}</p>
                      <p className="text-[9px] text-muted-foreground">{t("sa.records")}</p>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="rounded-xl bg-muted/60 px-3 py-4 text-center text-xs text-muted-foreground">
                  {t("sa.noData")}
                </p>
              )}
              <p className="text-[11px] text-muted-foreground">{t("sa.isolationNote")}</p>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </main>
  );
}
