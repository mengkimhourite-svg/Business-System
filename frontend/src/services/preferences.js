import { api, USE_MOCK } from "./api.js";
const timers = new Map();
/** Debounced best-effort sync of a UI preference to the server (no-op in mock mode; localStorage stays the cache). */
export function syncPreference(key, value) {
  if (USE_MOCK) return;
  clearTimeout(timers.get(key));
  timers.set(key, setTimeout(() => { api.updatePreference(key, value).catch(() => {}); }, 600));
}
/** Load server preferences once after login and hydrate localStorage caches (keys are namespaced sbs.*). */
export async function hydratePreferences() {
  if (USE_MOCK) return;
  try {
    const prefs = await api.getPreferences();
    Object.entries(prefs || {}).forEach(([k, v]) => { try { window.localStorage.setItem(k, JSON.stringify(v)); } catch { /* ignore */ } });
  } catch { /* offline or unsupported — keep local */ }
}
