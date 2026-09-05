import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "../../utils/cn.js";
import { Button } from "./Button.jsx";
import { Select } from "./Form.jsx";
import { useI18n } from "../../i18n/index.jsx";

function pageList(page, pages) {
  if (pages <= 7) return Array.from({ length: pages }, (_, i) => i + 1);
  const set = new Set([1, pages, page, page - 1, page + 1]);
  if (page <= 3) [2, 3, 4].forEach((n) => set.add(n));
  if (page >= pages - 2) [pages - 1, pages - 2, pages - 3].forEach((n) => set.add(n));
  const list = [...set].filter((n) => n >= 1 && n <= pages).sort((a, b) => a - b);
  const out = [];
  list.forEach((n, i) => {
    if (i && n - list[i - 1] > 1) out.push("…");
    out.push(n);
  });
  return out;
}

export function Pagination({ page = 1, perPage = 10, total = 0, onPageChange, onPerPageChange, perPageOptions = [10, 25, 50], className }) {
  const { t } = useI18n();
  const pages = Math.max(1, Math.ceil(total / perPage));
  const from = total === 0 ? 0 : (page - 1) * perPage + 1;
  const to = Math.min(total, page * perPage);

  return (
    <div className={cn("flex flex-col gap-3 border-t border-border px-4 py-3 sm:flex-row sm:items-center sm:justify-between", className)}>
      <div className="flex items-center justify-between gap-4 text-sm text-fg-secondary sm:justify-start">
        <span className="tabular">{t("common.showing", { from, to, total })}</span>
        {onPerPageChange && (
          <label className="flex items-center gap-2">
            <span className="hidden text-xs text-fg-muted md:inline">{t("common.rowsPerPage")}</span>
            <Select size="sm" value={perPage} onChange={(e) => onPerPageChange(Number(e.target.value))} options={perPageOptions.map((n) => ({ value: n, label: String(n) }))} className="w-[72px]" aria-label={t("common.rowsPerPage")} />
          </label>
        )}
      </div>
      <nav className="flex items-center justify-center gap-1 sm:justify-end" aria-label="Pagination">
        <Button variant="outline" size="sm" icon onClick={() => onPageChange(page - 1)} disabled={page <= 1} aria-label={t("common.previous")}>
          <ChevronLeft className="h-4 w-4" />
        </Button>
        <div className="hidden items-center gap-1 sm:flex">
          {pageList(page, pages).map((n, i) =>
            n === "…" ? (
              <span key={`e${i}`} className="px-1.5 text-sm text-fg-muted">
                …
              </span>
            ) : (
              <Button key={n} variant={n === page ? "primary" : "ghost"} size="sm" onClick={() => onPageChange(n)} aria-current={n === page ? "page" : undefined} className="min-w-8 px-2 tabular">
                {n}
              </Button>
            )
          )}
        </div>
        <span className="px-2 text-sm text-fg-secondary tabular sm:hidden">
          {page} / {pages}
        </span>
        <Button variant="outline" size="sm" icon onClick={() => onPageChange(page + 1)} disabled={page >= pages} aria-label={t("common.next")}>
          <ChevronRight className="h-4 w-4" />
        </Button>
      </nav>
    </div>
  );
}
