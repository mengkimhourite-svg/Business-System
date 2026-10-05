<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Http\Requests\KhqrPaymentRequest;
use App\Models\Payment;
use App\Models\Sale;
use App\Services\KhqrService;
use App\Support\ApiResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\ValidationException;

/**
 * Static KHQR payment endpoints:
 * - create:  POST   /api/v1/khqr/payments
 * - upload:  POST   /api/v1/khqr/payments/{id}/receipt
 * - status:  GET    /api/v1/khqr/payments/{id}/status
 * - approve: POST   /api/v1/khqr/payments/{id}/approve
 * - reject:  POST   /api/v1/khqr/payments/{id}/reject
 * - list:    GET    /api/v1/khqr/payments (admin — pending payments)
 */
class KhqrPaymentController extends Controller
{
    public function __construct(private KhqrService $khqr) {}

    /** Create a pending KHQR payment and return the QR data. */
    public function store(KhqrPaymentRequest $request)
    {
        $sale = Sale::with('customer', 'user', 'items')
            ->where('id', $request->validated('sale_id'))
            ->firstOrFail();

        $payment = $this->khqr->createPayment(
            $sale,
            $request->user(),
            $request->validated('notes')
        );

        return ApiResponse::success([
            'payment_id' => $payment->id,
            'qr_data' => $payment->qr_data,
            'qr_reference' => $payment->qr_reference,
            'amount' => (float) $payment->amount,
            'currency' => $payment->currency,
            'order_number' => $sale->number,
            'status' => $payment->status,
        ], 'KHQR payment created', 201);
    }

    /** Upload a receipt screenshot for a pending payment. */
    public function uploadReceipt(Request $request, int $id)
    {
        $payment = Payment::findOrFail($id);

        $request->validate([
            'receipt' => ['required', 'image', 'max:10240'], // max 10MB
            'notes' => ['nullable', 'string', 'max:500'],
        ]);

        $payment = $this->khqr->uploadReceipt(
            $payment,
            $request->file('receipt'),
            $request->input('notes')
        );

        return ApiResponse::success([
            'id' => $payment->id,
            'receipt_image' => $payment->receipt_image,
            'status' => $payment->status,
        ], 'Receipt uploaded');
    }

    /** Get current payment status (for polling). */
    public function status(int $id)
    {
        $payment = Payment::findOrFail($id);
        return ApiResponse::success($this->khqr->getStatus($payment));
    }

    /** Admin: approve a pending KHQR payment. */
    public function approve(Request $request, int $id)
    {
        $payment = Payment::findOrFail($id);
        $data = $request->validate(['notes' => ['nullable', 'string', 'max:500']]);

        $payment = $this->khqr->approve($payment, $request->user(), $data['notes'] ?? null);

        return ApiResponse::success([
            'id' => $payment->id,
            'status' => $payment->status,
            'paid_at' => $payment->paid_at,
        ], 'Payment approved');
    }

    /** Admin: reject a pending KHQR payment. */
    public function reject(Request $request, int $id)
    {
        $payment = Payment::findOrFail($id);
        $data = $request->validate(['notes' => ['nullable', 'string', 'max:500']]);

        $payment = $this->khqr->reject($payment, $request->user(), $data['notes'] ?? null);

        return ApiResponse::success([
            'id' => $payment->id,
            'status' => $payment->status,
        ], 'Payment rejected');
    }

    /** Admin: list KHQR payments with optional status filter. */
    public function index(Request $request)
    {
        $q = Payment::with('payable:id,number,total,currency,status,payment_status')
            ->where('method', 'khqr')
            ->orderBy('created_at', 'desc');

        if ($status = $request->query('status')) {
            $q->where('status', $status);
        }

        $payments = $q->paginate(min(50, (int) $request->query('per_page', 20)));

        return ApiResponse::paginated($payments->through(fn ($p) => [
            'id' => $p->id,
            'sale_id' => $p->payable_id,
            'order_number' => $p->payable?->number,
            'amount' => (float) $p->amount,
            'currency' => $p->currency,
            'status' => $p->status,
            'qr_reference' => $p->qr_reference,
            'receipt_image' => $p->receipt_image,
            'paid_at' => $p->paid_at,
            'reviewed_at' => $p->reviewed_at,
            'reviewed_by' => $p->reviewed_by,
            'review_notes' => $p->review_notes,
            'created_at' => $p->created_at,
        ]));
    }
}
