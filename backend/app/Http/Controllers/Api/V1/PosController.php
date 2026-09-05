<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Http\Requests\CheckoutRequest;
use App\Models\Sale;
use App\Services\SaleService;
use App\Support\ApiResponse;
use Illuminate\Http\Request;

class PosController extends Controller
{
    public function __construct(private SaleService $sales) {}

    /** POST /pos/checkout — server recomputes totals, updates inventory, records payment (DB::transaction). */
    public function checkout(CheckoutRequest $request)
    {
        $sale = $this->sales->checkout($request->user(), $request->validated());
        return ApiResponse::success($this->receipt($sale), 'Sale completed', 201);
    }

    /** GET /orders — sales list with filters (status, payment_status, from, to, search). */
    public function index(Request $request)
    {
        $q = Sale::with('customer:id,name', 'user:id,name', 'branch:id,name', 'items');
        if ($s = trim((string) $request->query('search'))) $q->where(fn ($w) => $w->where('number', 'like', "%$s%")->orWhereHas('customer', fn ($c) => $c->where('name', 'like', "%$s%")));
        foreach (['status', 'payment_status', 'branch_id', 'customer_id'] as $f) if (($v = $request->query($f)) && $v !== 'all') $q->where($f, $v);
        if ($from = $request->query('from')) $q->whereDate('created_at', '>=', $from);
        if ($to = $request->query('to')) $q->whereDate('created_at', '<=', $to);
        $sort = in_array($request->query('sort_by'), ['number', 'total', 'status', 'created_at'], true) ? $request->query('sort_by') : 'created_at';
        $q->orderBy($sort, $request->query('sort_dir') === 'asc' ? 'asc' : 'desc');
        return ApiResponse::paginated($q->paginate(min(500, (int) $request->query('per_page', 10)))->through(fn ($s) => $this->receipt($s)));
    }

    public function show(int $id)
    {
        return ApiResponse::success($this->receipt(Sale::with('customer', 'user', 'branch', 'items', 'payments')->findOrFail($id)));
    }

    /** PATCH /orders/{id} — status / payment status; cancelling restores stock. */
    public function update(Request $request, int $id)
    {
        $data = $request->validate(['status' => ['nullable', 'in:pending,completed,cancelled'], 'payment_status' => ['nullable', 'in:paid,unpaid,partial,refunded']]);
        $sale = Sale::with('items.product')->findOrFail($id);
        if (($data['status'] ?? null) === 'cancelled') $sale = $this->sales->cancel($sale, $request->user());
        $sale->update(array_filter(['status' => $data['status'] ?? null, 'payment_status' => $data['payment_status'] ?? null]));
        return ApiResponse::success($this->receipt($sale->fresh('customer', 'user', 'branch', 'items', 'payments')), 'Order updated');
    }

    public function destroy(int $id)
    {
        $sale = Sale::findOrFail($id);
        abort_if($sale->status !== 'cancelled', 422, 'Only cancelled orders can be deleted.');
        $sale->delete();
        return ApiResponse::success(null, 'Deleted');
    }

    public function bulkDestroy(\Illuminate\Http\Request $request)
    {
        $ids = $request->validate(['ids' => ['required', 'array', 'max:500'], 'ids.*' => ['integer']])['ids'];
        $q = Sale::whereIn('id', $ids)->where('status', 'cancelled');
        $count = $q->count();
        $q->get()->each->delete();
        return ApiResponse::success(['deleted' => $count], 'Deleted');
    }

    private function receipt(Sale $s): array
    {
        $pay = $s->relationLoaded('payments') ? $s->payments->first() : null;
        return [
            'id' => $s->id, 'number' => $s->number, 'mode' => $s->mode, 'customer_id' => $s->customer_id, 'customer_name' => $s->customer?->name, 'user_id' => $s->user_id, 'user_name' => $s->user?->name,
            'branch_id' => $s->branch_id, 'branch_name' => $s->branch?->name,
            'items' => $s->items->map(fn ($i) => ['product_id' => $i->product_id, 'name' => $i->name, 'sku' => $i->sku, 'qty' => (float) $i->quantity, 'price' => (float) $i->unit_price, 'cost' => (float) $i->unit_cost])->values(),
            'items_count' => (float) $s->items->sum('quantity'),
            'subtotal' => (float) $s->subtotal, 'discount' => (float) $s->discount, 'tax' => (float) $s->tax, 'total' => (float) $s->total,
            'currency' => $s->currency, 'exchange_rate' => (float) $s->exchange_rate, 'total_in_currency' => (float) $s->total_in_currency,
            'payment_method' => $pay?->method, 'received' => $pay ? (float) $pay->received : null, 'change' => $pay ? (float) $pay->change_given : null,
            'status' => $s->status, 'payment_status' => $s->payment_status, 'created_at' => $s->created_at,
        ];
    }
}
