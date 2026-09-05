/**
 * Centralized permission catalogue.
 * Format: `<group>.<ability>` e.g. "products.create".
 * Frontend checks are UX only — the backend remains the security authority.
 */
export const PERMISSION_GROUPS = [
  { key: "dashboard", abilities: ["view"] },
  { key: "products", abilities: ["view", "create", "update", "delete"] },
  { key: "categories", abilities: ["view", "create", "update", "delete"] },
  { key: "brands", abilities: ["view", "create", "update", "delete"] },
  { key: "customers", abilities: ["view", "create", "update", "delete"] },
  { key: "suppliers", abilities: ["view", "create", "update", "delete"] },
  { key: "sales", abilities: ["view", "create"] },
  { key: "orders", abilities: ["view", "update", "delete"] },
  { key: "purchases", abilities: ["view", "create", "update", "delete"] },
  { key: "inventory", abilities: ["view", "adjust"] },
  { key: "expenses", abilities: ["view", "create", "update", "delete"] },
  { key: "users", abilities: ["view", "create", "update", "delete"] },
  { key: "roles", abilities: ["view", "create", "update", "delete"] },
  { key: "branches", abilities: ["view", "create", "update", "delete"] },
  { key: "reports", abilities: ["view", "export"] },
  { key: "ai", abilities: ["view"] },
  { key: "settings", abilities: ["view", "update"] },
];

export const ALL_PERMISSIONS = PERMISSION_GROUPS.flatMap((g) => g.abilities.map((a) => `${g.key}.${a}`));

export function hasPermission(granted = [], permission) {
  if (!permission) return true;
  if (granted.includes("*")) return true;
  const list = Array.isArray(permission) ? permission : [permission];
  return list.some((p) => granted.includes(p));
}

const byGroups = (groups) => ALL_PERMISSIONS.filter((p) => groups.includes(p.split(".")[0]));

/** Default permission sets per system role (used by the mock backend). */
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
  ],
  sales: [
    "dashboard.view",
    ...byGroups(["sales", "customers"]),
    "orders.view",
    "orders.update",
    "products.view",
    "categories.view",
    "brands.view",
  ],
  inventory: [
    "dashboard.view",
    ...byGroups(["products", "categories", "brands", "suppliers", "purchases", "inventory"]),
    "reports.view",
  ],
};
