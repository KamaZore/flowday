import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  updateSettings,
  useSettings,
  exportData,
  importData,
  resetDemoData,
  clearAllData,
} from "@/lib/store";
import { useTheme } from "@/hooks/use-theme";
import { cn } from "@/lib/utils";
import {
  Download,
  Moon,
  RefreshCw,
  Sun,
  SunMoon,
  Trash2,
  Upload,
  Monitor,
  Smartphone,
} from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";

type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
};

export default function Settings() {
  const settings = useSettings();
  const { mode, setMode } = useTheme();
  const [installEvt, setInstallEvt] = useState<BeforeInstallPromptEvent | null>(null);
  const [name, setName] = useState(settings.name);

  useEffect(() => {
    const handler = (e: Event) => {
      e.preventDefault();
      setInstallEvt(e as BeforeInstallPromptEvent);
    };
    window.addEventListener("beforeinstallprompt", handler);
    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, []);

  const doExport = () => {
    const blob = new Blob([exportData()], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `flowday-backup-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success("Backup downloaded");
  };

  const doImport = (file: File) => {
    const reader = new FileReader();
    reader.onload = () => {
      const ok = importData(String(reader.result));
      if (ok) toast.success("Data imported");
      else toast.error("Invalid backup file");
    };
    reader.readAsText(file);
  };

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Settings</h1>
        <p className="text-sm text-muted-foreground">
          Make Flowday yours
        </p>
      </div>

      {/* Profile */}
      <section className="card-soft rounded-2xl border border-border/70 bg-card p-4">
        <h2 className="pb-3 text-sm font-semibold">Profile</h2>
        <div className="flex items-end gap-2">
          <div className="flex-1 space-y-1.5">
            <Label htmlFor="name">Your name</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="What should we call you?"
              className="h-10 rounded-xl"
            />
          </div>
          <Button
            className="rounded-xl"
            onClick={() => {
              updateSettings({ name: name.trim() || "there" });
              toast.success("Saved");
            }}
          >
            Save
          </Button>
        </div>
      </section>

      {/* Appearance */}
      <section className="card-soft rounded-2xl border border-border/70 bg-card p-4">
        <h2 className="pb-3 text-sm font-semibold">Appearance</h2>
        <div className="grid grid-cols-3 gap-2">
          {(
            [
              { value: "light", label: "Light", icon: Sun },
              { value: "dark", label: "Dark", icon: Moon },
              { value: "system", label: "System", icon: SunMoon },
            ] as const
          ).map((opt) => (
            <button
              key={opt.value}
              onClick={() => setMode(opt.value)}
              className={cn(
                "flex flex-col items-center gap-1.5 rounded-xl border px-3 py-3 text-xs font-medium transition-colors",
                mode === opt.value
                  ? "border-primary bg-primary/10 text-primary"
                  : "text-muted-foreground hover:bg-muted",
              )}
            >
              <opt.icon className="size-4" />
              {opt.label}
            </button>
          ))}
        </div>
        <div className="mt-4 flex items-center justify-between">
          <div>
            <p className="text-sm font-medium">Week starts Monday</p>
            <p className="text-xs text-muted-foreground">
              Affects calendar layout
            </p>
          </div>
          <Switch
            checked={settings.weekStartsMonday}
            onCheckedChange={(v) => updateSettings({ weekStartsMonday: v })}
          />
        </div>
      </section>

      {/* App install */}
      <section className="card-soft rounded-2xl border border-border/70 bg-card p-4">
        <h2 className="pb-1 text-sm font-semibold">Install app</h2>
        <p className="pb-3 text-xs text-muted-foreground">
          Install Flowday as an app for offline use and a native feel.
          {installEvt
            ? " Your browser supports one-tap install."
            : " Use your browser menu → “Install app” / “Add to Home Screen”."}
        </p>
        <Button
          className="gap-2 rounded-xl"
          disabled={!installEvt}
          onClick={async () => {
            if (!installEvt) return;
            await installEvt.prompt();
            const choice = await installEvt.userChoice;
            if (choice.outcome === "accepted") toast.success("Installing…");
            setInstallEvt(null);
          }}
        >
          <Smartphone className="size-4" />
          {installEvt ? "Install Flowday" : "Not available here"}
        </Button>
      </section>

      {/* Data */}
      <section className="card-soft rounded-2xl border border-border/70 bg-card p-4">
        <h2 className="pb-1 text-sm font-semibold">Your data</h2>
        <p className="pb-3 text-xs text-muted-foreground">
          Everything is stored locally on this device. No account, no cloud.
        </p>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" className="gap-1.5 rounded-xl" onClick={doExport}>
            <Download className="size-4" /> Export backup
          </Button>
          <label>
            <input
              type="file"
              accept="application/json"
              className="hidden"
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) doImport(f);
                e.target.value = "";
              }}
            />
            <span className="inline-flex h-9 cursor-pointer items-center justify-center gap-1.5 rounded-xl border border-input bg-background px-4 text-sm font-medium shadow-sm hover:bg-accent hover:text-accent-foreground">
              <Upload className="size-4" /> Import backup
            </span>
          </label>
          <Button
            variant="outline"
            className="gap-1.5 rounded-xl"
            onClick={() => {
              if (confirm("Reload the sample demo data? This replaces your current data.")) {
                resetDemoData();
                toast.success("Demo data loaded");
              }
            }}
          >
            <RefreshCw className="size-4" /> Reset demo data
          </Button>
          <Button
            variant="outline"
            className="gap-1.5 rounded-xl text-destructive hover:text-destructive"
            onClick={() => {
              if (confirm("Delete ALL data? This cannot be undone.")) {
                clearAllData();
                toast.success("All data cleared");
              }
            }}
          >
            <Trash2 className="size-4" /> Clear all data
          </Button>
        </div>
      </section>

      {/* About */}
      <section className="card-soft rounded-2xl border border-border/70 bg-card p-4">
        <h2 className="pb-2 text-sm font-semibold">About</h2>
        <div className="space-y-1 text-xs text-muted-foreground">
          <p>Flowday v1.0 — local-first personal workflow app.</p>
          <p>Goal → Project → Process → Tasks → Daily actions → Progress.</p>
          <p className="flex items-center gap-1.5">
            <Monitor className="size-3.5" />
            Works offline · data stays on your device
          </p>
        </div>
      </section>
    </div>
  );
}
