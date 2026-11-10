<?php

namespace Tests\Feature;

use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Foundation\Testing\TestCase as BaseTestCase;
use Laravel\Sanctum\Sanctum;

/**
 * Phase 10 — Dashboard QA.
 * Verifies /dashboard shape, KPI-level internal consistency, range handling,
 * branch filtering and the low-stock product list on the sbs_test DB.
 */
class Phase10DashboardTest extends BaseTestCase
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

    public function test_dashboard_full_shape(): void
    {
        Sanctum::actingAs(\App\Models\User::where('email', 'sokha@sbs.com')->firstOrFail(), ['*']);
        $r = $this->getJson('/api/v1/dashboard?range=last30');
        $r->assertOk()->assertJsonPath('success', true);
        $data = $r->json('data');

        $this->assertArrayHasKey('kpis', $data);
        $this->assertArrayHasKey('series', $data);
        $this->assertArrayHasKey('byCategory', $data);
        $this->assertArrayHasKey('byPayment', $data);
        $this->assertArrayHasKey('topProducts', $data);
        $this->assertArrayHasKey('recentOrders', $data);
        $this->assertArrayHasKey('lowStockProducts', $data);

        // KPIs that report a change percentage
        foreach (['revenue', 'orders', 'avgOrder', 'itemsSold', 'customers', 'grossProfit'] as $kpi) {
            $this->assertArrayHasKey('value', $data['kpis'][$kpi], "kpi $kpi has value");
            $this->assertArrayHasKey('change', $data['kpis'][$kpi], "kpi $kpi has change");
        }
        // Inventory/low-stock KPIs carry a change key but may be null
        foreach (['inventoryValue', 'lowStock'] as $kpi) {
            $this->assertArrayHasKey('value', $data['kpis'][$kpi], "kpi $kpi has value");
            $this->assertArrayHasKey('change', $data['kpis'][$kpi], "kpi $kpi has change");
        }
        // Status-count KPIs only expose a value
        foreach (['completedOrders', 'pendingOrders', 'cancelledOrders'] as $kpi) {
            $this->assertArrayHasKey('value', $data['kpis'][$kpi], "kpi $kpi has value");
        }
    }

    public function test_dashboard_with_demo_data_is_nonzero(): void
    {
        Sanctum::actingAs(\App\Models\User::where('email', 'sokha@sbs.com')->firstOrFail(), ['*']);
        $d = $this->getJson('/api/v1/dashboard?range=last30')->json('data');
        // 60 days of demo sales exists, so last30 KPIs should be positive
        $this->assertGreaterThan(0, (float) $d['kpis']['revenue']['value']);
        $this->assertGreaterThan(0, (int) $d['kpis']['orders']['value']);
        $this->assertNotEmpty($d['series'], 'series should have data');
        $this->assertNotEmpty($d['topProducts'], 'topProducts should be non-empty');
        $this->assertNotEmpty($d['recentOrders'], 'recentOrders should be non-empty');
        $this->assertNotEmpty($d['lowStockProducts'], 'demo data has low-stock items');
    }

    public function test_dashboard_top_products_sorted_desc_by_revenue(): void
    {
        Sanctum::actingAs(\App\Models\User::where('email', 'sokha@sbs.com')->firstOrFail(), ['*']);
        $d = $this->getJson('/api/v1/dashboard?range=last30')->json('data');
        $revs = collect($d['topProducts'])->pluck('revenue')->map(fn ($v) => (float) $v)->values();
        $this->assertEquals($revs->sortDesc()->values()->all(), $revs->all(), 'topProducts sorted by revenue desc');
    }

    public function test_dashboard_by_category_and_payment_sum(): void
    {
        Sanctum::actingAs(\App\Models\User::where('email', 'sokha@sbs.com')->firstOrFail(), ['*']);
        $d = $this->getJson('/api/v1/dashboard?range=last30')->json('data');
        $this->assertNotEmpty($d['byCategory'], 'byCategory should have data');
        $this->assertNotEmpty($d['byPayment'], 'byPayment should have data');

        $catSum = collect($d['byCategory'])->sum('value');
        $this->assertGreaterThan(0, (float) $catSum);
        $paySum = collect($d['byPayment'])->sum('value');
        $this->assertGreaterThan(0, (float) $paySum);
    }

    public function test_dashboard_range_and_branch_filter(): void
    {
        Sanctum::actingAs(\App\Models\User::where('email', 'sokha@sbs.com')->firstOrFail(), ['*']);
        // last90 should include all demo sales (60 days) -> >= last30
        $m30 = $this->getJson('/api/v1/dashboard?range=last30')->json('data');
        $m90 = $this->getJson('/api/v1/dashboard?range=last90')->json('data');
        $this->assertGreaterThanOrEqual((float) $m30['kpis']['revenue']['value'], (float) $m90['kpis']['revenue']['value']);

        // custom range over the full demo window
        $custom = $this->getJson('/api/v1/dashboard?range=custom&from=2026-06-01&to=2026-09-04');
        $custom->assertOk()->assertJsonPath('success', true);

        // branch filter (Phnom Penh holds all demo sales)
        $branch = \App\Models\Branch::where('code', 'PP-01')->firstOrFail();
        $byBranch = $this->getJson('/api/v1/dashboard?branch_id='.$branch->id.'&range=last90');
        $byBranch->assertOk();
        $this->assertGreaterThan(0, (float) $byBranch->json('data.kpis.revenue.value'));
    }

    public function test_dashboard_low_stock_products_only(): void
    {
        Sanctum::actingAs(\App\Models\User::where('email', 'sokha@sbs.com')->firstOrFail(), ['*']);
        $d = $this->getJson('/api/v1/dashboard?range=last30')->json('data');
        $list = $d['lowStockProducts'];
        $this->assertNotEmpty($list);
        foreach ($list as $p) {
            $stock = (float) $p['stock'];
            $reorder = (float) $p['reorder_level'];
            $this->assertLessThanOrEqual($reorder, $stock, 'low stock item stock <= reorder_level');
            $this->assertGreaterThan(0, $stock, 'low stock excludes out of stock');
        }
    }
}
