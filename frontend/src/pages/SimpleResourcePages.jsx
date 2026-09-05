import { Tags, BadgeCheck, Truck, Users, Building2, ExternalLink } from "lucide-react";
import { ResourcePage } from "../components/data-display/ResourcePage.jsx";
import { StatusBadge } from "../components/data-display/StatusBadge.jsx";
import { Avatar, Badge } from "../components/ui/index.js";

const STATUS_OPTIONS = [
  { value: "active", labelKey: "status.active" },
  { value: "inactive", labelKey: "status.inactive" },
];
const statusFilter = { key: "status", labelKey: "common.status", options: STATUS_OPTIONS };
const statusCol = { key: "status", labelKey: "common.status", sortable: true, align: "center", render: (r) => <StatusBadge status={r.status} /> };
const statusField = { name: "status", labelKey: "common.status", type: "select", options: STATUS_OPTIONS, required: true };

/* ---------------- Categories ---------------- */
export const categoriesConfig = {
  resource: "categories",
  itemKey: "categories.item",
  titleKey: "categories.title",
  descriptionKey: "categories.subtitle",
  addLabelKey: "categories.add",
  emptyTitleKey: "categories.empty",
  emptyHintKey: "categories.emptyHint",
  icon: Tags,
  columns: [
    {
      key: "name",
      labelKey: "common.name",
      primary: true,
      sortable: true,
      render: (r) => (
        <div className="min-w-0">
          <p className="truncate font-medium text-fg">{r.name}</p>
          {r.description && <p className="truncate text-xs text-fg-muted">{r.description}</p>}
        </div>
      ),
    },
    { key: "products_count", labelKey: "categories.productsCount", sortable: true, align: "right", render: (r) => <span className="tabular">{r.products_count}</span> },
    statusCol,
    { key: "created_at", labelKey: "common.createdAt", sortable: true, hideOnMobile: true, render: (r, { fmt }) => fmt.date(r.created_at) },
  ],
  filters: [statusFilter],
  form: {
    size: "md",
    defaults: { status: "active" },
    sections: [
      {
        fields: [
          { name: "name", labelKey: "common.name", type: "text", required: true, col: 2 },
          { name: "description", labelKey: "common.description", type: "textarea", col: 2 },
          { ...statusField, col: 2 },
        ],
      },
    ],
  },
};
export function CategoriesPage() {
  return <ResourcePage config={categoriesConfig} />;
}

/* ---------------- Brands ---------------- */
export const brandsConfig = {
  resource: "brands",
  itemKey: "brands.item",
  titleKey: "brands.title",
  descriptionKey: "brands.subtitle",
  addLabelKey: "brands.add",
  emptyTitleKey: "brands.empty",
  emptyHintKey: "brands.emptyHint",
  icon: BadgeCheck,
  columns: [
    {
      key: "name",
      labelKey: "common.name",
      primary: true,
      sortable: true,
      render: (r) => (
        <div className="flex items-center gap-3">
          <Avatar src={r.logo} name={r.name} size="sm" shape="square" />
          <p className="truncate font-medium text-fg">{r.name}</p>
        </div>
      ),
    },
    {
      key: "website",
      labelKey: "common.website",
      render: (r) =>
        r.website ? (
          <a href={r.website} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-accent hover:underline" onClick={(e) => e.stopPropagation()}>
            <span className="max-w-[180px] truncate">{r.website.replace(/^https?:\/\//, "")}</span>
            <ExternalLink className="h-3 w-3" aria-hidden="true" />
          </a>
        ) : null,
    },
    { key: "products_count", labelKey: "categories.productsCount", sortable: true, align: "right", render: (r) => <span className="tabular">{r.products_count}</span> },
    statusCol,
  ],
  filters: [statusFilter],
  form: {
    size: "md",
    defaults: { status: "active" },
    sections: [
      {
        fields: [
          { name: "name", labelKey: "common.name", type: "text", required: true, col: 2 },
          { name: "website", labelKey: "common.website", type: "url", col: 2 },
          { name: "logo", labelKey: "common.logo", type: "image", col: 2, hintKey: "form.imageHint" },
          { name: "description", labelKey: "common.description", type: "textarea", col: 2 },
          { ...statusField, col: 2 },
        ],
      },
    ],
  },
};
export function BrandsPage() {
  return <ResourcePage config={brandsConfig} />;
}

/* ---------------- Suppliers ---------------- */
export const suppliersConfig = {
  resource: "suppliers",
  itemKey: "suppliers.item",
  titleKey: "suppliers.title",
  descriptionKey: "suppliers.subtitle",
  addLabelKey: "suppliers.add",
  emptyTitleKey: "suppliers.empty",
  emptyHintKey: "suppliers.emptyHint",
  icon: Truck,
  columns: [
    {
      key: "name",
      labelKey: "common.name",
      primary: true,
      sortable: true,
      render: (r) => (
        <div className="min-w-0">
          <p className="truncate font-medium text-fg">{r.name}</p>
          <p className="truncate text-xs text-fg-muted">{r.contact_name}</p>
        </div>
      ),
    },
    { key: "email", labelKey: "common.email", render: (r) => <span className="text-fg-secondary">{r.email}</span> },
    { key: "phone", labelKey: "common.phone", render: (r) => <span className="tabular">{r.phone}</span> },
    { key: "products_count", labelKey: "categories.productsCount", sortable: true, align: "right", hideOnMobile: true, render: (r) => <span className="tabular">{r.products_count}</span> },
    statusCol,
  ],
  filters: [statusFilter],
  form: {
    defaults: { status: "active" },
    sections: [
      {
        titleKey: "common.basicInfo",
        fields: [
          { name: "name", labelKey: "common.name", type: "text", required: true },
          { name: "contact_name", labelKey: "common.contactPerson", type: "text" },
        ],
      },
      {
        titleKey: "common.contactInfo",
        fields: [
          { name: "email", labelKey: "common.email", type: "email" },
          { name: "phone", labelKey: "common.phone", type: "tel" },
          { name: "address", labelKey: "common.address", type: "textarea", col: 2 },
          statusField,
        ],
      },
    ],
  },
};
export function SuppliersPage() {
  return <ResourcePage config={suppliersConfig} />;
}

/* ---------------- Customers ---------------- */
export const customersConfig = {
  resource: "customers",
  itemKey: "customers.item",
  titleKey: "customers.title",
  descriptionKey: "customers.subtitle",
  addLabelKey: "customers.add",
  emptyTitleKey: "customers.empty",
  emptyHintKey: "customers.emptyHint",
  icon: Users,
  columns: [
    {
      key: "name",
      labelKey: "common.name",
      primary: true,
      sortable: true,
      render: (r) => (
        <div className="flex items-center gap-3">
          <Avatar name={r.name} size="sm" />
          <div className="min-w-0">
            <p className="truncate font-medium text-fg">{r.name}</p>
            <p className="truncate text-xs text-fg-muted">{r.email}</p>
          </div>
        </div>
      ),
    },
    { key: "phone", labelKey: "common.phone", render: (r) => <span className="tabular">{r.phone}</span> },
    { key: "type", labelKey: "common.type", sortable: true, align: "center", render: (r, { t }) => <Badge variant={r.type === "wholesale" ? "primary" : "neutral"}>{t(`common.${r.type}`)}</Badge> },
    { key: "orders_count", labelKey: "customers.ordersCount", sortable: true, align: "right", render: (r) => <span className="tabular">{r.orders_count}</span> },
    { key: "total_spent", labelKey: "customers.totalSpent", sortable: true, align: "right", render: (r, { fmt }) => <span className="font-medium tabular">{fmt.currency(r.total_spent)}</span> },
    { key: "last_order_at", labelKey: "customers.lastOrder", sortable: true, hideOnMobile: true, render: (r, { fmt }) => (r.last_order_at ? fmt.relative(r.last_order_at) : null) },
    statusCol,
  ],
  filters: [
    {
      key: "type",
      labelKey: "common.type",
      options: [
        { value: "retail", labelKey: "common.retail" },
        { value: "wholesale", labelKey: "common.wholesale" },
      ],
    },
    statusFilter,
  ],
  form: {
    defaults: { status: "active", type: "retail" },
    sections: [
      {
        titleKey: "common.basicInfo",
        fields: [
          { name: "name", labelKey: "common.name", type: "text", required: true },
          {
            name: "type",
            labelKey: "common.type",
            type: "select",
            required: true,
            options: [
              { value: "retail", labelKey: "common.retail" },
              { value: "wholesale", labelKey: "common.wholesale" },
            ],
          },
        ],
      },
      {
        titleKey: "common.contactInfo",
        fields: [
          { name: "email", labelKey: "common.email", type: "email" },
          { name: "phone", labelKey: "common.phone", type: "tel" },
          { name: "address", labelKey: "common.address", type: "textarea", col: 2 },
          statusField,
        ],
      },
    ],
  },
};
export function CustomersPage() {
  return <ResourcePage config={customersConfig} />;
}

/* ---------------- Branches ---------------- */
export const branchesConfig = {
  resource: "branches",
  itemKey: "branches.item",
  titleKey: "branches.title",
  descriptionKey: "branches.subtitle",
  addLabelKey: "branches.add",
  emptyTitleKey: "branches.empty",
  emptyHintKey: "branches.emptyHint",
  icon: Building2,
  columns: [
    {
      key: "name",
      labelKey: "common.name",
      primary: true,
      sortable: true,
      render: (r) => (
        <div className="min-w-0">
          <p className="truncate font-medium text-fg">{r.name}</p>
          <p className="font-mono text-xs text-fg-muted">{r.code}</p>
        </div>
      ),
    },
    { key: "address", labelKey: "common.address", render: (r) => <span className="text-fg-secondary">{r.address}</span> },
    { key: "phone", labelKey: "common.phone", hideOnMobile: true, render: (r) => <span className="tabular">{r.phone}</span> },
    { key: "manager", labelKey: "common.manager" },
    { key: "users_count", labelKey: "nav.users", align: "right", render: (r) => <span className="tabular">{r.users_count}</span> },
    statusCol,
  ],
  filters: [statusFilter],
  form: {
    defaults: { status: "active" },
    sections: [
      {
        fields: [
          { name: "name", labelKey: "common.name", type: "text", required: true },
          { name: "code", labelKey: "common.code", type: "text", required: true },
          { name: "address", labelKey: "common.address", type: "textarea", col: 2 },
          { name: "phone", labelKey: "common.phone", type: "tel" },
          { name: "manager", labelKey: "common.manager", type: "text" },
          { ...statusField, col: 2 },
        ],
      },
    ],
  },
};
export function BranchesPage() {
  return <ResourcePage config={branchesConfig} />;
}
