<?php

namespace Tests\Feature;

use Illuminate\Support\Facades\Http;
use Tests\TestCase;

class AiBridgeTest extends TestCase
{
    public function test_chat_forwards_authorized_snapshot_to_fastapi_and_returns_insight(): void
    {
        Http::fake(['*/api/ai/chatbot' => Http::response(['success' => true, 'data' => ['type' => 'insight', 'intent' => 'sales_today', 'title' => "Today's sales", 'summary' => 'ok', 'metrics' => [], 'alerts' => [], 'recommendations' => [], 'follow_ups' => []]])]);
        $this->actingAsRole('vanna@sbs.com');
        $this->postJson('/api/v1/ai/chat', ['message' => "what are today's sales?", 'page' => 'dashboard'])->assertOk()->assertJsonPath('data.intent', 'sales_today');
        Http::assertSent(function ($request) {
            $body = $request->data();
            return isset($body['context']['business_name'], $body['products'], $body['series']) && !str_contains(json_encode($body), 'password') && !isset($body['ai_api_key']);
        });
    }

    public function test_ai_requires_permission_and_handles_service_outage(): void
    {
        $this->actingAsRole('rithy@sbs.com'); // sales role has ai.view? yes → test with a role lacking it
        \App\Models\Role::where('slug', 'sales')->first()->permissions()->detach(\App\Models\Permission::where('name', 'ai.view')->first()->id);
        $this->postJson('/api/v1/ai/chat', ['message' => 'hi'])->assertStatus(403);

        Http::fake(fn () => throw new \Illuminate\Http\Client\ConnectionException('down'));
        $this->actingAsRole('sokha@sbs.com');
        $this->postJson('/api/v1/ai/chat', ['message' => 'hi'])->assertStatus(503)->assertJsonPath('message', 'AI service is unavailable. Please try again later.');
    }
}
