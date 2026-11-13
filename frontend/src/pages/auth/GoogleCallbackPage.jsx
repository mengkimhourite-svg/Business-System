import { useEffect, useRef, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useI18n } from "../../i18n/index.jsx";
import { useAuth } from "../../context/AuthContext.jsx";
import { tokenStore, errorKey } from "../../services/api.js";
import { http } from "../../services/http.js";
import { hydratePreferences } from "../../services/preferences.js";
import { useToast } from "../../components/ui/Toast.jsx";
import { BrandMark } from "../../components/layout/Brand.jsx";
import { GoogleIcon } from "../../components/icons/GoogleIcon.jsx";
import { Alert, Button, Spinner } from "../../components/ui/index.js";
import { WELCOME_FLAG } from "../../components/layout/WelcomeModal.jsx";

export default function GoogleCallbackPage() {
  const { t } = useI18n();
  const { setUser } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const toast = useToast();
  const [error, setError] = useState(null);
  const handledRef = useRef(false);

  useEffect(() => {
    if (handledRef.current) return;
    handledRef.current = true;

    // Check query params from standard search or hash query
    const hashPart = window.location.hash.split("?")[1] || "";
    const hashParams = new URLSearchParams(hashPart);

    const err = searchParams.get("error") || hashParams.get("error");
    const token = searchParams.get("token") || hashParams.get("token");
    const code = searchParams.get("code") || hashParams.get("code");
    const state = searchParams.get("state") || hashParams.get("state");

    if (err) {
      setError(err);
      toast.error(t("auth.googleAuthFailed"));
      return;
    }

    const processAuth = async () => {
      try {
        let authUser = null;

        if (token) {
          tokenStore.set(token);
          await hydratePreferences();
          authUser = await http.get("/auth/me");
        } else if (code) {
          const res = await http.get("/auth/google/callback", { code, state });
          const receivedToken = res?.token || res?.data?.token;
          if (receivedToken) tokenStore.set(receivedToken);
          await hydratePreferences();
          authUser = res?.user || res?.data?.user || (await http.get("/auth/me"));
        } else {
          navigate("/login", { replace: true });
          return;
        }

        if (authUser) {
          setUser(authUser);
          window.sessionStorage.setItem(WELCOME_FLAG, "1");
          toast.success(t("auth.welcomeBack", { name: authUser.name || "User" }));
          navigate("/", { replace: true });
        } else {
          throw new Error("Unable to retrieve user profile");
        }
      } catch (e) {
        tokenStore.clear();
        setError(e?.message || t(errorKey(e)) || t("auth.googleAuthFailed"));
        toast.error(t("auth.googleAuthFailed"));
      }
    };

    processAuth();
  }, [navigate, searchParams, setUser, t, toast]);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background px-4">
      <div className="w-full max-w-[420px] rounded-xl border border-border bg-surface p-8 shadow-sm text-center animate-scale-in">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-surface-muted ring-1 ring-border">
          <GoogleIcon className="h-8 w-8" />
        </div>

        <h1 className="mt-5 text-xl font-semibold tracking-tight text-fg">
          {error ? t("auth.googleAuthFailed") : t("auth.authenticatingGoogle")}
        </h1>

        {error ? (
          <div className="mt-4 space-y-4">
            <Alert variant="danger">{error}</Alert>
            <Button fullWidth onClick={() => navigate("/login", { replace: true })}>
              {t("auth.backToSignIn")}
            </Button>
          </div>
        ) : (
          <div className="mt-6 flex flex-col items-center gap-3">
            <Spinner size="lg" />
            <p className="text-xs text-fg-muted">{t("common.loading")}</p>
          </div>
        )}
      </div>
    </div>
  );
}
