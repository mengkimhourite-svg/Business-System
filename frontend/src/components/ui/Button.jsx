import { forwardRef } from "react";
import { Loader2 } from "lucide-react";
import { cn } from "../../utils/cn.js";

const BASE =
  "press inline-flex select-none items-center justify-center whitespace-nowrap rounded-md font-medium focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-1 disabled:pointer-events-none disabled:opacity-50";

export const BUTTON_VARIANTS = {
  primary: "bg-primary text-white shadow-xs hover:bg-primary-hover active:bg-primary-dark focus-visible:ring-primary/40",
  secondary: "bg-primary-50 text-primary-700 hover:bg-primary-100 active:bg-primary-200 focus-visible:ring-primary/30",
  outline: "border border-border bg-surface text-fg-secondary shadow-xs hover:bg-surface-hover hover:text-fg active:bg-muted focus-visible:ring-primary/30",
  ghost: "text-fg-secondary hover:bg-muted hover:text-fg active:bg-muted-strong focus-visible:ring-primary/30",
  /** Ghost button without color utilities — colors come from chrome classes (nb-ghost / sb-ghost) so themed navbars/sidebars win the cascade. */
  chrome: "focus-visible:ring-primary/30",
  danger: "bg-danger text-white shadow-xs hover:bg-danger-dark focus-visible:ring-danger/40",
  "danger-outline": "border border-danger/30 bg-surface text-danger hover:bg-danger-light focus-visible:ring-danger/30",
  success: "bg-success text-white shadow-xs hover:bg-success-dark focus-visible:ring-success/40",
  link: "h-auto px-0 text-accent underline-offset-4 hover:text-accent-hover hover:underline",
};

const SIZES = {
  xs: "h-7 gap-1.5 px-2.5 text-xs",
  sm: "h-8 gap-1.5 px-3 text-sm",
  md: "h-9 gap-2 px-4 text-sm",
  lg: "h-11 gap-2 px-5 text-base",
};

const ICON_SIZES = { xs: "h-7 w-7", sm: "h-8 w-8", md: "h-9 w-9", lg: "h-11 w-11" };

export const Button = forwardRef(function Button(
  { as: Comp = "button", variant = "primary", size = "md", icon = false, loading = false, disabled, leftIcon: LeftIcon, rightIcon: RightIcon, fullWidth, className, children, type = "button", ...props },
  ref
) {
  const iconCls = size === "xs" ? "h-3.5 w-3.5" : size === "lg" ? "h-5 w-5" : "h-4 w-4";
  const isButton = Comp === "button";
  return (
    <Comp
      ref={ref}
      {...(isButton ? { type, disabled: disabled || loading } : { "aria-disabled": disabled || loading || undefined })}
      aria-busy={loading || undefined}
      className={cn(BASE, BUTTON_VARIANTS[variant], variant === "link" ? (size === "xs" ? "text-xs" : "text-sm") : icon ? cn(ICON_SIZES[size], "p-0") : SIZES[size], fullWidth && "w-full", className)}
      {...props}
    >
      {loading ? <Loader2 className={cn(iconCls, "animate-spin")} aria-hidden="true" /> : LeftIcon ? <LeftIcon className={iconCls} aria-hidden="true" /> : null}
      {children}
      {!loading && RightIcon ? <RightIcon className={iconCls} aria-hidden="true" /> : null}
    </Comp>
  );
});
