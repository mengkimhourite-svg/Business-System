import { Search, X, SlidersHorizontal, LayoutList, LayoutGrid } from "lucide-react";
import { cn } from "../../utils/cn.js";
import { Input, Select, Button } from "../ui/index.js";
import { useI18n } from "../../i18n/index.jsx";

export function SearchBar({ value, onChange, placeholder, className, autoFocus, size = "md" }) {
  const { t } = useI18n();
  return (
    <div className={cn("relative w-full", className)}>
      <Input
        type="search"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder || t("common.searchPlaceholder")}
        leftIcon={Search}
        size={size}
        autoFocus={autoFocus}
        aria-label={t("common.search")}
        className="[&::-webkit-search-cancel-button]:hidden"
        rightElement={
          value ? (
            <Button variant="ghost" size="xs" icon onClick={() => onChange("")} aria-label={t("common.clear")} className="h-6 w-6">
              <X className="h-3.5 w-3.5" />
            </Button>
          ) : null
        }
      />
    </div>
  );
}

/**
 * filters: [{ key, label, options: [{value,label}], type?: 'select'|'date' }]
 * values: { [key]: value }
 */
export function FilterBar({ filters = [], values = {}, onChange, onClear, className, children }) {
  const { t } = useI18n();
  const activeCount = Object.entries(values).filter(([, v]) => v !== "" && v != null && v !== "all").length;
  if (!filters.length && !children) return null;
  return (
    <div className={cn("flex flex-wrap items-center gap-2", className)}>
      <SlidersHorizontal className="hidden h-4 w-4 text-fg-muted lg:block" aria-hidden="true" />
      {filters.map((f) =>
        f.type === "date" ? (
          <Input key={f.key} type="date" size="sm" value={values[f.key] || ""} onChange={(e) => onChange(f.key, e.target.value)} aria-label={f.label} className="w-[150px]" />
        ) : (
          <Select
            key={f.key}
            size="sm"
            value={values[f.key] ?? ""}
            onChange={(e) => onChange(f.key, e.target.value)}
            placeholder={f.label}
            options={f.options}
            aria-label={f.label}
            className="w-auto min-w-[140px] max-w-[200px]"
          />
        )
      )}
      {children}
      {activeCount > 0 && onClear && (
        <Button variant="ghost" size="sm" onClick={onClear} leftIcon={X} className="text-fg-muted">
          {t("common.clearFilters")}
        </Button>
      )}
    </div>
  );
}

/** Table ⇄ Card view switch. */
export function ViewToggle({ value = "table", onChange, className }) {
  const { t } = useI18n();
  const options = [
    { key: "table", icon: LayoutList, label: t("common.tableView") },
    { key: "cards", icon: LayoutGrid, label: t("common.cardView") },
  ];
  return (
    <div role="group" aria-label={t("common.viewMode")} className={cn("inline-flex h-8 shrink-0 items-center rounded-md border border-border bg-surface p-0.5 shadow-xs", className)}>
      {options.map((o) => (
        <button
          key={o.key}
          type="button"
          aria-pressed={value === o.key}
          aria-label={o.label}
          title={o.label}
          onClick={() => onChange(o.key)}
          className={cn(
            "flex h-7 w-8 items-center justify-center rounded-[5px] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30",
            value === o.key ? "bg-primary-50 text-accent" : "text-fg-muted hover:text-fg"
          )}
        >
          <o.icon className="h-4 w-4" aria-hidden="true" />
        </button>
      ))}
    </div>
  );
}
