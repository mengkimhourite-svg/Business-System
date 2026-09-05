import { ROLE_PERMISSIONS } from "../config/permissions.js";

/* ------------------------------------------------------------------ */
/* Deterministic pseudo-random generator so demo data is stable        */
/* ------------------------------------------------------------------ */
function mulberry32(a) {
  return function () {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const DB_KEY = "sbs.mockdb.v5";
const SEED_RATE = 4047; // KHR per USD at seed time
const MAX_AGE_MS = 1000 * 60 * 60 * 20; // regenerate daily so date ranges stay meaningful

const img = (seed) => `https://picsum.photos/seed/sbs-${seed}/96/96`;
const avatar = (name) => `https://api.dicebear.com/9.x/initials/svg?seed=${encodeURIComponent(name)}&backgroundColor=2d4a9e&textColor=ffffff`;

function generate() {
  const rnd = mulberry32(20240517);
  const rand = (min, max) => Math.floor(rnd() * (max - min + 1)) + min;
  const pick = (arr) => arr[Math.floor(rnd() * arr.length)];
  const round2 = (n) => Math.round(n * 100) / 100;
  const at = (daysAgo, hour, minute) => {
    const d = new Date();
    d.setDate(d.getDate() - daysAgo);
    d.setHours(hour ?? rand(8, 20), minute ?? rand(0, 59), rand(0, 59), 0);
    // Never generate "future" timestamps for today's records
    if (daysAgo === 0 && d.getTime() > Date.now()) d.setTime(Date.now() - rand(5, 240) * 60000);
    return d.toISOString();
  };

  /* ---------- Master data ---------- */
  const categoryNames = ["Beverages", "Snacks", "Dairy", "Bakery", "Electronics", "Household", "Personal Care", "Stationery"];
  const categories = categoryNames.map((name, i) => ({
    id: i + 1,
    name,
    description: `${name} products`,
    status: "active",
    created_at: at(120 - i * 3),
  }));
  const catId = (name) => categories.find((c) => c.name === name).id;

  const suppliers = [
    ["Cambodia Beverage Co.", "Sok Dara", "sales@cambev.com.kh", "+855 23 456 789", "St. 271, Phnom Penh"],
    ["Phnom Penh Fresh Foods", "Chan Sophea", "orders@ppfresh.com", "+855 12 890 123", "Toul Kork, Phnom Penh"],
    ["Mekong Electronics Ltd.", "Kim Vanna", "b2b@mekongelec.com", "+855 17 222 333", "Russian Blvd, Phnom Penh"],
    ["Angkor Household Supplies", "Heng Piseth", "contact@angkorhs.com", "+855 92 444 555", "Siem Reap"],
    ["Khmer Care Distribution", "Ly Sreyneang", "info@khmercare.com", "+855 96 777 888", "Chbar Ampov, Phnom Penh"],
    ["Office Pro Cambodia", "Meas Chantha", "hello@officepro.kh", "+855 11 999 000", "BKK1, Phnom Penh"],
  ].map(([name, contact_name, email, phone, address], i) => ({
    id: i + 1,
    name,
    contact_name,
    email,
    phone,
    address,
    status: i === 5 ? "inactive" : "active",
    created_at: at(110 - i * 5),
  }));

  // name, category, brand, supplierIdx, cost, price, stock, reorder, unit
  const productSeed = [
    ["Coca-Cola 330ml", "Beverages", "Coca-Cola", 1, 0.35, 0.6, 240, 48, "can"],
    ["Angkor Beer 330ml", "Beverages", "Angkor", 1, 0.55, 0.9, 180, 48, "can"],
    ["Vital Water 1.5L", "Beverages", "Vital", 1, 0.25, 0.45, 36, 40, "bottle"],
    ["Lay's Classic 70g", "Snacks", "Lay's", 2, 0.65, 1.0, 95, 30, "pack"],
    ["Oreo Original 133g", "Snacks", "Oreo", 2, 0.7, 1.1, 64, 24, "pack"],
    ["Pringles Original 107g", "Snacks", "Pringles", 2, 1.2, 1.9, 0, 12, "can"],
    ["Anchor Full Cream Milk 1L", "Dairy", "Anchor", 2, 1.6, 2.3, 42, 24, "carton"],
    ["Dutch Lady Yogurt 4pk", "Dairy", "Dutch Lady", 2, 1.4, 2.1, 18, 20, "pack"],
    ["President Butter 200g", "Dairy", "President", 2, 2.3, 3.2, 26, 10, "pcs"],
    ["French Baguette", "Bakery", "House Bakery", 2, 0.3, 0.6, 40, 20, "pcs"],
    ["Butter Croissant", "Bakery", "House Bakery", 2, 0.45, 0.95, 22, 15, "pcs"],
    ["Gardenia Sandwich Bread 400g", "Bakery", "Gardenia", 2, 0.9, 1.5, 30, 12, "loaf"],
    ["Samsung Galaxy A15 128GB", "Electronics", "Samsung", 3, 145, 189, 9, 3, "pcs"],
    ["Anker 20W USB-C Charger", "Electronics", "Anker", 3, 9.5, 15.9, 34, 10, "pcs"],
    ["JBL Go 3 Speaker", "Electronics", "JBL", 3, 28, 39.9, 4, 5, "pcs"],
    ["Xiaomi Power Bank 10000mAh", "Electronics", "Xiaomi", 3, 12, 18.9, 21, 6, "pcs"],
    ["Sunlight Dish Soap 750ml", "Household", "Unilever", 4, 1.1, 1.8, 58, 20, "bottle"],
    ["Comfort Fabric Softener 1L", "Household", "Unilever", 4, 2.1, 3.2, 27, 15, "bottle"],
    ["Scott Paper Towels 2pk", "Household", "Scott", 4, 1.6, 2.5, 12, 15, "pack"],
    ["Colgate Toothpaste 150g", "Personal Care", "Colgate", 5, 1.2, 1.95, 76, 24, "pcs"],
    ["Dove Body Wash 500ml", "Personal Care", "Unilever", 5, 3.1, 4.9, 33, 12, "bottle"],
    ["Head & Shoulders 330ml", "Personal Care", "P&G", 5, 3.4, 5.2, 8, 10, "bottle"],
    ["Pilot G2 Gel Pen Black", "Stationery", "Pilot", 6, 0.9, 1.5, 150, 40, "pcs"],
    ["Double A Copy Paper A4", "Stationery", "Double A", 6, 3.6, 5.2, 45, 20, "ream"],
  ];

  const brandNames = [...new Set(productSeed.map((p) => p[2]))];
  const brands = brandNames.map((name, i) => ({
    id: i + 1,
    name,
    description: `${name} official products`,
    website: `https://www.${name.toLowerCase().replace(/[^a-z0-9]/g, "")}.com`,
    logo: img(`brand-${i + 1}`),
    status: "active",
    created_at: at(100 - i * 2),
  }));
  const brandId = (name) => brands.find((b) => b.name === name).id;

  const products = productSeed.map((p, i) => {
    const [name, cat, brand, sup, cost, price, stock, reorder, unit] = p;
    const sku = `SKU-${String(1001 + i)}`;
    return {
      id: i + 1,
      name,
      sku,
      barcode: `885${String(1000000000 + i * 7919).slice(0, 10)}`,
      category_id: catId(cat),
      brand_id: brandId(brand),
      supplier_id: sup,
      cost_price: cost,
      selling_price: price,
      stock,
      reorder_level: reorder,
      unit,
      description: `${name} — ${cat.toLowerCase()} item supplied by ${suppliers[sup - 1].name}.`,
      image: img(sku),
      status: i === 5 ? "inactive" : "active",
      created_at: at(90 - i * 2),
    };
  });

  const customerSeed = [
    ["Sok Dara", "retail"],
    ["Chan Sophea", "wholesale"],
    ["Kim Vanna", "retail"],
    ["Ly Sreyneang", "retail"],
    ["Heng Piseth", "wholesale"],
    ["Meas Chantha", "retail"],
    ["Pich Bopha", "retail"],
    ["Ouk Rithy", "wholesale"],
    ["Sam Sokha", "retail"],
    ["Nguon Malis", "retail"],
    ["Keo Sovann", "retail"],
    ["Vong Chenda", "wholesale"],
    ["Chea Ratana", "retail"],
    ["Ros Sreypov", "retail"],
  ];
  const customers = customerSeed.map(([name, type], i) => ({
    id: i + 1,
    name,
    email: `${name.toLowerCase().replace(/\s+/g, ".")}@example.com`,
    phone: `+855 ${rand(10, 99)} ${rand(100, 999)} ${rand(100, 999)}`,
    address: pick(["Phnom Penh", "Siem Reap", "Battambang", "Kampong Cham", "Sihanoukville"]),
    type,
    status: i === 13 ? "inactive" : "active",
    created_at: at(rand(5, 120)),
  }));

  const branches = [
    { id: 1, name: "Phnom Penh Main", code: "PP-01", address: "St. 63, BKK1, Phnom Penh", phone: "+855 23 111 222", manager: "Vanna Ly", status: "active", created_at: at(365) },
    { id: 2, name: "Siem Reap", code: "SR-01", address: "Sivatha Blvd, Siem Reap", phone: "+855 63 333 444", manager: "Malis Nguon", status: "active", created_at: at(240) },
    { id: 3, name: "Battambang", code: "BB-01", address: "Road 3, Battambang", phone: "+855 53 555 666", manager: "—", status: "inactive", created_at: at(120) },
  ];

  const roles = [
    { id: 1, name: "Super Admin", slug: "super_admin", description: "Full access to all features.", system: true },
    { id: 2, name: "Admin", slug: "admin", description: "Administrative access to the whole system.", system: true },
    { id: 3, name: "Manager", slug: "manager", description: "Manages products, sales, purchases and reports.", system: true },
    { id: 4, name: "Accountant", slug: "accountant", description: "Finance, expenses and reports.", system: false },
    { id: 5, name: "Sales", slug: "sales", description: "POS, orders and customers.", system: false },
    { id: 6, name: "Inventory", slug: "inventory", description: "Products, purchases and stock control.", system: false },
  ].map((r) => ({ ...r, permissions: [...ROLE_PERMISSIONS[r.slug]], created_at: at(300) }));

  const userSeed = [
    ["Sokha Chan", "sokha@sbs.com", 1, 1],
    ["Dara Kim", "dara@sbs.com", 2, 1],
    ["Vanna Ly", "vanna@sbs.com", 3, 1],
    ["Sreyneang Heng", "sreyneang@sbs.com", 4, 1],
    ["Piseth Meas", "piseth@sbs.com", 5, 1],
    ["Bopha Pich", "bopha@sbs.com", 6, 2],
    ["Rithy Ouk", "rithy@sbs.com", 5, 2],
    ["Malis Nguon", "malis@sbs.com", 3, 2],
  ];
  const users = userSeed.map(([name, email, role_id, branch_id], i) => ({
    id: i + 1,
    name,
    email,
    phone: `+855 ${rand(10, 99)} ${rand(100, 999)} ${rand(100, 999)}`,
    role_id,
    branch_id,
    status: i === 7 ? "inactive" : "active",
    avatar: avatar(name),
    password: "password",
    last_active_at: at(i === 0 ? 0 : rand(0, 6), rand(8, 19)),
    created_at: at(200 - i * 10),
  }));

  /* ---------- Transactions ---------- */
  const orders = [];
  const paymentMethods = ["cash", "cash", "cash", "cash", "qr", "qr", "qr", "card", "card", "bank_transfer"];
  const salesUsers = users.filter((u) => [2, 3, 5, 7].includes(u.id));
  let orderSeq = 1;
  for (let day = 60; day >= 0; day--) {
    const base = day > 30 ? rand(3, 6) : rand(4, 8);
    const count = day === 0 ? rand(3, 5) : base + (day % 7 === 0 || day % 7 === 6 ? 2 : 0);
    for (let k = 0; k < count; k++) {
      const hour = pick([9, 10, 11, 11, 12, 12, 12, 13, 14, 15, 17, 18, 18, 19]);
      const itemCount = rand(1, 4);
      const chosen = new Set();
      while (chosen.size < itemCount) chosen.add(pick(products.filter((p) => p.status === "active")).id);
      const items = [...chosen].map((pid) => {
        const p = products[pid - 1];
        const qty = p.category_id === catId("Electronics") ? 1 : rand(1, 5);
        return { product_id: p.id, name: p.name, sku: p.sku, qty, price: p.selling_price, cost: p.cost_price };
      });
      const subtotal = round2(items.reduce((s, it) => s + it.qty * it.price, 0));
      const discount = rnd() < 0.2 ? round2(subtotal * pick([0.05, 0.1])) : 0;
      const tax = round2((subtotal - discount) * 0.1);
      const total = round2(subtotal - discount + tax);
      const roll = rnd();
      const status = roll < 0.86 ? "completed" : roll < 0.94 ? "pending" : "cancelled";
      const user = pick(salesUsers);
      const customer = rnd() < 0.75 ? pick(customers) : null;
      orders.push({
        id: orderSeq,
        number: `ORD-${String(10000 + orderSeq)}`,
        customer_id: customer ? customer.id : null,
        user_id: user.id,
        branch_id: user.branch_id,
        items,
        subtotal,
        discount,
        tax,
        total,
        payment_method: pick(paymentMethods),
        payment_status: status === "completed" ? "paid" : status === "pending" ? (rnd() < 0.5 ? "unpaid" : "partial") : "refunded",
        status,
        currency: "USD",
        exchange_rate: SEED_RATE,
        created_at: at(day, hour),
      });
      orderSeq++;
    }
  }

  const purchases = [];
  for (let i = 0; i < 12; i++) {
    const supplier = suppliers[i % 6];
    const pool = products.filter((p) => p.supplier_id === supplier.id);
    const items = pool.slice(0, rand(2, Math.min(4, pool.length))).map((p) => ({
      product_id: p.id,
      name: p.name,
      sku: p.sku,
      qty: p.category_id === catId("Electronics") ? rand(5, 15) : rand(24, 120),
      cost: p.cost_price,
    }));
    const total = round2(items.reduce((s, it) => s + it.qty * it.cost, 0));
    const daysAgo = 58 - i * 5;
    const status = i < 7 ? "received" : i < 11 ? "ordered" : "cancelled";
    purchases.push({
      id: i + 1,
      number: `PO-${String(5000 + i + 1)}`,
      supplier_id: supplier.id,
      items,
      total,
      status,
      payment_status: status === "received" ? "paid" : status === "ordered" ? "unpaid" : "refunded",
      note: "",
      currency: "USD",
      exchange_rate: SEED_RATE,
      created_at: at(Math.max(daysAgo, 0)),
      expected_at: at(Math.max(daysAgo - 5, -3)),
      received_at: status === "received" ? at(Math.max(daysAgo - 4, 0)) : null,
    });
  }

  const expenseCats = ["rent", "utilities", "salaries", "marketing", "transport", "supplies", "maintenance", "other"];
  const expenseAmounts = { rent: [450, 650], utilities: [60, 180], salaries: [900, 1400], marketing: [40, 220], transport: [15, 80], supplies: [10, 60], maintenance: [30, 160], other: [10, 50] };
  const expenses = [];
  for (let i = 0; i < 22; i++) {
    const category = i < 2 ? "rent" : i < 4 ? "salaries" : pick(expenseCats);
    const [lo, hi] = expenseAmounts[category];
    const daysAgo = i < 2 ? i * 30 + 1 : i < 4 ? (i - 2) * 30 + 2 : rand(0, 59);
    expenses.push({
      id: i + 1,
      reference: `EXP-${String(3000 + i + 1)}`,
      category,
      amount: round2(lo + rnd() * (hi - lo)),
      date: at(daysAgo),
      user_id: pick([1, 2, 3, 4]),
      payment_method: pick(["cash", "bank_transfer", "card"]),
      note: category === "rent" ? "Monthly store rent" : category === "salaries" ? "Monthly payroll" : "",
      status: rnd() < 0.85 ? "approved" : "pending",
      currency: "USD",
      exchange_rate: SEED_RATE,
      created_at: at(daysAgo),
    });
  }

  const stock_movements = [];
  let mvId = 1;
  purchases
    .filter((p) => p.status === "received")
    .forEach((p) =>
      p.items.forEach((it) =>
        stock_movements.push({ id: mvId++, product_id: it.product_id, type: "in", qty: it.qty, reason: "Purchase received", reference: p.number, user_id: 6, created_at: p.received_at })
      )
    );
  orders
    .filter((o) => o.status === "completed")
    .slice(-30)
    .forEach((o) =>
      o.items.forEach((it) => stock_movements.push({ id: mvId++, product_id: it.product_id, type: "out", qty: it.qty, reason: "Sale", reference: o.number, user_id: o.user_id, created_at: o.created_at }))
    );
  [
    [6, "out", 4, "Damaged in storage"],
    [15, "out", 2, "Display unit"],
    [3, "in", 12, "Stock recount"],
    [19, "out", 3, "Expired"],
  ].forEach(([product_id, type, qty, reason], i) =>
    stock_movements.push({ id: mvId++, product_id, type: "adjustment", qty: type === "out" ? -qty : qty, reason, reference: `ADJ-${100 + i}`, user_id: 6, created_at: at(rand(1, 12)) })
  );
  stock_movements.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));

  const notifications = [
    { id: 1, type: "warning", title: "Low stock: JBL Go 3 Speaker", message: "Only 4 units left (reorder at 5).", read: false, created_at: at(0, 9, 12), link: "/inventory" },
    { id: 2, type: "danger", title: "Out of stock: Pringles Original 107g", message: "Stock reached 0. Consider creating a purchase order.", read: false, created_at: at(0, 8, 30), link: "/purchases" },
    { id: 3, type: "success", title: "Purchase PO-5007 received", message: "Stock levels were updated automatically.", read: false, created_at: at(1, 16, 5), link: "/purchases" },
    { id: 4, type: "info", title: "Weekly report ready", message: "Your sales summary for last week is available.", read: true, created_at: at(2, 7, 0), link: "/reports" },
    { id: 5, type: "info", title: "New team member", message: "Rithy Ouk joined the Sales team.", read: true, created_at: at(4, 10, 45), link: "/users" },
  ];

  const settings = {
    business_name: "Angkor Mart",
    business_subtitle: "Smart Business System",
    business_logo: "",
    business_email: "hello@angkormart.com",
    business_phone: "+855 23 900 100",
    business_address: "St. 63, BKK1, Phnom Penh, Cambodia",
    base_currency: "USD",
    currency: "USD",
    exchange_rate: SEED_RATE,
    tax_rate: 10,
    low_stock_threshold: 10,
    receipt_footer: "Thank you for shopping with us!",
    notify_low_stock: true,
    notify_orders: true,
    notify_reports: false,
  };

  return {
    version: DB_KEY,
    generated_at: Date.now(),
    categories,
    brands,
    suppliers,
    products,
    customers,
    branches,
    roles,
    users,
    orders,
    purchases,
    expenses,
    stock_movements,
    notifications,
    settings,
  };
}

/* ------------------------------------------------------------------ */
/* Persistence                                                          */
/* ------------------------------------------------------------------ */
let db = null;

export function loadDb() {
  if (db) return db;
  try {
    const raw = window.localStorage.getItem(DB_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed.version === DB_KEY && Date.now() - parsed.generated_at < MAX_AGE_MS) {
        db = parsed;
        return db;
      }
    }
  } catch {
    /* ignore corrupted storage */
  }
  db = generate();
  saveDb();
  return db;
}

export function saveDb() {
  if (!db) return;
  try {
    window.localStorage.setItem(DB_KEY, JSON.stringify(db));
  } catch {
    /* storage may be full — keep working in memory */
  }
}

export function resetDb() {
  db = generate();
  saveDb();
  return db;
}

export function nextId(table) {
  return table.reduce((m, r) => Math.max(m, Number(r.id) || 0), 0) + 1;
}
