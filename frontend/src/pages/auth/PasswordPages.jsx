import { useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { ArrowLeft, Mail, Lock, CheckCircle2 } from "lucide-react";
import { useI18n } from "../../i18n/index.jsx";
import { useSettings } from "../../context/SettingsContext.jsx";
import { api, errorKey } from "../../services/api.js";
import { Button, Field, Input, Alert, useToast } from "../../components/ui/index.js";
import { BrandMark } from "../../components/layout/Brand.jsx";
import { LanguageSwitcher, ThemeToggle } from "../../components/layout/Navbar.jsx";

function AuthShell({ title, subtitle, children }) {
  const { t } = useI18n();
  const { settings } = useSettings();
  return (
    <div className="flex min-h-screen flex-col bg-background">
      <div className="flex items-center justify-between p-4 sm:p-6">
        <Link to="/landing" className="flex items-center gap-2 rounded-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30">
          <BrandMark size="sm" />
          <span className="text-sm font-semibold text-fg">{settings.business_name}</span>
        </Link>
        <div className="flex items-center gap-2">
          <ThemeToggle variant="outline" />
          <LanguageSwitcher variant="outline" />
        </div>
      </div>
      <div className="flex flex-1 items-start justify-center px-4 pb-12 sm:items-center sm:px-6">
        <div className="w-full max-w-[440px] rounded-xl border border-border bg-surface p-6 shadow-sm animate-scale-in sm:p-8">
          <div className="text-center">
            <BrandMark size="xl" className="mx-auto rounded-2xl" />
            <h1 className="mt-5 text-2xl font-semibold tracking-tight text-fg">{title}</h1>
            <p className="mt-1 text-sm text-fg-secondary">{subtitle}</p>
          </div>
          <div className="mt-7">{children}</div>
          <div className="mt-6 text-center">
            <Link to="/login" className="inline-flex items-center gap-1.5 text-sm font-medium text-accent hover:underline">
              <ArrowLeft className="h-4 w-4" aria-hidden="true" />
              {t("auth.backToSignIn")}
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

export function ForgotPasswordPage() {
  const { t } = useI18n();
  const [email, setEmail] = useState("");
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    if (!/^\S+@\S+\.\S+$/.test(email)) return setError(t("validation.email"));
    setLoading(true);
    setError(null);
    try {
      await api.forgotPassword({ email: email.trim() });
      setSent(true);
    } catch (err) {
      setError(t(errorKey(err)));
    } finally {
      setLoading(false);
    }
    return undefined;
  };

  return (
    <AuthShell title={t("auth.forgotTitle")} subtitle={t("auth.forgotSubtitle")}>
      {sent ? (
        <Alert variant="success" title={t("auth.resetLinkSent")}>
          {t("auth.resetLinkSentHint", { email })}
        </Alert>
      ) : (
        <form onSubmit={submit} noValidate className="space-y-5">
          <Field label={t("common.email")} htmlFor="fp-email" required error={error}>
            <Input id="fp-email" type="email" autoComplete="email" leftIcon={Mail} size="lg" value={email} onChange={(e) => setEmail(e.target.value)} placeholder={t("auth.emailPlaceholder")} error={!!error} autoFocus />
          </Field>
          <Button type="submit" size="lg" fullWidth loading={loading}>
            {t("auth.sendResetLink")}
          </Button>
        </form>
      )}
    </AuthShell>
  );
}

export function ResetPasswordPage() {
  const { t } = useI18n();
  const toast = useToast();
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const [form, setForm] = useState({ email: params.get("email") || "", password: "", confirm: "" });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  const submit = async (e) => {
    e.preventDefault();
    const errs = {};
    if (!/^\S+@\S+\.\S+$/.test(form.email)) errs.email = t("validation.email");
    if (form.password.length < 6) errs.password = t("validation.minLength", { min: 6 });
    if (form.password !== form.confirm) errs.confirm = t("validation.passwordMatch");
    setErrors(errs);
    if (Object.keys(errs).length) return;
    setLoading(true);
    try {
      await api.resetPassword({ token: params.get("token") || "", email: form.email.trim(), password: form.password, password_confirmation: form.confirm });
      setDone(true);
      toast.success(t("auth.passwordReset"));
      setTimeout(() => navigate("/login", { replace: true }), 1200);
    } catch (err) {
      setErrors({ form: t(errorKey(err)) });
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthShell title={t("auth.resetTitle")} subtitle={t("auth.resetSubtitle")}>
      {done ? (
        <Alert variant="success" title={t("auth.passwordReset")}>
          <span className="inline-flex items-center gap-1.5">
            <CheckCircle2 className="h-4 w-4" aria-hidden="true" /> {t("auth.redirectingSignIn")}
          </span>
        </Alert>
      ) : (
        <form onSubmit={submit} noValidate className="space-y-5">
          {errors.form && <Alert variant="danger">{errors.form}</Alert>}
          <Field label={t("common.email")} htmlFor="rp-email" required error={errors.email}>
            <Input id="rp-email" type="email" autoComplete="email" leftIcon={Mail} value={form.email} onChange={(e) => set("email", e.target.value)} error={!!errors.email} />
          </Field>
          <Field label={t("settings.newPassword")} htmlFor="rp-pass" required error={errors.password}>
            <Input id="rp-pass" type="password" autoComplete="new-password" leftIcon={Lock} value={form.password} onChange={(e) => set("password", e.target.value)} error={!!errors.password} />
          </Field>
          <Field label={t("settings.confirmNewPassword")} htmlFor="rp-confirm" required error={errors.confirm}>
            <Input id="rp-confirm" type="password" autoComplete="new-password" leftIcon={Lock} value={form.confirm} onChange={(e) => set("confirm", e.target.value)} error={!!errors.confirm} />
          </Field>
          <Button type="submit" size="lg" fullWidth loading={loading}>
            {t("auth.resetPassword")}
          </Button>
        </form>
      )}
    </AuthShell>
  );
}
