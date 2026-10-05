import { useEffect, useRef, useState } from "react";
import { Send, Minus, X, Sparkles, RefreshCw, Trash2, MessageSquareText } from "lucide-react";
import { cn } from "../../utils/cn.js";
import { useI18n } from "../../i18n/index.jsx";
import { useAuth } from "../../context/AuthContext.jsx";
import { INTENTS, AI_ROLES } from "../../config/aiAssistant.js";
import { Button, Avatar, Tooltip, Badge, Select } from "../ui/index.js";
import { AIMessageContent } from "./AIMessageContent.jsx";
import { AIRobotAvatar } from "./AIRobot.jsx";

/** Assistant avatar — the robot mascot (see AIRobot.jsx). */
export function AIMark({ className, size = "md", mood = "happy", tone = "primary" }) {
  return <AIRobotAvatar size={size === "sm" ? "sm" : size} mood={mood} tone={tone} className={className} />;
}

export function AIHeader({ onMinimize, onClose, minimized, onClear, hasMessages, demoRole, onRoleChange, pageContext }) {
  const { t } = useI18n();
  return (
    <div className="flex items-center gap-3 border-b border-border px-4 py-3">
      <AIMark />
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-semibold text-fg">{t("ai.assistant")}</p>
        <p className="truncate text-xs text-fg-muted">
          {t("ai.subtitle")}
          {pageContext && !minimized && <span className="text-fg-muted"> · {t(pageContext.labelKey)}</span>}
        </p>
      </div>
      {!minimized && (
        <>
          <Select size="sm" value={demoRole} onChange={(e) => onRoleChange(e.target.value)} options={AI_ROLES.map((r) => ({ value: r.key, label: t(r.labelKey) }))} aria-label={t("ai.demoRole")} className="hidden w-[132px] sm:block" />
          {hasMessages && (
            <Tooltip content={t("ai.clear")}>
              <Button variant="ghost" size="sm" icon onClick={onClear} aria-label={t("ai.clear")}>
                <Trash2 className="h-4 w-4" />
              </Button>
            </Tooltip>
          )}
        </>
      )}
      <Tooltip content={minimized ? t("ai.expand") : t("ai.minimize")}>
        <Button variant="ghost" size="sm" icon onClick={onMinimize} aria-label={minimized ? t("ai.expand") : t("ai.minimize")} className="hidden sm:inline-flex">
          {minimized ? <MessageSquareText className="h-4 w-4" /> : <Minus className="h-4 w-4" />}
        </Button>
      </Tooltip>
      <Tooltip content={t("common.close")}>
        <Button variant="ghost" size="sm" icon onClick={onClose} aria-label={t("common.close")}>
          <X className="h-4 w-4" />
        </Button>
      </Tooltip>
    </div>
  );
}

export function AIQuickQuestions({ questions = [], onPick, disabled, titleKey, compact = false }) {
  const { t } = useI18n();
  if (!questions.length) return null;
  return (
    <div>
      {titleKey && <p className="mb-2 text-[11px] font-semibold uppercase tracking-wide text-fg-muted">{t(titleKey)}</p>}
      <div className={cn("flex flex-wrap gap-2", compact && "gap-1.5")}>
        {questions.map((q) => (
          <button
            key={q}
            type="button"
            disabled={disabled}
            onClick={() => onPick(q, t(INTENTS[q].labelKey))}
            className={cn(
              "rounded-full border border-border bg-surface text-fg-secondary transition-colors hover:border-primary-300 hover:bg-primary-50 hover:text-primary-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30 disabled:opacity-50",
              compact ? "px-2.5 py-1 text-xs" : "px-3 py-1.5 text-[13px]"
            )}
          >
            {t(INTENTS[q].labelKey)}
          </button>
        ))}
      </div>
    </div>
  );
}

export function AIWelcome({ questions, onPick, showQuick, pageContext, demoRole }) {
  const { t } = useI18n();
  const { user } = useAuth();
  return (
    <div className="px-1 py-4">
      <AIMark size="xl" className="animate-float" />
      <h3 className="mt-4 text-lg font-semibold text-fg">{t("ai.hello", { name: user?.name ? `, ${user.name.split(" ")[0]}` : "" })} 👋</h3>
      <p className="mt-1 text-sm text-fg-secondary">{t("ai.helpPrompt")}</p>
      <div className="mt-3 flex flex-wrap gap-1.5">
        {pageContext && <Badge variant="primary">{t("ai.contextLabel", { page: t(pageContext.labelKey) })}</Badge>}
        <Badge variant="neutral">{t(AI_ROLES.find((r) => r.key === demoRole)?.labelKey || "ai.roles.manager")}</Badge>
      </div>
      {showQuick && (
        <div className="mt-6">
          <AIQuickQuestions questions={questions} onPick={onPick} titleKey="ai.quickQuestions" />
        </div>
      )}
    </div>
  );
}

export function AIThinking() {
  const { t } = useI18n();
  return (
    <div className="flex items-start gap-3" role="status" aria-live="polite">
      <AIMark size="sm" mood="thinking" className="mt-0.5" />
      <div className="rounded-lg border border-border bg-surface px-3.5 py-2.5">
        <p className="text-sm text-fg-secondary">{t("ai.thinking")}</p>
        <span className="mt-1 flex items-center gap-1" aria-hidden="true">
          {[0, 1, 2].map((i) => (
            <span key={i} className="h-1.5 w-1.5 rounded-full bg-primary animate-bounce-dot" style={{ animationDelay: `${i * 150}ms` }} />
          ))}
        </span>
      </div>
    </div>
  );
}

export function AIError({ onRetry, errorMessage }) {
  const { t } = useI18n();
  return (
    <div className="flex items-start gap-3">
      <AIMark size="sm" mood="error" tone="danger" className="mt-0.5" />
      <div className="rounded-lg border border-danger/30 bg-danger-light/50 px-3.5 py-3">
        <p className="text-sm font-medium text-fg">{t("common.somethingWentWrong")}</p>
        <p className="mt-0.5 text-xs text-fg-secondary">{errorMessage || t("errors.generic")}</p>
        {onRetry && (
          <Button variant="outline" size="xs" leftIcon={RefreshCw} onClick={onRetry} className="mt-2">
            {t("common.tryAgain")}
          </Button>
        )}
      </div>
    </div>
  );
}

export function AIFollowUpQuestions({ questions, onPick, disabled }) {
  if (!questions?.length) return null;
  return (
    <div className="pl-9">
      <AIQuickQuestions questions={questions} onPick={onPick} disabled={disabled} titleKey="ai.youMayAsk" compact />
    </div>
  );
}

export function AIChatMessage({ message, onPick, onRetry, disabled }) {
  const { t } = useI18n();
  const { user } = useAuth();
  if (message.role === "user") {
    return (
      <div className="flex justify-end gap-2">
        <div className="max-w-[80%] rounded-2xl rounded-br-md bg-primary px-3.5 py-2 text-sm text-white">{message.text}</div>
        <Avatar src={user?.avatar} name={user?.name} size="xs" className="mt-1" />
      </div>
    );
  }
  if (message.error) return <AIError onRetry={onRetry ? () => onRetry(message.retry) : undefined} errorMessage={message.errorMessage} />;
  return (
    <div className="space-y-3">
      <div className="flex items-start gap-3">
        <AIMark size="sm" className="mt-0.5" />
        <div className="min-w-0 flex-1">
          {message.empty ? (
            <div className="space-y-3">
              <p className="text-sm leading-relaxed text-fg">{t("ai.noMatch")}</p>
              <AIQuickQuestions questions={message.followUps} onPick={onPick} disabled={disabled} compact />
            </div>
          ) : (
            <AIMessageContent blocks={message.blocks} />
          )}
        </div>
      </div>
      {!message.empty && <AIFollowUpQuestions questions={message.followUps} onPick={onPick} disabled={disabled} />}
    </div>
  );
}

export function AIInput({ onSend, disabled, autoFocus }) {
  const { t } = useI18n();
  const [value, setValue] = useState("");
  const ref = useRef(null);

  useEffect(() => {
    if (autoFocus) ref.current?.focus();
  }, [autoFocus]);

  // Auto-grow up to ~4 lines
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    el.style.height = "0px";
    el.style.height = `${Math.min(el.scrollHeight, 112)}px`;
  }, [value]);

  const submit = () => {
    const text = value.trim();
    if (!text || disabled) return;
    onSend(text);
    setValue("");
  };

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        submit();
      }}
      className="border-t border-border bg-surface p-3"
    >
      <div className="flex items-end gap-2 rounded-lg border border-border bg-surface px-3 py-2 transition-colors focus-within:border-primary focus-within:ring-2 focus-within:ring-primary/20">
        <textarea
          ref={ref}
          rows={1}
          value={value}
          disabled={disabled}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              submit();
            }
          }}
          placeholder={t("ai.placeholder")}
          aria-label={t("ai.placeholder")}
          className="max-h-28 min-h-[24px] flex-1 resize-none bg-transparent text-sm leading-6 text-fg outline-none placeholder:text-fg-placeholder disabled:opacity-60"
        />
        <Button type="submit" size="sm" icon disabled={disabled || !value.trim()} loading={disabled} aria-label={t("ai.send")} className="shrink-0">
          <Send className="h-4 w-4" />
        </Button>
      </div>
      <p className="mt-1.5 flex items-center gap-1 text-[11px] text-fg-muted">
        <Sparkles className="h-3 w-3" aria-hidden="true" />
        {t("ai.inputHint")}
      </p>
    </form>
  );
}
