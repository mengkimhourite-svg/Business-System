import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { useLocation, useNavigate } from "react-router-dom";
import { cn } from "../../../utils/cn.js";
import { isPathActive } from "../../../config/navigation.js";
import { SidebarItem } from "./SidebarItem.jsx";
import { SidebarSubItem } from "./SidebarSubItem.jsx";
import { SidebarTooltip } from "./SidebarTooltip.jsx";

/* ---------- Collapsible children with a smooth 180ms height animation ---------- */
function Collapsible({ open, children, id }) {
  const ref = useRef(null);
  const [height, setHeight] = useState(open ? "auto" : 0);
  const first = useRef(true);

  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return undefined;
    if (first.current) {
      first.current = false;
      setHeight(open ? "auto" : 0);
      return undefined;
    }
    const target = el.scrollHeight;
    let raf = 0;
    if (open) {
      setHeight(0);
      raf = requestAnimationFrame(() => setHeight(target));
    } else {
      setHeight(target);
      raf = requestAnimationFrame(() => requestAnimationFrame(() => setHeight(0)));
    }
    return () => cancelAnimationFrame(raf);
  }, [open]);

  return (
    <div
      id={id}
      role="region"
      aria-hidden={!open}
      data-open={open ? "true" : "false"}
      style={{ height: height === "auto" ? undefined : height }}
      onTransitionEnd={(e) => e.propertyName === "height" && open && setHeight("auto")}
      className={cn("sb-collapsible overflow-hidden", open ? "opacity-100" : "opacity-0", !open && height === 0 && "invisible")}
    >
      <div ref={ref} className="space-y-0.5 pb-1 pt-0.5">
        {children}
      </div>
    </div>
  );
}

/* ---------- Floating submenu for the collapsed sidebar ---------- */
function Flyout({ anchorRef, group, label, t, onClose, onNavigate, pathname }) {
  const ref = useRef(null);
  const [pos, setPos] = useState(null);
  const navigate = useNavigate();

  useLayoutEffect(() => {
    const r = anchorRef.current?.getBoundingClientRect();
    if (!r) return;
    const h = ref.current?.offsetHeight || 0;
    const top = Math.max(8, Math.min(r.top, window.innerHeight - h - 8));
    setPos({ top, left: r.right + 8 });
  }, [anchorRef]);

  useEffect(() => {
    const onDown = (e) => {
      if (ref.current?.contains(e.target) || anchorRef.current?.contains(e.target)) return;
      onClose();
    };
    const onKey = (e) => {
      if (e.key === "Escape") {
        onClose();
        anchorRef.current?.focus();
      }
    };
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    window.addEventListener("resize", onClose);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
      window.removeEventListener("resize", onClose);
    };
  }, [anchorRef, onClose]);

  useEffect(() => {
    requestAnimationFrame(() => ref.current?.querySelector("a,button")?.focus());
  }, []);

  return createPortal(
    <div
      ref={ref}
      role="menu"
      aria-label={label}
      style={{ position: "fixed", top: pos?.top ?? -9999, left: pos?.left ?? -9999, zIndex: 60, width: 216 }}
      className="rounded-lg border border-border bg-surface-elevated p-1.5 shadow-md animate-slide-down"
    >
      <p className="px-2.5 pb-1.5 pt-1 text-[11px] font-semibold uppercase tracking-wider text-fg-muted">{label}</p>
      {group.items.map((item) => {
        const active = isPathActive(item.path, pathname);
        const Icon = item.icon;
        return (
          <button
            key={item.key}
            type="button"
            role="menuitem"
            onClick={() => {
              navigate(item.path);
              onNavigate?.();
              onClose();
            }}
            className={cn(
              "flex h-9 w-full items-center gap-2.5 rounded-md px-2.5 text-[13px] font-medium transition-colors focus-visible:outline-none focus-visible:bg-surface-hover",
              active ? "bg-primary-50 text-primary-700" : "text-fg-secondary hover:bg-surface-hover hover:text-fg"
            )}
          >
            <Icon className={cn("h-4 w-4 shrink-0", active ? "text-accent" : "text-fg-muted")} aria-hidden="true" />
            <span className="truncate">{t(item.labelKey)}</span>
          </button>
        );
      })}
    </div>,
    document.body
  );
}

/**
 * One navigation group: parent row + collapsible children (expanded sidebar)
 * or icon + flyout submenu (collapsed sidebar). Single-child groups render as a direct link.
 */
export function SidebarGroup({ group, t, collapsed = false, expanded = false, onToggle, onNavigate, chevron = true, chevronStyle = "chevron", dotStyle = "dot" }) {
  const { pathname } = useLocation();
  const anchorRef = useRef(null);
  const [flyout, setFlyout] = useState(false);
  const closeFlyout = useCallback(() => setFlyout(false), []);
  const label = t(group.labelKey);
  const active = group.items.some((i) => isPathActive(i.path, pathname));
  const single = group.items.length === 1;
  const only = group.items[0];

  useEffect(() => {
    if (!collapsed) setFlyout(false);
  }, [collapsed]);

  if (collapsed) {
    return (
      <div className="flex justify-center">
        <SidebarTooltip content={single ? t(only.labelKey) : label} disabled={flyout}>
          <SidebarItem
            ref={anchorRef}
            collapsed
            icon={single ? only.icon : group.icon}
            label={single ? t(only.labelKey) : label}
            active={active}
            to={single ? only.path : undefined}
            onClick={single ? onNavigate : () => setFlyout((f) => !f)}
            aria-haspopup={single ? undefined : "menu"}
            aria-expanded={single ? undefined : flyout}
          />
        </SidebarTooltip>
        {flyout && !single && <Flyout anchorRef={anchorRef} group={group} label={label} t={t} pathname={pathname} onClose={closeFlyout} onNavigate={onNavigate} />}
      </div>
    );
  }

  if (single) {
    return <SidebarItem icon={only.icon} label={t(only.labelKey)} active={active} to={only.path} onClick={onNavigate} />;
  }

  const regionId = `nav-group-${group.key}`;
  return (
    <div>
      <SidebarItem icon={group.icon} label={label} active={active} expanded={expanded} onClick={onToggle} aria-controls={regionId} chevron={chevron} chevronStyle={chevronStyle} />
      <Collapsible open={expanded} id={regionId}>
        {group.items.map((item) => (
          <SidebarSubItem key={item.key} item={item} label={t(item.labelKey)} onNavigate={onNavigate} dotStyle={dotStyle} />
        ))}
      </Collapsible>
    </div>
  );
}
