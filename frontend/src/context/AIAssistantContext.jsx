import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import { useLocation } from "react-router-dom";
import { useLocalStorage } from "../hooks/index.js";
import { useAuth } from "./AuthContext.jsx";
import { AI_SETTINGS_DEFAULTS, ROLE_QUESTIONS, defaultDemoRole, pageContextFor } from "../config/aiAssistant.js";
import { askAssistant, invalidateAiCache } from "../services/aiAssistant.js";
import { syncPreference } from "../services/preferences.js";

const AIAssistantContext = createContext(null);

let idSeq = 0;
const nextId = () => `m${Date.now()}-${++idSeq}`;

/**
 * AI Assistant UI state: settings (localStorage), panel open/minimized, conversation, demo role.
 * Frontend-only — answers come from the mock engine in services/aiAssistant.js.
 */
export function AIAssistantProvider({ children }) {
  const { user } = useAuth();
  const { pathname } = useLocation();
  const [settings, setSettings] = useLocalStorage("sbs.ai.settings", AI_SETTINGS_DEFAULTS);
  const [open, setOpen] = useState(false);
  const [minimized, setMinimized] = useState(false);
  const [messages, setMessages] = useState([]);
  const [thinking, setThinking] = useState(false);
  const pending = useRef(0);

  const merged = useMemo(() => ({ ...AI_SETTINGS_DEFAULTS, ...(settings || {}) }), [settings]);
  useEffect(() => {
    if (user?.id) syncPreference("sbs.ai.settings", merged);
  }, [merged, user?.id]);
  const demoRole = merged.demoRole || defaultDemoRole(user?.role?.slug);
  const pageContext = useMemo(() => pageContextFor(pathname), [pathname]);
  const quickQuestions = useMemo(() => {
    const roleQs = ROLE_QUESTIONS[demoRole] || ROLE_QUESTIONS.manager;
    const ctxQs = pageContext?.questions || [];
    // Page context first, then role suggestions, de-duplicated, max 6
    return [...new Set([...ctxQs, ...roleQs])].slice(0, 6);
  }, [demoRole, pageContext]);

  // Reset conversation & cache when the signed-in user changes
  useEffect(() => {
    setMessages([]);
    setOpen(false);
    setMinimized(false);
    invalidateAiCache();
  }, [user?.id]);

  const updateSettings = useCallback((patch) => setSettings((s) => ({ ...AI_SETTINGS_DEFAULTS, ...(s || {}), ...patch })), [setSettings]);

  const openPanel = useCallback(() => {
    setOpen(true);
    setMinimized(false);
  }, []);
  const closePanel = useCallback(() => {
    setOpen(false);
    setMinimized(false);
  }, []);
  const toggleMinimize = useCallback(() => setMinimized((m) => !m), []);
  const clearConversation = useCallback(() => setMessages([]), []);

  const ask = useCallback(async (input, { label } = {}) => {
    // eslint-disable-line
    const text = (label || input || "").trim();
    if (!text) return;
    const userMsg = { id: nextId(), role: "user", text, at: Date.now() };
    setMessages((m) => [...m, userMsg]);
    setThinking(true);
    const token = ++pending.current;
    try {
      invalidateAiCache(); // always reflect the latest demo data (e.g. after a POS sale)
      const res = await askAssistant(input, { page: pageContext?.key || null, role: demoRole });
      if (token !== pending.current) return;
      setMessages((m) => [...m, { id: nextId(), role: "assistant", intent: res.intent, blocks: res.blocks, followUps: res.followUps, empty: !res.intent, at: Date.now() }]);
    } catch (e) {
      if (token !== pending.current) return;
      const errMsg = e?.message || null;
      const errDetails = e?.errors ? Object.entries(e.errors).map(([k, v]) => `${k}: ${Array.isArray(v) ? v.join(", ") : v}`).join("; ") : null;
      setMessages((m) => [...m, { id: nextId(), role: "assistant", error: true, errorMessage: errDetails || errMsg, retry: input, at: Date.now() }]);
    } finally {
      if (token === pending.current) setThinking(false);
    }
  }, [pageContext?.key, demoRole]);

  const value = useMemo(
    () => ({
      settings: merged,
      updateSettings,
      enabled: !!merged.enabled,
      showFloating: !!merged.enabled && !!merged.floatingButton,
      showInsights: !!merged.enabled && !!merged.insights,
      showQuick: !!merged.quickQuestions,
      open: !!merged.enabled && open,
      minimized,
      openPanel,
      closePanel,
      toggleMinimize,
      messages,
      thinking,
      ask,
      clearConversation,
      demoRole,
      setDemoRole: (r) => updateSettings({ demoRole: r }),
      pageContext,
      quickQuestions,
    }),
    [merged, updateSettings, open, minimized, openPanel, closePanel, toggleMinimize, messages, thinking, ask, clearConversation, demoRole, pageContext, quickQuestions]
  );

  return <AIAssistantContext.Provider value={value}>{children}</AIAssistantContext.Provider>;
}

export function useAIAssistant() {
  const ctx = useContext(AIAssistantContext);
  if (!ctx) throw new Error("useAIAssistant must be used within AIAssistantProvider");
  return ctx;
}
