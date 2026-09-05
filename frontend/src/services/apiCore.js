/** Shared primitives for both the mock API and the real HTTP API. */
export class ApiError extends Error {
  constructor(status, message, errors) {
    super(message || "Request failed");
    this.name = "ApiError";
    this.status = status;
    this.errors = errors || null;
  }
}

const TOKEN_KEY = "sbs.token";
export const tokenStore = {
  get: () => window.localStorage.getItem(TOKEN_KEY),
  set: (t) => window.localStorage.setItem(TOKEN_KEY, t),
  clear: () => window.localStorage.removeItem(TOKEN_KEY),
};

/** VITE_USE_MOCK=false switches every module to the Laravel API at VITE_API_URL (default /api/v1). */
export const USE_MOCK = (import.meta.env.VITE_USE_MOCK ?? "true") !== "false";
export const API_URL = (import.meta.env.VITE_API_URL || "/api/v1").replace(/\/$/, "");

export const UNAUTHORIZED_EVENT = "sbs:unauthorized";

/** Map any error to a user-friendly i18n key. Never expose raw errors. */
export function errorKey(error) {
  const status = error?.status;
  if (status === 0) return "errors.network";
  if (status === 401) return "errors.unauthorized";
  if (status === 403) return "errors.forbidden";
  if (status === 404) return "errors.notFound";
  if (status === 422) return "errors.validation";
  if (status === 429) return "errors.rateLimited";
  if (status >= 500) return "errors.server";
  return "errors.generic";
}
