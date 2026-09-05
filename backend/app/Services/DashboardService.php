<?php

namespace App\Services;

use App\Models\Customer;
use App\Models\Inventory;
use App\Models\Product;
use App\Models\Sale;
use App\Models\SaleItem;
use Illuminate\Support\Facades\DB;

/** Aggregated dashboard metrics — grouped SQL, no N+1. Amounts in base currency. */
class DashboardService
{
    public function __construct(private PeriodService $period) {}

    public function summary(int $businessId, string $range, ?string $from, ?string $to, ?int $branchId = null): array
    {
        $b = $this->period->bounds($range, $from, $to);
        $base = fn () => Sale::query()->where('status', '!=', 'cancelled')->when($branchId, fn ($q) => $q->where('branch_id', $branchId));
        $cur = $base()->whereBetween('created_at', [$b['start'], $b['end']]);
        $prev = $base()->whereBetween('created_at', [$b['prev_start'], $b['prev_end']]);

        $agg = fn ($q) => (clone $q)->selectRaw('COALESCE(SUM(total),0) revenue, COUNT(*) orders, COALESCE(AVG(total),0) avg_order')->first();
        $c = $agg($cur);
        $p = $agg($prev);
        $units = fn ($q) => (float) SaleItem::whereIn('sale_id', (clone $q)->select('id'))->sum('quantity');
        $cogs = fn ($q) => (float) SaleItem::whereIn('sale_id', (clone $q)->select('id'))->selectRaw('COALESCE(SUM(quantity*unit_cost),0) v')->value('v');
        $newCustomers = fn ($s, $e) => Customer::whereBetween('created_at', [$s, $e])->count();
        $pct = fn ($a, $x) => $x ? round(($a - $x) / $x * 100, 1) : ($a ? 100 : 0);

        $inventoryValue = (float) Inventory::join('products', 'products.id', '=', 'inventory.product_id')->where('inventory.business_id', $businessId)->selectRaw('COALESCE(SUM(inventory.quantity*products.cost_price),0) v')->value('v');
        $low = Product::where('status', 'active')->withSum('inventory as stock', 'quantity')->get()->filter(fn ($pr) => (float) $pr->stock <= (float) $pr->reorder_level)->sortBy('stock');

        $fmt = $b['mode'] === 'month' ? '%Y-%m' : ($b['mode'] === 'hour' ? '%Y-%m-%dT%H' : '%Y-%m-%d');
        $series = (clone $cur)->selectRaw("DATE_FORMAT(created_at, '$fmt') d, SUM(total) revenue, COUNT(*) orders")->groupBy('d')->orderBy('d')->get()
            ->map(fn ($r) => ['date' => $r->d, 'revenue' => round((float) $r->revenue, 2), 'orders' => (int) $r->orders]);

        $byCategory = SaleItem::join('products', 'products.id', '=', 'sale_items.product_id')->leftJoin('categories', 'categories.id', '=', 'products.category_id')
            ->whereIn('sale_items.sale_id', (clone $cur)->select('id'))->selectRaw('COALESCE(categories.name,"Other") name, SUM(sale_items.line_total) value')->groupBy('name')->orderByDesc('value')->get();
        $byPayment = DB::table('payments')->where('payable_type', Sale::class)->whereIn('payable_id', (clone $cur)->select('id'))->selectRaw('method name, SUM(amount) value')->groupBy('method')->orderByDesc('value')->get();
        $top = SaleItem::join('products', 'products.id', '=', 'sale_items.product_id')->whereIn('sale_id', (clone $cur)->select('id'))->selectRaw('sale_items.product_id id, MAX(sale_items.name) name, MAX(products.image) image, SUM(sale_items.quantity) qty, SUM(sale_items.line_total) revenue')->groupBy('sale_items.product_id')->orderByDesc('revenue')->limit(5)->get();

        return [
            'kpis' => [
                'revenue' => ['value' => round((float) $c->revenue, 2), 'change' => $pct((float) $c->revenue, (float) $p->revenue)],
                'orders' => ['value' => (int) $c->orders, 'change' => $pct($c->orders, $p->orders)],
                'avgOrder' => ['value' => round((float) $c->avg_order, 2), 'change' => $pct((float) $c->avg_order, (float) $p->avg_order)],
                'itemsSold' => ['value' => $units($cur), 'change' => $pct($units($cur), $units($prev))],
                'customers' => ['value' => $newCustomers($b['start'], $b['end']), 'change' => $pct($newCustomers($b['start'], $b['end']), $newCustomers($b['prev_start'], $b['prev_end']))],
                'grossProfit' => ['value' => round((float) $c->revenue - $cogs($cur), 2), 'change' => $pct((float) $c->revenue - $cogs($cur), (float) $p->revenue - $cogs($prev))],
                'inventoryValue' => ['value' => round($inventoryValue, 2), 'change' => null],
                'lowStock' => ['value' => $low->count(), 'change' => null],
                'completedOrders' => ['value' => (clone $cur)->where('status', 'completed')->count()],
                'pendingOrders' => ['value' => (clone $cur)->where('status', 'pending')->count()],
                'cancelledOrders' => ['value' => $base()->whereBetween('created_at', [$b['start'], $b['end']])->where('status', 'cancelled')->count()],
            ],
            'series' => $series,
            'byCategory' => $byCategory,
            'byPayment' => $byPayment,
            'topProducts' => $top,
            'recentOrders' => Sale::with('customer:id,name', 'user:id,name')->latest()->limit(6)->get()
                ->map(fn ($o) => array_merge($o->toArray(), [
                    'customer_name' => $o->customer?->name,
                    'items_count' => (int) SaleItem::where('sale_id', $o->id)->count(),
                ])),
            'lowStockProducts' => $low->take(6)->values(),
        ];
    }
}
