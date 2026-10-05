import { useState, useRef, useEffect, useCallback } from "react";
import { createPortal } from "react-dom";
import {
  Send,
  Minus,
  X,
  Bot,
  User,
  ChevronDown,
  Maximize2,
  Minimize2,
} from "lucide-react";
import { cn } from "../../utils/cn.js";
import { useAIAssistant } from "../../context/AIAssistantContext.jsx";
import { useAuth } from "../../context/AuthContext.jsx";
import { useEscape, useMediaQuery, useScrollLock } from "../../hooks/index.js";
import { Tooltip } from "../ui/index.js";

// ==================== CONSTANTS ====================
const CONTEXT_OPTIONS = [
  { id: "sales-cash", label: "Sales / Cash" },
  { id: "inventory", label: "Inventory" },
  { id: "reports", label: "Reports" },
  { id: "finance", label: "Finance" },
];

const QUICK_QUESTIONS = [
  { id: "low-stock", label: "Low stock products" },
  { id: "recent-movement", label: "Recent stock movement" },
  { id: "reorder", label: "What should I reorder?" },
  { id: "purchase-orders", label: "Open purchase orders" },
  { id: "sales-today", label: "Sales today" },
  { id: "best-selling", label: "Best-selling products" },
];

// ==================== AI ROBOT AVATAR ====================
function AIRobotAvatar({ className, size = "md" }) {
  const sizes = {
    sm: "h-8 w-8",
    md: "h-10 w-10",
    lg: "h-12 w-12",
    xl: "h-16 w-16",
  };

  return (
    <div
      className={cn(
        "relative flex items-center justify-center rounded-2xl bg-gradient-to-br from-[#3B82F6] to-[#2563EB] shadow-lg shadow-blue-500/20",
        sizes[size],
        className
      )}
    >
      <Bot className="h-1/2 w-1/2 text-white" />
    </div>
  );
}

// ==================== MESSAGE BUBBLE ====================
function MessageBubble({ message, isUser }) {
  const formatTime = (date) => {
    return new Date(date).toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  if (isUser) {
    return (
      <div className="flex justify-end gap-2 animate-fade-in">
        <div className="flex flex-col items-end gap-1">
          <div className="max-w-[280px] rounded-2xl rounded-br-md bg-[#3B82F6] px-4 py-2.5">
            <p className="text-[13px] leading-relaxed text-white">
              {message.text}
            </p>
          </div>
          <span className="text-[10px] text-slate-500">
            {formatTime(message.timestamp)}
          </span>
        </div>
        <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[#1E293B] border border-slate-700/50 mt-1">
          <User className="h-3.5 w-3.5 text-slate-400" />
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-start gap-2.5 animate-fade-in">
      <AIRobotAvatar size="sm" className="mt-0.5" />
      <div className="flex flex-col gap-1">
        <div className="max-w-[320px] rounded-2xl rounded-bl-md bg-[#1E293B] border border-slate-700/30 px-4 py-3">
          <div className="text-[13px] leading-relaxed text-slate-200">
            {message.content}
          </div>
        </div>
        <span className="text-[10px] text-slate-500">
          {formatTime(message.timestamp)}
        </span>
      </div>
    </div>
  );
}

// ==================== TYPING INDICATOR ====================
function TypingIndicator() {
  return (
    <div className="flex items-start gap-2.5 animate-fade-in">
      <AIRobotAvatar size="sm" className="mt-0.5" />
      <div className="rounded-2xl rounded-bl-md bg-[#1E293B] border border-slate-700/30 px-4 py-3">
        <div className="flex items-center gap-1.5">
          <span
            className="h-2 w-2 rounded-full bg-slate-400 animate-bounce"
            style={{ animationDelay: "0ms" }}
          />
          <span
            className="h-2 w-2 rounded-full bg-slate-400 animate-bounce"
            style={{ animationDelay: "150ms" }}
          />
          <span
            className="h-2 w-2 rounded-full bg-slate-400 animate-bounce"
            style={{ animationDelay: "300ms" }}
          />
        </div>
      </div>
    </div>
  );
}

// ==================== MAIN COMPONENT ====================
export function EnterpriseAIAssistant() {
  const {
    open,
    minimized,
    closePanel,
    toggleMinimize,
    messages,
    thinking,
    ask,
  } = useAIAssistant();
  const { user } = useAuth();
  const isMobile = !useMediaQuery("(min-width: 640px)");
  const scrollRef = useRef(null);
  const inputRef = useRef(null);
  const [inputValue, setInputValue] = useState("");
  const [isExpanded, setIsExpanded] = useState(false);
  const [activeContext, setActiveContext] = useState("sales-cash");
  const [showContextDropdown, setShowContextDropdown] = useState(false);

  useScrollLock(open && isMobile);
  useEscape(
    useCallback(() => closePanel(), [closePanel]),
    open
  );

  useEffect(() => {
    if (!open || minimized) return;
    const el = scrollRef.current;
    if (el) el.scrollTo({ top: el.scrollHeight, behavior: "smooth" });
  }, [messages, thinking, open, minimized]);

  // Close dropdown when clicking outside
  useEffect(() => {
    if (!showContextDropdown) return;
    const handler = () => setShowContextDropdown(false);
    document.addEventListener("click", handler);
    return () => document.removeEventListener("click", handler);
  }, [showContextDropdown]);

  if (!open) return null;

  const handleSend = () => {
    const text = inputValue.trim();
    if (!text || thinking) return;
    ask(text, { label: text });
    setInputValue("");
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleQuickQuestion = (question) => {
    ask(question.id, { label: question.label });
  };

  const showMinimized = minimized && !isMobile;
  const panelWidth = isExpanded ? "w-[480px]" : "w-[400px]";

  return createPortal(
    <>
      {isMobile && (
        <div
          className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm animate-fade-in"
          onClick={closePanel}
        />
      )}
      <section
        role="dialog"
        aria-modal={isMobile ? "true" : undefined}
        aria-label="AI Assistant"
        className={cn(
          "fixed z-40 flex flex-col overflow-hidden bg-[#0B1120] shadow-2xl shadow-black/40",
          isMobile
            ? "inset-x-0 bottom-0 h-[90dvh] rounded-t-3xl animate-slide-up"
            : cn(
                "bottom-4 right-4 top-4 rounded-2xl animate-panel-in md:bottom-6 md:right-6 md:top-6 border border-slate-700/30",
                panelWidth
              ),
          showMinimized && "top-auto h-auto rounded-2xl"
        )}
      >
        {/* ============ HEADER ============ */}
        <div className="flex items-center gap-3 px-4 py-3 border-b border-slate-700/30">
          <AIRobotAvatar size="md" />
          <div className="min-w-0 flex-1">
            <h2 className="text-[15px] font-semibold text-white">
              AI Assistant
            </h2>
            <p className="text-[11px] text-slate-400 truncate">
              Business Intelligence
            </p>
          </div>

          {/* Context Selector */}
          <div className="relative">
            <button
              onClick={(e) => {
                e.stopPropagation();
                setShowContextDropdown(!showContextDropdown);
              }}
              className="flex items-center gap-1.5 rounded-lg bg-[#1E293B] border border-slate-700/30 px-3 py-1.5 text-[12px] text-slate-300 hover:bg-slate-700/30 transition-colors"
            >
              {CONTEXT_OPTIONS.find((c) => c.id === activeContext)?.label}
              <ChevronDown className="h-3.5 w-3.5 text-slate-400" />
            </button>
            {showContextDropdown && (
              <div className="absolute right-0 top-full mt-1 w-44 rounded-xl bg-[#1E293B] border border-slate-700/30 p-1 shadow-xl z-50">
                {CONTEXT_OPTIONS.map((option) => (
                  <button
                    key={option.id}
                    onClick={() => {
                      setActiveContext(option.id);
                      setShowContextDropdown(false);
                    }}
                    className={cn(
                      "flex w-full items-center rounded-lg px-3 py-2 text-[12px] transition-colors text-left",
                      activeContext === option.id
                        ? "bg-[#3B82F6]/20 text-[#3B82F6]"
                        : "text-slate-300 hover:bg-slate-700/30"
                    )}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Window Controls */}
          <div className="flex items-center gap-0.5">
            <Tooltip content={minimized ? "Expand" : "Minimize"}>
              <button
                onClick={toggleMinimize}
                className="flex h-7 w-7 items-center justify-center rounded-lg text-slate-400 hover:bg-slate-700/30 hover:text-white transition-colors"
              >
                {minimized ? (
                  <Maximize2 className="h-4 w-4" />
                ) : (
                  <Minus className="h-4 w-4" />
                )}
              </button>
            </Tooltip>
            <Tooltip content="Close">
              <button
                onClick={closePanel}
                className="flex h-7 w-7 items-center justify-center rounded-lg text-slate-400 hover:bg-slate-700/30 hover:text-white transition-colors"
              >
                <X className="h-4 w-4" />
              </button>
            </Tooltip>
          </div>
        </div>

        {/* ============ CONTENT ============ */}
        {!showMinimized && (
          <>
            <div
              ref={scrollRef}
              className="min-h-0 flex-1 overflow-y-auto"
            >
              {/* Welcome Section */}
              {messages.length === 0 && !thinking && (
                <div className="px-5 py-6">
                  {/* Robot Avatar */}
                  <div className="mb-5">
                    <AIRobotAvatar size="xl" />
                  </div>

                  {/* Greeting */}
                  <h3 className="text-[22px] font-bold text-white mb-1.5">
                    Hello, {user?.name?.split(" ")[0] || "User"}! 👋
                  </h3>
                  <p className="text-[14px] text-slate-400 mb-5">
                    How can I help with your business today?
                  </p>

                  {/* Context Badges */}
                  <div className="flex flex-wrap items-center gap-2 mb-6">
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-[#1E293B] border border-slate-700/30 px-3 py-1.5 text-[12px] text-slate-300">
                      <span className="h-1.5 w-1.5 rounded-full bg-[#3B82F6]" />
                      Context: Inventory
                    </span>
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-[#1E293B] border border-slate-700/30 px-3 py-1.5 text-[12px] text-slate-300">
                      Sales / Cashier
                    </span>
                  </div>

                  {/* Quick Questions */}
                  <div>
                    <h4 className="text-[11px] font-semibold uppercase tracking-wider text-slate-500 mb-3">
                      Quick Questions
                    </h4>
                    <div className="flex flex-wrap gap-2">
                      {QUICK_QUESTIONS.map((question) => (
                        <button
                          key={question.id}
                          onClick={() => handleQuickQuestion(question)}
                          className="rounded-full bg-[#1E293B] border border-slate-700/30 px-4 py-2 text-[13px] text-slate-300 hover:bg-[#3B82F6]/10 hover:border-[#3B82F6]/30 hover:text-white transition-all duration-200"
                        >
                          {question.label}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* Chat Messages */}
              {messages.length > 0 && (
                <div className="px-4 py-4 space-y-4">
                  {messages.map((msg) => (
                    <MessageBubble
                      key={msg.id}
                      message={msg}
                      isUser={msg.role === "user"}
                    />
                  ))}
                  {thinking && <TypingIndicator />}
                </div>
              )}
            </div>

            {/* ============ INPUT AREA ============ */}
            <div className="px-4 pb-4 pt-2">
              <div className="flex items-center gap-2 rounded-2xl bg-[#1E293B] border border-slate-700/30 px-4 py-3 transition-all duration-200 focus-within:border-[#3B82F6]/50 focus-within:ring-1 focus-within:ring-[#3B82F6]/20">
                <input
                  ref={inputRef}
                  type="text"
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Ask about your business..."
                  className="flex-1 bg-transparent text-[14px] text-white outline-none placeholder:text-slate-500"
                />
                <button
                  onClick={handleSend}
                  disabled={!inputValue.trim() || thinking}
                  className={cn(
                    "flex h-9 w-9 shrink-0 items-center justify-center rounded-xl transition-all duration-200",
                    inputValue.trim() && !thinking
                      ? "bg-[#3B82F6] text-white hover:bg-[#2563EB]"
                      : "bg-slate-700/30 text-slate-500"
                  )}
                >
                  <Send className="h-4 w-4" />
                </button>
              </div>
              <p className="mt-2 text-center text-[11px] text-slate-500">
                Enter to send • Shift + Enter for a new line
              </p>
            </div>
          </>
        )}
      </section>
    </>,
    document.body
  );
}

export default EnterpriseAIAssistant;
