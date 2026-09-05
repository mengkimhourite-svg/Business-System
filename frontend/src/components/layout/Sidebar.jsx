import { useCallback, useEffect, useMemo } from "react";
import { useLocation } from "react-router-dom";
import { X, PanelLeftClose, PanelLeftOpen } from "lucide-react";
import { BrandMark, BrandName } from "./Brand.jsx";
import { cn } from "../../utils/cn.js";
import { useI18n } from "../../i18n/index.jsx";
import { useAuth } from "../../context/AuthContext.jsx";
import { useLayoutTheme } from "../../context/LayoutThemeContext.jsx";
import { visibleNavigation, findNavGroup } from "../../config/navigation.js";
import { Button, Avatar } from "../ui/index.js";
import { useEscape, useLocalStorage, useScrollLock } from "../../hooks/index.js";
import { SidebarGroup } from "./sidebar/SidebarGroup.jsx";
import { SidebarTooltip } from "./sidebar/SidebarTooltip.jsx";


/**
 * Collapsible dropdown navigation, themed through --sb-* CSS variables
 * (Dashboard Setting → Sidebar & Navbar).
 *  - Expanded (configurable width, default 250px): parent groups toggle their children; one level only.
 *  - Collapsed (72px): parent icons with tooltips; clicking opens a floating submenu.
 *  - Mobile: same expanded navigation inside a drawer.
 */
export function Sidebar({ collapsed, onToggleCollapse, mobileOpen, onMobileClose }) {
  const { t } = useI18n();
  const { can, user } = useAuth();
  const { theme } = useLayoutTheme();
  const { pathname } = useLocation();
  const [openGroups, setOpenGroups] = useLocalStorage("sbs.sidebar.groups", { business: true, operations: true });
  const sb = theme.sidebar;

  useScrollLock(mobileOpen);
  useEscape(
    useCallback(() => onMobileClose?.(), [onMobileClose]),
    mobileOpen
  );

  const groups = useMemo(() => visibleNavigation(can), [can]);

  // Navigating to a child route always reveals its parent group.
  useEffect(() => {
    const g = findNavGroup(pathname);
    if (g && g.items.length > 1) setOpenGroups((s) => (s?.[g.key] ? s : { ...(s || {}), [g.key]: true }));
  }, [pathname, setOpenGroups]);

  const toggleGroup = (key) => setOpenGroups((s) => ({ ...(s || {}), [key]: !s?.[key] }));

  const renderNav = (isMobile) => {
    const isCollapsed = collapsed && !isMobile;
    return (
      <div className="flex h-full flex-col">
        {/* Brand */}
        <div style={{ height: theme.navbar.height }} className={cn("flex shrink-0 items-center", isCollapsed || sb.logoAlign === "center" ? "justify-center px-0" : "gap-3 px-4")}>
          <BrandMark className="sb-logo" />
          {!isCollapsed && sb.logoAlign !== "center" && <BrandName className="sb-label flex-1" nameClassName="sb-strong" subtitleClassName="sb-muted" />}
          {isMobile && (
            <Button variant="chrome" size="sm" icon onClick={onMobileClose} aria-label={t("nav.closeMenu")} className="sb-ghost">
              <X className="h-5 w-5" />
            </Button>
          )}
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto overflow-x-hidden px-3 py-2" aria-label="Main navigation">
          <ul className={cn(isCollapsed ? "space-y-1.5" : sb.compact ? "space-y-0" : "space-y-0.5")}>
            {groups.map((group) => (
              <li key={group.key}>
                <SidebarGroup group={group} t={t} collapsed={isCollapsed} expanded={!!openGroups?.[group.key]} onToggle={() => toggleGroup(group.key)} onNavigate={isMobile ? onMobileClose : undefined} chevron={sb.showGroupChevrons && sb.chevronStyle !== "none"} chevronStyle={sb.chevronStyle} dotStyle={sb.dotStyle} />
              </li>
            ))}
          </ul>
        </nav>

        {/* Footer */}
        <div className="sb-divider shrink-0 border-t p-3">
          {isMobile ? (
            <div className="flex items-center gap-3 rounded-md px-2 py-1.5">
              <Avatar src={user?.avatar} name={user?.name} size="sm" />
              <div className="min-w-0">
                <p className="sb-strong truncate text-sm font-medium">{user?.name}</p>
                <p className="sb-muted truncate text-xs">{user?.role?.name}</p>
              </div>
            </div>
          ) : (
            <SidebarTooltip content={t("nav.expand")} disabled={!isCollapsed}>
              <Button
                variant="chrome"
                size="sm"
                onClick={onToggleCollapse}
                className={cn("sb-ghost w-full", isCollapsed ? "justify-center px-0" : "justify-start")}
                aria-label={isCollapsed ? t("nav.expand") : t("nav.collapse")}
                aria-expanded={!isCollapsed}
              >
                {isCollapsed ? <PanelLeftOpen className="h-4 w-4" /> : <PanelLeftClose className="h-4 w-4" />}
                {!isCollapsed && <span className="sb-label">{t("nav.collapse")}</span>}
              </Button>
            </SidebarTooltip>
          )}
        </div>
      </div>
    );
  };

  return (
    <>
      <aside
        style={{ width: collapsed ? sb.collapsedWidth : sb.width }}
        className={cn("sb-root fixed inset-y-0 left-0 z-30 hidden lg:block", sb.showBorder && "sb-divider border-r", sb.compact && "sb-compact", sb.shadow && "sb-shadow")}
        aria-label="Sidebar"
        data-collapsed={collapsed ? "true" : "false"}
      >
        {renderNav(false)}
      </aside>

      {mobileOpen && (
        <div className="fixed inset-0 z-40 lg:hidden" role="dialog" aria-modal="true" aria-label={t("nav.openMenu")}>
          <div className="absolute inset-0 bg-overlay animate-fade-in" onClick={onMobileClose} aria-hidden="true" />
          <aside className={cn("sb-root absolute inset-y-0 left-0 w-[280px] max-w-[85vw] shadow-lg animate-slide-in-left", sb.compact && "sb-compact")}>{renderNav(true)}</aside>
        </div>
      )}
    </>
  );
}
