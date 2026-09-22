import { useEffect, useState } from "react";
import { updateSettings, useSettings } from "@/lib/store";

export type ThemeMode = "light" | "dark" | "system";

function applyTheme(mode: ThemeMode) {
  const root = document.documentElement;
  const dark =
    mode === "dark" ||
    (mode === "system" &&
      window.matchMedia("(prefers-color-scheme: dark)").matches);
  root.classList.toggle("dark", dark);
  root.style.colorScheme = dark ? "dark" : "light";
}

export function useTheme() {
  const settings = useSettings();
  const mode = settings.theme;
  const [resolved, setResolved] = useState<"light" | "dark">(() => {
    if (mode !== "system") return mode;
    return window.matchMedia("(prefers-color-scheme: dark)").matches
      ? "dark"
      : "light";
  });

  useEffect(() => {
    applyTheme(mode);
    setResolved(
      mode === "system"
        ? window.matchMedia("(prefers-color-scheme: dark)").matches
          ? "dark"
          : "light"
        : mode,
    );
    if (mode !== "system") return;
    const mq = window.matchMedia("(prefers-color-scheme: dark)");
    const onChange = () => {
      applyTheme("system");
      setResolved(mq.matches ? "dark" : "light");
    };
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, [mode]);

  return {
    mode,
    resolved,
    setMode: (m: ThemeMode) => updateSettings({ theme: m }),
    toggle: () =>
      updateSettings({ theme: resolved === "dark" ? "light" : "dark" }),
  };
}
