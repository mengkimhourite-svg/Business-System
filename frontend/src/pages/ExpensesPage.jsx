import { useMemo, useState } from "react";
import { Receipt, Wallet, Clock, PieChart } from "lucide-react";
import { useI18n } from "../i18n/index.jsx";
import { useAuth } from "../context/AuthContext.jsx";
import { useFormat } from "../context/CurrencyContext.jsx";
import { api } from "../services/api.js";
import { useAsync } from "../hooks/index.js";
import { toInputDate } from "../utils/format.js";
import { ResourcePage } from "../components/data-display/ResourcePage.jsx";
import { StatCard } from "../components/data-display/StatCard.jsx";
import { StatusBadge } from "../components/data-display/StatusBadge.jsx";
import { Badge } from "../components/ui/index.js";
import { PAYMENT_LABEL } from "./OrdersPage.jsx";

export const EXPENSE_CATEGORIES = ["rent", "utilities", "salaries", "marketing", "transport", "supplies", "maintenance", "other"];

export default function ExpensesPage() {
  const { t } = useI18n();
  const fmt = useFormat();
  const { user } = useAuth();
  const [tick, setTick] = useState(0);
  const stats = useAsync(() => api.reports({ range: "thisMonth" }).then((r) => r.expenses), [tick]);
  const s = stats.data;

  const config = useMemo(
    () => ({
      resource: "expenses",
      itemKey: "expenses.item",
      titleKey: "expenses.title",
      descriptionKey: "expenses.subtitle",
      addLabelKey: "expenses.add",
      emptyTitleKey: "expenses.empty",
      emptyHintKey: "expenses.emptyHint",
      icon: Receipt,
      columns: [
        { key: "id", labelKey: "common.id", sortable: true, render: (r) => <span className="font-mono text-xs text-fg-secondary">{r.id}</span> },
        {
          key: "reference",
          labelKey: "common.reference",
          primary: true,
          sortable: true,
          render: (r, { fmt: f }) => (
            <div>
              <p className="font-medium text-fg">{r.reference}</p>
              <p className="text-xs text-fg-muted">{f.date(r.date)}</p>
            </div>
          ),
        },
        { key: "category", labelKey: "common.category", sortable: true, align: "center", render: (r) => <Badge variant="neutral">{t(`expenses.cat.${r.category}`)}</Badge> },
        { key: "note", labelKey: "common.note", hideOnMobile: true, render: (r) => <span className="line-clamp-1 max-w-[260px] text-fg-secondary">{r.note || "—"}</span> },
        { key: "amount", labelKey: "common.amount", sortable: true, align: "right", render: (r, { fmt: f }) => <span className="font-semibold tabular">{f.currency(r.amount, { rate: r.exchange_rate })}</span> },
        { key: "payment_method", labelKey: "common.paymentMethod", hideOnMobile: true, render: (r) => t(PAYMENT_LABEL[r.payment_method] || "common.cash") },
        { key: "user_name", labelKey: "expenses.paidBy", hideOnMobile: true },
        { key: "status", labelKey: "common.status", sortable: true, align: "center", render: (r) => <StatusBadge status={r.status} /> },
      ],
      filters: [
        { key: "category", labelKey: "common.category", options: EXPENSE_CATEGORIES.map((c) => ({ value: c, labelKey: `expenses.cat.${c}` })) },
        {
          key: "status",
          labelKey: "common.status",
          options: [
            { value: "approved", labelKey: "status.approved" },
            { value: "pending", labelKey: "status.pending" },
            { value: "rejected", labelKey: "status.rejected" },
          ],
        },
        { key: "from", labelKey: "common.from", type: "date" },
        { key: "to", labelKey: "common.to", type: "date" },
      ],
      form: {
        defaults: { status: "approved", payment_method: "cash", date: toInputDate(new Date()), category: "" },
        toPayload: (payload, mode, row, { money }) => ({
          ...payload,
          date: new Date(payload.date).toISOString(),
          ...(mode === "create" ? { reference: `EXP-${String(Date.now()).slice(-6)}`, user_id: user?.id, currency: money.display, exchange_rate: money.rate } : {}),
        }),
        sections: [
          {
            fields: [
              { name: "category", labelKey: "expenses.categoryLabel", type: "select", required: true, options: EXPENSE_CATEGORIES.map((c) => ({ value: c, labelKey: `expenses.cat.${c}` })) },
              { name: "amount", labelKey: "common.amount", type: "money", required: true, min: 0.01 },
              { name: "date", labelKey: "common.date", type: "date", required: true },
              {
                name: "payment_method",
                labelKey: "common.paymentMethod",
                type: "select",
                required: true,
                options: [
                  { value: "cash", labelKey: "common.cash" },
                  { value: "bank_transfer", labelKey: "common.bankTransfer" },
                  { value: "card", labelKey: "common.card" },
                ],
              },
              {
                name: "status",
                labelKey: "common.status",
                type: "select",
                required: true,
                options: [
                  { value: "approved", labelKey: "status.approved" },
                  { value: "pending", labelKey: "status.pending" },
                  { value: "rejected", labelKey: "status.rejected" },
                ],
              },
              { name: "note", labelKey: "common.note", type: "textarea", col: 2 },
            ],
          },
        ],
      },
    }),
    [t, user?.id]
  );

  return (
    <ResourcePage config={config} onDataChange={() => setTick((x) => x + 1)}>
      <div className="stagger mb-4 grid grid-cols-1 gap-4 sm:grid-cols-3">
        <StatCard loading={stats.loading} label={`${t("expenses.total")} · ${t("expenses.thisMonth")}`} value={fmt.currency(s?.total)} icon={Wallet} tone="danger" />
        <StatCard loading={stats.loading} label={`${t("common.items")} · ${t("expenses.thisMonth")}`} value={fmt.number(s?.count)} icon={Clock} tone="neutral" />
        <StatCard loading={stats.loading} label={t("reports.expensesByCategory")} value={s?.byCategory?.[0] ? t(`expenses.cat.${s.byCategory[0].name}`) : "—"} icon={PieChart} tone="info" hint={s?.byCategory?.[0] ? fmt.currency(s.byCategory[0].value) : undefined} />
      </div>
    </ResourcePage>
  );
}
