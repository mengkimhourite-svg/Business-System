import { useCallback, useEffect, useRef, useState } from "react";

/** Debounce a changing value. */
export function useDebounce(value, delay = 300) {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const id = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(id);
  }, [value, delay]);
  return debounced;
}

function readStorage(key, fallback) {
  try {
    const raw = window.localStorage.getItem(key);
    return raw != null ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
}

/**
 * Persist state in localStorage.
 * When `key` changes (e.g. per-user keys after login) the value is re-read from storage
 * instead of carrying over — and the previous key is never overwritten with the new state.
 */
export function useLocalStorage(key, initialValue) {
  const [state, setState] = useState(() => ({ key, value: readStorage(key, initialValue) }));
  const initialRef = useRef(initialValue);
  initialRef.current = initialValue;

  // Resolve the value for the *current* key (re-read synchronously on key change)
  const value = state.key === key ? state.value : readStorage(key, initialRef.current);

  useEffect(() => {
    if (state.key !== key) setState({ key, value: readStorage(key, initialRef.current) });
  }, [key, state.key]);

  useEffect(() => {
    if (state.key !== key) return;
    try {
      window.localStorage.setItem(key, JSON.stringify(state.value));
    } catch {
      /* ignore quota errors */
    }
  }, [key, state.key, state.value]);

  const setValue = useCallback(
    (next) =>
      setState((s) => {
        const base = s.key === key ? s.value : readStorage(key, initialRef.current);
        return { key, value: typeof next === "function" ? next(base) : next };
      }),
    [key]
  );

  return [value, setValue];
}

/** Match a CSS media query. */
export function useMediaQuery(query) {
  const [matches, setMatches] = useState(() => (typeof window !== "undefined" ? window.matchMedia(query).matches : false));
  useEffect(() => {
    const mql = window.matchMedia(query);
    const handler = (e) => setMatches(e.matches);
    mql.addEventListener("change", handler);
    setMatches(mql.matches);
    return () => mql.removeEventListener("change", handler);
  }, [query]);
  return matches;
}

/** Call handler when a click happens outside the referenced element. */
export function useClickOutside(ref, handler, enabled = true) {
  useEffect(() => {
    if (!enabled) return undefined;
    const listener = (e) => {
      if (!ref.current || ref.current.contains(e.target)) return;
      handler(e);
    };
    document.addEventListener("mousedown", listener);
    document.addEventListener("touchstart", listener);
    return () => {
      document.removeEventListener("mousedown", listener);
      document.removeEventListener("touchstart", listener);
    };
  }, [ref, handler, enabled]);
}

/** Generic async data loader with loading / error / reload. */
export function useAsync(fn, deps = [], { immediate = true } = {}) {
  const [state, setState] = useState({ data: null, loading: immediate, error: null });
  const mounted = useRef(true);
  const fnRef = useRef(fn);
  fnRef.current = fn;

  const run = useCallback(async () => {
    setState((s) => ({ ...s, loading: true, error: null }));
    try {
      const data = await fnRef.current();
      if (mounted.current) setState({ data, loading: false, error: null });
      return data;
    } catch (error) {
      if (mounted.current) setState((s) => ({ ...s, loading: false, error }));
      return null;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);

  useEffect(() => {
    mounted.current = true;
    if (immediate) run();
    return () => {
      mounted.current = false;
    };
  }, [run, immediate]);

  return { ...state, reload: run, setData: (data) => setState((s) => ({ ...s, data })) };
}

/** Lock document scroll while active (modals / drawers). */
export function useScrollLock(active) {
  useEffect(() => {
    if (!active) return undefined;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [active]);
}

/** Close on Escape key. */
export function useEscape(handler, enabled = true) {
  useEffect(() => {
    if (!enabled) return undefined;
    const onKey = (e) => {
      if (e.key === "Escape") handler(e);
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [handler, enabled]);
}
