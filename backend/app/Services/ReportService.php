<?php

namespace App\Services;

use App\Models\Expense;
use App\Models\Inventory;
use App\Models\Product;
use App\Models\Purchase;
use App\Models\Sale;
use App\Models\SaleItem;
use Illuminate\Support\Facades\DB;

class ReportService
{
    public function __construct(private PeriodService $period) {}

    public function overview(string $range, ?string $from, ?string $to): array
    {
        $b = $this->period->bounds($range, $from, $to);
        $sales = Sale::where('sales.status', '!=', 'cancelled')->whereBetween('sales.created_at', [$b['start'], $b['end']]);
        $revenue = (float) (clone $sales)->sum('total');
        $items = SaleItem::whereIn('sale_id', (clone $sales)->select('id'));
        $cogs = (float) (clone $items)->selectRaw('COALESCE(SUM(quantity*unit_cost),0) v')->value('v');
        $expenses = Expense::where('status', '!=', 'rejected')->whereBetween('date', [$b['start']->toDateString(), $b['end']->toDateString()]);
        $expTotal = (float) (clone $expenses)->sum('amount');
        $fmt = $b['mode'] === 'month' ? '%Y-%m' : ($b['mode'] === 'hour' ? '%Y-%m-%dT%H' : '%Y-%m-%d');
        $series = (clone $sales)->selectRaw("DATE_FORMAT(sales.created_at, '$fmt') d, SUM(total) revenue, COUNT(*) orders")->groupBy('d')->orderBy('d')->get()->map(function ($r) use ($fmt) {
            $cogs = (float) SaleItem::join('sales', 'sales.id', '=', 'sale_items.sale_id')->whereRaw("DATE_FORMAT(sales.created_at, '$fmt') = ?", [$r->d])->where('sales.status', '!=', 'cancelled')->selectRaw('COALESCE(SUM(quantity*unit_cost),0) v')->value('v');
            return ['date' => $r->d, 'revenue' => round((float) $r->revenue, 2), 'orders' => (int) $r->orders, 'cogs' => round($cogs, 2), 'profit' => round((float) $r->revenue - $cogs, 2)];
        });

        return [
            'sales' => [
                'revenue' => round($revenue, 2), 'orders' => (clone $sales)->count(), 'unitsSold' => (float) (clone $items)->sum('quantity'),
                'avgOrder' => round((float) (clone $sales)->avg('total') ?: 0, 2), 'series' => $series,
                'topProducts' => (clone $items)->selectRaw('product_id id, MAX(name) name, MAX(sku) sku, SUM(quantity) qty, SUM(line_total) revenue, SUM(line_total - quantity*unit_cost) profit')->groupBy('product_id')->orderByDesc('revenue')->limit(10)->get(),
                'topCustomers' => (clone $sales)->whereNotNull('customer_id')->join('customers', 'customers.id', '=', 'sales.customer_id')->selectRaw('customers.id id, customers.name name, COUNT(*) orders, SUM(total) revenue')->groupBy('customers.id', 'customers.name')->orderByDesc('revenue')->limit(5)->get(),
            ],
            'profit' => ['revenue' => round($revenue, 2), 'cogs' => round($cogs, 2), 'grossProfit' => round($revenue - $cogs, 2), 'expenses' => round($expTotal, 2), 'netProfit' => round($revenue - $cogs - $expTotal, 2), 'margin' => $revenue ? round(($revenue - $cogs) / $revenue * 100, 2) : 0, 'series' => $series],
            'inventory' => [
                'stockValue' => round((float) Inventory::join('products', 'products.id', '=', 'inventory.product_id')->selectRaw('COALESCE(SUM(inventory.quantity*products.cost_price),0) v')->value('v'), 2),
                'retailValue' => round((float) Inventory::join('products', 'products.id', '=', 'inventory.product_id')->selectRaw('COALESCE(SUM(inventory.quantity*products.selling_price),0) v')->value('v'), 2),
                'totalUnits' => (float) Inventory::sum('quantity'),
                'byCategory' => Inventory::join('products', 'products.id', '=', 'inventory.product_id')->leftJoin('categories', 'categories.id', '=', 'products.category_id')->selectRaw('COALESCE(categories.name,"Other") name, SUM(inventory.quantity*products.cost_price) value, SUM(inventory.quantity) units')->groupBy('name')->orderByDesc('value')->get(),
                'lowStock' => Product::where('status', 'active')->withSum('inventory as stock', 'quantity')->get()->filter(fn ($p) => (float) $p->stock > 0 && (float) $p->stock <= (float) $p->reorder_level)->count(),
                'outOfStock' => Product::where('status', 'active')->withSum('inventory as stock', 'quantity')->get()->filter(fn ($p) => (float) $p->stock <= 0)->count(),
            ],
            'expenses' => ['total' => round($expTotal, 2), 'count' => (clone $expenses)->count(), 'byCategory' => (clone $expenses)->selectRaw('category name, SUM(amount) value')->groupBy('category')->orderByDesc('value')->get(), 'list' => (clone $expenses)->with('user:id,name')->latest('date')->limit(10)->get()],
            'purchases' => ['total' => round((float) Purchase::where('status', '!=', 'cancelled')->whereBetween('created_at', [$b['start'], $b['end']])->sum('total'), 2), 'count' => Purchase::whereBetween('created_at', [$b['start'], $b['end']])->count()],
            'payments' => DB::table('payments')->whereIn('payable_id', (clone $sales)->select('id'))->where('payable_type', Sale::class)->selectRaw('method, SUM(amount) amount, COUNT(*) count')->groupBy('method')->get(),
        ];
    }
}
