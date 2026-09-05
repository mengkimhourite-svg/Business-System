import { api } from "../api.js";
export const authApi = {
  login: (c) => api.login(c),
  logout: () => api.logout(),
  me: () => api.me(),
  register: (p) => api.register?.(p),
  forgotPassword: (p) => api.forgotPassword(p),
  resetPassword: (p) => api.resetPassword(p),
  changePassword: (p) => api.changePassword(p),
  updateProfile: (p) => api.updateProfile(p),
};
