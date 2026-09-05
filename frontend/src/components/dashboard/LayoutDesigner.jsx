import { useState } from "react";
import { PanelLeft, PanelTop, RotateCcw, Pipette, Check } from "lucide-react";
import { cn } from "../../utils/cn.js";
import { useI18n } from "../../i18n/index.jsx";
import { useLayoutTheme } from "../../context/LayoutThemeContext.jsx";
import { SIDEBAR_PRESETS, NAVBAR_PRESETS, SIDEBAR_COLOR_FIELDS, NAVBAR_COLOR_FIELDS, autoColors } from "../../config/layoutThemes.js";
import { Field, Switch, Tabs, Button, Segmented } from "../ui/index.js";

const SWATCHES = ["#ffffff", "#f8fafc", "#eef2fb", "#2d4a9e", "#1f326b", "#0f172a", "#14532d", "#3b0764", "#7c3aed", "#0891b2", "#16a34a", "#d97706", "#dc2626", "#64748b", "#e2e8f0"];

function ColorRow({ label, value, onChange, autoLabel }) {
  return (
    <div className="flex flex-col gap-1.5 sm:flex-row sm:items-center sm:justify-between">
      <span className="text-sm text-fg-secondary">{label}</span>
      <div className="flex flex-wrap items-center gap-1.5">
        {SWATCHES.map((c) => (
          <button
            key={c}
            type="button"
            onClick={() => onChange(c)}
            aria-label={`${label}: ${c}`}
            aria-pressed={value === c}
            className={cn("h-5 w-5 rounded-full border border-border transition-transform hover:scale-110 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40", value === c && "ring-2 ring-primary ring-offset-1")}
            style={{ backgroundColor: c }}
          />
        ))}
        <label className="relative flex h-5 w-5 cursor-pointer items-center justify-center rounded-full border border-dashed border-border-strong text-fg-muted hover:text-fg" title={label}>
          <Pipette className="h-3 w-3" aria-hidden="true" />
          <input type="color" value={/^#[0-9a-f]{6}$/i.test(value || "") ? value : "#2d4a9e"} onChange={(e) => onChange(e.target.value)} className="absolute inset-0 h-full w-full cursor-pointer opacity-0" aria-label={label} />
        </label>
        <button type="button" onClick={() => onChange("")} className={cn("rounded-md px-2 py-0.5 text-xs font-medium transition-colors", !value ? "bg-muted text-fg" : "text-fg-muted hover:text-fg")}>
          {autoLabel}
        </button>
      </div>
    </div>
  );
}

function PresetGrid({ presets, current, onPick, part }) {
  const { t } = useI18n();
  return (
    <div className="grid grid-cols-3 gap-2 sm:grid-cols-4 lg:grid-cols-7" role="radiogroup" aria-label={t("layout.presets")}>
      {Object.entries(presets).map(([key, p]) => {
        const c = autoColors({ ...p.colors });
        const bg = c.bg || "var(--surface)";
        const active = current === key;
        return (
          <button
            key={key}
            type="button"
            role="radio"
            aria-checked={active}
            onClick={() => onPick(key)}
            className={cn("group flex flex-col items-center gap-1.5 rounded-lg border p-2 text-xs font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30", active ? "border-primary bg-primary-50 text-primary-700" : "border-border text-fg-secondary hover:bg-surface-hover")}
          >
            <span className="relative flex h-9 w-full overflow-hidden rounded-md border border-border" style={{ backgroundColor: "var(--background)" }} aria-hidden="true">
              {part === "sidebar" ? (
                <span className="flex h-full w-[38%] flex-col gap-1 p-1" style={{ backgroundColor: bg }}>
                  <span className="h-1 w-3/4 rounded" style={{ backgroundColor: c.text || "var(--fg-secondary)", opacity: 0.6 }} />
                  <span className="h-1.5 w-full rounded" style={{ backgroundColor: c.activeBg || "var(--primary-50)" }} />
                  <span className="h-1 w-2/3 rounded" style={{ backgroundColor: c.text || "var(--fg-secondary)", opacity: 0.4 }} />
                </span>
              ) : (
                <span className="flex h-3 w-full items-center gap-1 px-1" style={{ backgroundColor: bg }}>
                  <span className="h-1 w-6 rounded" style={{ backgroundColor: c.text || "var(--fg)", opacity: 0.6 }} />
                  <span className="ml-auto h-1.5 w-1.5 rounded-full" style={{ backgroundColor: c.text || "var(--fg)", opacity: 0.5 }} />
                </span>
              )}
            </span>
            <span className="flex items-center gap-1">
              {active && <Check className="h-3 w-3" aria-hidden="true" />}
              {t(p.labelKey)}
            </span>
          </button>
        );
      })}
    </div>
  );
}

function Range({ label, value, min, max, step = 1, unit = "px", onChange, id }) {
  return (
    <Field label={`${label}: ${value}${unit}`} htmlFor={id}>
      <input id={id} type="range" min={min} max={max} step={step} value={value} onChange={(e) => onChange(Number(e.target.value))} className="h-2 w-full cursor-pointer accent-primary" />
    </Field>
  );
}

/** "Sidebar & Navbar" section of Dashboard Setting. Every change applies live and is saved per user. */
export function LayoutDesigner() {
  const { t } = useI18n();
  const { theme, setSidebar, setNavbar, applyPreset, reset } = useLayoutTheme();
  const [part, setPart] = useState("sidebar");
  const sb = theme.sidebar;
  const nb = theme.navbar;

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <Tabs
          variant="pills"
          size="sm"
          value={part}
          onChange={setPart}
          tabs={[
            { key: "sidebar", label: t("layout.sidebar"), icon: PanelLeft },
            { key: "navbar", label: t("layout.navbar"), icon: PanelTop },
          ]}
        />
        <Button variant="ghost" size="sm" leftIcon={RotateCcw} onClick={() => reset(part)}>
          {t("layout.resetPart", { part: part === "sidebar" ? t("layout.sidebar") : t("layout.navbar") })}
        </Button>
      </div>
      <p className="text-xs text-fg-muted">{t("layout.hint")}</p>

      {part === "sidebar" ? (
        <>
          <section>
            <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-fg-muted">{t("layout.presets")}</p>
            <PresetGrid presets={SIDEBAR_PRESETS} current={sb.preset} onPick={(k) => applyPreset("sidebar", k)} part="sidebar" />
          </section>
          <section className="space-y-3">
            <p className="text-xs font-semibold uppercase tracking-wide text-fg-muted">{t("dashboard.colors")}</p>
            {SIDEBAR_COLOR_FIELDS.map((f) => (
              <ColorRow key={f.key} label={t(f.labelKey)} value={sb[f.key] || ""} onChange={(v) => setSidebar({ [f.key]: v })} autoLabel={t("common.auto")} />
            ))}
          </section>
          <section className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Range id="sb-width" label={t("layout.width")} value={sb.width} min={220} max={320} step={10} onChange={(v) => setSidebar({ width: v })} />
            <Range id="sb-collapsed" label={t("layout.collapsedWidth")} value={sb.collapsedWidth} min={64} max={96} step={4} onChange={(v) => setSidebar({ collapsedWidth: v })} />
            <Range id="sb-radius" label={t("layout.radius")} value={sb.radius} min={0} max={14} step={2} onChange={(v) => setSidebar({ radius: v })} />
            <Range id="sb-item-h" label={t("layout.itemHeight")} value={sb.itemHeight} min={36} max={52} step={2} onChange={(v) => setSidebar({ itemHeight: v })} />
            <Range id="sb-icon" label={t("layout.iconSize")} value={sb.iconSize} min={16} max={22} step={1} onChange={(v) => setSidebar({ iconSize: v })} />
            <Range id="sb-logo" label={t("layout.logoSize")} value={sb.logoSize} min={28} max={48} step={2} onChange={(v) => setSidebar({ logoSize: v })} />
            <Range id="sb-indent" label={t("layout.childIndent")} value={sb.childIndent} min={24} max={56} step={2} onChange={(v) => setSidebar({ childIndent: v })} />
            <Field label={t("layout.logoAlign")}>
              <Segmented label={t("layout.logoAlign")} value={sb.logoAlign} onChange={(v) => setSidebar({ logoAlign: v })} options={[{ value: "left", label: t("layout.alignLeft") }, { value: "center", label: t("layout.alignCenter") }]} />
            </Field>
            <Field label={t("layout.dotStyle")}>
              <Segmented label={t("layout.dotStyle")} value={sb.dotStyle} onChange={(v) => setSidebar({ dotStyle: v })} options={[{ value: "dot", label: "•" }, { value: "dash", label: "—" }, { value: "none", label: t("common.none") }]} />
            </Field>
            <Field label={t("layout.chevronStyle")}>
              <Segmented label={t("layout.chevronStyle")} value={sb.chevronStyle} onChange={(v) => setSidebar({ chevronStyle: v })} options={[{ value: "chevron", label: "›" }, { value: "plus", label: "+" }, { value: "none", label: t("common.none") }]} />
            </Field>
            <div className="rounded-md border border-border px-3 py-2.5">
              <Switch checked={sb.shadow} onChange={(v) => setSidebar({ shadow: v })} label={t("layout.shadow")} />
            </div>
            <div className="rounded-md border border-border px-3 py-2.5">
              <Switch checked={sb.showBorder} onChange={(v) => setSidebar({ showBorder: v })} label={t("layout.showBorder")} />
            </div>
            <div className="rounded-md border border-border px-3 py-2.5">
              <Switch checked={sb.showGroupChevrons} onChange={(v) => setSidebar({ showGroupChevrons: v })} label={t("layout.showChevrons")} />
            </div>
            <div className="rounded-md border border-border px-3 py-2.5 sm:col-span-2">
              <Switch checked={sb.compact} onChange={(v) => setSidebar({ compact: v })} label={t("layout.compact")} description={t("layout.compactHint")} />
            </div>
          </section>
        </>
      ) : (
        <>
          <section>
            <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-fg-muted">{t("layout.presets")}</p>
            <PresetGrid presets={NAVBAR_PRESETS} current={nb.preset} onPick={(k) => applyPreset("navbar", k)} part="navbar" />
          </section>
          <section className="space-y-3">
            <p className="text-xs font-semibold uppercase tracking-wide text-fg-muted">{t("dashboard.colors")}</p>
            {NAVBAR_COLOR_FIELDS.map((f) => (
              <ColorRow key={f.key} label={t(f.labelKey)} value={nb[f.key] || ""} onChange={(v) => setNavbar({ [f.key]: v })} autoLabel={t("common.auto")} />
            ))}
          </section>
          <section className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Range id="nb-height" label={t("layout.height")} value={nb.height} min={56} max={80} step={4} onChange={(v) => setNavbar({ height: v })} />
            <div className="rounded-md border border-border px-3 py-2.5">
              <Switch checked={nb.sticky} onChange={(v) => setNavbar({ sticky: v })} label={t("layout.sticky")} />
            </div>
            <div className="rounded-md border border-border px-3 py-2.5">
              <Switch checked={nb.showBorder} onChange={(v) => setNavbar({ showBorder: v })} label={t("layout.showBorder")} />
            </div>
            <div className="rounded-md border border-border px-3 py-2.5">
              <Switch checked={nb.blur} onChange={(v) => setNavbar({ blur: v })} label={t("layout.blur")} />
            </div>
            <div className="rounded-md border border-border px-3 py-2.5">
              <Switch checked={nb.shadow} onChange={(v) => setNavbar({ shadow: v })} label={t("layout.shadow")} />
            </div>
          </section>
          <section>
            <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-fg-muted">{t("layout.navbarItems")}</p>
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
              {[
                ["showBreadcrumb", "layout.itemBreadcrumb"],
                ["showSearch", "layout.itemSearch"],
                ["showCurrency", "layout.itemCurrency"],
                ["showTheme", "layout.itemTheme"],
                ["showLanguage", "layout.itemLanguage"],
                ["showNotifications", "layout.itemNotifications"],
                ["showProfile", "layout.itemProfile"],
              ].map(([k, l]) => (
                <div key={k} className="rounded-md border border-border px-3 py-2.5">
                  <Switch checked={!!nb[k]} onChange={(v) => setNavbar({ [k]: v })} label={t(l)} />
                </div>
              ))}
            </div>
          </section>
        </>
      )}
    </div>
  );
}
