<?php

namespace App\Services;

use App\Models\Payment;
use App\Models\Sale;
use App\Models\User;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;
use Illuminate\Validation\ValidationException;

/**
 * Handles static KHQR payment lifecycle:
 * create → upload receipt → approve/reject.
 * No external API calls — uses the merchant's personal Bakong QR image.
 */
class KhqrService
{
    /**
     * Create a pending KHQR payment for a sale.
     * The QR image URL is stored so the frontend can display it.
     */
    public function createPayment(Sale $sale, User $user, ?string $notes = null): Payment
    {
        $business = $user->business;

        // Prevent duplicate pending KHQR payments for the same sale
        $existing = Payment::where('payable_type', Sale::class)
            ->where('payable_id', $sale->id)
            ->where('method', 'khqr')
            ->where('status', 'pending')
            ->first();
        if ($existing) return $existing;

        // Build a unique reference for this QR display
        $qrRef = 'KHQR-' . $sale->number . '-' . strtoupper(substr(uniqid(), -6));

        return Payment::create([
            'business_id' => $business->id,
            'payable_type' => Sale::class,
            'payable_id' => $sale->id,
            'user_id' => $user->id,
            'method' => 'khqr',
            'amount' => $sale->total,
            'received' => $sale->total_in_currency ?? $sale->total,
            'change_given' => 0,
            'currency' => $sale->currency,
            'exchange_rate' => $sale->exchange_rate,
            'status' => 'pending',
            'qr_data' => config('khqr.static_qr_image_url', '/images/khqr-default.png'),
            'qr_reference' => $qrRef,
            'reference' => $qrRef,
        ]);
    }

    /**
     * Upload the customer's payment receipt screenshot.
     */
    public function uploadReceipt(Payment $payment, UploadedFile $file, ?string $notes = null): Payment
    {
        if ($payment->status !== 'pending') {
            throw ValidationException::withMessages(['payment' => ['This payment has already been processed.']]);
        }

        $path = $file->store('khqr-receipts', 'public');
        $payment->update([
            'receipt_image' => $path,
            'review_notes' => $notes,
        ]);

        return $payment->fresh();
    }

    /**
     * Approve a pending KHQR payment.
     * Updates both the payment and the parent sale.
     */
    public function approve(Payment $payment, User $admin, ?string $notes = null): Payment
    {
        if ($payment->status !== 'pending') {
            throw ValidationException::withMessages(['payment' => ['This payment has already been processed.']]);
        }

        return DB::transaction(function () use ($payment, $admin, $notes) {
            // Update payment
            $payment->update([
                'status' => 'paid',
                'paid_at' => now(),
                'reviewed_at' => now(),
                'reviewed_by' => $admin->name,
                'review_notes' => $notes,
            ]);

            // Update the parent sale
            $sale = $payment->payable;
            if ($sale) {
                $sale->update([
                    'payment_status' => 'paid',
                    'status' => 'completed',
                ]);
            }

            return $payment->fresh('payable');
        });
    }

    /**
     * Reject a pending KHQR payment.
     */
    public function reject(Payment $payment, User $admin, ?string $notes = null): Payment
    {
        if ($payment->status !== 'pending') {
            throw ValidationException::withMessages(['payment' => ['This payment has already been processed.']]);
        }

        $payment->update([
            'status' => 'rejected',
            'reviewed_at' => now(),
            'reviewed_by' => $admin->name,
            'review_notes' => $notes,
        ]);

        return $payment->fresh();
    }

    /**
     * Get payment status for polling.
     */
    public function getStatus(Payment $payment): array
    {
        return [
            'id' => $payment->id,
            'status' => $payment->status,
            'paid_at' => $payment->paid_at?->toISOString(),
            'reviewed_at' => $payment->reviewed_at?->toISOString(),
            'reviewed_by' => $payment->reviewed_by,
            'review_notes' => $payment->review_notes,
        ];
    }
}
