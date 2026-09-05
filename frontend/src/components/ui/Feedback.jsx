import { AlertCircle, AlertTriangle, CheckCircle2, Info, Inbox, RefreshCw, X, Loader2 } from "lucide-react";
import { cn } from "../../utils/cn.js";
import { Button } from "./Button.jsx";
import { useI18n } from "../../i18n/index.jsx";

const ALERT = {
  info: { icon: Info, cls: "border-info/30 bg-info-light/60 text-info-dark", iconCls: "text-info" },
  success: { icon: CheckCircle2, cls: "border-success/30 bg-success-light/60 text-success-dark", iconCls: "text-success" },
  warning: { icon: AlertTriangle, cls: "border-warning/30 bg-warning-light/60 text-warning-dark", iconCls: "text-warning" },
  danger: { icon: AlertCircle, cls: "border-danger/30 bg-danger-light/60 text-danger-dark", iconCls: "text-danger" },
};

export function Alert({ variant = "info", title, children, onClose, className, action }) {
  const s = ALERT[variant] || ALERT.info;
  const Icon = s.icon;
  return (
    <div role={variant === "danger" ? "alert" : "status"} className={cn("flex items-start gap-3 rounded-lg border px-4 py-3 text-sm", s.cls, className)}>
      <Icon className={cn("mt-0.5 h-4 w-4 shrink-0", s.iconCls)} aria-hidden="true" />
      <div className="min-w-0 flex-1">
        {title && <p className="font-semibold">{title}</p>}
        {children && <div className={cn(title && "mt-0.5", "opacity-90")}>{children}</div>}
        {action && <div className="mt-2">{action}</div>}
      </div>
      {onClose && (
        <button type="button" onClick={onClose} className="rounded-md p-0.5 opacity-70 transition-opacity hover:opacity-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-current" aria-label="Close">
          <X className="h-4 w-4" />
        </button>
      )}
    </div>
  );
}

export function Spinner({ className, size = "md" }) {
  const s = size === "sm" ? "h-4 w-4" : size === "lg" ? "h-8 w-8" : "h-5 w-5";
  return <Loader2 className={cn("animate-spin text-accent", s, className)} aria-hidden="true" />;
}

export function Skeleton({ className }) {
  return <div className={cn("skeleton-shimmer rounded-md", className)} aria-hidden="true" />;
}

export function TableSkeleton({ rows = 6, cols = 5 }) {
  return (
    <div className="divide-y divide-border" aria-busy="true">
      {Array.from({ length: rows }).map((_, r) => (
        <div key={r} className="flex items-center gap-4 px-4 py-3.5">
          {Array.from({ length: cols }).map((__, c) => (
            <Skeleton key={c} className={cn("h-4", c === 0 ? "w-8" : c === 1 ? "w-48 flex-1" : "w-24")} />
          ))}
        </div>
      ))}
    </div>
  );
}

export function CardSkeleton({ className }) {
  return (
    <div className={cn("rounded-lg border border-border bg-surface p-5", className)} aria-busy="true">
      <div className="flex items-start justify-between">
        <Skeleton className="h-4 w-24" />
        <Skeleton className="h-9 w-9 rounded-md" />
      </div>
      <Skeleton className="mt-4 h-7 w-32" />
      <Skeleton className="mt-3 h-3 w-40" />
    </div>
  );
}

export function EmptyState({ icon: Icon = Inbox, title, description, action, className, compact = false }) {
  return (
    <div className={cn("flex flex-col items-center justify-center px-6 text-center", compact ? "py-8" : "py-14", className)}>
      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-muted text-fg-muted">
        <Icon className="h-6 w-6" aria-hidden="true" />
      </div>
      <h3 className="mt-4 text-base font-semibold text-fg">{title}</h3>
      {description && <p className="mt-1 max-w-sm text-sm text-fg-muted">{description}</p>}
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}

export function ErrorState({ title, description, onRetry, className, compact = false }) {
  const { t } = useI18n();
  return (
    <div className={cn("flex flex-col items-center justify-center px-6 text-center", compact ? "py-8" : "py-14", className)} role="alert">
      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-danger-light text-danger">
        <AlertCircle className="h-6 w-6" aria-hidden="true" />
      </div>
      <h3 className="mt-4 text-base font-semibold text-fg">{title || t("common.somethingWentWrong")}</h3>
      <p className="mt-1 max-w-sm text-sm text-fg-muted">{description || t("common.couldNotLoad")}</p>
      {onRetry && (
        <Button variant="outline" size="sm" className="mt-5" onClick={onRetry} leftIcon={RefreshCw}>
          {t("common.tryAgain")}
        </Button>
      )}
    </div>
  );
}
