import { Sparkles } from "lucide-react";
import { useI18n } from "../../i18n/index.jsx";
import { useAIAssistant } from "../../context/AIAssistantContext.jsx";
import { AI_ROLES } from "../../config/aiAssistant.js";
import { Card, CardHeader, CardContent, Switch, Field, Select, Alert, Button } from "../ui/index.js";
import { AIRobotIcon } from "./AIRobot.jsx";

/** Settings → AI Assistant (frontend/localStorage only). */
export function AISettings() {
  const { t } = useI18n();
  const { settings, updateSettings, demoRole, setDemoRole, openPanel, enabled } = useAIAssistant();
  const rows = [
    ["enabled", "ai.settings.enable", "ai.settings.enableHint"],
    ["floatingButton", "ai.settings.floating", "ai.settings.floatingHint"],
    ["insights", "ai.settings.insights", "ai.settings.insightsHint"],
    ["quickQuestions", "ai.settings.quick", "ai.settings.quickHint"],
  ];
  return (
    <div className="space-y-4">
      <Card>
        <CardHeader title={t("ai.assistant")} description={t("ai.settings.description")} action={enabled && <Button variant="outline" size="sm" onClick={openPanel}><AIRobotIcon className="h-4 w-4" /> {t("ai.openAssistant")}</Button>} />
        <CardContent className="divide-y divide-border p-0">
          {rows.map(([k, l, h]) => (
            <div key={k} className="px-5 py-4">
              <Switch checked={!!settings[k]} onChange={(v) => updateSettings({ [k]: v })} label={t(l)} description={t(h)} disabled={k !== "enabled" && !settings.enabled} />
            </div>
          ))}
        </CardContent>
      </Card>

      <Card>
        <CardHeader title={t("ai.demoRole")} description={t("ai.settings.roleHint")} />
        <CardContent className="space-y-4">
          <Alert variant="info">{t("ai.settings.roleNote")}</Alert>
          <Field label={t("ai.demoRole")} htmlFor="ai-role" className="sm:max-w-xs">
            <Select id="ai-role" value={demoRole} onChange={(e) => setDemoRole(e.target.value)} options={AI_ROLES.map((r) => ({ value: r.key, label: t(r.labelKey) }))} disabled={!settings.enabled} />
          </Field>
          <p className="flex items-center gap-2 text-xs text-fg-muted">
            <Sparkles className="h-3.5 w-3.5" aria-hidden="true" />
            {t("ai.settings.localOnly")}
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
