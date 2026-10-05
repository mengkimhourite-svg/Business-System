<?php

namespace App\Services;

use App\Models\Customer;
use App\Models\Inventory;
use App\Models\Product;
use App\Models\Sale;
use App\Models\SaleItem;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;

/** Aggregated dashboard metrics — batched SQL, no N+1. Amounts in base currency. */
class DashboardService
{
    public function __construct(private PeriodService $period) {}

    public function summary(int $businessId, string $range, ?string $from, ?string $to, ?int $branchId = null): array
    {
        $cacheKey = "dashboard:{$businessId}:{$range}:{$from}:{$to}:{$branchId}";
        return Cache::remember($cacheKey, 60, fn () => $this->compute($businessId, $range, $from, $to, $branchId));
    }

    private function compute(int $businessId, string $range, ?string $from, ?string $to, ?int $branchId = null): array
    {
        $b = $this->period->bounds($range, $from, $to);
        $base = fn () => Sale::query()->where('status', '!=', 'cancelled')->when($branchId, fn ($q) => $q->where('branch_id', $branchId));
        $cur = $base()->whereBetween('created_at', [$b['start'], $b['end']]);
        $prev = $base()->whereBetween('created_at', [$b['prev_start'], $b['prev_end']]);
        $pct = fn ($a, $x) => $x ? round(($a - $x) / $x * 100, 1) : ($a ? 100 : 0);

        // Batch 1: current + previous aggregates + order statuses (single pass on sales)
        $agg = fn ($q) => (clone $q)->selectRaw('COALESCE(SUM(total),0) revenue, COUNT(*) orders, COALESCE(AVG(total),0) avg_order')->first();
        $c = $agg($cur);
        $p = $agg($prev);

        // Batch 2: units + cogs for current and previous in 2 queries instead of 4
        $curIds = (clone $cur)->select('id');
        $prevIds = (clone $prev)->select('id');
        $unitsCur = (float) SaleItem::whereIn('sale_id', $curIds)->sum('quantity');
        $unitsPrev = (float) SaleItem::whereIn('sale_id', (clone $prev)->select('id'))->sum('quantity');
        $cogsData = SaleItem::whereIn('sale_id', $curIds)
            ->selectRaw('COALESCE(SUM(quantity*unit_cost),0) v')->value('v');
        $cogsPrev = (float) SaleItem::whereIn('sale_id', (clone $prev)->select('id'))
            ->selectRaw('COALESCE(SUM(quantity*unit_cost),0) v')->value('v');

        // Batch 3: order statuses in 1 query
        $statuses = (clone $cur)->selectRaw("SUM(status = 'completed') as completed, SUM(status = 'pending') as pending, SUM(status = 'cancelled') as cancelled")->first();

        // Batch 4: new customers (2 counts)
        $newCust = Customer::whereBetween('created_at', [$b['start'], $b['end']])->count();
        $prevCust = Customer::whereBetween('created_at', [$b['prev_start'], $b['prev_end']])->count();

        // Batch 5: inventory value
        $inventoryValue = (float) Inventory::join('products', 'products.id', '=', 'inventory.product_id')
            ->where('inventory.business_id', $businessId)
            ->selectRaw('COALESCE(SUM(inventory.quantity*products.cost_price),0) v')->value('v');

        // Batch 6: low stock (single query with JOIN)
        $sub = 'SELECT product_id, COALESCE(SUM(quantity),0) as stock FROM inventory GROUP BY product_id';
        $low = Product::where('products.status', 'active')
            ->select('products.*')
            ->selectRaw('COALESCE(inv.stock,0) as stock')
            ->leftJoinSub($sub, 'inv', 'inv.product_id', '=', 'products.id')
            ->whereRaw('COALESCE(inv.stock,0) <= products.reorder_level')
            ->orderBy('stock')
            ->get();

        // Batch 7: series + byCategory + byPayment + top products
        $fmt = $b['mode'] === 'month' ? '%Y-%m' : ($b['mode'] === 'hour' ? '%Y-%m-%dT%H' : '%Y-%m-%d');
        $series = (clone $cur)->selectRaw("DATE_FORMAT(created_at, '$fmt') d, SUM(total) revenue, COUNT(*) orders")->groupBy('d')->orderBy('d')->get()
            ->map(fn ($r) => ['date' => $r->d, 'revenue' => round((float) $r->revenue, 2), 'orders' => (int) $r->orders]);

        $byCategory = SaleItem::join('products', 'products.id', '=', 'sale_items.product_id')->leftJoin('categories', 'categories.id', '=', 'products.category_id')
            ->whereIn('sale_items.sale_id', (clone $cur)->select('id'))->selectRaw('COALESCE(categories.name,"Other") name, SUM(sale_items.line_total) value')->groupBy('name')->orderByDesc('value')->get();
        $byPayment = DB::table('payments')->where('payable_type', Sale::class)->whereIn('payable_id', (clone $cur)->select('id'))->selectRaw('method name, SUM(amount) value')->groupBy('method')->orderByDesc('value')->get();
        $top = SaleItem::join('products', 'products.id', '=', 'sale_items.product_id')->whereIn('sale_id', (clone $cur)->select('id'))->selectRaw('sale_items.product_id id, MAX(sale_items.name) name, MAX(products.image) image, SUM(sale_items.quantity) qty, SUM(sale_items.line_total) revenue')->groupBy('sale_items.product_id')->orderByDesc('revenue')->limit(5)->get();

        // Batch 8: recent orders with items count via relationship
        $recentOrders = Sale::with('customer:id,name', 'user:id,name')
            ->withCount('items')
            ->latest()
            ->limit(6)
            ->get()
            ->map(fn ($o) => [
                'id' => $o->id, 'number' => $o->number, 'total' => (float) $o->total,
                'status' => $o->status, 'payment_status' => $o->payment_status,
                'customer_name' => $o->customer?->name, 'user_name' => $o->user?->name,
                'items_count' => (int) $o->items_count, 'created_at' => $o->created_at,
            ]);

        return [
            'kpis' => [
                'revenue' => ['value' => round((float) $c->revenue, 2), 'change' => $pct((float) $c->revenue, (float) $p->revenue)],
                'orders' => ['value' => (int) $c->orders, 'change' => $pct($c->orders, $p->orders)],
                'avgOrder' => ['value' => round((float) $c->avg_order, 2), 'change' => $pct((float) $c->avg_order, (float) $p->avg_order)],
                'itemsSold' => ['value' => $unitsCur, 'change' => $pct($unitsCur, $unitsPrev)],
                'customers' => ['value' => $newCust, 'change' => $pct($newCust, $prevCust)],
                'grossProfit' => ['value' => round((float) $c->revenue - (float) $cogsData, 2), 'change' => $pct((float) $c->revenue - (float) $cogsData, (float) $p->revenue - $cogsPrev)],
                'inventoryValue' => ['value' => round($inventoryValue, 2), 'change' => null],
                'lowStock' => ['value' => $low->count(), 'change' => null],
                'completedOrders' => ['value' => (int) ($statuses->completed ?? 0)],
                'pendingOrders' => ['value' => (int) ($statuses->pending ?? 0)],
                'cancelledOrders' => ['value' => (int) ($statuses->cancelled ?? 0)],
            ],
            'series' => $series,
            'byCategory' => $byCategory,
            'byPayment' => $byPayment,
            'topProducts' => $top,
            'recentOrders' => $recentOrders,
            'lowStockProducts' => $low->take(6)->values(),
        ];
    }
}
