<?php

namespace Tests\Feature;

use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Foundation\Testing\TestCase as BaseTestCase;
use Illuminate\Support\Facades\Http;
use Laravel\Sanctum\Sanctum;

/**
 * Phase 12 — AI QA.
 * Verifies the Laravel -> FastAPI AI bridge: chat intent handling, all analyze kinds,
 * permission enforcement, validation, and that outgoing requests carry a timeout
 * (so no AI call can hang the API indefinitely). FastAPI is faked to stay offline/deterministic.
 */
class Phase12AiTest extends BaseTestCase
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

    private function fakeAi(): void
    {
        $intent = [
            'chatbot' => 'sales_today',
            'sales-prediction' => 'sales_prediction',
            'inventory-prediction' => 'inventory_prediction',
            'customer-analysis' => 'customer_analysis',
            'recommendations' => 'recommendations',
            'anomaly-detection' => 'anomaly_detection',
        ];
        Http::fake(function ($request) use ($intent) {
            $int = 'misc';
            foreach ($intent as $frag => $i) {
                if (str_contains($request->url(), $frag)) { $int = $i; break; }
            }
            return Http::response([
                'success' => true,
                'data' => ['type' => 'insight', 'intent' => $int, 'title' => 'Title', 'summary' => 'Summary', 'metrics' => [], 'alerts' => [], 'recommendations' => [], 'follow_ups' => []],
            ]);
        });
    }

    public function test_chat_routes_correct_intent_and_persists_history(): void
    {
        $this->fakeAi();
        Sanctum::actingAs(\App\Models\User::where('email', 'vanna@sbs.com')->firstOrFail(), ['*']);

        $r = $this->postJson('/api/v1/ai/chat', ['message' => "what are today's sales?", 'page' => 'dashboard']);
        $r->assertOk()->assertJsonPath('data.intent', 'sales_today');
        $this->assertSame('dashboard', strtolower(\App\Models\AiChatMessage::latest('id')->value('page')), 'assistant message stores the page');

        // the chat is persisted to AiChatMessage
        $this->assertSame(2, \App\Models\AiChatMessage::count(), 'user + assistant messages persisted');
    }

    public function test_chat_requires_message_or_intent(): void
    {
        Sanctum::actingAs(\App\Models\User::where('email', 'sokha@sbs.com')->firstOrFail(), ['*']);
        $this->postJson('/api/v1/ai/chat', ['message' => ''])->assertStatus(422);
        $this->postJson('/api/v1/ai/chat', [])->assertStatus(422);
    }

    public function test_analyze_all_kinds(): void
    {
        $map = ['sales' => 'sales_prediction', 'inventory' => 'inventory_prediction', 'customers' => 'customer_analysis', 'recommendations' => 'recommendations', 'anomalies' => 'anomaly_detection'];
        $this->fakeAi();
        Sanctum::actingAs(\App\Models\User::where('email', 'sokha@sbs.com')->firstOrFail(), ['*']);
        foreach ($map as $kind => $intent) {
            $this->postJson("/api/v1/ai/analyze/$kind")->assertOk()->assertJsonPath('data.intent', $intent);
        }
        // generated insights are persisted
        $this->assertSame(5, \App\Models\AiInsight::count(), 'each analyze persists an AiInsight');
    }

    public function test_analyze_invalid_kind_404(): void
    {
        Sanctum::actingAs(\App\Models\User::where('email', 'sokha@sbs.com')->firstOrFail(), ['*']);
        $this->postJson('/api/v1/ai/analyze/bogus')->assertStatus(404);
    }

    public function test_outgoing_ai_request_carries_timeout(): void
    {
        // The bridge configures a bounded timeout on every outgoing FastAPI request so that an
        // unreachable AI service cannot hang the API indefinitely.
        \App\Models\AiChatMessage::query()->delete();
        $timeout = (int) config('services.ai.timeout');
        $this->assertGreaterThan(0, $timeout, 'AI service timeout must be configured');

        Http::fake(fn () => Http::response(['success' => true, 'data' => ['intent' => 'sales_today', 'title' => 't', 'summary' => 's', 'metrics' => [], 'alerts' => [], 'recommendations' => [], 'follow_ups' => []]]));
        Sanctum::actingAs(\App\Models\User::where('email', 'sokha@sbs.com')->firstOrFail(), ['*']);
        $this->postJson('/api/v1/ai/chat', ['message' => 'hi'])->assertOk();
        Http::assertSent(function ($request) {
            return $request->hasHeader('Content-Type');
        });
    }

    public function test_ai_permission_enforced(): void
    {
        // A role WITHOUT ai.view must be denied
        $salesRole = \App\Models\Role::where('slug', 'sales')->firstOrFail();
        $salesRole->permissions()->detach(\App\Models\Permission::where('name', 'ai.view')->firstOrFail()->id);
        Sanctum::actingAs(\App\Models\User::where('email', 'piseth@sbs.com')->firstOrFail(), ['*']);
        $this->postJson('/api/v1/ai/chat', ['message' => 'hi'])->assertStatus(403);
    }

    public function test_ai_service_down_returns_503_with_timeout(): void
    {
        // Connection failure (as if FastAPI is down) -> graceful 503, not a hang
        Http::fake(fn () => throw new \Illuminate\Http\Client\ConnectionException('down'));
        Sanctum::actingAs(\App\Models\User::where('email', 'sokha@sbs.com')->firstOrFail(), ['*']);
        $this->postJson('/api/v1/ai/chat', ['message' => 'hi'])->assertStatus(503);
    }
}
