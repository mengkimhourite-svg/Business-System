import { cn } from "../../utils/cn.js";

export function Card({ className, children, as: Comp = "div", ...props }) {
  return (
    <Comp className={cn("rounded-lg border border-border bg-surface shadow-xs", className)} {...props}>
      {children}
    </Comp>
  );
}

export function CardHeader({ title, description, action, className, children }) {
  return (
    <div className={cn("flex flex-col gap-3 border-b border-border px-5 py-4 sm:flex-row sm:items-start sm:justify-between", className)}>
      <div className="min-w-0">
        {title && <h3 className="text-base font-semibold leading-6 text-fg">{title}</h3>}
        {description && <p className="mt-0.5 text-sm text-fg-muted">{description}</p>}
        {children}
      </div>
      {action && <div className="flex shrink-0 items-center gap-2">{action}</div>}
    </div>
  );
}

export function CardContent({ className, children, padded = true }) {
  return <div className={cn(padded && "p-5", className)}>{children}</div>;
}

export function CardFooter({ className, children }) {
  return <div className={cn("flex items-center justify-end gap-2 border-t border-border bg-surface-muted px-5 py-3", className)}>{children}</div>;
}
