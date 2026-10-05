<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class KhqrPaymentRequest extends FormRequest
{
    public function authorize(): bool { return true; }

    public function rules(): array
    {
        return [
            'sale_id' => ['required', 'integer'],
            'notes' => ['nullable', 'string', 'max:500'],
        ];
    }
}
