/**
 * Centralized permission catalogue.
 * Format: `<group>.<ability>` e.g. "products.create".
 * Frontend checks are UX only — the backend remains the security authority.
 * Synced with backend config/sbs.php permission_groups.
 */
export const PERMISSION_GROUPS = [
  { key: "dashboard", abilities: ["view"] },
  { key: "products", abilities: ["view", "create", "update", "delete", "export"] },
  { key: "categories", abilities: ["view", "create", "update", "delete"] },
  { key: "brands", abilities: ["view", "create", "update", "delete"] },
  { key: "customers", abilities: ["view", "create", "update", "delete", "export"] },
  { key: "suppliers", abilities: ["view", "create", "update", "delete"] },
  { key: "sales", abilities: ["view", "create"] },
  { key: "orders", abilities: ["view", "update", "delete", "approve"] },
  { key: "purchases", abilities: ["view", "create", "update", "delete", "approve"] },
  { key: "inventory", abilities: ["view", "adjust"] },
  { key: "expenses", abilities: ["view", "create", "update", "delete", "approve"] },
  { key: "users", abilities: ["view", "create", "update", "delete"] },
  { key: "roles", abilities: ["view", "create", "update", "delete", "manage"] },
  { key: "branches", abilities: ["view", "create", "update", "delete"] },
  { key: "reports", abilities: ["view", "export"] },
  { key: "ai", abilities: ["view"] },
  { key: "settings", abilities: ["view", "update"] },
  { key: "payments", abilities: ["view", "approve", "reject"] },
];

export const ALL_PERMISSIONS = PERMISSION_GROUPS.flatMap((g) => g.abilities.map((a) => `${g.key}.${a}`));

export function hasPermission(granted = [], permission) {
  if (!permission) return true;
  if (granted.includes("*")) return true;
  const list = Array.isArray(permission) ? permission : [permission];
  return list.some((p) => granted.includes(p));
}

const byGroups = (groups) => ALL_PERMISSIONS.filter((p) => groups.includes(p.split(".")[0]));

/** Default permission sets per system role (synced with backend BusinessSeeder). */
export const ROLE_PERMISSIONS = {
  super_admin: ["*"],
  admin: ALL_PERMISSIONS.filter((p) => !["roles.delete", "branches.delete"].includes(p)),
  manager: [
    ...byGroups(["dashboard", "products", "categories", "brands", "customers", "suppliers", "sales", "orders", "purchases", "inventory", "reports", "ai"]),
    "expenses.view",
    "expenses.create",
    "branches.view",
  ],
  accountant: [
    "dashboard.view",
    ...byGroups(["expenses", "reports"]),
    "purchases.view",
    "orders.view",
    "customers.view",
    "suppliers.view",
    "ai.view",
    "settings.view",
    "settings.update",
  ],
  sales: [
    "dashboard.view",
    ...byGroups(["sales", "customers"]),
    "orders.view",
    "orders.update",
    "products.view",
    "categories.view",
    "brands.view",
    "ai.view",
    "settings.view",
    "settings.update",
  ],
  inventory: [
    "dashboard.view",
    ...byGroups(["products", "categories", "brands", "suppliers", "purchases", "inventory"]),
    "reports.view",
    "ai.view",
    "settings.view",
    "settings.update",
  ],
  purchase: [
    "dashboard.view",
    ...byGroups(["purchases", "suppliers"]),
    "products.view",
    "inventory.view",
    "ai.view",
    "settings.view",
    "settings.update",
  ],
  warehouse: [
    "dashboard.view",
    ...byGroups(["inventory"]),
    "products.view",
    "purchases.view",
    "purchases.update",
    "settings.view",
    "settings.update",
  ],
  customer_service: [
    "dashboard.view",
    ...byGroups(["customers"]),
    "orders.view",
    "orders.update",
    "products.view",
    "ai.view",
    "settings.view",
    "settings.update",
  ],
  auditor: [
    "dashboard.view",
    "reports.view",
    "reports.export",
    "orders.view",
    "purchases.view",
    "expenses.view",
    "inventory.view",
    "ai.view",
    "settings.view",
  ],
};
