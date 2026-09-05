import { Link, useLocation } from "react-router-dom";
import { ChevronRight, Home } from "lucide-react";
import { cn } from "../../utils/cn.js";
import { useI18n } from "../../i18n/index.jsx";
import { findNavItem } from "../../config/navigation.js";

export function Breadcrumb({ items, className }) {
  const location = useLocation();
  const { t } = useI18n();
  let list = items;
  if (!list) {
    const nav = findNavItem(location.pathname);
    list = [{ label: t("nav.home"), to: "/", icon: Home }];
    if (nav && nav.path !== "/") list.push({ label: t(nav.labelKey) });
    else if (nav) list = [{ label: t("nav.dashboard"), icon: Home }];
  }
  return (
    <nav aria-label="Breadcrumb" className={className}>
      <ol className="flex items-center gap-1.5 text-sm">
        {list.map((item, i) => {
          const last = i === list.length - 1;
          const Icon = item.icon;
          const content = (
            <span className="inline-flex items-center gap-1.5">
              {Icon && <Icon className="h-3.5 w-3.5" aria-hidden="true" />}
              <span className="truncate">{item.label}</span>
            </span>
          );
          return (
            <li key={i} className="flex min-w-0 items-center gap-1.5">
              {i > 0 && <ChevronRight className="nb-crumb h-3.5 w-3.5 shrink-0" aria-hidden="true" />}
              {item.to && !last ? (
                <Link to={item.to} className="nb-crumb rounded transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30">
                  {content}
                </Link>
              ) : (
                <span className={cn(last ? "nb-crumb-current font-medium" : "nb-crumb")} aria-current={last ? "page" : undefined}>
                  {content}
                </span>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}

/**
 * Clean single-row page header with a horizontal bottom border.
 * Left: icon (auto-resolved from navigation) + title + description. Right: actions.
 */
export function PageHeader({ title, description, actions, breadcrumb, icon, className, children }) {
  const location = useLocation();
  const nav = findNavItem(location.pathname);
  const Icon = icon === null ? null : icon || nav?.icon;
  return (
    <div className={cn("mb-6 border-b border-border pb-4 animate-fade-in", className)}>
      <Breadcrumb items={breadcrumb} className="mb-3 md:hidden" />
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div className="flex min-w-0 items-center gap-3">
          {Icon && (
            <span className="hidden h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary-50 text-accent sm:flex" aria-hidden="true">
              <Icon className="h-5 w-5" />
            </span>
          )}
          <div className="min-w-0">
            <h1 className="truncate text-xl font-semibold tracking-tight text-fg sm:text-2xl">{title}</h1>
            {description && <p className="mt-0.5 text-sm text-fg-secondary sm:truncate">{description}</p>}
          </div>
        </div>
        {actions && <div className="flex flex-wrap items-center gap-2 md:shrink-0 md:justify-end">{actions}</div>}
      </div>
      {children}
    </div>
  );
}
