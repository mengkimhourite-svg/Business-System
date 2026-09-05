import { useMemo, useState } from "react";
import { ShoppingBag, PackageCheck, Plus, Trash2 } from "lucide-react";
import { useI18n } from "../i18n/index.jsx";
import { useAuth } from "../context/AuthContext.jsx";
import { useFormat } from "../context/CurrencyContext.jsx";
import { api, errorKey } from "../services/api.js";
import { toInputDate } from "../utils/format.js";
import { formatRate } from "../services/currency.js";
import { ResourcePage, DetailList, useLookups } from "../components/data-display/ResourcePage.jsx";
import { StatusBadge } from "../components/data-display/StatusBadge.jsx";
import { Button, Modal, Field, Select, Input, Textarea, Alert, useToast } from "../components/ui/index.js";

function PurchaseFormModal({ open, onClose, onSaved }) {
  const { t } = useI18n();
  const fmt = useFormat();
  const money = fmt.money;
  const toast = useToast();
  const lookups = useLookups(open ? ["suppliers", "products"] : []);
  const [supplierId, setSupplierId] = useState("");
  const [expected, setExpected] = useState(toInputDate(new Date(Date.now() + 5 * 86400000)));
  const [paymentStatus, setPaymentStatus] = useState("unpaid");
  const [note, setNote] = useState("");
  const [items, setItems] = useState([{ product_id: "", qty: 1, cost: "" }]);
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState(null);

  const products = lookups.products || [];
  const suppliers = (lookups.suppliers || []).filter((s) => s.status === "active");
  // Unit costs are typed in the display currency; totals are computed in the base currency
  const lineBase = (i) => (Number(i.qty) || 0) * money.toBase(i.cost);
  const total = items.reduce((s, i) => s + lineBase(i), 0);

  const setItem = (idx, patch) => setItems((list) => list.map((it, i) => (i === idx ? { ...it, ...patch } : it)));
  const pickProduct = (idx, id) => {
    const p = products.find((x) => String(x.id) === String(id));
    setItem(idx, { product_id: id, cost: p ? money.fromBase(p.cost_price) : "" });
  };

  const reset = () => {
    setSupplierId("");
    setItems([{ product_id: "", qty: 1, cost: "" }]);
    setNote("");
    setErrors({});
    setFormError(null);
  };

  const submit = async (e) => {
    e.preventDefault();
    const errs = {};
    if (!supplierId) errs.supplier = t("validation.required");
    const valid = items.filter((i) => i.product_id && Number(i.qty) > 0);
    if (!valid.length) errs.items = t("purchases.needItems");
    setErrors(errs);
    if (Object.keys(errs).length) return;
    setSaving(true);
    setFormError(null);
    try {
      const created = await api.createPurchase({ supplier_id: supplierId, items: valid.map((i) => ({ ...i, cost: money.toBase(i.cost) })), expected_at: expected, payment_status: paymentStatus, note, currency: money.display, exchange_rate: money.rate });
      toast.success(t("common.created", { item: t("purchases.item") }));
      reset();
      onSaved(created);
      onClose();
    } catch (err) {
      setFormError(t(errorKey(err)));
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal
      open={open}
      onClose={saving ? undefined : onClose}
      title={t("purchases.add")}
      size="xl"
      footer={
        <>
          <Button variant="outline" onClick={onClose} disabled={saving} className="w-full sm:w-auto">
            {t("common.cancel")}
          </Button>
          <Button type="submit" form="purchase-form" loading={saving} className="w-full sm:w-auto">
            {t("common.save")}
          </Button>
        </>
      }
    >
      <form id="purchase-form" onSubmit={submit} noValidate className="space-y-6">
        {formError && <Alert variant="danger">{formError}</Alert>}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <Field label={t("common.supplier")} htmlFor="po-supplier" required error={errors.supplier}>
            <Select id="po-supplier" value={supplierId} onChange={(e) => setSupplierId(e.target.value)} placeholder={t("form.selectPlaceholder")} options={suppliers.map((s) => ({ value: s.id, label: s.name }))} error={!!errors.supplier} />
          </Field>
          <Field label={t("purchases.expected")} htmlFor="po-expected">
            <Input id="po-expected" type="date" value={expected} onChange={(e) => setExpected(e.target.value)} />
          </Field>
          <Field label={t("common.paymentStatus")} htmlFor="po-pay">
            <Select
              id="po-pay"
              value={paymentStatus}
              onChange={(e) => setPaymentStatus(e.target.value)}
              options={[
                { value: "unpaid", label: t("status.unpaid") },
                { value: "partial", label: t("status.partial") },
                { value: "paid", label: t("status.paid") },
              ]}
            />
          </Field>
        </div>

        <fieldset>
          <legend className="mb-3 text-sm font-semibold text-fg">{t("common.items")}</legend>
          {errors.items && <Alert variant="danger" className="mb-3">{errors.items}</Alert>}
          <div className="space-y-3">
            {items.map((it, idx) => {
              const line = lineBase(it);
              return (
                <div key={idx} className="grid grid-cols-[1fr_auto] gap-2 rounded-lg border border-border p-3 sm:grid-cols-[minmax(0,1fr)_90px_120px_110px_36px] sm:items-end sm:border-0 sm:p-0">
                  <Field label={t("common.product")} htmlFor={`po-p-${idx}`} className="col-span-2 sm:col-span-1" inline={idx > 0 ? "sm" : false}>
                    <Select id={`po-p-${idx}`} value={it.product_id} onChange={(e) => pickProduct(idx, e.target.value)} placeholder={t("purchases.selectProduct")} options={products.map((p) => ({ value: p.id, label: `${p.name} (${p.sku})` }))} />
                  </Field>
                  <Field label={t("common.quantity")} htmlFor={`po-q-${idx}`} inline={idx > 0 ? "sm" : false}>
                    <Input id={`po-q-${idx}`} type="number" min={1} step={1} value={it.qty} onChange={(e) => setItem(idx, { qty: e.target.value })} />
                  </Field>
                  <Field label={`${t("purchases.unitCost")} (${money.display})`} htmlFor={`po-c-${idx}`} inline={idx > 0 ? "sm" : false}>
                    <Input id={`po-c-${idx}`} type="number" min={0} step={money.step} addonLeft={money.symbol} value={it.cost} onChange={(e) => setItem(idx, { cost: e.target.value })} className="tabular" />
                  </Field>
                  <div className="flex items-center justify-between sm:block">
                    <span className="text-xs text-fg-muted sm:hidden">{t("purchases.lineTotal")}</span>
                    {idx === 0 && <span className="mb-1.5 hidden text-sm font-medium text-fg sm:block">{t("purchases.lineTotal")}</span>}
                    <p className="flex h-9 items-center justify-end text-sm font-medium tabular sm:justify-start">{fmt.currency(line)}</p>
                  </div>
                  <Button variant="ghost" size="sm" icon onClick={() => setItems((l) => (l.length > 1 ? l.filter((_, i) => i !== idx) : l))} aria-label={t("common.delete")} className="justify-self-end text-fg-muted hover:text-danger" disabled={items.length === 1}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              );
            })}
          </div>
          <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
            <Button variant="outline" size="sm" leftIcon={Plus} onClick={() => setItems((l) => [...l, { product_id: "", qty: 1, cost: "" }])}>
              {t("purchases.addItem")}
            </Button>
            <p className="text-sm text-fg-secondary">
              {t("common.total")}: <span className="text-base font-semibold text-fg tabular">{fmt.currency(total)}</span>
            </p>
          </div>
        </fieldset>

        <Field label={t("common.note")} htmlFor="po-note">
          <Textarea id="po-note" rows={2} value={note} onChange={(e) => setNote(e.target.value)} />
        </Field>
      </form>
    </Modal>
  );
}

export default function PurchasesPage() {
  const { t } = useI18n();
  const { can } = useAuth();
  const toast = useToast();
  const [refresh, setRefresh] = useState(0);
  const [createOpen, setCreateOpen] = useState(false);
  const [revealId, setRevealId] = useState(null);

  const receive = async (row) => {
    try {
      await api.receivePurchase(row.id);
      toast.success(t("purchases.receivedHint"));
      setRefresh((x) => x + 1);
    } catch (err) {
      toast.error(t(errorKey(err)));
    }
  };

  const config = useMemo(
    () => ({
      resource: "purchases",
      itemKey: "purchases.item",
      titleKey: "purchases.title",
      descriptionKey: "purchases.subtitle",
      emptyTitleKey: "purchases.empty",
      emptyHintKey: "purchases.emptyHint",
      icon: ShoppingBag,
      viewSize: "lg",
      canDelete: can("purchases.delete"),
      columns: [
        {
          key: "number",
          labelKey: "purchases.number",
          primary: true,
          sortable: true,
          render: (r, { fmt }) => (
            <div>
              <p className="font-medium text-fg">{r.number}</p>
              <p className="text-xs text-fg-muted">{fmt.date(r.created_at)}</p>
            </div>
          ),
        },
        { key: "supplier_name", labelKey: "common.supplier", sortable: true },
        { key: "items_count", labelKey: "common.items", align: "right", hideOnMobile: true, render: (r) => <span className="tabular">{r.items_count}</span> },
        { key: "total", labelKey: "common.total", sortable: true, align: "right", render: (r, { fmt }) => <span className="font-semibold tabular">{fmt.currency(r.total, { rate: r.exchange_rate })}</span> },
        { key: "expected_at", labelKey: "purchases.expected", sortable: true, hideOnMobile: true, render: (r, { fmt }) => fmt.date(r.expected_at) },
        { key: "payment_status", labelKey: "common.paymentStatus", align: "center", render: (r) => <StatusBadge status={r.payment_status} /> },
        { key: "status", labelKey: "common.status", sortable: true, align: "center", render: (r) => <StatusBadge status={r.status} /> },
      ],
      filters: [
        {
          key: "status",
          labelKey: "common.status",
          options: [
            { value: "ordered", labelKey: "status.ordered" },
            { value: "received", labelKey: "status.received" },
            { value: "cancelled", labelKey: "status.cancelled" },
          ],
        },
        { key: "from", labelKey: "common.from", type: "date" },
        { key: "to", labelKey: "common.to", type: "date" },
      ],
      rowActions: (row) => [row.status === "ordered" && { key: "receive", labelKey: "purchases.markReceived", icon: PackageCheck, permission: "purchases.update", onClick: () => receive(row) }],
      view: (row, { t: tt, fmt }) => {
        // Historical amounts use the exchange rate captured when the purchase was recorded
        const c = (v) => fmt.currency(v, { rate: row.exchange_rate });
        return (
        <div className="space-y-5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h3 className="text-lg font-semibold text-fg">{row.number}</h3>
              <p className="text-sm text-fg-muted">{row.supplier_name}</p>
            </div>
            <div className="flex gap-2">
              <StatusBadge status={row.status} size="md" />
              <StatusBadge status={row.payment_status} size="md" />
            </div>
          </div>
          <DetailList
            items={[
              { label: tt("common.createdAt"), value: fmt.date(row.created_at) },
              { label: tt("purchases.expected"), value: fmt.date(row.expected_at) },
              { label: tt("status.received"), value: row.received_at ? fmt.date(row.received_at) : null },
              { label: tt("common.note"), value: row.note },
              { label: tt("orders.currency"), value: row.currency || "USD" },
              { label: tt("orders.exchangeRate"), value: row.exchange_rate ? tt("currency.rate", { rate: formatRate(row.exchange_rate) }) : null },
            ]}
          />
          <div className="overflow-hidden rounded-lg border border-border">
            <table className="w-full text-sm">
              <thead className="bg-surface-muted text-xs uppercase tracking-wide text-fg-secondary">
                <tr>
                  <th className="px-3 py-2 text-left font-semibold">{tt("common.product")}</th>
                  <th className="px-3 py-2 text-right font-semibold">{tt("common.quantity")}</th>
                  <th className="hidden px-3 py-2 text-right font-semibold sm:table-cell">{tt("purchases.unitCost")}</th>
                  <th className="px-3 py-2 text-right font-semibold">{tt("common.total")}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {row.items.map((i) => (
                  <tr key={i.product_id}>
                    <td className="px-3 py-2">
                      <p className="font-medium text-fg">{i.name}</p>
                      <p className="font-mono text-xs text-fg-muted">{i.sku}</p>
                    </td>
                    <td className="px-3 py-2 text-right tabular">{i.qty}</td>
                    <td className="hidden px-3 py-2 text-right tabular sm:table-cell">{c(i.cost)}</td>
                    <td className="px-3 py-2 text-right font-medium tabular">{c(i.qty * i.cost)}</td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="border-t border-border bg-surface-muted">
                  <td colSpan={3} className="px-3 py-2 text-right font-semibold text-fg">
                    {tt("common.total")}
                  </td>
                  <td className="px-3 py-2 text-right font-semibold text-fg tabular">{c(row.total)}</td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>
        );
      },
    }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [can, t]
  );

  return (
    <>
      <ResourcePage
        config={config}
        refreshKey={refresh}
        revealId={revealId}
        headerActions={
          can("purchases.create") && (
            <Button leftIcon={Plus} onClick={() => setCreateOpen(true)}>
              {t("purchases.add")}
            </Button>
          )
        }
      />
      <PurchaseFormModal open={createOpen} onClose={() => setCreateOpen(false)} onSaved={(created) => (created?.id ? setRevealId(created.id) : setRefresh((x) => x + 1))} />
    </>
  );
}
