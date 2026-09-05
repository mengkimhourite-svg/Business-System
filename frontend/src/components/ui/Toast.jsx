import { createContext, useCallback, useContext, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { CheckCircle2, AlertCircle, AlertTriangle, Info, X } from "lucide-react";
import { cn } from "../../utils/cn.js";

const ToastContext = createContext(null);

const STYLES = {
  success: { icon: CheckCircle2, bar: "bg-success", icon_cls: "text-success" },
  error: { icon: AlertCircle, bar: "bg-danger", icon_cls: "text-danger" },
  warning: { icon: AlertTriangle, bar: "bg-warning", icon_cls: "text-warning" },
  info: { icon: Info, bar: "bg-info", icon_cls: "text-info" },
};

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);
  const counter = useRef(0);

  const dismiss = useCallback((id) => setToasts((list) => list.filter((t) => t.id !== id)), []);

  const push = useCallback(
    (type, message, options = {}) => {
      const id = ++counter.current;
      const duration = options.duration ?? (type === "error" ? 6000 : 4000);
      setToasts((list) => [...list.slice(-4), { id, type, message, title: options.title }]);
      if (duration > 0) setTimeout(() => dismiss(id), duration);
      return id;
    },
    [dismiss]
  );

  const api = useMemo(
    () => ({
      success: (m, o) => push("success", m, o),
      error: (m, o) => push("error", m, o),
      warning: (m, o) => push("warning", m, o),
      info: (m, o) => push("info", m, o),
      dismiss,
    }),
    [push, dismiss]
  );

  return (
    <ToastContext.Provider value={api}>
      {children}
      {createPortal(
        <div aria-live="polite" aria-atomic="false" className="pointer-events-none fixed inset-x-4 top-4 z-[100] flex flex-col items-end gap-2 sm:inset-x-auto sm:right-4 sm:w-96">
          {toasts.map((toast) => {
            const s = STYLES[toast.type] || STYLES.info;
            const Icon = s.icon;
            return (
              <div
                key={toast.id}
                role="status"
                className="pointer-events-auto relative flex w-full items-start gap-3 overflow-hidden rounded-lg border border-border bg-surface-elevated py-3 pl-4 pr-3 shadow-md animate-panel-in"
              >
                <span className={cn("absolute inset-y-0 left-0 w-1", s.bar)} aria-hidden="true" />
                <Icon className={cn("mt-0.5 h-5 w-5 shrink-0", s.icon_cls)} aria-hidden="true" />
                <div className="min-w-0 flex-1 text-sm">
                  {toast.title && <p className="font-semibold text-fg">{toast.title}</p>}
                  <p className="text-fg-secondary">{toast.message}</p>
                </div>
                <button
                  type="button"
                  onClick={() => dismiss(toast.id)}
                  className="rounded-md p-1 text-fg-muted transition-colors hover:bg-muted hover:text-fg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30"
                  aria-label="Dismiss"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            );
          })}
        </div>,
        document.body
      )}
    </ToastContext.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error("useToast must be used within ToastProvider");
  return ctx;
}
