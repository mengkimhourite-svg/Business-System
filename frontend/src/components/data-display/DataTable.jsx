import { ArrowUp, ArrowDown, ArrowUpDown } from "lucide-react";
import { cn } from "../../utils/cn.js";
import { Checkbox, TableSkeleton, EmptyState, ErrorState, Skeleton } from "../ui/index.js";
import { useI18n } from "../../i18n/index.jsx";

const ALIGN = { left: "text-left", right: "text-right", center: "text-center" };

function cellValue(col, row) {
  if (col.render) return col.render(row);
  const v = row[col.key];
  return v === null || v === undefined || v === "" ? <span className="text-fg-muted">—</span> : String(v);
}

export function CardGridSkeleton({ count = 8 }) {
  return (
    <div className="grid grid-cols-1 gap-3 p-4 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4" aria-busy="true">
      {Array.from({ length: count }).map((_, i) => (
        <Skeleton key={i} className="h-44 w-full rounded-lg" />
      ))}
    </div>
  );
}

function FieldList({ cols, row, className }) {
  return (
    <dl className={cn("grid grid-cols-2 gap-x-4 gap-y-2.5", className)}>
      {cols.map((col) => (
        <div key={col.key} className={cn("min-w-0", col.mobileFull && "col-span-2")}>
          <dt className="text-[11px] font-medium uppercase tracking-wide text-fg-muted">{col.header}</dt>
          <dd className="mt-0.5 truncate text-sm text-fg">{cellValue(col, row)}</dd>
        </div>
      ))}
    </dl>
  );
}

/**
 * Professional data table.
 * view="table": <table> on md+, compact list on mobile.
 * view="cards": responsive card grid on every breakpoint.
 */
export function DataTable({
  columns,
  data = [],
  rowKey = "id",
  loading = false,
  error = null,
  onRetry,
  selectable = false,
  selectedIds = [],
  onSelectionChange,
  sort,
  onSortChange,
  emptyState,
  actions,
  onRowClick,
  dense = false,
  hiddenColumns = [],
  className,
  skeletonRows = 6,
  view = "table",
  banner = null,
  highlightId = null,
}) {
  const { t } = useI18n();
  const visible = columns.filter((c) => !hiddenColumns.includes(c.key));
  const primary = visible.find((c) => c.primary) || visible[0];
  const secondary = visible.filter((c) => c !== primary);
  const mobileCols = secondary.filter((c) => !c.hideOnMobile);
  const cardCols = secondary.slice(0, 6);
  const ids = data.map((r) => r[rowKey]);
  const allSelected = ids.length > 0 && ids.every((id) => selectedIds.includes(id));
  const someSelected = ids.some((id) => selectedIds.includes(id));

  const toggleAll = () => {
    if (!onSelectionChange) return;
    if (allSelected) onSelectionChange(selectedIds.filter((id) => !ids.includes(id)));
    else onSelectionChange([...new Set([...selectedIds, ...ids])]);
  };
  const toggleOne = (id) => {
    if (!onSelectionChange) return;
    onSelectionChange(selectedIds.includes(id) ? selectedIds.filter((x) => x !== id) : [...selectedIds, id]);
  };
  const handleSort = (col) => {
    if (!col.sortable || !onSortChange) return;
    const dir = sort?.key === col.key && sort.dir === "asc" ? "desc" : "asc";
    onSortChange({ key: col.key, dir });
  };
  const rowLabel = (row) => `Select ${row.name || row.number || row.reference || row[rowKey]}`;
  const isHighlighted = (id) => highlightId !== null && highlightId !== undefined && String(id) === String(highlightId);
  const HIGHLIGHT = "bg-success-light/60 transition-colors duration-1000";

  if (error) return <ErrorState onRetry={onRetry} />;
  if (loading && data.length === 0) return view === "cards" ? <CardGridSkeleton /> : <TableSkeleton rows={skeletonRows} cols={Math.min(visible.length + 1, 6)} />;
  if (!loading && data.length === 0) return emptyState || <EmptyState title={t("common.noResults")} description={t("common.noResultsHint")} />;

  const py = dense ? "py-2" : "py-3";

  const renderPrimary = (row) =>
    onRowClick ? (
      <button type="button" onClick={() => onRowClick(row)} className="min-w-0 flex-1 rounded text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30">
        {cellValue(primary, row)}
      </button>
    ) : (
      <div className="min-w-0 flex-1">{cellValue(primary, row)}</div>
    );

  const renderCards = () => (
    <ul className="grid grid-cols-1 gap-3 p-4 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
      {data.map((row, index) => {
        const id = row[rowKey];
        const selected = selectedIds.includes(id);
        return (
          <li key={id} style={{ "--i": Math.min(index, 12) }} data-highlight={isHighlighted(id) ? "true" : undefined} className={cn("row-enter card-hover flex flex-col rounded-lg border bg-surface transition-colors", selected ? "border-primary-300 bg-primary-50/40" : isHighlighted(id) ? "border-success/40 bg-success-light/40" : "border-border", onRowClick && !selected && "hover:border-border-strong")}>
            <div className="flex items-start gap-3 p-4">
              {selectable && <Checkbox checked={selected} onChange={() => toggleOne(id)} aria-label={rowLabel(row)} className="mt-0.5" />}
              {renderPrimary(row)}
            </div>
            {cardCols.length > 0 && <FieldList cols={cardCols} row={row} className="border-t border-border px-4 py-3" />}
            {actions && <div className="mt-auto flex items-center justify-end border-t border-border px-2 py-1.5">{actions(row)}</div>}
          </li>
        );
      })}
    </ul>
  );

  const renderTable = () => (
    <table className="w-full min-w-[640px] border-collapse text-sm">
      <thead>
        <tr className="border-b border-border bg-surface-muted">
          {selectable && (
            <th scope="col" className="w-10 px-4 py-2.5">
              <Checkbox checked={allSelected} indeterminate={!allSelected && someSelected} onChange={toggleAll} aria-label={t("common.selectAll")} />
            </th>
          )}
          {visible.map((col) => (
            <th
              key={col.key}
              scope="col"
              style={col.width ? { width: col.width } : undefined}
              aria-sort={sort?.key === col.key ? (sort.dir === "asc" ? "ascending" : "descending") : undefined}
              className={cn("whitespace-nowrap px-4 py-2.5 text-xs font-semibold uppercase tracking-wide text-fg-secondary", ALIGN[col.align || "left"], col.headerClassName)}
            >
              {col.sortable && onSortChange ? (
                <button
                  type="button"
                  onClick={() => handleSort(col)}
                  className={cn("group inline-flex items-center gap-1 rounded hover:text-fg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30", col.align === "right" && "flex-row-reverse")}
                >
                  {col.header}
                  {sort?.key === col.key ? (
                    sort.dir === "asc" ? (
                      <ArrowUp className="h-3.5 w-3.5 text-accent" aria-hidden="true" />
                    ) : (
                      <ArrowDown className="h-3.5 w-3.5 text-accent" aria-hidden="true" />
                    )
                  ) : (
                    <ArrowUpDown className="h-3.5 w-3.5 text-fg-muted opacity-0 transition-opacity group-hover:opacity-100" aria-hidden="true" />
                  )}
                </button>
              ) : (
                col.header
              )}
            </th>
          ))}
          {actions && (
            <th scope="col" className="w-px whitespace-nowrap px-4 py-2.5 text-right text-xs font-semibold uppercase tracking-wide text-fg-secondary">
              {t("common.actions")}
            </th>
          )}
        </tr>
      </thead>
      <tbody className="divide-y divide-border">
        {data.map((row, index) => {
          const id = row[rowKey];
          const selected = selectedIds.includes(id);
          return (
            <tr
              key={id}
              style={{ "--i": Math.min(index, 12) }}
              data-highlight={isHighlighted(id) ? "true" : undefined}
              onClick={onRowClick ? () => onRowClick(row) : undefined}
              className={cn("row-enter transition-colors", onRowClick && "cursor-pointer", selected ? "bg-primary-50/50" : isHighlighted(id) ? HIGHLIGHT : "hover:bg-surface-hover")}
            >
              {selectable && (
                <td className={cn("px-4", py)} onClick={(e) => e.stopPropagation()}>
                  <Checkbox checked={selected} onChange={() => toggleOne(id)} aria-label={rowLabel(row)} />
                </td>
              )}
              {visible.map((col) => (
                <td key={col.key} className={cn("px-4 align-middle text-fg", py, ALIGN[col.align || "left"], col.className)}>
                  {cellValue(col, row)}
                </td>
              ))}
              {actions && (
                <td className={cn("whitespace-nowrap px-3 text-right align-middle", py)} onClick={(e) => e.stopPropagation()}>
                  {actions(row)}
                </td>
              )}
            </tr>
          );
        })}
      </tbody>
    </table>
  );

  const renderMobileList = () => (
    <ul className="divide-y divide-border">
      {data.map((row) => {
        const id = row[rowKey];
        const selected = selectedIds.includes(id);
        return (
          <li key={id} data-highlight={isHighlighted(id) ? "true" : undefined} className={cn("flex gap-3 p-4", selected ? "bg-primary-50/50" : isHighlighted(id) && HIGHLIGHT)}>
            {selectable && (
              <div className="pt-0.5">
                <Checkbox checked={selected} onChange={() => toggleOne(id)} aria-label={rowLabel(row)} />
              </div>
            )}
            <div className="min-w-0 flex-1">
              <div className="flex items-start justify-between gap-2">
                {renderPrimary(row)}
                {actions && <div className="-mr-2 -mt-1 shrink-0">{actions(row)}</div>}
              </div>
              {mobileCols.length > 0 && <FieldList cols={mobileCols} row={row} className="mt-3" />}
            </div>
          </li>
        );
      })}
    </ul>
  );

  return (
    <div className={cn("relative", loading && "pointer-events-none opacity-60 transition-opacity", className)} aria-busy={loading || undefined}>
      {banner}
      {view === "cards" ? (
        renderCards()
      ) : (
        <>
          <div className="hidden overflow-x-auto md:block">{renderTable()}</div>
          <div className="md:hidden">{renderMobileList()}</div>
        </>
      )}
    </div>
  );
}
