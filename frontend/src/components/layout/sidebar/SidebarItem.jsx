import { forwardRef } from "react";
import { NavLink } from "react-router-dom";
import { ChevronRight, Plus } from "lucide-react";
import { cn } from "../../../utils/cn.js";

/*
 * Colors come from CSS variables set by LayoutThemeProvider (--sb-*), so the sidebar
 * can be themed from Dashboard Setting without touching component code.
 */
const BASE = "sb-item group flex w-full items-center gap-3 px-3 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30";

/**
 * Parent-level row (44px, radius from theme, 18px icon).
 *  - as a toggle button (group with children)
 *  - as a direct link (single-child group such as Dashboard / Settings)
 *  - as an icon-only button when the sidebar is collapsed
 */
export const SidebarItem = forwardRef(function SidebarItem({ icon: Icon, label, active = false, expanded = false, collapsed = false, to, onClick, chevron = true, chevronStyle = "chevron", className, ...rest }, ref) {
  const icon = <Icon className={cn("sb-icon h-[18px] w-[18px] shrink-0 transition-colors", active && "sb-icon-active")} aria-hidden="true" />;

  if (collapsed) {
    const cls = cn("sb-item group flex h-11 w-11 items-center justify-center transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30", active && "sb-item-active", className);
    return to ? (
      <NavLink ref={ref} to={to} end={to === "/"} className={cls} aria-label={label} onClick={onClick} {...rest}>
        {icon}
      </NavLink>
    ) : (
      <button ref={ref} type="button" className={cls} aria-label={label} onClick={onClick} {...rest}>
        {icon}
      </button>
    );
  }

  if (to) {
    return (
      <NavLink ref={ref} to={to} end={to === "/"} onClick={onClick} className={cn(BASE, "sb-row", active && "sb-item-active", className)} {...rest}>
        {icon}
        <span className="sb-label truncate">{label}</span>
      </NavLink>
    );
  }

  const Chevron = chevronStyle === "plus" ? Plus : ChevronRight;
  return (
    <button ref={ref} type="button" onClick={onClick} aria-expanded={expanded} className={cn(BASE, "sb-row", active && !expanded && "sb-text-active", active && "font-semibold", className)} {...rest}>
      {icon}
      <span className="sb-label flex-1 truncate text-left">{label}</span>
      {chevron && <Chevron className={cn("sb-chevron h-4 w-4 shrink-0", expanded && (chevronStyle === "plus" ? "rotate-45" : "rotate-90"), active && "sb-icon-active")} aria-hidden="true" />}
    </button>
  );
});
