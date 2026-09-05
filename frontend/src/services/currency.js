/**
 * Centralized Currency Service.
 *
 * Rules:
 *  - All amounts are STORED in the base currency (USD). The database never changes.
 *  - Conversion happens ONLY at display time (or when reading a user input typed in the display currency).
 *  - One exchange rate (KHR per 1 USD) is used system-wide; transactions persist the rate used at that time.
 *  - Rounding happens once, at the end of each conversion, to avoid drift and double conversion.
 */
export const BASE_CURRENCY = "USD";
export const DEFAULT_EXCHANGE_RATE = 4047; // KHR per 1 USD

export const CURRENCIES = {
  USD: { code: "USD", symbol: "$", decimals: 2, step: 0.01, quick: [1, 5, 10, 20, 50, 100], nameKey: "currency.usd" },
  KHR: { code: "KHR", symbol: "៛", decimals: 0, step: 100, quick: [1000, 5000, 10000, 20000, 50000, 100000], nameKey: "currency.khr" },
};
export const CURRENCY_CODES = Object.keys(CURRENCIES);

export function normalizeCurrency(code) {
  return CURRENCIES[code] ? code : BASE_CURRENCY;
}

export function normalizeRate(rate) {
  const r = Number(rate);
  return Number.isFinite(r) && r > 0 ? r : DEFAULT_EXCHANGE_RATE;
}

/** Round half away from zero without floating point artefacts (never returns -0). */
export function roundTo(value, decimals = 2) {
  const n = Number(value) || 0;
  const f = 10 ** decimals;
  const r = Math.round((Math.abs(n) + Number.EPSILON) * f) / f;
  return n < 0 && r !== 0 ? -r : r;
}

/** Base (USD) → display currency. */
export function fromBase(amountInBase, currency = BASE_CURRENCY, rate = DEFAULT_EXCHANGE_RATE) {
  const code = normalizeCurrency(currency);
  const n = Number(amountInBase) || 0;
  if (code === BASE_CURRENCY) return roundTo(n, CURRENCIES.USD.decimals);
  return roundTo(n * normalizeRate(rate), CURRENCIES[code].decimals);
}

/**
 * Display currency → base (USD).
 * `decimals` defaults to cents (prices); pass 4 for payment amounts so riel precision survives the round trip.
 */
export function toBase(amountInDisplay, currency = BASE_CURRENCY, rate = DEFAULT_EXCHANGE_RATE, decimals = 2) {
  const code = normalizeCurrency(currency);
  const n = Number(amountInDisplay) || 0;
  if (code === BASE_CURRENCY) return roundTo(n, decimals);
  return roundTo(n / normalizeRate(rate), decimals);
}

/** Convert between any two supported currencies through the base. */
export function convert(amount, from, to, rate = DEFAULT_EXCHANGE_RATE) {
  return fromBase(toBase(amount, from, rate), to, rate);
}

/** Format a value that is ALREADY in `currency`: USD → "$10.00", KHR → "៛40,470". */
export function formatAmount(value, currency = BASE_CURRENCY, { compact = false, sign = false } = {}) {
  const def = CURRENCIES[normalizeCurrency(currency)];
  const n = Number(value) || 0;
  const abs = Math.abs(n);
  const num =
    compact && abs >= 1000
      ? new Intl.NumberFormat("en-US", { notation: "compact", maximumFractionDigits: 1 }).format(abs)
      : new Intl.NumberFormat("en-US", { minimumFractionDigits: compact ? 0 : def.decimals, maximumFractionDigits: def.decimals }).format(abs);
  const prefix = n < 0 ? "-" : sign && n > 0 ? "+" : "";
  return `${prefix}${def.symbol}${num}`;
}

/** Format a BASE amount in the requested display currency (single conversion + single rounding). */
export function formatMoney(amountInBase, { currency = BASE_CURRENCY, rate = DEFAULT_EXCHANGE_RATE, compact = false, sign = false } = {}) {
  return formatAmount(fromBase(amountInBase, currency, rate), currency, { compact, sign });
}

/** "1 USD = ៛4,047" helper. */
export function formatRate(rate) {
  return formatAmount(normalizeRate(rate), "KHR");
}
