<?php

namespace Tests\Feature;

use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Foundation\Testing\TestCase as BaseTestCase;
use Laravel\Sanctum\Sanctum;

/**
 * Phase 13 — AI Insights Contract QA.
 * Verifies the Laravel -> FastAPI bridge contract: endpoints exist,
 * response shape matches the /ai-insights frontend contract,
 * and ai.view permission enforcement works.
 */
class Phase13AiInsightsContractTest extends BaseTestCase
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

    public function test_insights_endpoint_returns_200_json_shape(): void
    {
        Sanctum::actingAs(\App\Models\User::where('email', 'sokha@sbs.com')->firstOrFail(), ['*']);
        $r = $this->getJson('/api/v1/ai/insights');
        $r->assertOk();

        $data = $r->json('data');
        // Top-level contract keys the frontend page consumes
        $this->assertArrayHasKey('generated_at', $data, 'data.generated_at present');
        $this->assertArrayHasKey('insights', $data, 'data.insights present');
        $this->assertArrayHasKey('forecast', $data, 'data.forecast present');
        $this->assertIsArray($data['insights'], 'insights is array');
        $this->assertIsArray($data['forecast'] ?? [], 'forecast is array');
    }

    public function test_insights_empty_returns_valid_structure(): void
    {
        \App\Models\AiInsight::query()->delete();
        Sanctum::actingAs(\App\Models\User::where('email', 'sokha@sbs.com')->firstOrFail(), ['*']);
        $r = $this->getJson('/api/v1/ai/insights');
        $r->assertOk();
        $data = $r->json('data');
        $this->assertArrayHasKey('insights', $data);
        $this->assertIsArray($data['insights']);
    }

    public function test_insights_access_control(): void
    {
        $salesRole = \App\Models\Role::where('slug', 'sales')->firstOrFail();
        $salesRole->permissions()->detach(
            \App\Models\Permission::where('name', 'ai.view')->firstOrFail()->id
        );
        Sanctum::actingAs(\App\Models\User::where('email', 'piseth@sbs.com')->firstOrFail(), ['*']);
        $this->getJson('/api/v1/ai/insights')->assertStatus(403);
    }
}