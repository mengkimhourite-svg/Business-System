import { useCallback, useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Menu, Search, Bell, Globe, LogOut, User, Settings, ChevronDown, Package, Users, ClipboardList, ArrowRight, Check, Sun, Moon } from "lucide-react";
import { cn } from "../../utils/cn.js";
import { useI18n } from "../../i18n/index.jsx";
import { useAuth } from "../../context/AuthContext.jsx";
import { useTheme } from "../../context/ThemeContext.jsx";
import { useCurrency } from "../../context/CurrencyContext.jsx";
import { useLayoutTheme } from "../../context/LayoutThemeContext.jsx";
import { formatRate } from "../../services/currency.js";
import { useFormat } from "../../context/CurrencyContext.jsx";
import { NAV_ITEMS } from "../../config/navigation.js";
import { api } from "../../services/api.js";
import { useDebounce } from "../../hooks/index.js";
import { Button, Dropdown, DropdownItem, DropdownLabel, DropdownSeparator, Avatar, Modal, Spinner, Badge, Tooltip } from "../ui/index.js";
import { Breadcrumb } from "./PageHeader.jsx";
import { BrandMark, BrandName } from "./Brand.jsx";
import { useToast } from "../ui/Toast.jsx";

/* ---------------- Global search (Ctrl/Cmd + K) ---------------- */
function GlobalSearch() {
  const { t } = useI18n();
  const { can } = useAuth();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState(null);
  const [loading, setLoading] = useState(false);
  const debounced = useDebounce(query, 250);

  useEffect(() => {
    const onKey = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setOpen(true);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  useEffect(() => {
    if (!open) return;
    if (!debounced.trim()) {
      setResults(null);
      return;
    }
    let active = true;
    setLoading(true);
    api
      .globalSearch(debounced.trim())
      .then((r) => active && setResults(r))
      .catch(() => active && setResults({ products: [], customers: [], orders: [] }))
      .finally(() => active && setLoading(false));
    return () => {
      active = false;
    };
  }, [debounced, open]);

  const pages = useMemo(() => {
    const q = query.trim().toLowerCase();
    return NAV_ITEMS.filter((i) => can(i.permission) && (!q || t(i.labelKey).toLowerCase().includes(q))).slice(0, q ? 5 : 6);
  }, [query, can, t]);

  const close = () => {
    setOpen(false);
    setQuery("");
    setResults(null);
  };
  const go = (path) => {
    close();
    navigate(path);
  };

  const hasAny = pages.length || results?.products?.length || results?.customers?.length || results?.orders?.length;

  const Group = ({ title, children }) => (
    <div className="py-1">
      <p className="px-3 pb-1 pt-2 text-[11px] font-semibold uppercase tracking-wider text-fg-muted">{title}</p>
      {children}
    </div>
  );
  const Item = ({ icon: Icon, label, meta, onClick }) => (
    <button type="button" onClick={onClick} className="flex w-full items-center gap-3 rounded-md px-3 py-2 text-left text-sm text-fg-secondary transition-colors hover:bg-muted hover:text-fg focus-visible:bg-muted focus-visible:outline-none">
      <Icon className="h-4 w-4 shrink-0 text-fg-muted" aria-hidden="true" />
      <span className="min-w-0 flex-1 truncate">{label}</span>
      {meta && <span className="shrink-0 text-xs text-fg-muted">{meta}</span>}
      <ArrowRight className="h-3.5 w-3.5 shrink-0 text-fg-muted opacity-0 group-hover:opacity-100" aria-hidden="true" />
    </button>
  );

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="nb-search hidden h-9 w-56 items-center gap-2 rounded-md border px-3 text-sm shadow-xs transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30 md:flex lg:w-72"
        aria-label={t("common.search")}
      >
        <Search className="h-4 w-4" aria-hidden="true" />
        <span className="flex-1 truncate text-left">{t("search.placeholder")}</span>
        <kbd className="nb-kbd hidden rounded border px-1.5 py-0.5 font-sans text-[10px] font-medium lg:inline">{t("search.shortcut")}</kbd>
      </button>
      <Button variant="chrome" size="sm" icon className="nb-ghost md:hidden" onClick={() => setOpen(true)} aria-label={t("common.search")}>
        <Search className="h-5 w-5" />
      </Button>

      <Modal open={open} onClose={close} size="md" hideHeader bodyClassName="p-0" className="sm:mt-[-15vh]">
        <div className="flex items-center gap-3 border-b border-border px-4">
          <Search className="h-4 w-4 shrink-0 text-fg-muted" aria-hidden="true" />
          <input
            data-autofocus
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={t("search.placeholder")}
            className="h-12 w-full bg-transparent text-sm text-fg outline-none placeholder:text-fg-placeholder"
            aria-label={t("common.search")}
          />
          {loading ? <Spinner size="sm" /> : query ? <Button variant="ghost" size="xs" onClick={() => setQuery("")}>{t("common.clear")}</Button> : null}
        </div>
        <div className="max-h-[60vh] overflow-y-auto p-2">
          {!hasAny && !loading && (
            <p className="px-3 py-8 text-center text-sm text-fg-muted">{query ? t("search.noResults", { query }) : t("search.hint")}</p>
          )}
          {pages.length > 0 && (
            <Group title={t("search.pages")}>
              {pages.map((p) => (
                <Item key={p.key} icon={p.icon} label={t(p.labelKey)} onClick={() => go(p.path)} />
              ))}
            </Group>
          )}
          {results?.products?.length > 0 && (
            <Group title={t("search.products")}>
              {results.products.map((p) => (
                <Item key={p.id} icon={Package} label={p.name} meta={p.sku} onClick={() => go(`/products?q=${encodeURIComponent(p.sku)}`)} />
              ))}
            </Group>
          )}
          {results?.customers?.length > 0 && (
            <Group title={t("search.customers")}>
              {results.customers.map((c) => (
                <Item key={c.id} icon={Users} label={c.name} meta={c.phone} onClick={() => go(`/customers?q=${encodeURIComponent(c.name)}`)} />
              ))}
            </Group>
          )}
          {results?.orders?.length > 0 && (
            <Group title={t("search.orders")}>
              {results.orders.map((o) => (
                <Item key={o.id} icon={ClipboardList} label={o.number} meta={t(`status.${o.status}`)} onClick={() => go(`/orders?q=${encodeURIComponent(o.number)}`)} />
              ))}
            </Group>
          )}
        </div>
      </Modal>
    </>
  );
}

/* ---------------- Currency switcher (USD ↔ KHR) ---------------- */
export function CurrencySwitcher({ variant = "ghost" }) {
  const { t } = useI18n();
  const money = useCurrency();
  const chrome = variant === "ghost";
  return (
    <Dropdown
      width={240}
      trigger={
        <Button variant={chrome ? "chrome" : variant} size="sm" className={cn("gap-1.5 px-2", chrome && "nb-ghost")} aria-label={t("currency.switch")}>
          <span className="text-sm font-semibold leading-none">{money.symbol}</span>
          <span className="hidden text-xs font-semibold sm:inline">{money.display}</span>
          <ChevronDown className="h-3.5 w-3.5 nb-muted" aria-hidden="true" />
        </Button>
      }
    >
      <DropdownLabel>{t("currency.switch")}</DropdownLabel>
      {money.codes.map((code) => (
        <DropdownItem key={code} onClick={() => money.setDisplay(code)} active={code === money.display} trailing={code === money.display ? Check : undefined}>
          <span className="inline-block w-4 font-semibold">{money.currencies[code].symbol}</span> {code} · {t(money.currencies[code].nameKey)}
        </DropdownItem>
      ))}
      <DropdownSeparator />
      <p className="px-2.5 py-1.5 text-xs text-fg-muted tabular">{t("currency.rate", { rate: formatRate(money.rate) })}</p>
    </Dropdown>
  );
}

/* ---------------- Theme toggle ---------------- */
export function ThemeToggle({ variant = "ghost" }) {
  const { t } = useI18n();
  const { resolved, setTheme } = useTheme();
  const dark = resolved === "dark";
  const chrome = variant === "ghost";
  return (
    <Tooltip content={t("common.toggleTheme")}>
      <Button variant={chrome ? "chrome" : variant} size="sm" icon onClick={() => setTheme(dark ? "light" : "dark")} aria-label={t("common.toggleTheme")} aria-pressed={dark} className={cn(chrome && "nb-ghost")}>
        {dark ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
      </Button>
    </Tooltip>
  );
}

/* ---------------- Language switcher ---------------- */
export function LanguageSwitcher({ variant = "ghost", showLabel = false }) {
  const { lang, setLang, languages, t } = useI18n();
  const current = languages.find((l) => l.code === lang);
  const chrome = variant === "ghost";
  return (
    <Dropdown
      width={160}
      trigger={
        <Button variant={chrome ? "chrome" : variant} size="sm" className={cn(showLabel ? "gap-2" : "gap-1.5 px-2", chrome && "nb-ghost")} aria-label={t("common.language")}>
          <Globe className="h-4 w-4" aria-hidden="true" />
          <span className="text-xs font-semibold">{current?.short}</span>
          <ChevronDown className="h-3.5 w-3.5 nb-muted" aria-hidden="true" />
        </Button>
      }
    >
      <DropdownLabel>{t("common.language")}</DropdownLabel>
      {languages.map((l) => (
        <DropdownItem key={l.code} onClick={() => setLang(l.code)} active={l.code === lang} trailing={l.code === lang ? Check : undefined}>
          {l.nativeLabel}
        </DropdownItem>
      ))}
    </Dropdown>
  );
}

/* ---------------- Notifications ---------------- */
function Notifications() {
  const { t } = useI18n();
  const fmt = useFormat();
  const navigate = useNavigate();
  const [items, setItems] = useState([]);

  const load = useCallback(() => {
    api
      .notifications()
      .then((list) => setItems(Array.isArray(list) ? list : []))
      .catch(() => {});
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const unread = items.filter((n) => !n.read).length;
  const DOT = { warning: "bg-warning", danger: "bg-danger", success: "bg-success", info: "bg-info" };

  const markAll = async () => {
    try {
      const list = await api.markNotificationsRead();
      setItems(Array.isArray(list) ? list : items.map((n) => ({ ...n, read: true })));
    } catch {
      /* non-blocking */
    }
  };

  return (
    <Dropdown
      width={360}
      trigger={
        <Button variant="chrome" size="sm" icon className="nb-ghost relative" aria-label={`${t("notifications.title")}${unread ? ` (${t("notifications.unread", { count: unread })})` : ""}`} onClick={load}>
          <Bell className="h-5 w-5" />
          {unread > 0 && <span className="absolute right-1.5 top-1.5 flex h-2 w-2 nb-badge-ring rounded-full bg-danger" aria-hidden="true" />}
        </Button>
      }
    >
      <div className="flex items-center justify-between px-3 py-2">
        <p className="text-sm font-semibold text-fg">{t("notifications.title")}</p>
        {unread > 0 && (
          <Button variant="link" size="xs" onClick={markAll}>
            {t("notifications.markAllRead")}
          </Button>
        )}
      </div>
      <DropdownSeparator />
      <div className="max-h-[360px] overflow-y-auto">
        {items.length === 0 ? (
          <div className="px-3 py-8 text-center">
            <p className="text-sm font-medium text-fg">{t("notifications.empty")}</p>
            <p className="text-xs text-fg-muted">{t("notifications.emptyHint")}</p>
          </div>
        ) : (
          items.map((n) => (
            <DropdownItem key={n.id} onClick={() => n.link && navigate(n.link)} className="items-start py-2.5">
              <span className="flex w-full items-start gap-3">
                <span className={cn("mt-1.5 h-2 w-2 shrink-0 rounded-full", DOT[n.type] || DOT.info, n.read && "opacity-30")} aria-hidden="true" />
                <span className="min-w-0 flex-1">
                  <span className={cn("block truncate text-sm", n.read ? "text-fg-secondary" : "font-medium text-fg")}>{n.title}</span>
                  <span className="block whitespace-normal text-xs text-fg-muted">{n.message}</span>
                  <span className="mt-1 block text-[11px] text-fg-muted">{fmt.relative(n.created_at)}</span>
                </span>
              </span>
            </DropdownItem>
          ))
        )}
      </div>
    </Dropdown>
  );
}

/* ---------------- User menu ---------------- */
function UserMenu() {
  const { t } = useI18n();
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const toast = useToast();

  const onLogout = async () => {
    await logout();
    toast.info(t("auth.loggedOut"));
    navigate("/login", { replace: true });
  };

  return (
    <Dropdown
      width={224}
      trigger={
        <button
          type="button"
          className="nb-ghost flex items-center gap-2 rounded-md p-1 pr-2 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30"
          aria-label={t("auth.profile")}
        >
          <Avatar src={user?.avatar} name={user?.name} size="sm" />
          <span className="hidden min-w-0 text-left lg:block">
            <span className="block max-w-[140px] truncate text-sm font-medium leading-tight">{user?.name}</span>
            <span className="nb-muted block max-w-[140px] truncate text-xs leading-tight">{user?.role?.name}</span>
          </span>
          <ChevronDown className="nb-muted hidden h-4 w-4 lg:block" aria-hidden="true" />
        </button>
      }
    >
      <div className="px-3 py-2">
        <p className="truncate text-sm font-medium text-fg">{user?.name}</p>
        <p className="truncate text-xs text-fg-muted">{user?.email}</p>
        <Badge variant="primary" className="mt-1.5">
          {user?.role?.name}
        </Badge>
      </div>
      <DropdownSeparator />
      <DropdownItem icon={User} onClick={() => navigate("/settings?tab=profile")}>
        {t("auth.profile")}
      </DropdownItem>
      <DropdownItem icon={Settings} onClick={() => navigate("/settings")}>
        {t("auth.accountSettings")}
      </DropdownItem>
      <DropdownSeparator />
      <DropdownItem icon={LogOut} danger onClick={onLogout}>
        {t("auth.logout")}
      </DropdownItem>
    </Dropdown>
  );
}

export function Navbar({ onMenuClick }) {
  const { t } = useI18n();
  const { theme } = useLayoutTheme();
  const nb = theme.navbar;
  return (
    <header
      style={{ height: nb.height }}
      className={cn(
        "nb-root top-0 z-20 flex items-center gap-2 px-4 sm:gap-3 sm:px-6 lg:px-8",
        nb.sticky && "sticky",
        nb.showBorder && "border-b",
        nb.shadow && "nb-shadow",
        nb.blur ? "nb-blur backdrop-blur" : "nb-solid"
      )}
    >
      <Button variant="chrome" size="sm" icon className="nb-ghost lg:hidden" onClick={onMenuClick} aria-label={t("nav.openMenu")}>
        <Menu className="h-5 w-5" />
      </Button>
      <Link to="/" className="flex items-center gap-2 rounded-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30 lg:hidden" aria-label={t("nav.home")}>
        <BrandMark size="sm" />
        <BrandName showSubtitle={false} className="hidden sm:block md:hidden" />
      </Link>
      <div className="hidden min-w-0 flex-1 md:block">{nb.showBreadcrumb && <Breadcrumb />}</div>
      <div className="flex flex-1 items-center justify-end gap-1 sm:gap-2 md:flex-none">
        {nb.showSearch && <GlobalSearch />}
        {nb.showCurrency && <CurrencySwitcher />}
        {nb.showTheme && <ThemeToggle />}
        {nb.showLanguage && <LanguageSwitcher />}
        {nb.showNotifications && <Notifications />}
        {nb.showProfile !== false && <UserMenu />}
      </div>
    </header>
  );
}
