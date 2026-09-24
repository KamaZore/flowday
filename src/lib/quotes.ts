/**
 * Quote helpers kept outside the main store module. `updateQuote` needs the
 * store's internal `set()` (not exported), so this module round-trips the
 * document through the public export/import API:
 * exportData() → mutate → importData() — which persists to localStorage and
 * queues the Neon sync exactly like a normal store update.
 */
import { exportData, importData } from "./store";
import type { AppData, OrderLine } from "./types";

export type QuotePatch = {
  customerName: string;
  lines: OrderLine[];
  note?: string;
  subtotal: number;
  discountTotal: number;
  total: number;
  costTotal: number;
};

/** Edit a draft quote's customer, lines or note; totals are recomputed. */
export function updateQuote(id: string, patch: QuotePatch): boolean {
  let doc: AppData;
  try {
    doc = JSON.parse(exportData()) as AppData;
  } catch {
    return false;
  }
  const quotes = doc.business?.quotes;
  if (!Array.isArray(quotes)) return false;
  doc.business.quotes = quotes.map((q) =>
    q.id === id ? { ...q, ...patch, updatedAt: Date.now() } : q,
  );
  return importData(JSON.stringify(doc));
}
