import { useEffect, useState } from "react";
import { ArrowLeft, ChevronDown, ChevronUp, GripVertical, Palette, RotateCcw, Pipette, LayoutGrid, PanelLeft } from "lucide-react";
import { cn } from "../../utils/cn.js";
import { useI18n } from "../../i18n/index.jsx";
import { CARD_ICONS } from "../../config/dashboardCards.js";
import { StatCard } from "../data-display/StatCard.jsx";
import { Modal, Button, Switch, Checkbox, Select, Field, Tooltip, Tabs, Segmented } from "../ui/index.js";
import { LayoutDesigner } from "./LayoutDesigner.jsx";

const COLOR_SWATCHES = ["#2d4a9e", "#0891b2", "#16a34a", "#d97706", "#dc2626", "#7c3aed", "#db2777", "#0f172a", "#64748b", "#ffffff"];
const BG_SWATCHES = ["#ffffff", "#eef2fb", "#ecfeff", "#dcfce7", "#fef3c7", "#fee2e2", "#f3e8ff", "#1e293b", "#0f172a", "#2d4a9e"];

function ColorField({ label, value, onChange, swatches, autoLabel }) {
  return (
    <div>
      <p className="mb-1.5 text-xs font-medium text-fg-secondary">{label}</p>
      <div className="flex flex-wrap items-center gap-1.5">
        {swatches.map((c) => (
          <button
            key={c}
            type="button"
            onClick={() => onChange(c)}
            aria-label={`${label}: ${c}`}
            aria-pressed={value === c}
            className={cn("h-6 w-6 rounded-full border border-border transition-transform hover:scale-110 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40", value === c && "ring-2 ring-primary ring-offset-2")}
            style={{ backgroundColor: c }}
          />
        ))}
        <label className="relative flex h-6 w-6 cursor-pointer items-center justify-center rounded-full border border-dashed border-border-strong text-fg-muted hover:text-fg" title={label}>
          <Pipette className="h-3 w-3" aria-hidden="true" />
          <input type="color" value={value || "#2d4a9e"} onChange={(e) => onChange(e.target.value)} className="absolute inset-0 h-full w-full cursor-pointer opacity-0" aria-label={label} />
        </label>
        <button type="button" onClick={() => onChange("")} className={cn("rounded-md px-2 py-0.5 text-xs font-medium transition-colors", !value ? "bg-muted text-fg" : "text-fg-muted hover:text-fg")}>
          {autoLabel}
        </button>
      </div>
    </div>
  );
}

/**
 * Dashboard customizer: layout (columns), card visibility + ordering, and per-card design.
 * `cards` are the resolved KPI cards (with live values) used for previews.
 */
export function DashboardCustomizer({ open, onClose, layout, actions, cards, initialCard }) {
  const { t } = useI18n();
  const [view, setView] = useState("list");
  const [section, setSection] = useState("cards");
  const [activeId, setActiveId] = useState(null);
  const [dragId, setDragId] = useState(null);

  useEffect(() => {
    if (!open) return;
    if (initialCard) {
      setActiveId(initialCard);
      setView("design");
      setSection("cards");
    } else {
      setView("list");
      setActiveId(null);
    }
  }, [open, initialCard]);

  const byId = Object.fromEntries(cards.map((c) => [c.id, c]));
  const ordered = layout.order.map((id) => byId[id]).filter(Boolean);
  const visibleCount = ordered.filter((c) => !layout.hidden.includes(c.id)).length;
  const active = activeId ? byId[activeId] : null;
  const style = (active && layout.styles[active.id]) || {};
  const setStyle = (patch) => actions.setStyle(active.id, patch);
  const openDesign = (id) => {
    setActiveId(id);
    setView("design");
  };

  const listView = (
    <div className="space-y-6">
      <section>
        <h3 className="text-sm font-semibold text-fg">{t("dashboard.layout")}</h3>
        <p className="mt-0.5 text-xs text-fg-muted">{t("dashboard.customizeHint")}</p>
        <div className="mt-3 flex flex-wrap items-center gap-3">
          <span className="text-sm text-fg-secondary">{t("dashboard.columns")}</span>
          <Segmented label={t("dashboard.columns")} value={layout.columns} onChange={actions.setColumns} options={[2, 3, 4].map((n) => ({ value: n, label: String(n) }))} />
        </div>
      </section>

      <section>
        <div className="flex items-center justify-between gap-3">
          <div>
            <h3 className="text-sm font-semibold text-fg">{t("dashboard.cards")}</h3>
            <p className="text-xs text-fg-muted">{t("dashboard.visibleCards", { visible: visibleCount, total: ordered.length })}</p>
          </div>
          <Button variant="ghost" size="sm" leftIcon={RotateCcw} onClick={actions.reset}>
            {t("dashboard.resetLayout")}
          </Button>
        </div>
        <ul className="mt-3 space-y-2">
          {ordered.map((c, index) => {
            const hidden = layout.hidden.includes(c.id);
            const Icon = c.icon;
            return (
              <li
                key={c.id}
                draggable
                onDragStart={(e) => {
                  e.dataTransfer.effectAllowed = "move";
                  setDragId(c.id);
                }}
                onDragEnd={() => setDragId(null)}
                onDragOver={(e) => {
                  if (dragId && dragId !== c.id) e.preventDefault();
                }}
                onDrop={(e) => {
                  e.preventDefault();
                  if (dragId && dragId !== c.id) actions.move(dragId, c.id);
                  setDragId(null);
                }}
                className={cn("flex items-center gap-3 rounded-lg border border-border bg-surface px-3 py-2 transition-opacity", dragId === c.id && "opacity-40", hidden && "bg-surface-muted")}
              >
                <GripVertical className="h-4 w-4 shrink-0 cursor-grab text-fg-muted" aria-hidden="true" />
                <span className={cn("flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-primary-50 text-accent", hidden && "opacity-50")} aria-hidden="true">
                  {Icon && <Icon className="h-4 w-4" />}
                </span>
                <span className={cn("min-w-0 flex-1 truncate text-sm font-medium", hidden ? "text-fg-muted" : "text-fg")}>{c.label}</span>
                <div className="flex items-center gap-0.5">
                  <Tooltip content={t("dashboard.moveUp")}>
                    <Button variant="ghost" size="sm" icon onClick={() => actions.moveBy(c.id, -1, false)} disabled={index === 0} aria-label={t("dashboard.moveUp")}>
                      <ChevronUp className="h-4 w-4" />
                    </Button>
                  </Tooltip>
                  <Tooltip content={t("dashboard.moveDown")}>
                    <Button variant="ghost" size="sm" icon onClick={() => actions.moveBy(c.id, 1, false)} disabled={index === ordered.length - 1} aria-label={t("dashboard.moveDown")}>
                      <ChevronDown className="h-4 w-4" />
                    </Button>
                  </Tooltip>
                  <Segmented label={t("dashboard.cardWidth")} value={layout.widths?.[c.id] || 1} onChange={(v) => actions.setWidth(c.id, v)} options={[{ value: 1, label: "1×" }, { value: 2, label: "2×" }]} />
                  <Button variant="outline" size="xs" leftIcon={Palette} onClick={() => openDesign(c.id)} className="ml-1">
                    <span className="hidden sm:inline">{t("dashboard.design")}</span>
                  </Button>
                </div>
                <Switch checked={!hidden} onChange={(v) => actions.setVisible(c.id, v)} ariaLabel={`${hidden ? t("dashboard.showCard") : t("dashboard.hideCard")}: ${c.label}`} className="ml-1" />
              </li>
            );
          })}
        </ul>
      </section>
    </div>
  );

  const designView = active && (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <Button variant="ghost" size="sm" leftIcon={ArrowLeft} onClick={() => setView("list")}>
          {t("dashboard.backToCards")}
        </Button>
        <Button variant="ghost" size="sm" leftIcon={RotateCcw} onClick={() => actions.resetStyle(active.id)} disabled={!layout.styles[active.id]}>
          {t("dashboard.resetCard")}
        </Button>
      </div>

      <section>
        <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-fg-muted">{t("common.preview")}</p>
        <div className="rounded-lg bg-background p-4">
          <div className="mx-auto max-w-sm">
            <StatCard label={active.label} value={active.value} change={active.change} hint={active.hint} tone={active.tone} icon={CARD_ICONS[style.icon] || active.icon} appearance={style} />
          </div>
        </div>
      </section>

      <section>
        <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-fg-muted">{t("dashboard.icon")}</p>
        <div className="flex flex-wrap gap-1.5">
          {Object.entries(CARD_ICONS).map(([name, Icon]) => {
            const selected = (style.icon || active.defaultIcon) === name;
            return (
              <button
                key={name}
                type="button"
                onClick={() => setStyle({ icon: name })}
                aria-label={name}
                aria-pressed={selected}
                className={cn(
                  "flex h-9 w-9 items-center justify-center rounded-md border transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30",
                  selected ? "border-primary bg-primary-50 text-accent" : "border-border text-fg-secondary hover:bg-surface-hover hover:text-fg"
                )}
              >
                <Icon className="h-4 w-4" />
              </button>
            );
          })}
        </div>
      </section>

      <section>
        <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-fg-muted">{t("dashboard.colors")}</p>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <ColorField label={t("dashboard.background")} value={style.bg || ""} onChange={(v) => setStyle({ bg: v })} swatches={BG_SWATCHES} autoLabel={t("common.auto")} />
          <ColorField label={t("dashboard.textColor")} value={style.text || ""} onChange={(v) => setStyle({ text: v })} swatches={COLOR_SWATCHES} autoLabel={t("common.auto")} />
          <ColorField label={t("dashboard.valueColor")} value={style.value || ""} onChange={(v) => setStyle({ value: v })} swatches={COLOR_SWATCHES} autoLabel={t("common.auto")} />
          <ColorField label={t("dashboard.iconColor")} value={style.iconColor || ""} onChange={(v) => setStyle({ iconColor: v })} swatches={COLOR_SWATCHES} autoLabel={t("common.auto")} />
          <ColorField label={t("dashboard.iconBackground")} value={style.iconBg || ""} onChange={(v) => setStyle({ iconBg: v })} swatches={BG_SWATCHES} autoLabel={t("common.auto")} />
          <ColorField label={t("dashboard.borderColor")} value={style.borderColor || ""} onChange={(v) => setStyle({ borderColor: v })} swatches={COLOR_SWATCHES} autoLabel={t("common.auto")} />
        </div>
      </section>

      <section className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Field label={t("dashboard.borders")}>
          <div className="flex flex-wrap gap-x-4 gap-y-2 pt-1">
            {["top", "right", "bottom", "left"].map((side) => (
              <Checkbox key={side} label={t(`dashboard.border${side[0].toUpperCase()}${side.slice(1)}`)} checked={!!style.borders?.[side]} onChange={(e) => setStyle({ borders: { ...(style.borders || {}), [side]: e.target.checked } })} />
            ))}
          </div>
        </Field>
        <Field label={t("dashboard.borderWidth")} htmlFor="card-border-width">
          <Select id="card-border-width" value={String(style.borderWidth || 3)} onChange={(e) => setStyle({ borderWidth: Number(e.target.value) })} options={[1, 2, 3, 4, 6].map((n) => ({ value: String(n), label: `${n}px` }))} />
        </Field>
        <Field label={t("dashboard.font")} htmlFor="card-font">
          <Select
            id="card-font"
            value={style.font || "default"}
            onChange={(e) => setStyle({ font: e.target.value })}
            options={[
              { value: "default", label: t("dashboard.fontDefault") },
              { value: "khmer", label: t("dashboard.fontKhmer") },
              { value: "mono", label: t("dashboard.fontMono") },
              { value: "serif", label: t("dashboard.fontSerif") },
            ]}
          />
        </Field>
        <Field label={t("dashboard.valueSize")}>
          <Segmented
            label={t("dashboard.valueSize")}
            value={style.valueSize || "md"}
            onChange={(v) => setStyle({ valueSize: v })}
            options={[
              { value: "sm", label: t("dashboard.sizeSmall") },
              { value: "md", label: t("dashboard.sizeMedium") },
              { value: "lg", label: t("dashboard.sizeLarge") },
            ]}
          />
        </Field>
      </section>
    </div>
  );

  return (
    <Modal
      open={open}
      onClose={onClose}
      size="lg"
      title={view === "design" && active ? t("dashboard.designCard", { card: active.label }) : t("dashboard.customize")}
      footer={
        <Button onClick={onClose} className="w-full sm:w-auto">
          {t("common.done")}
        </Button>
      }
    >
      {view === "design" && active ? (
        designView
      ) : (
        <div className="space-y-5">
          <Tabs
            value={section}
            onChange={setSection}
            tabs={[
              { key: "cards", label: t("dashboard.sectionCards"), icon: LayoutGrid },
              { key: "layout", label: t("dashboard.sectionLayout"), icon: PanelLeft },
            ]}
          />
          {section === "cards" ? listView : <LayoutDesigner />}
        </div>
      )}
    </Modal>
  );
}
