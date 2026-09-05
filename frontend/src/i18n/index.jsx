import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import en from "./en.js";
import km from "./km.js";

export const LANGUAGES = [
  { code: "en", labelKey: "common.english", nativeLabel: "English", short: "EN" },
  { code: "km", labelKey: "common.khmer", nativeLabel: "ខ្មែរ", short: "ខ្មែរ" },
];

const dictionaries = { en, km };
const STORAGE_KEY = "sbs.lang";

function lookup(dict, path) {
  return path.split(".").reduce((acc, part) => (acc && acc[part] !== undefined ? acc[part] : undefined), dict);
}

function interpolate(str, params) {
  if (!params) return str;
  return str.replace(/\{(\w+)\}/g, (_, key) => (params[key] !== undefined ? String(params[key]) : `{${key}}`));
}

const I18nContext = createContext(null);

export function I18nProvider({ children }) {
  const [lang, setLangState] = useState(() => {
    const saved = typeof window !== "undefined" ? window.localStorage.getItem(STORAGE_KEY) : null;
    return saved && dictionaries[saved] ? saved : "en";
  });

  useEffect(() => {
    document.documentElement.lang = lang;
    window.localStorage.setItem(STORAGE_KEY, lang);
  }, [lang]);

  const setLang = useCallback((code) => {
    if (dictionaries[code]) setLangState(code);
  }, []);

  const t = useCallback(
    (key, params) => {
      if (!key) return "";
      const value = lookup(dictionaries[lang], key) ?? lookup(dictionaries.en, key);
      if (value === undefined) return key;
      if (typeof value !== "string") return value;
      return interpolate(value, params);
    },
    [lang]
  );

  const value = useMemo(() => ({ lang, setLang, t, languages: LANGUAGES, isKhmer: lang === "km" }), [lang, setLang, t]);

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useI18n() {
  const ctx = useContext(I18nContext);
  if (!ctx) throw new Error("useI18n must be used within I18nProvider");
  return ctx;
}
