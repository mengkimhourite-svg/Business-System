import { TrendingUp, TrendingDown, Minus } from "lucide-react";
import { cn } from "../../utils/cn.js";
import { Card, CardSkeleton } from "../ui/index.js";
import { useI18n } from "../../i18n/index.jsx";
import { useFormat } from "../../context/CurrencyContext.jsx";
import { AnimatedNumber } from "../ui/Motion.jsx";

const TONES = {
  primary: "bg-primary-50 text-accent",
  success: "bg-success-light text-success-dark",
  warning: "bg-warning-light text-warning-dark",
  danger: "bg-danger-light text-danger-dark",
  info: "bg-info-light text-info-dark",
  neutral: "bg-muted text-fg-secondary",
};

export const FONT_FAMILIES = {
  default: undefined,
  khmer: '"Kantumruy Pro", "Noto Sans Khmer", "Inter", sans-serif',
  mono: 'ui-monospace, SFMono-Regular, Menlo, Consolas, monospace',
  serif: 'Georgia, "Times New Roman", serif',
};
export const VALUE_SIZES = { sm: "text-xl", md: "text-2xl", lg: "text-3xl" };
const SIDES = ["Top", "Right", "Bottom", "Left"];

/** Translate a user appearance config into inline styles (user-defined colors must be dynamic). */
export function buildCardStyle(a = {}) {
  const style = {};
  if (a.bg) style.backgroundColor = a.bg;
  if (a.text) style.color = a.text;
  if (a.font && FONT_FAMILIES[a.font]) style.fontFamily = FONT_FAMILIES[a.font];
  const width = Number(a.borderWidth) || 3;
  const color = a.borderColor || "var(--primary)";
  SIDES.forEach((side) => {
    if (a.borders?.[side.toLowerCase()]) {
      style[`border${side}Width`] = `${width}px`;
      style[`border${side}Color`] = color;
    }
  });
  return style;
}

export function StatCard({ label, value, rawValue, formatValue, icon: Icon, change, changeLabel, tone = "primary", loading, hint, className, onClick, appearance }) {
  const { t } = useI18n();
  const fmt = useFormat();
  if (loading) return <CardSkeleton className={className} />;

  const a = appearance || {};
  const style = buildCardStyle(a);
  const customText = !!a.text;
  const hasChange = change !== null && change !== undefined && !Number.isNaN(Number(change));
  const up = hasChange && Number(change) > 0.05;
  const down = hasChange && Number(change) < -0.05;
  const TrendIcon = up ? TrendingUp : down ? TrendingDown : Minus;
  const Comp = onClick ? "button" : "div";
  const iconStyled = a.iconColor || a.iconBg;

  return (
    <Card
      as={Comp}
      onClick={onClick}
      style={style}
      {...(onClick ? { type: "button" } : {})}
      className={cn(
        "card-hover flex w-full min-w-0 flex-col p-4 text-left sm:p-5",
        // <button> elements don't stretch like <div>s — force full width/appearance parity with the other cards
        onClick && "w-full cursor-pointer appearance-none font-[inherit] transition-colors hover:border-border-strong focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30",
        className
      )}
    >
      <div className="flex w-full items-start justify-between gap-3">
        <p className={cn("min-w-0 text-sm font-medium", customText ? "opacity-80" : "text-fg-secondary")}>{label}</p>
        {Icon && (
          <span
            className={cn("flex h-9 w-9 shrink-0 items-center justify-center rounded-md", !a.iconBg && TONES[tone])}
            style={iconStyled ? { color: a.iconColor || (a.iconBg ? "#ffffff" : undefined), backgroundColor: a.iconBg || undefined } : undefined}
            aria-hidden="true"
          >
            <Icon className="h-[18px] w-[18px]" />
          </span>
        )}
      </div>
      <p className={cn("mt-2 w-full truncate font-semibold tracking-tight tabular", VALUE_SIZES[a.valueSize] || VALUE_SIZES.md, !(customText || a.value) && "text-fg")} style={a.value ? { color: a.value } : undefined}>
        {rawValue !== undefined && formatValue ? <AnimatedNumber value={rawValue} format={formatValue} /> : value}
      </p>
      <div className="mt-2 flex min-h-5 w-full flex-wrap items-center gap-x-2 gap-y-0.5 text-xs">
        {hasChange ? (
          <>
            <span className={cn("inline-flex items-center gap-1 font-medium tabular", up ? "text-success-dark" : down ? "text-danger-dark" : customText ? "opacity-70" : "text-fg-muted")}>
              <TrendIcon className="h-3.5 w-3.5" aria-hidden="true" />
              {fmt.percent(change)}
            </span>
            <span className={customText ? "opacity-70" : "text-fg-muted"}>{changeLabel || t("common.vsPrevious")}</span>
          </>
        ) : hint ? (
          <span className={customText ? "opacity-70" : "text-fg-muted"}>{hint}</span>
        ) : null}
      </div>
    </Card>
  );
}
