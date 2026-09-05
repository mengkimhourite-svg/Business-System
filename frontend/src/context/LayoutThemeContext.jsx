import { createContext, useCallback, useContext, useEffect, useMemo } from "react";
import { useLocalStorage } from "../hooks/index.js";
import { useAuth } from "./AuthContext.jsx";
import { syncPreference } from "../services/preferences.js";
import { LAYOUT_THEME_DEFAULTS, SIDEBAR_PRESETS, NAVBAR_PRESETS, normalizeLayoutTheme, autoColors } from "../config/layoutThemes.js";

const LayoutThemeContext = createContext(null);

/** Build the CSS variables consumed by the Sidebar / Navbar components. */
function toCssVars({ sidebar, navbar }) {
  const s = autoColors(sidebar);
  const n = autoColors(navbar);
  const vars = {
    "--sb-width": `${sidebar.width}px`,
    "--sb-collapsed-width": `${sidebar.collapsedWidth}px`,
    "--sb-radius": `${sidebar.radius}px`,
    "--sb-item-height": `${sidebar.itemHeight}px`,
    "--sb-icon-size": `${sidebar.iconSize}px`,
    "--sb-logo-size": `${sidebar.logoSize}px`,
    "--sb-child-indent": `${sidebar.childIndent}px`,
    "--nb-height": `${navbar.height}px`,
  };
  const map = (prefix, obj, keys, fallback) =>
    keys.forEach((k) => {
      vars[`${prefix}-${k}`] = obj[k] || fallback[k];
    });
  map("--sb", s, ["bg", "text", "muted", "hoverBg", "activeBg", "activeText", "border"], {
    bg: "var(--surface)",
    text: "var(--fg-secondary)",
    muted: "var(--fg-muted)",
    hoverBg: "var(--surface-hover)",
    activeBg: "var(--primary-50)",
    activeText: "var(--primary-700)",
    border: "var(--border)",
  });
  map("--nb", n, ["bg", "text", "border"], { bg: "var(--surface)", text: "var(--fg)", border: "var(--border)" });
  // Custom navbar background → muted text/hover derive from the chosen text color so they stay readable on any color
  const nbText = n.text || "var(--fg)";
  vars["--nb-ghost-text"] = n.bg ? nbText : "var(--fg-secondary)";
  vars["--nb-muted"] = n.bg ? `color-mix(in srgb, ${nbText} 72%, transparent)` : "var(--fg-muted)";
  vars["--nb-hover"] = n.bg ? `color-mix(in srgb, ${nbText} 12%, transparent)` : "var(--surface-hover)";
  vars["--sb-strong"] = s.text ? s.text : "var(--fg)";
  vars["--nb-icon"] = n.iconColor || vars["--nb-ghost-text"];
  return vars;
}

const SIDEBAR_COLOR_KEYS = Object.keys(SIDEBAR_PRESETS.navy.colors);
const NAVBAR_COLOR_KEYS = Object.keys(NAVBAR_PRESETS.navy.colors);

export function LayoutThemeProvider({ children }) {
  const { user } = useAuth();
  const prefKey = `sbs.layout.${user?.id ?? "guest"}`;
  const [stored, setStored] = useLocalStorage(prefKey, null);
  const theme = useMemo(() => normalizeLayoutTheme(stored), [stored]);
  useEffect(() => {
    if (user?.id) syncPreference(prefKey, stored);
  }, [prefKey, stored, user?.id]);

  // Only color edits turn the preset into "custom"; layout options (height, width, switches) keep the selected preset.
  const patch = useCallback((part, values) => setStored((prev) => {
    const cur = normalizeLayoutTheme(prev);
    const colorKeys = part === "sidebar" ? SIDEBAR_COLOR_KEYS : NAVBAR_COLOR_KEYS;
    const touchesColor = Object.keys(values).some((k) => colorKeys.includes(k));
    return { ...cur, [part]: { ...cur[part], ...values, preset: values.preset ?? (touchesColor ? "custom" : cur[part].preset) } };
  }), [setStored]);

  const applyPreset = useCallback((part, key) => setStored((prev) => {
    const cur = normalizeLayoutTheme(prev);
    const presets = part === "sidebar" ? SIDEBAR_PRESETS : NAVBAR_PRESETS;
    const preset = presets[key];
    if (!preset) return cur;
    const cleared = Object.fromEntries((part === "sidebar" ? SIDEBAR_COLOR_KEYS : NAVBAR_COLOR_KEYS).map((k) => [k, ""]));
    const base = part === "sidebar" ? LAYOUT_THEME_DEFAULTS.sidebar : LAYOUT_THEME_DEFAULTS.navbar;
    const layoutDefaults = Object.fromEntries(Object.keys(base).filter((k) => !(k in cleared) && k !== "preset").map((k) => [k, base[k]]));
    return { ...cur, [part]: { ...cur[part], ...layoutDefaults, ...cleared, ...preset.colors, ...(preset.layout || {}), preset: key } };
  }), [setStored]);

  const reset = useCallback((part) => setStored((prev) => {
    if (!part) return null;
    const cur = normalizeLayoutTheme(prev);
    return { ...cur, [part]: { ...LAYOUT_THEME_DEFAULTS[part] } };
  }), [setStored]);

  const value = useMemo(() => ({ theme, cssVars: toCssVars(theme), setSidebar: (v) => patch("sidebar", v), setNavbar: (v) => patch("navbar", v), applyPreset, reset, isCustomized: !!stored }), [theme, patch, applyPreset, reset, stored]);
  return <LayoutThemeContext.Provider value={value}>{children}</LayoutThemeContext.Provider>;
}

export function useLayoutTheme() {
  const ctx = useContext(LayoutThemeContext);
  if (!ctx) throw new Error("useLayoutTheme must be used within LayoutThemeProvider");
  return ctx;
}
