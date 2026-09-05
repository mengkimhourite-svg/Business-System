import { useRef, useState } from "react";
import { createPortal } from "react-dom";
import { cn } from "../../utils/cn.js";

/** Lightweight tooltip rendered in a portal (works inside overflow containers). */
export function Tooltip({ content, side = "top", children, disabled = false, className }) {
  const ref = useRef(null);
  const [pos, setPos] = useState(null);

  const show = () => {
    if (disabled || !content || !ref.current) return;
    const r = ref.current.getBoundingClientRect();
    const gap = 8;
    const map = {
      top: { left: r.left + r.width / 2, top: r.top - gap, transform: "translate(-50%, -100%)" },
      bottom: { left: r.left + r.width / 2, top: r.bottom + gap, transform: "translate(-50%, 0)" },
      right: { left: r.right + gap, top: r.top + r.height / 2, transform: "translate(0, -50%)" },
      left: { left: r.left - gap, top: r.top + r.height / 2, transform: "translate(-100%, -50%)" },
    };
    setPos(map[side] || map.top);
  };
  const hide = () => setPos(null);

  return (
    <span ref={ref} onMouseEnter={show} onMouseLeave={hide} onFocus={show} onBlur={hide} className={cn("inline-flex", className)}>
      {children}
      {pos &&
        createPortal(
          <span role="tooltip" style={{ position: "fixed", zIndex: 80, ...pos }} className="pointer-events-none whitespace-nowrap rounded-md bg-tooltip px-2.5 py-1.5 text-xs font-medium text-white shadow-md animate-fade-in">
            {content}
          </span>,
          document.body
        )}
    </span>
  );
}
