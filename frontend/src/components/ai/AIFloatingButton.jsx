import { createPortal } from "react-dom";
import { useLocation } from "react-router-dom";
import { cn } from "../../utils/cn.js";
import { useI18n } from "../../i18n/index.jsx";
import { useAIAssistant } from "../../context/AIAssistantContext.jsx";
import { Tooltip } from "../ui/index.js";
import { AIRobotIcon } from "./AIRobot.jsx";

/** Global robot button (bottom-right). Hidden while the panel is open or when disabled in settings. */
export function AIFloatingButton() {
  const { t } = useI18n();
  const { showFloating, open, openPanel } = useAIAssistant();
  const { pathname } = useLocation();
  if (!showFloating || open) return null;
  // POS has a fixed bottom cart bar on mobile — lift the button above it.
  const onPos = pathname.startsWith("/sales");
  return createPortal(
    <div className={cn("fixed right-4 z-30 animate-pop-in md:bottom-6 md:right-6", onPos ? "bottom-24 lg:bottom-6" : "bottom-4")}>
      <Tooltip content={t("ai.assistant")} side="left">
        <button
          type="button"
          onClick={openPanel}
          aria-label={t("ai.assistant")}
          className="group flex h-12 w-12 items-center justify-center rounded-full bg-primary p-2 text-white shadow-md transition-all duration-150 hover:scale-105 hover:bg-primary-hover hover:shadow-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 focus-visible:ring-offset-2 active:scale-95"
        >
          <AIRobotIcon className="text-white transition-transform duration-200 group-hover:-rotate-6" />
        </button>
      </Tooltip>
    </div>,
    document.body
  );
}
