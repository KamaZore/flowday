import { Button } from "@/components/ui/button";
import { useI18n } from "@/lib/i18n";
import { compressImageFile } from "@/lib/image";
import { ImagePlus, X } from "lucide-react";
import { useId, type ChangeEvent } from "react";
import { toast } from "sonner";

/**
 * Pick, preview and remove an image. The file is compressed to a small
 * JPEG data URL (max 480px) before it reaches the caller, so records stay
 * light enough for the local-first JSON document and Neon sync.
 */
export function ImagePicker({
  value,
  onChange,
  size = "md",
}: {
  value?: string;
  onChange: (v: string | undefined) => void;
  /** md = 80px tile, sm = 56px (dialogs/lists) */
  size?: "sm" | "md";
}) {
  const { t } = useI18n();
  const id = useId();
  const dim = size === "sm" ? "size-14" : "size-20";

  async function onFile(e: ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    e.target.value = "";
    if (!f) return;
    try {
      onChange(await compressImageFile(f));
    } catch {
      toast.error(t("img.error"));
    }
  }

  return (
    <>
      <input
        id={id}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={onFile}
      />
      {value ? (
        <div className="relative w-fit">
          <label htmlFor={id} className="block cursor-pointer">
            <img
              src={value}
              alt=""
              className={`${dim} rounded-2xl object-cover ring-1 ring-border/60 transition-opacity hover:opacity-85`}
            />
          </label>
          <Button
            type="button"
            variant="destructive"
            size="icon"
            onClick={() => onChange(undefined)}
            aria-label={t("img.remove")}
            className="absolute -right-2 -top-2 size-5 rounded-full shadow"
          >
            <X className="size-3" />
          </Button>
        </div>
      ) : (
        <label
          htmlFor={id}
          className={`${dim} flex cursor-pointer flex-col items-center justify-center gap-1 rounded-2xl border border-dashed border-border/70 text-muted-foreground transition-colors hover:border-primary/50 hover:bg-primary/5 hover:text-primary`}
        >
          <ImagePlus className="size-5" />
          <span className="px-1 text-center text-[10px] font-medium leading-tight">
            {t("img.pick")}
          </span>
        </label>
      )}
    </>
  );
}
