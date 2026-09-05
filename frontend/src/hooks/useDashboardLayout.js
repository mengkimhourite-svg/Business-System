import { useCallback, useEffect, useMemo } from "react";
import { useLocalStorage } from "./index.js";
import { CARD_IDS, DEFAULT_DASHBOARD_LAYOUT } from "../config/dashboardCards.js";
import { syncPreference } from "../services/preferences.js";

function normalize(raw) {
  const src = raw && typeof raw === "object" ? raw : DEFAULT_DASHBOARD_LAYOUT;
  const order = Array.isArray(src.order) ? src.order.filter((k) => CARD_IDS.includes(k)) : [];
  CARD_IDS.forEach((k) => {
    if (!order.includes(k)) order.push(k);
  });
  const hidden = (Array.isArray(src.hidden) ? src.hidden : DEFAULT_DASHBOARD_LAYOUT.hidden).filter((k) => CARD_IDS.includes(k));
  const columns = [2, 3, 4].includes(Number(src.columns)) ? Number(src.columns) : 3;
  const styles = src.styles && typeof src.styles === "object" ? src.styles : {};
  const widths = src.widths && typeof src.widths === "object" ? src.widths : {};
  return { order, hidden, columns, styles, widths };
}

/** Persisted, per-user dashboard KPI layout: order, visibility, columns and per-card design. */
export function useDashboardLayout(userId) {
  const key = `sbs.dashboard.${userId ?? "guest"}`;
  const [stored, setStored] = useLocalStorage(key, null);
  const layout = useMemo(() => normalize(stored), [stored]);
  useEffect(() => {
    if (userId) syncPreference(key, stored);
  }, [key, stored, userId]);

  const patch = useCallback(
    (fn) =>
      setStored((prev) => {
        const cur = normalize(prev);
        return { ...cur, ...fn(cur) };
      }),
    [setStored]
  );

  const actions = useMemo(
    () => ({
      setColumns: (n) => patch(() => ({ columns: [2, 3, 4].includes(Number(n)) ? Number(n) : 3 })),
      setVisible: (id, visible) => patch((l) => ({ hidden: visible ? l.hidden.filter((k) => k !== id) : l.hidden.includes(id) ? l.hidden : [...l.hidden, id] })),
      /** Move `fromId` to the position of `toId`. */
      move: (fromId, toId) =>
        patch((l) => {
          if (fromId === toId) return {};
          const order = [...l.order];
          const from = order.indexOf(fromId);
          const to = order.indexOf(toId);
          if (from < 0 || to < 0) return {};
          order.splice(from, 1);
          order.splice(to, 0, fromId);
          return { order };
        }),
      /** Move by ±1 among visible cards (or all cards when visibleOnly=false). */
      moveBy: (id, delta, visibleOnly = true) =>
        patch((l) => {
          const list = visibleOnly ? l.order.filter((k) => !l.hidden.includes(k)) : l.order;
          const i = list.indexOf(id);
          const j = i + delta;
          if (i < 0 || j < 0 || j >= list.length) return {};
          const target = list[j];
          const order = l.order.filter((k) => k !== id);
          const to = order.indexOf(target);
          order.splice(delta > 0 ? to + 1 : to, 0, id);
          return { order };
        }),
      setWidth: (id, span) => patch((l) => ({ widths: { ...l.widths, [id]: [1, 2].includes(Number(span)) ? Number(span) : 1 } })),
      setStyle: (id, stylePatch) => patch((l) => ({ styles: { ...l.styles, [id]: { ...(l.styles[id] || {}), ...stylePatch } } })),
      resetStyle: (id) =>
        patch((l) => {
          const styles = { ...l.styles };
          delete styles[id];
          return { styles };
        }),
      reset: () => setStored(null),
    }),
    [patch, setStored]
  );

  return { layout, ...actions };
}
