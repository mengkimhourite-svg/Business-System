<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class RefundRequest extends FormRequest{
    public function authorize(): bool{
        return true;
    }

    public function rules(): array{
        return [
            'payment_id' => ['required', 'integer'],
            'amount' => ['required', 'numeric', 'gt:0'],
            'reason' => ['nullable', 'string'],
        ];
    }
}