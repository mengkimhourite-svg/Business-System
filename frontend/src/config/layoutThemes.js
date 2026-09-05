/**
 * Sidebar & Navbar appearance.
 * Each color is optional — empty means "inherit from the current light/dark theme".
 * Values are applied as CSS variables on the layout root (see useLayoutTheme).
 */
export const SIDEBAR_DEFAULTS = {
  preset: "default",
  bg: "",
  text: "",
  muted: "",
  hoverBg: "",
  activeBg: "",
  activeText: "",
  border: "",
  width: 250,
  collapsedWidth: 72,
  radius: 8,
  itemHeight: 44,
  iconSize: 18,
  logoSize: 36,
  logoAlign: "left",
  childIndent: 38,
  dotStyle: "dot",
  chevronStyle: "chevron",
  shadow: false,
  showBorder: true,
  showGroupChevrons: true,
  compact: false,
};

export const NAVBAR_DEFAULTS = {
  preset: "default",
  bg: "",
  text: "",
  border: "",
  height: 64,
  iconColor: "",
  shadow: false,
  showBorder: true,
  blur: true,
  sticky: true,
  showBreadcrumb: true,
  showProfile: true,
  showSearch: true,
  showCurrency: true,
  showTheme: true,
  showLanguage: true,
  showNotifications: true,
};

export const LAYOUT_THEME_DEFAULTS = { sidebar: SIDEBAR_DEFAULTS, navbar: NAVBAR_DEFAULTS };

/** Ready-made looks. `null` fields fall back to the theme (light/dark) colors. */
export const SIDEBAR_PRESETS = {
  default: { labelKey: "layout.presetDefault", colors: {} },
  clean: { labelKey: "layout.presetClean", colors: { bg: "#ffffff", text: "#334155", muted: "#94a3b8", hoverBg: "#f8fafc", activeBg: "#eef2fb", activeText: "#2d4a9e", border: "#f1f5f9" }, layout: { radius: 10, shadow: false } },
  minimal: { labelKey: "layout.presetMinimal", colors: {}, layout: { showBorder: false, showGroupChevrons: false, radius: 6, dotStyle: "none" } },
  modern: { labelKey: "layout.presetModern", colors: { bg: "#0f172a", text: "#cbd5e1", muted: "#64748b", hoverBg: "#1e293b", activeBg: "#2d4a9e", activeText: "#ffffff", border: "#1e293b" }, layout: { radius: 12, shadow: true } },
  compact: { labelKey: "layout.presetCompact", colors: {}, layout: { compact: true, width: 230, itemHeight: 38, iconSize: 16, childIndent: 32 } },
  dark: { labelKey: "layout.presetDark", colors: { bg: "#111a2e", text: "#b3bfd3", muted: "#8592ab", hoverBg: "#182640", activeBg: "rgb(99 131 219 / 0.24)", activeText: "#b7c6ec", border: "#233049" } },
  navy: { labelKey: "layout.presetNavy", colors: { bg: "#1f326b", text: "#e2e8f0", muted: "#94a3b8", hoverBg: "#263e85", activeBg: "#2d4a9e", activeText: "#ffffff", border: "#263e85" } },
  midnight: { labelKey: "layout.presetMidnight", colors: { bg: "#0f172a", text: "#e2e8f0", muted: "#94a3b8", hoverBg: "#1e293b", activeBg: "#1e3a8a", activeText: "#ffffff", border: "#1e293b" } },
  slate: { labelKey: "layout.presetSlate", colors: { bg: "#f8fafc", text: "#0f172a", muted: "#64748b", hoverBg: "#e2e8f0", activeBg: "#dbeafe", activeText: "#1d4ed8", border: "#e2e8f0" } },
  forest: { labelKey: "layout.presetForest", colors: { bg: "#14532d", text: "#dcfce7", muted: "#86efac", hoverBg: "#166534", activeBg: "#16a34a", activeText: "#ffffff", border: "#166534" } },
  plum: { labelKey: "layout.presetPlum", colors: { bg: "#3b0764", text: "#f3e8ff", muted: "#c4b5fd", hoverBg: "#4c1d95", activeBg: "#7c3aed", activeText: "#ffffff", border: "#4c1d95" } },
};

export const NAVBAR_PRESETS = {
  default: { labelKey: "layout.presetDefault", colors: {} },
  clean: { labelKey: "layout.presetClean", colors: { bg: "#ffffff", text: "#0f172a", border: "#f1f5f9" }, layout: { blur: false } },
  minimal: { labelKey: "layout.presetMinimal", colors: {}, layout: { showBorder: false, showBreadcrumb: false, height: 56 } },
  modern: { labelKey: "layout.presetModern", colors: { bg: "#0f172a", text: "#e2e8f0", border: "#1e293b" }, layout: { shadow: true } },
  compact: { labelKey: "layout.presetCompact", colors: {}, layout: { height: 56 } },
  dark: { labelKey: "layout.presetDark", colors: { bg: "#111a2e", text: "#f1f5f9", border: "#233049" } },
  navy: { labelKey: "layout.presetNavy", colors: { bg: "#2d4a9e", text: "#ffffff", border: "#263e85" } },
  midnight: { labelKey: "layout.presetMidnight", colors: { bg: "#0f172a", text: "#e2e8f0", border: "#1e293b" } },
  slate: { labelKey: "layout.presetSlate", colors: { bg: "#f8fafc", text: "#0f172a", border: "#e2e8f0" } },
  forest: { labelKey: "layout.presetForest", colors: { bg: "#14532d", text: "#dcfce7", border: "#166534" } },
  plum: { labelKey: "layout.presetPlum", colors: { bg: "#3b0764", text: "#f3e8ff", border: "#4c1d95" } },
};

export const SIDEBAR_COLOR_FIELDS = [
  { key: "bg", labelKey: "layout.background" },
  { key: "text", labelKey: "layout.textColor" },
  { key: "muted", labelKey: "layout.mutedColor" },
  { key: "hoverBg", labelKey: "layout.hoverBackground" },
  { key: "activeBg", labelKey: "layout.activeBackground" },
  { key: "activeText", labelKey: "layout.activeText" },
  { key: "border", labelKey: "layout.borderColor" },
];

export const NAVBAR_COLOR_FIELDS = [
  { key: "bg", labelKey: "layout.background" },
  { key: "text", labelKey: "layout.textColor" },
  { key: "iconColor", labelKey: "layout.iconColor" },
  { key: "border", labelKey: "layout.borderColor" },
];

const clamp = (v, min, max, fallback) => {
  const n = Number(v);
  return Number.isFinite(n) ? Math.min(max, Math.max(min, n)) : fallback;
};

export function normalizeLayoutTheme(raw) {
  const s = { ...SIDEBAR_DEFAULTS, ...(raw?.sidebar || {}) };
  const n = { ...NAVBAR_DEFAULTS, ...(raw?.navbar || {}) };
  s.width = clamp(s.width, 220, 320, 250);
  s.collapsedWidth = clamp(s.collapsedWidth, 64, 96, 72);
  s.radius = clamp(s.radius, 0, 14, 8);
  s.itemHeight = clamp(s.itemHeight, 36, 52, 44);
  s.iconSize = clamp(s.iconSize, 16, 22, 18);
  s.logoSize = clamp(s.logoSize, 28, 48, 36);
  s.childIndent = clamp(s.childIndent, 24, 56, 38);
  if (!["left", "center"].includes(s.logoAlign)) s.logoAlign = "left";
  if (!["dot", "dash", "none"].includes(s.dotStyle)) s.dotStyle = "dot";
  if (!["chevron", "plus", "none"].includes(s.chevronStyle)) s.chevronStyle = "chevron";
  n.height = clamp(n.height, 56, 80, 64);
  if (!SIDEBAR_PRESETS[s.preset]) s.preset = "custom";
  if (!NAVBAR_PRESETS[n.preset]) n.preset = "custom";
  return { sidebar: s, navbar: n };
}

/** Relative luminance helper → decide if a custom background is dark (for auto-contrast). */
export function isDarkColor(hex) {
  if (!hex || !/^#[0-9a-f]{6}$/i.test(hex)) return null;
  const r = parseInt(hex.slice(1, 3), 16) / 255;
  const g = parseInt(hex.slice(3, 5), 16) / 255;
  const b = parseInt(hex.slice(5, 7), 16) / 255;
  const lin = (c) => (c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4);
  return 0.2126 * lin(r) + 0.7152 * lin(g) + 0.0722 * lin(b) < 0.4;
}

/** Derive sensible text/hover/active colors when the user only picked a background. */
export function autoColors(colors = {}) {
  const dark = isDarkColor(colors.bg);
  if (dark === null) return colors;
  const auto = dark
    ? { text: "#e2e8f0", muted: "#94a3b8", hoverBg: "rgba(255,255,255,0.08)", activeBg: "rgba(255,255,255,0.14)", activeText: "#ffffff", border: "rgba(255,255,255,0.10)" }
    : { text: "#0f172a", muted: "#64748b", hoverBg: "rgba(15,23,42,0.05)", activeBg: "rgba(45,74,158,0.12)", activeText: "#2d4a9e", border: "rgba(15,23,42,0.08)" };
  const out = { ...colors };
  Object.entries(auto).forEach(([k, v]) => {
    if (!out[k]) out[k] = v;
  });
  return out;
}
