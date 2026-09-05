import { useRef, useState } from "react";
import { GripVertical, Palette, EyeOff } from "lucide-react";
import { cn } from "../../utils/cn.js";
import { useI18n } from "../../i18n/index.jsx";
import { StatCard } from "../data-display/StatCard.jsx";
import { Tooltip } from "../ui/index.js";
import { StaggerGroup } from "../ui/Motion.jsx";

const COLS = { 2: "lg:grid-cols-2", 3: "lg:grid-cols-3", 4: "lg:grid-cols-4" };
const CTRL = "flex h-7 w-7 items-center justify-center rounded-full text-fg-muted transition-colors hover:bg-muted hover:text-fg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30";

function KpiTile({ card, loading, dnd, onMove, onMoveBy, onHide, onDesign, style }) {
  const { t } = useI18n();
  const ref = useRef(null);
  const { id, span, ...cardProps } = card;
  const { dragId, setDragId, overId, setOverId } = dnd;
  const isDragging = dragId === id;
  const isOver = overId === id && dragId && dragId !== id;

  const onDragStart = (e) => {
    e.dataTransfer.effectAllowed = "move";
    try {
      e.dataTransfer.setData("text/plain", id);
    } catch {
      /* some browsers throw for non-standard types */
    }
    if (ref.current && e.dataTransfer.setDragImage) e.dataTransfer.setDragImage(ref.current, 24, 24);
    setDragId(id);
  };
  const onDragEnd = () => {
    setDragId(null);
    setOverId(null);
  };
  const onDragOver = (e) => {
    if (!dragId || dragId === id) return;
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
    if (overId !== id) setOverId(id);
  };
  const onDrop = (e) => {
    e.preventDefault();
    const source = dragId || e.dataTransfer.getData("text/plain");
    if (source && source !== id) onMove(source, id);
    setDragId(null);
    setOverId(null);
  };
  const onKeyDown = (e) => {
    const map = { ArrowLeft: -1, ArrowUp: -1, ArrowRight: 1, ArrowDown: 1 };
    if (map[e.key]) {
      e.preventDefault();
      onMoveBy(id, map[e.key]);
    }
  };

  return (
    <div
      ref={ref}
      style={style}
      onDragOver={onDragOver}
      onDragLeave={() => overId === id && setOverId(null)}
      onDrop={onDrop}
      className={cn("group relative min-w-0 rounded-lg transition-[opacity,box-shadow]", card.span === 2 && "sm:col-span-2", isDragging && "opacity-40", isOver && "ring-2 ring-primary/50 ring-offset-2")}
    >
      <StatCard {...cardProps} loading={loading} className="h-full w-full" />
      {!loading && (
        <div className="pointer-events-none absolute -top-3 left-1/2 z-10 -translate-x-1/2 opacity-0 transition-opacity focus-within:pointer-events-auto focus-within:opacity-100 group-hover:pointer-events-auto group-hover:opacity-100">
          <div className="flex items-center gap-0.5 rounded-full border border-border bg-surface-elevated p-0.5 shadow-md">
            <Tooltip content={t("dashboard.dragToReorder")}>
              <button type="button" draggable onDragStart={onDragStart} onDragEnd={onDragEnd} onKeyDown={onKeyDown} aria-label={t("dashboard.dragToReorder")} className={cn(CTRL, "cursor-grab active:cursor-grabbing")}>
                <GripVertical className="h-4 w-4" />
              </button>
            </Tooltip>
            <Tooltip content={t("dashboard.design")}>
              <button type="button" onClick={() => onDesign(id)} aria-label={t("dashboard.designCard", { card: card.label })} className={CTRL}>
                <Palette className="h-4 w-4" />
              </button>
            </Tooltip>
            <Tooltip content={t("dashboard.hideCard")}>
              <button type="button" onClick={() => onHide(id)} aria-label={t("dashboard.hideCard")} className={CTRL}>
                <EyeOff className="h-4 w-4" />
              </button>
            </Tooltip>
          </div>
        </div>
      )}
    </div>
  );
}

/** KPI card grid with hover controls: drag to reorder, restyle and hide. */
export function KpiGrid({ cards, columns = 3, loading, onMove, onMoveBy, onHide, onDesign }) {
  const [dragId, setDragId] = useState(null);
  const [overId, setOverId] = useState(null);
  const dnd = { dragId, setDragId, overId, setOverId };
  return (
    <StaggerGroup className={cn("grid grid-cols-1 gap-4 sm:grid-cols-2", COLS[columns] || COLS[3])} data-columns={columns}>
      {cards.map((card) => (
        <KpiTile key={card.id} card={card} loading={loading} dnd={dnd} onMove={onMove} onMoveBy={onMoveBy} onHide={onHide} onDesign={onDesign} />
      ))}
    </StaggerGroup>
  );
}
