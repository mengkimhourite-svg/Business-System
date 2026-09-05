import { createContext, useContext, useMemo } from "react";
import { useLocalStorage } from "../hooks/index.js";
import { useSettings } from "./SettingsContext.jsx";
import { useI18n } from "../i18n/index.jsx";
import { BASE_CURRENCY, CURRENCIES, CURRENCY_CODES, normalizeCurrency, normalizeRate, fromBase, toBase, formatMoney, formatAmount } from "../services/currency.js";
import { formatDate, formatNumber, formatPercent, formatRelative } from "../utils/format.js";

const CurrencyContext = createContext(null);

/**
 * Provides the active display currency + exchange rate to the whole app.
 * The user's choice is persisted; the business default comes from settings.
 */
export function CurrencyProvider({ children }) {
  const { settings } = useSettings();
  const [preferred, setPreferred] = useLocalStorage("sbs.currency", null);
  const display = normalizeCurrency(preferred || settings.currency || BASE_CURRENCY);
  const rate = normalizeRate(settings.exchange_rate);

  const value = useMemo(() => {
    const def = CURRENCIES[display];
    return {
      base: BASE_CURRENCY,
      display,
      rate,
      symbol: def.symbol,
      decimals: def.decimals,
      step: def.step,
      quick: def.quick,
      codes: CURRENCY_CODES,
      currencies: CURRENCIES,
      setDisplay: (code) => setPreferred(normalizeCurrency(code)),
      /** Format a BASE amount for display. Pass { rate } to use a historical rate. */
      format: (amountInBase, opts = {}) => formatMoney(amountInBase, { currency: opts.currency || display, rate: opts.rate ?? rate, compact: opts.compact, sign: opts.sign }),
      /** Format an amount that is already in the display currency (e.g. typed input). */
      formatDisplay: (amountInDisplay, opts = {}) => formatAmount(amountInDisplay, opts.currency || display, opts),
      fromBase: (amountInBase, opts = {}) => fromBase(amountInBase, opts.currency || display, opts.rate ?? rate),
      toBase: (amountInDisplay, opts = {}) => toBase(amountInDisplay, opts.currency || display, opts.rate ?? rate, opts.decimals ?? 2),
    };
  }, [display, rate, setPreferred]);

  return <CurrencyContext.Provider value={value}>{children}</CurrencyContext.Provider>;
}

export function useCurrency() {
  const ctx = useContext(CurrencyContext);
  if (!ctx) throw new Error("useCurrency must be used within CurrencyProvider");
  return ctx;
}

/** Locale + currency aware formatters used everywhere (POS, dashboard, tables, reports, AI). */
export function useFormat() {
  const { lang } = useI18n();
  const money = useCurrency();
  return useMemo(
    () => ({
      currency: money.format,
      number: (v, opts) => formatNumber(v, { lang, ...opts }),
      percent: (v, opts) => formatPercent(v, { lang, ...opts }),
      date: (v, opts) => formatDate(v, { lang, ...opts }),
      dateTime: (v) => formatDate(v, { lang, withTime: true }),
      relative: (v) => formatRelative(v, { lang }),
      money,
    }),
    [lang, money]
  );
}
