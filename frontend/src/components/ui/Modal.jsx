import { useCallback, useEffect, useId, useRef } from "react";
import { createPortal } from "react-dom";
import { X, AlertTriangle } from "lucide-react";
import { cn } from "../../utils/cn.js";
import { Button } from "./Button.jsx";
import { useEscape, useScrollLock } from "../../hooks/index.js";
import { useI18n } from "../../i18n/index.jsx";

const SIZES = { sm: "sm:max-w-md", md: "sm:max-w-lg", lg: "sm:max-w-2xl", xl: "sm:max-w-4xl", "2xl": "sm:max-w-6xl" };

const FOCUSABLE = 'a[href], button:not([disabled]), textarea, input:not([type="hidden"]), select, [tabindex]:not([tabindex="-1"])';

export function Modal({ open, onClose, title, description, children, footer, size = "md", closeOnOverlay = true, className, bodyClassName, hideHeader = false }) {
  const panelRef = useRef(null);
  const previous = useRef(null);
  const titleId = useId();
  const descId = useId();

  useScrollLock(open);
  useEscape(
    useCallback(() => onClose?.(), [onClose]),
    open
  );

  useEffect(() => {
    if (!open) return undefined;
    previous.current = document.activeElement;
    const id = requestAnimationFrame(() => {
      const first = panelRef.current?.querySelector('[data-autofocus], input:not([type="hidden"]), select, textarea') || panelRef.current?.querySelector(FOCUSABLE);
      (first || panelRef.current)?.focus?.();
    });
    return () => {
      cancelAnimationFrame(id);
      previous.current?.focus?.();
    };
  }, [open]);

  const trapFocus = (e) => {
    if (e.key !== "Tab" || !panelRef.current) return;
    const nodes = [...panelRef.current.querySelectorAll(FOCUSABLE)].filter((n) => n.offsetParent !== null);
    if (!nodes.length) return;
    const first = nodes[0];
    const last = nodes[nodes.length - 1];
    if (e.shiftKey && document.activeElement === first) {
      e.preventDefault();
      last.focus();
    } else if (!e.shiftKey && document.activeElement === last) {
      e.preventDefault();
      first.focus();
    }
  };

  if (!open) return null;

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center sm:p-4" role="presentation">
      <div className="modal-backdrop absolute inset-0 animate-fade-in" onClick={closeOnOverlay ? onClose : undefined} aria-hidden="true" />
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={title ? titleId : undefined}
        aria-describedby={description ? descId : undefined}
        tabIndex={-1}
        onKeyDown={trapFocus}
        className={cn(
          "relative flex max-h-[92dvh] w-full flex-col rounded-t-xl bg-surface-elevated shadow-lg outline-none animate-scale-in sm:rounded-xl",
          SIZES[size],
          className
        )}
      >
        {!hideHeader && (
          <div className="flex items-start justify-between gap-4 border-b border-border px-5 py-4">
            <div className="min-w-0">
              {title && (
                <h2 id={titleId} className="text-lg font-semibold leading-6 text-fg">
                  {title}
                </h2>
              )}
              {description && (
                <p id={descId} className="mt-1 text-sm text-fg-muted">
                  {description}
                </p>
              )}
            </div>
            <Button variant="ghost" size="sm" icon onClick={onClose} aria-label="Close" className="-mr-1.5 -mt-1 shrink-0">
              <X className="h-4 w-4" />
            </Button>
          </div>
        )}
        <div className={cn("min-h-0 flex-1 overflow-y-auto px-5 py-4", bodyClassName)}>{children}</div>
        {footer && <div className="flex flex-col-reverse gap-2 border-t border-border bg-surface-muted px-5 py-3 sm:flex-row sm:justify-end sm:rounded-b-xl">{footer}</div>}
      </div>
    </div>,
    document.body
  );
}

export function ConfirmDialog({ open, onClose, onConfirm, title, description, confirmLabel, cancelLabel, variant = "danger", loading = false, icon: Icon = AlertTriangle }) {
  const { t } = useI18n();
  return (
    <Modal
      open={open}
      onClose={loading ? undefined : onClose}
      size="sm"
      hideHeader
      footer={
        <>
          <Button variant="outline" onClick={onClose} disabled={loading} className="w-full sm:w-auto">
            {cancelLabel || t("common.cancel")}
          </Button>
          <Button variant={variant} onClick={onConfirm} loading={loading} className="w-full sm:w-auto" data-autofocus>
            {confirmLabel || t("common.confirm")}
          </Button>
        </>
      }
    >
      <div className="flex gap-4 py-1">
        <div className={cn("flex h-10 w-10 shrink-0 items-center justify-center rounded-full", variant === "danger" ? "bg-danger-light text-danger" : "bg-primary-50 text-accent")}>
          <Icon className="h-5 w-5" aria-hidden="true" />
        </div>
        <div className="min-w-0">
          <h2 className="text-base font-semibold text-fg">{title}</h2>
          {description && <p className="mt-1 text-sm text-fg-secondary">{description}</p>}
        </div>
      </div>
    </Modal>
  );
}
