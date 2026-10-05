import { http } from "../http.js";

/**
 * KHQR static payment API — backed by /api/v1/khqr/* endpoints.
 * Uses the custom http client (fetch-based, same as other modules).
 */
export const khqrPaymentApi = {
  /** Create a pending KHQR payment for a sale. Returns QR data + payment_id. */
  createPayment: (saleId, notes) =>
    http.post("/khqr/payments", { sale_id: saleId, notes }),

  /** Upload a receipt screenshot for a pending payment. */
  uploadReceipt: (paymentId, file, notes) => {
    const formData = new FormData();
    formData.append("receipt", file);
    if (notes) formData.append("notes", notes);
    return http.post(`/khqr/payments/${paymentId}/receipt`, formData);
  },

  /** Get current payment status (polling). */
  getStatus: (paymentId) => http.get(`/khqr/payments/${paymentId}/status`),

  /** List KHQR payments (admin). */
  list: (params) => http.get("/khqr/payments", params),

  /** Admin: approve a pending payment. */
  approve: (paymentId, notes) =>
    http.post(`/khqr/payments/${paymentId}/approve`, { notes }),

  /** Admin: reject a pending payment. */
  reject: (paymentId, notes) =>
    http.post(`/khqr/payments/${paymentId}/reject`, { notes }),
};
