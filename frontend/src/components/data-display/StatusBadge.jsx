import { Badge } from "../ui/index.js";
import { useI18n } from "../../i18n/index.jsx";

/** Single source of truth for semantic status colors. */
export const STATUS_VARIANTS = {
  active: "success",
  inactive: "neutral",
  pending: "warning",
  processing: "info",
  completed: "success",
  cancelled: "danger",
  paid: "success",
  unpaid: "danger",
  partial: "warning",
  refunded: "neutral",
  low_stock: "warning",
  out_of_stock: "danger",
  in_stock: "success",
  ordered: "info",
  received: "success",
  draft: "neutral",
  approved: "success",
  rejected: "danger",
  in: "success",
  out: "danger",
  adjustment: "info",
};

export function StatusBadge({ status, dot = true, size = "sm", className }) {
  const { t } = useI18n();
  if (!status) return <span className="text-fg-muted">—</span>;
  const key = String(status).toLowerCase();
  const label = t(`status.${key}`);
  return (
    <Badge variant={STATUS_VARIANTS[key] || "neutral"} dot={dot} size={size} className={className}>
      {label === `status.${key}` ? status : label}
    </Badge>
  );
}
