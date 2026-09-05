import { cn } from "../../utils/cn.js";

/** Compact single-choice segmented control (radiogroup). */
export function Segmented({ options, value, onChange, label, className }) {
  return (
    <div role="radiogroup" aria-label={label} className={cn("inline-flex rounded-md border border-border bg-surface p-0.5 shadow-xs", className)}>
      {options.map((o) => (
        <button
          key={String(o.value)}
          type="button"
          role="radio"
          aria-checked={value === o.value}
          onClick={() => onChange(o.value)}
          className={cn(
            "min-w-9 rounded-[5px] px-3 py-1.5 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30",
            value === o.value ? "bg-primary-50 text-primary-700" : "text-fg-secondary hover:text-fg"
          )}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}
