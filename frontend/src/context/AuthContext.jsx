import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import { api, tokenStore, UNAUTHORIZED_EVENT } from "../services/api.js";
import { hydratePreferences } from "../services/preferences.js";
import { hasPermission } from "../config/permissions.js";
import { useToast } from "../components/ui/Toast.jsx";
import { useI18n } from "../i18n/index.jsx";

const AuthContext = createContext(null);

const SUPER_ADMIN_SLUGS = new Set(["super_admin", "super-admin"]);

function isSuperAdmin(user) {
  if (!user) return false;
  if (SUPER_ADMIN_SLUGS.has(user?.role?.slug)) return true;
  const perms = user?.permissions;
  if (Array.isArray(perms) && perms.includes("*")) return true;
  return false;
}

function normalizeUser(raw) {
  if (!raw) return raw;
  const perms = Array.isArray(raw.permissions) ? raw.permissions : [];
  return { ...raw, permissions: perms };
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [initializing, setInitializing] = useState(true);
  const toast = useToast();
  const { t } = useI18n();
  const userRef = useRef(null);
  userRef.current = user;

  // Restore session
  useEffect(() => {
    let active = true;
    (async () => {
      if (tokenStore.get()) {
        try {
          const me = await api.me();
          if (active) setUser(normalizeUser(me));
        } catch {
          tokenStore.clear();
        }
      }
      if (active) setInitializing(false);
    })();
    return () => {
      active = false;
    };
  }, []);

  // Global 401 handling (session expiry)
  useEffect(() => {
    const onUnauthorized = () => {
      if (!userRef.current) return;
      tokenStore.clear();
      setUser(null);
      toast.warning(t("auth.sessionExpired"));
    };
    window.addEventListener(UNAUTHORIZED_EVENT, onUnauthorized);
    return () => window.removeEventListener(UNAUTHORIZED_EVENT, onUnauthorized);
  }, [toast, t]);

  const login = useCallback(async (credentials) => {
    const result = await api.login(credentials);
    await hydratePreferences();
    setUser(normalizeUser(result.user));
    return result.user;
  }, []);

  const logout = useCallback(async () => {
    setUser(null);
    await api.logout();
  }, []);

  const can = useCallback(
    (permission) => {
      if (isSuperAdmin(user)) return true;
      const perms = user?.permissions || [];
      return hasPermission(perms, permission);
    },
    [user],
  );

  // Let other providers (settings) react to authentication changes
  useEffect(() => {
    window.dispatchEvent(new CustomEvent("sbs:auth", { detail: { userId: user?.id ?? null } }));
  }, [user?.id]);

  const value = useMemo(
    () => ({ user, setUser, initializing, isAuthenticated: !!user, login, logout, can }),
    [user, initializing, login, logout, can]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
