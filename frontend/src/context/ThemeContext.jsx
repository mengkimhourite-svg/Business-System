import { createContext, useContext, useEffect, useMemo, useRef } from "react";
import { useLocalStorage, useMediaQuery } from "../hooks/index.js";

export const THEMES = ["light", "dark", "system"];

const ThemeContext = createContext(null);

export function ThemeProvider({ children }) {
  const [theme, setTheme] = useLocalStorage("sbs.theme", "system");
  const systemDark = useMediaQuery("(prefers-color-scheme: dark)");
  const resolved = theme === "dark" || (theme === "system" && systemDark) ? "dark" : "light";

  const firstRun = useRef(true);
  useEffect(() => {
    const root = document.documentElement;
    const apply = () => {
      root.classList.toggle("dark", resolved === "dark");
      root.style.colorScheme = resolved;
      document.querySelector('meta[name="theme-color"]')?.setAttribute("content", resolved === "dark" ? "#111a2e" : "#2d4a9e");
    };
    // No transition on the very first paint (avoids a flash); cross-fade on subsequent switches.
    if (firstRun.current) {
      firstRun.current = false;
      apply();
      return undefined;
    }
    root.classList.add("theme-transition");
    // Force a style flush so the transition class is active BEFORE colors change
    void root.offsetWidth;
    apply();
    const id = setTimeout(() => root.classList.remove("theme-transition"), 420);
    return () => clearTimeout(id);
  }, [resolved]);

  const value = useMemo(
    () => ({ theme: THEMES.includes(theme) ? theme : "system", setTheme, resolved, isDark: resolved === "dark" }),
    [theme, setTheme, resolved]
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error("useTheme must be used within ThemeProvider");
  return ctx;
}
