import { TrendingUp, TrendingDown, Minus, AlertTriangle, Lightbulb } from "lucide-react";
import { cn } from "../../utils/cn.js";
import { useI18n } from "../../i18n/index.jsx";
import { useFormat } from "../../context/CurrencyContext.jsx";

/* ---------- helpers ---------- */
function useBlockText() {
  const { t } = useI18n();
  const fmt = useFormat();
  return (block) => {
    if (!block?.textKey) return block?.text || "";
    const params = { ...(block.params || {}) };
    (block.moneyParams || []).forEach((k) => (params[k] = fmt.currency(params[k])));
    (block.dateParams || []).forEach((k) => (params[k] = fmt.date(params[k])));
    if (block.categoryParam && params[block.categoryParam]) params[block.categoryParam] = t(`expenses.cat.${params[block.categoryParam]}`);
    return t(block.textKey, params);
  };
}

function Trend({ change, label }) {
  const fmt = useFormat();
  if (change === null || change === undefined || Number.isNaN(Number(change))) return null;
  const up = change > 0.05;
  const down = change < -0.05;
  const Icon = up ? TrendingUp : down ? TrendingDown : Minus;
  return (
    <span className="inline-flex flex-wrap items-center gap-1.5 text-xs">
      <span className={cn("inline-flex items-center gap-1 font-medium tabular", up ? "text-success-dark" : down ? "text-danger-dark" : "text-fg-muted")}>
        <Icon className="h-3.5 w-3.5" aria-hidden="true" />
        {fmt.percent(change)}
      </span>
      {label && <span className="text-fg-muted">{label}</span>}
    </span>
  );
}

/* ---------- blocks ---------- */
export function AIKPI({ block }) {
  const { t } = useI18n();
  const fmt = useFormat();
  const val = (v, money) => (money ? fmt.currency(v) : typeof v === "number" ? fmt.number(v) : v);
  return (
    <div className="rounded-lg border border-border bg-surface p-3.5">
      <p className="text-xs font-medium text-fg-secondary">{block.titleKey ? t(block.titleKey) : block.title}</p>
      <p className="mt-1 text-2xl font-semibold tracking-tight text-fg tabular">{val(block.value, block.money)}</p>
      {block.change !== undefined && (
        <div className="mt-1">
          <Trend change={block.change} label={t(block.changeLabelKey || "common.vsPrevious")} />
        </div>
      )}
      {block.stats?.length > 0 && (
        <dl className="mt-3 grid grid-cols-3 gap-2 border-t border-border pt-3">
          {block.stats.map((s, i) => (
            <div key={i} className="min-w-0">
              <dt className="truncate text-[11px] text-fg-muted">{t(s.labelKey)}</dt>
              <dd className="truncate text-sm font-semibold text-fg tabular">{val(s.value, s.money)}</dd>
            </div>
          ))}
        </dl>
      )}
    </div>
  );
}

export function AIList({ block }) {
  const { t } = useI18n();
  const fmt = useFormat();
  return (
    <div>
      {(block.titleKey || block.title) && <p className="mb-1.5 text-xs font-semibold uppercase tracking-wide text-fg-muted">{block.titleKey ? t(block.titleKey) : block.title}</p>}
      <ol className="divide-y divide-border rounded-lg border border-border">
        {block.items.map((it, i) => {
          const label = it.labelKey ? t(it.labelKey) : it.label;
          let value = it.value;
          if (it.moneyPair) value = `${fmt.currency(it.moneyPair[0])} / ${fmt.currency(it.moneyPair[1])}`;
          else if (it.money) value = fmt.currency(it.value);
          else if (typeof it.value === "number") value = `${fmt.number(it.value)}${it.unitKey ? ` ${t(it.unitKey)}` : it.unit ? ` ${it.unit}` : ""}`;
          return (
            <li key={i} className="flex items-center gap-3 px-3 py-2 text-sm">
              <span className="w-4 shrink-0 text-xs font-semibold text-fg-muted tabular">{i + 1}</span>
              <span className="min-w-0 flex-1 truncate text-fg">{label}</span>
              {it.share !== undefined && <span className="hidden text-xs text-fg-muted tabular sm:inline">{it.share}%</span>}
              <span className="shrink-0 text-right">
                <span className="block font-medium text-fg tabular">{value}</span>
                {it.sub !== undefined && <span className="block text-[11px] text-fg-muted tabular">{it.subMoney ? fmt.currency(it.sub) : it.sub}</span>}
              </span>
            </li>
          );
        })}
      </ol>
    </div>
  );
}

export function AITable({ block }) {
  const { t } = useI18n();
  const fmt = useFormat();
  const cell = (c) => {
    if (c && typeof c === "object") {
      if ("money" in c) return fmt.currency(c.money);
      if ("date" in c) return fmt.date(c.date);
      if ("statusKey" in c) return t(c.statusKey);
    }
    return c === null || c === undefined ? "—" : String(c);
  };
  return (
    <div>
      {block.titleKey && <p className="mb-1.5 text-xs font-semibold uppercase tracking-wide text-fg-muted">{t(block.titleKey)}</p>}
      <div className="overflow-x-auto rounded-lg border border-border">
        <table className="w-full min-w-[280px] text-[13px]">
          <thead>
            <tr className="border-b border-border bg-surface-muted text-left text-[11px] uppercase tracking-wide text-fg-secondary">
              {(block.columnsKeys || block.columns || []).map((k, i) => (
                <th key={k} className={cn("whitespace-nowrap px-3 py-2 font-semibold", i > 0 && "text-right")}>
                  {block.columnsKeys ? t(k) : k}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {block.rows.map((row, r) => (
              <tr key={r}>
                {row.map((c, i) => (
                  <td key={i} className={cn("px-3 py-2 align-middle", i === 0 ? "max-w-[160px] truncate font-medium text-fg" : "whitespace-nowrap text-right text-fg-secondary tabular")}>
                    {cell(c)}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export function AIAlert({ block }) {
  const { t } = useI18n();
  const text = useBlockText();
  return (
    <div className="flex gap-3 rounded-lg border border-warning/30 bg-warning-light/60 px-3.5 py-3">
      <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-warning" aria-hidden="true" />
      <div className="min-w-0 text-sm">
        {(block.titleKey || block.title) && <p className="font-semibold text-warning-dark">{block.titleKey ? t(block.titleKey) : block.title}</p>}
        <p className="text-fg-secondary">{text(block)}</p>
      </div>
    </div>
  );
}

export function AIRecommendation({ block }) {
  const { t } = useI18n();
  const text = useBlockText();
  return (
    <div className="flex gap-3 rounded-lg bg-primary-50 px-3.5 py-3">
      <Lightbulb className="mt-0.5 h-4 w-4 shrink-0 text-accent" aria-hidden="true" />
      <div className="min-w-0 text-sm">
        <p className="font-semibold text-primary-700">{t("ai.recommendation")}</p>
        <p className="text-fg-secondary">{text(block)}</p>
      </div>
    </div>
  );
}

export function AIComparison({ block }) {
  const { t } = useI18n();
  const fmt = useFormat();
  const v = (x) => (block.money ? fmt.currency(x) : fmt.number(x));
  return (
    <div className="rounded-lg border border-border bg-surface p-3.5">
      <div className="grid grid-cols-2 gap-3">
        <div className="min-w-0">
          <p className="truncate text-xs text-fg-muted">{block.aKey ? t(block.aKey) : block.aLabel}</p>
          <p className="truncate text-lg font-semibold text-fg tabular">{v(block.a)}</p>
        </div>
        <div className="min-w-0 border-l border-border pl-3">
          <p className="truncate text-xs text-fg-muted">{block.bKey ? t(block.bKey) : block.bLabel}</p>
          <p className="truncate text-lg font-semibold text-fg-secondary tabular">{v(block.b)}</p>
        </div>
      </div>
      {block.change !== undefined && (
        <div className="mt-2 border-t border-border pt-2">
          <Trend change={block.change} label={t("common.vsPrevious")} />
        </div>
      )}
    </div>
  );
}

export function AIText({ block }) {
  const text = useBlockText();
  return <p className="text-sm leading-relaxed text-fg">{text(block)}</p>;
}

const RENDERERS = { kpi: AIKPI, list: AIList, table: AITable, alert: AIAlert, recommendation: AIRecommendation, comparison: AIComparison, text: AIText };

/** Renders a structured AI answer (array of blocks). */
export function AIMessageContent({ blocks = [] }) {
  return (
    <div className="space-y-3">
      {blocks.map((b, i) => {
        const R = RENDERERS[b.kind] || AIText;
        return <R key={i} block={b} />;
      })}
    </div>
  );
}
