import { api } from "../api.js";
export const inventoryApi = { stock: (params) => api.list("products", params), movements: (params) => api.list("stock_movements", params), adjust: (p) => api.adjustStock(p) };
