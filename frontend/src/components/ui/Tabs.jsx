import { cn } from "../../utils/cn.js";

export function Tabs({ tabs = [], value, onChange, variant = "underline", className, size = "md" }) {
  const onKeyDown = (e) => {
    if (!["ArrowLeft", "ArrowRight", "Home", "End"].includes(e.key)) return;
    e.preventDefault();
    const idx = tabs.findIndex((t) => t.key === value);
    let next = idx;
    if (e.key === "ArrowRight") next = (idx + 1) % tabs.length;
    if (e.key === "ArrowLeft") next = (idx - 1 + tabs.length) % tabs.length;
    if (e.key === "Home") next = 0;
    if (e.key === "End") next = tabs.length - 1;
    onChange?.(tabs[next].key);
    e.currentTarget.querySelectorAll('[role="tab"]')[next]?.focus();
  };

  const isPills = variant === "pills";
  return (
    <div
      role="tablist"
      onKeyDown={onKeyDown}
      className={cn(
        "flex overflow-x-auto scrollbar-none",
        isPills ? "gap-1 rounded-lg bg-muted p-1" : "gap-1 border-b border-border",
        className
      )}
    >
      {tabs.map((tab) => {
        const active = tab.key === value;
        const Icon = tab.icon;
        return (
          <button
            key={tab.key}
            type="button"
            role="tab"
            aria-selected={active}
            tabIndex={active ? 0 : -1}
            onClick={() => onChange?.(tab.key)}
            className={cn(
              "inline-flex shrink-0 items-center gap-2 whitespace-nowrap font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30",
              size === "sm" ? "text-xs" : "text-sm",
              isPills
                ? cn("rounded-md px-3 py-1.5", active ? "bg-surface text-fg shadow-xs dark:bg-muted-strong" : "text-fg-secondary hover:text-fg")
                : cn(
                    "-mb-px border-b-2 px-3 py-2.5",
                    active ? "border-primary text-accent" : "border-transparent text-fg-secondary hover:border-border-strong hover:text-fg"
                  )
            )}
          >
            {Icon && <Icon className="h-4 w-4" aria-hidden="true" />}
            {tab.label}
            {tab.count != null && (
              <span className={cn("rounded-full px-1.5 py-0.5 text-xs tabular", active ? "bg-primary-50 text-primary-700" : "bg-muted text-fg-secondary")}>{tab.count}</span>
            )}
          </button>
        );
      })}
    </div>
  );
}
