import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { Building2, SlidersHorizontal, Bell, Lock, Database, RotateCcw, Sun, Moon, Monitor, UserCircle2, Sparkles } from "lucide-react";
import { cn } from "../utils/cn.js";
import { useI18n } from "../i18n/index.jsx";
import { useAuth } from "../context/AuthContext.jsx";
import { useTheme } from "../context/ThemeContext.jsx";
import { useSettings } from "../context/SettingsContext.jsx";
import { useCurrency } from "../context/CurrencyContext.jsx";
import { CURRENCIES, formatAmount, normalizeRate } from "../services/currency.js";
import { api, errorKey, USE_MOCK, API_URL } from "../services/api.js";
import { useLocalStorage } from "../hooks/index.js";
import { PageHeader } from "../components/layout/PageHeader.jsx";
import { BrandMark } from "../components/layout/Brand.jsx";
import { ImageInput } from "../components/ui/ImageInput.jsx";
import { AISettings } from "../components/ai/index.js";
import { Button, Card, CardHeader, CardContent, CardFooter, Field, Input, Select, Textarea, Switch, RadioGroup, Tabs, Alert, Badge, ConfirmDialog, useToast } from "../components/ui/index.js";

const TABS = ["profile", "general", "appearance", "notifications", "ai", "security", "data"];

/* ---------------- Profile ---------------- */
function ProfileTab() {
  const { t } = useI18n();
  const { user, setUser } = useAuth();
  const toast = useToast();
  const [form, setForm] = useState({ name: user?.name || "", phone: user?.phone || "", avatar: user?.avatar || "" });
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);
  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  useEffect(() => {
    setForm({ name: user?.name || "", phone: user?.phone || "", avatar: user?.avatar || "" });
  }, [user?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  const submit = async (e) => {
    e.preventDefault();
    const errs = {};
    if (!form.name.trim()) errs.name = t("validation.required");
    setErrors(errs);
    if (Object.keys(errs).length) return;
    setSaving(true);
    try {
      const updated = await api.updateProfile({ name: form.name.trim(), phone: form.phone, avatar: form.avatar });
      setUser((u) => ({ ...u, ...updated }));
      toast.success(t("settings.profileSaved"));
    } catch (err) {
      toast.error(t(errorKey(err)));
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={submit} noValidate>
      <Card>
        <CardHeader title={t("settings.profile")} description={t("settings.profileHint")} />
        <CardContent className="grid grid-cols-1 gap-6 xl:grid-cols-[minmax(0,1fr)_minmax(0,1.4fr)]">
          <Field label={t("settings.profilePhoto")}>
            <ImageInput value={form.avatar} onChange={(v) => set("avatar", v)} name={form.name} shape="circle" size="xl" hint={t("settings.photoHint")} />
          </Field>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Field label={t("users.fullName")} htmlFor="p-name" required error={errors.name}>
              <Input id="p-name" value={form.name} onChange={(e) => set("name", e.target.value)} error={!!errors.name} />
            </Field>
            <Field label={t("common.phone")} htmlFor="p-phone">
              <Input id="p-phone" type="tel" value={form.phone} onChange={(e) => set("phone", e.target.value)} />
            </Field>
            <Field label={t("common.email")} htmlFor="p-email" hint={t("settings.emailManaged")}>
              <Input id="p-email" type="email" value={user?.email || ""} readOnly />
            </Field>
            <Field label={t("common.role")}>
              <div className="flex h-9 flex-wrap items-center gap-1.5">
                <Badge variant="primary">{user?.role?.name}</Badge>
                {user?.branch_name && <Badge variant="neutral">{user.branch_name}</Badge>}
              </div>
            </Field>
          </div>
        </CardContent>
        <CardFooter>
          <Button type="submit" loading={saving}>
            {t("common.saveChanges")}
          </Button>
        </CardFooter>
      </Card>
    </form>
  );
}

/* ---------------- General (business + currency) ---------------- */
function GeneralTab({ canEdit }) {
  const { t } = useI18n();
  const { settings, update } = useSettings();
  const toast = useToast();
  const [form, setForm] = useState(settings);
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);
  useEffect(() => setForm(settings), [settings]);
  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));
  const rate = normalizeRate(form.exchange_rate);

  const submit = async (e) => {
    e.preventDefault();
    const errs = {};
    if (!form.business_name?.trim()) errs.business_name = t("validation.required");
    if (form.business_email && !/^\S+@\S+\.\S+$/.test(form.business_email)) errs.business_email = t("validation.email");
    if (!(Number(form.exchange_rate) > 0)) errs.exchange_rate = t("validation.number");
    setErrors(errs);
    if (Object.keys(errs).length) return;
    setSaving(true);
    try {
      await update({ ...form, business_name: form.business_name.trim(), business_subtitle: (form.business_subtitle || "").trim(), base_currency: "USD", exchange_rate: Number(form.exchange_rate), tax_rate: Number(form.tax_rate) || 0, low_stock_threshold: Number(form.low_stock_threshold) || 0 });
      toast.success(t("settings.saved"));
    } catch (err) {
      toast.error(t(errorKey(err)));
    } finally {
      setSaving(false);
    }
  };

  const currencyOptions = Object.values(CURRENCIES).map((c) => ({ value: c.code, label: `${c.symbol} ${c.code} — ${t(c.nameKey)}` }));

  return (
    <form onSubmit={submit} noValidate className="space-y-4">
      <Card>
        <CardHeader title={t("settings.branding")} description={t("settings.brandingHint")} />
        <CardContent className="grid grid-cols-1 gap-6 xl:grid-cols-[minmax(0,1fr)_minmax(0,1.4fr)]">
          <Field label={t("settings.businessLogo")} hint={t("settings.logoHint")}>
            <ImageInput value={form.business_logo || ""} onChange={(v) => set("business_logo", v)} name={form.business_name} shape="square" size="xl" disabled={!canEdit} />
          </Field>
          <div className="grid grid-cols-1 gap-4">
            <Field label={t("settings.businessName")} htmlFor="s-name" required error={errors.business_name}>
              <Input id="s-name" value={form.business_name || ""} onChange={(e) => set("business_name", e.target.value)} disabled={!canEdit} error={!!errors.business_name} />
            </Field>
            <Field label={t("settings.businessSubtitle")} htmlFor="s-subtitle" hint={t("settings.subtitleHint")}>
              <Input id="s-subtitle" value={form.business_subtitle || ""} onChange={(e) => set("business_subtitle", e.target.value)} disabled={!canEdit} placeholder={t("app.name")} />
            </Field>
            {/* Live preview of how the brand appears in the sidebar / login */}
            <div className="flex items-center gap-3 rounded-lg border border-border bg-surface-muted px-4 py-3">
              <BrandMark src={form.business_logo || ""} size="lg" />
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold text-fg">{form.business_name || t("settings.businessName")}</p>
                <p className="truncate text-xs text-fg-muted">{form.business_subtitle || t("app.name")}</p>
              </div>
              <span className="ml-auto text-[11px] font-medium uppercase tracking-wide text-fg-muted">{t("common.preview")}</span>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader title={t("settings.general")} />
        <CardContent className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
          <Field label={t("settings.businessEmail")} htmlFor="s-email" error={errors.business_email}>
            <Input id="s-email" type="email" value={form.business_email || ""} onChange={(e) => set("business_email", e.target.value)} disabled={!canEdit} error={!!errors.business_email} />
          </Field>
          <Field label={t("settings.businessPhone")} htmlFor="s-phone">
            <Input id="s-phone" type="tel" value={form.business_phone || ""} onChange={(e) => set("business_phone", e.target.value)} disabled={!canEdit} />
          </Field>
          <Field label={t("settings.businessAddress")} htmlFor="s-address" className="sm:col-span-2 xl:col-span-3">
            <Textarea id="s-address" rows={2} value={form.business_address || ""} onChange={(e) => set("business_address", e.target.value)} disabled={!canEdit} />
          </Field>
          <Field label={t("settings.taxRate")} htmlFor="s-tax">
            <Input id="s-tax" type="number" min={0} max={100} step="0.1" value={form.tax_rate ?? ""} onChange={(e) => set("tax_rate", e.target.value)} disabled={!canEdit} />
          </Field>
          <Field label={t("settings.lowStockThreshold")} htmlFor="s-low">
            <Input id="s-low" type="number" min={0} step={1} value={form.low_stock_threshold ?? ""} onChange={(e) => set("low_stock_threshold", e.target.value)} disabled={!canEdit} />
          </Field>
          <Field label={t("settings.receiptFooter")} htmlFor="s-footer">
            <Input id="s-footer" value={form.receipt_footer || ""} onChange={(e) => set("receipt_footer", e.target.value)} disabled={!canEdit} />
          </Field>
        </CardContent>
        {canEdit && (
          <CardFooter>
            <Button type="submit" loading={saving}>
              {t("common.saveChanges")}
            </Button>
          </CardFooter>
        )}
      </Card>

      <Card>
        <CardHeader title={t("settings.currencySection")} description={t("settings.baseCurrencyHint")} />
        <CardContent className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
          <Field label={t("settings.baseCurrency")} htmlFor="s-base">
            <Input id="s-base" value={`$ USD — ${t("currency.usd")}`} readOnly />
          </Field>
          <Field label={t("settings.displayCurrency")} htmlFor="s-currency" hint={t("settings.displayCurrencyHint")}>
            <Select id="s-currency" value={form.currency || "USD"} onChange={(e) => set("currency", e.target.value)} disabled={!canEdit} options={currencyOptions} />
          </Field>
          <Field label={t("settings.exchangeRate")} htmlFor="s-rate" required error={errors.exchange_rate} hint={t("settings.exchangeRateHint", { example: `$1.00 = ${formatAmount(rate, "KHR")} · $10.00 = ${formatAmount(rate * 10, "KHR")}` })}>
            <Input id="s-rate" type="number" inputMode="decimal" min={1} step={1} addonLeft="៛" value={form.exchange_rate ?? ""} onChange={(e) => set("exchange_rate", e.target.value)} disabled={!canEdit} error={!!errors.exchange_rate} />
          </Field>
        </CardContent>
        {canEdit && (
          <CardFooter>
            <Button type="submit" loading={saving}>
              {t("common.saveChanges")}
            </Button>
          </CardFooter>
        )}
      </Card>
    </form>
  );
}

/* ---------------- Preferences ---------------- */
function PreferencesTab() {
  const { t, lang, setLang, languages } = useI18n();
  const { theme, setTheme } = useTheme();
  const money = useCurrency();
  const [collapsed, setCollapsed] = useLocalStorage("sbs.sidebar.collapsed", false);
  const themes = [
    { value: "light", label: t("common.light"), icon: Sun },
    { value: "dark", label: t("common.dark"), icon: Moon },
    { value: "system", label: t("common.system"), icon: Monitor },
  ];
  return (
    <Card>
      <CardHeader title={t("settings.appearance")} />
      <CardContent className="grid grid-cols-1 gap-6 xl:grid-cols-2">
        <Field label={t("settings.theme")} hint={t("settings.themeHint")}>
          <div className="grid grid-cols-3 gap-2" role="radiogroup" aria-label={t("settings.theme")}>
            {themes.map((o) => (
              <button
                key={o.value}
                type="button"
                role="radio"
                aria-checked={theme === o.value}
                onClick={() => setTheme(o.value)}
                className={cn(
                  "flex flex-col items-center gap-2 rounded-lg border px-3 py-3 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30",
                  theme === o.value ? "border-primary bg-primary-50 text-primary-700" : "border-border text-fg-secondary hover:bg-surface-hover"
                )}
              >
                <o.icon className="h-5 w-5" aria-hidden="true" />
                {o.label}
              </button>
            ))}
          </div>
        </Field>
        <Field label={t("common.language")} hint={t("settings.languageHint")}>
          <RadioGroup name="lang" value={lang} onChange={setLang} inline options={languages.map((l) => ({ value: l.code, label: `${l.nativeLabel} (${t(l.labelKey)})` }))} />
        </Field>
        <Field label={t("currency.switch")} hint={t("currency.rate", { rate: formatAmount(money.rate, "KHR") })}>
          <RadioGroup name="display-currency" value={money.display} onChange={money.setDisplay} inline options={money.codes.map((c) => ({ value: c, label: `${CURRENCIES[c].symbol} ${c} — ${t(CURRENCIES[c].nameKey)}` }))} />
        </Field>
        <div className="rounded-md border border-border px-4 py-3 xl:self-end">
          <Switch checked={collapsed} onChange={setCollapsed} label={t("settings.sidebarDefault")} />
        </div>
      </CardContent>
    </Card>
  );
}

/* ---------------- Notifications ---------------- */
function NotificationsTab({ canEdit }) {
  const { t } = useI18n();
  const { settings, update } = useSettings();
  const toast = useToast();
  const [form, setForm] = useState(settings);
  const [saving, setSaving] = useState(false);
  useEffect(() => setForm(settings), [settings]);
  const save = async () => {
    setSaving(true);
    try {
      await update({ notify_low_stock: !!form.notify_low_stock, notify_orders: !!form.notify_orders, notify_reports: !!form.notify_reports });
      toast.success(t("settings.saved"));
    } catch (err) {
      toast.error(t(errorKey(err)));
    } finally {
      setSaving(false);
    }
  };
  const rows = [
    ["notify_low_stock", "settings.notifyLowStock", "settings.notifyLowStockHint"],
    ["notify_orders", "settings.notifyOrders", "settings.notifyOrdersHint"],
    ["notify_reports", "settings.notifyReports", "settings.notifyReportsHint"],
  ];
  return (
    <Card>
      <CardHeader title={t("settings.notifications")} />
      <CardContent className="divide-y divide-border p-0">
        {rows.map(([k, l, h]) => (
          <div key={k} className="px-5 py-4">
            <Switch checked={!!form[k]} onChange={(v) => setForm((f) => ({ ...f, [k]: v }))} label={t(l)} description={t(h)} disabled={!canEdit} />
          </div>
        ))}
      </CardContent>
      {canEdit && (
        <CardFooter>
          <Button onClick={save} loading={saving}>
            {t("common.saveChanges")}
          </Button>
        </CardFooter>
      )}
    </Card>
  );
}

/* ---------------- Security ---------------- */
function SecurityTab() {
  const { t } = useI18n();
  const toast = useToast();
  const [form, setForm] = useState({ current: "", next: "", confirm: "" });
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);
  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  const submit = async (e) => {
    e.preventDefault();
    const errs = {};
    if (!form.current) errs.current = t("validation.required");
    if (!form.next) errs.next = t("validation.required");
    else if (form.next.length < 6) errs.next = t("validation.minLength", { min: 6 });
    if (form.next !== form.confirm) errs.confirm = t("validation.passwordMatch");
    setErrors(errs);
    if (Object.keys(errs).length) return;
    setSaving(true);
    try {
      await api.changePassword({ current_password: form.current, new_password: form.next });
      toast.success(t("settings.passwordChanged"));
      setForm({ current: "", next: "", confirm: "" });
    } catch (err) {
      if (err?.status === 422) setErrors({ current: t("auth.invalidCredentials") });
      else toast.error(t(errorKey(err)));
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={submit} noValidate>
      <Card>
        <CardHeader title={t("settings.changePassword")} />
        <CardContent className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
          <Field label={t("settings.currentPassword")} htmlFor="pw-current" required error={errors.current}>
            <Input id="pw-current" type="password" autoComplete="current-password" value={form.current} onChange={(e) => set("current", e.target.value)} error={!!errors.current} />
          </Field>
          <Field label={t("settings.newPassword")} htmlFor="pw-next" required error={errors.next}>
            <Input id="pw-next" type="password" autoComplete="new-password" value={form.next} onChange={(e) => set("next", e.target.value)} error={!!errors.next} />
          </Field>
          <Field label={t("settings.confirmNewPassword")} htmlFor="pw-confirm" required error={errors.confirm}>
            <Input id="pw-confirm" type="password" autoComplete="new-password" value={form.confirm} onChange={(e) => set("confirm", e.target.value)} error={!!errors.confirm} />
          </Field>
        </CardContent>
        <CardFooter>
          <Button type="submit" loading={saving}>
            {t("settings.changePassword")}
          </Button>
        </CardFooter>
      </Card>
    </form>
  );
}

/* ---------------- Data ---------------- */
function DataTab({ canEdit }) {
  const { t } = useI18n();
  const toast = useToast();
  const [confirm, setConfirm] = useState(false);
  const [busy, setBusy] = useState(false);
  const reset = async () => {
    setBusy(true);
    try {
      await api.resetDemo();
      toast.success(t("settings.resetDone"));
      setTimeout(() => window.location.reload(), 600);
    } catch (err) {
      toast.error(t(errorKey(err)));
      setBusy(false);
    }
  };
  return (
    <Card>
      <CardHeader title={t("settings.data")} />
      <CardContent className="space-y-5">
        <dl className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <dt className="text-[11px] font-medium uppercase tracking-wide text-fg-muted">{t("settings.dataMode")}</dt>
            <dd className="mt-1">
              <Badge variant={USE_MOCK ? "warning" : "success"} dot>
                {USE_MOCK ? t("settings.mockMode") : t("settings.liveMode")}
              </Badge>
            </dd>
          </div>
          <div>
            <dt className="text-[11px] font-medium uppercase tracking-wide text-fg-muted">{t("settings.apiBase")}</dt>
            <dd className="mt-1 font-mono text-sm text-fg">{USE_MOCK ? "VITE_USE_MOCK=true" : API_URL}</dd>
          </div>
        </dl>
        {USE_MOCK && canEdit && (
          <Alert
            variant="warning"
            title={t("settings.resetDemo")}
            action={
              <Button variant="danger-outline" size="sm" leftIcon={RotateCcw} onClick={() => setConfirm(true)}>
                {t("settings.resetDemo")}
              </Button>
            }
          >
            {t("settings.resetDemoHint")}
          </Alert>
        )}
      </CardContent>
      <ConfirmDialog open={confirm} onClose={() => !busy && setConfirm(false)} onConfirm={reset} loading={busy} title={t("settings.resetDemo")} description={t("settings.resetDemoHint")} confirmLabel={t("common.reset")} />
    </Card>
  );
}

export default function SettingsPage() {
  const { t } = useI18n();
  const { can } = useAuth();
  const [params, setParams] = useSearchParams();
  const initial = TABS.includes(params.get("tab")) ? params.get("tab") : "general";
  const [tab, setTab] = useState(initial);
  const canEdit = can("settings.update");

  useEffect(() => {
    const p = params.get("tab");
    const next = TABS.includes(p) ? p : "general";
    if (next !== tab) setTab(next);
  }, [params]); // eslint-disable-line react-hooks/exhaustive-deps

  const change = (key) => {
    setTab(key);
    setParams(key === "general" ? {} : { tab: key }, { replace: true });
  };

  const tabs = [
    { key: "profile", label: t("settings.profile"), icon: UserCircle2 },
    { key: "general", label: t("settings.general"), icon: Building2 },
    { key: "appearance", label: t("settings.appearance"), icon: SlidersHorizontal },
    { key: "notifications", label: t("settings.notifications"), icon: Bell },
    { key: "ai", label: t("ai.assistant"), icon: Sparkles },
    { key: "security", label: t("settings.security"), icon: Lock },
    { key: "data", label: t("settings.data"), icon: Database },
  ];

  return (
    <>
      <PageHeader title={t("settings.title")} description={t("settings.subtitle")} />
      <div className="grid gap-4 lg:grid-cols-[224px_minmax(0,1fr)]">
        <Tabs className="lg:hidden" tabs={tabs} value={tab} onChange={change} />
        <Card as="nav" className="hidden self-start p-2 lg:sticky lg:top-20 lg:block" aria-label={t("settings.title")}>
          {tabs.map((tb) => {
            const active = tb.key === tab;
            return (
              <button
                key={tb.key}
                type="button"
                onClick={() => change(tb.key)}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "flex w-full items-center gap-3 rounded-md px-3 py-2 text-left text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30",
                  active ? "bg-primary-50 text-primary-700" : "text-fg-secondary hover:bg-surface-hover hover:text-fg"
                )}
              >
                <tb.icon className={cn("h-4 w-4 shrink-0", active ? "text-accent" : "text-fg-muted")} aria-hidden="true" />
                {tb.label}
              </button>
            );
          })}
        </Card>
        <div className="min-w-0">
          {tab === "profile" && <ProfileTab />}
          {tab === "general" && <GeneralTab canEdit={canEdit} />}
          {tab === "appearance" && <PreferencesTab />}
          {tab === "notifications" && <NotificationsTab canEdit={canEdit} />}
          {tab === "ai" && <AISettings />}
          {tab === "security" && <SecurityTab />}
          {tab === "data" && <DataTab canEdit={canEdit} />}
        </div>
      </div>
    </>
  );
}
