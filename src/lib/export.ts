/**
 * Small client-side export helpers: CSV downloads (Excel/Sheets-friendly)
 * and a printable receipt window for POS sales. No dependencies.
 */

/** Escape a single CSV cell (quotes, commas, newlines). */
function csvCell(v: unknown): string {
  const s = v === null || v === undefined ? "" : String(v);
  if (/[",\n]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
  return s;
}

/**
 * Download a 2D array as a CSV file. First row is treated as the header.
 * Prefixing the filename with a BOM keeps Excel happy with Unicode text.
 */
export function downloadCsv(filename: string, rows: unknown[][]) {
  const body = rows.map((r) => r.map(csvCell).join(",")).join("\r\n");
  const blob = new Blob(["\uFEFF" + body], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

export type ReceiptData = {
  shopName: string;
  number: number;
  createdAt: number;
  method: string;
  lines: { name: string; qty: number; price: number; discount: number }[];
  subtotal: number;
  discountTotal: number;
  taxTotal: number;
  total: number;
  amountPaid?: number;
  change?: number;
};

/** Open a print-friendly receipt in a new window and trigger the print dialog. */
export function printReceipt(r: ReceiptData) {
  const esc = (s: string) =>
    s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  const rows = r.lines
    .map(
      (l) => `<tr>
        <td>${esc(l.name)}</td>
        <td class="c">${l.qty}</td>
        <td class="r">${fmt(l.price)}</td>
        <td class="r">${fmt(l.qty * l.price * (1 - l.discount / 100))}</td>
      </tr>`,
    )
    .join("");
  const extra =
    r.discountTotal > 0
      ? `<div class="row"><span>Discount</span><span>-${fmt(r.discountTotal)}</span></div>`
      : "";
  const tax =
    r.taxTotal > 0
      ? `<div class="row"><span>Tax</span><span>${fmt(r.taxTotal)}</span></div>`
      : "";
  const change =
    r.amountPaid !== undefined
      ? `<div class="row"><span>Paid</span><span>${fmt(r.amountPaid)}</span></div>
         ${r.change ? `<div class="row"><span>Change</span><span>${fmt(r.change)}</span></div>` : ""}`
      : "";

  const html = `<!doctype html><html><head><meta charset="utf-8">
<title>Receipt #${r.number}</title>
<style>
  * { box-sizing: border-box; }
  body { font-family: ui-monospace, "Courier New", monospace; font-size: 13px; margin: 24px auto; max-width: 320px; color: #111; }
  h1 { font-size: 16px; text-align: center; margin: 0 0 2px; }
  .muted { color: #666; text-align: center; font-size: 11px; margin-bottom: 12px; }
  table { width: 100%; border-collapse: collapse; margin: 8px 0; }
  th { font-size: 10px; text-transform: uppercase; color: #666; border-bottom: 1px dashed #999; padding: 4px 0; text-align: left; }
  td { padding: 3px 0; vertical-align: top; }
  .c { text-align: center; } .r { text-align: right; white-space: nowrap; }
  .row { display: flex; justify-content: space-between; padding: 2px 0; }
  .total { display: flex; justify-content: space-between; font-weight: 700; font-size: 15px; border-top: 1px dashed #999; margin-top: 8px; padding-top: 6px; }
  .thanks { text-align: center; margin-top: 14px; font-size: 11px; color: #666; }
</style></head><body>
<h1>${esc(r.shopName || "Flowday Shop")}</h1>
<div class="muted">Receipt #${r.number} · ${new Date(r.createdAt).toLocaleString()}</div>
<table>
  <thead><tr><th>Item</th><th class="c">Qty</th><th class="r">Price</th><th class="r">Total</th></tr></thead>
  <tbody>${rows}</tbody>
</table>
${extra}${tax}
<div class="total"><span>Total</span><span>${fmt(r.total)}</span></div>
${change}
<div class="thanks">Thank you!</div>
<script>window.onload = () => { window.print(); }</script>
</body></html>`;

  const w = window.open("", "_blank", "width=420,height=640");
  if (!w) return;
  w.document.write(html);
  w.document.close();
}

function fmt(n: number): string {
  return n.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}
