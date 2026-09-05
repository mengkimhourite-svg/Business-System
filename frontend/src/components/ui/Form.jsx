import { forwardRef, useId } from "react";
import { AlertCircle, ChevronDown, Check } from "lucide-react";
import { cn } from "../../utils/cn.js";

export const inputClass = (error, extra) =>
  cn(
    "block w-full rounded-md border bg-surface text-sm text-fg shadow-xs transition-colors placeholder:text-fg-placeholder",
    "hover:border-border-strong focus:outline-none focus:ring-2",
    "disabled:cursor-not-allowed disabled:bg-surface-muted disabled:text-fg-muted read-only:bg-surface-muted",
    error ? "border-danger focus:border-danger focus:ring-danger/20" : "border-border focus:border-primary focus:ring-primary/20",
    extra
  );

export function Field({ label, htmlFor, required, hint, error, className, children, inline }) {
  return (
    <div className={cn("space-y-1.5", className)}>
      {label && (
        <label htmlFor={htmlFor} className={cn("block text-sm font-medium text-fg", inline === "sm" ? "sm:sr-only" : inline && "sr-only")}>
          {label}
          {required && (
            <span className="ml-0.5 text-danger" aria-hidden="true">
              *
            </span>
          )}
        </label>
      )}
      {children}
      {error ? (
        <p className="flex items-start gap-1 text-xs text-danger" role="alert">
          <AlertCircle className="mt-px h-3.5 w-3.5 shrink-0" aria-hidden="true" />
          <span>{error}</span>
        </p>
      ) : hint ? (
        <p className="text-xs text-fg-muted">{hint}</p>
      ) : null}
    </div>
  );
}

export const Input = forwardRef(function Input({ className, error, leftIcon: LeftIcon, addonLeft, rightElement, size = "md", ...props }, ref) {
  return (
    <div className="relative">
      {LeftIcon && <LeftIcon className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-fg-muted" aria-hidden="true" />}
      {!LeftIcon && addonLeft && (
        <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm font-medium text-fg-muted" aria-hidden="true">
          {addonLeft}
        </span>
      )}
      <input
        ref={ref}
        aria-invalid={error ? "true" : undefined}
        className={inputClass(error, cn(size === "sm" ? "h-8" : size === "lg" ? "h-11" : "h-9", LeftIcon || addonLeft ? "pl-9" : "pl-3", rightElement ? "pr-10" : "pr-3", className))}
        {...props}
      />
      {rightElement && <div className="absolute right-1.5 top-1/2 -translate-y-1/2">{rightElement}</div>}
    </div>
  );
});

export const Select = forwardRef(function Select({ className, error, options = [], placeholder, size = "md", children, ...props }, ref) {
  return (
    <div className="relative">
      <select
        ref={ref}
        aria-invalid={error ? "true" : undefined}
        className={inputClass(error, cn("appearance-none pl-3 pr-9", size === "sm" ? "h-8" : "h-9", props.value === "" && "text-fg-muted", className))}
        {...props}
      >
        {placeholder !== undefined && <option value="">{placeholder}</option>}
        {options.map((o) => (
          <option key={String(o.value)} value={o.value} disabled={o.disabled}>
            {o.label}
          </option>
        ))}
        {children}
      </select>
      <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-fg-muted" aria-hidden="true" />
    </div>
  );
});

export const Textarea = forwardRef(function Textarea({ className, error, rows = 3, ...props }, ref) {
  return <textarea ref={ref} rows={rows} aria-invalid={error ? "true" : undefined} className={inputClass(error, cn("px-3 py-2 leading-relaxed", className))} {...props} />;
});

export function Checkbox({ label, description, className, id, checked, onChange, disabled, indeterminate, ...props }) {
  const autoId = useId();
  const inputId = id || autoId;
  return (
    <label htmlFor={inputId} className={cn("flex cursor-pointer items-start gap-2.5", disabled && "cursor-not-allowed opacity-60", className)}>
      <span className="relative mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center">
        <input
          id={inputId}
          type="checkbox"
          checked={!!checked}
          onChange={onChange}
          disabled={disabled}
          ref={(el) => {
            if (el) el.indeterminate = !!indeterminate;
          }}
          className="peer h-4 w-4 cursor-pointer appearance-none rounded-xs border border-border-strong bg-surface transition-colors checked:border-primary checked:bg-primary indeterminate:border-primary indeterminate:bg-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30 disabled:cursor-not-allowed"
          {...props}
        />
        <Check className="pointer-events-none absolute h-3 w-3 text-white opacity-0 peer-checked:opacity-100" strokeWidth={3} aria-hidden="true" />
        <span className="pointer-events-none absolute h-0.5 w-2 bg-white opacity-0 peer-indeterminate:opacity-100" aria-hidden="true" />
      </span>
      {(label || description) && (
        <span className="min-w-0 text-sm">
          {label && <span className="block font-medium text-fg">{label}</span>}
          {description && <span className="block text-xs text-fg-muted">{description}</span>}
        </span>
      )}
    </label>
  );
}

export function Switch({ checked, onChange, label, description, disabled, className, id, ariaLabel }) {
  const autoId = useId();
  const switchId = id || autoId;
  return (
    <div className={cn("flex items-start justify-between gap-4", className)}>
      {(label || description) && (
        <label htmlFor={switchId} className="min-w-0 cursor-pointer text-sm">
          {label && <span className="block font-medium text-fg">{label}</span>}
          {description && <span className="block text-xs text-fg-muted">{description}</span>}
        </label>
      )}
      <button
        id={switchId}
        type="button"
        role="switch"
        aria-label={ariaLabel}
        aria-checked={!!checked}
        disabled={disabled}
        onClick={() => onChange?.(!checked)}
        className={cn(
          "relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30 focus-visible:ring-offset-1 disabled:cursor-not-allowed disabled:opacity-50",
          checked ? "bg-primary" : "bg-border-strong"
        )}
      >
        <span className={cn("inline-block h-5 w-5 transform rounded-full bg-white shadow-sm transition-transform", checked ? "translate-x-5" : "translate-x-0.5")} />
      </button>
    </div>
  );
}

export function RadioGroup({ name, value, onChange, options = [], className, inline }) {
  return (
    <div role="radiogroup" className={cn(inline ? "flex flex-wrap gap-4" : "space-y-2", className)}>
      {options.map((o) => (
        <label key={String(o.value)} className="flex cursor-pointer items-center gap-2 text-sm text-fg">
          <input
            type="radio"
            name={name}
            value={o.value}
            checked={value === o.value}
            onChange={() => onChange?.(o.value)}
            className="h-4 w-4 border-border-strong text-accent accent-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30"
          />
          {o.label}
        </label>
      ))}
    </div>
  );
}
