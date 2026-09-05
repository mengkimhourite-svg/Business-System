const LOCALES = { en: "en-US", km: "km-KH" };

export function localeFor(lang) {
  return LOCALES[lang] || LOCALES.en;
}

export function formatCurrency(value, { lang = "en", currency = "USD", compact = false } = {}) {
  const n = Number(value) || 0;
  try {
    return new Intl.NumberFormat(localeFor(lang), {
      style: "currency",
      currency,
      notation: compact ? "compact" : "standard",
      maximumFractionDigits: compact ? 1 : 2,
      minimumFractionDigits: compact ? 0 : 2,
    }).format(n);
  } catch {
    return `$${n.toFixed(2)}`;
  }
}

export function formatNumber(value, { lang = "en", compact = false, digits } = {}) {
  const n = Number(value) || 0;
  return new Intl.NumberFormat(localeFor(lang), {
    notation: compact ? "compact" : "standard",
    maximumFractionDigits: digits ?? (compact ? 1 : 0),
  }).format(n);
}

export function formatPercent(value, { lang = "en", digits = 1 } = {}) {
  const n = Number(value) || 0;
  return `${new Intl.NumberFormat(localeFor(lang), { maximumFractionDigits: digits }).format(Math.abs(n))}%`;
}

export function formatDate(value, { lang = "en", withTime = false } = {}) {
  if (!value) return "—";
  // Date-only strings (YYYY-MM-DD) are treated as local dates, not UTC midnight
  const d = value instanceof Date ? value : /^\d{4}-\d{2}-\d{2}$/.test(String(value)) ? new Date(`${value}T00:00:00`) : new Date(value);
  if (Number.isNaN(d.getTime())) return "—";
  return new Intl.DateTimeFormat(localeFor(lang), {
    year: "numeric",
    month: "short",
    day: "2-digit",
    ...(withTime ? { hour: "2-digit", minute: "2-digit" } : {}),
  }).format(d);
}

export function formatRelative(value, { lang = "en" } = {}) {
  if (!value) return "—";
  const d = new Date(value);
  const diff = (d.getTime() - Date.now()) / 1000;
  const abs = Math.abs(diff);
  const rtf = new Intl.RelativeTimeFormat(localeFor(lang), { numeric: "auto" });
  if (abs < 60) return rtf.format(Math.round(diff), "second");
  if (abs < 3600) return rtf.format(Math.round(diff / 60), "minute");
  if (abs < 86400) return rtf.format(Math.round(diff / 3600), "hour");
  if (abs < 86400 * 30) return rtf.format(Math.round(diff / 86400), "day");
  return formatDate(d, { lang });
}

export function initials(name = "") {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase())
    .join("");
}

export function toInputDate(value) {
  const d = value ? new Date(value) : new Date();
  const pad = (n) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

export function downloadCsv(filename, rows) {
  if (!rows?.length) return;
  const headers = Object.keys(rows[0]);
  const escape = (v) => {
    const s = v == null ? "" : String(v);
    return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  };
  const csv = [headers.join(","), ...rows.map((r) => headers.map((h) => escape(r[h])).join(","))].join("\n");
  const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}
