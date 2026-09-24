import { useEffect, useState } from "react";
import { Download, Monitor, Smartphone, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useI18n } from "@/lib/i18n";

type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
};

const DISMISSED_KEY = "flowday-install-dismissed-v1";

function isStandalone() {
  return (
    window.matchMedia("(display-mode: standalone)").matches ||
    (navigator as Navigator & { standalone?: boolean }).standalone === true
  );
}

function isIos() {
  return /iphone|ipad|ipod/i.test(navigator.userAgent);
}

/** Lightweight install prompt shown once on phones and desktop browsers. */
export function InstallPrompt() {
  const { t } = useI18n();
  const [installEvent, setInstallEvent] = useState<BeforeInstallPromptEvent | null>(null);
  const [dismissed, setDismissed] = useState(() => {
    try {
      return localStorage.getItem(DISMISSED_KEY) === "1";
    } catch {
      return false;
    }
  });
  const [installed, setInstalled] = useState(isStandalone);

  useEffect(() => {
    if (isStandalone()) {
      setInstalled(true);
      return;
    }

    const onBeforeInstallPrompt = (event: Event) => {
      event.preventDefault();
      setInstallEvent(event as BeforeInstallPromptEvent);
    };
    const onInstalled = () => {
      setInstalled(true);
      setInstallEvent(null);
      try {
        localStorage.removeItem(DISMISSED_KEY);
      } catch {
        // Storage can be unavailable in private browsing.
      }
    };

    window.addEventListener("beforeinstallprompt", onBeforeInstallPrompt);
    window.addEventListener("appinstalled", onInstalled);
    return () => {
      window.removeEventListener("beforeinstallprompt", onBeforeInstallPrompt);
      window.removeEventListener("appinstalled", onInstalled);
    };
  }, []);

  const dismiss = () => {
    setDismissed(true);
    try {
      localStorage.setItem(DISMISSED_KEY, "1");
    } catch {
      // Keep the banner hidden for this session even without storage.
    }
  };

  if (installed || dismissed) return null;

  const ios = isIos();
  const mobile = /android|iphone|ipad|ipod|mobile/i.test(navigator.userAgent);
  const Icon = ios || mobile ? Smartphone : Monitor;

  return (
    <aside className="fixed inset-x-3 bottom-3 z-50 mx-auto flex max-w-lg items-center gap-3 border border-primary/20 bg-card p-3 shadow-xl sm:bottom-5 sm:p-4">
      <span className="flex size-10 shrink-0 items-center justify-center bg-primary/10 text-primary">
        <Icon className="size-5" />
      </span>
      <div className="min-w-0 flex-1">
        <p className="text-sm font-bold">{t("install.title")}</p>
        <p className="mt-0.5 text-xs leading-5 text-muted-foreground">
          {ios
            ? t("install.ios")
            : mobile
              ? t("install.android")
              : t("install.desktop")}
        </p>
      </div>
      <div className="flex shrink-0 items-center gap-1">
        {installEvent ? (
          <Button
            size="sm"
            className="gap-1.5"
            onClick={async () => {
              await installEvent.prompt();
              const choice = await installEvent.userChoice;
              if (choice.outcome === "accepted") setInstalled(true);
              setInstallEvent(null);
              dismiss();
            }}
          >
            <Download className="size-3.5" />
            {t("install.action")}
          </Button>
        ) : (
          <span className="hidden text-xs font-semibold text-primary sm:inline">
            {t("install.menu")}
          </span>
        )}
        <Button variant="ghost" size="icon" className="size-8" onClick={dismiss} aria-label={t("install.later")}>
          <X className="size-4" />
        </Button>
      </div>
    </aside>
  );
}
