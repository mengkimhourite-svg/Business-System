import { api } from "../api.js";
export const purchaseApi = { list: (params) => api.list("purchases", params), get: (id) => api.get("purchases", id), create: (p) => api.createPurchase(p), receive: (id) => api.receivePurchase(id), remove: (id) => api.remove("purchases", id) };
