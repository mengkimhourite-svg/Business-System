import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { useNavigate } from "react-router-dom";
import { ArrowRight, Calendar, Clock, MapPin } from "lucide-react";
import { cn } from "../../utils/cn.js";
import { useI18n } from "../../i18n/index.jsx";
import { useAuth } from "../../context/AuthContext.jsx";
import { useSettings } from "../../context/SettingsContext.jsx";
import { useFormat } from "../../context/CurrencyContext.jsx";
import { Avatar, Badge, Button } from "../ui/index.js";
import { BrandMark } from "./Brand.jsx";
import { AnimatedCheck } from "../ui/Motion.jsx";

const AUTO_CLOSE_MS = 3000;
export const WELCOME_FLAG = "sbs.welcome.pending";

/**
 * Clean welcome modal shown once right after a successful login (any role).
 * Auto-dismisses to the dashboard after 3 s (progress bar), or immediately via the button / Esc.
 */
export function WelcomeModal() {
  const { t } = useI18n();
  const { user } = useAuth();
  const { settings } = useSettings();
  const fmt = useFormat();
  const navigate = useNavigate();
  const [open, setOpen] = useState(() => !!user && window.sessionStorage.getItem(WELCOME_FLAG) === "1");
  const [leaving, setLeaving] = useState(false);
  const timer = useRef(0);

  const close = () => {
    if (leaving) return;
    setLeaving(true);
    window.sessionStorage.removeItem(WELCOME_FLAG);
    clearTimeout(timer.current);
    setTimeout(() => {
      setOpen(false);
      navigate("/", { replace: true });
    }, 180);
  };

  useEffect(() => {
    if (!open) return undefined;
    timer.current = setTimeout(close, AUTO_CLOSE_MS);
    const onKey = (e) => {
      if (e.key === "Escape" || e.key === "Enter") close();
    };
    document.addEventListener("keydown", onKey);
    return () => {
      clearTimeout(timer.current);
      document.removeEventListener("keydown", onKey);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  if (!open || !user) return null;

  const hour = new Date().getHours();
  const period = hour < 12 ? "morning" : hour < 18 ? "afternoon" : "evening";
  const firstName = user.name?.split(" ")[0] || "";

  return createPortal(
    <div className="fixed inset-0 z-[70] flex items-center justify-center p-4" role="presentation">
      {/* Dimmed, blurred backdrop — animated independently from the dialog */}
      <div className={cn("welcome-backdrop absolute inset-0", leaving ? "animate-fade-out" : "animate-fade-in")} aria-hidden="true" />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="welcome-title"
        className={cn("relative z-10 w-full max-w-md overflow-hidden rounded-2xl border border-border bg-surface-elevated shadow-lg", leaving ? "animate-fade-out" : "animate-scale-in")}
      >
        {/* Brand band */}
        <div className="flex items-center gap-3 border-b border-border bg-surface-muted/60 px-6 py-4">
          <BrandMark size="sm" />
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold text-fg">{settings.business_name}</p>
            <p className="truncate text-xs text-fg-muted">{settings.business_subtitle || t("app.name")}</p>
          </div>
          <Badge variant="success" dot className="ml-auto">
            {t("welcome.signedIn")}
          </Badge>
        </div>

        <div className="px-6 pb-6 pt-7 text-center">
          <div className="relative mx-auto flex h-24 w-24 items-center justify-center">
            <Avatar src={user.avatar} name={user.name} size="xl" className="h-20 w-20 text-xl ring-4 ring-surface shadow-md animate-pop-in" />
            <AnimatedCheck size={34} className="absolute -bottom-1 -right-1 rounded-full bg-surface p-0.5" />
          </div>
          <h2 id="welcome-title" className="mt-4 text-xl font-semibold tracking-tight text-fg animate-rise" style={{ animationDelay: "80ms" }}>
            {t("welcome.title", { period: t(`dashboard.${period}`), name: firstName })}
          </h2>
          <p className="mt-1 text-sm text-fg-secondary animate-rise" style={{ animationDelay: "140ms" }}>
            {t("welcome.subtitle", { business: settings.business_name })}
          </p>

          <dl className="mt-5 grid grid-cols-3 gap-2 text-left animate-rise" style={{ animationDelay: "200ms" }}>
            {[
              { icon: Badge, label: t("common.role"), value: user.role?.name, badge: true },
              { icon: MapPin, label: t("common.branch"), value: user.branch_name || "—" },
              { icon: Calendar, label: t("common.date"), value: fmt.date(new Date()) },
            ].map((it, i) => (
              <div key={i} className="min-w-0 rounded-lg border border-border bg-surface px-3 py-2">
                <dt className="truncate text-[11px] font-medium uppercase tracking-wide text-fg-muted">{it.label}</dt>
                <dd className="mt-0.5 truncate text-sm font-semibold text-fg">{it.badge ? <span className="text-primary-700">{it.value}</span> : it.value}</dd>
              </div>
            ))}
          </dl>

          <Button size="lg" fullWidth rightIcon={ArrowRight} onClick={close} className="mt-6 animate-rise" style={{ animationDelay: "260ms" }} data-autofocus>
            {t("welcome.goToDashboard")}
          </Button>
          <p className="mt-3 flex items-center justify-center gap-1.5 text-xs text-fg-muted animate-rise" style={{ animationDelay: "300ms" }}>
            <Clock className="h-3.5 w-3.5" aria-hidden="true" />
            {t("welcome.autoRedirect")}
          </p>
        </div>

        {/* Auto-close progress */}
        <div className="h-1 w-full bg-muted" aria-hidden="true">
          <div className="h-full origin-left bg-primary animate-progress" style={{ animationDuration: `${AUTO_CLOSE_MS}ms` }} />
        </div>
      </div>
    </div>,
    document.body
  );
}
