<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Http\Resources\ApiResource;
use App\Models\InventoryMovement;
use App\Models\Product;
use App\Services\InventoryService;
use App\Support\ApiResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class InventoryController extends Controller
{
    public function __construct(private InventoryService $inventory) {}

    /** GET /inventory/movements */
    public function movements(Request $request)
    {
        $q = InventoryMovement::with('product:id,name,sku,image', 'user:id,name');
        if ($s = trim((string) $request->query('search'))) $q->where(fn ($w) => $w->where('reference', 'like', "%$s%")->orWhere('reason', 'like', "%$s%")->orWhereHas('product', fn ($p) => $p->where('name', 'like', "%$s%")->orWhere('sku', 'like', "%$s%")));
        if (($t = $request->query('type')) && $t !== 'all') $q->where('type', $t);
        if ($pid = $request->query('product_id')) $q->where('product_id', $pid);
        if ($from = $request->query('from')) $q->whereDate('created_at', '>=', $from);
        if ($to = $request->query('to')) $q->whereDate('created_at', '<=', $to);
        $q->orderBy(in_array($request->query('sort_by'), ['created_at', 'type', 'quantity'], true) ? $request->query('sort_by') : 'created_at', $request->query('sort_dir') === 'asc' ? 'asc' : 'desc');
        $page = $q->paginate(min(500, (int) $request->query('per_page', 10)))->through(fn ($m) => ['id' => $m->id, 'product_id' => $m->product_id, 'product_name' => $m->product?->name, 'product_sku' => $m->product?->sku, 'product_image' => $m->product?->image, 'type' => $m->type, 'qty' => (float) $m->quantity, 'quantity_after' => (float) $m->quantity_after, 'reason' => $m->reason, 'reference' => $m->reference, 'user_name' => $m->user?->name, 'created_at' => $m->created_at]);
        return ApiResponse::paginated($page);
    }

    /** POST /inventory/adjust */
    public function adjust(Request $request)
    {
        $data = $request->validate(['product_id' => ['required', 'integer'], 'type' => ['required', 'in:in,out'], 'qty' => ['required', 'numeric', 'gt:0'], 'reason' => ['nullable', 'string', 'max:255'], 'branch_id' => ['nullable', 'integer']]);
        $product = Product::findOrFail($data['product_id']);
        $branchId = $data['branch_id'] ?? $request->user()->branch_id;
        DB::transaction(fn () => $this->inventory->move($product, $branchId, ($data['type'] === 'out' ? '-' : '').number_format($data['qty'], 3, '.', ''), 'adjustment', $data['reason'] ?: 'Manual adjustment', 'ADJ-'.now()->format('ymdHis'), $request->user()->id));
        return ApiResponse::success(new ApiResource(Product::withSum('inventory as stock', 'quantity')->findOrFail($product->id)), 'Stock adjusted');
    }

    /** GET /inventory/low-stock */
    public function lowStock()
    {
        $items = Product::where('status', 'active')->withSum('inventory as stock', 'quantity')->get()->filter(fn ($p) => (float) $p->stock <= (float) $p->reorder_level)->sortBy('stock')->values();
        return ApiResponse::success(ApiResource::collection($items));
    }
}
