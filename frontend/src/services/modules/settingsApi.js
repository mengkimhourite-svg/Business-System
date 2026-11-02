import { api } from "../api.js";
export const settingsApi = { getPublic: () => api.getPublicSettings(), get: () => api.getSettings(), update: (p) => api.updateSettings(p), preferences: () => api.getPreferences(), savePreference: (k, v) => api.updatePreference(k, v), resetPreference: (k) => api.resetPreference(k) };
