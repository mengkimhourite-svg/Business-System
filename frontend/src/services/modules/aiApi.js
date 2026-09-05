/**
 * AI API module — routes through Laravel proxy (/api/v1/ai/*) or direct FastAPI.
 * Laravel handles auth + RBAC; FastAPI handles the AI computation.
 */
import { api, USE_MOCK } from "../api.js";
import { aiDirectApi } from "./aiDirectApi.js";

export const aiApi = {
  /** GET /ai/insights — live computed business insights */
  insights: () => api.insights(),

  /** POST /ai/chat — ask the AI assistant a question */
  chat: (payload) => api.aiChat(payload),

  /** POST /ai/analyze/{kind} — targeted analysis */
  analyze: (kind, payload = {}) => api.analyze?.(kind, payload),

  /** Direct FastAPI endpoints (bypass Laravel, for development) */
  direct: aiDirectApi,
};
