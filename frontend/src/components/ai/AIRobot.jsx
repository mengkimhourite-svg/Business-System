import { cn } from "../../utils/cn.js";

/**
 * Friendly robot mascot for the AI Assistant — inline SVG so it scales crisply,
 * inherits the brand navy and works in light/dark mode without image assets.
 *  - `mood="thinking"` animates the eyes; `mood="error"` shows a concerned face.
 */
export function AIRobotIcon({ className, mood = "happy" }) {
  const thinking = mood === "thinking";
  const error = mood === "error";
  return (
    <svg viewBox="0 0 64 64" className={cn("h-full w-full", className)} aria-hidden="true" focusable="false">
      {/* antenna */}
      <line x1="32" y1="6" x2="32" y2="14" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
      <circle cx="32" cy="5.5" r="3.5" fill="currentColor" className={thinking ? "animate-pulse" : undefined} />
      {/* ears */}
      <rect x="5" y="30" width="6" height="12" rx="3" fill="currentColor" opacity="0.85" />
      <rect x="53" y="30" width="6" height="12" rx="3" fill="currentColor" opacity="0.85" />
      {/* head */}
      <rect x="11" y="15" width="42" height="36" rx="11" fill="currentColor" />
      {/* face plate */}
      <rect x="16" y="21" width="32" height="24" rx="8" fill="#ffffff" fillOpacity="0.16" />
      {/* eyes */}
      {error ? (
        <>
          <line x1="22" y1="28" x2="28" y2="34" stroke="#ffffff" strokeWidth="3" strokeLinecap="round" />
          <line x1="28" y1="28" x2="22" y2="34" stroke="#ffffff" strokeWidth="3" strokeLinecap="round" />
          <line x1="36" y1="28" x2="42" y2="34" stroke="#ffffff" strokeWidth="3" strokeLinecap="round" />
          <line x1="42" y1="28" x2="36" y2="34" stroke="#ffffff" strokeWidth="3" strokeLinecap="round" />
        </>
      ) : (
        <>
          <rect x="21" y="27" width="7" height={thinking ? 3 : 9} rx="3.5" fill="#ffffff" className={thinking ? "animate-pulse" : undefined} style={thinking ? { transform: "translateY(3px)" } : undefined} />
          <rect x="36" y="27" width="7" height={thinking ? 3 : 9} rx="3.5" fill="#ffffff" className={thinking ? "animate-pulse" : undefined} style={thinking ? { transform: "translateY(3px)", animationDelay: "150ms" } : undefined} />
        </>
      )}
      {/* mouth */}
      {error ? (
        <path d="M25 41 Q32 36 39 41" stroke="#ffffff" strokeWidth="2.5" strokeLinecap="round" fill="none" />
      ) : (
        <path d="M25 39 Q32 44 39 39" stroke="#ffffff" strokeWidth="2.5" strokeLinecap="round" fill="none" />
      )}
      {/* neck + shoulders */}
      <rect x="27" y="51" width="10" height="4" rx="2" fill="currentColor" opacity="0.85" />
      <rect x="17" y="55" width="30" height="6" rx="3" fill="currentColor" opacity="0.7" />
    </svg>
  );
}

const SIZES = { xs: "h-6 w-6 p-[3px]", sm: "h-8 w-8 p-1", md: "h-9 w-9 p-1", lg: "h-11 w-11 p-1.5", xl: "h-14 w-14 p-2" };

/** Robot avatar in a soft navy circle — the assistant's identity everywhere (chat, header, cards). */
export function AIRobotAvatar({ size = "md", mood = "happy", className, tone = "primary" }) {
  return (
    <span
      className={cn(
        "flex shrink-0 items-center justify-center rounded-full",
        tone === "danger" ? "bg-danger-light text-danger" : tone === "solid" ? "bg-primary text-white" : "bg-primary-50 text-accent",
        SIZES[size],
        className
      )}
      aria-hidden="true"
    >
      <AIRobotIcon mood={mood} className={tone === "solid" ? "text-white" : undefined} />
    </span>
  );
}
