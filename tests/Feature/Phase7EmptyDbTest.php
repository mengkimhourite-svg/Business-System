<?php

namespace Tests\Feature;

use Database\Seeders\BusinessSeeder;
use Database\Seeders\PermissionSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Foundation\Testing\TestCase as BaseTestCase;
use Laravel\Sanctum\Sanctum;

/**
 * Phase 7 — Empty Database API QA.
 *
 * Verifies every public/protected endpoint degrades gracefully when the tenant has
 * NO product/customer/sales data (schema present, no demo rows). Uses RefreshDatabase
 * on the disposable sbs_test DB; production `sbs` is never touched.
 */
class Phase7EmptyDbTest extends BaseTestCase
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
        $this->seed([PermissionSeeder::class, BusinessSeeder::class]); // NO demo data
    }

    public function test_empty_lists_return_zero_totals(): void
    {
        Sanctum::actingAs(\App\Models\User::where('email', 'sokha@sbs.com')->firstOrFail(), ['*']);

        // Demo-data resources: no rows expected without DemoDataSeeder.
        foreach (['products', 'categories', 'brands', 'suppliers', 'customers', 'expenses', 'orders'] as $res) {
            $r = $this->getJson("/api/v1/$res");
            $r->assertOk()->assertJsonPath('success', true);
            $r->assertJsonPath('meta.total', 0);
            $this->assertIsArray($r->json('data'), "data should be an array for $res");
            $this->assertCount(0, $r->json('data'), "$res should return no rows on empty DB");
        }

        // Core seeded resources (roles/branches/users come from BusinessSeeder) must still be non-empty & valid.
        $roles = $this->getJson('/api/v1/roles');
        $roles->assertOk()->assertJsonPath('meta.total', 10);
        $users = $this->getJson('/api/v1/users');
        $users->assertOk()->assertJsonPath('meta.total', 8);
    }

    public function test_empty_dashboard_returns_zeroed_kpis(): void
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
        // KPIs must be structured {value, change} and numerically zero on empty DB
        foreach (['revenue', 'orders', 'avgOrder', 'itemsSold', 'customers', 'grossProfit', 'inventoryValue', 'lowStock'] as $k) {
            $this->assertArrayHasKey('value', $data['kpis'][$k] ?? [], "kpi.$k.value missing");
            $this->assertIsNumeric($data['kpis'][$k]['value'], "kpi.$k.value should be numeric");
        }
        $this->assertSame(0.0, (float) $data['kpis']['revenue']['value']);
        $this->assertSame(0, (int) $data['kpis']['orders']['value']);
        $this->assertCount(0, $data['recentOrders']);
    }

    public function test_empty_reports_return_zeroed_overview(): void
    {
        Sanctum::actingAs(\App\Models\User::where('email', 'sokha@sbs.com')->firstOrFail(), ['*']);
        $r = $this->getJson('/api/v1/reports/overview?range=last90');
        $r->assertOk()->assertJsonPath('success', true);
        $data = $r->json('data');
        foreach (['sales', 'profit', 'inventory', 'expenses', 'payments'] as $k) {
            $this->assertArrayHasKey($k, $data, "reports.overview should include $k");
        }
    }

    public function test_empty_auth_me_still_returns_business(): void
    {
        Sanctum::actingAs(\App\Models\User::where('email', 'sokha@sbs.com')->firstOrFail(), ['*']);
        $r = $this->getJson('/api/v1/auth/me');
        $r->assertOk();
        $this->assertNotNull($r->json('data.business_id'));
        $this->assertSame('super_admin', $r->json('data.role.slug'));
    }

    public function test_empty_ai_chat_degrades_without_crashing(): void
    {
        // AI bridge is network-backed with a timeout; fake the FastAPI response to keep this offline.
        \Illuminate\Support\Facades\Http::fake(['*/api/ai/chatbot' => \Illuminate\Support\Facades\Http::response([
            'success' => true,
            'data' => ['type' => 'insight', 'intent' => 'sales_today', 'title' => 'Today', 'summary' => 'No sales yet', 'metrics' => [], 'alerts' => [], 'recommendations' => [], 'follow_ups' => []],
        ])]);
        Sanctum::actingAs(\App\Models\User::where('email', 'sokha@sbs.com')->firstOrFail(), ['*']);
        $r = $this->postJson('/api/v1/ai/chat', ['message' => "what are today's sales?"]);
        $r->assertOk()->assertJsonPath('data.intent', 'sales_today');
        // A subsequent real call on an empty tenant should still 503 gracefully if service is down (validation first).
        $this->postJson('/api/v1/ai/chat', ['message' => ''])->assertStatus(422);
    }
}
