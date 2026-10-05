<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

/** Only identities and quantities are accepted from the client — prices/totals are recomputed server-side. */
class CheckoutRequest extends FormRequest
{
    public function authorize(): bool { return true; }

    public function rules(): array
    {
        return [
            'items' => ['required', 'array', 'min:1', 'max:200'],
            'items.*.product_id' => ['required', 'integer'],
            'items.*.qty' => ['required', 'numeric', 'gt:0', 'max:100000'],
            'customer_id' => ['nullable', 'integer'],
            'branch_id' => ['nullable', 'integer'],
            'discount_percent' => ['nullable', 'numeric', 'min:0', 'max:100'],
            'payment_method' => ['required', 'in:cash,card,qr,bank_transfer,khqr'],
            'received' => ['nullable', 'numeric', 'min:0'],
            'currency' => ['nullable', 'in:USD,KHR'],
            'mode' => ['nullable', 'in:quick,standard,wholesale,refund'],
            'idempotency_key' => ['nullable', 'string', 'max:80'],
            'note' => ['nullable', 'string', 'max:500'],
        ];
    }
}
