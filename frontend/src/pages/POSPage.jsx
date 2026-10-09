import { useCallback, useEffect, useMemo, useState } from "react";
import { Plus, Minus, Trash2, ShoppingCart, X, Printer, CheckCircle2, Banknote, CreditCard, QrCode, Landmark, ScanBarcode, Search } from "lucide-react";
import { QRCodeSVG } from "qrcode.react";
import { cn } from "../utils/cn.js";
import { useI18n } from "../i18n/index.jsx";
import { useAuth } from "../context/AuthContext.jsx";
import { useSettings } from "../context/SettingsContext.jsx";
import { useFormat } from "../context/CurrencyContext.jsx";
import { formatRate, roundTo } from "../services/currency.js";
import { api, errorKey } from "../services/api.js";
import { PageHeader } from "../components/layout/PageHeader.jsx";
import { Button, Card, Input, Select, Field, Modal, Badge, Avatar, EmptyState, ErrorState, Skeleton, Tabs, Alert, useToast } from "../components/ui/index.js";
import { Zap, ShoppingBag, Warehouse, RotateCcw } from "lucide-react";
import KhqrPaymentModal from "../components/pos/KhqrPaymentModal.jsx";

/** POS sell modes — presentation only (no extra backend concepts). */
const SELL_MODES = [
  { key: "quick", labelKey: "pos.modes.quick", icon: Zap },
  { key: "standard", labelKey: "pos.modes.standard", icon: ShoppingBag },
  { key: "wholesale", labelKey: "pos.modes.wholesale", icon: Warehouse },
  { key: "refund", labelKey: "pos.modes.refund", icon: RotateCcw },
];

export default function POSPage() {
  const { t } = useI18n();
  const fmt = useFormat();
  const money = fmt.money;
  const { settings } = useSettings();
  const { user, can } = useAuth();
  const toast = useToast();

  const [data, setData] = useState({ products: [], categories: [], customers: [] });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("all");
  const [cart, setCart] = useState([]);
  const [mode, setMode] = useState("standard");
  const [discount, setDiscount] = useState("");
  const [customerId, setCustomerId] = useState("");
  const [cartOpen, setCartOpen] = useState(false);
  const [payOpen, setPayOpen] = useState(false);
  const [method, setMethod] = useState("cash");
  const [received, setReceived] = useState(""); // typed in the DISPLAY currency
  const [paying, setPaying] = useState(false);
  const [completed, setCompleted] = useState(null);
  const [branches, setBranches] = useState([]);
  const [selectedBranchId, setSelectedBranchId] = useState(null);
  const [khqrOpen, setKhqrOpen] = useState(false);
  const [pendingOrder, setPendingOrder] = useState(null);
  const load = useCallback(async ({ showLoading = true } = {}) => {
    if (showLoading) setLoading(true);
    setError(null);
    try {
      const [p, c, cu, br] = await Promise.all([
        api.list("products", { perPage: 500, filters: { status: "active" }, sort: { key: "name", dir: "asc" } }),
        api.list("categories", { perPage: 200, filters: { status: "active" } }),
        api.list("customers", { perPage: 500, filters: { status: "active" } }),
        api.list("branches", { perPage: 100, filters: { status: "active" } }),
      ]);
      setData({ products: p.data, categories: c.data, customers: cu.data });
      setBranches(br.data);
    } catch (e) {
      setError(e);
    } finally {
      if (showLoading) setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  // A typed amount belongs to the currency it was typed in — reset when the display currency changes.
  useEffect(() => {
    setReceived("");
  }, [money.display]);

  // Resolve branch: 1) user's assigned branch, 2) auto-select if exactly one branch, 3) leave null for selector
  useEffect(() => {
    if (user?.branch_id) {
      setSelectedBranchId(Number(user.branch_id));
    } else if (branches.length === 1) {
      setSelectedBranchId(Number(branches[0].id));
    }
  }, [user, branches]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return data.products.filter(
      (p) => (category === "all" || String(p.category_id) === String(category)) && (!q || p.name.toLowerCase().includes(q) || p.sku.toLowerCase().includes(q) || (p.barcode || "").includes(q))
    );
  }, [data.products, search, category]);

  const inCart = (id) => cart.find((c) => c.product.id === id)?.qty || 0;

  const add = (p) => {
    if (p.stock <= 0) return toast.warning(t("pos.outOfStock"));
    if (inCart(p.id) + 1 > p.stock) return toast.warning(t("pos.exceedsStock"));
    setCart((c) => {
      const ex = c.find((x) => x.product.id === p.id);
      return ex ? c.map((x) => (x.product.id === p.id ? { ...x, qty: x.qty + 1 } : x)) : [...c, { product: p, qty: 1 }];
    });
    return undefined;
  };
  const setQty = (id, qty) => {
    setCart((c) =>
      c.map((x) => {
        if (x.product.id !== id) return x;
        if (qty > x.product.stock) toast.warning(t("pos.exceedsStock"));
        return { ...x, qty: Math.max(1, Math.min(x.product.stock, qty)) };
      })
    );
  };
  const remove = (id) => setCart((c) => c.filter((x) => x.product.id !== id));

  /* All totals are computed in the BASE currency; only formatting converts. */
  const subtotal = roundTo(cart.reduce((s, x) => s + x.qty * x.product.selling_price, 0), 2);
  const discountPct = Math.min(100, Math.max(0, Number(discount) || 0));
  const discountAmt = roundTo((subtotal * discountPct) / 100, 2);
  const taxRate = Number(settings.tax_rate) || 0;
  const tax = roundTo(((subtotal - discountAmt) * taxRate) / 100, 2);
  const total = roundTo(subtotal - discountAmt + tax, 2);
  const displayTotal = money.fromBase(total);
  const receivedDisplay = Number(received) || 0;
  // Keep 4 decimals when converting a payment back to base so riel precision survives (no rounding drift)
  const receivedBase = method === "cash" ? money.toBase(receivedDisplay, { decimals: 4 }) : total;
  const insufficient = method === "cash" && receivedDisplay + 1e-9 < displayTotal;
  // Change is computed in the currency the customer paid with — exactly what the cashier hands back
  const changeDisplay = method === "cash" ? Math.max(0, roundTo(receivedDisplay - displayTotal, money.decimals)) : 0;
  const count = cart.reduce((s, x) => s + x.qty, 0);

  const onSearchKey = (e) => {
    if (e.key !== "Enter") return;
    const q = search.trim().toLowerCase();
    if (!q) return;
    const exact = data.products.find((p) => p.barcode === q || p.sku.toLowerCase() === q);
    const target = exact || (filtered.length === 1 ? filtered[0] : null);
    if (target) {
      add(target);
      setSearch("");
    }
  };

  const visibleCustomers = useMemo(() => (mode === "wholesale" ? [...data.customers].sort((a, b) => (a.type === "wholesale" ? -1 : 1) - (b.type === "wholesale" ? -1 : 1)) : data.customers), [data.customers, mode]);

  const checkout = async () => {
    if (insufficient) return toast.error(t("pos.insufficientPayment"));
    if (!selectedBranchId) return toast.error(t("pos.noBranch"));
    setPaying(true);
    try {
      const order = await api.checkout({
        items: cart.map((x) => ({ product_id: x.product.id, qty: x.qty })),
        customer_id: customerId ? Number(customerId) : null,
        discount_percent: discountPct,
        payment_method: method,
        received: method === "cash" ? receivedDisplay : (method === "khqr" ? total : receivedBase),
        currency: money.display,
        mode,
        branch_id: Number(selectedBranchId),
      });
      // For KHQR: open the payment modal to handle receipt upload + verification
      if (method === "khqr") {
        setPayOpen(false);
        setPendingOrder(order);
        setKhqrOpen(true);
        setCart([]);
        setDiscount("");
        setCustomerId("");
        setReceived("");
        load({ showLoading: false });
      } else {
        setCompleted(order);
        setPayOpen(false);
        setCartOpen(false);
        setCart([]);
        setDiscount("");
        setCustomerId("");
        setReceived("");
        toast.success(t("pos.saleCompletedHint", { number: order.number }));
        load({ showLoading: false });
      }
    } catch (err) {
      if (err.status === 422 && err.errors) {
        const firstError = Object.values(err.errors)[0];
        toast.error(Array.isArray(firstError) ? firstError[0] : err.message || t(errorKey(err)));
      } else {
        toast.error(err.message || t(errorKey(err)));
      }
    } finally {
      setPaying(false);
    }
    return undefined;
  };

  /* Quick cash amounts in the display currency (rounded up to sensible denominations). */
  const quickAmounts = useMemo(() => {
    const set = new Set([displayTotal]);
    money.quick.forEach((n) => {
      const v = Math.ceil(displayTotal / n) * n;
      if (v >= displayTotal) set.add(v);
    });
    return [...set].filter((v) => v > 0).sort((a, b) => a - b).slice(0, 5);
  }, [displayTotal, money.quick]);

  const methods = [
    { key: "cash", label: t("common.cash"), icon: Banknote },
    { key: "card", label: t("common.card"), icon: CreditCard },
    { key: "khqr", label: t("common.khqr"), icon: QrCode },
    { key: "bank_transfer", label: t("common.bankTransfer"), icon: Landmark },
  ];

  const cartContent = (inModal) => (
    <div className="flex h-full flex-col">
      <div className="flex items-center justify-between border-b border-border px-4 py-3">
        <div className="flex items-center gap-2">
          <ShoppingCart className="h-4 w-4 text-fg-muted" aria-hidden="true" />
          <h2 className="text-sm font-semibold text-fg">{t("pos.cart")}</h2>
          <Badge variant="primary">{t("pos.itemsInCart", { count })}</Badge>
        </div>
        <div className="flex items-center gap-1">
          {cart.length > 0 && (
            <Button variant="ghost" size="xs" onClick={() => setCart([])} leftIcon={Trash2} className="text-fg-muted">
              {t("pos.clearCart")}
            </Button>
          )}
          {inModal && (
            <Button variant="ghost" size="sm" icon onClick={() => setCartOpen(false)} aria-label={t("common.close")}>
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>
      </div>
      <div className={cn("min-h-0 overflow-y-auto", inModal ? "max-h-[40vh]" : "flex-1")}>
        {cart.length === 0 ? (
          <EmptyState compact icon={ShoppingCart} title={t("pos.cartEmpty")} description={t("pos.cartEmptyHint")} />
        ) : (
          <ul className="divide-y divide-border">
            {cart.map(({ product: p, qty }) => (
              <li key={p.id} className="flex items-center gap-3 px-4 py-3 animate-rise">
                <Avatar src={p.image} name={p.name} size="sm" shape="square" />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-fg">{p.name}</p>
                  <p className="text-xs text-fg-muted tabular">{fmt.currency(p.selling_price)}</p>
                </div>
                <div className="flex items-center rounded-md border border-border">
                  <button type="button" onClick={() => (qty <= 1 ? remove(p.id) : setQty(p.id, qty - 1))} className="flex h-8 w-8 items-center justify-center text-fg-secondary transition-colors hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30" aria-label="−">
                    <Minus className="h-3.5 w-3.5" />
                  </button>
                  <input
                    type="number"
                    min={1}
                    max={p.stock}
                    value={qty}
                    onChange={(e) => setQty(p.id, Number(e.target.value) || 1)}
                    className="h-8 w-10 border-x border-border bg-transparent text-center text-sm tabular focus:outline-none"
                    aria-label={t("common.quantity")}
                  />
                  <button type="button" onClick={() => add(p)} className="flex h-8 w-8 items-center justify-center text-fg-secondary transition-colors hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30" aria-label="+">
                    <Plus className="h-3.5 w-3.5" />
                  </button>
                </div>
                <p className="w-[76px] text-right text-sm font-semibold text-fg tabular">{fmt.currency(qty * p.selling_price)}</p>
              </li>
            ))}
          </ul>
        )}
      </div>
      <div className="space-y-3 border-t border-border bg-surface-muted/60 p-4">
        {branches.length > 1 && !user?.branch_id ? (
          <Select
            size="sm"
            value={selectedBranchId ? String(selectedBranchId) : ""}
            onChange={(e) => setSelectedBranchId(e.target.value ? Number(e.target.value) : null)}
            placeholder={t("pos.selectBranch")}
            options={branches.map((b) => ({ value: b.id, label: b.name }))}
            aria-label={t("pos.selectBranch")}
          />
        ) : null}
        {branches.length === 0 && (
          <Alert variant="danger">
            <p className="font-semibold">{t("pos.noBranch")}</p>
            <p className="mt-1 text-xs">{t("pos.noBranchHint")}</p>
          </Alert>
        )}
        <div className="grid grid-cols-2 gap-3">
          <Select size="sm" value={customerId} onChange={(e) => setCustomerId(e.target.value)} placeholder={t("customers.walkIn")} options={visibleCustomers.map((c) => ({ value: c.id, label: c.type === "wholesale" ? `${c.name} · ${t("common.wholesale")}` : c.name }))} aria-label={t("pos.selectCustomer")} />
          <Input size="sm" type="number" inputMode="decimal" min={0} max={100} value={discount} onChange={(e) => setDiscount(e.target.value)} placeholder={t("pos.discountPercent")} aria-label={t("pos.discountPercent")} />
        </div>
        <dl className="space-y-1.5 text-sm">
          <div className="flex justify-between">
            <dt className="text-fg-secondary">{t("common.subtotal")}</dt>
            <dd className="tabular">{fmt.currency(subtotal)}</dd>
          </div>
          {discountAmt > 0 && (
            <div className="flex justify-between">
              <dt className="text-fg-secondary">
                {t("common.discount")} ({discountPct}%)
              </dt>
              <dd className="text-success-dark tabular">−{fmt.currency(discountAmt)}</dd>
            </div>
          )}
          <div className="flex justify-between">
            <dt className="text-fg-secondary">
              {t("common.tax")} ({taxRate}%)
            </dt>
            <dd className="tabular">{fmt.currency(tax)}</dd>
          </div>
          <div className="flex justify-between border-t border-border pt-2 text-base font-semibold text-fg">
            <dt>{t("common.total")}</dt>
            <dd className="tabular">{fmt.currency(total)}</dd>
          </div>
          {money.display !== money.base && (
            <div className="flex justify-between text-xs text-fg-muted">
              <dt>{t("currency.rate", { rate: formatRate(money.rate) })}</dt>
              <dd className="tabular">{fmt.currency(total, { currency: money.base })}</dd>
            </div>
          )}
        </dl>
        <Button
          size="lg"
          fullWidth
          disabled={!cart.length || !can("sales.create") || !selectedBranchId}
          onClick={() => {
            setReceived(mode === "quick" ? String(displayTotal) : "");
            setMethod("cash");
            setPayOpen(true);
          }}
        >
          {mode === "refund" ? t("pos.refundAmount", { amount: fmt.currency(total) }) : t("pos.charge", { amount: fmt.currency(total) })}
        </Button>
      </div>
    </div>
  );

  const rc = (v) => fmt.currency(v, { rate: completed?.exchange_rate });

  return (
    <>
      <PageHeader
        title={t("pos.title")}
        description={t("pos.subtitle")}
        className="mb-4"
        actions={<Tabs variant="pills" size="sm" value={mode} onChange={setMode} tabs={SELL_MODES.map((m) => ({ key: m.key, label: t(m.labelKey), icon: m.icon }))} aria-label={t("pos.sellMode")} />}
      />
      {mode !== "standard" && (
        <Alert variant={mode === "refund" ? "warning" : "info"} className="mb-4">
          {t(`pos.modeHints.${mode}`)}
        </Alert>
      )}

      <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_380px] xl:grid-cols-[minmax(0,1fr)_420px]">
        <div className="min-w-0 space-y-4">
          <Card className="space-y-3 p-3 sm:p-4">
            <Input
              type="search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onKeyDown={onSearchKey}
              placeholder={t("pos.searchPlaceholder")}
              leftIcon={search ? Search : ScanBarcode}
              size="lg"
              autoFocus
              aria-label={t("common.search")}
              className="[&::-webkit-search-cancel-button]:hidden"
              rightElement={
                search ? (
                  <Button variant="ghost" size="xs" icon onClick={() => setSearch("")} aria-label={t("common.clear")}>
                    <X className="h-4 w-4" />
                  </Button>
                ) : null
              }
            />
            <Tabs variant="pills" size="sm" value={category} onChange={setCategory} tabs={[{ key: "all", label: t("common.all") }, ...data.categories.map((c) => ({ key: String(c.id), label: c.name }))]} />
          </Card>

          {error ? (
            <Card>
              <ErrorState onRetry={load} />
            </Card>
          ) : loading ? (
            <div className="grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
              {[...Array(8)].map((_, i) => (
                <Skeleton key={i} className="aspect-4/5 w-full rounded-lg" />
              ))}
            </div>
          ) : filtered.length === 0 ? (
            <Card>
              <EmptyState title={t("pos.noProducts")} description={t("common.noResultsHint")} />
            </Card>
          ) : (
            <div className="grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
              {filtered.map((p, index) => {
                const q = inCart(p.id);
                const out = p.stock <= 0;
                const low = !out && p.stock <= p.reorder_level;
                return (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => add(p)}
                    disabled={out}
                    aria-label={`${p.name} — ${fmt.currency(p.selling_price)}`}
                    style={{ "--i": Math.min(index, 16) }}
                    className={cn(
                      "group row-enter card-hover flex flex-col overflow-hidden rounded-lg border bg-surface text-left shadow-xs focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30 active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-60",
                      q > 0 ? "border-primary-300 ring-1 ring-primary-200" : "border-border hover:border-primary-300 hover:shadow"
                    )}
                  >
                    <div className="relative aspect-4/3 w-full overflow-hidden bg-muted">
                      <Avatar src={p.image} name={p.name} size="xl" shape="square" className="h-full w-full rounded-none text-2xl" />
                      {q > 0 && <span className="absolute right-2 top-2 rounded-full bg-primary px-2 py-0.5 text-xs font-semibold text-white shadow-sm tabular">{q}</span>}
                      {out && <span className="absolute inset-0 flex items-center justify-center bg-surface/80 text-xs font-semibold text-danger">{t("pos.outOfStock")}</span>}
                    </div>
                    <div className="flex flex-1 flex-col p-3">
                      <p className="line-clamp-2 text-sm font-medium leading-snug text-fg">{p.name}</p>
                      <div className="mt-auto flex items-end justify-between gap-2 pt-2">
                        <span className="text-sm font-semibold text-accent tabular">{fmt.currency(p.selling_price)}</span>
                        <span className={cn("text-xs tabular", low ? "font-medium text-warning-dark" : "text-fg-muted")}>{low ? t("pos.onlyLeft", { count: p.stock }) : `${p.stock} ${p.unit}`}</span>
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        <div className="hidden lg:block">
          <Card className="sticky top-20 flex h-[calc(100dvh-6.5rem)] flex-col overflow-hidden">{cartContent(false)}</Card>
        </div>
      </div>

      {/* Mobile cart bar */}
      <div className="h-20 lg:hidden" aria-hidden="true" />
      <div className="fixed inset-x-0 bottom-0 z-20 border-t border-border bg-surface/95 p-3 backdrop-blur lg:hidden">
        <Button fullWidth size="lg" onClick={() => setCartOpen(true)} leftIcon={ShoppingCart} disabled={!cart.length}>
          {t("pos.cart")} ({count}) · {fmt.currency(total)}
        </Button>
      </div>
      <Modal open={cartOpen} onClose={() => setCartOpen(false)} hideHeader bodyClassName="p-0" size="md">
        {cartContent(true)}
      </Modal>

      {/* Payment */}
      <Modal
        open={payOpen}
        onClose={() => !paying && setPayOpen(false)}
        title={t("pos.payment")}
        size="sm"
        footer={
          <>
            <Button variant="outline" onClick={() => setPayOpen(false)} disabled={paying} className="w-full sm:w-auto">
              {t("common.cancel")}
            </Button>
            <Button onClick={checkout} loading={paying} leftIcon={CheckCircle2} className="w-full sm:w-auto">
              {t("pos.completeSale")}
            </Button>
          </>
        }
      >
        <div className="space-y-5">
          <div className="rounded-lg bg-primary-50 p-4 text-center">
            <p className="text-xs font-medium uppercase tracking-wide text-primary-700">{t("common.total")}</p>
            <p className="mt-1 text-3xl font-semibold text-primary-700 tabular">{fmt.currency(total)}</p>
            {money.display !== money.base && <p className="mt-1 text-xs text-fg-muted tabular">{fmt.currency(total, { currency: money.base })} · {t("currency.rate", { rate: formatRate(money.rate) })}</p>}
          </div>
          <div>
            <p className="mb-2 text-sm font-medium text-fg">{t("common.paymentMethod")}</p>
            <div className="grid grid-cols-2 gap-2" role="radiogroup">
              {methods.map((m) => (
                <button
                  key={m.key}
                  type="button"
                  role="radio"
                  aria-checked={method === m.key}
                  onClick={() => setMethod(m.key)}
                  className={cn(
                    "flex items-center gap-2 rounded-md border px-3 py-2.5 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30",
                    method === m.key ? "border-primary bg-primary-50 text-primary-700" : "border-border text-fg-secondary hover:bg-surface-hover"
                  )}
                >
                  <m.icon className="h-4 w-4" aria-hidden="true" />
                  {m.label}
                </button>
              ))}
            </div>
          </div>
          {method === "cash" && (
            <Field label={`${t("pos.received")} (${money.display})`} htmlFor="received">
              <Input id="received" type="number" inputMode="decimal" min={0} step={money.step} addonLeft={money.symbol} value={received} onChange={(e) => setReceived(e.target.value)} size="lg" data-autofocus className="text-lg tabular" />
              <div className="mt-2 flex flex-wrap gap-2">
                {quickAmounts.map((v) => (
                  <Button key={v} variant="outline" size="xs" onClick={() => setReceived(String(v))} className="tabular">
                    {money.formatDisplay(v)}
                  </Button>
                ))}
              </div>
            </Field>
          )}
          {method === "qr" && (
            <div className="flex flex-col items-center gap-4 rounded-lg border border-border bg-surface-muted p-6">
              <QRCodeSVG
                value={`Business: ${settings.business_name || "Angkor Mart"}\nAmount: ${fmt.currency(total)}\nReference: POS-${Date.now().toString().slice(-6)}\nDate: ${new Date().toLocaleDateString()}`}
                size={180}
                level="M"
                includeMargin={true}
                bgColor="#ffffff"
                fgColor="#000000"
              />
              <div className="text-center">
                <p className="text-sm font-medium text-fg">{t("pos.scanToPay")}</p>
                <p className="text-2xl font-bold text-primary tabular">{fmt.currency(total)}</p>
                <p className="text-xs text-fg-muted">{settings.business_name || "Angkor Mart"}</p>
              </div>
              <div className="w-full space-y-2 text-sm">
                <div className="flex justify-between rounded-md bg-surface px-3 py-2">
                  <span className="text-fg-secondary">{t("common.amount")}</span>
                  <span className="font-semibold tabular">{fmt.currency(total)}</span>
                </div>
                <div className="flex justify-between rounded-md bg-surface px-3 py-2">
                  <span className="text-fg-secondary">{t("common.reference")}</span>
                  <span className="font-mono text-xs">POS-{Date.now().toString().slice(-6)}</span>
                </div>
              </div>
            </div>
          )}
          {method === "khqr" && (
            <div className="rounded-lg border border-border bg-surface-muted p-4 text-center">
              <QrCode className="mx-auto h-8 w-8 text-primary" />
              <p className="mt-2 text-sm font-medium text-fg">{t("khqr.posHint")}</p>
              <p className="text-xs text-fg-muted">{t("khqr.posHintSub")}</p>
            </div>
          )}
          <div className="flex items-center justify-between rounded-md border border-border px-3 py-2 text-sm">
            <span className="text-fg-secondary">{t("pos.changeDue")}</span>
            <span className={cn("font-semibold tabular", insufficient ? "text-danger" : "text-success-dark")}>{money.formatDisplay(changeDisplay)}</span>
          </div>
        </div>
      </Modal>

      {/* Receipt */}
      <Modal
        open={!!completed}
        onClose={() => setCompleted(null)}
        hideHeader
        size="sm"
        footer={
          <>
            <Button variant="outline" leftIcon={Printer} onClick={() => window.print()} className="w-full sm:w-auto">
              {t("pos.printReceipt")}
            </Button>
            <Button onClick={() => setCompleted(null)} leftIcon={Plus} className="w-full sm:w-auto">
              {t("pos.newSale")}
            </Button>
          </>
        }
      >
        {completed && (
          <div id="print-area" className="text-sm">
            <div className="text-center">
              <CheckCircle2 className="mx-auto h-10 w-10 text-success no-print" aria-hidden="true" />
              <h2 className="mt-2 text-lg font-semibold text-fg">{t("pos.saleCompleted")}</h2>
              <p className="text-fg-muted">
                {completed.number} · {fmt.dateTime(completed.created_at)}
              </p>
            </div>
            <div className="mt-4 border-y border-dashed border-border py-3 text-center">
              {settings.business_logo && <img src={settings.business_logo} alt="" className="mx-auto mb-2 h-12 w-12 rounded-lg object-contain" />}
              <p className="font-semibold text-fg">{settings.business_name}</p>
              {settings.business_subtitle && <p className="text-xs text-fg-muted">{settings.business_subtitle}</p>}
              <p className="text-xs text-fg-muted">{settings.business_address}</p>
              <p className="text-xs text-fg-muted">
                {t("pos.cashier")}: {completed.user_name} · {completed.customer_name || t("customers.walkIn")}
              </p>
              {completed.currency && completed.currency !== money.base && <p className="text-xs text-fg-muted">{t("pos.paidIn", { currency: completed.currency, rate: formatRate(completed.exchange_rate) })}</p>}
            </div>
            <table className="mt-3 w-full">
              <tbody>
                {completed.items.map((i) => (
                  <tr key={i.product_id}>
                    <td className="py-1 pr-2">
                      {i.name} <span className="text-fg-muted tabular">× {i.qty}</span>
                    </td>
                    <td className="py-1 text-right tabular">{rc(i.qty * i.price)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            <dl className="mt-3 space-y-1 border-t border-dashed border-border pt-3">
              {[
                [t("common.subtotal"), completed.subtotal],
                [t("common.discount"), -completed.discount],
                [t("common.tax"), completed.tax],
              ]
                .filter(([, v]) => Math.abs(v) > 0)
                .map(([l, v]) => (
                  <div key={l} className="flex justify-between text-fg-secondary">
                    <dt>{l}</dt>
                    <dd className="tabular">{rc(v)}</dd>
                  </div>
                ))}
              <div className="flex justify-between text-base font-semibold text-fg">
                <dt>{t("common.total")}</dt>
                <dd className="tabular">{rc(completed.total)}</dd>
              </div>
              <div className="flex justify-between text-fg-secondary">
                <dt>{t("pos.received")}</dt>
                <dd className="tabular">{rc(completed.received ?? completed.total)}</dd>
              </div>
              <div className="flex justify-between text-fg-secondary">
                <dt>{t("pos.changeDue")}</dt>
                <dd className="tabular">{rc(completed.change ?? 0)}</dd>
              </div>
            </dl>
            <p className="mt-4 text-center text-xs text-fg-muted">{settings.receipt_footer || t("pos.thankYou")}</p>
          </div>
        )}
      </Modal>

      {/* KHQR Payment Modal */}
      <KhqrPaymentModal
        open={khqrOpen}
        onClose={() => { setKhqrOpen(false); setPendingOrder(null); }}
        order={pendingOrder}
        onPaid={() => {
          setKhqrOpen(false);
          setPendingOrder(null);
          load({ showLoading: false });
        }}
      />
    </>
  );
}
