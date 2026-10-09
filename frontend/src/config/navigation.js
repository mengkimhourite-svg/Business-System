import {
  LayoutDashboard,
  Briefcase,
  Workflow,
  UsersRound,
  LineChart,
  Settings2,
  Package,
  Tags,
  BadgeCheck,
  Users,
  Truck,
  ShoppingCart,
  ClipboardList,
  ShoppingBag,
  Warehouse,
  Receipt,
  UserCog,
  ShieldCheck,
  Building2,
  BarChart3,
  Sparkles,
  Settings,
  QrCode,
} from "lucide-react";

/**
 * Centralized sidebar navigation — ONE level of parent groups with child routes.
 * Every child declares the permission required to see it; a group is shown only
 * when at least one child is permitted (RBAC is enforced again by route guards).
 */
export const NAVIGATION = [
  {
    key: "overview",
    labelKey: "nav.overview",
    icon: LayoutDashboard,
    items: [{ key: "dashboard", path: "/", labelKey: "nav.dashboard", icon: LayoutDashboard, permission: "dashboard.view" }],
  },
  {
    key: "business",
    labelKey: "nav.business",
    icon: Briefcase,
    items: [
      { key: "products", path: "/products", labelKey: "nav.products", icon: Package, permission: "products.view" },
      { key: "categories", path: "/categories", labelKey: "nav.categories", icon: Tags, permission: "categories.view" },
      { key: "brands", path: "/brands", labelKey: "nav.brands", icon: BadgeCheck, permission: "brands.view" },
      { key: "customers", path: "/customers", labelKey: "nav.customers", icon: Users, permission: "customers.view" },
      { key: "suppliers", path: "/suppliers", labelKey: "nav.suppliers", icon: Truck, permission: "suppliers.view" },
    ],
  },
  {
    key: "operations",
    labelKey: "nav.operations",
    icon: Workflow,
    items: [
      { key: "sales", path: "/sales", labelKey: "nav.sales", icon: ShoppingCart, permission: "sales.view" },
      { key: "orders", path: "/orders", labelKey: "nav.orders", icon: ClipboardList, permission: "orders.view" },
      { key: "khqr-payments", path: "/khqr-payments", labelKey: "nav.khqrPayments", icon: QrCode, permission: "orders.view" },
      { key: "purchases", path: "/purchases", labelKey: "nav.purchases", icon: ShoppingBag, permission: "purchases.view" },
      { key: "inventory", path: "/inventory", labelKey: "nav.inventory", icon: Warehouse, permission: "inventory.view" },
      { key: "expenses", path: "/expenses", labelKey: "nav.expenses", icon: Receipt, permission: "expenses.view" },
    ],
  },
  {
    key: "management",
    labelKey: "nav.management",
    icon: UsersRound,
    items: [
      { key: "users", path: "/users", labelKey: "nav.users", icon: UserCog, permission: "users.view" },
      { key: "roles", path: "/roles", labelKey: "nav.roles", icon: ShieldCheck, permission: "roles.view" },
      { key: "branches", path: "/branches", labelKey: "nav.branches", icon: Building2, permission: "branches.view" },
      { key: "reports", path: "/reports", labelKey: "nav.reports", icon: BarChart3, permission: "reports.view" },
      { key: "settings", path: "/settings", labelKey: "nav.settings", icon: Settings, permission: "settings.view" },
    ],
  },


  {
    key: "system",
    labelKey: "nav.system",
    icon: Settings2,
    items: [],
  },
];

export const NAV_ITEMS = NAVIGATION.flatMap((s) => s.items);

export function isPathActive(itemPath, pathname) {
  return itemPath === "/" ? pathname === "/" : pathname === itemPath || pathname.startsWith(`${itemPath}/`);
}

export function findNavItem(pathname) {
  return NAV_ITEMS.find((i) => isPathActive(i.path, pathname));
}

export function findNavGroup(pathname) {
  return NAVIGATION.find((g) => g.items.some((i) => isPathActive(i.path, pathname)));
}

/** Filter the navigation tree by a permission predicate (RBAC-aware). */
export function visibleNavigation(can) {
  return NAVIGATION.map((g) => ({ ...g, items: g.items.filter((i) => can(i.permission)) })).filter((g) => g.items.length > 0);
}
