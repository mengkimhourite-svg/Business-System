import { NavLink } from "react-router-dom";
import { cn } from "../../../utils/cn.js";

/**
 * Child route link (second level). Uses a dot indicator that turns into an
 * accent pill when active; height 36px. Colors come from --sb-* CSS variables.
 */
export function SidebarSubItem({ item, label, onNavigate, className, dotStyle = "dot" }) {
  return (
    <NavLink
      to={item.path}
      end={item.path === "/"}
      onClick={onNavigate}
      className={({ isActive }) =>
        cn("sb-item sb-sub group flex h-9 items-center gap-3 pr-3 text-[13px] font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30", isActive && "sb-item-active", className)
      }
    >
      {({ isActive }) => (
        <>
          {dotStyle !== "none" && <span className={cn("sb-dot shrink-0 transition-colors", dotStyle === "dash" ? "sb-dot-dash" : "h-1.5 w-1.5 rounded-full", isActive && "sb-dot-active")} aria-hidden="true" />}
          <span className="truncate">{label}</span>
        </>
      )}
    </NavLink>
  );
}
