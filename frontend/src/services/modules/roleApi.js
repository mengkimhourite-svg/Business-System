import { api } from "../api.js";
const R = "roles";
/** roleApi — centralized API access (mock or Laravel, selected by VITE_USE_MOCK). */
export const roleApi = {
  list: (params) => api.list(R, params),
  get: (id) => api.get(R, id),
  create: (payload) => api.create(R, payload),
  update: (id, payload) => api.update(R, id, payload),
  remove: (id) => api.remove(R, id),
  bulkRemove: (ids) => api.bulkRemove(R, ids),
};
