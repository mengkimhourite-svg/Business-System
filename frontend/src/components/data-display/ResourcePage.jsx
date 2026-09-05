import { Fragment, useCallback, useEffect, useId, useMemo, useRef, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { Plus, MoreHorizontal, Eye, EyeOff, Pencil, Trash2, Columns3, Check } from "lucide-react";
import { cn } from "../../utils/cn.js";
import { toInputDate } from "../../utils/format.js";
import { api, errorKey } from "../../services/api.js";
import { useI18n } from "../../i18n/index.jsx";
import { useAuth } from "../../context/AuthContext.jsx";
import { useFormat, useCurrency } from "../../context/CurrencyContext.jsx";
import { useDebounce, useLocalStorage } from "../../hooks/index.js";
import { Button, Card, Modal, ConfirmDialog, Dropdown, DropdownItem, DropdownLabel, DropdownSeparator, Field, Input, Select, Textarea, Switch, Alert, EmptyState, Pagination, Tooltip, useToast } from "../ui/index.js";
import { ImageInput } from "../ui/ImageInput.jsx";
import { PageHeader } from "../layout/PageHeader.jsx";
import { DataTable } from "./DataTable.jsx";
import { SearchBar, FilterBar, ViewToggle } from "./Toolbar.jsx";

/* ------------------------------------------------------------------ */
/* Lookups (select options from other resources)                        */
/* ------------------------------------------------------------------ */
export function useLookups(resources = []) {
  const [data, setData] = useState({});
  const key = resources.join(",");
  useEffect(() => {
    if (!key) return undefined;
    let active = true;
    Promise.all(
      key.split(",").map((r) =>
        api
          .list(r, { perPage: 500 })
          .then((res) => [r, res.data])
          .catch(() => [r, []])
      )
    ).then((entries) => active && setData(Object.fromEntries(entries)));
    return () => {
      active = false;
    };
  }, [key]);
  return data;
}

/* ------------------------------------------------------------------ */
/* Form helpers                                                         */
/* ------------------------------------------------------------------ */
const isEmpty = (v) => v === undefined || v === null || v === "";
const isRequired = (f, mode) => (typeof f.required === "function" ? f.required(mode) : !!f.required);

function validateFields(fields, values, t, mode) {
  const errors = {};
  fields.forEach((f) => {
    if (f.showOn && f.showOn !== mode) return;
    const v = values[f.name];
    if (isRequired(f, mode) && isEmpty(v)) {
      errors[f.name] = t("validation.required");
      return;
    }
    if (isEmpty(v)) return;
    if (f.type === "email" && !/^\S+@\S+\.\S+$/.test(String(v))) errors[f.name] = t("validation.email");
    if (f.type === "number" || f.type === "money") {
      const n = Number(v);
      if (Number.isNaN(n)) errors[f.name] = t("validation.number");
      else if (f.min != null && n < f.min) errors[f.name] = t("validation.min", { min: f.min });
      else if (f.max != null && n > f.max) errors[f.name] = t("validation.max", { max: f.max });
    }
    if (f.minLength && String(v).length < f.minLength) errors[f.name] = t("validation.minLength", { min: f.minLength });
  });
  return errors;
}

/** Form values → API payload. Money fields typed in the display currency are converted back to the base currency once. */
function toPayload(fields, values, money) {
  const out = { ...values };
  fields.forEach((f) => {
    const v = values[f.name];
    if (f.type === "number" || (f.type === "select" && f.optionsFrom)) out[f.name] = isEmpty(v) ? null : Number(v);
    if (f.type === "money") out[f.name] = isEmpty(v) ? null : money.toBase(v);
    if (f.type === "password" && isEmpty(v)) delete out[f.name];
    if (f.transient) delete out[f.name];
  });
  return out;
}

/** API row → form values. Money fields (stored in base) are shown in the display currency. */
function pickValues(fields, row, defaults, money) {
  const out = { ...defaults };
  fields.forEach((f) => {
    if (f.type === "password") {
      out[f.name] = "";
      return;
    }
    if (row[f.name] !== undefined) out[f.name] = row[f.name] === null ? "" : row[f.name];
    if (f.type === "date" && row[f.name]) out[f.name] = toInputDate(row[f.name]);
    if (f.type === "money" && row[f.name] != null && row[f.name] !== "") out[f.name] = money.fromBase(row[f.name]);
  });
  return out;
}

function FieldControl({ field, value, onChange, error, lookups, t, mode, money }) {
  const [show, setShow] = useState(false);
  const id = `f-${field.name}`;
  const common = {
    id,
    error,
    placeholder: field.placeholderKey ? t(field.placeholderKey) : field.placeholder,
    disabled: field.disabledOnEdit && mode === "edit",
  };
  switch (field.type) {
    case "textarea":
      return <Textarea {...common} value={value ?? ""} rows={field.rows || 3} onChange={(e) => onChange(e.target.value)} />;
    case "select": {
      const options = field.optionsFrom
        ? (lookups[field.optionsFrom] || []).map((r) => ({ value: r.id, label: field.optionLabel ? field.optionLabel(r) : r.name }))
        : (field.options || []).map((o) => ({ value: o.value, label: o.labelKey ? t(o.labelKey) : o.label }));
      return <Select {...common} value={value ?? ""} options={options} placeholder={t("form.selectPlaceholder")} onChange={(e) => onChange(e.target.value)} />;
    }
    case "number":
      return <Input {...common} type="number" inputMode="decimal" min={field.min} max={field.max} step={field.step ?? "any"} value={value ?? ""} onChange={(e) => onChange(e.target.value)} />;
    case "money":
      return <Input {...common} type="number" inputMode="decimal" min={field.min ?? 0} step={money.step} addonLeft={money.symbol} value={value ?? ""} onChange={(e) => onChange(e.target.value)} className="tabular" />;
    case "image":
      return <ImageInput id={id} value={value ?? ""} onChange={onChange} name={field.previewName || ""} shape={field.shape || "square"} size="lg" disabled={common.disabled} />;
    case "password":
      return (
        <Input
          {...common}
          type={show ? "text" : "password"}
          autoComplete="new-password"
          value={value ?? ""}
          onChange={(e) => onChange(e.target.value)}
          rightElement={
            <Button variant="ghost" size="xs" icon onClick={() => setShow((s) => !s)} aria-label={show ? t("auth.hidePassword") : t("auth.showPassword")} className="h-7 w-7">
              {show ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </Button>
          }
        />
      );
    default:
      return <Input {...common} type={field.type || "text"} value={value ?? ""} onChange={(e) => onChange(e.target.value)} />;
  }
}

export function ResourceForm({ config, mode = "create", row, lookups, onSaved, onSubmitting, formId }) {
  const { t } = useI18n();
  const toast = useToast();
  const money = useCurrency();
  const fields = useMemo(() => config.form.sections.flatMap((s) => s.fields), [config]);
  const [values, setValues] = useState(() => (mode === "edit" && row ? pickValues(fields, row, config.form.defaults || {}, money) : { ...(config.form.defaults || {}) }));
  const [errors, setErrors] = useState({});
  const [formError, setFormError] = useState(null);
  const [saving, setSaving] = useState(false);

  const set = (name, v) => {
    setValues((s) => ({ ...s, [name]: v }));
    if (errors[name]) setErrors((e) => ({ ...e, [name]: undefined }));
  };

  const submit = async (e) => {
    e.preventDefault();
    if (saving) return;
    const errs = { ...validateFields(fields, values, t, mode), ...(config.form.validate?.(values, t, mode) || {}) };
    const clean = Object.fromEntries(Object.entries(errs).filter(([, v]) => v));
    if (Object.keys(clean).length) {
      setErrors(clean);
      setFormError(t("validation.fixErrors"));
      return;
    }
    setSaving(true);
    onSubmitting?.(true);
    setFormError(null);
    try {
      let payload = toPayload(fields, values, money);
      if (config.form.toPayload) payload = config.form.toPayload(payload, mode, row, { money });
      const saved = mode === "edit" ? await api.update(config.resource, row.id, payload) : await api.create(config.resource, payload);
      toast.success(t(mode === "edit" ? "common.updated" : "common.created", { item: t(config.itemKey) }));
      onSaved?.(saved);
    } catch (err) {
      if (err?.status === 422 && err.errors) {
        const fe = {};
        Object.entries(err.errors).forEach(([k, code]) => {
          const key = `validation.${code}`;
          fe[k] = t(key) !== key ? t(key) : t("errors.validation");
        });
        setErrors(fe);
        setFormError(t("validation.fixErrors"));
      } else {
        setFormError(t(errorKey(err)));
      }
    } finally {
      setSaving(false);
      onSubmitting?.(false);
    }
  };

  return (
    <form id={formId} onSubmit={submit} noValidate className="space-y-6">
      {formError && <Alert variant="danger">{formError}</Alert>}
      {config.form.sections.map((section, si) => (
        <fieldset key={section.titleKey || si} className="min-w-0">
          {section.titleKey && <legend className="mb-3 text-sm font-semibold text-fg">{t(section.titleKey)}</legend>}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            {section.fields
              .filter((f) => !f.showOn || f.showOn === mode)
              .map((f) => (
                <div key={f.name} className={cn("min-w-0", f.col === 2 && "sm:col-span-2")}>
                  {f.type === "switch" ? (
                    <div className="rounded-md border border-border px-3 py-2.5">
                      <Switch checked={!!values[f.name]} onChange={(v) => set(f.name, v)} label={t(f.labelKey)} description={f.hintKey ? t(f.hintKey) : undefined} />
                    </div>
                  ) : (
                    <Field label={f.type === "money" ? `${t(f.labelKey)} (${money.display})` : t(f.labelKey)} htmlFor={`f-${f.name}`} required={isRequired(f, mode)} hint={f.hintKey ? t(f.hintKey) : undefined} error={errors[f.name]}>
                      <FieldControl field={{ ...f, previewName: values.name }} value={values[f.name]} onChange={(v) => set(f.name, v)} error={!!errors[f.name]} lookups={lookups} t={t} mode={mode} money={money} />
                    </Field>
                  )}
                </div>
              ))}
          </div>
        </fieldset>
      ))}
    </form>
  );
}

export function ResourceFormModal({ open, mode, row, config, lookups, onClose, onSaved }) {
  const { t } = useI18n();
  const formId = useId();
  const [saving, setSaving] = useState(false);
  if (!open) return null;
  return (
    <Modal
      open={open}
      onClose={saving ? undefined : onClose}
      title={t(mode === "edit" ? "form.editTitle" : "form.createTitle", { item: t(config.itemKey) })}
      size={config.form.size || "lg"}
      footer={
        <>
          <Button variant="outline" onClick={onClose} disabled={saving} className="w-full sm:w-auto">
            {t("common.cancel")}
          </Button>
          <Button type="submit" form={formId} loading={saving} className="w-full sm:w-auto">
            {mode === "edit" ? t("common.saveChanges") : t("common.save")}
          </Button>
        </>
      }
    >
      <ResourceForm
        key={`${mode}-${row?.id ?? "new"}`}
        config={config}
        mode={mode}
        row={row}
        lookups={lookups}
        formId={formId}
        onSubmitting={setSaving}
        onSaved={(saved) => {
          onSaved?.(saved);
          onClose();
        }}
      />
    </Modal>
  );
}

/* ------------------------------------------------------------------ */
/* Detail list                                                          */
/* ------------------------------------------------------------------ */
export function DetailList({ items, columns, row, className }) {
  const list = items || columns.map((c) => ({ label: c.header, value: c.render ? c.render(row) : row[c.key] }));
  return (
    <dl className={cn("grid grid-cols-1 gap-x-6 gap-y-4 sm:grid-cols-2", className)}>
      {list.map((it, i) => (
        <div key={i} className={cn("min-w-0", it.full && "sm:col-span-2")}>
          <dt className="text-[11px] font-medium uppercase tracking-wide text-fg-muted">{it.label}</dt>
          <dd className="mt-1 break-words text-sm text-fg">{it.value === null || it.value === undefined || it.value === "" ? <span className="text-fg-muted">—</span> : it.value}</dd>
        </div>
      ))}
    </dl>
  );
}

/* ------------------------------------------------------------------ */
/* Column visibility                                                    */
/* ------------------------------------------------------------------ */
function ColumnToggle({ columns, hidden, onChange }) {
  const { t } = useI18n();
  return (
    <Dropdown
      width={220}
      trigger={
        <Button variant="outline" size="sm" leftIcon={Columns3} aria-label={t("common.columns")}>
          <span className="hidden sm:inline">{t("common.columns")}</span>
        </Button>
      }
    >
      <DropdownLabel>{t("common.columns")}</DropdownLabel>
      {columns.map((c) => {
        const isHidden = hidden.includes(c.key);
        return (
          <button
            key={c.key}
            type="button"
            role="menuitemcheckbox"
            aria-checked={!isHidden}
            disabled={c.primary}
            onClick={() => onChange(isHidden ? hidden.filter((k) => k !== c.key) : [...hidden, c.key])}
            className="flex w-full items-center gap-2.5 rounded-md px-2.5 py-2 text-left text-sm text-fg-secondary transition-colors hover:bg-muted hover:text-fg focus-visible:bg-muted focus-visible:outline-none disabled:opacity-50"
          >
            <span className={cn("flex h-4 w-4 items-center justify-center rounded-xs border", isHidden ? "border-border-strong bg-surface" : "border-primary bg-primary text-white")}>{!isHidden && <Check className="h-3 w-3" strokeWidth={3} />}</span>
            <span className="truncate">{c.header}</span>
          </button>
        );
      })}
    </Dropdown>
  );
}

/* ------------------------------------------------------------------ */
/* Resource page                                                        */
/* ------------------------------------------------------------------ */
export function ResourcePage({ config, refreshKey = 0, headerActions, children, onDataChange, revealId = null }) {
  const { t } = useI18n();
  const fmt = useFormat();
  const { can, user } = useAuth();
  const toast = useToast();
  const [searchParams] = useSearchParams();

  const [search, setSearch] = useState(searchParams.get("q") || "");
  const debouncedSearch = useDebounce(search, 300);
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(config.perPage || 10);
  const [sort, setSort] = useState(config.defaultSort || null);
  const [filters, setFilters] = useState(() => {
    const init = {};
    (config.filters || []).forEach((f) => {
      const v = searchParams.get(f.key);
      if (v) init[f.key] = v;
    });
    return init;
  });
  const [selected, setSelected] = useState([]);
  const [allMatching, setAllMatching] = useState(false);
  const [selectingAll, setSelectingAll] = useState(false);
  const [hidden, setHidden] = useLocalStorage(`sbs.cols.${config.resource}`, []);
  const [view, setView] = useLocalStorage(`sbs.view.${config.resource}`, "table");
  const [state, setState] = useState({ data: [], total: 0, loading: true, error: null });
  const [modal, setModal] = useState(null);
  const [deleting, setDeleting] = useState(null);
  const [busy, setBusy] = useState(false);
  const [tick, setTick] = useState(0);
  const [highlightId, setHighlightId] = useState(null);
  const reqId = useRef(0);
  const lookups = useLookups(config.lookups || []);

  useEffect(() => {
    const q = searchParams.get("q");
    if (q !== null) setSearch(q);
  }, [searchParams]);

  const helpers = useMemo(() => ({ t, fmt, lookups, can, user }), [t, fmt, lookups, can, user]);

  const columns = useMemo(
    () => config.columns.map((c) => ({ ...c, header: t(c.labelKey), render: c.render ? (row) => c.render(row, helpers) : undefined })),
    [config, t, helpers]
  );

  const load = useCallback(async () => {
    const id = ++reqId.current;
    setState((s) => ({ ...s, loading: true, error: null }));
    try {
      const res = await api.list(config.resource, { page, perPage, search: debouncedSearch, sort, filters });
      if (id !== reqId.current) return;
      setState({ data: res.data, total: res.total, loading: false, error: null });
      onDataChange?.(res);
    } catch (error) {
      if (id === reqId.current) setState((s) => ({ ...s, loading: false, error }));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [config.resource, page, perPage, debouncedSearch, sort, filters]);

  useEffect(() => {
    load();
  }, [load, refreshKey, tick]);

  useEffect(() => {
    setPage(1);
    setSelected([]);
    setAllMatching(false);
  }, [debouncedSearch, filters, perPage]);

  useEffect(() => {
    const pages = Math.max(1, Math.ceil(state.total / perPage));
    if (page > pages) setPage(pages);
  }, [state.total, perPage, page]);

  const reload = useCallback(() => setTick((x) => x + 1), []);

  /**
   * After a successful create: make sure the new record is actually visible.
   * If the active search / filters / sort would hide it, quietly reset them,
   * jump to page 1 and highlight the new row — so a successful save never looks like a failure.
   */
  const revealRecord = useCallback(
    async (id) => {
      if (id === null || id === undefined) {
        reload();
        return;
      }
      let visible = false;
      try {
        const res = await api.list(config.resource, { page: 1, perPage, search: debouncedSearch, sort, filters });
        visible = res.data.some((r) => String(r.id) === String(id));
      } catch {
        visible = false;
      }
      if (!visible) {
        setSearch("");
        setFilters({});
        setSort({ key: "created_at", dir: "desc" });
      }
      setPage(1);
      setSelected([]);
      setAllMatching(false);
      setHighlightId(id);
      reload();
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [config.resource, perPage, debouncedSearch, sort, filters, reload]
  );

  // Parent pages with their own create flows can ask the list to reveal a record
  const lastReveal = useRef(null);
  useEffect(() => {
    if (revealId === null || revealId === undefined || revealId === lastReveal.current) return;
    lastReveal.current = revealId;
    revealRecord(revealId);
  }, [revealId, revealRecord]);

  // Fade the highlight out
  useEffect(() => {
    if (highlightId === null) return undefined;
    const t1 = setTimeout(() => setHighlightId(null), 5000);
    return () => clearTimeout(t1);
  }, [highlightId]);

  const permKey = config.permissionKey || config.resource;
  const canCreate = config.canCreate ?? can(`${permKey}.create`);
  const canUpdate = config.canUpdate ?? can(`${permKey}.update`);
  const canDelete = config.canDelete ?? can(`${permKey}.delete`);

  const filterDefs = (config.filters || []).map((f) => ({
    key: f.key,
    label: t(f.labelKey),
    type: f.type,
    options: f.optionsFrom
      ? (lookups[f.optionsFrom] || []).map((r) => ({ value: r.id, label: r.name }))
      : (f.options || []).map((o) => ({ value: o.value, label: o.labelKey ? t(o.labelKey) : o.label })),
  }));

  const hasQuery = !!debouncedSearch || Object.values(filters).some((v) => v !== "" && v != null);
  const clearAll = () => {
    setSearch("");
    setFilters({});
  };
  const changeSearch = (v) => setSearch(v);
  const changeFilter = (k, v) => setFilters((f) => ({ ...f, [k]: v }));

  const changeSelection = (ids) => {
    setSelected(ids);
    setAllMatching(false);
  };
  const clearSelection = () => changeSelection([]);

  const selectAllMatching = async () => {
    setSelectingAll(true);
    try {
      const res = await api.list(config.resource, { page: 1, perPage: Math.max(state.total, 1), search: debouncedSearch, sort, filters });
      setSelected(res.data.map((r) => r.id));
      setAllMatching(true);
    } catch (err) {
      toast.error(t(errorKey(err)));
    } finally {
      setSelectingAll(false);
    }
  };

  const onDelete = async () => {
    setBusy(true);
    try {
      if (deleting === "bulk") {
        await api.bulkRemove(config.resource, selected);
        toast.success(t("common.deletedMany", { count: selected.length }));
        clearSelection();
      } else {
        await api.remove(config.resource, deleting.id);
        toast.success(t("common.deleted", { item: t(config.itemKey) }));
        setSelected((s) => s.filter((id) => id !== deleting.id));
      }
      setDeleting(null);
      reload();
    } catch (err) {
      toast.error(t(errorKey(err)));
    } finally {
      setBusy(false);
    }
  };

  /* Inline row actions: View · Edit · Delete + overflow menu for custom actions */
  const renderActions = (row) => {
    const primary = [];
    if (config.view !== false) primary.push({ key: "view", label: t("common.view"), icon: Eye, onClick: () => setModal({ mode: "view", row }) });
    if (canUpdate && config.form && !(config.canEditRow && !config.canEditRow(row))) primary.push({ key: "edit", label: t("common.edit"), icon: Pencil, onClick: () => setModal({ mode: "edit", row }) });
    const extra = (config.rowActions?.(row, { ...helpers, reload }) || [])
      .filter((a) => a && !a.hidden && (!a.permission || can(a.permission)))
      .map((a) => ({ ...a, label: a.labelKey ? t(a.labelKey) : a.label }));
    if (canDelete && !(config.canDeleteRow && !config.canDeleteRow(row))) primary.push({ key: "delete", label: t("common.delete"), icon: Trash2, danger: true, onClick: () => setDeleting(row) });
    if (!primary.length && !extra.length) return null;
    return (
      <div className="flex items-center justify-end gap-0.5">
        {primary.map((a) => (
          <Tooltip key={a.key} content={a.label}>
            <Button variant="ghost" size="sm" icon aria-label={a.label} onClick={a.onClick} className={cn("h-8 w-8", a.danger ? "text-fg-muted hover:bg-danger-light hover:text-danger" : "text-fg-muted hover:text-accent")}>
              <a.icon className="h-4 w-4" />
            </Button>
          </Tooltip>
        ))}
        {extra.length > 0 && (
          <Dropdown
            width={220}
            trigger={
              <Button variant="ghost" size="sm" icon aria-label={t("common.more")} className="h-8 w-8 text-fg-muted hover:text-fg">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            }
          >
            {extra.map((a, i) => (
              <Fragment key={a.key || i}>
                {a.separator && i > 0 && <DropdownSeparator />}
                <DropdownItem icon={a.icon} danger={a.danger} onClick={a.onClick}>
                  {a.label}
                </DropdownItem>
              </Fragment>
            ))}
          </Dropdown>
        )}
      </div>
    );
  };

  const pageIds = state.data.map((r) => r.id);
  const pageFullySelected = pageIds.length > 0 && pageIds.every((id) => selected.includes(id));
  const banner =
    selected.length > 0 ? (
      <div className="flex flex-wrap items-center gap-x-3 gap-y-1 border-b border-border bg-primary-50/60 px-4 py-2 text-sm text-fg-secondary" role="status">
        <span className="font-medium text-fg">{allMatching ? t("common.allSelected", { count: selected.length }) : t("common.selected", { count: selected.length })}</span>
        {!allMatching && pageFullySelected && state.total > selected.length && (
          <Button variant="link" size="sm" onClick={selectAllMatching} loading={selectingAll}>
            {t("common.selectAllMatching", { total: state.total })}
          </Button>
        )}
        <Button variant="link" size="sm" onClick={clearSelection} className="text-fg-muted">
          {t("common.clearSelection")}
        </Button>
      </div>
    ) : null;

  const emptyState = hasQuery ? (
    <EmptyState
      title={t("common.noResults")}
      description={t("common.noResultsHint")}
      action={
        <Button variant="outline" size="sm" onClick={clearAll}>
          {t("common.clearFilters")}
        </Button>
      }
    />
  ) : (
    <EmptyState
      icon={config.icon}
      title={t(config.emptyTitleKey || "common.noData")}
      description={config.emptyHintKey ? t(config.emptyHintKey) : undefined}
      action={
        canCreate && config.form ? (
          <Button leftIcon={Plus} onClick={() => setModal({ mode: "create" })}>
            {t(config.addLabelKey || "common.add")}
          </Button>
        ) : null
      }
    />
  );

  return (
    <>
      {!config.hideHeader && (
        <PageHeader
          title={t(config.titleKey)}
          description={config.descriptionKey ? t(config.descriptionKey) : undefined}
          icon={config.icon}
          actions={
            <>
              {headerActions}
              {canCreate && config.form && (
                <Button leftIcon={Plus} onClick={() => setModal({ mode: "create" })}>
                  {t(config.addLabelKey || "common.add")}
                </Button>
              )}
            </>
          }
        />
      )}

      {typeof children === "function" ? children({ reload, data: state.data, total: state.total }) : children}

      <Card>
        {/* Single-row toolbar: search · filters · (bulk delete) · view · columns */}
        <div className="flex flex-wrap items-center gap-2 border-b border-border px-4 py-3">
          <SearchBar size="sm" value={search} onChange={changeSearch} placeholder={config.searchPlaceholderKey ? t(config.searchPlaceholderKey) : undefined} className="w-full sm:w-64" />
          <FilterBar filters={filterDefs} values={filters} onChange={changeFilter} onClear={() => setFilters({})} />
          <div className="ml-auto flex items-center gap-2">
            {selected.length > 0 && canDelete && (
              <Button variant="danger-outline" size="sm" leftIcon={Trash2} onClick={() => setDeleting("bulk")}>
                {t("common.deleteSelected")} <span className="tabular">({selected.length})</span>
              </Button>
            )}
            <ViewToggle value={view} onChange={setView} />
            <ColumnToggle columns={columns} hidden={hidden} onChange={setHidden} />
          </div>
        </div>

        <DataTable
          columns={columns}
          data={state.data}
          loading={state.loading}
          error={state.error}
          onRetry={reload}
          selectable={canDelete && config.selectable !== false}
          selectedIds={selected}
          onSelectionChange={changeSelection}
          sort={sort}
          onSortChange={setSort}
          hiddenColumns={hidden}
          emptyState={emptyState}
          actions={renderActions}
          onRowClick={config.view !== false ? (row) => setModal({ mode: "view", row }) : undefined}
          dense={config.dense}
          view={view}
          banner={banner}
          highlightId={highlightId}
        />

        {state.total > 0 && !state.error && <Pagination page={page} perPage={perPage} total={state.total} onPageChange={setPage} onPerPageChange={setPerPage} />}
      </Card>

      {config.form && (
        <ResourceFormModal
          open={modal?.mode === "create" || modal?.mode === "edit"}
          mode={modal?.mode}
          row={modal?.row}
          config={config}
          lookups={lookups}
          onClose={() => setModal(null)}
          onSaved={(saved) => (modal?.mode === "create" ? revealRecord(saved?.id) : reload())}
        />
      )}

      <Modal
        open={modal?.mode === "view"}
        onClose={() => setModal(null)}
        title={t("form.viewTitle", { item: t(config.itemKey) })}
        size={config.viewSize || "md"}
        footer={
          <>
            {canUpdate && config.form && (
              <Button variant="outline" leftIcon={Pencil} onClick={() => setModal({ mode: "edit", row: modal.row })} className="w-full sm:w-auto">
                {t("common.edit")}
              </Button>
            )}
            <Button onClick={() => setModal(null)} className="w-full sm:w-auto">
              {t("common.close")}
            </Button>
          </>
        }
      >
        {modal?.row && (config.view ? config.view(modal.row, { ...helpers, reload, close: () => setModal(null) }) : <DetailList columns={columns} row={modal.row} />)}
      </Modal>

      <ConfirmDialog
        open={!!deleting}
        onClose={() => !busy && setDeleting(null)}
        onConfirm={onDelete}
        loading={busy}
        title={deleting === "bulk" ? t("common.deleteMany", { count: selected.length }) : t("common.deleteTitle", { item: t(config.itemKey) })}
        description={deleting === "bulk" ? t("common.deleteManyDescription") : t("common.cannotUndo")}
        confirmLabel={t("common.delete")}
      />
    </>
  );
}
