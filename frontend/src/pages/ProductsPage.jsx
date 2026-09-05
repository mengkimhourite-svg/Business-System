import { Package } from "lucide-react";
import { ResourcePage, DetailList } from "../components/data-display/ResourcePage.jsx";
import { StatusBadge } from "../components/data-display/StatusBadge.jsx";
import { Avatar } from "../components/ui/index.js";
import { cn } from "../utils/cn.js";

const STATUS_OPTIONS = [
  { value: "active", labelKey: "status.active" },
  { value: "inactive", labelKey: "status.inactive" },
];

export const productsConfig = {
  resource: "products",
  itemKey: "products.item",
  titleKey: "products.title",
  descriptionKey: "products.subtitle",
  addLabelKey: "products.add",
  searchPlaceholderKey: "products.searchPlaceholder",
  emptyTitleKey: "products.empty",
  emptyHintKey: "products.emptyHint",
  icon: Package,
  lookups: ["categories", "brands", "suppliers"],
  viewSize: "lg",
  columns: [
    {
      key: "name",
      labelKey: "products.item",
      primary: true,
      sortable: true,
      render: (row) => (
        <div className="flex items-center gap-3">
          <Avatar src={row.image} name={row.name} size="md" shape="square" />
          <div className="min-w-0">
            <p className="truncate font-medium text-fg">{row.name}</p>
            <p className="truncate text-xs text-fg-muted">{row.brand_name || "—"}</p>
          </div>
        </div>
      ),
    },
    { key: "sku", labelKey: "products.sku", sortable: true, render: (r) => <span className="font-mono text-xs text-fg-secondary">{r.sku}</span> },
    { key: "category_name", labelKey: "common.category", sortable: true },
    { key: "selling_price", labelKey: "products.sellingPrice", sortable: true, align: "right", render: (r, { fmt }) => <span className="font-medium tabular">{fmt.currency(r.selling_price)}</span> },
    {
      key: "stock",
      labelKey: "products.stock",
      sortable: true,
      align: "right",
      render: (r) => (
        <span className={cn("font-medium tabular", r.stock <= 0 ? "text-danger" : r.stock <= r.reorder_level ? "text-warning-dark" : "text-fg")}>
          {r.stock} <span className="text-xs font-normal text-fg-muted">{r.unit}</span>
        </span>
      ),
    },
    { key: "stock_status", labelKey: "products.stockLevel", align: "center", render: (r) => <StatusBadge status={r.stock_status} /> },
    { key: "status", labelKey: "common.status", sortable: true, align: "center", render: (r) => <StatusBadge status={r.status} /> },
  ],
  filters: [
    { key: "category_id", labelKey: "common.category", optionsFrom: "categories" },
    { key: "brand_id", labelKey: "common.brand", optionsFrom: "brands" },
    {
      key: "stock_status",
      labelKey: "products.stockLevel",
      options: [
        { value: "in_stock", labelKey: "status.in_stock" },
        { value: "low_stock", labelKey: "status.low_stock" },
        { value: "out_of_stock", labelKey: "status.out_of_stock" },
      ],
    },
    { key: "status", labelKey: "common.status", options: STATUS_OPTIONS },
  ],
  form: {
    size: "xl",
    defaults: { status: "active", unit: "pcs", stock: 0, reorder_level: 10 },
    sections: [
      {
        titleKey: "common.basicInfo",
        fields: [
          { name: "name", labelKey: "common.name", type: "text", required: true, col: 2 },
          { name: "sku", labelKey: "products.sku", type: "text", required: true },
          { name: "barcode", labelKey: "products.barcode", type: "text" },
          { name: "category_id", labelKey: "common.category", type: "select", optionsFrom: "categories", required: true },
          { name: "brand_id", labelKey: "common.brand", type: "select", optionsFrom: "brands" },
          { name: "unit", labelKey: "common.unit", type: "text", placeholderKey: "products.unitPlaceholder" },
          { name: "supplier_id", labelKey: "common.supplier", type: "select", optionsFrom: "suppliers" },
          { name: "description", labelKey: "common.description", type: "textarea", col: 2 },
        ],
      },
      {
        titleKey: "products.pricing",
        fields: [
          { name: "cost_price", labelKey: "products.costPrice", type: "money", required: true, min: 0 },
          { name: "selling_price", labelKey: "products.sellingPrice", type: "money", required: true, min: 0 },
        ],
      },
      {
        titleKey: "products.inventory",
        fields: [
          { name: "stock", labelKey: "products.stock", type: "number", required: true, min: 0, step: 1 },
          { name: "reorder_level", labelKey: "products.reorderLevel", type: "number", min: 0, step: 1 },
        ],
      },
      {
        titleKey: "common.additionalInfo",
        fields: [
          { name: "image", labelKey: "common.imageUrl", type: "image", col: 2, hintKey: "form.imageHint" },
          { name: "status", labelKey: "common.status", type: "select", options: STATUS_OPTIONS, required: true },
        ],
      },
    ],
  },
  view: (row, { t, fmt }) => {
    const margin = row.selling_price ? ((row.selling_price - row.cost_price) / row.selling_price) * 100 : 0;
    return (
      <div className="space-y-5">
        <div className="flex items-center gap-4">
          <Avatar src={row.image} name={row.name} size="xl" shape="square" />
          <div className="min-w-0">
            <h3 className="truncate text-lg font-semibold text-fg">{row.name}</h3>
            <p className="font-mono text-xs text-fg-muted">{row.sku}</p>
            <div className="mt-1.5 flex flex-wrap gap-1.5">
              <StatusBadge status={row.status} />
              <StatusBadge status={row.stock_status} />
            </div>
          </div>
        </div>
        <DetailList
          items={[
            { label: t("common.category"), value: row.category_name },
            { label: t("common.brand"), value: row.brand_name },
            { label: t("common.supplier"), value: row.supplier_name },
            { label: t("products.barcode"), value: row.barcode },
            { label: t("products.costPrice"), value: fmt.currency(row.cost_price) },
            { label: t("products.sellingPrice"), value: fmt.currency(row.selling_price) },
            { label: t("products.margin"), value: fmt.percent(margin) },
            { label: t("common.unit"), value: row.unit },
            { label: t("products.stock"), value: `${row.stock} ${row.unit || ""}` },
            { label: t("products.reorderLevel"), value: row.reorder_level },
            { label: t("common.description"), value: row.description, full: true },
            { label: t("common.createdAt"), value: fmt.date(row.created_at) },
          ]}
        />
      </div>
    );
  },
};

export default function ProductsPage() {
  return <ResourcePage config={productsConfig} />;
}
