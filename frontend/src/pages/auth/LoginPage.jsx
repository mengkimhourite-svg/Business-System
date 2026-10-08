import { useState } from "react";
import { Link, Navigate, useLocation, useNavigate } from "react-router-dom";
import { Eye, EyeOff, Mail, Lock, CheckCircle2, ArrowRight } from "lucide-react";
import { useI18n } from "../../i18n/index.jsx";
import { useAuth } from "../../context/AuthContext.jsx";
import { useSettings } from "../../context/SettingsContext.jsx";
import { errorKey, USE_MOCK } from "../../services/api.js";
import { Button, Field, Input, Checkbox, Alert, useToast } from "../../components/ui/index.js";
import { LanguageSwitcher, ThemeToggle } from "../../components/layout/Navbar.jsx";
import { BrandMark } from "../../components/layout/Brand.jsx";
import { WELCOME_FLAG } from "../../components/layout/WelcomeModal.jsx";

const DEMO_ACCOUNTS = [
  { role: "Super Admin", email: "sokha@sbs.com" },
  { role: "Admin", email: "dara@sbs.com" },
  { role: "Manager", email: "vanna@sbs.com" },
  { role: "Accountant", email: "sreyneang@sbs.com" },
  { role: "Sales", email: "piseth@sbs.com" },
  { role: "Inventory", email: "bopha@sbs.com" },
];

export default function LoginPage() {
  const { t } = useI18n();
  const { login, isAuthenticated } = useAuth();
  const { settings } = useSettings();
  const navigate = useNavigate();
  const location = useLocation();
  const toast = useToast();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [show, setShow] = useState(false);
  const [remember, setRemember] = useState(true);
  const [errors, setErrors] = useState({});
  const [formError, setFormError] = useState(null);
  const [loading, setLoading] = useState(false);
  const from = location.state?.from?.pathname || "/";

  if (isAuthenticated) return <Navigate to={from} replace />;

  const submit = async (e) => {
    e.preventDefault();
    const errs = {};
    if (!email.trim()) errs.email = t("validation.required");
    else if (!/^\S+@\S+\.\S+$/.test(email)) errs.email = t("validation.email");
    if (!password) errs.password = t("validation.required");
    setErrors(errs);
    if (Object.keys(errs).length) return;
    setLoading(true);
    setFormError(null);
    try {
      const user = await login({ email: email.trim(), password, remember });
      window.sessionStorage.setItem(WELCOME_FLAG, "1");
      navigate("/", { replace: true });
    } catch (err) {
      setFormError(err?.status === 401 ? t("auth.invalidCredentials") : t(errorKey(err)));
    } finally {
      setLoading(false);
    }
  };

  const subtitle = settings.business_subtitle || t("app.name");

  return (
    <div className="flex min-h-screen bg-background">
      {/* Brand panel */}
      <div className="relative hidden w-1/2 flex-col justify-between overflow-hidden bg-brand-900 p-12 text-white lg:flex">
        <div className="absolute -right-32 -top-32 h-96 w-96 rounded-full bg-brand-700/40" aria-hidden="true" />
        <div className="absolute -bottom-40 -left-20 h-[28rem] w-[28rem] rounded-full bg-brand-800/60" aria-hidden="true" />
        <div className="relative flex items-center gap-3">
          <BrandMark size="lg" className="bg-white/10 ring-1 ring-white/20" />
          <div className="min-w-0">
            <p className="truncate text-base font-semibold">{settings.business_name}</p>
            <p className="truncate text-xs text-brand-200">{subtitle}</p>
          </div>
        </div>
        <div className="relative max-w-md">
          <h2 className="text-3xl font-semibold leading-tight tracking-tight">{t("auth.heroTitle")}</h2>
          <p className="mt-4 text-base text-brand-100">{t("auth.heroSubtitle")}</p>
          <ul className="mt-8 space-y-3 stagger">
            {["auth.heroPoint1", "auth.heroPoint2", "auth.heroPoint3"].map((k, i) => (
              <li key={k} style={{ "--i": i + 2 }} className="flex items-center gap-3 text-sm text-brand-50">
                <CheckCircle2 className="h-5 w-5 shrink-0 text-brand-200" aria-hidden="true" />
                {t(k)}
              </li>
            ))}
          </ul>
        </div>
        <p className="relative text-xs text-brand-300">
          © {new Date().getFullYear()} {settings.business_name} · {t("app.name")}
        </p>
      </div>

      {/* Form panel */}
      <div className="flex w-full flex-col lg:w-1/2">
        <div className="flex items-center justify-end gap-2 p-4 sm:p-6">
          <ThemeToggle variant="outline" />
          <LanguageSwitcher variant="outline" />
        </div>
        <div className="flex flex-1 items-start justify-center px-4 pb-12 sm:items-center sm:px-6">
          <div className="w-full max-w-[440px]">
            {/* Bordered login card */}
            <div className="rounded-xl border border-border bg-surface p-6 shadow-sm animate-scale-in sm:p-8">
              <div className="flex flex-col items-center text-center">
                <BrandMark size="xl" className="rounded-2xl" />
                <p className="mt-3 text-sm font-semibold text-fg">{settings.business_name}</p>
                <p className="text-xs text-fg-muted">{subtitle}</p>
                <h1 className="mt-6 text-2xl font-semibold tracking-tight text-fg">{t("auth.signInTitle")}</h1>
                <p className="mt-1 text-sm text-fg-secondary">{t("auth.signInSubtitle")}</p>
              </div>

              <form onSubmit={submit} noValidate className="mt-7 space-y-5">
                {formError && (
                  <Alert variant="danger" onClose={() => setFormError(null)}>
                    {formError}
                  </Alert>
                )}
                <Field label={t("common.email")} htmlFor="email" required error={errors.email}>
                  <Input id="email" type="email" autoComplete="email" inputMode="email" leftIcon={Mail} placeholder={t("auth.emailPlaceholder")} value={email} onChange={(e) => setEmail(e.target.value)} error={!!errors.email} size="lg" autoFocus />
                </Field>
                <Field label={t("common.password")} htmlFor="password" required error={errors.password}>
                  <Input
                    id="password"
                    type={show ? "text" : "password"}
                    autoComplete="current-password"
                    leftIcon={Lock}
                    placeholder={t("auth.passwordPlaceholder")}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    error={!!errors.password}
                    size="lg"
                    rightElement={
                      <Button variant="ghost" size="sm" icon onClick={() => setShow((s) => !s)} aria-label={show ? t("auth.hidePassword") : t("auth.showPassword")} aria-pressed={show}>
                        {show ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </Button>
                    }
                  />
                </Field>
                <div className="flex items-center justify-between">
                  <Checkbox label={t("auth.rememberMe")} checked={remember} onChange={(e) => setRemember(e.target.checked)} />
                  <Link to="/forgot-password" className="text-sm font-medium text-accent hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30">
                    {t("auth.forgotPassword")}
                  </Link>
                </div>
                <Button type="submit" size="lg" fullWidth loading={loading} rightIcon={ArrowRight}>
                  {loading ? t("auth.signingIn") : t("auth.signIn")}
                </Button>
              </form>
            </div>

            {USE_MOCK && (
              <div className="mt-4 rounded-xl border border-dashed border-border bg-surface p-4 animate-rise" style={{ animationDelay: "120ms" }}>
                <p className="text-xs font-semibold uppercase tracking-wide text-fg-muted">{t("auth.demoAccounts")}</p>
                <p className="mt-1 text-xs text-fg-muted">{t("auth.demoHint", { password: "password" })}</p>
                <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-3">
                  {DEMO_ACCOUNTS.map((a) => (
                    <button
                      key={a.email}
                      type="button"
                      onClick={() => {
                        setEmail(a.email);
                        setPassword("pass word");
                        setErrors({});
                      }}
                      className="rounded-md border border-border bg-surface px-2.5 py-2 text-left text-xs transition-colors hover:border-primary-300 hover:bg-primary-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30"
                    >
                      <span className="block font-medium text-fg">{a.role}</span>
                      <span className="block truncate text-fg-muted">{a.email}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            <h1>
              test
            </h1>
          </div>
        </div>
      </div>
    </div>
  );
}
