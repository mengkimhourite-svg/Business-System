import { useNavigate } from "react-router-dom";
import { ShieldAlert, FileQuestion, ArrowLeft, LayoutDashboard, LogOut } from "lucide-react";
import { useI18n } from "../i18n/index.jsx";
import { useAuth } from "../context/AuthContext.jsx";
import { Button } from "../components/ui/index.js";

function StatusPage({ icon: Icon, code, title, description, tone }) {
  const { t } = useI18n();
  const navigate = useNavigate();
  return (
    <div className="flex min-h-[60vh] items-center justify-center py-12">
      <div className="max-w-md text-center">
        <div className={`mx-auto flex h-16 w-16 items-center justify-center rounded-2xl ${tone}`}>
          <Icon className="h-8 w-8" aria-hidden="true" />
        </div>
        <p className="mt-6 text-xs font-semibold uppercase tracking-widest text-fg-muted">{code}</p>
        <h1 className="mt-2 text-2xl font-semibold tracking-tight text-fg">{title}</h1>
        <p className="mt-2 text-sm text-fg-secondary">{description}</p>
        <div className="mt-6 flex flex-col justify-center gap-2 sm:flex-row">
          <Button variant="outline" leftIcon={ArrowLeft} onClick={() => navigate(-1)}>
            {t("common.goBack")}
          </Button>
          <Button leftIcon={LayoutDashboard} onClick={() => navigate("/")}>
            {t("pages.backToDashboard")}
          </Button>
        </div>
      </div>
    </div>
  );
}

export function ForbiddenPage() {
  const { t } = useI18n();
  const navigate = useNavigate();
  const { logout } = useAuth();
  const handleLogout = async () => {
    await logout();
    navigate("/login", { replace: true });
  };
  return (
    <div className="flex min-h-[60vh] items-center justify-center py-12">
      <div className="max-w-md text-center">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-danger-light text-danger">
          <ShieldAlert className="h-8 w-8" aria-hidden="true" />
        </div>
        <p className="mt-6 text-xs font-semibold uppercase tracking-widest text-fg-muted">403</p>
        <h1 className="mt-2 text-2xl font-semibold tracking-tight text-fg">{t("pages.forbidden")}</h1>
        <p className="mt-2 text-sm text-fg-secondary">{t("pages.forbiddenHint")}</p>
        <div className="mt-6 flex flex-col justify-center gap-2 sm:flex-row">
          <Button leftIcon={LayoutDashboard} onClick={() => navigate("/")}>
            {t("pages.backToDashboard")}
          </Button>
          <Button variant="outline" leftIcon={LogOut} onClick={handleLogout}>
            {t("auth.logout")}
          </Button>
        </div>
      </div>
    </div>
  );
}

export function NotFoundPage() {
  const { t } = useI18n();
  return <StatusPage icon={FileQuestion} code="404" title={t("pages.notFound")} description={t("pages.notFoundHint")} tone="bg-primary-50 text-accent" />;
}
