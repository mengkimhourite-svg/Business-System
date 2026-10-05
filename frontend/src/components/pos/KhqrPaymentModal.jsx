import { useCallback, useRef, useState, useEffect } from "react";
import { QrCode, Upload, CheckCircle2, Clock, ArrowLeft, Smartphone } from "lucide-react";
import { cn } from "../../utils/cn.js";
import { useI18n } from "../../i18n/index.jsx";
import { useFormat } from "../../context/CurrencyContext.jsx";
import { useSettings } from "../../context/SettingsContext.jsx";
import { khqrPaymentApi } from "../../services/modules/khqrPaymentApi.js";
import { errorKey } from "../../services/api.js";
import { Button, Modal, useToast } from "../ui/index.js";

export default function KhqrPaymentModal({ open, onClose, order, onPaid }) {
  const { t } = useI18n();
  const fmt = useFormat();
  const toast = useToast();
  const { settings } = useSettings();

  const [step, setStep] = useState("scan");
  const [paymentId, setPaymentId] = useState(null);
  const [qrRef, setQrRef] = useState(null);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const [receiptFile, setReceiptFile] = useState(null);
  const [receiptPreview, setReceiptPreview] = useState(null);
  const [notes, setNotes] = useState("");
  const fileRef = useRef(null);
  const [imgError, setImgError] = useState(false);
  const [polling, setPolling] = useState(false);

  useEffect(() => {
    if (open) {
      setStep("scan");
      setPaymentId(null);
      setQrRef(null);
      setReceiptFile(null);
      setReceiptPreview(null);
      setNotes("");
      setPolling(false);
      setImgError(false);
    }
  }, [open, order?.id]);

  useEffect(() => {
    if (step !== "pending") setPolling(false);
  }, [step]);

  useEffect(() => {
    if (!polling || !paymentId) return;
    const timer = setInterval(async () => {
      try {
        const res = await khqrPaymentApi.getStatus(paymentId);
        if (res.status === "paid") {
          setPolling(false);
          setStep("done");
          toast.success(t("khqr.paymentApproved"));
          onPaid?.();
        } else if (res.status === "rejected") {
          setPolling(false);
          setStep("scan");
          toast.error(t("khqr.paymentRejected"));
        }
      } catch {}
    }, 3000);
    return () => clearInterval(timer);
  }, [polling, paymentId, onPaid, t]);

  const createPayment = useCallback(async () => {
    if (!order?.id) return;
    setLoading(true);
    try {
      const res = await khqrPaymentApi.createPayment(order.id);
      setPaymentId(res.payment_id);
      setQrRef(res.qr_reference);
      setStep("upload");
    } catch (err) {
      toast.error(t(errorKey(err)));
    } finally {
      setLoading(false);
    }
  }, [order?.id, t, toast]);

  const onFileChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 10 * 1024 * 1024) {
      toast.error(t("khqr.fileTooLarge"));
      return;
    }
    setReceiptFile(file);
    const reader = new FileReader();
    reader.onload = (ev) => setReceiptPreview(ev.target.result);
    reader.readAsDataURL(file);
  };

  const submitReceipt = async () => {
    if (!receiptFile || !paymentId) return;
    setSubmitting(true);
    try {
      await khqrPaymentApi.uploadReceipt(paymentId, receiptFile, notes);
      setStep("pending");
      setPolling(true);
      toast.success(t("khqr.receiptSubmitted"));
    } catch (err) {
      toast.error(t(errorKey(err)));
    } finally {
      setSubmitting(false);
    }
  };

  const close = () => {
    if (!loading && !submitting) onClose();
  };

  return (
    <Modal open={open} onClose={close} hideHeader size="sm">
      <div className="w-full rounded-[24px] bg-white shadow-[0_8px_40px_rgba(0,0,0,0.08)] ring-1 ring-black/[0.03] overflow-hidden">

        {/* ========== SCAN STEP ========== */}
        {step === "scan" && (
          <div className="relative">
            {/* Red Header */}
            <div className="relative h-32 bg-gradient-to-b from-[#D32F2F] via-[#E53935] to-[#EF5350] overflow-hidden">
              <div className="absolute -right-16 -top-16 h-48 w-48 rounded-full bg-white/10" />
              <div className="absolute -right-8 -top-8 h-32 w-32 rounded-full bg-white/10" />
            </div>

              {/* QR Section */}
              <div className="relative -mt-20 px-6">
                <div className="text-center mb-4">
                  <h3 className="text-xl font-medium text-gray-700 tracking-wide">Scan. Pay. Done.</h3>
                </div>

                {/* QR Code Card */}
                <div className="mx-auto w-fit rounded-3xl bg-white p-4 shadow-[0_4px_24px_rgba(0,0,0,0.12)]">
                  <div className="relative rounded-2xl bg-gray-50 p-4">
                    <div className="absolute left-2 top-2 h-5 w-5 border-l-[3px] border-t-[3px] border-gray-300 rounded-tl-xl" />
                    <div className="absolute right-2 top-2 h-5 w-5 border-r-[3px] border-t-[3px] border-gray-300 rounded-tr-xl" />
                    <div className="absolute bottom-2 left-2 h-5 w-5 border-l-[3px] border-b-[3px] border-gray-300 rounded-bl-xl" />
                    <div className="absolute bottom-2 right-2 h-5 w-5 border-r-[3px] border-b-[3px] border-gray-300 rounded-br-xl" />

                    {!imgError ? (
                      <img
                        src={config("khqr.static_qr_image_url", settings)}
                        alt="KHQR"
                        className="h-64 w-64 object-contain sm:h-72 sm:w-72"
                        onError={() => setImgError(true)}
                      />
                    ) : (
                      <div className="flex h-64 w-64 items-center justify-center sm:h-72 sm:w-72">
                        <div className="text-center">
                          <QrCode className="mx-auto h-16 w-16 text-gray-300" />
                          <p className="mt-2 text-xs text-gray-400">KHQR</p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>

            {/* Amount */}
            <div className="px-6 mt-5">
              <div className="flex items-center justify-between rounded-2xl bg-primary/[0.04] border border-primary/10 px-5 py-4">
                <span className="text-sm text-fg-secondary">{t("khqr.amountToPay")}</span>
                <span className="text-2xl font-bold text-primary tabular">{fmt.currency(order?.total)}</span>
              </div>
            </div>

            {/* Action Button */}
            <div className="px-6 mt-4">
              <Button fullWidth size="lg" onClick={createPayment} loading={loading} leftIcon={Smartphone}
                className="h-12 rounded-xl font-semibold text-sm bg-primary hover:bg-primary/90 shadow-lg shadow-primary/20">
                {t("khqr.iHavePaid")}
              </Button>
            </div>

            {/* Bottom Branding */}
            <div className="relative mt-6 border-t border-gray-100 px-6 py-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-xs text-gray-500">Member of</span>
                  <span className="text-lg font-bold text-[#D32F2F]">KHQR</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-gray-500">Accepted here</span>
                  <div className="flex items-center gap-1">
                    <span className="rounded bg-[#1A1F71] px-1.5 py-0.5 text-[8px] font-bold text-white">UnionPay</span>
                    <span className="rounded bg-[#E31937] px-1.5 py-0.5 text-[8px] font-bold text-white">Alipay</span>
                  </div>
                </div>
              </div>
              <div className="absolute -bottom-4 -right-4 h-24 w-24 rounded-full bg-[#D32F2F]/10" />
            </div>
          </div>
        )}

        {/* ========== UPLOAD RECEIPT STEP ========== */}
        {step === "upload" && (
          <div className="relative">
            <div className="h-24 bg-gradient-to-b from-[#D32F2F] via-[#E53935] to-[#EF5350] overflow-hidden" />
            <div className="relative -mt-14 px-6 pb-6 space-y-4">
              <button onClick={() => setStep("scan")} className="flex items-center gap-1.5 text-sm text-fg-secondary hover:text-fg transition-colors">
                <ArrowLeft className="h-4 w-4" />
                {t("common.back")}
              </button>

              {qrRef && (
                <div className="rounded-xl bg-gray-50 border border-gray-100 px-4 py-3 text-center">
                  <p className="text-[11px] text-fg-muted uppercase tracking-wider">{t("khqr.reference")}</p>
                  <p className="font-mono text-sm font-semibold text-fg mt-0.5">{qrRef}</p>
                </div>
              )}

              <div
                onClick={() => fileRef.current?.click()}
                className={cn(
                  "relative flex cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed p-8 transition-all duration-200",
                  receiptFile ? "border-success bg-success/[0.03]" : "border-gray-200 hover:border-primary/40 hover:bg-primary/[0.02]"
                )}
              >
                {receiptPreview ? (
                  <img src={receiptPreview} alt="Receipt" className="max-h-52 w-full rounded-xl object-contain" />
                ) : (
                  <>
                    <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/[0.07]">
                      <Upload className="h-7 w-7 text-primary" />
                    </div>
                    <p className="text-sm font-semibold text-fg">{t("khqr.clickToUpload")}</p>
                    <p className="mt-1.5 text-xs text-fg-muted">PNG, JPG (max 10MB)</p>
                  </>
                )}
              </div>
              <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={onFileChange} />

              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder={t("khqr.optionalNotes")}
                rows={2}
                className="w-full rounded-xl border border-gray-200 bg-gray-50/50 px-4 py-3 text-sm text-fg placeholder:text-fg-muted focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/30 transition-all"
              />

              <Button fullWidth size="lg" onClick={submitReceipt} loading={submitting} disabled={!receiptFile} leftIcon={CheckCircle2}
                className="h-12 rounded-xl font-semibold text-sm">
                {t("khqr.submitPayment")}
              </Button>
            </div>
          </div>
        )}

        {/* ========== PENDING REVIEW STEP ========== */}
        {step === "pending" && (
          <div className="relative">
            <div className="h-24 bg-gradient-to-b from-[#D32F2F] via-[#E53935] to-[#EF5350] overflow-hidden" />
            <div className="relative -mt-14 px-6 pb-6">
              <div className="flex flex-col items-center gap-5 py-4">
                <div className="relative">
                  <div className="flex h-20 w-20 items-center justify-center rounded-full bg-warning/[0.08]">
                    <Clock className="h-9 w-9 text-warning animate-pulse" />
                  </div>
                  <div className="absolute -bottom-1 -right-1 flex h-6 w-6 items-center justify-center rounded-full bg-warning text-[10px] font-bold text-white shadow-sm">1</div>
                </div>
                <div className="text-center space-y-1">
                  <p className="text-xl font-bold text-fg">{t("khqr.pendingTitle")}</p>
                  <p className="text-sm text-fg-muted max-w-[260px]">{t("khqr.pendingHint")}</p>
                </div>
                {receiptPreview && (
                  <div className="w-full rounded-2xl border border-gray-100 bg-gray-50/50 p-3">
                    <p className="mb-2 text-[11px] font-medium text-fg-muted uppercase tracking-wider">{t("khqr.submittedReceipt")}</p>
                    <img src={receiptPreview} alt="Receipt" className="max-h-40 w-full rounded-xl object-contain" />
                  </div>
                )}
                <div className="w-full rounded-2xl bg-info/[0.05] border border-info/10 px-5 py-4 text-center">
                  <p className="text-sm font-medium text-info">{t("khqr.waitingApproval")}</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ========== DONE STEP ========== */}
        {step === "done" && (
          <div className="relative">
            <div className="h-24 bg-gradient-to-b from-[#D32F2F] via-[#E53935] to-[#EF5350] overflow-hidden" />
            <div className="relative -mt-14 px-6 pb-6">
              <div className="flex flex-col items-center gap-5 py-6">
                <div className="flex h-20 w-20 items-center justify-center rounded-full bg-success/[0.08]">
                  <CheckCircle2 className="h-10 w-10 text-success" />
                </div>
                <div className="text-center space-y-1">
                  <p className="text-xl font-bold text-fg">{t("khqr.paymentSuccessful")}</p>
                  <p className="text-sm text-fg-muted">{t("khqr.paymentApproved")}</p>
                </div>
                <Button fullWidth size="lg" onClick={close} leftIcon={CheckCircle2}
                  className="h-12 rounded-xl font-semibold text-sm bg-success hover:bg-success/90">
                  {t("common.done")}
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </Modal>
  );
}

function config(key, settings) {
  const defaults = {
    "khqr.static_qr_image_url": settings?.khqr_image
      ? (settings.khqr_image.startsWith("http") ? settings.khqr_image : `/storage/${settings.khqr_image}`)
      : "/images/khqr-default.jpg",
    "khqr.merchant_name": "KIMHOUR MENG",
  };
  return defaults[key] || "";
}
