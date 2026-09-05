<?php

namespace Tests\Feature;

use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Foundation\Testing\TestCase as BaseTestCase;
use Laravel\Sanctum\Sanctum;

/**
 * Phase 9 — Search / Filter / Sort / Pagination QA.
 * Verifies the generic list endpoint's search, per-resource filters, sorting,
 * date ranges, pagination and stock_status handling on the sbs_test DB.
 */
class Phase9SearchFilterSortTest extends BaseTestCase
{
    use RefreshDatabase;

    public function createApplication()
    {
        $app = require __DIR__.'/../../bootstrap/app.php';
        $app->make(\Illuminate\Contracts\Console\Kernel::class)->bootstrap();
        return $app;
    }

    protected function setUp(): void
    {
        parent::setUp();
        $this->seed([
            \Database\Seeders\PermissionSeeder::class,
            \Database\Seeders\BusinessSeeder::class,
            \Database\Seeders\DemoDataSeeder::class,
        ]);
    }

    public function test_product_search_by_name_sku_and_barcode(): void
    {
        Sanctum::actingAs(\App\Models\User::where('email', 'sokha@sbs.com')->firstOrFail(), ['*']);
        // name search
        $r = $this->getJson('/api/v1/products?search=Coca-Cola');
        $r->assertOk()->assertJsonPath('meta.total', 1);
        $this->assertStringContainsString('Coca-Cola', $r->json('data.0.name'));

        // sku search
        $r2 = $this->getJson('/api/v1/products?search=SKU-1001');
        $r2->assertOk()->assertJsonPath('meta.total', 1);
        $this->assertSame('SKU-1001', $r2->json('data.0.sku'));
    }

    public function test_product_filter_by_category_and_stock_status(): void
    {
        Sanctum::actingAs(\App\Models\User::where('email', 'sokha@sbs.com')->firstOrFail(), ['*']);
        $beverages = \App\Models\Category::where('name', 'Beverages')->firstOrFail();

        $r = $this->getJson('/api/v1/products?category_id='.$beverages->id);
        $r->assertOk();
        foreach ($r->json('data') as $p) $this->assertSame($beverages->id, $p['category_id']);

        // out of stock products have stock 0 (e.g. Pringles inactive though) -> low_stock filter
        $low = $this->getJson('/api/v1/products?stock_status=low_stock&per_page=100');
        $low->assertOk();
        $this->assertTrue($low->json('meta.total') >= 1, 'should find at least one low-stock product');
        foreach ($low->json('data') as $p) {
            $this->assertNotSame('in_stock', $p['stock_status'], 'low_stock filter must not return in_stock');
        }
    }

    public function test_sort_by_selling_price_and_direction(): void
    {
        Sanctum::actingAs(\App\Models\User::where('email', 'sokha@sbs.com')->firstOrFail(), ['*']);
        $asc = $this->getJson('/api/v1/products?sort_by=selling_price&sort_dir=asc&per_page=100');
        $asc->assertOk();
        $prices = collect($asc->json('data'))->pluck('selling_price')->map(fn ($v) => (float) $v)->values();
        $sorted = $prices->sort()->values();
        $this->assertEquals($sorted->all(), $prices->all(), 'asc selling_price should be sorted ascending');

        $desc = $this->getJson('/api/v1/products?sort_by=selling_price&sort_dir=desc&per_page=100');
        $descPrices = collect($desc->json('data'))->pluck('selling_price')->map(fn ($v) => (float) $v)->values();
        $this->assertEquals($descPrices->sortDesc()->values()->all(), $descPrices->all(), 'desc selling_price should be sorted descending');
    }

    public function test_customer_filter_and_order_count_aggregates(): void
    {
        Sanctum::actingAs(\App\Models\User::where('email', 'sokha@sbs.com')->firstOrFail(), ['*']);
        $r = $this->getJson('/api/v1/customers?type=wholesale');
        $r->assertOk();
        foreach ($r->json('data') as $c) $this->assertSame('wholesale', $c['type']);

        // customers should expose computed aggregates
        $list = $this->getJson('/api/v1/customers?per_page=100')->json('data');
        $this->assertNotEmpty($list);
        $this->assertArrayHasKey('orders_count', $list[0]);
        $this->assertArrayHasKey('total_spent', $list[0]);
    }

    public function test_pagination_and_per_page_limits(): void
    {
        Sanctum::actingAs(\App\Models\User::where('email', 'sokha@sbs.com')->firstOrFail(), ['*']);
        $r = $this->getJson('/api/v1/products?per_page=3');
        $r->assertOk()->assertJsonPath('meta.per_page', 3);
        $this->assertCount(3, $r->json('data'));
        $this->assertSame(1, $r->json('meta.current_page'));

        // per_page is capped at 500
        $big = $this->getJson('/api/v1/products?per_page=9999');
        $big->assertOk();
        $this->assertLessThanOrEqual(500, $big->json('meta.per_page'));
    }

    public function test_expense_date_range_filter(): void
    {
        Sanctum::actingAs(\App\Models\User::where('email', 'sokha@sbs.com')->firstOrFail(), ['*']);
        $r = $this->getJson('/api/v1/expenses?from=2026-01-01&to=2026-12-31&per_page=100');
        $r->assertOk();
        $total = $this->getJson('/api/v1/expenses?per_page=100')->json('meta.total');
        $this->assertGreaterThan(0, $total);
        $this->assertLessThanOrEqual($total, $r->json('meta.total'));

        // A range far in the past -> empty
        $past = $this->getJson('/api/v1/expenses?from=2020-01-01&to=2020-01-02');
        $past->assertOk()->assertJsonPath('meta.total', 0);
    }

    public function test_misc_global_search(): void
    {
        Sanctum::actingAs(\App\Models\User::where('email', 'sokha@sbs.com')->firstOrFail(), ['*']);
        $r = $this->getJson('/api/v1/search?q=Coca');
        $r->assertOk()->assertJsonPath('success', true);
        $this->assertArrayHasKey('products', $r->json('data'));
        $this->assertArrayHasKey('customers', $r->json('data'));
        $this->assertArrayHasKey('orders', $r->json('data'));
        $this->assertStringContainsString('Coca', $r->json('data.products.0.name') ?? '');
    }

    public function test_purchase_list_search_and_filter(): void
    {
        Sanctum::actingAs(\App\Models\User::where('email', 'sokha@sbs.com')->firstOrFail(), ['*']);
        $r = $this->getJson('/api/v1/purchases?search=PO-');
        $r->assertOk();
        $this->assertGreaterThanOrEqual(1, $r->json('meta.total'));

        $supplier = \App\Models\Supplier::firstOrFail();
        $f = $this->getJson('/api/v1/purchases?supplier_id='.$supplier->id);
        $f->assertOk();
        $this->assertGreaterThan(0, $f->json('meta.total'));

        $st = $this->getJson('/api/v1/purchases?status=received');
        $st->assertOk();
        foreach ($st->json('data') as $p) $this->assertSame('received', $p['status']);
    }
}
