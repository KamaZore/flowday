/**
 * Image helpers — everything stays local-first and inside the JSON doc,
 * so images are downscaled + JPEG-compressed into small data URLs before
 * being attached to Product / Customer / Transaction records.
 */

/** Max stored width/height in px (images are square-cropped by CSS). */
const MAX_DIM = 480;

/** JPEG quality for the compressed data URL. */
const QUALITY = 0.82;

/** Files bigger than this (bytes) are always re-encoded. */
const MAX_BYTES = 1_500_000;

/**
 * Read an image file and return a compressed JPEG data URL (max 480px).
 * Transparency is flattened onto white since JPEG has no alpha.
 */
export function compressImageFile(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    if (!file.type.startsWith("image/")) {
      reject(new Error("Not an image"));
      return;
    }
    const reader = new FileReader();
    reader.onerror = () => reject(new Error("Could not read file"));
    reader.onload = () => {
      const img = new Image();
      img.onerror = () => reject(new Error("Could not decode image"));
      img.onload = () => {
        const scale = Math.min(1, MAX_DIM / Math.max(img.width, img.height));
        const w = Math.max(1, Math.round(img.width * scale));
        const h = Math.max(1, Math.round(img.height * scale));
        const canvas = document.createElement("canvas");
        canvas.width = w;
        canvas.height = h;
        const ctx = canvas.getContext("2d");
        if (!ctx) {
          reject(new Error("Canvas unavailable"));
          return;
        }
        ctx.fillStyle = "#ffffff";
        ctx.fillRect(0, 0, w, h);
        ctx.drawImage(img, 0, 0, w, h);
        resolve(canvas.toDataURL("image/jpeg", QUALITY));
      };
      img.src = reader.result as string;
    };
    reader.readAsDataURL(file);
  });
}

/**
 * True when the file can be stored as-is (small JPEG already ≤ 480px is
 * rare to detect cheaply, so we simply allow small files to skip re-encode).
 */
export function needsCompression(file: File): boolean {
  return file.size > MAX_BYTES;
}

/** A tiny inline SVG placeholder (emoji on a tinted tile) as a data URL. */
export function svgEmoji(emoji: string, bg = "#f1f5f9"): string {
  const svg =
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 96 96">` +
    `<rect width="96" height="96" rx="20" fill="${bg}"/>` +
    `<text x="48" y="50" font-size="44" text-anchor="middle" dominant-baseline="central">${emoji}</text>` +
    `</svg>`;
  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}
