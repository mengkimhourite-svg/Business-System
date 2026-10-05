<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Models\Product;
use App\Models\Purchase;
use App\Models\PurchaseItem;
use App\Services\CurrencyService;
use App\Services\InventoryService;
use App\Support\ApiResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class PurchaseController extends Controller
{
    public function __construct(private InventoryService $inventory) {}

    public function index(Request $request)
    {
        $q = Purchase::with('supplier:id,name', 'items');
        if ($s = trim((string) $request->query('search'))) $q->where(fn ($w) => $w->where('number', 'like', "%$s%")->orWhereHas('supplier', fn ($c) => $c->where('name', 'like', "%$s%")));
        foreach (['status', 'payment_status', 'supplier_id'] as $f) if (($v = $request->query($f)) && $v !== 'all') $q->where($f, $v);
        if ($from = $request->query('from')) $q->whereDate('created_at', '>=', $from);
        if ($to = $request->query('to')) $q->whereDate('created_at', '<=', $to);
        $q->orderBy(in_array($request->query('sort_by'), ['number', 'total', 'status', 'created_at', 'expected_at'], true) ? $request->query('sort_by') : 'created_at', $request->query('sort_dir') === 'asc' ? 'asc' : 'desc');
        return ApiResponse::paginated($q->paginate(min(500, (int) $request->query('per_page', 10)))->through(fn ($p) => $this->serialize($p)));
    }

    public function show(int $id) { return ApiResponse::success($this->serialize(Purchase::with('supplier', 'items')->findOrFail($id))); }

    public function store(Request $request, CurrencyService $currency)
    {
        $data = $request->validate([
            'supplier_id' => ['required', 'integer'], 'branch_id' => ['nullable', 'integer'], 'expected_at' => ['nullable', 'date'], 'payment_status' => ['nullable', 'in:paid,unpaid,partial'], 'note' => ['nullable', 'string', 'max:500'],
            'items' => ['required', 'array', 'min:1'], 'items.*.product_id' => ['required', 'integer'], 'items.*.qty' => ['required', 'numeric', 'gt:0'], 'items.*.cost' => ['required', 'numeric', 'min:0'],
        ]);
        $user = $request->user();
        $b = $user->business;
        $purchase = DB::transaction(function () use ($data, $user, $b, $currency) {
            $total = '0.00'; $lines = [];

            // Batch fetch all products at once instead of one-by-one
            $productIds = array_column($data['items'], 'product_id');
            $products = Product::whereIn('id', $productIds)->get()->keyBy('id');

            foreach ($data['items'] as $it) {
                $p = $products->get($it['product_id']);
                if (!$p) abort(422, "Product #{$it['product_id']} not found.");
                $line = number_format(round($it['qty'] * $it['cost'], 2), 2, '.', '');
                $total = bcadd($total, $line, 2);
                $lines[] = ['product' => $p, 'qty' => $it['qty'], 'cost' => $it['cost'], 'line' => $line];
            }
            $purchase = Purchase::create([
                'branch_id' => $data['branch_id'] ?? $user->branch_id, 'supplier_id' => $data['supplier_id'], 'user_id' => $user->id,
                'number' => 'PO-'.str_pad((string) ((Purchase::withoutGlobalScopes()->where('business_id', $user->business_id)->max('id') ?? 0) + 5001), 4, '0', STR_PAD_LEFT),
                'total' => $total, 'currency' => $b->currency, 'exchange_rate' => $b->exchange_rate,
                'status' => 'ordered', 'payment_status' => $data['payment_status'] ?? 'unpaid', 'expected_at' => $data['expected_at'] ?? null, 'note' => $data['note'] ?? null,
            ]);
            foreach ($lines as $l) PurchaseItem::create(['purchase_id' => $purchase->id, 'product_id' => $l['product']->id, 'name' => $l['product']->name, 'sku' => $l['product']->sku, 'quantity' => $l['qty'], 'unit_cost' => $l['cost'], 'line_total' => $l['line']]);
            return $purchase;
        });
        return ApiResponse::success($this->serialize($purchase->load('supplier', 'items')), 'Created', 201);
    }

    /** POST /purchases/{id}/receive — stock in for every line (transactional). */
    public function receive(Request $request, int $id)
    {
        $purchase = Purchase::with('items.product')->findOrFail($id);
        if ($purchase->status !== 'received') {
            DB::transaction(function () use ($purchase, $request) {
                foreach ($purchase->items as $i) if ($i->product) $this->inventory->move($i->product, $purchase->branch_id, (string) $i->quantity, 'in', 'Purchase received', $purchase->number, $request->user()->id, $purchase);
                $purchase->update(['status' => 'received', 'received_at' => now()]);
            });
        }
        return ApiResponse::success($this->serialize($purchase->fresh('supplier', 'items')), 'Purchase received');
    }

    public function destroy(int $id)
    {
        $p = Purchase::findOrFail($id);
        abort_if($p->status === 'received', 422, 'Received purchases cannot be deleted.');
        $p->delete();
        return ApiResponse::success(null, 'Deleted');
    }

    private function serialize(Purchase $p): array
    {
        return [
            'id' => $p->id, 'number' => $p->number, 'supplier_id' => $p->supplier_id, 'supplier_name' => $p->supplier?->name, 'branch_id' => $p->branch_id,
            'items' => $p->items->map(fn ($i) => ['product_id' => $i->product_id, 'name' => $i->name, 'sku' => $i->sku, 'qty' => (float) $i->quantity, 'cost' => (float) $i->unit_cost])->values(),
            'items_count' => (float) $p->items->sum('quantity'), 'total' => (float) $p->total, 'currency' => $p->currency, 'exchange_rate' => (float) $p->exchange_rate,
            'status' => $p->status, 'payment_status' => $p->payment_status, 'note' => $p->note, 'expected_at' => $p->expected_at, 'received_at' => $p->received_at, 'created_at' => $p->created_at,
        ];
    }
}
