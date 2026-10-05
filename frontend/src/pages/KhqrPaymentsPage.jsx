import { useCallback, useEffect, useState } from "react";
import { CheckCircle2, XCircle, Eye, Clock, Receipt, Search } from "lucide-react";
import { cn } from "../utils/cn.js";
import { useI18n } from "../i18n/index.jsx";
import { useFormat } from "../context/CurrencyContext.jsx";
import { useAuth } from "../context/AuthContext.jsx";
import { khqrPaymentApi } from "../services/modules/khqrPaymentApi.js";
import { errorKey } from "../services/api.js";
import { PageHeader } from "../components/layout/PageHeader.jsx";
import { Button, Card, Input, Modal, Badge, EmptyState, ErrorState, Skeleton, Alert, useToast } from "../components/ui/index.js";
import { StatusBadge } from "../components/data-display/StatusBadge.jsx";

const STATUS_FILTERS = [
  { key: "all", label: "All" },
  { key: "pending", label: "Pending" },
  { key: "paid", label: "Paid" },
  { key: "rejected", label: "Rejected" },
];

export default function KhqrPaymentsPage() {
  const { t } = useI18n();
  const fmt = useFormat();
  const { can } = useAuth();
  const toast = useToast();

  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filter, setFilter] = useState("pending");
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const perPage = 20;

  // Review modal state
  const [reviewTarget, setReviewTarget] = useState(null);
  const [reviewAction, setReviewAction] = useState(null); // "approve" | "reject"
  const [reviewNotes, setReviewNotes] = useState("");
  const [reviewing, setReviewing] = useState(false);

  // Receipt preview modal
  const [receiptTarget, setReceiptTarget] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = { page, per_page: perPage };
      if (filter !== "all") params.status = filter;
      const res = await khqrPaymentApi.list(params);
      setPayments(res.data || []);
      setTotal(res.total || 0);
    } catch (err) {
      setError(err);
    } finally {
      setLoading(false);
    }
  }, [page, filter]);

  useEffect(() => { load(); }, [load]);

  const handleReview = async () => {
    if (!reviewTarget || !reviewAction) return;
    setReviewing(true);
    try {
      if (reviewAction === "approve") {
        await khqrPaymentApi.approve(reviewTarget.id, reviewNotes);
        toast.success(t("khqr.paymentApproved"));
      } else {
        await khqrPaymentApi.reject(reviewTarget.id, reviewNotes);
        toast.success(t("khqr.paymentRejected"));
      }
      setReviewTarget(null);
      setReviewAction(null);
      setReviewNotes("");
      load();
    } catch (err) {
      toast.error(t(errorKey(err)));
    } finally {
      setReviewing(false);
    }
  };

  const totalPages = Math.ceil(total / perPage);

  return (
    <>
      <PageHeader
        title={t("khqr.reviewTitle")}
        description={t("khqr.reviewSubtitle")}
        className="mb-4"
      />

      {/* Status filter tabs */}
      <div className="mb-4 flex flex-wrap gap-2">
        {STATUS_FILTERS.map((f) => (
          <button
            key={f.key}
            type="button"
            onClick={() => { setFilter(f.key); setPage(1); }}
            className={cn(
              "rounded-md px-3 py-1.5 text-sm font-medium transition-colors",
              filter === f.key
                ? "bg-primary text-white"
                : "bg-surface text-fg-secondary hover:bg-surface-hover"
            )}
          >
            {f.key === "pending" ? t("khqr.statusPending") :
             f.key === "paid" ? t("khqr.statusPaid") :
             f.key === "rejected" ? t("khqr.statusRejected") :
             t("common.all")}
          </button>
        ))}
      </div>

      {error ? (
        <Card><ErrorState onRetry={load} /></Card>
      ) : loading ? (
        <div className="space-y-3">
          {[...Array(5)].map((_, i) => <Skeleton key={i} className="h-24 w-full rounded-lg" />)}
        </div>
      ) : payments.length === 0 ? (
        <Card>
          <EmptyState
            icon={Receipt}
            title={t("khqr.noPayments")}
            description={t("khqr.noPaymentsHint")}
          />
        </Card>
      ) : (
        <div className="space-y-3">
          {payments.map((p) => (
            <Card key={p.id} className="p-4">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <p className="font-medium text-fg">{p.order_number || `Order #${p.sale_id}`}</p>
                    <StatusBadge status={p.status} />
                  </div>
                  <div className="mt-1 flex flex-wrap items-center gap-3 text-sm text-fg-secondary">
                    <span className="tabular">{fmt.currency(p.amount, { currency: p.currency })}</span>
                    <span className="text-fg-muted">{fmt.dateTime(p.created_at)}</span>
                    {p.qr_reference && <span className="font-mono text-xs text-fg-muted">{p.qr_reference}</span>}
                  </div>
                  {p.reviewed_by && (
                    <p className="mt-1 text-xs text-fg-muted">
                      {t("khqr.reviewedBy")}: {p.reviewed_by}
                      {p.review_notes && ` — ${p.review_notes}`}
                    </p>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  {p.receipt_image && (
                    <Button
                      variant="outline"
                      size="sm"
                      leftIcon={Eye}
                      onClick={() => setReceiptTarget(p)}
                    >
                      {t("khqr.viewReceipt")}
                    </Button>
                  )}
                  {p.status === "pending" && can("orders.update") && (
                    <>
                      <Button
                        size="sm"
                        leftIcon={CheckCircle2}
                        onClick={() => { setReviewTarget(p); setReviewAction("approve"); setReviewNotes(""); }}
                        className="bg-success text-white hover:bg-success/90"
                      >
                        {t("khqr.approve")}
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        leftIcon={XCircle}
                        onClick={() => { setReviewTarget(p); setReviewAction("reject"); setReviewNotes(""); }}
                        className="text-danger hover:bg-danger/5"
                      >
                        {t("khqr.reject")}
                      </Button>
                    </>
                  )}
                </div>
              </div>
            </Card>
          ))}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between pt-2">
              <p className="text-sm text-fg-secondary">
                {t("common.showing")} {((page - 1) * perPage) + 1}–{Math.min(page * perPage, total)} {t("common.of")} {total}
              </p>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>
                  {t("common.previous")}
                </Button>
                <Button variant="outline" size="sm" disabled={page >= totalPages} onClick={() => setPage((p) => p + 1)}>
                  {t("common.next")}
                </Button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Receipt preview modal */}
      <Modal open={!!receiptTarget} onClose={() => setReceiptTarget(null)} title={t("khqr.receipt")} size="md">
        {receiptTarget && (
          <div className="space-y-4">
            <div className="flex items-center justify-between text-sm">
              <span className="text-fg-secondary">{t("khqr.order")}</span>
              <span className="font-medium text-fg">{receiptTarget.order_number}</span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-fg-secondary">{t("common.amount")}</span>
              <span className="font-medium text-fg tabular">{fmt.currency(receiptTarget.amount, { currency: receiptTarget.currency })}</span>
            </div>
            {receiptTarget.receipt_image && (
              <div className="overflow-hidden rounded-lg border border-border">
                <img
                  src={`/storage/${receiptTarget.receipt_image}`}
                  alt="Receipt"
                  className="w-full object-contain"
                  onError={(e) => { e.target.src = receiptTarget.receipt_image; }}
                />
              </div>
            )}
          </div>
        )}
      </Modal>

      {/* Review confirm modal */}
      <Modal
        open={!!reviewTarget}
        onClose={() => { if (!reviewing) { setReviewTarget(null); setReviewAction(null); } }}
        title={reviewAction === "approve" ? t("khqr.approvePayment") : t("khqr.rejectPayment")}
        size="sm"
        footer={
          <>
            <Button variant="outline" onClick={() => { setReviewTarget(null); setReviewAction(null); }} disabled={reviewing}>
              {t("common.cancel")}
            </Button>
            <Button
              onClick={handleReview}
              loading={reviewing}
              variant={reviewAction === "approve" ? "primary" : "danger"}
            >
              {reviewAction === "approve" ? t("khqr.approve") : t("khqr.reject")}
            </Button>
          </>
        }
      >
        {reviewTarget && (
          <div className="space-y-4">
            <p className="text-sm text-fg-secondary">
              {reviewAction === "approve"
                ? t("khqr.approveConfirm")
                : t("khqr.rejectConfirm")}
            </p>
            <div className="rounded-lg bg-surface-muted p-3 text-sm">
              <div className="flex justify-between">
                <span className="text-fg-secondary">{t("khqr.order")}</span>
                <span className="font-medium">{reviewTarget.order_number}</span>
              </div>
              <div className="mt-1 flex justify-between">
                <span className="text-fg-secondary">{t("common.amount")}</span>
                <span className="font-semibold tabular">{fmt.currency(reviewTarget.amount, { currency: reviewTarget.currency })}</span>
              </div>
            </div>
            <textarea
              value={reviewNotes}
              onChange={(e) => setReviewNotes(e.target.value)}
              placeholder={t("khqr.reviewNotesPlaceholder")}
              rows={2}
              className="w-full rounded-md border border-border bg-transparent px-3 py-2 text-sm text-fg placeholder:text-fg-muted focus:outline-none focus:ring-2 focus:ring-primary/30"
            />
          </div>
        )}
      </Modal>
    </>
  );
}
