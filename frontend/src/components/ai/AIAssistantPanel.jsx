import { useCallback, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { cn } from "../../utils/cn.js";
import { useI18n } from "../../i18n/index.jsx";
import { useAIAssistant } from "../../context/AIAssistantContext.jsx";
import { useEscape, useMediaQuery, useScrollLock } from "../../hooks/index.js";
import { AIHeader, AIWelcome, AIChatMessage, AIThinking, AIInput } from "./AIParts.jsx";

/**
 * Right-side AI Assistant panel (desktop) / bottom sheet (mobile).
 * Rendered in a portal above page content but below modals/toasts.
 */
export function AIAssistantPanel() {
  const { t } = useI18n();
  const { open, minimized, closePanel, toggleMinimize, messages, thinking, ask, clearConversation, quickQuestions, showQuick, pageContext, demoRole, setDemoRole } = useAIAssistant();
  const isMobile = !useMediaQuery("(min-width: 640px)");
  const scrollRef = useRef(null);

  useScrollLock(open && isMobile);
  useEscape(
    useCallback(() => closePanel(), [closePanel]),
    open
  );

  // Keep the latest message in view
  useEffect(() => {
    if (!open || minimized) return;
    const el = scrollRef.current;
    if (el) el.scrollTo({ top: el.scrollHeight, behavior: "smooth" });
  }, [messages, thinking, open, minimized]);

  if (!open) return null;

  const pick = (intent, label) => ask(intent, { label });
  const showMinimized = minimized && !isMobile;

  return createPortal(
    <>
      {isMobile && <div className="fixed inset-0 z-40 bg-overlay animate-fade-in" onClick={closePanel} aria-hidden="true" />}
      <section
        role="dialog"
        aria-modal={isMobile ? "true" : undefined}
        aria-label={t("ai.assistant")}
        className={cn(
          "fixed z-40 flex flex-col overflow-hidden border-border bg-surface shadow-lg",
          isMobile
            ? "inset-x-0 bottom-0 h-[88dvh] rounded-t-2xl border-t animate-slide-up"
            : "bottom-4 right-4 top-4 w-[400px] max-w-[calc(100vw-2rem)] rounded-xl border animate-panel-in md:bottom-6 md:right-6 md:top-6",
          showMinimized && "top-auto h-auto"
        )}
      >
        <AIHeader onMinimize={toggleMinimize} onClose={closePanel} minimized={showMinimized} onClear={clearConversation} hasMessages={messages.length > 0} demoRole={demoRole} onRoleChange={setDemoRole} pageContext={pageContext} />

        {!showMinimized && (
          <>
            <div ref={scrollRef} className="min-h-0 flex-1 overflow-y-auto px-4 py-4">
              {messages.length === 0 && !thinking ? (
                <AIWelcome questions={quickQuestions} onPick={pick} showQuick={showQuick} pageContext={pageContext} demoRole={demoRole} />
              ) : (
                <div className="space-y-5">
                  {messages.map((m) => (
                    <div key={m.id} className="animate-rise">
                      <AIChatMessage message={m} onPick={pick} onRetry={(q) => ask(q)} disabled={thinking} />
                    </div>
                  ))}
                  {thinking && <AIThinking />}
                </div>
              )}
            </div>
            <AIInput onSend={(text) => ask(text)} disabled={thinking} autoFocus={!isMobile} />
          </>
        )}
      </section>
    </>,
    document.body
  );
}
