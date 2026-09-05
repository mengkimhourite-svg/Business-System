/**
 * Centralized HTTP client for the Laravel REST API (/api/v1).
 * - Bearer token (Sanctum personal access tokens)
 * - Standard envelope: { success, message, data, errors?, meta? }
 * - Maps 401/403/404/422/5xx to ApiError; never exposes raw server errors to the UI
 * - De-duplicates identical in-flight GET requests
 */
import { ApiError, tokenStore, API_URL, UNAUTHORIZED_EVENT } from "./apiCore.js";

const inflight = new Map();

function buildUrl(path, params) {
  const url = new URL(`${API_URL}${path}`, window.location.origin);
  if (params) {
    Object.entries(params).forEach(([k, v]) => {
      if (v == null || v === "") return;
      if (Array.isArray(v)) v.forEach((x) => url.searchParams.append(`${k}[]`, String(x)));
      else if (typeof v === "object") Object.entries(v).forEach(([kk, vv]) => vv != null && vv !== "" && url.searchParams.set(`${k}[${kk}]`, String(vv)));
      else url.searchParams.set(k, String(v));
    });
  }
  return url.toString();
}

export async function request(method, path, { body, params, headers, raw = false, timeout = 20000 } = {}) {
  const url = buildUrl(path, params);
  const key = method === "GET" ? url : null;
  if (key && inflight.has(key)) return inflight.get(key);

  const exec = (async () => {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeout);
    let res;
    try {
      const token = tokenStore.get();
      const isForm = typeof FormData !== "undefined" && body instanceof FormData;
      res = await fetch(url, {
        method,
        signal: controller.signal,
        headers: {
          Accept: "application/json",
          ...(isForm ? {} : { "Content-Type": "application/json" }),
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
          ...(headers || {}),
        },
        body: body === undefined ? undefined : isForm ? body : JSON.stringify(body),
      });
    } catch (e) {
      clearTimeout(timer);
      throw new ApiError(0, e?.name === "AbortError" ? "Request timeout" : "Network error");
    }
    clearTimeout(timer);

    if (res.status === 401) {
      tokenStore.clear();
      window.dispatchEvent(new CustomEvent(UNAUTHORIZED_EVENT));
    }
    if (res.status === 204) return null;
    const json = await res.json().catch(() => null);
    if (!res.ok) throw new ApiError(res.status, json?.message || res.statusText, json?.errors || null);
    if (raw) return json;
    // Envelope: return data + meta when paginated, otherwise data
    if (json && typeof json === "object" && "success" in json) return json.meta ? { data: json.data, meta: json.meta } : json.data;
    return json;
  })();

  if (key) {
    inflight.set(key, exec);
    exec.finally(() => inflight.delete(key));
  }
  return exec;
}

export const http = {
  get: (path, params, opts) => request("GET", path, { params, ...opts }),
  post: (path, body, opts) => request("POST", path, { body, ...opts }),
  put: (path, body, opts) => request("PUT", path, { body, ...opts }),
  patch: (path, body, opts) => request("PATCH", path, { body, ...opts }),
  delete: (path, opts) => request("DELETE", path, opts),
};
