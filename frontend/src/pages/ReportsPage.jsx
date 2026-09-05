import { useState } from "react";
import { BarChart, Bar, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from "recharts";
import { Download, DollarSign, ShoppingCart, Boxes, Receipt, TrendingUp, Percent, Wallet, PackageX } from "lucide-react";
import { useI18n } from "../i18n/index.jsx";
import { useAuth } from "../context/AuthContext.jsx";
import { useFormat } from "../context/CurrencyContext.jsx";
import { api } from "../services/api.js";
import { useAsync } from "../hooks/index.js";
import { downloadCsv } from "../utils/format.js";
import { PageHeader } from "../components/layout/PageHeader.jsx";
import { StatCard } from "../components/data-display/StatCard.jsx";
import { StatusBadge } from "../components/data-display/StatusBadge.jsx";
import { ChartTooltip, useAxisLabel, useChart } from "../components/data-display/charts.jsx";
import { Button, Card, CardHeader, CardContent, Tabs, Skeleton, ErrorState, EmptyState, DateRangePicker, useToast } from "../components/ui/index.js";

function SimpleTable({ columns, rows, emptyTitle }) {
  if (!rows?.length) return <EmptyState compact title={emptyTitle} />;
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-border bg-surface-muted text-xs uppercase tracking-wide text-fg-secondary">
            {columns.map((c) => (
              <th key={c.key} className={`whitespace-nowrap px-4 py-2 font-semibold ${c.align === "right" ? "text-right" : c.align === "center" ? "text-center" : "text-left"}`}>
                {c.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-border">
          {rows.map((r, i) => (
            <tr key={r.id ?? i} className="hover:bg-surface-hover">
              {columns.map((c) => (
                <td key={c.key} className={`px-4 py-2.5 align-middle ${c.align === "right" ? "text-right tabular" : c.align === "center" ? "text-center" : ""} ${c.className || ""}`}>
                  {c.render ? c.render(r, i) : r[c.key]}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default function ReportsPage() {
  const { t } = useI18n();
  const fmt = useFormat();
  const { can } = useAuth();
  const toast = useToast();
  const axisLabel = useAxisLabel();
  const chart = useChart();
  const [tab, setTab] = useState("sales");
  const [range, setRange] = useState({ key: "last30" });
  const { data, loading, error, reload } = useAsync(() => api.reports({ range: range.key, from: range.from, to: range.to }), [range.key, range.from, range.to]);

  const exportCsv = () => {
    if (!data) return;
    // Export in the active display currency (converted once from base values)
    const m = fmt.money;
    const cur = m.display;
    const map = {
      sales: data.sales.series.map((s) => ({ date: s.date, revenue: m.fromBase(s.revenue), orders: s.orders, currency: cur })),
      profit: data.profit.series.map((s) => ({ date: s.date, revenue: m.fromBase(s.revenue), cogs: m.fromBase(s.cogs), profit: m.fromBase(s.profit), currency: cur })),
      inventory: data.inventory.byCategory.map((c) => ({ category: c.name, units: c.units, value: m.fromBase(c.value), currency: cur })),
      expenses: data.expenses.list.map((e) => ({ reference: e.reference, date: e.date, category: e.category, amount: m.fromBase(e.amount, { rate: e.exchange_rate }), currency: cur, status: e.status })),
    };
    downloadCsv(`report-${tab}-${range.key}.csv`, map[tab]);
    toast.success(t("reports.exported"));
  };

  const chartCard = (title, description, children, className = "") => (
    <Card className={className}>
      <CardHeader title={title} description={description} />
      <CardContent className="h-[300px] p-2 pr-4 pt-4">{loading ? <Skeleton className="h-full w-full" /> : children}</CardContent>
    </Card>
  );

  const s = data?.sales;
  const p = data?.profit;
  const inv = data?.inventory;
  const ex = data?.expenses;

  return (
    <>
      <PageHeader
        title={t("reports.title")}
        description={t("reports.subtitle")}
        actions={
          <>
            <DateRangePicker value={range} onChange={setRange} size="md" />
            {can("reports.export") && (
              <Button variant="outline" leftIcon={Download} onClick={exportCsv} disabled={!data}>
                {t("common.exportCsv")}
              </Button>
            )}
          </>
        }
      />
      <Tabs
        className="mb-4"
        value={tab}
        onChange={setTab}
        tabs={[
          { key: "sales", label: t("reports.sales"), icon: ShoppingCart },
          { key: "profit", label: t("reports.profit"), icon: TrendingUp },
          { key: "inventory", label: t("reports.inventory"), icon: Boxes },
          { key: "expenses", label: t("reports.expensesTab"), icon: Receipt },
        ]}
      />

      {error ? (
        <Card>
          <ErrorState onRetry={reload} />
        </Card>
      ) : tab === "sales" ? (
        <div className="space-y-4">
          <div className="stagger grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <StatCard loading={loading} label={t("reports.revenue")} value={fmt.currency(s?.revenue)} icon={DollarSign} />
            <StatCard loading={loading} label={t("reports.orders")} value={fmt.number(s?.orders)} icon={ShoppingCart} tone="info" />
            <StatCard loading={loading} label={t("reports.unitsSold")} value={fmt.number(s?.unitsSold)} icon={Boxes} tone="success" />
            <StatCard loading={loading} label={t("dashboard.avgOrder")} value={fmt.currency(s?.avgOrder)} icon={Receipt} tone="neutral" />
          </div>
          {chartCard(
            t("reports.salesTrend"),
            t("reports.dailySales"),
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={s?.series} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={chart.grid} />
                <XAxis dataKey="date" {...chart.axis} tickFormatter={axisLabel} minTickGap={24} />
                <YAxis {...chart.axis} width={56} tickFormatter={(v) => fmt.currency(v, { compact: true })} />
                <Tooltip cursor={{ fill: chart.cursor }} content={<ChartTooltip format={{ revenue: "currency" }} labelFormatter={axisLabel} nameMap={{ revenue: t("reports.revenue"), orders: t("reports.orders") }} />} />
                <Bar dataKey="revenue" fill={chart.primary} radius={[4, 4, 0, 0]} maxBarSize={40} />
              </BarChart>
            </ResponsiveContainer>
          )}
          <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
            <Card>
              <CardHeader title={t("reports.topProducts")} />
              {loading ? (
                <Skeleton className="m-5 h-48" />
              ) : (
                <SimpleTable
                  emptyTitle={t("common.noData")}
                  rows={s.topProducts}
                  columns={[
                    {
                      key: "name",
                      header: t("common.product"),
                      render: (r) => (
                        <div>
                          <p className="font-medium text-fg">{r.name}</p>
                          <p className="font-mono text-xs text-fg-muted">{r.sku}</p>
                        </div>
                      ),
                    },
                    { key: "qty", header: t("reports.unitsSold"), align: "right", render: (r) => fmt.number(r.qty) },
                    { key: "revenue", header: t("reports.revenue"), align: "right", className: "font-medium", render: (r) => fmt.currency(r.revenue) },
                    { key: "profit", header: t("dashboard.profit"), align: "right", render: (r) => <span className="text-success-dark">{fmt.currency(r.profit)}</span> },
                  ]}
                />
              )}
            </Card>
            <Card>
              <CardHeader title={t("reports.topCustomers")} />
              {loading ? (
                <Skeleton className="m-5 h-48" />
              ) : (
                <SimpleTable
                  emptyTitle={t("common.noData")}
                  rows={s.topCustomers}
                  columns={[
                    { key: "name", header: t("common.customer"), className: "font-medium text-fg" },
                    { key: "orders", header: t("reports.orders"), align: "right" },
                    { key: "revenue", header: t("reports.revenue"), align: "right", className: "font-medium", render: (r) => fmt.currency(r.revenue) },
                  ]}
                />
              )}
            </Card>
          </div>
        </div>
      ) : tab === "profit" ? (
        <div className="space-y-4">
          <div className="stagger grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <StatCard loading={loading} label={t("reports.revenue")} value={fmt.currency(p?.revenue)} icon={DollarSign} />
            <StatCard loading={loading} label={t("reports.cogs")} value={fmt.currency(p?.cogs)} icon={Boxes} tone="neutral" />
            <StatCard loading={loading} label={t("reports.grossProfit")} value={fmt.currency(p?.grossProfit)} icon={TrendingUp} tone="success" />
            <StatCard loading={loading} label={t("reports.totalExpenses")} value={fmt.currency(p?.expenses)} icon={Wallet} tone="danger" />
            <StatCard loading={loading} label={t("reports.netProfit")} value={fmt.currency(p?.netProfit)} icon={DollarSign} tone={p?.netProfit >= 0 ? "success" : "danger"} />
            <StatCard loading={loading} label={t("reports.margin")} value={fmt.percent(p?.margin)} icon={Percent} tone="info" />
          </div>
          {chartCard(
            t("reports.profitTrend"),
            undefined,
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={p?.series} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="g-rev" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor={chart.primary} stopOpacity={0.2} />
                    <stop offset="100%" stopColor={chart.primary} stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="g-profit" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor={chart.success} stopOpacity={0.25} />
                    <stop offset="100%" stopColor={chart.success} stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={chart.grid} />
                <XAxis dataKey="date" {...chart.axis} tickFormatter={axisLabel} minTickGap={24} />
                <YAxis {...chart.axis} width={56} tickFormatter={(v) => fmt.currency(v, { compact: true })} />
                <Tooltip content={<ChartTooltip format={{ revenue: "currency", profit: "currency", cogs: "currency" }} labelFormatter={axisLabel} nameMap={{ revenue: t("reports.revenue"), profit: t("dashboard.profit"), cogs: t("reports.cogs") }} />} />
                <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 12 }} formatter={(v) => ({ revenue: t("reports.revenue"), profit: t("dashboard.profit") })[v] || v} />
                <Area type="monotone" dataKey="revenue" stroke={chart.primary} strokeWidth={2} fill="url(#g-rev)" />
                <Area type="monotone" dataKey="profit" stroke={chart.success} strokeWidth={2} fill="url(#g-profit)" />
              </AreaChart>
            </ResponsiveContainer>
          )}
        </div>
      ) : tab === "inventory" ? (
        <div className="space-y-4">
          <div className="stagger grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <StatCard loading={loading} label={t("inventory.stockValue")} value={fmt.currency(inv?.stockValue)} icon={DollarSign} hint={inv ? `${t("products.sellingPrice")}: ${fmt.currency(inv.retailValue)}` : undefined} />
            <StatCard loading={loading} label={t("inventory.totalUnits")} value={fmt.number(inv?.totalUnits)} icon={Boxes} tone="info" />
            <StatCard loading={loading} label={t("dashboard.lowStock")} value={fmt.number(inv?.lowStock)} icon={TrendingUp} tone="warning" />
            <StatCard loading={loading} label={t("inventory.outOfStockCount")} value={fmt.number(inv?.outOfStock)} icon={PackageX} tone="danger" />
          </div>
          <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
            {chartCard(
              t("reports.stockByCategory"),
              undefined,
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={inv?.byCategory} layout="vertical" margin={{ top: 4, right: 16, left: 8, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke={chart.grid} />
                  <XAxis type="number" {...chart.axis} tickFormatter={(v) => fmt.currency(v, { compact: true })} />
                  <YAxis type="category" dataKey="name" {...chart.axis} width={96} />
                  <Tooltip cursor={{ fill: chart.cursor }} content={<ChartTooltip format={{ value: "currency" }} nameMap={{ value: t("inventory.stockValue") }} />} />
                  <Bar dataKey="value" fill={chart.primary} radius={[0, 4, 4, 0]} maxBarSize={22} />
                </BarChart>
              </ResponsiveContainer>
            )}
            <Card>
              <CardHeader title={t("reports.stockByCategory")} />
              {loading ? (
                <Skeleton className="m-5 h-48" />
              ) : (
                <SimpleTable
                  emptyTitle={t("common.noData")}
                  rows={inv.byCategory}
                  columns={[
                    { key: "name", header: t("common.category"), className: "font-medium text-fg" },
                    { key: "units", header: t("inventory.totalUnits"), align: "right", render: (r) => fmt.number(r.units) },
                    { key: "value", header: t("inventory.stockValue"), align: "right", className: "font-medium", render: (r) => fmt.currency(r.value) },
                  ]}
                />
              )}
            </Card>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="stagger grid grid-cols-1 gap-4 sm:grid-cols-2">
            <StatCard loading={loading} label={t("reports.totalExpenses")} value={fmt.currency(ex?.total)} icon={Wallet} tone="danger" />
            <StatCard loading={loading} label={t("common.items")} value={fmt.number(ex?.count)} icon={Receipt} tone="neutral" />
          </div>
          <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
            <Card>
              <CardHeader title={t("reports.expensesByCategory")} />
              <CardContent>
                {loading ? (
                  <Skeleton className="h-[240px] w-full" />
                ) : ex.byCategory.length === 0 ? (
                  <EmptyState compact title={t("common.noData")} />
                ) : (
                  <div className="flex flex-col items-center gap-4 sm:flex-row">
                    <div className="h-[200px] w-[200px] shrink-0">
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie data={ex.byCategory} dataKey="value" nameKey="name" innerRadius={56} outerRadius={90} paddingAngle={2} stroke="none">
                            {ex.byCategory.map((_, i) => (
                              <Cell key={i} fill={chart.palette[i % chart.palette.length]} />
                            ))}
                          </Pie>
                          <Tooltip content={<ChartTooltip format={{ value: "currency" }} nameMap={Object.fromEntries(ex.byCategory.map((c) => [c.name, t(`expenses.cat.${c.name}`)]))} />} />
                        </PieChart>
                      </ResponsiveContainer>
                    </div>
                    <ul className="w-full space-y-2">
                      {ex.byCategory.map((c, i) => (
                        <li key={c.name} className="flex items-center gap-2 text-sm">
                          <span className="h-2.5 w-2.5 rounded-full" style={{ background: chart.palette[i % chart.palette.length] }} aria-hidden="true" />
                          <span className="flex-1 text-fg-secondary">{t(`expenses.cat.${c.name}`)}</span>
                          <span className="font-medium tabular">{fmt.currency(c.value)}</span>
                          <span className="w-10 text-right text-xs text-fg-muted tabular">{ex.total ? Math.round((c.value / ex.total) * 100) : 0}%</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </CardContent>
            </Card>
            <Card>
              <CardHeader title={t("expenses.title")} />
              {loading ? (
                <Skeleton className="m-5 h-48" />
              ) : (
                <SimpleTable
                  emptyTitle={t("expenses.empty")}
                  rows={ex.list}
                  columns={[
                    {
                      key: "reference",
                      header: t("common.reference"),
                      render: (r) => (
                        <div>
                          <p className="font-medium text-fg">{r.reference}</p>
                          <p className="text-xs text-fg-muted">{fmt.date(r.date)}</p>
                        </div>
                      ),
                    },
                    { key: "category", header: t("common.category"), render: (r) => t(`expenses.cat.${r.category}`) },
                    { key: "amount", header: t("common.amount"), align: "right", className: "font-medium", render: (r) => fmt.currency(r.amount) },
                    { key: "status", header: t("common.status"), align: "center", render: (r) => <StatusBadge status={r.status} /> },
                  ]}
                />
              )}
            </Card>
          </div>
        </div>
      )}
    </>
  );
}
