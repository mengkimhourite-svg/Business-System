import { Children, cloneElement, isValidElement, useEffect, useRef, useState } from "react";
import { useLocation } from "react-router-dom";
import { cn } from "../../utils/cn.js";

const reduced = () => typeof window !== "undefined" && window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;

/** Wraps routed content so every page enters with a soft rise/fade (re-runs on route change). */
export function PageTransition({ children, className }) {
  const { pathname } = useLocation();
  return (
    <div key={pathname} className={cn("animate-page-in", className)}>
      {children}
    </div>
  );
}

/** Applies a staggered "rise" to each direct child (cards, list items, tiles). */
export function StaggerGroup({ children, className, as: Comp = "div", step = 45, ...rest }) {
  const items = Children.toArray(children).filter(Boolean);
  return (
    <Comp className={cn("stagger", className)} style={{ "--stagger-step": `${step}ms` }} {...rest}>
      {items.map((child, i) => (isValidElement(child) ? cloneElement(child, { style: { ...(child.props.style || {}), "--i": i } }) : child))}
    </Comp>
  );
}

/**
 * Animates a number from 0 (or the previous value) to `value` — used by KPI cards.
 * `format` receives the intermediate number and returns the display string.
 */
export function AnimatedNumber({ value, format = (v) => String(v), duration = 700, className }) {
  const target = Number(value) || 0;
  const [display, setDisplay] = useState(target);
  const fromRef = useRef(0);
  const raf = useRef(0);
  const first = useRef(true);

  useEffect(() => {
    if (reduced()) {
      setDisplay(target);
      return undefined;
    }
    const from = first.current ? 0 : fromRef.current;
    first.current = false;
    const start = performance.now();
    const tick = (now) => {
      const p = Math.min(1, (now - start) / duration);
      const eased = 1 - Math.pow(1 - p, 3); // ease-out cubic
      setDisplay(from + (target - from) * eased);
      if (p < 1) raf.current = requestAnimationFrame(tick);
      else fromRef.current = target;
    };
    cancelAnimationFrame(raf.current);
    raf.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf.current);
  }, [target, duration]);

  return <span className={className}>{format(display)}</span>;
}

/** Success check mark that draws itself (used in the welcome modal / receipts). */
export function AnimatedCheck({ className, size = 56 }) {
  return (
    <span className={cn("relative inline-flex items-center justify-center", className)} style={{ width: size, height: size }} aria-hidden="true">
      <span className="absolute inset-0 rounded-full bg-success/30 animate-ring" />
      <span className="absolute inset-0 rounded-full bg-success-light animate-pop-in" />
      <svg viewBox="0 0 24 24" className="relative h-1/2 w-1/2 text-success" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M5 12.5l4.5 4.5L19 7.5" strokeDasharray="48" strokeDashoffset="48" className="animate-check" />
      </svg>
    </span>
  );
}
