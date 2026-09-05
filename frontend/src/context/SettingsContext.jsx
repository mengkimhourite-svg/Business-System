import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { api } from "../services/api.js";
import { BASE_CURRENCY, DEFAULT_EXCHANGE_RATE } from "../services/currency.js";

const DEFAULTS = {
  business_name: "Smart Business System",
  business_subtitle: "",
  business_logo: "",
  base_currency: BASE_CURRENCY,
  currency: BASE_CURRENCY,
  exchange_rate: DEFAULT_EXCHANGE_RATE,
  tax_rate: 10,
  low_stock_threshold: 10,
  receipt_footer: "",
};

const CACHE_KEY = "sbs.branding";

/** Public, non-sensitive branding cached so the login page and boot loader are branded instantly. */
function readBrandingCache() {
  try {
    const raw = window.localStorage.getItem(CACHE_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}
function writeBrandingCache(s) {
  try {
    window.localStorage.setItem(CACHE_KEY, JSON.stringify({ business_name: s.business_name, business_subtitle: s.business_subtitle, business_logo: s.business_logo }));
  } catch {
    /* quota — ignore */
  }
}

const SettingsContext = createContext(null);

export function SettingsProvider({ children }) {
  const [settings, setSettingsState] = useState(() => ({ ...DEFAULTS, ...readBrandingCache() }));

  const setSettings = useCallback((next) => {
    setSettingsState((prev) => {
      const value = typeof next === "function" ? next(prev) : next;
      writeBrandingCache(value);
      return value;
    });
  }, []);

  // Public settings (branding, currency, tax) — safe to load before authentication.
  useEffect(() => {
    let active = true;
    api
      .getPublicSettings()
      .then((s) => active && s && setSettings((prev) => ({ ...prev, ...s })))
      .catch(() => {});
    return () => {
      active = false;
    };
  }, [setSettings]);

  const reload = useCallback(async () => {
    const s = await api.getSettings();
    if (s) setSettings((prev) => ({ ...DEFAULTS, ...prev, ...s }));
    return s;
  }, [setSettings]);

  // Full (authenticated) settings after login; branding stays cached after logout.
  useEffect(() => {
    const onAuth = (e) => {
      if (e.detail?.userId) reload().catch(() => {});
    };
    window.addEventListener("sbs:auth", onAuth);
    return () => window.removeEventListener("sbs:auth", onAuth);
  }, [reload]);

  const update = useCallback(
    async (payload) => {
      const next = await api.updateSettings(payload);
      setSettings((s) => ({ ...s, ...next }));
      return next;
    },
    [setSettings]
  );

  useEffect(() => {
    document.title = settings.business_name ? `${settings.business_name} · Smart Business System` : "Smart Business System";
  }, [settings.business_name]);

  const value = useMemo(() => ({ settings, update, setSettings, reload }), [settings, update, setSettings, reload]);
  return <SettingsContext.Provider value={value}>{children}</SettingsContext.Provider>;
}

export function useSettings() {
  const ctx = useContext(SettingsContext);
  if (!ctx) throw new Error("useSettings must be used within SettingsProvider");
  return ctx;
}
