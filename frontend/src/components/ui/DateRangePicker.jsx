import { useState } from "react";
import { Calendar, Check, ChevronDown, ArrowRight } from "lucide-react";
import { cn } from "../../utils/cn.js";
import { toInputDate } from "../../utils/format.js";
import { useI18n } from "../../i18n/index.jsx";
import { useFormat } from "../../context/CurrencyContext.jsx";
import { Button } from "./Button.jsx";
import { Dropdown, DropdownItem, DropdownLabel, DropdownSeparator } from "./Dropdown.jsx";
import { Modal } from "./Modal.jsx";
import { Field, Input } from "./Form.jsx";
import { Alert } from "./Feedback.jsx";

export const RANGE_PRESETS = ["today", "yesterday", "last7", "last30", "last90", "thisMonth", "lastMonth", "thisYear", "lastYear"];

const LABEL_KEYS = {
  today: "common.today",
  yesterday: "common.yesterday",
  last7: "common.last7",
  last30: "common.last30",
  last90: "common.last90",
  thisMonth: "common.thisMonth",
  lastMonth: "common.lastMonth",
  thisYear: "common.thisYear",
  lastYear: "common.lastYear",
  custom: "common.customRange",
};

export function rangeLabel(value, t, fmt) {
  if (value?.key === "custom" && value.from && value.to) return `${fmt.date(value.from)} – ${fmt.date(value.to)}`;
  return t(LABEL_KEYS[value?.key] || "common.dateRange");
}

/**
 * Date range selector: preset dropdown + "Custom range →" dialog.
 * value: { key: 'today' | 'yesterday' | 'last7' | ... | 'custom', from?, to? }
 */
export function DateRangePicker({ value = { key: "last30" }, onChange, size = "sm", className }) {
  const { t } = useI18n();
  const fmt = useFormat();
  const [open, setOpen] = useState(false);
  const [from, setFrom] = useState(() => value.from || toInputDate(new Date(Date.now() - 6 * 86400000)));
  const [to, setTo] = useState(() => value.to || toInputDate(new Date()));
  const [error, setError] = useState(null);

  const openCustom = () => {
    if (value.from) setFrom(value.from);
    if (value.to) setTo(value.to);
    setError(null);
    setOpen(true);
  };

  const apply = (e) => {
    e?.preventDefault();
    if (!from || !to) return setError(t("validation.required"));
    if (to < from) return setError(t("validation.dateOrder"));
    onChange({ key: "custom", from, to });
    setOpen(false);
    return undefined;
  };

  return (
    <>
      <Dropdown
        width={240}
        trigger={
          <Button variant="outline" size={size} leftIcon={Calendar} rightIcon={ChevronDown} className={cn("max-w-full", className)} aria-label={t("common.dateRange")}>
            <span className="truncate">{rangeLabel(value, t, fmt)}</span>
          </Button>
        }
      >
        <DropdownLabel>{t("common.dateRange")}</DropdownLabel>
        {RANGE_PRESETS.map((k) => (
          <DropdownItem key={k} onClick={() => onChange({ key: k })} active={value.key === k} trailing={value.key === k ? Check : undefined}>
            {t(LABEL_KEYS[k])}
          </DropdownItem>
        ))}
        <DropdownSeparator />
        <DropdownItem onClick={openCustom} active={value.key === "custom"} trailing={ArrowRight}>
          {t("common.customRange")}
        </DropdownItem>
      </Dropdown>

      <Modal
        open={open}
        onClose={() => setOpen(false)}
        title={t("common.customRange")}
        size="sm"
        footer={
          <>
            <Button variant="outline" onClick={() => setOpen(false)} className="w-full sm:w-auto">
              {t("common.cancel")}
            </Button>
            <Button type="submit" form="date-range-form" className="w-full sm:w-auto">
              {t("common.apply")}
            </Button>
          </>
        }
      >
        <form id="date-range-form" onSubmit={apply} noValidate className="space-y-4">
          {error && <Alert variant="danger">{error}</Alert>}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Field label={t("common.from")} htmlFor="dr-from" required>
              <Input id="dr-from" type="date" value={from} max={to || undefined} onChange={(e) => setFrom(e.target.value)} data-autofocus />
            </Field>
            <Field label={t("common.to")} htmlFor="dr-to" required>
              <Input id="dr-to" type="date" value={to} min={from || undefined} onChange={(e) => setTo(e.target.value)} />
            </Field>
          </div>
        </form>
      </Modal>
    </>
  );
}
