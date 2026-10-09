import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";
import { Plus, ArrowRight, PackageCheck, Banknote, CreditCard, QrCode, Landmark, Settings2, LayoutDashboard, RefreshCw } from "lucide-react";
import { useI18n } from "../i18n/index.jsx";
import { useAuth } from "../context/AuthContext.jsx";
import { useFormat } from "../context/CurrencyContext.jsx";
import { api } from "../services/api.js";
import { useAsync } from "../hooks/index.js";
import { useDashboardLayout } from "../hooks/useDashboardLayout.js";
import { DASHBOARD_CARDS, CARD_ICONS } from "../config/dashboardCards.js";
import { PageHeader } from "../components/layout/PageHeader.jsx";
import { StatusBadge } from "../components/data-display/StatusBadge.jsx";
import { ChartTooltip, useAxisLabel, useChart } from "../components/data-display/charts.jsx";
import { KpiGrid } from "../components/dashboard/KpiGrid.jsx";
import { DashboardCustomizer } from "../components/dashboard/DashboardCustomizer.jsx";
import { StaggerGroup } from "../components/ui/Motion.jsx";
import { Button, Card, CardHeader, CardContent, Skeleton, ErrorState, EmptyState, Avatar, DateRangePicker } from "../components/ui/index.js";
import { cn } from "../utils/cn.js";

function ListSkeleton({ rows = 4 }) {
  return (
    <div className="space-y-3 p-5">
      {[...Array(rows)].map((_, i) => (
        <Skeleton key={i} className="h-9 w-full" />
      ))}
    </div>
  );
}

export default function DashboardPage() {
  const { t } = useI18n();
  const fmt = useFormat();
  const { user, can } = useAuth();
  const navigate = useNavigate();
  const axisLabel = useAxisLabel();
  const chart = useChart();
  const [range, setRange] = useState({ key: "last30" });
  const { data, loading, error, reload } = useAsync(() => api.dashboard({ range: range.key, from: range.from, to: range.to }), [range.key, range.from, range.to]);
  const { layout, setColumns, setVisible, move, moveBy, setStyle, setWidth, resetStyle, reset } = useDashboardLayout(user?.id);
  const [customizer, setCustomizer] = useState({ open: false, card: null });
  const openCustomizer = (card = null) => setCustomizer({ open: true, card });

  const hour = new Date().getHours();
  const period = hour < 12 ? "morning" : hour < 18 ? "afternoon" : "evening";
  const PAYMENT = {
    cash: { label: t("common.cash"), icon: Banknote },
    card: { label: t("common.card"), icon: CreditCard },
    qr: { label: t("common.qr"), icon: QrCode },
    bank_transfer: { label: t("common.bankTransfer"), icon: Landmark },
  };
  const categoryTotal = data?.byCategory.reduce((s, c) => s + c.value, 0) || 0;
  const paymentTotal = data?.byPayment.reduce((s, p) => s + p.value, 0) || 0;
  const pct = (v, total) => (total ? Math.round((v / total) * 100) : 0);

  /* Resolve card registry + live KPI data + user appearance into StatCard props */
  const allCards = useMemo(
    () =>
      DASHBOARD_CARDS.map((def) => {
        const k = data?.kpis?.[def.kpi];
        const style = layout.styles[def.id] || {};
        const base = {
          id: def.id,
          label: t(def.labelKey),
          icon: CARD_ICONS[style.icon] || CARD_ICONS[def.icon],
          defaultIcon: def.icon,
          tone: def.tone,
          appearance: style,
          value: def.kind === "currency" ? fmt.currency(k?.value) : fmt.number(k?.value),
          rawValue: k?.value ?? 0,
          formatValue: def.kind === "currency" ? (v) => fmt.currency(v) : (v) => fmt.number(Math.round(v)),
        };
        if (def.id === "inventoryValue") return { ...base, hint: `${t("dashboard.itemsSold")}: ${fmt.number(data?.kpis?.itemsSold?.value)}` };
        if (def.id === "lowStock") {
          return { ...base, tone: k?.value ? "warning" : "success", hint: t("dashboard.lowStockHint"), onClick: can(def.permission) ? () => navigate(def.link) : undefined };
        }
        return { ...base, change: k?.change };
      }),
    [data, layout.styles, t, fmt, can, navigate]
  );
  const byId = useMemo(() => Object.fromEntries(allCards.map((c) => [c.id, c])), [allCards]);
  const visibleCards = layout.order.filter((id) => !layout.hidden.includes(id)).map((id) => byId[id] && { ...byId[id], span: layout.widths?.[id] || 1 }).filter(Boolean);

  const header = (
    <PageHeader
      title={t("dashboard.greeting", { period: t(`dashboard.${period}`), name: user?.name?.split(" ")[0] })}
      description={t("dashboard.subtitle")}
      actions={
        <>
          <DateRangePicker value={range} onChange={setRange} size="md" />
          <Button variant="outline" icon onClick={reload} loading={loading} aria-label={t("common.refresh")} title={t("common.refresh")}>
            <RefreshCw className="h-4 w-4" />
          </Button>
          <Button variant="outline" leftIcon={Settings2} onClick={() => openCustomizer()} aria-label={t("dashboard.customize")}>
            <span className="hidden sm:inline">{t("dashboard.customize")}</span>
          </Button>
          {can("sales.create") && (
            <Button leftIcon={Plus} onClick={() => navigate("/sales")}>
              {t("dashboard.newSale")}
            </Button>
          )}
        </>
      }
    />
  );

  if (error) {
    return (
      <>
        {header}
        <Card>
          <ErrorState onRetry={reload} />
        </Card>
      </>
    );
  }

  return (
    <>
      {header}

      {/* KPI cards — customizable grid (drag, hide, design) */}
      {visibleCards.length === 0 ? (
        <Card>
          <EmptyState
            compact
            icon={LayoutDashboard}
            title={t("dashboard.allHidden")}
            description={t("dashboard.allHiddenHint")}
            action={
              <Button variant="outline" leftIcon={Settings2} onClick={() => openCustomizer()}>
                {t("dashboard.customize")}
              </Button>
            }
          />
        </Card>
      ) : (
        <KpiGrid cards={visibleCards} columns={layout.columns} loading={loading} onMove={move} onMoveBy={(id, d) => moveBy(id, d, true)} onHide={(id) => setVisible(id, false)} onDesign={(id) => openCustomizer(id)} />
      )}



      {/* Revenue trend + Sales by category */}
      <StaggerGroup className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader title={t("dashboard.revenueOverview")} description={t("dashboard.revenueOverviewHint")} />
          <CardContent className="h-[320px] p-2 pr-4 pt-4">
            {loading ? (
              <Skeleton className="h-full w-full" />
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={data.series} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
                  <defs>
                    <linearGradient id="rev" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor={chart.primary} stopOpacity={0.25} />
                      <stop offset="100%" stopColor={chart.primary} stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={chart.grid} />
                  <XAxis dataKey="date" {...chart.axis} tickFormatter={axisLabel} minTickGap={24} />
                  <YAxis {...chart.axis} width={64} tickFormatter={(v) => fmt.currency(v, { compact: true })} />
                  <Tooltip content={<ChartTooltip format={{ revenue: "currency" }} labelFormatter={axisLabel} nameMap={{ revenue: t("dashboard.revenue"), orders: t("dashboard.orders") }} />} />
                  <Area type="monotone" dataKey="revenue" stroke={chart.primary} strokeWidth={2} fill="url(#rev)" />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader title={t("dashboard.salesByCategory")} />
          <CardContent>
            {loading ? (
              <Skeleton className="h-[280px] w-full" />
            ) : data.byCategory.length === 0 ? (
              <EmptyState compact title={t("common.noData")} />
            ) : (
              <div className="flex flex-col items-center">
                <div className="relative h-[184px] w-[184px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie data={data.byCategory} dataKey="value" nameKey="name" innerRadius={60} outerRadius={88} paddingAngle={2} stroke="none">
                        {data.byCategory.map((_, i) => (
                          <Cell key={i} fill={chart.palette[i % chart.palette.length]} />
                        ))}
                      </Pie>
                      <Tooltip content={<ChartTooltip format={{ value: "currency" }} />} />
                    </PieChart>
                  </ResponsiveContainer>
                  <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
                    <span className="text-[11px] uppercase tracking-wide text-fg-muted">{t("common.total")}</span>
                    <span className="text-base font-semibold text-fg tabular">{fmt.currency(categoryTotal, { compact: true })}</span>
                  </div>
                </div>
                <ul className="mt-4 w-full space-y-2">
                  {data.byCategory.slice(0, 6).map((c, i) => (
                    <li key={c.name} className="flex items-center gap-2 text-sm">
                      <span className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ background: chart.palette[i % chart.palette.length] }} aria-hidden="true" />
                      <span className="flex-1 truncate text-fg-secondary">{c.name}</span>
                      <span className="font-medium text-fg tabular">{fmt.currency(c.value)}</span>
                      <span className="w-10 text-right text-xs text-fg-muted tabular">{pct(c.value, categoryTotal)}%</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </CardContent>
        </Card>
      </StaggerGroup>

      {/* Recent orders + Low stock */}
      <StaggerGroup className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader
            title={t("dashboard.recentOrders")}
            action={
              can("orders.view") && (
                <Button variant="ghost" size="sm" rightIcon={ArrowRight} onClick={() => navigate("/orders")}>
                  {t("common.viewAll")}
                </Button>
              )
            }
          />
          {loading ? (
            <ListSkeleton rows={6} />
          ) : data.recentOrders.length === 0 ? (
            <EmptyState compact title={t("orders.empty")} description={t("orders.emptyHint")} />
          ) : (
            <ul className="divide-y divide-border">
              {data.recentOrders.map((o) => (
                <li key={o.id} className="flex items-center gap-4 px-5 py-3">
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-fg">
                      {o.number} <span className="font-normal text-fg-muted">· {o.customer_name || t("customers.walkIn")}</span>
                    </p>
                    <p className="text-xs text-fg-muted">
                      {fmt.relative(o.created_at)} · {o.items_count} {t("common.items").toLowerCase()}
                    </p>
                  </div>
                  <div className="hidden sm:block">
                    <StatusBadge status={o.status} />
                  </div>
                  <p className="w-28 text-right text-sm font-semibold text-fg tabular">{fmt.currency(o.total, { rate: o.exchange_rate })}</p>
                </li>
              ))}
            </ul>
          )}
        </Card>

        <Card>
          <CardHeader title={t("dashboard.lowStockAlerts")} description={t("dashboard.lowStockHint")} />
          {loading ? (
            <ListSkeleton />
          ) : data.lowStockProducts.length === 0 ? (
            <EmptyState compact icon={PackageCheck} title={t("dashboard.noLowStock")} />
          ) : (
            <ul className="divide-y divide-border">
              {data.lowStockProducts.map((p) => (
                <li key={p.id} className="flex items-center gap-3 px-5 py-2.5">
                  <Avatar src={p.image} name={p.name} size="sm" shape="square" />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-fg">{p.name}</p>
                    <p className="text-xs text-fg-muted">{t("dashboard.reorderAt", { count: p.reorder_level })}</p>
                  </div>
                  <span className={cn("text-sm font-semibold tabular", p.stock <= 0 ? "text-danger" : "text-warning-dark")}>{t("dashboard.unitsLeft", { count: p.stock })}</span>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </StaggerGroup>

      {/* Top products + Payment methods */}
      <StaggerGroup className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader title={t("dashboard.topProducts")} />
          {loading ? (
            <ListSkeleton rows={5} />
          ) : data.topProducts.length === 0 ? (
            <EmptyState compact title={t("common.noData")} />
          ) : (
            <ul className="divide-y divide-border">
              {data.topProducts.map((p, i) => (
                <li key={p.id} className="flex items-center gap-3 px-5 py-2.5">
                  <span className="w-4 text-xs font-semibold text-fg-muted tabular">{i + 1}</span>
                  <Avatar src={p.image} name={p.name} size="sm" shape="square" />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-fg">{p.name}</p>
                    <p className="text-xs text-fg-muted">
                      {fmt.number(p.qty)} {t("dashboard.itemsSold").toLowerCase()}
                    </p>
                  </div>
                  <span className="text-sm font-semibold text-fg tabular">{fmt.currency(p.revenue)}</span>
                </li>
              ))}
            </ul>
          )}
        </Card>

        <Card>
          <CardHeader title={t("dashboard.paymentMethods")} action={!loading && <span className="text-sm font-semibold text-fg tabular">{fmt.currency(paymentTotal)}</span>} />
          {loading ? (
            <ListSkeleton />
          ) : data.byPayment.length === 0 ? (
            <EmptyState compact title={t("common.noData")} />
          ) : (
            <CardContent className="space-y-4">
              {data.byPayment.map((p, i) => {
                const meta = PAYMENT[p.name] || { label: p.name, icon: Banknote };
                const Icon = meta.icon;
                const share = pct(p.value, paymentTotal);
                return (
                  <div key={p.name}>
                    <div className="flex items-center gap-3 text-sm">
                      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-muted text-fg-secondary" aria-hidden="true">
                        <Icon className="h-4 w-4" />
                      </span>
                      <span className="flex-1 truncate font-medium text-fg">{meta.label}</span>
                      <span className="font-semibold text-fg tabular">{fmt.currency(p.value)}</span>
                      <span className="w-10 text-right text-xs text-fg-muted tabular">{share}%</span>
                    </div>
                    <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-muted-strong" role="progressbar" aria-label={meta.label} aria-valuenow={share} aria-valuemin={0} aria-valuemax={100}>
                      <div className="h-full rounded-full transition-[width]" style={{ width: `${share}%`, background: chart.palette[i % chart.palette.length] }} />
                    </div>
                  </div>
                );
              })}
            </CardContent>
          )}
        </Card>
      </StaggerGroup>

      <DashboardCustomizer
        open={customizer.open}
        initialCard={customizer.card}
        onClose={() => setCustomizer({ open: false, card: null })}
        layout={layout}
        actions={{ setColumns, setVisible, move, moveBy, setStyle, setWidth, resetStyle, reset }}
        cards={allCards}
      />
    </>
  );
}
