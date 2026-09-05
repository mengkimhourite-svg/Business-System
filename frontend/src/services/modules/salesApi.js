import { api } from "../api.js";
export const salesApi = { checkout: (p) => api.checkout(p), orders: (params) => api.list("orders", params), order: (id) => api.get("orders", id), updateOrder: (id, p) => api.updateOrder(id, p) };
export const orderApi = salesApi;
