import { cloneElement, createContext, useCallback, useContext, useEffect, useLayoutEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { cn } from "../../utils/cn.js";

const DropdownContext = createContext({ close: () => {} });
const CLOSE_MS = 140;

/**
 * Accessible dropdown menu rendered in a portal (never clipped by scroll containers).
 * Opens with a soft scale/slide from its anchor edge and animates out on close.
 * `trigger` must be a single element that accepts onClick / ref.
 */
export function Dropdown({ trigger, children, align = "end", width = 200, className }) {
  const [open, setOpen] = useState(false);
  const [closing, setClosing] = useState(false);
  const [style, setStyle] = useState(null);
  const [openUp, setOpenUp] = useState(false);
  const triggerRef = useRef(null);
  const menuRef = useRef(null);
  const closeTimer = useRef(0);

  const close = useCallback(() => {
    setClosing(true);
    clearTimeout(closeTimer.current);
    closeTimer.current = setTimeout(() => {
      setOpen(false);
      setClosing(false);
    }, CLOSE_MS);
  }, []);

  const toggle = useCallback(() => {
    if (open && !closing) close();
    else {
      clearTimeout(closeTimer.current);
      setClosing(false);
      setOpen(true);
    }
  }, [open, closing, close]);

  const position = useCallback(() => {
    const el = triggerRef.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    const menuH = menuRef.current?.offsetHeight || 0;
    const spaceBelow = window.innerHeight - r.bottom;
    const up = !!menuH && spaceBelow < menuH + 8 && r.top > menuH + 8;
    const next = { position: "fixed", width, zIndex: 60 };
    if (up) next.bottom = window.innerHeight - r.top + 6;
    else next.top = r.bottom + 6;
    if (align === "end") next.left = Math.max(8, r.right - width);
    else next.left = Math.min(r.left, window.innerWidth - width - 8);
    setOpenUp(up);
    setStyle(next);
  }, [align, width]);

  useLayoutEffect(() => {
    if (open) position();
  }, [open, position]);

  useEffect(() => () => clearTimeout(closeTimer.current), []);

  useEffect(() => {
    if (!open) return undefined;
    const onDown = (e) => {
      if (triggerRef.current?.contains(e.target) || menuRef.current?.contains(e.target)) return;
      close();
    };
    const onKey = (e) => {
      if (e.key === "Escape") {
        close();
        triggerRef.current?.focus();
      }
      if (e.key === "ArrowDown" || e.key === "ArrowUp") {
        const items = [...(menuRef.current?.querySelectorAll('[role="menuitem"]:not([disabled])') || [])];
        if (!items.length) return;
        e.preventDefault();
        const idx = items.indexOf(document.activeElement);
        const next = e.key === "ArrowDown" ? (idx + 1) % items.length : (idx - 1 + items.length) % items.length;
        items[next].focus();
      }
    };
    const onScroll = () => position();
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    window.addEventListener("resize", onScroll);
    window.addEventListener("scroll", onScroll, true);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
      window.removeEventListener("resize", onScroll);
      window.removeEventListener("scroll", onScroll, true);
    };
  }, [open, close, position]);

  useEffect(() => {
    if (open) requestAnimationFrame(() => menuRef.current?.querySelector('[role="menuitem"]')?.focus());
  }, [open]);

  const triggerEl = cloneElement(trigger, {
    ref: triggerRef,
    onClick: (e) => {
      trigger.props.onClick?.(e);
      toggle();
    },
    "aria-haspopup": "menu",
    "aria-expanded": open && !closing,
  });

  return (
    <DropdownContext.Provider value={{ close }}>
      {triggerEl}
      {open &&
        createPortal(
          <div
            ref={menuRef}
            role="menu"
            data-state={closing ? "closed" : "open"}
            style={style || { position: "fixed", opacity: 0 }}
            className={cn(
              "dropdown-menu rounded-lg border border-border bg-surface-elevated p-1 shadow-md",
              openUp ? "origin-bottom" : "origin-top",
              align === "end" ? (openUp ? "origin-bottom-right" : "origin-top-right") : openUp ? "origin-bottom-left" : "origin-top-left",
              className
            )}
          >
            {children}
          </div>,
          document.body
        )}
    </DropdownContext.Provider>
  );
}

export function DropdownItem({ icon: Icon, trailing: Trailing, children, onClick, danger, disabled, className, active }) {
  const { close } = useContext(DropdownContext);
  return (
    <button
      type="button"
      role="menuitem"
      disabled={disabled}
      onClick={(e) => {
        onClick?.(e);
        close();
      }}
      className={cn(
        "dropdown-item flex w-full items-center gap-2.5 rounded-md px-2.5 py-2 text-left text-sm transition-colors duration-150 focus-visible:outline-none focus-visible:bg-surface-hover disabled:opacity-50",
        danger ? "text-danger hover:bg-danger-light" : "text-fg-secondary hover:bg-surface-hover hover:text-fg",
        active && "bg-primary-50 text-primary-700",
        className
      )}
    >
      {Icon && <Icon className="h-4 w-4 shrink-0" aria-hidden="true" />}
      <span className="min-w-0 flex-1 truncate">{children}</span>
      {Trailing && <Trailing className={cn("h-4 w-4 shrink-0", active ? "text-accent" : "text-fg-muted")} aria-hidden="true" />}
    </button>
  );
}

export function DropdownLabel({ children }) {
  return <div className="px-2.5 py-1.5 text-xs font-medium uppercase tracking-wide text-fg-muted">{children}</div>;
}

export function DropdownSeparator() {
  return <div className="my-1 h-px bg-border" role="separator" />;
}
