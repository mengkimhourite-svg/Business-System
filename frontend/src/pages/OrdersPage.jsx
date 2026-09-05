import { useMemo, useState } from "react";
import { ClipboardList, CheckCircle2, BadgeDollarSign, Ban } from "lucide-react";
import { useI18n } from "../i18n/index.jsx";
import { formatRate } from "../services/currency.js";
import { useAuth } from "../context/AuthContext.jsx";
import { api, errorKey } from "../services/api.js";
import { ResourcePage, DetailList } from "../components/data-display/ResourcePage.jsx";
import { StatusBadge } from "../components/data-display/StatusBadge.jsx";
import { ConfirmDialog, useToast } from "../components/ui/index.js";

export const PAYMENT_LABEL = { cash: "common.cash", card: "common.card", bank_transfer: "common.bankTransfer", qr: "common.qr" };

export function OrderDetails({ order, t, fmt }) {
  // Historical amounts always use the exchange rate captured at the time of sale
  const c = (v) => fmt.currency(v, { rate: order.exchange_rate });
  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h3 className="text-lg font-semibold text-fg">{order.number}</h3>
          <p className="text-sm text-fg-muted">{fmt.dateTime(order.created_at)}</p>
        </div>
        <div className="flex gap-2">
          <StatusBadge status={order.status} size="md" />
          <StatusBadge status={order.payment_status} size="md" />
        </div>
      </div>
      <DetailList
        items={[
          { label: t("common.customer"), value: order.customer_name || t("customers.walkIn") },
          { label: t("orders.soldBy"), value: order.user_name },
          { label: t("common.branch"), value: order.branch_name },
          { label: t("common.paymentMethod"), value: t(PAYMENT_LABEL[order.payment_method] || "common.cash") },
          { label: t("orders.currency"), value: order.currency || "USD" },
          { label: t("orders.exchangeRate"), value: order.exchange_rate ? t("currency.rate", { rate: formatRate(order.exchange_rate) }) : null },
        ]}
      />
      <div className="overflow-hidden rounded-lg border border-border">
        <table className="w-full text-sm">
          <thead className="bg-surface-muted text-xs uppercase tracking-wide text-fg-secondary">
            <tr>
              <th className="px-3 py-2 text-left font-semibold">{t("common.product")}</th>
              <th className="px-3 py-2 text-right font-semibold">{t("common.quantity")}</th>
              <th className="hidden px-3 py-2 text-right font-semibold sm:table-cell">{t("common.price")}</th>
              <th className="px-3 py-2 text-right font-semibold">{t("common.total")}</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {order.items.map((i) => (
              <tr key={i.product_id}>
                <td className="px-3 py-2">
                  <p className="font-medium text-fg">{i.name}</p>
                  <p className="font-mono text-xs text-fg-muted">{i.sku}</p>
                </td>
                <td className="px-3 py-2 text-right tabular">{i.qty}</td>
                <td className="hidden px-3 py-2 text-right tabular sm:table-cell">{c(i.price)}</td>
                <td className="px-3 py-2 text-right font-medium tabular">{c(i.qty * i.price)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <dl className="ml-auto max-w-xs space-y-1.5 text-sm">
        <div className="flex justify-between">
          <dt className="text-fg-secondary">{t("common.subtotal")}</dt>
          <dd className="tabular">{c(order.subtotal)}</dd>
        </div>
        {order.discount > 0 && (
          <div className="flex justify-between">
            <dt className="text-fg-secondary">{t("common.discount")}</dt>
            <dd className="text-success-dark tabular">−{c(order.discount)}</dd>
          </div>
        )}
        <div className="flex justify-between">
          <dt className="text-fg-secondary">{t("common.tax")}</dt>
          <dd className="tabular">{c(order.tax)}</dd>
        </div>
        <div className="flex justify-between border-t border-border pt-2 text-base font-semibold text-fg">
          <dt>{t("common.total")}</dt>
          <dd className="tabular">{c(order.total)}</dd>
        </div>
      </dl>
    </div>
  );
}

export default function OrdersPage() {
  const { t } = useI18n();
  const { can } = useAuth();
  const toast = useToast();
  const [refresh, setRefresh] = useState(0);
  const [cancelTarget, setCancelTarget] = useState(null);
  const [busy, setBusy] = useState(false);

  const update = async (row, payload) => {
    try {
      await api.updateOrder(row.id, payload);
      toast.success(t("orders.statusUpdated"));
      setRefresh((x) => x + 1);
    } catch (err) {
      toast.error(t(errorKey(err)));
    }
  };

  const config = useMemo(
    () => ({
      resource: "orders",
      itemKey: "orders.item",
      titleKey: "orders.title",
      descriptionKey: "orders.subtitle",
      emptyTitleKey: "orders.empty",
      emptyHintKey: "orders.emptyHint",
      icon: ClipboardList,
      viewSize: "lg",
      canDelete: can("orders.delete"),
      columns: [
        {
          key: "number",
          labelKey: "orders.number",
          primary: true,
          sortable: true,
          render: (r, { fmt }) => (
            <div>
              <p className="font-medium text-fg">{r.number}</p>
              <p className="text-xs text-fg-muted">{fmt.dateTime(r.created_at)}</p>
            </div>
          ),
        },
        { key: "customer_name", labelKey: "common.customer", render: (r) => r.customer_name || <span className="text-fg-muted">{t("customers.walkIn")}</span> },
        { key: "items_count", labelKey: "common.items", align: "right", hideOnMobile: true, render: (r) => <span className="tabular">{r.items_count}</span> },
        { key: "total", labelKey: "common.total", sortable: true, align: "right", render: (r, { fmt }) => <span className="font-semibold tabular">{fmt.currency(r.total, { rate: r.exchange_rate })}</span> },
        { key: "payment_method", labelKey: "common.paymentMethod", hideOnMobile: true, render: (r) => t(PAYMENT_LABEL[r.payment_method] || "common.cash") },
        { key: "payment_status", labelKey: "common.paymentStatus", align: "center", render: (r) => <StatusBadge status={r.payment_status} /> },
        { key: "status", labelKey: "common.status", sortable: true, align: "center", render: (r) => <StatusBadge status={r.status} /> },
        { key: "user_name", labelKey: "orders.soldBy", hideOnMobile: true },
      ],
      filters: [
        {
          key: "status",
          labelKey: "common.status",
          options: [
            { value: "completed", labelKey: "status.completed" },
            { value: "pending", labelKey: "status.pending" },
            { value: "cancelled", labelKey: "status.cancelled" },
          ],
        },
        {
          key: "payment_status",
          labelKey: "common.paymentStatus",
          options: [
            { value: "paid", labelKey: "status.paid" },
            { value: "unpaid", labelKey: "status.unpaid" },
            { value: "partial", labelKey: "status.partial" },
            { value: "refunded", labelKey: "status.refunded" },
          ],
        },
        { key: "from", labelKey: "common.from", type: "date" },
        { key: "to", labelKey: "common.to", type: "date" },
      ],
      rowActions: (row) => [
        row.status === "pending" && { key: "complete", labelKey: "orders.markCompleted", icon: CheckCircle2, permission: "orders.update", onClick: () => update(row, { status: "completed", payment_status: "paid" }) },
        row.payment_status !== "paid" && row.status !== "cancelled" && { key: "paid", labelKey: "orders.markPaid", icon: BadgeDollarSign, permission: "orders.update", onClick: () => update(row, { payment_status: "paid" }) },
        row.status !== "cancelled" && { key: "cancel", labelKey: "orders.cancelOrder", icon: Ban, danger: true, permission: "orders.update", onClick: () => setCancelTarget(row) },
      ],
      view: (row, { t: tt, fmt }) => <OrderDetails order={row} t={tt} fmt={fmt} />,
    }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [can, t]
  );

  return (
    <>
      <ResourcePage config={config} refreshKey={refresh} />
      <ConfirmDialog
        open={!!cancelTarget}
        onClose={() => !busy && setCancelTarget(null)}
        loading={busy}
        title={t("orders.cancelOrder")}
        description={t("orders.cancelConfirm")}
        confirmLabel={t("orders.cancelOrder")}
        onConfirm={async () => {
          setBusy(true);
          await update(cancelTarget, { status: "cancelled" });
          setBusy(false);
          setCancelTarget(null);
        }}
      />
    </>
  );
}
