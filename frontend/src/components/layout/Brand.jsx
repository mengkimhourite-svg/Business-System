import { useEffect, useState } from "react";
import { Store } from "lucide-react";
import { cn } from "../../utils/cn.js";
import { useSettings } from "../../context/SettingsContext.jsx";
import { useI18n } from "../../i18n/index.jsx";

const SIZES = { sm: "h-8 w-8", md: "h-9 w-9", lg: "h-12 w-12", xl: "h-16 w-16" };
const ICON = { sm: "h-4 w-4", md: "h-5 w-5", lg: "h-6 w-6", xl: "h-8 w-8" };

/**
 * Business logo mark — driven by Settings → General.
 * Shows the uploaded logo when present, otherwise the default store icon on brand navy.
 * Used everywhere a logo appears (sidebar, navbar, login, loader, receipt).
 */
export function BrandMark({ className, size = "md", src }) {
  const { settings } = useSettings();
  const logo = src !== undefined ? src : settings.business_logo;
  const [failed, setFailed] = useState(false);
  useEffect(() => setFailed(false), [logo]);

  if (logo && !failed) {
    return (
      <span className={cn("flex shrink-0 items-center justify-center overflow-hidden rounded-lg bg-surface ring-1 ring-border", SIZES[size], className)}>
        <img src={logo} alt="" onError={() => setFailed(true)} className="h-full w-full object-contain" />
      </span>
    );
  }
  return (
    <span className={cn("flex shrink-0 items-center justify-center rounded-lg bg-primary text-white shadow-xs", SIZES[size], className)} aria-hidden="true">
      <Store className={ICON[size]} />
    </span>
  );
}

/** Business name + subtitle, always in sync with Settings → General. */
export function BrandName({ className, nameClassName, subtitleClassName, showSubtitle = true }) {
  const { settings } = useSettings();
  const { t } = useI18n();
  const fallbackSubtitle = t("app.name");
  return (
    <span className={cn("min-w-0", className)}>
      <span className={cn("block truncate text-sm font-semibold", nameClassName)}>{settings.business_name}</span>
      {showSubtitle && <span className={cn("block truncate text-xs", subtitleClassName)}>{settings.business_subtitle || fallbackSubtitle}</span>}
    </span>
  );
}
