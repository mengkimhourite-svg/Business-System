<?php

namespace Tests\Feature;

use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Foundation\Testing\TestCase as BaseTestCase;
use Laravel\Sanctum\Sanctum;

/**
 * Phase 11 — Reports QA.
 * Verifies /reports/overview shape, internal consistency of profit/sales/inventory,
 * range handling and custom date windows on the sbs_test DB.
 */
class Phase11ReportsTest extends BaseTestCase
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

    public function test_reports_overview_full_shape(): void
    {
        Sanctum::actingAs(\App\Models\User::where('email', 'sokha@sbs.com')->firstOrFail(), ['*']);
        $r = $this->getJson('/api/v1/reports/overview?range=last90');
        $r->assertOk()->assertJsonPath('success', true);
        $data = $r->json('data');

        foreach (['sales', 'profit', 'inventory', 'expenses', 'purchases', 'payments'] as $section) {
            $this->assertArrayHasKey($section, $data, "missing section $section");
        }

        // sales sub-sections
        foreach (['revenue', 'orders', 'unitsSold', 'avgOrder', 'series', 'topProducts', 'topCustomers'] as $k) {
            $this->assertArrayHasKey($k, $data['sales'], "sales.$k missing");
        }
        // profit sub-sections
        foreach (['revenue', 'cogs', 'grossProfit', 'expenses', 'netProfit', 'margin'] as $k) {
            $this->assertArrayHasKey($k, $data['profit'], "profit.$k missing");
        }
        // inventory sub-sections
        foreach (['stockValue', 'retailValue', 'totalUnits', 'byCategory', 'lowStock', 'outOfStock'] as $k) {
            $this->assertArrayHasKey($k, $data['inventory'], "inventory.$k missing");
        }
    }

    public function test_reports_profit_consistency(): void
    {
        Sanctum::actingAs(\App\Models\User::where('email', 'sokha@sbs.com')->firstOrFail(), ['*']);
        $d = $this->getJson('/api/v1/reports/overview?range=last90')->json('data');

        $revenue = (float) $d['sales']['revenue'];
        $cogs = (float) $d['profit']['cogs'];
        $gross = (float) $d['profit']['grossProfit'];
        $expenses = (float) $d['profit']['expenses'];
        $net = (float) $d['profit']['netProfit'];

        $this->assertGreaterThan(0, $revenue, 'revenue nonzero with demo data');
        $this->assertEqualsWithDelta($revenue - $cogs, $gross, 0.01, 'gross = revenue - cogs');
        $this->assertEqualsWithDelta($gross - $expenses, $net, 0.01, 'net = gross - expenses');
    }

    public function test_reports_sales_sections(): void
    {
        Sanctum::actingAs(\App\Models\User::where('email', 'sokha@sbs.com')->firstOrFail(), ['*']);
        $d = $this->getJson('/api/v1/reports/overview?range=last90')->json('data');
        $this->assertGreaterThan(0, (int) $d['sales']['orders']);
        $this->assertGreaterThan(0, (float) $d['sales']['unitsSold']);
        $this->assertNotEmpty($d['sales']['series'], 'series present');
        $this->assertNotEmpty($d['sales']['topProducts'], 'topProducts present');
        $this->assertArrayHasKey('name', $d['sales']['topProducts'][0]);
        $this->assertArrayHasKey('revenue', $d['sales']['topProducts'][0]);
    }

    public function test_reports_range_and_custom(): void
    {
        Sanctum::actingAs(\App\Models\User::where('email', 'sokha@sbs.com')->firstOrFail(), ['*']);
        // last90 should report >= last30 revenue
        $m30 = $this->getJson('/api/v1/reports/overview?range=last30')->json('data');
        $m90 = $this->getJson('/api/v1/reports/overview?range=last90')->json('data');
        $this->assertGreaterThanOrEqual((float) $m30['sales']['revenue'], (float) $m90['sales']['revenue']);

        // custom window covering all demo sales
        $custom = $this->getJson('/api/v1/reports/overview?range=custom&from=2026-06-01&to=2026-09-04');
        $custom->assertOk()->assertJsonPath('success', true);
        $this->assertGreaterThan(0, (float) $custom->json('data.sales.revenue'));
    }

    public function test_reports_expenses_and_purchases(): void
    {
        Sanctum::actingAs(\App\Models\User::where('email', 'sokha@sbs.com')->firstOrFail(), ['*']);
        $d = $this->getJson('/api/v1/reports/overview?range=last90')->json('data');
        $this->assertGreaterThan(0, (float) $d['expenses']['total'], 'expenses nonzero');
        $this->assertGreaterThan(0, (int) $d['expenses']['count']);
        $this->assertNotEmpty($d['expenses']['byCategory']);
        $this->assertGreaterThan(0, (float) $d['purchases']['total'], 'purchases nonzero');
    }
}
