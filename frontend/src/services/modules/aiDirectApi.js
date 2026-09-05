/**
 * Direct connection to the FastAPI AI microservice (port 8001).
 * Used when VITE_AI_API_URL is set and VITE_USE_MOCK=false.
 * Falls back to Laravel proxy if the direct call fails.
 */
import { ApiError } from "../apiCore.js";

const AI_URL = (import.meta.env.VITE_AI_API_URL || "http://127.0.0.1:8001").replace(/\/$/, "");

async function aiRequest(method, path, body = null, timeout = 25000) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeout);
  try {
    const res = await fetch(`${AI_URL}${path}`, {
      method,
      signal: controller.signal,
      headers: { "Content-Type": "application/json", Accept: "application/json" },
      body: body ? JSON.stringify(body) : undefined,
    });
    clearTimeout(timer);
    const json = await res.json().catch(() => null);
    if (!res.ok) throw new ApiError(res.status, json?.message || res.statusText, json?.errors || null);
    return json?.data ?? json;
  } catch (e) {
    clearTimeout(timer);
    if (e instanceof ApiError) throw e;
    throw new ApiError(0, e?.name === "AbortError" ? "AI service timeout" : "AI service unreachable");
  }
}

export const aiDirectApi = {
  health: () => aiRequest("GET", "/health"),
  salesPrediction: (payload) => aiRequest("POST", "/api/ai/sales-prediction", payload),
  inventoryPrediction: (payload) => aiRequest("POST", "/api/ai/inventory-prediction", payload),
  customerAnalysis: (payload) => aiRequest("POST", "/api/ai/customer-analysis", payload),
  recommendations: (payload) => aiRequest("POST", "/api/ai/recommendations", payload),
  anomalyDetection: (payload) => aiRequest("POST", "/api/ai/anomaly-detection", payload),
  chatbot: (payload) => aiRequest("POST", "/api/ai/chatbot", payload),
};
