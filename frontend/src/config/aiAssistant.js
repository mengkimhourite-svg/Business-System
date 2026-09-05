/**
 * Frontend-only AI Assistant configuration: demo roles, page contexts and quick questions.
 * This is a UX demonstration layer — real RBAC stays in the backend and route guards.
 */

export const AI_ROLES = [
  { key: "super_admin", labelKey: "ai.roles.super_admin" },
  { key: "admin", labelKey: "ai.roles.admin" },
  { key: "manager", labelKey: "ai.roles.manager" },
  { key: "accountant", labelKey: "ai.roles.accountant" },
  { key: "sales", labelKey: "ai.roles.sales" },
  { key: "inventory", labelKey: "ai.roles.inventory" },
  { key: "purchase", labelKey: "ai.roles.purchase" },
  { key: "warehouse", labelKey: "ai.roles.warehouse" },
  { key: "customer_service", labelKey: "ai.roles.customer_service" },
  { key: "auditor", labelKey: "ai.roles.auditor" },
];

/** Intent ids understood by the mock engine (see services/aiAssistant.js). */
export const INTENTS = {
  sales_today: { labelKey: "ai.q.salesToday" },
  performance: { labelKey: "ai.q.performance" },
  low_stock: { labelKey: "ai.q.lowStock" },
  top_products: { labelKey: "ai.q.topProducts" },
  customers: { labelKey: "ai.q.customers" },
  top_customers: { labelKey: "ai.q.topCustomers" },
  reorder: { labelKey: "ai.q.reorder" },
  stock_movement: { labelKey: "ai.q.stockMovement" },
  compare_months: { labelKey: "ai.q.compareMonths" },
  expenses: { labelKey: "ai.q.expenses" },
  profit: { labelKey: "ai.q.profit" },
  payment_methods: { labelKey: "ai.q.paymentMethods" },
  sales_trend: { labelKey: "ai.q.salesTrend" },
  why_sales_changed: { labelKey: "ai.q.whySalesChanged" },
  pending_orders: { labelKey: "ai.q.pendingOrders" },
  purchases_pending: { labelKey: "ai.q.purchasesPending" },
  explain_report: { labelKey: "ai.q.explainReport" },
  audit_summary: { labelKey: "ai.q.auditSummary" },
  inactive_customers: { labelKey: "ai.q.inactiveCustomers" },
  peak_hours: { labelKey: "ai.q.peakHours" },
};

/** Quick questions per demo role (frontend only). */
export const ROLE_QUESTIONS = {
  super_admin: ["sales_today", "low_stock", "top_products", "performance", "customers"],
  admin: ["sales_today", "performance", "low_stock", "expenses", "top_customers"],
  manager: ["performance", "sales_trend", "top_products", "low_stock", "pending_orders"],
  accountant: ["profit", "expenses", "compare_months", "payment_methods", "sales_today"],
  sales: ["sales_today", "top_products", "peak_hours", "pending_orders", "top_customers"],
  inventory: ["low_stock", "reorder", "stock_movement", "top_products", "purchases_pending"],
  purchase: ["reorder", "purchases_pending", "low_stock", "top_products", "expenses"],
  warehouse: ["stock_movement", "low_stock", "purchases_pending", "reorder", "pending_orders"],
  customer_service: ["customers", "top_customers", "inactive_customers", "pending_orders", "top_products"],
  auditor: ["audit_summary", "expenses", "profit", "compare_months", "payment_methods"],
};

/** Page-aware suggestions keyed by route prefix. */
export const PAGE_CONTEXTS = [
  { match: (p) => p === "/", key: "dashboard", labelKey: "nav.dashboard", questions: ["performance", "sales_today", "sales_trend", "low_stock"] },
  { match: (p) => p.startsWith("/sales") || p.startsWith("/orders"), key: "sales", labelKey: "nav.sales", questions: ["sales_today", "top_products", "sales_trend", "peak_hours"] },
  { match: (p) => p.startsWith("/inventory") || p.startsWith("/products") || p.startsWith("/purchases"), key: "inventory", labelKey: "nav.inventory", questions: ["low_stock", "stock_movement", "reorder", "purchases_pending"] },
  { match: (p) => p.startsWith("/customers"), key: "customers", labelKey: "nav.customers", questions: ["top_customers", "customers", "inactive_customers", "sales_trend"] },
  { match: (p) => p.startsWith("/reports") || p.startsWith("/ai-insights") || p.startsWith("/expenses"), key: "reports", labelKey: "nav.reports", questions: ["explain_report", "compare_months", "sales_trend", "profit"] },
];

export function pageContextFor(pathname) {
  return PAGE_CONTEXTS.find((c) => c.match(pathname)) || null;
}

/** Map real role slugs onto the demo roles so the default experience matches the signed-in user. */
export function defaultDemoRole(roleSlug) {
  return ROLE_QUESTIONS[roleSlug] ? roleSlug : "manager";
}

export const AI_SETTINGS_DEFAULTS = {
  enabled: true,
  floatingButton: true,
  insights: true,
  quickQuestions: true,
  demoRole: null,
};
