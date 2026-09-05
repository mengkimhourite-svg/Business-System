import { api, rangeBounds, USE_MOCK } from "./api.js";
import { INTENTS } from "../config/aiAssistant.js";

/**
 * Frontend-only "AI" engine. It composes STRUCTURED answers from the existing demo data
 * (dashboard, reports, products, customers) — no new endpoints, no backend changes.
 *
 * Answer shape: { blocks: Block[], followUps: intentId[] }
 * Block kinds: text | kpi | list | table | alert | recommendation | comparison
 * Money values are passed in BASE currency and formatted by the UI (currency service).
 */

const round2 = (n) => Math.round((Number(n) || 0) * 100) / 100;
const pct = (cur, prev) => (prev ? ((cur - prev) / prev) * 100 : cur ? 100 : 0);

const KEYWORDS = [
  ["sales_today", /today|ថ្ងៃនេះ|daily/],
  ["why_sales_changed", /why|explain.*(sales|revenue)|ហេតុអ្វី/],
  ["compare_months", /compare|vs|last month|previous|ធៀប|month/],
  ["low_stock", /low stock|out of stock|stock alert|running out|ស្តុកទាប|អស់ស្តុក/],
  ["reorder", /reorder|restock|purchase order|buy more|បញ្ជាទិញឡើងវិញ/],
  ["stock_movement", /movement|stock in|stock out|adjust|ចលនា/],
  ["top_products", /best|top.*product|selling|popular|លក់ដាច់/],
  ["top_customers", /top.*customer|best.*customer|vip|អតិថិជនកំពូល/],
  ["inactive_customers", /inactive|churn|lost|haven't|not purchased|win.?back/],
  ["customers", /customer|client|អតិថិជន/],
  ["expenses", /expense|cost|spend|ចំណាយ/],
  ["profit", /profit|margin|net|ចំណេញ/],
  ["payment_methods", /payment|cash|card|qr|បង់ប្រាក់/],
  ["pending_orders", /pending|unpaid|open order|រង់ចាំ/],
  ["purchases_pending", /purchase|supplier|po\b|ទិញចូល/],
  ["peak_hours", /peak|busy|hour|time of day|ម៉ោង/],
  ["audit_summary", /audit|anomal|suspicious|review/],
  ["explain_report", /report|summary|overview|របាយការណ៍/],
  ["sales_trend", /trend|growth|week|និន្នាការ/],
  ["performance", /performance|how.*(business|doing)|dashboard|kpi|revenue|sales/],
];

/** Resolve free text (or an intent id) to an intent id. */
export function detectIntent(input) {
  if (INTENTS[input]) return input;
  const q = String(input || "").toLowerCase();
  const hit = KEYWORDS.find(([, re]) => re.test(q));
  return hit ? hit[0] : null;
}

const cache = new Map();
async function load(key, fn) {
  if (!cache.has(key)) cache.set(key, fn().catch((e) => { cache.delete(key); throw e; }));
  return cache.get(key);
}
export function invalidateAiCache() {
  cache.clear();
}

const getDashboard = (range) => load(`dash:${range}`, () => api.dashboard({ range }));
const getReports = (range) => load(`rep:${range}`, () => api.reports({ range }));
const getProducts = () => load("products", () => api.list("products", { perPage: 500 }).then((r) => r.data));
const getCustomers = () => load("customers", () => api.list("customers", { perPage: 500, sort: { key: "total_spent", dir: "desc" } }).then((r) => r.data));
const getOrders = () => load("orders", () => api.list("orders", { perPage: 500, sort: { key: "created_at", dir: "desc" } }).then((r) => r.data));
const getPurchases = () => load("purchases", () => api.list("purchases", { perPage: 200 }).then((r) => r.data));
const getMovements = () => load("movements", () => api.list("stock_movements", { perPage: 20 }).then((r) => r.data));

/* ------------------------------------------------------------------ */
/* Intent handlers → structured blocks                                  */
/* ------------------------------------------------------------------ */
const handlers = {
  async sales_today() {
    const d = await getDashboard("today");
    const k = d.kpis;
    return {
      blocks: [
        { kind: "kpi", titleKey: "ai.blocks.salesToday", value: k.revenue.value, money: true, change: k.revenue.change, changeLabelKey: "ai.blocks.vsYesterday", stats: [{ labelKey: "dashboard.orders", value: k.orders.value }, { labelKey: "dashboard.customers", value: k.customers.value }, { labelKey: "dashboard.avgOrder", value: k.avgOrder.value, money: true }] },
        d.topProducts.length ? { kind: "list", titleKey: "ai.blocks.topToday", items: d.topProducts.slice(0, 3).map((p) => ({ label: p.name, value: p.qty, unitKey: "ai.units" })) } : null,
        k.lowStock.value ? { kind: "alert", titleKey: "dashboard.lowStock", textKey: "ai.text.lowStockCount", params: { count: k.lowStock.value } } : null,
      ],
      followUps: ["why_sales_changed", "top_products", "reorder"],
    };
  },

  async performance() {
    const d = await getDashboard("last30");
    const k = d.kpis;
    const rep = await getReports("last30");
    return {
      blocks: [
        { kind: "kpi", titleKey: "ai.blocks.revenue30", value: k.revenue.value, money: true, change: k.revenue.change, stats: [{ labelKey: "dashboard.orders", value: k.orders.value }, { labelKey: "dashboard.newCustomers", value: k.customers.value }, { labelKey: "reports.grossProfit", value: rep.profit.grossProfit, money: true }] },
        { kind: "text", textKey: k.revenue.change >= 0 ? "ai.text.perfUp" : "ai.text.perfDown", params: { pct: Math.abs(k.revenue.change).toFixed(1) } },
        { kind: "list", titleKey: "dashboard.salesByCategory", items: d.byCategory.slice(0, 3).map((c) => ({ label: c.name, value: c.value, money: true })) },
        { kind: "recommendation", textKey: k.lowStock.value ? "ai.text.recPerfLowStock" : "ai.text.recPerfOk", params: { count: k.lowStock.value } },
      ],
      followUps: ["sales_trend", "top_products", "expenses"],
    };
  },

  async low_stock() {
    const products = await getProducts();
    const low = products.filter((p) => p.status === "active" && p.stock_status !== "in_stock").sort((a, b) => a.stock - b.stock);
    if (!low.length) return { blocks: [{ kind: "text", textKey: "ai.text.noLowStock" }], followUps: ["top_products", "performance"] };
    const out = low.filter((p) => p.stock <= 0).length;
    return {
      blocks: [
        { kind: "alert", titleKey: "dashboard.lowStock", textKey: out ? "ai.text.lowStockWithOut" : "ai.text.lowStockCount", params: { count: low.length, out } },
        { kind: "table", columnsKeys: ["common.product", "products.stock", "products.reorderLevel"], rows: low.slice(0, 6).map((p) => [p.name, `${p.stock} ${p.unit}`, p.reorder_level]) },
        { kind: "recommendation", textKey: "ai.text.recReorder", params: { product: low[0].name } },
      ],
      followUps: ["reorder", "stock_movement", "purchases_pending"],
    };
  },

  async top_products() {
    const d = await getDashboard("last30");
    return {
      blocks: [
        { kind: "list", titleKey: "ai.blocks.topProducts30", items: d.topProducts.map((p) => ({ label: p.name, value: p.qty, unitKey: "ai.units", sub: p.revenue, subMoney: true })) },
        { kind: "recommendation", textKey: "ai.text.recTopProducts", params: { product: d.topProducts[0]?.name || "" } },
      ],
      followUps: ["reorder", "low_stock", "sales_trend"],
    };
  },

  async customers() {
    const customers = await getCustomers();
    const active = customers.filter((c) => c.status === "active");
    const retail = active.filter((c) => c.type === "retail").length;
    const wholesale = active.length - retail;
    const cutoff = Date.now() - 30 * 86400000;
    const inactive = active.filter((c) => c.orders_count > 0 && c.last_order_at && new Date(c.last_order_at).getTime() < cutoff);
    const avgSpent = active.length ? active.reduce((s, c) => s + c.total_spent, 0) / active.length : 0;
    return {
      blocks: [
        { kind: "kpi", titleKey: "ai.blocks.customerBase", value: active.length, stats: [{ labelKey: "common.retail", value: retail }, { labelKey: "common.wholesale", value: wholesale }, { labelKey: "ai.blocks.avgSpent", value: round2(avgSpent), money: true }] },
        { kind: "list", titleKey: "reports.topCustomers", items: customers.slice(0, 3).map((c) => ({ label: c.name, value: c.total_spent, money: true })) },
        inactive.length ? { kind: "alert", titleKey: "ai.blocks.atRisk", textKey: "ai.text.inactiveCount", params: { count: inactive.length } } : null,
        { kind: "recommendation", textKey: inactive.length ? "ai.text.recWinBack" : "ai.text.recLoyalty" },
      ],
      followUps: ["top_customers", "inactive_customers", "sales_trend"],
    };
  },

  async top_customers() {
    const customers = await getCustomers();
    return {
      blocks: [
        { kind: "table", titleKey: "reports.topCustomers", columnsKeys: ["common.customer", "customers.ordersCount", "customers.totalSpent"], rows: customers.slice(0, 5).map((c) => [c.name, c.orders_count, { money: c.total_spent }]) },
        { kind: "recommendation", textKey: "ai.text.recTopCustomers", params: { name: customers[0]?.name || "" } },
      ],
      followUps: ["inactive_customers", "customers", "top_products"],
    };
  },

  async inactive_customers() {
    const customers = await getCustomers();
    const cutoff = Date.now() - 30 * 86400000;
    const inactive = customers.filter((c) => c.status === "active" && c.orders_count > 0 && c.last_order_at && new Date(c.last_order_at).getTime() < cutoff).sort((a, b) => b.total_spent - a.total_spent);
    if (!inactive.length) return { blocks: [{ kind: "text", textKey: "ai.text.noInactive" }], followUps: ["top_customers", "customers"] };
    return {
      blocks: [
        { kind: "alert", titleKey: "ai.blocks.atRisk", textKey: "ai.text.inactiveCount", params: { count: inactive.length } },
        { kind: "table", columnsKeys: ["common.customer", "customers.lastOrder", "customers.totalSpent"], rows: inactive.slice(0, 5).map((c) => [c.name, { date: c.last_order_at }, { money: c.total_spent }]) },
        { kind: "recommendation", textKey: "ai.text.recWinBack" },
      ],
      followUps: ["top_customers", "customers"],
    };
  },

  async reorder() {
    const products = await getProducts();
    const d = await getDashboard("last30");
    const sold = Object.fromEntries(d.topProducts.map((p) => [p.id, p.qty]));
    const candidates = products
      .filter((p) => p.status === "active" && p.stock <= p.reorder_level)
      .map((p) => ({ p, qty: Math.max(p.reorder_level * 2 - p.stock, Math.ceil((sold[p.id] || 0) * 1.5)) }))
      .sort((a, b) => a.p.stock - b.p.stock);
    if (!candidates.length) return { blocks: [{ kind: "text", textKey: "ai.text.noReorder" }], followUps: ["top_products", "stock_movement"] };
    return {
      blocks: [
        { kind: "text", textKey: "ai.text.reorderIntro", params: { count: candidates.length } },
        { kind: "table", columnsKeys: ["common.product", "products.stock", "ai.blocks.suggestedQty", "common.supplier"], rows: candidates.slice(0, 6).map(({ p, qty }) => [p.name, `${p.stock} ${p.unit}`, qty, p.supplier_name || "—"]) },
        { kind: "recommendation", textKey: "ai.text.recCreatePo", params: { supplier: candidates[0].p.supplier_name || "" } },
      ],
      followUps: ["low_stock", "purchases_pending", "top_products"],
    };
  },

  async stock_movement() {
    const moves = await getMovements();
    const ins = moves.filter((m) => m.qty > 0).reduce((s, m) => s + m.qty, 0);
    const outs = moves.filter((m) => m.qty < 0 || m.type === "out").reduce((s, m) => s + Math.abs(m.qty), 0);
    return {
      blocks: [
        { kind: "kpi", titleKey: "inventory.movements", value: moves.length, stats: [{ labelKey: "status.in", value: ins }, { labelKey: "status.out", value: outs }] },
        { kind: "table", columnsKeys: ["common.product", "common.type", "common.quantity", "common.date"], rows: moves.slice(0, 6).map((m) => [m.product_name, { statusKey: `status.${m.type}` }, m.qty > 0 ? `+${m.qty}` : m.qty, { date: m.created_at }]) },
      ],
      followUps: ["low_stock", "reorder", "purchases_pending"],
    };
  },

  async compare_months() {
    const cur = await getReports("thisMonth");
    const prev = await getReports("lastMonth");
    const change = pct(cur.sales.revenue, prev.sales.revenue);
    return {
      blocks: [
        { kind: "comparison", aKey: "common.thisMonth", a: cur.sales.revenue, bKey: "common.lastMonth", b: prev.sales.revenue, money: true, change },
        { kind: "list", titleKey: "reports.summary", items: [{ labelKey: "reports.orders", value: `${cur.sales.orders} / ${prev.sales.orders}` }, { labelKey: "reports.grossProfit", value: `${round2(cur.profit.grossProfit)} / ${round2(prev.profit.grossProfit)}`, moneyPair: [cur.profit.grossProfit, prev.profit.grossProfit] }, { labelKey: "reports.totalExpenses", moneyPair: [cur.expenses.total, prev.expenses.total] }] },
        { kind: "text", textKey: "ai.text.monthPartial" },
      ],
      followUps: ["why_sales_changed", "sales_trend", "expenses"],
    };
  },

  async expenses() {
    const rep = await getReports("last30");
    const e = rep.expenses;
    const top = e.byCategory[0];
    return {
      blocks: [
        { kind: "kpi", titleKey: "ai.blocks.expenses30", value: e.total, money: true, stats: [{ labelKey: "common.items", value: e.count }, { labelKey: "reports.netProfit", value: rep.profit.netProfit, money: true }] },
        { kind: "list", titleKey: "reports.expensesByCategory", items: e.byCategory.slice(0, 5).map((c) => ({ labelKey: `expenses.cat.${c.name}`, value: c.value, money: true, share: e.total ? Math.round((c.value / e.total) * 100) : 0 })) },
        top ? { kind: "recommendation", textKey: "ai.text.recExpenses", params: { category: top.name } , categoryParam: "category" } : null,
      ],
      followUps: ["profit", "compare_months", "performance"],
    };
  },

  async profit() {
    const rep = await getReports("last30");
    const p = rep.profit;
    return {
      blocks: [
        { kind: "kpi", titleKey: "reports.netProfit", value: p.netProfit, money: true, stats: [{ labelKey: "reports.revenue", value: p.revenue, money: true }, { labelKey: "reports.cogs", value: p.cogs, money: true }, { labelKey: "reports.margin", value: `${p.margin}%` }] },
        { kind: "comparison", aKey: "reports.grossProfit", a: p.grossProfit, bKey: "reports.totalExpenses", b: p.expenses, money: true },
        { kind: "recommendation", textKey: p.margin < 25 ? "ai.text.recMarginLow" : "ai.text.recMarginOk", params: { pct: p.margin } },
      ],
      followUps: ["expenses", "top_products", "compare_months"],
    };
  },

  async payment_methods() {
    const d = await getDashboard("last30");
    const total = d.byPayment.reduce((s, x) => s + x.value, 0);
    return {
      blocks: [
        { kind: "list", titleKey: "dashboard.paymentMethods", items: d.byPayment.map((x) => ({ labelKey: { cash: "common.cash", card: "common.card", qr: "common.qr", bank_transfer: "common.bankTransfer" }[x.name] || undefined, label: x.name, value: x.value, money: true, share: total ? Math.round((x.value / total) * 100) : 0 })) },
        { kind: "text", textKey: "ai.text.paymentNote" },
      ],
      followUps: ["sales_today", "profit"],
    };
  },

  async sales_trend() {
    const d7 = await getDashboard("last7");
    const d30 = await getDashboard("last30");
    const best = [...d30.series].sort((a, b) => b.revenue - a.revenue)[0];
    return {
      blocks: [
        { kind: "kpi", titleKey: "ai.blocks.last7", value: d7.kpis.revenue.value, money: true, change: d7.kpis.revenue.change, changeLabelKey: "ai.blocks.vsPrev7", stats: [{ labelKey: "dashboard.orders", value: d7.kpis.orders.value }, { labelKey: "dashboard.avgOrder", value: d7.kpis.avgOrder.value, money: true }] },
        { kind: "text", textKey: "ai.text.trendBestDay", params: { date: best?.date || "", amount: best?.revenue || 0 }, moneyParams: ["amount"], dateParams: ["date"] },
        { kind: "recommendation", textKey: d7.kpis.revenue.change >= 0 ? "ai.text.recTrendUp" : "ai.text.recTrendDown" },
      ],
      followUps: ["why_sales_changed", "compare_months", "peak_hours"],
    };
  },

  async why_sales_changed() {
    const d = await getDashboard("last7");
    const prevUp = d.kpis.revenue.change >= 0;
    const drivers = [
      { labelKey: "dashboard.orders", value: `${d.kpis.orders.change >= 0 ? "+" : ""}${d.kpis.orders.change.toFixed(1)}%` },
      { labelKey: "dashboard.avgOrder", value: `${d.kpis.avgOrder.change >= 0 ? "+" : ""}${d.kpis.avgOrder.change.toFixed(1)}%` },
      { labelKey: "dashboard.newCustomers", value: `${d.kpis.customers.change >= 0 ? "+" : ""}${d.kpis.customers.change.toFixed(1)}%` },
    ];
    return {
      blocks: [
        { kind: "text", textKey: prevUp ? "ai.text.whyUp" : "ai.text.whyDown", params: { pct: Math.abs(d.kpis.revenue.change).toFixed(1) } },
        { kind: "list", titleKey: "ai.blocks.drivers", items: drivers },
        { kind: "list", titleKey: "ai.blocks.topContributors", items: d.topProducts.slice(0, 3).map((p) => ({ label: p.name, value: p.revenue, money: true })) },
        { kind: "recommendation", textKey: prevUp ? "ai.text.recKeepMomentum" : "ai.text.recRecover" },
      ],
      followUps: ["top_products", "peak_hours", "compare_months"],
    };
  },

  async pending_orders() {
    const orders = await getOrders();
    const pending = orders.filter((o) => o.status === "pending");
    const unpaid = orders.filter((o) => o.status !== "cancelled" && o.payment_status !== "paid");
    return {
      blocks: [
        { kind: "kpi", titleKey: "ai.blocks.openOrders", value: pending.length, stats: [{ labelKey: "status.unpaid", value: unpaid.length }, { labelKey: "ai.blocks.outstanding", value: round2(unpaid.reduce((s, o) => s + o.total, 0)), money: true }] },
        pending.length ? { kind: "table", columnsKeys: ["orders.number", "common.customer", "common.total", "common.date"], rows: pending.slice(0, 5).map((o) => [o.number, o.customer_name || "—", { money: o.total }, { date: o.created_at }]) } : { kind: "text", textKey: "ai.text.noPending" },
        unpaid.length ? { kind: "recommendation", textKey: "ai.text.recFollowUpPayments" } : null,
      ],
      followUps: ["sales_today", "top_customers"],
    };
  },

  async purchases_pending() {
    const purchases = await getPurchases();
    const open = purchases.filter((p) => p.status === "ordered");
    return {
      blocks: [
        { kind: "kpi", titleKey: "ai.blocks.openPurchases", value: open.length, stats: [{ labelKey: "common.total", value: round2(open.reduce((s, p) => s + p.total, 0)), money: true }] },
        open.length ? { kind: "table", columnsKeys: ["purchases.number", "common.supplier", "common.total", "purchases.expected"], rows: open.slice(0, 5).map((p) => [p.number, p.supplier_name, { money: p.total }, { date: p.expected_at }]) } : { kind: "text", textKey: "ai.text.noOpenPurchases" },
        { kind: "recommendation", textKey: "ai.text.recReceivePo" },
      ],
      followUps: ["reorder", "low_stock", "stock_movement"],
    };
  },

  async explain_report() {
    const rep = await getReports("last30");
    return {
      blocks: [
        { kind: "text", textKey: "ai.text.reportIntro" },
        { kind: "list", titleKey: "reports.summary", items: [{ labelKey: "reports.revenue", value: rep.sales.revenue, money: true }, { labelKey: "reports.cogs", value: rep.profit.cogs, money: true }, { labelKey: "reports.grossProfit", value: rep.profit.grossProfit, money: true }, { labelKey: "reports.totalExpenses", value: rep.expenses.total, money: true }, { labelKey: "reports.netProfit", value: rep.profit.netProfit, money: true }] },
        { kind: "text", textKey: "ai.text.reportMargin", params: { pct: rep.profit.margin } },
        { kind: "recommendation", textKey: "ai.text.recReport" },
      ],
      followUps: ["compare_months", "profit", "expenses"],
    };
  },

  async audit_summary() {
    const orders = await getOrders();
    const rep = await getReports("last30");
    const { start } = rangeBounds("last30");
    const recent = orders.filter((o) => new Date(o.created_at) >= start);
    const cancelled = recent.filter((o) => o.status === "cancelled");
    const discounted = recent.filter((o) => o.discount > 0);
    const refunded = recent.filter((o) => o.payment_status === "refunded");
    const pendingExp = rep.expenses.list.filter((e) => e.status === "pending").length;
    return {
      blocks: [
        { kind: "kpi", titleKey: "ai.blocks.auditWindow", value: recent.length, stats: [{ labelKey: "status.cancelled", value: cancelled.length }, { labelKey: "ai.blocks.discounted", value: discounted.length }, { labelKey: "status.refunded", value: refunded.length }] },
        { kind: "list", titleKey: "ai.blocks.checks", items: [{ labelKey: "ai.blocks.cancelRate", value: `${recent.length ? ((cancelled.length / recent.length) * 100).toFixed(1) : 0}%` }, { labelKey: "ai.blocks.discountRate", value: `${recent.length ? ((discounted.length / recent.length) * 100).toFixed(1) : 0}%` }, { labelKey: "expenses.pendingApproval", value: pendingExp }] },
        { kind: pendingExp || cancelled.length > recent.length * 0.1 ? "alert" : "text", titleKey: "ai.blocks.attention", textKey: pendingExp ? "ai.text.auditPendingExp" : "ai.text.auditOk", params: { count: pendingExp } },
      ],
      followUps: ["expenses", "payment_methods", "compare_months"],
    };
  },

  async peak_hours() {
    const orders = await getOrders();
    const { start } = rangeBounds("last30");
    const hours = {};
    orders.filter((o) => o.status !== "cancelled" && new Date(o.created_at) >= start).forEach((o) => {
      const h = new Date(o.created_at).getHours();
      hours[h] = (hours[h] || 0) + 1;
    });
    const sorted = Object.entries(hours).sort((a, b) => b[1] - a[1]).slice(0, 5);
    return {
      blocks: [
        { kind: "list", titleKey: "ai.blocks.peakHours", items: sorted.map(([h, n]) => ({ label: `${String(h).padStart(2, "0")}:00 – ${String(Number(h) + 1).padStart(2, "0")}:00`, value: n, unitKey: "ai.orders" })) },
        { kind: "recommendation", textKey: "ai.text.recPeak", params: { hour: `${String(sorted[0]?.[0] ?? 12).padStart(2, "0")}:00` } },
      ],
      followUps: ["sales_today", "sales_trend"],
    };
  },
};

/** Map a structured AI insight (Laravel → FastAPI response) into renderable blocks. */
export function insightToBlocks(d = {}) {
  const blocks = [];
  if (d.summary) blocks.push({ kind: "text", text: d.summary });
  if (Array.isArray(d.metrics) && d.metrics.length) blocks.push({ kind: "list", title: d.title, items: d.metrics.map((m) => ({ label: m.label, value: m.value, money: !!m.money, unit: m.unit })) });
  if (Array.isArray(d.table_rows) && d.table_rows.length) blocks.push({ kind: "table", columns: d.table_columns || [], rows: d.table_rows });
  (d.alerts || []).forEach((a) => blocks.push({ kind: "alert", title: a.title, text: a.message || a.text }));
  (d.recommendations || []).forEach((r) => blocks.push({ kind: "recommendation", text: typeof r === "string" ? r : r.text || r.message }));
  if (d.comparison) blocks.push({ kind: "comparison", aLabel: d.comparison.a_label, a: d.comparison.a, bLabel: d.comparison.b_label, b: d.comparison.b, money: !!d.comparison.money, change: d.comparison.change });
  return blocks;
}

/** Ask the assistant. Real mode → Laravel → FastAPI; mock mode → local engine. Returns { intent, blocks, followUps }. */
export async function askAssistant(input, context = {}) {
  if (!USE_MOCK) {
    const res = await api.aiChat({ message: INTENTS[input] ? undefined : input, intent: INTENTS[input] ? input : undefined, page: context.page || null, role: context.role || null });
    const d = res?.data || res || {};
    const blocks = insightToBlocks(d);
    return { intent: d.intent || detectIntent(input) || "remote", blocks, followUps: (d.follow_ups || []).filter((k) => INTENTS[k]) };
  }
  await new Promise((r) => setTimeout(r, 700 + Math.random() * 600));
  const intent = detectIntent(input);
  if (!intent) return { intent: null, blocks: [], followUps: ["sales_today", "low_stock", "top_products", "performance"] };
  const res = await handlers[intent]();
  return { intent, blocks: res.blocks.filter(Boolean), followUps: res.followUps || [] };
}

/** Compact insights for the dashboard cards (max 3). */
export async function getDashboardInsights() {
  const d7 = await getDashboard("last7");
  const products = await getProducts();
  const low = products.filter((p) => p.status === "active" && p.stock_status !== "in_stock");
  const trendUp = d7.kpis.revenue.change >= 0;
  const cards = [];
  if (low.length) cards.push({ id: "low", tone: "warning", icon: "alert", titleKey: "dashboard.lowStock", textKey: "ai.text.lowStockCount", params: { count: low.length }, link: "/inventory?stock_status=low_stock", intent: "low_stock" });
  cards.push({ id: "trend", tone: trendUp ? "success" : "danger", icon: trendUp ? "up" : "down", titleKey: "reports.salesTrend", textKey: trendUp ? "ai.text.trendUpWeek" : "ai.text.trendDownWeek", params: { pct: Math.abs(d7.kpis.revenue.change).toFixed(1) }, intent: "why_sales_changed" });
  const top = d7.topProducts[0];
  cards.push({ id: "rec", tone: "primary", icon: "bulb", titleKey: "ai.recommendation", textKey: top ? "ai.text.recReorderTop" : "ai.text.recLoyalty", params: { product: top?.name || "" }, intent: "reorder" });
  return cards.slice(0, 3);
}
