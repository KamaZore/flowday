import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useI18n } from "@/lib/i18n";
import {
  DATE_FILTER_KINDS,
  resolveDateRange,
  type DateFilter,
  type DateFilterKind,
} from "@/lib/store";
import { formatDateKey } from "@/lib/date-utils";
import { cn } from "@/lib/utils";
import { useState } from "react";

const KINDS = DATE_FILTER_KINDS.filter((k) => k !== "custom");

const LABEL_KEYS: Record<DateFilterKind, string> = {
  today: "filter.today",
  yesterday: "filter.yesterday",
  week: "filter.week",
  month: "filter.month",
  lastMonth: "filter.lastMonth",
  year: "filter.year",
  all: "filter.all",
  custom: "filter.custom",
};

/**
 * Horizontal date-range filter. `all` shows only when `allowAll` (long
 * histories), custom adds a from/to picker inline.
 */
export function DateFilterBar({
  value,
  onChange,
  allowAll = true,
}: {
  value: DateFilter;
  onChange: (f: DateFilter) => void;
  allowAll?: boolean;
}) {
  const { t } = useI18n();
  const [showCustom, setShowCustom] = useState(value.kind === "custom");
  const kinds = allowAll ? KINDS : KINDS;

  return (
    <div className="space-y-2">
      <div className="-mx-4 overflow-x-auto px-4 pb-1 md:mx-0 md:px-0">
        <div className="flex w-max gap-1.5 md:w-auto md:flex-wrap">
          {kinds.map((k) => (
            <Button
              key={k}
              type="button"
              variant={value.kind === k ? "default" : "outline"}
              size="sm"
              className="h-8 shrink-0 rounded-full px-3 text-xs font-semibold"
              onClick={() => {
                onChange({ kind: k });
                setShowCustom(false);
              }}
            >
              {t(LABEL_KEYS[k])}
            </Button>
          ))}
          <Button
            type="button"
            variant={value.kind === "custom" ? "default" : "outline"}
            size="sm"
            className="h-8 shrink-0 rounded-full px-3 text-xs font-semibold"
            onClick={() => {
              setShowCustom((v) => !v);
              if (!showCustom) onChange({ kind: "custom", from: undefined, to: undefined });
            }}
          >
            {t("filter.custom")}
          </Button>
        </div>
      </div>

      {showCustom && (
        <div className="flex flex-wrap items-end gap-2 rounded-xl border border-border/60 bg-muted/40 p-2.5">
          <div className="space-y-1">
            <span className="text-[11px] font-medium text-muted-foreground">From</span>
            <Input
              type="date"
              className="h-8 w-36 rounded-lg text-xs"
              value={value.from ?? ""}
              onChange={(e) =>
                onChange({ kind: "custom", from: e.target.value || undefined, to: value.to })
              }
            />
          </div>
          <div className="space-y-1">
            <span className="text-[11px] font-medium text-muted-foreground">To</span>
            <Input
              type="date"
              className="h-8 w-36 rounded-lg text-xs"
              value={value.to ?? ""}
              onChange={(e) =>
                onChange({ kind: "custom", from: value.from, to: e.target.value || undefined })
              }
            />
          </div>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="h-8 rounded-lg text-xs"
            onClick={() => {
              const r = resolveDateRange({ kind: "month" });
              onChange({ kind: "custom", ...r });
            }}
          >
            {t("filter.month")}
          </Button>
        </div>
      )}
    </div>
  );
}
