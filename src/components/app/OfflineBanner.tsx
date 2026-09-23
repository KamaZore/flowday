import { useI18n } from "@/lib/i18n";
import { WifiOff } from "lucide-react";
import { useEffect, useState } from "react";

/**
 * Slim banner shown while the device is offline. Flowday is local-first, so
 * everything keeps working — the banner just tells the user their changes
 * are safe on-device and will sync later. Pass `messageKey` to override the
 * copy (e.g. the auth page's "sign-in needs internet" note).
 */
export function OfflineBanner({
  messageKey = "offline.banner",
}: {
  messageKey?: string;
}) {
  const { t } = useI18n();
  const [online, setOnline] = useState(
    () => typeof navigator === "undefined" || navigator.onLine,
  );

  useEffect(() => {
    const goOnline = () => setOnline(true);
    const goOffline = () => setOnline(false);
    window.addEventListener("online", goOnline);
    window.addEventListener("offline", goOffline);
    return () => {
      window.removeEventListener("online", goOnline);
      window.removeEventListener("offline", goOffline);
    };
  }, []);

  if (online) return null;

  return (
    <div
      role="status"
      className="flex items-center justify-center gap-2 bg-amber-500/15 px-3 py-1.5 text-xs font-medium text-amber-700 dark:text-amber-400"
    >
      <WifiOff className="size-3.5 shrink-0" />
      <span className="truncate">{t(messageKey)}</span>
    </div>
  );
}
