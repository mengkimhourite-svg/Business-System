import { useEffect, useState } from "react";
import { cn } from "../../utils/cn.js";
import { initials } from "../../utils/format.js";

const SIZES = { xs: "h-6 w-6 text-[10px]", sm: "h-8 w-8 text-xs", md: "h-10 w-10 text-sm", lg: "h-12 w-12 text-base", xl: "h-16 w-16 text-lg" };
const PALETTE = ["bg-primary-100 text-primary-700", "bg-info-light text-info-dark", "bg-success-light text-success-dark", "bg-warning-light text-warning-dark", "bg-muted-strong text-fg-secondary"];

function colorFor(name = "") {
  let h = 0;
  for (let i = 0; i < name.length; i++) h = (h * 31 + name.charCodeAt(i)) >>> 0;
  return PALETTE[h % PALETTE.length];
}

/** Avatar / thumbnail with graceful initials fallback. */
export function Avatar({ src, name = "", size = "md", shape = "circle", className, alt }) {
  const [failed, setFailed] = useState(false);
  useEffect(() => setFailed(false), [src]);
  const rounded = shape === "square" ? "rounded-md" : "rounded-full";
  const showImg = src && !failed;
  return (
    <span className={cn("relative inline-flex shrink-0 select-none items-center justify-center overflow-hidden font-semibold", SIZES[size], rounded, !showImg && colorFor(name), className)}>
      {showImg ? <img src={src} alt={alt ?? name} loading="lazy" onError={() => setFailed(true)} className="h-full w-full object-cover" /> : <span aria-hidden="true">{initials(name) || "?"}</span>}
    </span>
  );
}
