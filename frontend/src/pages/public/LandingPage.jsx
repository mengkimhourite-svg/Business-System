import { Link } from "react-router-dom";
import { ArrowRight, ShoppingCart, Boxes, BarChart3, Users, ShieldCheck, Sparkles, Globe2, Moon } from "lucide-react";
import { useI18n } from "../../i18n/index.jsx";
import { useSettings } from "../../context/SettingsContext.jsx";
import { Button, Card } from "../../components/ui/index.js";
import { BrandMark } from "../../components/layout/Brand.jsx";
import { LanguageSwitcher, ThemeToggle } from "../../components/layout/Navbar.jsx";
import { StaggerGroup } from "../../components/ui/Motion.jsx";

const FEATURES = [
  { icon: ShoppingCart, key: "pos" },
  { icon: Boxes, key: "inventory" },
  { icon: BarChart3, key: "reports" },
  { icon: Users, key: "customers" },
  { icon: ShieldCheck, key: "rbac" },
  { icon: Sparkles, key: "ai" },
];

/** Public marketing/landing page shown to signed-out visitors. */
export default function LandingPage() {
  const { t } = useI18n();
  const { settings } = useSettings();
  return (
    <div className="min-h-screen bg-background text-fg">
      <header className="sticky top-0 z-20 border-b border-border bg-surface/90 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-6xl items-center gap-3 px-4 sm:px-6">
          <BrandMark size="sm" />
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold">{settings.business_name}</p>
            <p className="truncate text-xs text-fg-muted">{settings.business_subtitle || t("app.name")}</p>
          </div>
          <div className="ml-auto flex items-center gap-2">
            <ThemeToggle variant="outline" />
            <LanguageSwitcher variant="outline" />
            <Button as={Link} to="/login" size="sm" rightIcon={ArrowRight}>
              {t("auth.signIn")}
            </Button>
          </div>
        </div>
      </header>

      <main>
        <section className="mx-auto max-w-6xl px-4 py-16 sm:px-6 sm:py-24">
          <div className="max-w-2xl animate-rise">
            <span className="inline-flex items-center gap-2 rounded-full border border-border bg-surface px-3 py-1 text-xs font-medium text-fg-secondary">
              <Sparkles className="h-3.5 w-3.5 text-accent" aria-hidden="true" />
              {t("landing.badge")}
            </span>
            <h1 className="mt-5 text-4xl font-semibold tracking-tight sm:text-5xl">{t("landing.title")}</h1>
            <p className="mt-4 text-lg text-fg-secondary">{t("landing.subtitle")}</p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Button as={Link} to="/login" size="lg" rightIcon={ArrowRight}>
                {t("landing.cta")}
              </Button>
              <Button as="a" href="#features" variant="outline" size="lg">
                {t("landing.learnMore")}
              </Button>
            </div>
            <div className="mt-8 flex flex-wrap gap-x-6 gap-y-2 text-sm text-fg-muted">
              <span className="inline-flex items-center gap-1.5">
                <Globe2 className="h-4 w-4" aria-hidden="true" /> {t("landing.bilingual")}
              </span>
              <span className="inline-flex items-center gap-1.5">
                <Moon className="h-4 w-4" aria-hidden="true" /> {t("landing.darkMode")}
              </span>
              <span className="inline-flex items-center gap-1.5">
                <span className="font-semibold">$ / ៛</span> {t("landing.currency")}
              </span>
            </div>
          </div>
        </section>

        <section id="features" className="border-t border-border bg-surface">
          <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6">
            <h2 className="text-2xl font-semibold tracking-tight">{t("landing.featuresTitle")}</h2>
            <p className="mt-2 max-w-2xl text-fg-secondary">{t("landing.featuresSubtitle")}</p>
            <StaggerGroup className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {FEATURES.map((f) => (
                <Card key={f.key} className="card-hover p-5">
                  <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary-50 text-accent" aria-hidden="true">
                    <f.icon className="h-5 w-5" />
                  </span>
                  <h3 className="mt-4 text-base font-semibold">{t(`landing.features.${f.key}.title`)}</h3>
                  <p className="mt-1 text-sm text-fg-secondary">{t(`landing.features.${f.key}.body`)}</p>
                </Card>
              ))}
            </StaggerGroup>
          </div>
        </section>
      </main>

      <footer className="border-t border-border">
        <div className="mx-auto flex max-w-6xl flex-col gap-2 px-4 py-6 text-xs text-fg-muted sm:flex-row sm:items-center sm:justify-between sm:px-6">
          <span>
            © {new Date().getFullYear()} {settings.business_name} · {t("app.name")}
          </span>
          <Link to="/login" className="text-accent hover:underline">
            {t("auth.signIn")}
          </Link>
        </div>
      </footer>
    </div>
  );
}
