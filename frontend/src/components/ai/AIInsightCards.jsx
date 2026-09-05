import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { AlertTriangle, TrendingUp, TrendingDown, Lightbulb, ArrowRight } from "lucide-react";
import { cn } from "../../utils/cn.js";
import { useI18n } from "../../i18n/index.jsx";
import { useAIAssistant } from "../../context/AIAssistantContext.jsx";
import { getDashboardInsights } from "../../services/aiAssistant.js";
import { INTENTS } from "../../config/aiAssistant.js";
import { Card, Skeleton, Button } from "../ui/index.js";
import { AIRobotIcon } from "./AIRobot.jsx";
import { StaggerGroup } from "../ui/Motion.jsx";

const ICONS = { alert: AlertTriangle, up: TrendingUp, down: TrendingDown, bulb: Lightbulb };
const TONES = {
  warning: "bg-warning-light text-warning-dark",
  success: "bg-success-light text-success-dark",
  danger: "bg-danger-light text-danger-dark",
  primary: "bg-primary-50 text-accent",
};

/** One compact insight card (dashboard). */
export function AIInsightCard({ insight, onAsk, style }) {
  const { t } = useI18n();
  const navigate = useNavigate();
  const Icon = ICONS[insight.icon] || Lightbulb;
  const text = t(insight.textKey, insight.params);
  return (
    <Card className="card-hover flex flex-col p-4" style={style}>
      <div className="flex items-center gap-2.5">
        <span className={cn("flex h-8 w-8 shrink-0 items-center justify-center rounded-md", TONES[insight.tone] || TONES.primary)} aria-hidden="true">
          <Icon className="h-4 w-4" />
        </span>
        <p className="truncate text-sm font-semibold text-fg">{t(insight.titleKey)}</p>
      </div>
      <p className="mt-2 flex-1 text-sm leading-relaxed text-fg-secondary">{text}</p>
      <div className="mt-3 flex items-center gap-3">
        {insight.link && (
          <Button variant="link" size="sm" rightIcon={ArrowRight} onClick={() => navigate(insight.link)}>
            {t("ai.viewDetails")}
          </Button>
        )}
        {insight.intent && (
          <Button variant="link" size="sm" onClick={() => onAsk(insight.intent, t(INTENTS[insight.intent].labelKey))} className="text-fg-muted hover:text-accent">
            <AIRobotIcon className="mr-1 inline-block h-4 w-4 align-[-3px]" />
            {t("ai.askAi")}
          </Button>
        )}
      </div>
    </Card>
  );
}

/** "AI INSIGHTS" strip for the dashboard — compact, never a chat box. */
export function AIInsightCards({ refreshKey = 0, className }) {
  const { t } = useI18n();
  const { showInsights, openPanel, ask } = useAIAssistant();
  const [state, setState] = useState({ items: null, error: false });

  useEffect(() => {
    if (!showInsights) return undefined;
    let active = true;
    setState({ items: null, error: false });
    getDashboardInsights()
      .then((items) => active && setState({ items, error: false }))
      .catch(() => active && setState({ items: [], error: true }));
    return () => {
      active = false;
    };
  }, [showInsights, refreshKey]);

  if (!showInsights || state.error) return null;

  const onAsk = (intent, label) => {
    openPanel();
    ask(intent, { label });
  };

  return (
    <section className={className} aria-label={t("ai.insightsTitle")}>
      <div className="mb-3 flex items-center justify-between gap-3">
        <h2 className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-wider text-fg-muted">
          <AIRobotIcon className="h-4 w-4 text-accent" />
          {t("ai.insightsTitle")}
        </h2>
        <Button variant="ghost" size="xs" onClick={() => openPanel()}>
          <AIRobotIcon className="mr-1 inline-block h-4 w-4 align-[-3px]" />
          {t("ai.openAssistant")}
        </Button>
      </div>
      <StaggerGroup className="grid grid-cols-1 gap-4 md:grid-cols-3">
        {state.items === null ? [...Array(3)].map((_, i) => <Skeleton key={i} className="h-[124px] w-full rounded-lg" />) : state.items.map((ins) => <AIInsightCard key={ins.id} insight={ins} onAsk={onAsk} />)}
      </StaggerGroup>
    </section>
  );
}
