<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class PaymentRequest extends FormRequest{
    public function authorize(): bool{
        return true;
    }

    public function rules(): array{
        return [
            'sale_id' => ['required', 'integer'],
            'method' => ['required', 'string'],
            'amount' => ['required', 'numeric', 'gt:0'],
        ];
    }
}