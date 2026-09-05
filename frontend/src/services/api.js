import { loadDb, saveDb, resetDb, nextId } from "./mockDb.js";

/* ------------------------------------------------------------------ */
/* Shared                                                               */
/* ------------------------------------------------------------------ */
import { ApiError, tokenStore, USE_MOCK, API_URL, UNAUTHORIZED_EVENT, errorKey } from "./apiCore.js";
import { http } from "./http.js";
export { ApiError, tokenStore, USE_MOCK, API_URL, UNAUTHORIZED_EVENT, errorKey };
const emitUnauthorized = () => window.dispatchEvent(new CustomEvent(UNAUTHORIZED_EVENT));

const parseLocalDate = (v) => {
  if (!v) return null;
  if (v instanceof Date) return new Date(v);
  if (/^\d{4}-\d{2}-\d{2}$/.test(v)) {
    const [y, m, d] = v.split("-").map(Number);
    return new Date(y, m - 1, d);
  }
  const d = new Date(v);
  return Number.isNaN(d.getTime()) ? null : d;
};
const startOfDay = (d) => {
  d.setHours(0, 0, 0, 0);
  return d;
};
const endOfDay = (d) => {
  d.setHours(23, 59, 59, 999);
  return d;
};

/**
 * Resolve a preset (today, yesterday, last7, last30, thisMonth, lastMonth, thisYear, lastYear)
 * or a custom {from,to} range into bounds, the comparison period and the best series granularity.
 */
export function rangeBounds(range = "last30", { from, to } = {}) {
  const now = new Date();
  let start = startOfDay(new Date());
  let end = endOfDay(new Date());
  switch (range) {
    case "today":
      break;
    case "yesterday":
      start.setDate(start.getDate() - 1);
      end.setDate(end.getDate() - 1);
      break;
    case "last7":
      start.setDate(start.getDate() - 6);
      break;
    case "last90":
      start.setDate(start.getDate() - 89);
      break;
    case "thisMonth":
      start.setDate(1);
      break;
    case "lastMonth":
      start = startOfDay(new Date(now.getFullYear(), now.getMonth() - 1, 1));
      end = endOfDay(new Date(now.getFullYear(), now.getMonth(), 0));
      break;
    case "thisYear":
      start = startOfDay(new Date(now.getFullYear(), 0, 1));
      break;
    case "lastYear":
      start = startOfDay(new Date(now.getFullYear() - 1, 0, 1));
      end = endOfDay(new Date(now.getFullYear() - 1, 11, 31));
      break;
    case "custom": {
      const f = parseLocalDate(from);
      const tt = parseLocalDate(to);
      if (f) start = startOfDay(f);
      if (tt) end = endOfDay(tt);
      if (end < start) {
        const swap = start;
        start = startOfDay(new Date(end));
        end = endOfDay(swap);
      }
      break;
    }
    default:
      start.setDate(start.getDate() - 29); // last30
  }
  const span = end.getTime() - start.getTime();
  const prevEnd = new Date(start.getTime() - 1);
  const prevStart = new Date(prevEnd.getTime() - span);
  const days = Math.floor(span / 86400000) + 1;
  const mode = days <= 1 ? "hour" : days > 92 ? "month" : "day";
  return { start, end, prevStart, prevEnd, mode, days };
}

/* ------------------------------------------------------------------ */
/* Mock implementation                                                  */
/* ------------------------------------------------------------------ */
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const latency = () => sleep(160 + Math.random() * 240);
const clone = (v) => JSON.parse(JSON.stringify(v));
const round2 = (n) => Math.round(n * 100) / 100;
const nameOf = (table, id) => table.find((r) => r.id === Number(id))?.name ?? null;
const between = (d, s, e) => {
  const t = new Date(d).getTime();
  return t >= s.getTime() && t <= e.getTime();
};
const pctChange = (cur, prev) => (prev ? ((cur - prev) / prev) * 100 : cur ? 100 : 0);

function requireAuth() {
  if (!tokenStore.get()) {
    emitUnauthorized();
    throw new ApiError(401, "Unauthorized");
  }
}

function stockStatus(p) {
  if (p.stock <= 0) return "out_of_stock";
  if (p.stock <= (p.reorder_level ?? 10)) return "low_stock";
  return "in_stock";
}

const enrichers = {
  products: (p, db) => ({
    ...p,
    category_name: nameOf(db.categories, p.category_id),
    brand_name: nameOf(db.brands, p.brand_id),
    supplier_name: nameOf(db.suppliers, p.supplier_id),
    stock_status: stockStatus(p),
  }),
  categories: (c, db) => ({ ...c, products_count: db.products.filter((p) => p.category_id === c.id).length }),
  brands: (b, db) => ({ ...b, products_count: db.products.filter((p) => p.brand_id === b.id).length }),
  suppliers: (s, db) => ({ ...s, products_count: db.products.filter((p) => p.supplier_id === s.id).length }),
  customers: (c, db) => {
    const os = db.orders.filter((o) => o.customer_id === c.id && o.status !== "cancelled");
    return {
      ...c,
      orders_count: os.length,
      total_spent: round2(os.reduce((s, o) => s + o.total, 0)),
      last_order_at: os.length ? os.map((o) => o.created_at).sort().at(-1) : null,
    };
  },
  users: (u, db) => {
    const { password, ...rest } = u;
    const role = db.roles.find((r) => r.id === u.role_id);
    return { ...rest, role_name: role?.name ?? null, role_slug: role?.slug ?? null, branch_name: nameOf(db.branches, u.branch_id) };
  },
  roles: (r, db) => ({ ...r, users_count: db.users.filter((u) => u.role_id === r.id).length }),
  branches: (b, db) => ({ ...b, users_count: db.users.filter((u) => u.branch_id === b.id).length }),
  orders: (o, db) => ({
    ...o,
    customer_name: o.customer_id ? nameOf(db.customers, o.customer_id) : null,
    user_name: nameOf(db.users, o.user_id),
    branch_name: nameOf(db.branches, o.branch_id),
    items_count: o.items.reduce((s, i) => s + i.qty, 0),
  }),
  purchases: (p, db) => ({ ...p, supplier_name: nameOf(db.suppliers, p.supplier_id), items_count: p.items.reduce((s, i) => s + i.qty, 0) }),
  expenses: (e, db) => ({ ...e, user_name: nameOf(db.users, e.user_id) }),
  stock_movements: (m, db) => {
    const p = db.products.find((x) => x.id === m.product_id);
    return { ...m, product_name: p?.name ?? "—", product_sku: p?.sku ?? "", product_image: p?.image ?? null, user_name: nameOf(db.users, m.user_id) };
  },
};

const searchable = {
  products: ["name", "sku", "barcode", "category_name", "brand_name"],
  categories: ["name", "description"],
  brands: ["name", "website"],
  suppliers: ["name", "contact_name", "email", "phone"],
  customers: ["name", "email", "phone"],
  users: ["name", "email", "role_name"],
  roles: ["name", "description"],
  branches: ["name", "code", "address", "manager"],
  orders: ["number", "customer_name", "user_name"],
  purchases: ["number", "supplier_name"],
  expenses: ["reference", "category", "note", "user_name"],
  stock_movements: ["product_name", "product_sku", "reference", "reason"],
};

const dateField = { orders: "created_at", purchases: "created_at", expenses: "date", stock_movements: "created_at" };
const defaultSort = {
  categories: { key: "name", dir: "asc" },
  brands: { key: "name", dir: "asc" },
  suppliers: { key: "name", dir: "asc" },
  branches: { key: "name", dir: "asc" },
  roles: { key: "id", dir: "asc" },
};

function enrich(resource, row, db) {
  return enrichers[resource] ? enrichers[resource](row, db) : { ...row };
}

function applyQuery(resource, rows, params = {}) {
  const { page = 1, perPage = 10, search = "", sort, filters = {} } = params;
  let list = rows;

  if (search) {
    const q = search.toLowerCase();
    const keys = searchable[resource] || ["name"];
    list = list.filter((r) => keys.some((k) => String(r[k] ?? "").toLowerCase().includes(q)));
  }

  Object.entries(filters).forEach(([key, value]) => {
    if (value === "" || value == null || value === "all") return;
    if (key === "from" || key === "to") {
      const field = dateField[resource] || "created_at";
      const bound = new Date(value);
      if (key === "from") bound.setHours(0, 0, 0, 0);
      else bound.setHours(23, 59, 59, 999);
      list = list.filter((r) => (key === "from" ? new Date(r[field]) >= bound : new Date(r[field]) <= bound));
      return;
    }
    list = list.filter((r) => String(r[key]) === String(value));
  });

  const s = sort?.key ? sort : defaultSort[resource] || { key: "created_at", dir: "desc" };
  list = [...list].sort((a, b) => {
    const av = a[s.key];
    const bv = b[s.key];
    if (av == null && bv == null) return 0;
    if (av == null) return 1;
    if (bv == null) return -1;
    const cmp = typeof av === "number" && typeof bv === "number" ? av - bv : String(av).localeCompare(String(bv), undefined, { numeric: true });
    return s.dir === "desc" ? -cmp : cmp;
  });

  const total = list.length;
  const size = Math.max(1, Number(perPage) || 10);
  const from = (Math.max(1, page) - 1) * size;
  return { data: clone(list.slice(from, from + size)), total, page: Number(page) || 1, perPage: size };
}

function sanitizeUser(u, db) {
  return enrichers.users(u, db);
}

function authUser(db) {
  const token = tokenStore.get();
  const id = Number(token?.split(".")[1]);
  return db.users.find((u) => u.id === id) || db.users[0];
}

const bucketKey = (d, mode) => {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  if (mode === "month") return `${y}-${m}`;
  if (mode === "hour") return `${y}-${m}-${day}T${String(d.getHours()).padStart(2, "0")}`;
  return `${y}-${m}-${day}`;
};

function buildSeries(orders, start, end, mode = "day") {
  const buckets = new Map();
  const cursor = new Date(start);
  if (mode === "month") cursor.setDate(1);
  while (cursor <= end) {
    const key = bucketKey(cursor, mode);
    if (!buckets.has(key)) buckets.set(key, { date: key, revenue: 0, orders: 0, cogs: 0 });
    if (mode === "month") cursor.setMonth(cursor.getMonth() + 1);
    else if (mode === "hour") cursor.setHours(cursor.getHours() + 1);
    else cursor.setDate(cursor.getDate() + 1);
  }
  orders.forEach((o) => {
    const b = buckets.get(bucketKey(new Date(o.created_at), mode));
    if (!b) return;
    b.revenue = round2(b.revenue + o.total);
    b.orders += 1;
    b.cogs = round2(b.cogs + o.items.reduce((s, i) => s + i.qty * (i.cost ?? 0), 0));
  });
  return [...buckets.values()].map((b) => ({ ...b, profit: round2(b.revenue - b.cogs) }));
}

function addMovement(db, { product_id, type, qty, reason, reference, user_id }) {
  db.stock_movements.unshift({ id: nextId(db.stock_movements), product_id, type, qty, reason, reference, user_id, created_at: new Date().toISOString() });
}

function maybeNotifyLowStock(db, product) {
  const status = stockStatus(product);
  if (status === "in_stock") return;
  const title = status === "out_of_stock" ? `Out of stock: ${product.name}` : `Low stock: ${product.name}`;
  if (db.notifications.some((n) => n.title === title && !n.read)) return;
  db.notifications.unshift({
    id: nextId(db.notifications),
    type: status === "out_of_stock" ? "danger" : "warning",
    title,
    message: status === "out_of_stock" ? "Stock reached 0. Consider creating a purchase order." : `Only ${product.stock} units left (reorder at ${product.reorder_level}).`,
    read: false,
    created_at: new Date().toISOString(),
    link: "/inventory",
  });
}

const mockApi = {
  /* ---- auth ---- */
  async login({ email, password }) {
    await latency();
    const db = loadDb();
    const user = db.users.find((u) => u.email.toLowerCase() === String(email).toLowerCase());
    if (!user || user.password !== password) throw new ApiError(401, "Invalid credentials");
    if (user.status !== "active") throw new ApiError(403, "Account inactive");
    const token = `mock.${user.id}.${Date.now()}`;
    tokenStore.set(token);
    user.last_active_at = new Date().toISOString();
    saveDb();
    return { token, user: this._profile(user, db) };
  },
  async me() {
    await sleep(80);
    requireAuth();
    const db = loadDb();
    const user = authUser(db);
    return this._profile(user, db);
  },
  async logout() {
    tokenStore.clear();
    return true;
  },
  _profile(user, db) {
    const role = db.roles.find((r) => r.id === user.role_id);
    return { ...sanitizeUser(user, db), role: role ? { id: role.id, name: role.name, slug: role.slug } : null, permissions: role?.permissions ?? [] };
  },
  async updateProfile(payload = {}) {
    await latency();
    requireAuth();
    const db = loadDb();
    const user = authUser(db);
    if (typeof payload.name === "string" && payload.name.trim()) user.name = payload.name.trim();
    if (payload.phone !== undefined) user.phone = payload.phone;
    if (payload.avatar !== undefined) user.avatar = payload.avatar || null;
    user.updated_at = new Date().toISOString();
    saveDb();
    return this._profile(user, db);
  },
  async forgotPassword({ email }) {
    await latency();
    const db = loadDb();
    if (!db.users.some((u) => u.email.toLowerCase() === String(email).toLowerCase())) throw new ApiError(422, "Validation failed", { email: "unknown" });
    return true;
  },
  async resetPassword({ email, password }) {
    await latency();
    const db = loadDb();
    const user = db.users.find((u) => u.email.toLowerCase() === String(email).toLowerCase());
    if (!user) throw new ApiError(422, "Validation failed", { email: "unknown" });
    user.password = password;
    saveDb();
    return true;
  },
  async getPreferences() {
    return {};
  },
  async updatePreference() {
    return true;
  },
  async resetPreference() {
    return true;
  },
  async changePassword({ current_password, new_password }) {
    await latency();
    requireAuth();
    const db = loadDb();
    const user = authUser(db);
    if (user.password !== current_password) throw new ApiError(422, "Validation failed", { current_password: "incorrect" });
    user.password = new_password;
    saveDb();
    return true;
  },

  /* ---- generic CRUD ---- */
  async list(resource, params) {
    await latency();
    requireAuth();
    const db = loadDb();
    if (!db[resource]) throw new ApiError(404, "Not found");
    const rows = db[resource].map((r) => enrich(resource, r, db));
    return applyQuery(resource, rows, params);
  },
  async get(resource, id) {
    await latency();
    requireAuth();
    const db = loadDb();
    const row = db[resource]?.find((r) => String(r.id) === String(id));
    if (!row) throw new ApiError(404, "Not found");
    return clone(enrich(resource, row, db));
  },
  async create(resource, payload) {
    await latency();
    requireAuth();
    const db = loadDb();
    if (!db[resource]) throw new ApiError(404, "Not found");
    if (resource === "users" && db.users.some((u) => u.email.toLowerCase() === String(payload.email).toLowerCase())) {
      throw new ApiError(422, "Validation failed", { email: "taken" });
    }
    const row = { ...payload, id: nextId(db[resource]), created_at: new Date().toISOString() };
    if (resource === "users") {
      row.password = payload.password || "password";
      row.avatar = payload.avatar || `https://api.dicebear.com/9.x/initials/svg?seed=${encodeURIComponent(row.name)}&backgroundColor=2d4a9e&textColor=ffffff`;
    }
    if (resource === "roles") row.slug = row.slug || row.name.toLowerCase().replace(/[^a-z0-9]+/g, "_");
    if (resource === "products" && !row.image) row.image = `https://picsum.photos/seed/sbs-${row.sku || row.id}/96/96`;
    if (["expenses", "orders", "purchases"].includes(resource)) {
      // Persist the exchange rate in force when the transaction was recorded
      row.currency = row.currency || db.settings.currency || "USD";
      row.exchange_rate = Number(row.exchange_rate) > 0 ? Number(row.exchange_rate) : Number(db.settings.exchange_rate) || 4047;
    }
    db[resource].unshift(row);
    saveDb();
    return clone(enrich(resource, row, db));
  },
  async update(resource, id, payload) {
    await latency();
    requireAuth();
    const db = loadDb();
    const idx = db[resource]?.findIndex((r) => String(r.id) === String(id));
    if (idx == null || idx < 0) throw new ApiError(404, "Not found");
    const current = db[resource][idx];
    const next = { ...current, ...payload, id: current.id, updated_at: new Date().toISOString() };
    if (resource === "users" && !payload.password) next.password = current.password;
    db[resource][idx] = next;
    saveDb();
    return clone(enrich(resource, next, db));
  },
  async remove(resource, id) {
    await latency();
    requireAuth();
    const db = loadDb();
    const row = db[resource]?.find((r) => String(r.id) === String(id));
    if (!row) throw new ApiError(404, "Not found");
    if (resource === "roles" && row.system) throw new ApiError(403, "System roles cannot be deleted");
    if (resource === "users" && row.id === authUser(db).id) throw new ApiError(403, "You cannot delete your own account");
    db[resource] = db[resource].filter((r) => r.id !== row.id);
    saveDb();
    return true;
  },
  async bulkRemove(resource, ids) {
    await latency();
    requireAuth();
    const db = loadDb();
    const set = new Set(ids.map(String));
    const me = authUser(db).id;
    db[resource] = db[resource].filter((r) => !set.has(String(r.id)) || (resource === "roles" && r.system) || (resource === "users" && r.id === me));
    saveDb();
    return true;
  },

  /* ---- dashboard ---- */
  async dashboard({ range = "last30", from, to } = {}) {
    await latency();
    requireAuth();
    const db = loadDb();
    const { start, end, prevStart, prevEnd, mode } = rangeBounds(range, { from, to });
    const valid = db.orders.filter((o) => o.status !== "cancelled");
    const cur = valid.filter((o) => between(o.created_at, start, end));
    const prev = valid.filter((o) => between(o.created_at, prevStart, prevEnd));
    const sum = (list) => round2(list.reduce((s, o) => s + o.total, 0));
    const units = (list) => list.reduce((s, o) => s + o.items.reduce((x, i) => x + i.qty, 0), 0);
    const cogsOf = (list) => list.reduce((s, o) => s + o.items.reduce((x, i) => x + i.qty * (i.cost ?? 0), 0), 0);
    const newCustomers = (s, e) => db.customers.filter((c) => between(c.created_at, s, e)).length;
    const revenue = sum(cur);
    const prevRevenue = sum(prev);
    const grossProfit = round2(revenue - cogsOf(cur));
    const prevGrossProfit = round2(prevRevenue - cogsOf(prev));
    const inventoryValue = round2(db.products.reduce((s, p) => s + p.stock * p.cost_price, 0));
    const lowStockProducts = db.products
      .filter((p) => p.status === "active" && stockStatus(p) !== "in_stock")
      .sort((a, b) => a.stock - b.stock)
      .map((p) => enrich("products", p, db));

    const byCategoryMap = {};
    const byProductMap = {};
    const byPaymentMap = {};
    cur.forEach((o) => {
      byPaymentMap[o.payment_method] = round2((byPaymentMap[o.payment_method] || 0) + o.total);
      o.items.forEach((i) => {
        const p = db.products.find((x) => x.id === i.product_id);
        const cat = nameOf(db.categories, p?.category_id) || "Other";
        byCategoryMap[cat] = round2((byCategoryMap[cat] || 0) + i.qty * i.price);
        if (!byProductMap[i.product_id]) byProductMap[i.product_id] = { id: i.product_id, name: i.name, image: p?.image, qty: 0, revenue: 0 };
        byProductMap[i.product_id].qty += i.qty;
        byProductMap[i.product_id].revenue = round2(byProductMap[i.product_id].revenue + i.qty * i.price);
      });
    });

    return {
      kpis: {
        revenue: { value: revenue, change: pctChange(revenue, prevRevenue) },
        orders: { value: cur.length, change: pctChange(cur.length, prev.length) },
        itemsSold: { value: units(cur), change: pctChange(units(cur), units(prev)) },
        customers: { value: newCustomers(start, end), change: pctChange(newCustomers(start, end), newCustomers(prevStart, prevEnd)) },
        avgOrder: { value: cur.length ? round2(revenue / cur.length) : 0, change: pctChange(cur.length ? revenue / cur.length : 0, prev.length ? prevRevenue / prev.length : 0) },
        inventoryValue: { value: inventoryValue, change: null },
        lowStock: { value: lowStockProducts.length, change: null },
        grossProfit: { value: grossProfit, change: pctChange(grossProfit, prevGrossProfit) },
      },
      series: buildSeries(cur, start, end, mode),
      byCategory: Object.entries(byCategoryMap).map(([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value),
      byPayment: Object.entries(byPaymentMap).map(([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value),
      topProducts: Object.values(byProductMap).sort((a, b) => b.revenue - a.revenue).slice(0, 5),
      recentOrders: [...db.orders].sort((a, b) => new Date(b.created_at) - new Date(a.created_at)).slice(0, 6).map((o) => enrich("orders", o, db)),
      lowStockProducts: lowStockProducts.slice(0, 6),
    };
  },

  /* ---- reports ---- */
  async reports({ range = "last30", from, to } = {}) {
    await latency();
    requireAuth();
    const db = loadDb();
    const { start, end, mode } = rangeBounds(range, { from, to });
    const cur = db.orders.filter((o) => o.status !== "cancelled" && between(o.created_at, start, end));
    const revenue = round2(cur.reduce((s, o) => s + o.total, 0));
    const cogs = round2(cur.reduce((s, o) => s + o.items.reduce((x, i) => x + i.qty * (i.cost ?? 0), 0), 0));
    const expensesList = db.expenses.filter((e) => e.status !== "rejected" && between(e.date, start, end));
    const expensesTotal = round2(expensesList.reduce((s, e) => s + e.amount, 0));
    const series = buildSeries(cur, start, end, mode);

    const productMap = {};
    const customerMap = {};
    cur.forEach((o) => {
      if (o.customer_id) {
        if (!customerMap[o.customer_id]) customerMap[o.customer_id] = { id: o.customer_id, name: nameOf(db.customers, o.customer_id), orders: 0, revenue: 0 };
        customerMap[o.customer_id].orders += 1;
        customerMap[o.customer_id].revenue = round2(customerMap[o.customer_id].revenue + o.total);
      }
      o.items.forEach((i) => {
        if (!productMap[i.product_id]) productMap[i.product_id] = { id: i.product_id, name: i.name, sku: i.sku, qty: 0, revenue: 0, profit: 0 };
        productMap[i.product_id].qty += i.qty;
        productMap[i.product_id].revenue = round2(productMap[i.product_id].revenue + i.qty * i.price);
        productMap[i.product_id].profit = round2(productMap[i.product_id].profit + i.qty * (i.price - (i.cost ?? 0)));
      });
    });
    const expByCat = {};
    expensesList.forEach((e) => {
      expByCat[e.category] = round2((expByCat[e.category] || 0) + e.amount);
    });
    const stockByCat = {};
    db.products.forEach((p) => {
      const cat = nameOf(db.categories, p.category_id) || "Other";
      if (!stockByCat[cat]) stockByCat[cat] = { name: cat, value: 0, units: 0 };
      stockByCat[cat].value = round2(stockByCat[cat].value + p.stock * p.cost_price);
      stockByCat[cat].units += p.stock;
    });

    return {
      sales: {
        revenue,
        orders: cur.length,
        unitsSold: cur.reduce((s, o) => s + o.items.reduce((x, i) => x + i.qty, 0), 0),
        avgOrder: cur.length ? round2(revenue / cur.length) : 0,
        series,
        topProducts: Object.values(productMap).sort((a, b) => b.revenue - a.revenue).slice(0, 10),
        topCustomers: Object.values(customerMap).sort((a, b) => b.revenue - a.revenue).slice(0, 5),
      },
      profit: {
        revenue,
        cogs,
        grossProfit: round2(revenue - cogs),
        expenses: expensesTotal,
        netProfit: round2(revenue - cogs - expensesTotal),
        margin: revenue ? round2(((revenue - cogs) / revenue) * 100) : 0,
        series,
      },
      inventory: {
        stockValue: round2(db.products.reduce((s, p) => s + p.stock * p.cost_price, 0)),
        retailValue: round2(db.products.reduce((s, p) => s + p.stock * p.selling_price, 0)),
        totalUnits: db.products.reduce((s, p) => s + p.stock, 0),
        lowStock: db.products.filter((p) => stockStatus(p) === "low_stock").length,
        outOfStock: db.products.filter((p) => stockStatus(p) === "out_of_stock").length,
        byCategory: Object.values(stockByCat).sort((a, b) => b.value - a.value),
      },
      expenses: {
        total: expensesTotal,
        count: expensesList.length,
        byCategory: Object.entries(expByCat).map(([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value),
        list: expensesList.map((e) => enrich("expenses", e, db)).sort((a, b) => new Date(b.date) - new Date(a.date)).slice(0, 10),
      },
    };
  },

  /* ---- AI insights (rule-based, computed from live data) ---- */
  async insights() {
    await sleep(500);
    requireAuth();
    const db = loadDb();
    const { start, end, prevStart, prevEnd } = rangeBounds("last30");
    const valid = db.orders.filter((o) => o.status !== "cancelled");
    const cur = valid.filter((o) => between(o.created_at, start, end));
    const prev = valid.filter((o) => between(o.created_at, prevStart, prevEnd));
    const list = [];

    // Stock-out predictions
    const sold = {};
    cur.forEach((o) => o.items.forEach((i) => (sold[i.product_id] = (sold[i.product_id] || 0) + i.qty)));
    db.products
      .filter((p) => p.status === "active" && sold[p.id])
      .map((p) => ({ p, rate: sold[p.id] / 30, days: p.stock / (sold[p.id] / 30) }))
      .filter((x) => x.days < 14)
      .sort((a, b) => a.days - b.days)
      .slice(0, 3)
      .forEach((x) =>
        list.push({
          id: `stock-${x.p.id}`,
          type: "stock",
          impact: x.days < 5 ? "high" : "medium",
          confidence: Math.min(95, Math.round(70 + sold[x.p.id])),
          key: "stockout",
          params: { product: x.p.name, days: Math.max(0, Math.round(x.days)), rate: x.rate.toFixed(1), stock: x.p.stock, qty: Math.ceil(x.rate * 30) },
          link: "/purchases",
        })
      );

    // Revenue trend
    const rev = (l) => l.reduce((s, o) => s + o.total, 0);
    const change = pctChange(rev(cur), rev(prev));
    if (prev.length && Math.abs(change) >= 3) {
      list.push({
        id: "trend",
        type: "sales",
        impact: Math.abs(change) > 15 ? "high" : "medium",
        confidence: 88,
        key: change >= 0 ? "trendUp" : "trendDown",
        params: { pct: `${Math.abs(change).toFixed(1)}%`, days: 30 },
        link: "/reports",
      });
    }

    // Best category
    const catRev = {};
    cur.forEach((o) => o.items.forEach((i) => {
      const p = db.products.find((x) => x.id === i.product_id);
      const c = nameOf(db.categories, p?.category_id) || "Other";
      catRev[c] = (catRev[c] || 0) + i.qty * i.price;
    }));
    const total = Object.values(catRev).reduce((s, v) => s + v, 0);
    const best = Object.entries(catRev).sort((a, b) => b[1] - a[1])[0];
    if (best) list.push({ id: "best-cat", type: "growth", impact: "medium", confidence: 92, key: "bestCategory", params: { category: best[0], amount: round2(best[1]), pct: `${((best[1] / total) * 100).toFixed(0)}%` }, link: "/reports", currency: ["amount"] });

    // Slow movers
    const slow = db.products.filter((p) => p.status === "active" && !sold[p.id]);
    if (slow.length) list.push({ id: "slow", type: "stock", impact: "low", confidence: 80, key: "slowMovers", params: { count: slow.length, examples: slow.slice(0, 3).map((p) => p.name).join(", ") }, link: "/products" });

    // At-risk customers
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - 30);
    const atRisk = db.customers.filter((c) => {
      const os = valid.filter((o) => o.customer_id === c.id);
      if (!os.length) return false;
      return new Date(os.map((o) => o.created_at).sort().at(-1)) < cutoff;
    });
    if (atRisk.length) list.push({ id: "at-risk", type: "customers", impact: "medium", confidence: 76, key: "atRisk", params: { count: atRisk.length, examples: atRisk.slice(0, 3).map((c) => c.name).join(", ") }, link: "/customers" });

    // Expenses
    const exp = {};
    db.expenses.filter((e) => between(e.date, start, end)).forEach((e) => (exp[e.category] = (exp[e.category] || 0) + e.amount));
    const expTotal = Object.values(exp).reduce((s, v) => s + v, 0);
    const topExp = Object.entries(exp).sort((a, b) => b[1] - a[1])[0];
    if (topExp) list.push({ id: "exp", type: "finance", impact: "low", confidence: 90, key: "expenses", params: { category: topExp[0], amount: round2(topExp[1]), pct: `${((topExp[1] / expTotal) * 100).toFixed(0)}%` }, link: "/expenses", categoryParam: "category", currency: ["amount"] });

    // Margin
    const revenueCur = rev(cur);
    const cogs = cur.reduce((s, o) => s + o.items.reduce((x, i) => x + i.qty * (i.cost ?? 0), 0), 0);
    if (revenueCur) list.push({ id: "margin", type: "finance", impact: "medium", confidence: 85, key: "margin", params: { pct: `${(((revenueCur - cogs) / revenueCur) * 100).toFixed(1)}%` }, link: "/reports" });

    // Peak hour
    const hours = {};
    cur.forEach((o) => {
      const h = new Date(o.created_at).getHours();
      hours[h] = (hours[h] || 0) + 1;
    });
    const peak = Object.entries(hours).sort((a, b) => b[1] - a[1])[0];
    if (peak) list.push({ id: "peak", type: "sales", impact: "low", confidence: 82, key: "peakHour", params: { hour: `${String(peak[0]).padStart(2, "0")}:00` }, link: "/orders" });

    const forecast = [];
    const daily = buildSeries(cur, start, end, "day");
    const avg = daily.reduce((s, d) => s + d.revenue, 0) / Math.max(1, daily.length);
    const last7 = daily.slice(-7).reduce((s, d) => s + d.revenue, 0) / 7;
    const slope = (last7 - avg) / 7;
    for (let i = 1; i <= 7; i++) {
      const d = new Date();
      d.setDate(d.getDate() + i);
      forecast.push({ date: d.toISOString().slice(0, 10), value: round2(Math.max(0, avg + slope * i)) });
    }
    return { generated_at: new Date().toISOString(), insights: list, forecast };
  },

  async analyze(kind, payload = {}) {
    return this.insights();
  },

  /* ---- POS ---- */
  async checkout({ items, customer_id, discount_percent = 0, payment_method = "cash", received, currency, exchange_rate }) {
    await latency();
    requireAuth();
    const db = loadDb();
    const me = authUser(db);
    if (!items?.length) throw new ApiError(422, "Cart is empty");
    const lines = items.map((it) => {
      const p = db.products.find((x) => x.id === it.product_id);
      if (!p) throw new ApiError(404, "Product not found");
      if (p.stock < it.qty) throw new ApiError(422, "Insufficient stock", { [p.id]: "stock" });
      return { product_id: p.id, name: p.name, sku: p.sku, qty: it.qty, price: p.selling_price, cost: p.cost_price };
    });
    const subtotal = round2(lines.reduce((s, l) => s + l.qty * l.price, 0));
    const discount = round2(subtotal * (Number(discount_percent) / 100));
    const tax = round2((subtotal - discount) * (Number(db.settings.tax_rate) / 100));
    const total = round2(subtotal - discount + tax);
    const id = nextId(db.orders);
    const order = {
      id,
      number: `ORD-${String(10000 + id)}`,
      customer_id: customer_id || null,
      user_id: me.id,
      branch_id: me.branch_id,
      items: lines,
      subtotal,
      discount,
      tax,
      total,
      payment_method,
      payment_status: "paid",
      status: "completed",
      received: received ?? total,
      // 4-decimal precision keeps riel-denominated change exact when displayed with the stored rate
      change: Math.round(Math.max(0, (received ?? total) - total) * 10000) / 10000,
      // Snapshot of the currency context at the time of sale — historical totals never change
      currency: currency || db.settings.currency || "USD",
      exchange_rate: Number(exchange_rate) > 0 ? Number(exchange_rate) : Number(db.settings.exchange_rate) || 4047,
      created_at: new Date().toISOString(),
    };
    db.orders.push(order);
    lines.forEach((l) => {
      const p = db.products.find((x) => x.id === l.product_id);
      p.stock -= l.qty;
      addMovement(db, { product_id: p.id, type: "out", qty: l.qty, reason: "Sale", reference: order.number, user_id: me.id });
      maybeNotifyLowStock(db, p);
    });
    saveDb();
    return clone(enrich("orders", order, db));
  },

  async updateOrder(id, { status, payment_status }) {
    await latency();
    requireAuth();
    const db = loadDb();
    const order = db.orders.find((o) => String(o.id) === String(id));
    if (!order) throw new ApiError(404, "Not found");
    if (status === "cancelled" && order.status !== "cancelled") {
      order.items.forEach((l) => {
        const p = db.products.find((x) => x.id === l.product_id);
        if (p) {
          p.stock += l.qty;
          addMovement(db, { product_id: p.id, type: "in", qty: l.qty, reason: "Order cancelled", reference: order.number, user_id: authUser(db).id });
        }
      });
      order.payment_status = order.payment_status === "paid" ? "refunded" : order.payment_status;
    }
    if (status) order.status = status;
    if (payment_status) order.payment_status = payment_status;
    order.updated_at = new Date().toISOString();
    saveDb();
    return clone(enrich("orders", order, db));
  },

  async createPurchase(payload) {
    await latency();
    requireAuth();
    const db = loadDb();
    const items = (payload.items || []).map((it) => {
      const p = db.products.find((x) => x.id === Number(it.product_id));
      if (!p) throw new ApiError(422, "Invalid product");
      return { product_id: p.id, name: p.name, sku: p.sku, qty: Number(it.qty), cost: Number(it.cost) };
    });
    if (!items.length) throw new ApiError(422, "No items");
    const id = nextId(db.purchases);
    const purchase = {
      id,
      number: `PO-${String(5000 + id)}`,
      supplier_id: Number(payload.supplier_id),
      items,
      total: round2(items.reduce((s, i) => s + i.qty * i.cost, 0)),
      status: "ordered",
      payment_status: payload.payment_status || "unpaid",
      note: payload.note || "",
      currency: payload.currency || db.settings.currency || "USD",
      exchange_rate: Number(payload.exchange_rate) > 0 ? Number(payload.exchange_rate) : Number(db.settings.exchange_rate) || 4047,
      created_at: new Date().toISOString(),
      expected_at: payload.expected_at ? new Date(payload.expected_at).toISOString() : null,
      received_at: null,
    };
    db.purchases.unshift(purchase);
    saveDb();
    return clone(enrich("purchases", purchase, db));
  },

  async receivePurchase(id) {
    await latency();
    requireAuth();
    const db = loadDb();
    const purchase = db.purchases.find((p) => String(p.id) === String(id));
    if (!purchase) throw new ApiError(404, "Not found");
    if (purchase.status === "received") return clone(enrich("purchases", purchase, db));
    purchase.status = "received";
    purchase.received_at = new Date().toISOString();
    purchase.items.forEach((l) => {
      const p = db.products.find((x) => x.id === l.product_id);
      if (p) {
        p.stock += l.qty;
        addMovement(db, { product_id: p.id, type: "in", qty: l.qty, reason: "Purchase received", reference: purchase.number, user_id: authUser(db).id });
      }
    });
    saveDb();
    return clone(enrich("purchases", purchase, db));
  },

  async adjustStock({ product_id, type, qty, reason }) {
    await latency();
    requireAuth();
    const db = loadDb();
    const p = db.products.find((x) => String(x.id) === String(product_id));
    if (!p) throw new ApiError(404, "Not found");
    const delta = type === "out" ? -Math.abs(Number(qty)) : Math.abs(Number(qty));
    if (p.stock + delta < 0) throw new ApiError(422, "Insufficient stock");
    p.stock += delta;
    addMovement(db, { product_id: p.id, type: "adjustment", qty: delta, reason: reason || "Manual adjustment", reference: `ADJ-${nextId(db.stock_movements)}`, user_id: authUser(db).id });
    maybeNotifyLowStock(db, p);
    saveDb();
    return clone(enrich("products", p, db));
  },

  /* ---- settings & notifications ---- */
  async getPublicSettings() {
    await sleep(60);
    const s = loadDb().settings;
    // Branding/currency only — never expose anything sensitive before login
    return clone({ business_name: s.business_name, business_subtitle: s.business_subtitle, business_logo: s.business_logo, currency: s.currency, exchange_rate: s.exchange_rate, tax_rate: s.tax_rate });
  },
  async getSettings() {
    await sleep(120);
    requireAuth();
    return clone(loadDb().settings);
  },
  async updateSettings(payload) {
    await latency();
    requireAuth();
    const db = loadDb();
    db.settings = { ...db.settings, ...payload };
    saveDb();
    return clone(db.settings);
  },
  async notifications() {
    await sleep(120);
    requireAuth();
    return clone(loadDb().notifications);
  },
  async markNotificationsRead(ids) {
    await sleep(100);
    requireAuth();
    const db = loadDb();
    db.notifications.forEach((n) => {
      if (!ids || ids.includes(n.id)) n.read = true;
    });
    saveDb();
    return clone(db.notifications);
  },
  async globalSearch(q) {
    await sleep(150);
    requireAuth();
    const db = loadDb();
    const s = q.toLowerCase();
    return {
      products: db.products.filter((p) => p.name.toLowerCase().includes(s) || p.sku.toLowerCase().includes(s)).slice(0, 5),
      customers: db.customers.filter((c) => c.name.toLowerCase().includes(s) || c.email.toLowerCase().includes(s)).slice(0, 4),
      orders: db.orders.filter((o) => o.number.toLowerCase().includes(s)).slice(0, 4),
    };
  },
  async resetDemo() {
    await sleep(300);
    resetDb();
    return true;
  },
};

/* ------------------------------------------------------------------ */
/* Real HTTP implementation — Laravel 10 REST API (/api/v1), same interface */
/* ------------------------------------------------------------------ */
const listParams = (params = {}) => ({
  page: params.page,
  per_page: params.perPage,
  search: params.search,
  sort_by: params.sort?.key,
  sort_dir: params.sort?.dir,
  ...(params.filters || {}),
});
const paginated = (res, params = {}) => {
  const data = Array.isArray(res) ? res : res?.data || [];
  const meta = res?.meta || {};
  return { data, total: meta.total ?? data.length, page: meta.current_page ?? params.page ?? 1, perPage: meta.per_page ?? params.perPage ?? data.length };
};
const RESOURCE_PATHS = { stock_movements: "inventory/movements" };
const pathFor = (resource) => `/${RESOURCE_PATHS[resource] || resource.replace(/_/g, "-")}`;

const httpApi = {
  async login(credentials) {
    const data = await http.post("/auth/login", credentials);
    if (data?.token) tokenStore.set(data.token);
    return data;
  },
  me: () => http.get("/auth/me"),
  async logout() {
    try {
      await http.post("/auth/logout");
    } finally {
      tokenStore.clear();
    }
    return true;
  },
  register: (payload) => http.post("/auth/register", payload),
  forgotPassword: (payload) => http.post("/auth/forgot-password", payload),
  resetPassword: (payload) => http.post("/auth/reset-password", payload),
  changePassword: (payload) => http.post("/auth/change-password", payload),
  updateProfile: (payload) => http.put("/auth/profile", payload),

  list: async (resource, params = {}) => paginated(await http.get(pathFor(resource), listParams(params)), params),
  get: (resource, id) => http.get(`${pathFor(resource)}/${id}`),
  create: (resource, payload) => http.post(pathFor(resource), payload),
  update: (resource, id, payload) => http.put(`${pathFor(resource)}/${id}`, payload),
  remove: (resource, id) => http.delete(`${pathFor(resource)}/${id}`),
  bulkRemove: (resource, ids) => http.post(`${pathFor(resource)}/bulk-delete`, { ids }),

  dashboard: (params) => http.get("/dashboard", params),
  reports: (params) => http.get("/reports/overview", params),
  insights: () => http.get("/ai/insights"),
  aiChat: (payload) => http.post("/ai/chat", payload),
  analyze: (kind, payload = {}) => http.post(`/ai/analyze/${kind}`, payload),

  checkout: (payload) => http.post("/pos/checkout", payload),
  updateOrder: (id, payload) => http.patch(`/orders/${id}`, payload),
  createPurchase: (payload) => http.post("/purchases", payload),
  receivePurchase: (id) => http.post(`/purchases/${id}/receive`),
  adjustStock: (payload) => http.post("/inventory/adjust", payload),

  getPublicSettings: () => http.get("/settings/public"),
  getSettings: () => http.get("/settings"),
  updateSettings: (payload) => http.put("/settings", payload),
  getPreferences: () => http.get("/preferences"),
  updatePreference: (key, value) => http.put(`/preferences/${key}`, { value }),
  resetPreference: (key) => http.delete(`/preferences/${key}`),
  notifications: () => http.get("/notifications"),
  markNotificationsRead: (ids) => http.post("/notifications/read", { ids }),
  globalSearch: (q) => http.get("/search", { q }),
  resetDemo: async () => false,
};

export const api = USE_MOCK ? mockApi : httpApi;
