import { cn } from "../../utils/cn.js";

export const BADGE_VARIANTS = {
  neutral: "bg-muted text-fg-secondary ring-border",
  primary: "bg-primary-50 text-primary-700 ring-primary-100",
  success: "bg-success-light text-success-dark ring-success/30",
  warning: "bg-warning-light text-warning-dark ring-warning/30",
  danger: "bg-danger-light text-danger-dark ring-danger/30",
  info: "bg-info-light text-info-dark ring-info/30",
};

const DOT = {
  neutral: "bg-fg-muted",
  primary: "bg-primary",
  success: "bg-success",
  warning: "bg-warning",
  danger: "bg-danger",
  info: "bg-info",
};

export function Badge({ variant = "neutral", dot = false, size = "sm", className, children, ...props }) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 whitespace-nowrap rounded-full font-medium ring-1 ring-inset",
        size === "sm" ? "px-2 py-0.5 text-xs" : "px-2.5 py-1 text-sm",
        BADGE_VARIANTS[variant] || BADGE_VARIANTS.neutral,
        className
      )}
      {...props}
    >
      {dot && <span className={cn("h-1.5 w-1.5 rounded-full", DOT[variant])} aria-hidden="true" />}
      {children}
    </span>
  );
}
