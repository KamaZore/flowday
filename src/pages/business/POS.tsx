import { OfflineBanner } from "@/components/app/OfflineBanner";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useI18n } from "@/lib/i18n";
import { money } from "@/lib/format";
import {
  cartTotals,
  checkoutOrder,
  discardHeldOrder,
  holdOrder,
  lineTotal,
  resumeHeldOrder,
  useBusiness,
  useProducts,
  type CartLine,
} from "@/lib/store";
import { PAYMENT_METHODS, type Order } from "@/lib/types";
import {
  Banknote,
  CreditCard,
  Landmark,
  Minus,
  Package,
  Pause,
  Percent,
  Play,
  Plus,
  Printer,
  ShoppingBag,
  Trash2,
  Wallet,
  X,
} from "lucide-react";
import { useMemo, useRef, useState } from "react";
import { toast } from "sonner";

const METHOD_ICON: Record<string, typeof Wallet> = {
  cash: Banknote,
  card: CreditCard,
  bank: Landmark,
  other: Wallet,
};

export default function BusinessPOS() {
  const { t } = useI18n();
  const products = useProducts();
  const business = useBusiness();

  const [search, setSearch] = useState("");
  const [cart, setCart] = useState<CartLine[]>([]);
  const [customerId, setCustomerId] = useState<string>("none");
  const [payOpen, setPayOpen] = useState(false);
  const [method, setMethod] = useState<string>("cash");
  const [amountPaid, setAmountPaid] = useState("");
  const [receipt, setReceipt] = useState<Order | null>(null);
  const [heldOpen, setHeldOpen] = useState(false);
  const searchRef = useRef<HTMLInputElement>(null);

  const totals = cartTotals(cart, {
    taxRate: business.taxRate,
    taxEnabled: business.taxEnabled,
  });

  const filtered = products.filter((p) => {
    if (!p.active) return false;
    const q = search.trim().toLowerCase();
    if (!q) return true;
    return (
      p.name.toLowerCase().includes(q) ||
      p.sku?.toLowerCase().includes(q) ||
      p.barcode?.includes(q)
    );
  });

  /** Enter on the search box adds an exact barcode/SKU match straight to cart. */
  function handleSearchKey(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key !== "Enter") return;
    const q = search.trim().toLowerCase();
    if (!q) return;
    const hit =
      products.find((p) => p.barcode && p.barcode.toLowerCase() === q) ??
      products.find((p) => p.sku && p.sku.toLowerCase() === q) ??
      filtered[0];
    if (hit) {
      addToCart(hit.id);
      setSearch("");
    }
  }

  function addToCart(productId: string) {
    const p = products.find((x) => x.id === productId);
    if (!p) return;
    setCart((prev) => {
      const existing = prev.find((l) => l.productId === productId);
      if (existing) {
        return prev.map((l) =>
          l.productId === productId ? { ...l, qty: l.qty + 1 } : l,
        );
      }
      return [
        ...prev,
        { productId: p.id, name: p.name, qty: 1, price: p.price, cost: p.cost, discount: 0 },
      ];
    });
  }

  function setQty(productId: string, qty: number) {
    if (qty <= 0) {
      setCart((prev) => prev.filter((l) => l.productId !== productId));
      return;
    }
    setCart((prev) =>
      prev.map((l) => (l.productId === productId ? { ...l, qty } : l)),
    );
  }

  function setDiscount(productId: string, discount: number) {
    setCart((prev) =>
      prev.map((l) =>
        l.productId === productId
          ? { ...l, discount: Math.min(100, Math.max(0, discount)) }
          : l,
      ),
    );
  }

  function handleHold() {
    if (cart.length === 0) return;
    holdOrder(cart, customerId === "none" ? undefined : customerId);
    setCart([]);
    setCustomerId("none");
    toast.success(t("biz.hold"));
  }

  function handleResume(id: string) {
    const resumed = resumeHeldOrder(id);
    if (!resumed) return;
    setCart(resumed.lines);
    setCustomerId(resumed.customerId ?? "none");
    setHeldOpen(false);
  }

  function openPay() {
    if (cart.length === 0) return;
    setAmountPaid("");
    setMethod("cash");
    setPayOpen(true);
  }

  function handleConfirmPayment() {
    const paid = method === "cash" && amountPaid ? Number(amountPaid) : undefined;
    if (method === "cash" && paid !== undefined && paid < totals.total) return;
    const order = checkoutOrder({
      lines: cart,
      customerId: customerId === "none" ? undefined : customerId,
      method: method as Order["method"],
      amountPaid: paid,
    });
    setPayOpen(false);
    setCart([]);
    setCustomerId("none");
    setReceipt(order);
    toast.success(`${t("biz.saleRecorded")} · #${order.number}`);
  }

  const change =
    method === "cash" && amountPaid
      ? Math.max(0, Number(amountPaid) - totals.total)
      : 0;

  return (
    <div className="space-y-4">
      <OfflineBanner />
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">{t("nav.biz.pos")}</h1>
          <p className="text-sm text-muted-foreground">
            {t("biz.receiptNum")} {business.orderCounter + 1}
          </p>
        </div>
        <Button variant="outline" onClick={() => setHeldOpen(true)} className="gap-2 rounded-xl">
          <Pause className="size-4" />
          {t("biz.held")}
          {business.heldOrders.length > 0 && (
            <span className="rounded-full bg-primary px-1.5 text-[10px] font-bold text-primary-foreground">
              {business.heldOrders.length}
            </span>
          )}
        </Button>
      </div>

      <div className="grid gap-4 lg:grid-cols-[1fr_380px]">
        {/* Products */}
        <div className="space-y-3">
          <div className="relative">
            <ShoppingBag className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              ref={searchRef}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onKeyDown={handleSearchKey}
              placeholder={t("biz.searchOrScan")}
              className="h-11 rounded-xl pl-9"
              autoFocus
            />
          </div>
          <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3 xl:grid-cols-4">
            {filtered.map((p) => (
              <button
                key={p.id}
                onClick={() => addToCart(p.id)}
                disabled={p.stock <= 0}
                className="card-soft flex flex-col items-start gap-1 rounded-2xl border border-border/60 bg-card p-3 text-left transition-all hover:border-primary/40 hover:shadow-md disabled:opacity-40"
              >
                <span className="flex w-full items-start justify-between gap-1">
                  <span className="line-clamp-2 min-h-8 text-sm font-semibold leading-snug">
                    {p.name}
                  </span>
                  {p.stock <= p.lowStockThreshold && (
                    <span className="shrink-0 rounded-full bg-amber-500/15 px-1.5 py-0.5 text-[9px] font-bold text-amber-600 dark:text-amber-400">
                      {p.stock}
                    </span>
                  )}
                </span>
                <span className="text-sm font-bold text-primary">{money(p.price)}</span>
              </button>
            ))}
            {filtered.length === 0 && (
              <div className="col-span-full rounded-2xl border border-dashed border-border/70 p-10 text-center">
                <Package className="mx-auto mb-2 size-8 text-muted-foreground/50" />
                <p className="text-sm font-medium">{t("biz.productsEmpty")}</p>
              </div>
            )}
          </div>
        </div>

        {/* Cart */}
        <div className="card-soft flex h-fit flex-col rounded-3xl border border-border/60 bg-card lg:sticky lg:top-6">
          <div className="flex items-center justify-between border-b border-border/60 px-4 py-3">
            <h2 className="text-sm font-bold">{t("biz.cart")}</h2>
            {cart.length > 0 && (
              <Button
                variant="ghost"
                size="sm"
                className="h-7 rounded-lg px-2 text-xs text-muted-foreground"
                onClick={handleHold}
              >
                <Pause className="size-3.5" />
                {t("biz.hold")}
              </Button>
            )}
          </div>

          <div className="max-h-[38vh] space-y-2 overflow-y-auto p-3 lg:max-h-[42vh]">
            {cart.length === 0 && (
              <p className="py-10 text-center text-sm text-muted-foreground">
                {t("biz.emptyCart")}
              </p>
            )}
            {cart.map((l) => (
              <div key={l.productId} className="rounded-2xl bg-muted/50 p-2.5">
                <div className="flex items-center justify-between gap-2">
                  <p className="min-w-0 flex-1 truncate text-sm font-semibold">{l.name}</p>
                  <button
                    onClick={() => setQty(l.productId!, 0)}
                    className="text-muted-foreground hover:text-destructive"
                  >
                    <X className="size-3.5" />
                  </button>
                </div>
                <div className="mt-1.5 flex items-center justify-between gap-2">
                  <div className="flex items-center gap-1">
                    <Button
                      variant="outline"
                      size="icon"
                      className="size-6 rounded-lg"
                      onClick={() => setQty(l.productId!, l.qty - 1)}
                    >
                      <Minus className="size-3" />
                    </Button>
                    <span className="w-8 text-center text-sm font-bold">{l.qty}</span>
                    <Button
                      variant="outline"
                      size="icon"
                      className="size-6 rounded-lg"
                      onClick={() => setQty(l.productId!, l.qty + 1)}
                    >
                      <Plus className="size-3" />
                    </Button>
                  </div>
                  <div className="flex items-center gap-1 text-xs text-muted-foreground">
                    <Percent className="size-3" />
                    <input
                      type="number"
                      min="0"
                      max="100"
                      value={l.discount || ""}
                      placeholder="0"
                      onChange={(e) => setDiscount(l.productId!, Number(e.target.value) || 0)}
                      className="w-10 rounded-md bg-background px-1 py-0.5 text-center text-xs"
                    />
                    %
                  </div>
                  <span className="text-sm font-bold">{money(lineTotal(l))}</span>
                </div>
              </div>
            ))}
          </div>

          <div className="space-y-2 border-t border-border/60 px-4 py-3 text-sm">
            <div className="flex justify-between text-muted-foreground">
              <span>{t("biz.subtotal")}</span>
              <span>{money(totals.subtotal)}</span>
            </div>
            {totals.discountTotal > 0 && (
              <div className="flex justify-between text-muted-foreground">
                <span>{t("biz.discount")}</span>
                <span>−{money(totals.discountTotal)}</span>
              </div>
            )}
            {business.taxEnabled && (
              <div className="flex justify-between text-muted-foreground">
                <span>{t("biz.tax")} ({business.taxRate}%)</span>
                <span>{money(totals.taxTotal)}</span>
              </div>
            )}
            <div className="flex justify-between text-base font-bold">
              <span>{t("biz.total")}</span>
              <span className="text-primary">{money(totals.total)}</span>
            </div>

            <div className="pt-1">
              <Label className="text-xs text-muted-foreground">{t("biz.selectCustomer")}</Label>
              <Select value={customerId} onValueChange={setCustomerId}>
                <SelectTrigger className="mt-1 h-9 rounded-xl text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">{t("biz.noCustomer")}</SelectItem>
                  {business.customers.map((c) => (
                    <SelectItem key={c.id} value={c.id}>
                      {c.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <Button
              onClick={openPay}
              disabled={cart.length === 0}
              className="h-11 w-full rounded-xl text-base font-bold"
            >
              {t("biz.charge")} · {money(totals.total)}
            </Button>
          </div>
        </div>
      </div>

      {/* Payment dialog */}
      <Dialog open={payOpen} onOpenChange={setPayOpen}>
        <DialogContent className="rounded-3xl sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>{t("biz.charge")}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p className="text-center text-3xl font-bold text-primary">{money(totals.total)}</p>
            <div className="grid grid-cols-2 gap-2">
              {PAYMENT_METHODS.map((m) => {
                const Icon = METHOD_ICON[m] ?? Wallet;
                return (
                  <button
                    key={m}
                    onClick={() => setMethod(m)}
                    className={
                      "flex items-center justify-center gap-2 rounded-2xl border px-3 py-2.5 text-sm font-semibold transition-colors " +
                      (method === m
                        ? "border-primary bg-primary/10 text-primary"
                        : "border-border/70 text-muted-foreground hover:bg-accent")
                    }
                  >
                    <Icon className="size-4" />
                    {t(`pay.${m}`)}
                  </button>
                );
              })}
            </div>
            {method === "cash" && (
              <div className="space-y-1.5">
                <Label htmlFor="paid">{t("biz.amountPaid")}</Label>
                <Input
                  id="paid"
                  type="number"
                  min="0"
                  step="0.01"
                  value={amountPaid}
                  onChange={(e) => setAmountPaid(e.target.value)}
                  className="h-11 rounded-xl text-lg font-semibold"
                  inputMode="decimal"
                />
                {change > 0 && (
                  <p className="rounded-xl bg-emerald-500/10 px-3 py-2 text-sm font-semibold text-emerald-600 dark:text-emerald-400">
                    {t("biz.change")}: {money(change)}
                  </p>
                )}
              </div>
            )}
            <Button
              onClick={handleConfirmPayment}
              disabled={method === "cash" && Boolean(amountPaid) && Number(amountPaid) < totals.total}
              className="h-11 w-full rounded-xl text-base font-bold"
            >
              {t("biz.charge")} · {money(totals.total)}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Receipt dialog */}
      <Dialog open={Boolean(receipt)} onOpenChange={(v) => !v && setReceipt(null)}>
        <DialogContent className="rounded-3xl sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>{t("biz.receipt")}</DialogTitle>
          </DialogHeader>
          {receipt && (
            <div className="space-y-3 font-mono text-sm">
              <div className="text-center">
                <p className="font-sans text-base font-bold">
                  {business.shopName || "Flowday"}
                </p>
                <p className="text-xs text-muted-foreground">
                  {t("biz.receiptNum")} {receipt.number}
                </p>
              </div>
              <div className="space-y-1 border-y border-dashed border-border/60 py-2">
                {receipt.lines.map((l, i) => (
                  <div key={i} className="flex justify-between gap-2 text-xs">
                    <span className="min-w-0 flex-1 truncate">
                      {l.name} ×{l.qty}
                      {l.discount ? ` (-${l.discount}%)` : ""}
                    </span>
                    <span>{money(l.qty * l.price * (1 - l.discount / 100))}</span>
                  </div>
                ))}
              </div>
              <div className="space-y-1 text-xs">
                <div className="flex justify-between">
                  <span>{t("biz.subtotal")}</span>
                  <span>{money(receipt.subtotal)}</span>
                </div>
                {receipt.discountTotal > 0 && (
                  <div className="flex justify-between">
                    <span>{t("biz.discount")}</span>
                    <span>−{money(receipt.discountTotal)}</span>
                  </div>
                )}
                {receipt.taxTotal > 0 && (
                  <div className="flex justify-between">
                    <span>{t("biz.tax")}</span>
                    <span>{money(receipt.taxTotal)}</span>
                  </div>
                )}
                <div className="flex justify-between text-base font-bold">
                  <span>{t("biz.total")}</span>
                  <span>{money(receipt.total)}</span>
                </div>
                <div className="flex justify-between">
                  <span>{t(`pay.${receipt.method}`)}</span>
                  <span>{money(receipt.amountPaid ?? receipt.total)}</span>
                </div>
                {receipt.change !== undefined && receipt.change > 0 && (
                  <div className="flex justify-between font-bold">
                    <span>{t("biz.change")}</span>
                    <span>{money(receipt.change)}</span>
                  </div>
                )}
              </div>
              <p className="text-center font-sans text-xs font-semibold text-muted-foreground">
                {t("biz.thankYou")}
              </p>
            </div>
          )}
          <Button
            onClick={() => {
              if (receipt) window.print();
            }}
            variant="outline"
            className="w-full rounded-xl"
          >
            <Printer className="size-4" />
            {t("biz.receipt")}
          </Button>
        </DialogContent>
      </Dialog>

      {/* Held orders dialog */}
      <Dialog open={heldOpen} onOpenChange={setHeldOpen}>
        <DialogContent className="rounded-3xl sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{t("biz.held")}</DialogTitle>
          </DialogHeader>
          <div className="space-y-2">
            {business.heldOrders.length === 0 && (
              <p className="py-6 text-center text-sm text-muted-foreground">{t("biz.emptyCart")}</p>
            )}
            {business.heldOrders.map((h) => (
              <div
                key={h.id}
                className="flex items-center gap-3 rounded-2xl border border-border/60 p-3"
              >
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">
                    {h.lines.map((l) => l.name).join(", ")}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {new Date(h.createdAt).toLocaleString()} ·{" "}
                    {money(
                      h.lines.reduce((s, l) => s + l.qty * l.price * (1 - l.discount / 100), 0),
                    )}
                  </p>
                </div>
                <Button variant="outline" size="sm" className="rounded-lg" onClick={() => handleResume(h.id)}>
                  <Play className="size-3.5" />
                  {t("biz.resume")}
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="size-8 rounded-lg text-destructive"
                  onClick={() => discardHeldOrder(h.id)}
                >
                  <Trash2 className="size-3.5" />
                </Button>
              </div>
            ))}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
