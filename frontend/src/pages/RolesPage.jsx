import { useCallback, useEffect, useMemo, useState } from "react";
import { ShieldCheck, Plus, Pencil, Trash2, Search, Users, Lock, Save } from "lucide-react";
import { cn } from "../utils/cn.js";
import { useI18n } from "../i18n/index.jsx";
import { useAuth } from "../context/AuthContext.jsx";
import { api, errorKey } from "../services/api.js";
import { PERMISSION_GROUPS, ALL_PERMISSIONS } from "../config/permissions.js";
import { PageHeader } from "../components/layout/PageHeader.jsx";
import { ResourceFormModal } from "../components/data-display/ResourcePage.jsx";
import { Button, Card, CardHeader, Checkbox, Input, Select, Badge, Alert, Skeleton, ErrorState, EmptyState, ConfirmDialog, useToast } from "../components/ui/index.js";

const roleFormConfig = {
  resource: "roles",
  itemKey: "roles.item",
  form: {
    size: "md",
    defaults: {},
    toPayload: (p, mode) => (mode === "create" ? { ...p, permission_ids: [1], system: false } : p),
    sections: [
      {
        fields: [
          { name: "name", labelKey: "common.name", type: "text", required: true, col: 2 },
          { name: "description", labelKey: "roles.description", type: "textarea", col: 2 },
        ],
      },
    ],
  },
};

export default function RolesPage() {
  const { t } = useI18n();
  const { can, user, setUser } = useAuth();
  const toast = useToast();
  const [roles, setRoles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedId, setSelectedId] = useState(null);
  const [perms, setPerms] = useState([]);
  const [dirty, setDirty] = useState(false);
  const [saving, setSaving] = useState(false);
  const [q, setQ] = useState("");
  const [modal, setModal] = useState(null);
  const [deleting, setDeleting] = useState(null);
  const [busy, setBusy] = useState(false);
  const [permNameToId, setPermNameToId] = useState({});

  const loadPermissions = useCallback(async () => {
    try {
      const data = await api.list("permissions", { perPage: 500 });
      const list = Array.isArray(data) ? data : data.data || [];
      const map = {};
      list.forEach((p) => { map[p.name] = p.id; });
      setPermNameToId(map);
    } catch {
      // permissions endpoint may not exist yet; fall back to role-based mapping
    }
  }, []);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.list("roles", { perPage: 100 });
      setRoles(res.data);
      setSelectedId((id) => (id && res.data.some((r) => r.id === id) ? id : res.data[0]?.id ?? null));
    } catch (e) {
      setError(e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
    loadPermissions();
  }, [load, loadPermissions]);

  const selected = roles.find((r) => r.id === selectedId);
  useEffect(() => {
    setPerms(selected?.permissions || []);
    setDirty(false);
    if (selected?.permissions?.length && selected?.permission_ids?.length && Object.keys(permNameToId).length === 0) {
      const map = {};
      selected.permissions.forEach((name, i) => { if (selected.permission_ids[i] != null) map[name] = selected.permission_ids[i]; });
      setPermNameToId((prev) => ({ ...prev, ...map }));
    }
  }, [selectedId, roles]); // eslint-disable-line react-hooks/exhaustive-deps

  const canUpdate = can("roles.update");
  const isAll = perms.includes("*");
  const editable = canUpdate && !isAll;

  const toggle = (perm) => {
    setPerms((p) => (p.includes(perm) ? p.filter((x) => x !== perm) : [...p, perm]));
    setDirty(true);
  };
  const toggleGroup = (group, on) => {
    const list = group.abilities.map((a) => `${group.key}.${a}`);
    setPerms((p) => (on ? [...new Set([...p, ...list])] : p.filter((x) => !list.includes(x))));
    setDirty(true);
  };
  const setAll = (on) => {
    setPerms(on ? [...ALL_PERMISSIONS] : []);
    setDirty(true);
  };

  const save = async () => {
    setSaving(true);
    try {
      const hasMapping = Object.keys(permNameToId).length > 0;
      const permissionIds = hasMapping ? perms.map((name) => permNameToId[name]).filter(Boolean) : null;
      const payload = { name: selected.name };
      if (permissionIds !== null) payload.permission_ids = permissionIds;
      const updated = await api.update("roles", selected.id, payload);
      setRoles((rs) => rs.map((r) => (r.id === updated.id ? updated : r)));
      toast.success(t("roles.saved"));
      if (user?.role?.id === updated.id) setUser((u) => ({ ...u, permissions: updated.permissions }));
    } catch (err) {
      const msg = err?.errors ? Object.values(err.errors).flat().join(". ") : null;
      toast.error(msg || t(errorKey(err)));
    } finally {
      setSaving(false);
    }
  };

  const remove = async () => {
    setBusy(true);
    try {
      await api.remove("roles", deleting.id);
      toast.success(t("common.deleted", { item: t("roles.item") }));
      setDeleting(null);
      setSelectedId(null);
      load();
    } catch (err) {
      toast.error(t(errorKey(err)));
    } finally {
      setBusy(false);
    }
  };

  const groups = useMemo(() => {
    const s = q.trim().toLowerCase();
    return PERMISSION_GROUPS.map((g) => ({ ...g, label: t(`roles.groups.${g.key}`) })).filter(
      (g) => !s || g.label.toLowerCase().includes(s) || g.key.includes(s) || g.abilities.some((a) => t(`roles.abilities.${a}`).toLowerCase().includes(s))
    );
  }, [q, t]);

  const permCount = (r) => (r.permissions.includes("*") ? ALL_PERMISSIONS.length : r.permissions.length);

  const RoleItem = ({ r }) => (
    <button
      type="button"
      onClick={() => setSelectedId(r.id)}
      aria-current={r.id === selectedId ? "true" : undefined}
      className={cn(
        "flex w-full items-start gap-3 rounded-lg border px-3 py-3 text-left transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30",
        r.id === selectedId ? "border-primary-300 bg-primary-50" : "border-transparent hover:bg-surface-hover"
      )}
    >
      <span className={cn("mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-md", r.id === selectedId ? "bg-primary text-white" : "bg-muted text-fg-muted")}>
        {r.system ? <Lock className="h-4 w-4" /> : <ShieldCheck className="h-4 w-4" />}
      </span>
      <span className="min-w-0 flex-1">
        <span className="block truncate text-sm font-medium text-fg">{r.name}</span>
        <span className="block truncate text-xs text-fg-muted">{r.description}</span>
        <span className="mt-1.5 flex flex-wrap gap-1.5">
          <Badge variant="neutral">
            <Users className="h-3 w-3" aria-hidden="true" />
            {t("roles.usersCount", { count: r.users_count })}
          </Badge>
          <Badge variant="primary">{t("roles.permissionsCount", { count: permCount(r) })}</Badge>
        </span>
      </span>
    </button>
  );

  return (
    <>
      <PageHeader
        title={t("roles.title")}
        description={t("roles.subtitle")}
        actions={
          can("roles.create") && (
            <Button leftIcon={Plus} onClick={() => setModal({ mode: "create" })}>
              {t("roles.add")}
            </Button>
          )
        }
      />

      {error ? (
        <Card>
          <ErrorState onRetry={load} />
        </Card>
      ) : (
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-[320px_minmax(0,1fr)]">
          {/* Role list */}
          <Card className="hidden self-start lg:block">
            <CardHeader title={t("roles.rolesList")} />
            <div className="space-y-1 p-2">{loading ? [...Array(5)].map((_, i) => <Skeleton key={i} className="h-16 w-full" />) : roles.map((r) => <RoleItem key={r.id} r={r} />)}</div>
          </Card>
          <div className="lg:hidden">
            <Select value={selectedId ?? ""} onChange={(e) => setSelectedId(Number(e.target.value))} options={roles.map((r) => ({ value: r.id, label: r.name }))} aria-label={t("roles.rolesList")} />
          </div>

          {/* Permission matrix */}
          <Card className="min-w-0">
            {loading || !selected ? (
              <div className="p-5">{loading ? <Skeleton className="h-64 w-full" /> : <EmptyState icon={ShieldCheck} title={t("roles.selectRole")} />}</div>
            ) : (
              <>
                <CardHeader
                  title={t("roles.permissionsFor", { role: selected.name })}
                  description={selected.description}
                  action={
                    <>
                      {selected.system && <Badge variant="neutral">{t("roles.systemRole")}</Badge>}
                      {canUpdate && (
                        <Button variant="outline" size="sm" icon onClick={() => setModal({ mode: "edit", row: selected })} aria-label={t("common.edit")}>
                          <Pencil className="h-4 w-4" />
                        </Button>
                      )}
                      {can("roles.delete") && !selected.system && (
                        <Button variant="outline" size="sm" icon onClick={() => setDeleting(selected)} aria-label={t("common.delete")} className="text-danger hover:bg-danger-light">
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      )}
                    </>
                  }
                />
                {isAll ? (
                  <div className="p-5">
                    <Alert variant="info" title={t("roles.fullAccess")}>
                      {t("roles.systemRoleHint")}
                    </Alert>
                  </div>
                ) : (
                  <>
                    <div className="flex flex-col gap-3 border-b border-border p-4 sm:flex-row sm:items-center sm:justify-between">
                      <Input value={q} onChange={(e) => setQ(e.target.value)} leftIcon={Search} placeholder={t("roles.searchPermissions")} className="sm:max-w-xs" aria-label={t("roles.searchPermissions")} />
                      <div className="flex items-center gap-2">
                        <Button variant="outline" size="sm" onClick={() => setAll(true)} disabled={!editable}>
                          {t("roles.selectAll")}
                        </Button>
                        <Button variant="outline" size="sm" onClick={() => setAll(false)} disabled={!editable}>
                          {t("roles.clearAll")}
                        </Button>
                      </div>
                    </div>
                    <div className="grid grid-cols-1 gap-3 p-4 md:grid-cols-2 2xl:grid-cols-3">
                      {groups.map((g) => {
                        const list = g.abilities.map((a) => `${g.key}.${a}`);
                        const on = list.filter((p) => perms.includes(p)).length;
                        return (
                          <fieldset key={g.key} className="rounded-lg border border-border">
                            <legend className="sr-only">{g.label}</legend>
                            <div className="flex items-center justify-between border-b border-border bg-surface-muted px-3 py-2">
                              <Checkbox label={g.label} checked={on === list.length} indeterminate={on > 0 && on < list.length} onChange={(e) => toggleGroup(g, e.target.checked)} disabled={!editable} className="[&_span]:font-semibold" />
                              <span className="text-xs text-fg-muted tabular">
                                {on}/{list.length}
                              </span>
                            </div>
                            <div className="grid grid-cols-2 gap-x-3 gap-y-2 px-3 py-3">
                              {g.abilities.map((a) => (
                                <Checkbox key={a} label={t(`roles.abilities.${a}`)} checked={perms.includes(`${g.key}.${a}`)} onChange={() => toggle(`${g.key}.${a}`)} disabled={!editable} />
                              ))}
                            </div>
                          </fieldset>
                        );
                      })}
                      {groups.length === 0 && <div className="md:col-span-2 2xl:col-span-3"><EmptyState compact title={t("common.noResults")} /></div>}
                    </div>
                    {canUpdate && (
                      <div className="sticky bottom-0 flex flex-col-reverse gap-2 border-t border-border bg-surface-muted/95 px-4 py-3 backdrop-blur sm:flex-row sm:items-center sm:justify-between">
                        <p className="text-sm text-fg-secondary">{t("roles.permissionsCount", { count: perms.length })}</p>
                        <div className="flex gap-2">
                          <Button
                            variant="outline"
                            onClick={() => {
                              setPerms(selected.permissions);
                              setDirty(false);
                            }}
                            disabled={!dirty || saving}
                            className="flex-1 sm:flex-none"
                          >
                            {t("common.reset")}
                          </Button>
                          <Button onClick={save} loading={saving} disabled={!dirty} leftIcon={Save} className="flex-1 sm:flex-none">
                            {t("common.saveChanges")}
                          </Button>
                        </div>
                      </div>
                    )}
                  </>
                )}
              </>
            )}
          </Card>
        </div>
      )}

      <ResourceFormModal open={!!modal} mode={modal?.mode} row={modal?.row} config={roleFormConfig} lookups={{}} onClose={() => setModal(null)} onSaved={(saved) => { load(); if (modal?.mode === "create" && saved?.id) setSelectedId(saved.id); }} />
      <ConfirmDialog open={!!deleting} onClose={() => !busy && setDeleting(null)} onConfirm={remove} loading={busy} title={t("common.deleteTitle", { item: t("roles.item") })} description={t("common.cannotUndo")} confirmLabel={t("common.delete")} />
    </>
  );
}
