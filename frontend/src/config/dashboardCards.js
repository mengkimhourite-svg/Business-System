import {
  DollarSign,
  ShoppingCart,
  Receipt,
  Users,
  Boxes,
  AlertTriangle,
  TrendingUp,
  Wallet,
  Package,
  CreditCard,
  BarChart3,
  Percent,
  Star,
  Heart,
  Tag,
  Truck,
  Store,
  Coins,
  PiggyBank,
  Activity,
  Layers,
  Gift,
  Target,
  Zap,
} from "lucide-react";

/** Icons a user may assign to a KPI card. */
export const CARD_ICONS = { DollarSign, ShoppingCart, Receipt, Users, Boxes, AlertTriangle, TrendingUp, Wallet, Package, CreditCard, BarChart3, Percent, Star, Heart, Tag, Truck, Store, Coins, PiggyBank, Activity, Layers, Gift, Target, Zap };

/** KPI card registry. `kpi` maps to the dashboard API payload. */
export const DASHBOARD_CARDS = [
  { id: "revenue", labelKey: "dashboard.totalRevenue", icon: "DollarSign", tone: "primary", kind: "currency", kpi: "revenue" },
  { id: "orders", labelKey: "dashboard.orders", icon: "ShoppingCart", tone: "info", kind: "number", kpi: "orders" },
  { id: "avgOrder", labelKey: "dashboard.avgOrder", icon: "Receipt", tone: "success", kind: "currency", kpi: "avgOrder" },
  { id: "customers", labelKey: "dashboard.newCustomers", icon: "Users", tone: "neutral", kind: "number", kpi: "customers" },
  { id: "inventoryValue", labelKey: "dashboard.inventoryValue", icon: "Boxes", tone: "primary", kind: "currency", kpi: "inventoryValue" },
  { id: "lowStock", labelKey: "dashboard.lowStock", icon: "AlertTriangle", tone: "warning", kind: "number", kpi: "lowStock", link: "/inventory?stock_status=low_stock", permission: "inventory.view" },
  { id: "grossProfit", labelKey: "dashboard.grossProfit", icon: "TrendingUp", tone: "success", kind: "currency", kpi: "grossProfit", defaultHidden: true },
  { id: "itemsSold", labelKey: "dashboard.itemsSold", icon: "Package", tone: "info", kind: "number", kpi: "itemsSold", defaultHidden: true },
];

export const CARD_IDS = DASHBOARD_CARDS.map((c) => c.id);

export const DEFAULT_DASHBOARD_LAYOUT = {
  columns: 3,
  order: [...CARD_IDS],
  hidden: DASHBOARD_CARDS.filter((c) => c.defaultHidden).map((c) => c.id),
  styles: {},
};
