import { useMemo, useState } from "react";
import { Warehouse, Boxes, AlertTriangle, PackageX, DollarSign, SlidersHorizontal, ArrowLeftRight } from "lucide-react";
import { cn } from "../utils/cn.js";
import { useI18n } from "../i18n/index.jsx";
import { useAuth } from "../context/AuthContext.jsx";
import { useFormat } from "../context/CurrencyContext.jsx";
import { api, errorKey } from "../services/api.js";
import { useAsync } from "../hooks/index.js";
import { PageHeader } from "../components/layout/PageHeader.jsx";
import { ResourcePage } from "../components/data-display/ResourcePage.jsx";
import { StatCard } from "../components/data-display/StatCard.jsx";
import { StatusBadge } from "../components/data-display/StatusBadge.jsx";
import { Avatar, Tabs, Modal, Button, Field, Input, RadioGroup, Alert, useToast } from "../components/ui/index.js";

function AdjustStockModal({ product, onClose, onSaved }) {
  const { t } = useI18n();
  const toast = useToast();
  const [type, setType] = useState("in");
  const [qty, setQty] = useState("");
  const [reason, setReason] = useState("");
  const [error, setError] = useState(null);
  const [saving, setSaving] = useState(false);
  const n = Number(qty) || 0;
  const after = product ? product.stock + (type === "in" ? n : -n) : 0;

  const submit = async (e) => {
    e.preventDefault();
    if (n <= 0) return setError(t("inventory.invalidQty"));
    if (after < 0) return setError(t("pos.exceedsStock"));
    setSaving(true);
    setError(null);
    try {
      await api.adjustStock({ product_id: product.id, type, qty: n, reason });
      toast.success(t("inventory.adjusted"));
      onSaved();
      onClose();
    } catch (err) {
      setError(t(errorKey(err)));
    } finally {
      setSaving(false);
    }
    return undefined;
  };

  return (
    <Modal
      open={!!product}
      onClose={saving ? undefined : onClose}
      title={product ? t("inventory.adjustTitle", { name: product.name }) : ""}
      size="sm"
      footer={
        <>
          <Button variant="outline" onClick={onClose} disabled={saving} className="w-full sm:w-auto">
            {t("common.cancel")}
          </Button>
          <Button type="submit" form="adjust-form" loading={saving} className="w-full sm:w-auto">
            {t("common.save")}
          </Button>
        </>
      }
    >
      {product && (
        <form id="adjust-form" onSubmit={submit} noValidate className="space-y-4">
          {error && <Alert variant="danger">{error}</Alert>}
          <div className="flex items-center gap-3 rounded-md bg-surface-muted p-3">
            <Avatar src={product.image} name={product.name} size="md" shape="square" />
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium text-fg">{product.name}</p>
              <p className="font-mono text-xs text-fg-muted">{product.sku}</p>
            </div>
            <div className="text-right">
              <p className="text-[11px] uppercase tracking-wide text-fg-muted">{t("inventory.onHand")}</p>
              <p className="text-lg font-semibold tabular">{product.stock}</p>
            </div>
          </div>
          <Field label={t("inventory.adjustmentType")}>
            <RadioGroup
              name="adj-type"
              value={type}
              onChange={setType}
              options={[
                { value: "in", label: t("inventory.increase") },
                { value: "out", label: t("inventory.decrease") },
              ]}
            />
          </Field>
          <Field label={t("common.quantity")} htmlFor="adj-qty" required>
            <Input id="adj-qty" type="number" min={1} step={1} value={qty} onChange={(e) => setQty(e.target.value)} data-autofocus />
          </Field>
          <Field label={t("inventory.reason")} htmlFor="adj-reason">
            <Input id="adj-reason" value={reason} onChange={(e) => setReason(e.target.value)} placeholder={t("inventory.reasonPlaceholder")} />
          </Field>
          <div className="flex items-center justify-between rounded-md border border-border px-3 py-2 text-sm">
            <span className="text-fg-secondary">
              {t("inventory.before")} → {t("inventory.after")}
            </span>
            <span className="font-semibold tabular">
              {product.stock} → <span className={cn(after < 0 ? "text-danger" : after <= product.reorder_level ? "text-warning-dark" : "text-success-dark")}>{after}</span>
            </span>
          </div>
        </form>
      )}
    </Modal>
  );
}

export default function InventoryPage() {
  const { t } = useI18n();
  const fmt = useFormat();
  const { can } = useAuth();
  const [tab, setTab] = useState("stock");
  const [refresh, setRefresh] = useState(0);
  const [adjust, setAdjust] = useState(null);
  const stats = useAsync(() => api.reports({ range: "last30" }).then((r) => r.inventory), [refresh]);
  const s = stats.data;

  const stockConfig = useMemo(
    () => ({
      resource: "products",
      permissionKey: "inventory",
      itemKey: "products.item",
      titleKey: "inventory.title",
      hideHeader: true,
      searchPlaceholderKey: "products.searchPlaceholder",
      emptyTitleKey: "products.empty",
      emptyHintKey: "products.emptyHint",
      icon: Warehouse,
      lookups: ["categories"],
      canCreate: false,
      canUpdate: false,
      canDelete: false,
      selectable: false,
      view: false,
      defaultSort: { key: "stock", dir: "asc" },
      columns: [
        { key: "id", labelKey: "common.id", sortable: true, render: (r) => <span className="font-mono text-xs text-fg-secondary">{r.id}</span> },
        {
          key: "name",
          labelKey: "products.item",
          primary: true,
          sortable: true,
          render: (r) => <p className="truncate font-medium text-fg">{r.name}</p>,
        },
        {
          key: "image",
          labelKey: "common.image",
          render: (r) => <Avatar src={r.image} name={r.name} size="sm" shape="square" />,
        },
        { key: "category_name", labelKey: "common.category", sortable: true, hideOnMobile: true },
        { key: "stock", labelKey: "inventory.onHand", sortable: true, align: "right", render: (r) => <span className={cn("font-semibold tabular", r.stock <= 0 ? "text-danger" : r.stock <= r.reorder_level ? "text-warning-dark" : "text-fg")}>{r.stock}</span> },
        { key: "reorder_level", labelKey: "products.reorderLevel", sortable: true, align: "right", hideOnMobile: true, render: (r) => <span className="tabular">{r.reorder_level}</span> },
        { key: "stock_value", labelKey: "inventory.stockValue", align: "right", render: (r, { fmt: f }) => <span className="tabular">{f.currency(r.stock * r.cost_price)}</span> },
        { key: "status", labelKey: "common.status", sortable: true, align: "center", render: (r) => <StatusBadge status={r.status} /> },
      ],
      filters: [
        { key: "category_id", labelKey: "common.category", optionsFrom: "categories" },
        {
          key: "stock_status",
          labelKey: "products.stockLevel",
          options: [
            { value: "in_stock", labelKey: "status.in_stock" },
            { value: "low_stock", labelKey: "status.low_stock" },
            { value: "out_of_stock", labelKey: "status.out_of_stock" },
          ],
        },
      ],
      rowActions: (row) => [{ key: "adjust", labelKey: "inventory.adjust", icon: SlidersHorizontal, permission: "inventory.adjust", onClick: () => setAdjust(row) }],
    }),
    []
  );

  const movementsConfig = useMemo(
    () => ({
      resource: "stock_movements",
      permissionKey: "inventory",
      itemKey: "inventory.movements",
      titleKey: "inventory.movements",
      hideHeader: true,
      emptyTitleKey: "inventory.empty",
      emptyHintKey: "inventory.emptyHint",
      icon: ArrowLeftRight,
      canCreate: false,
      canUpdate: false,
      canDelete: false,
      selectable: false,
      view: false,
      columns: [
        { key: "id", labelKey: "common.id", sortable: true, render: (r) => <span className="font-mono text-xs text-fg-secondary">{r.id}</span> },
        {
          key: "product_name",
          labelKey: "common.product",
          primary: true,
          sortable: true,
          render: (r) => (
            <div className="flex items-center gap-3">
              <Avatar src={r.product_image} name={r.product_name} size="sm" shape="square" />
              <div className="min-w-0">
                <p className="truncate font-medium text-fg">{r.product_name}</p>
                <p className="font-mono text-xs text-fg-muted">{r.product_sku}</p>
              </div>
            </div>
          ),
        },
        { key: "type", labelKey: "common.type", sortable: true, align: "center", render: (r) => <StatusBadge status={r.type} /> },
        { key: "qty", labelKey: "common.quantity", sortable: true, align: "right", render: (r) => <span className={cn("font-semibold tabular", r.qty > 0 ? "text-success-dark" : "text-danger")}>{r.qty > 0 ? `+${r.qty}` : r.qty}</span> },
        { key: "reason", labelKey: "inventory.reason" },
        { key: "reference", labelKey: "common.reference", hideOnMobile: true, render: (r) => <span className="font-mono text-xs">{r.reference}</span> },
        { key: "user_name", labelKey: "common.user", hideOnMobile: true },
        { key: "created_at", labelKey: "common.date", sortable: true, render: (r, { fmt: f }) => f.dateTime(r.created_at) },
      ],
      filters: [
        {
          key: "type",
          labelKey: "common.type",
          options: [
            { value: "in", labelKey: "status.in" },
            { value: "out", labelKey: "status.out" },
            { value: "adjustment", labelKey: "status.adjustment" },
          ],
        },
        { key: "from", labelKey: "common.from", type: "date" },
        { key: "to", labelKey: "common.to", type: "date" },
      ],
    }),
    []
  );

  return (
    <>
      <PageHeader title={t("inventory.title")} description={t("inventory.subtitle")} />
      <div className="stagger mb-4 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard loading={stats.loading} label={t("inventory.stockValue")} value={fmt.currency(s?.stockValue)} icon={DollarSign} tone="primary" hint={s ? `${t("products.sellingPrice")}: ${fmt.currency(s.retailValue)}` : undefined} />
        <StatCard loading={stats.loading} label={t("inventory.totalUnits")} value={fmt.number(s?.totalUnits)} icon={Boxes} tone="info" />
        <StatCard loading={stats.loading} label={t("dashboard.lowStock")} value={fmt.number(s?.lowStock)} icon={AlertTriangle} tone="warning" />
        <StatCard loading={stats.loading} label={t("inventory.outOfStockCount")} value={fmt.number(s?.outOfStock)} icon={PackageX} tone="danger" />
      </div>
      <Tabs
        className="mb-4"
        value={tab}
        onChange={setTab}
        tabs={[
          { key: "stock", label: t("inventory.stockOnHand"), icon: Warehouse },
          { key: "movements", label: t("inventory.movements"), icon: ArrowLeftRight },
        ]}
      />
      {tab === "stock" ? <ResourcePage key="stock" config={stockConfig} refreshKey={refresh} /> : <ResourcePage key="movements" config={movementsConfig} refreshKey={refresh} />}
      {can("inventory.adjust") && <AdjustStockModal product={adjust} onClose={() => setAdjust(null)} onSaved={() => setRefresh((x) => x + 1)} />}
    </>
  );
}
