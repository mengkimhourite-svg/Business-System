<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

/** Validation rules per CRUD resource (create/update). Mass assignment is limited to these keys. */
class ResourceRequest extends FormRequest
{
    public function authorize(): bool { return true; } // permission enforced by route middleware

    public static function rulesFor(string $resource, ?int $id, int $businessId): array
    {
        $status = ['sometimes', 'in:active,inactive'];
        return match ($resource) {
            'products' => [
                'name' => ['required', 'string', 'max:150'],
                'sku' => ['required', 'string', 'max:60', Rule::unique('products', 'sku')->where('business_id', $businessId)->ignore($id)],
                'barcode' => ['nullable', 'string', 'max:60'], 'unit' => ['nullable', 'string', 'max:20'],
                'category_id' => ['nullable', 'integer', Rule::exists('categories', 'id')->where('business_id', $businessId)],
                'brand_id' => ['nullable', 'integer', Rule::exists('brands', 'id')->where('business_id', $businessId)],
                'supplier_id' => ['nullable', 'integer', Rule::exists('suppliers', 'id')->where('business_id', $businessId)],
                'cost_price' => ['required', 'numeric', 'min:0'], 'selling_price' => ['required', 'numeric', 'min:0'], 'wholesale_price' => ['nullable', 'numeric', 'min:0'],
                'reorder_level' => ['nullable', 'numeric', 'min:0'], 'stock' => ['nullable', 'numeric', 'min:0'],
                'description' => ['nullable', 'string', 'max:2000'], 'image' => ['nullable', 'string', 'max:2000000'], 'status' => $status,
            ],
            'categories' => ['name' => ['required', 'string', 'max:100'], 'description' => ['nullable', 'string', 'max:500'], 'status' => $status],
            'brands' => ['name' => ['required', 'string', 'max:100'], 'description' => ['nullable', 'string', 'max:500'], 'website' => ['nullable', 'url', 'max:200'], 'logo' => ['nullable', 'string', 'max:2000000'], 'status' => $status],
            'suppliers' => ['name' => ['required', 'string', 'max:150'], 'contact_name' => ['nullable', 'string', 'max:100'], 'email' => ['nullable', 'email'], 'phone' => ['nullable', 'string', 'max:40'], 'address' => ['nullable', 'string', 'max:500'], 'status' => $status],
            'customers' => ['name' => ['required', 'string', 'max:150'], 'email' => ['nullable', 'email'], 'phone' => ['nullable', 'string', 'max:40'], 'address' => ['nullable', 'string', 'max:500'], 'type' => ['sometimes', 'in:retail,wholesale'], 'status' => $status],
            'branches' => ['name' => ['required', 'string', 'max:100'], 'code' => ['required', 'string', 'max:30', Rule::unique('branches', 'code')->where('business_id', $businessId)->ignore($id)], 'address' => ['nullable', 'string', 'max:500'], 'phone' => ['nullable', 'string', 'max:40'], 'manager' => ['nullable', 'string', 'max:100'], 'status' => $status],
            'expenses' => ['category' => ['required', 'string', 'max:40'], 'amount' => ['required', 'numeric', 'gt:0'], 'date' => ['required', 'date'], 'payment_method' => ['sometimes', 'in:cash,card,bank_transfer,qr'], 'status' => ['sometimes', 'in:pending,approved,rejected'], 'note' => ['nullable', 'string', 'max:500'], 'currency' => ['nullable', 'in:USD,KHR'], 'exchange_rate' => ['nullable', 'numeric', 'gt:0']],
            'users' => ['name' => ['required', 'string', 'max:100'], 'email' => ['required', 'email', Rule::unique('users', 'email')->ignore($id)], 'phone' => ['nullable', 'string', 'max:40'], 'avatar' => ['nullable', 'string', 'max:2000000'], 'role_id' => ['required', 'integer'], 'branch_id' => ['nullable', 'integer'], 'status' => $status, 'password' => [$id ? 'nullable' : 'required', 'string', 'min:6']],
            'roles' => ['name' => [$id ? 'sometimes' : 'required', 'string', 'max:60'], 'description' => ['nullable', 'string', 'max:255'], 'permission_ids' => ['sometimes', 'array'], 'permission_ids.*' => ['integer', 'exists:permissions,id']],
            default => [],
        };
    }

    public function rules(): array
    {
        return static::rulesFor($this->route()->parameter('resource') ?? $this->route()->defaults['resource'] ?? '', $this->route('id') ? (int) $this->route('id') : null, (int) $this->user()->business_id);
    }
}
