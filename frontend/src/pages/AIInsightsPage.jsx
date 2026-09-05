import { useNavigate } from "react-router-dom";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { Sparkles, RefreshCw, Boxes, TrendingUp, Users, Wallet, Rocket, ArrowRight, Lightbulb } from "lucide-react";
import { cn } from "../utils/cn.js";
import { useI18n } from "../i18n/index.jsx";
import { useFormat } from "../context/CurrencyContext.jsx";
import { api } from "../services/api.js";
import { useAsync } from "../hooks/index.js";
import { PageHeader } from "../components/layout/PageHeader.jsx";
import { ChartTooltip, useAxisLabel, useChart } from "../components/data-display/charts.jsx";
import { Button, Card, CardHeader, CardContent, Badge, Skeleton, ErrorState, EmptyState } from "../components/ui/index.js";

const TYPE = {
  stock: { icon: Boxes, cls: "bg-warning-light text-warning-dark" },
  sales: { icon: TrendingUp, cls: "bg-primary-50 text-accent" },
  customers: { icon: Users, cls: "bg-info-light text-info-dark" },
  finance: { icon: Wallet, cls: "bg-success-light text-success-dark" },
  growth: { icon: Rocket, cls: "bg-primary-50 text-accent" },
};
const IMPACT = { high: "danger", medium: "warning", low: "neutral" };

export default function AIInsightsPage() {
  const { t } = useI18n();
  const fmt = useFormat();
  const navigate = useNavigate();
  const axisLabel = useAxisLabel();
  const chart = useChart();
  const { data, loading, error, reload } = useAsync(() => api.insights(), []);

  const params = (ins) => {
    const out = { ...ins.params };
    (ins.currency || []).forEach((k) => (out[k] = fmt.currency(out[k])));
    if (ins.categoryParam) out[ins.categoryParam] = t(`expenses.cat.${out[ins.categoryParam]}`);
    return out;
  };

  const forecastTotal = data?.forecast?.reduce((s, d) => s + d.value, 0) || 0;

  return (
    <>
      <PageHeader
        title={t("ai.title")}
        description={t("ai.subtitle")}
        actions={
          <Button variant="outline" leftIcon={RefreshCw} onClick={reload} loading={loading}>
            {t("ai.regenerate")}
          </Button>
        }
      />

      {error ? (
        <Card>
          <ErrorState onRetry={reload} />
        </Card>
      ) : (
        <div className="space-y-4">
          <Card>
            <CardHeader
              title={t("ai.forecastTitle")}
              description={t("ai.forecastHint")}
              action={!loading && <p className="text-xl font-semibold text-fg tabular">{fmt.currency(forecastTotal)}</p>}
            />
            <CardContent className="h-[240px] p-2 pr-4 pt-4">
              {loading ? (
                <Skeleton className="h-full w-full" />
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={data.forecast} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
                    <defs>
                      <linearGradient id="fc" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor={chart.info} stopOpacity={0.25} />
                        <stop offset="100%" stopColor={chart.info} stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={chart.grid} />
                    <XAxis dataKey="date" {...chart.axis} tickFormatter={axisLabel} />
                    <YAxis {...chart.axis} width={56} tickFormatter={(v) => fmt.currency(v, { compact: true })} />
                    <Tooltip content={<ChartTooltip format={{ value: "currency" }} labelFormatter={axisLabel} nameMap={{ value: t("dashboard.revenue") }} />} />
                    <Area type="monotone" dataKey="value" stroke={chart.info} strokeWidth={2} strokeDasharray="6 4" fill="url(#fc)" />
                  </AreaChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>

          {loading ? (
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 2xl:grid-cols-3">
              {[...Array(6)].map((_, i) => (
                <Skeleton key={i} className="h-56 w-full rounded-lg" />
              ))}
            </div>
          ) : data.insights.length === 0 ? (
            <Card>
              <EmptyState icon={Sparkles} title={t("ai.empty")} description={t("ai.emptyHint")} />
            </Card>
          ) : (
            <>
              <p className="text-xs text-fg-muted">{t("ai.generated", { time: fmt.relative(data.generated_at) })}</p>
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2 2xl:grid-cols-3">
                {data.insights.map((ins) => {
                  const meta = TYPE[ins.type] || TYPE.sales;
                  const Icon = meta.icon;
                  const p = params(ins);
                  return (
                    <Card key={ins.id} className="flex flex-col p-5">
                      <div className="flex items-center justify-between gap-3">
                        <span className={cn("inline-flex items-center gap-1.5 rounded-md px-2 py-1 text-xs font-medium", meta.cls)}>
                          <Icon className="h-3.5 w-3.5" aria-hidden="true" />
                          {t(`ai.types.${ins.type}`)}
                        </span>
                        <Badge variant={IMPACT[ins.impact]} dot>
                          {t("ai.impact")}: {t(`ai.${ins.impact}`)}
                        </Badge>
                      </div>
                      <h3 className="mt-3 text-base font-semibold leading-snug text-fg">{t(`ai.insights.${ins.key}`, p)}</h3>
                      <p className="mt-1 text-sm text-fg-secondary">{t(`ai.insights.${ins.key}Body`, p)}</p>
                      <div className="mt-3 flex gap-2 rounded-md bg-surface-muted p-3 text-sm">
                        <Lightbulb className="mt-0.5 h-4 w-4 shrink-0 text-warning" aria-hidden="true" />
                        <p className="text-fg-secondary">
                          <span className="font-medium text-fg">{t("ai.recommendation")}: </span>
                          {t(`ai.insights.${ins.key}Action`, p)}
                        </p>
                      </div>
                      <div className="mt-4 flex items-center justify-between gap-3 pt-1">
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center justify-between text-xs text-fg-muted">
                            <span>{t("ai.confidence")}</span>
                            <span className="tabular">{ins.confidence}%</span>
                          </div>
                          <div className="mt-1 h-1.5 w-full overflow-hidden rounded-full bg-muted-strong" role="progressbar" aria-valuenow={ins.confidence} aria-valuemin={0} aria-valuemax={100}>
                            <div className="h-full rounded-full bg-primary" style={{ width: `${ins.confidence}%` }} />
                          </div>
                        </div>
                        {ins.link && (
                          <Button variant="ghost" size="sm" rightIcon={ArrowRight} onClick={() => navigate(ins.link)}>
                            {t("common.open")}
                          </Button>
                        )}
                      </div>
                    </Card>
                  );
                })}
              </div>
            </>
          )}
        </div>
      )}
    </>
  );
}
