import { useMemo } from "react";
import { useFormat } from "../../context/CurrencyContext.jsx";
import { useTheme } from "../../context/ThemeContext.jsx";
import { useI18n } from "../../i18n/index.jsx";
import { localeFor } from "../../utils/format.js";

export const CHART_COLORS = ["#2d4a9e", "#4362b8", "#6480cf", "#8ea4df", "#0891b2", "#16a34a", "#d97706", "#94a3b8", "#b7c6ec", "#dc2626"];
const DARK_COLORS = ["#6383db", "#8ea4df", "#22d3ee", "#22c55e", "#f59e0b", "#a78bfa", "#f472b6", "#94a3b8", "#b7c6ec", "#f87171"];

/** Theme-aware chart colors and axis defaults. */
export function useChart() {
  const { isDark } = useTheme();
  return useMemo(
    () => ({
      grid: isDark ? "#233049" : "#e2e8f0",
      cursor: isDark ? "#1b2941" : "#f1f5f9",
      axis: { tick: { fontSize: 11, fill: isDark ? "#8592ab" : "#64748b" }, axisLine: false, tickLine: false },
      primary: isDark ? "#6383db" : "#2d4a9e",
      success: isDark ? "#22c55e" : "#16a34a",
      info: isDark ? "#22d3ee" : "#0891b2",
      warning: isDark ? "#f59e0b" : "#d97706",
      palette: isDark ? DARK_COLORS : CHART_COLORS,
    }),
    [isDark]
  );
}

export function useAxisLabel() {
  const { lang } = useI18n();
  return (key) => {
    if (!key) return "";
    if (/^\d{4}-\d{2}-\d{2}T\d{2}$/.test(key)) return `${key.slice(11, 13)}:00`;
    if (/^\d{4}-\d{2}$/.test(key)) return new Intl.DateTimeFormat(localeFor(lang), { month: "short" }).format(new Date(`${key}-01T00:00:00`));
    if (/^\d{4}-\d{2}-\d{2}$/.test(key)) return new Intl.DateTimeFormat(localeFor(lang), { month: "short", day: "numeric" }).format(new Date(`${key}T00:00:00`));
    return key;
  };
}

/** Tooltip shared by all charts. `format` maps dataKey -> 'currency' | 'number' */
export function ChartTooltip({ active, payload, label, format = {}, labelFormatter, nameMap = {} }) {
  const fmt = useFormat();
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-md border border-border bg-surface-elevated px-3 py-2 text-xs shadow-md">
      {label !== undefined && <p className="mb-1 font-medium text-fg">{labelFormatter ? labelFormatter(label) : label}</p>}
      {payload.map((p) => (
        <div key={p.dataKey || p.name} className="flex items-center gap-2 py-0.5">
          <span className="h-2 w-2 rounded-full" style={{ background: p.color || p.payload?.fill || p.fill }} aria-hidden="true" />
          <span className="text-fg-secondary">{nameMap[p.dataKey] || nameMap[p.name] || p.name}</span>
          <span className="ml-auto pl-3 font-medium text-fg tabular">{(format[p.dataKey] || format[p.name] || "number") === "currency" ? fmt.currency(p.value) : fmt.number(p.value)}</span>
        </div>
      ))}
    </div>
  );
}
