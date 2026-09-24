import type { CSSProperties } from "react";

const SEGMENTS = Array.from({ length: 8 }, (_, index) => index);

export function IosSpinner({
  label = "Loading…",
  className = "",
}: {
  label?: string;
  className?: string;
}) {
  return (
    <div
      className={`flex flex-col items-center justify-center gap-2 ${className}`}
      role="status"
      aria-live="polite"
      aria-label={label}
    >
      <span className="ios-spinner" aria-hidden="true">
        {SEGMENTS.map((segment) => (
          <span
            key={segment}
            className="ios-spinner-segment"
            style={{ "--ios-spinner-index": segment } as CSSProperties}
          />
        ))}
      </span>
      <span className="text-xs font-medium text-muted-foreground">{label}</span>
    </div>
  );
}
