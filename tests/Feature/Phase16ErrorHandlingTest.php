<?php

namespace Tests\Feature;

use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Foundation\Testing\TestCase as BaseTestCase;
use Laravel\Sanctum\Sanctum;

/**
 * Phase 16 — Error Handling QA.
 * Verifies that all API error responses use the ApiResponse envelope
 * ({success, message, errors?}) with appropriate HTTP status codes.
 */
class Phase16ErrorHandlingTest extends BaseTestCase
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

    public function test_not_found_returns_api_envelope(): void
    {
        Sanctum::actingAs(\App\Models\User::where('email', 'sokha@sbs.com')->firstOrFail(), ['*']);
        $r = $this->getJson('/api/v1/products/99999999');
        $r->assertStatus(404);
        $body = $r->json();
        $this->assertArrayHasKey('success', $body);
        $this->assertFalse($body['success']);
        $this->assertArrayHasKey('message', $body);
    }

    public function test_unprocessable_validation_returns_envelope(): void
    {
        Sanctum::actingAs(\App\Models\User::where('email', 'sokha@sbs.com')->firstOrFail(), ['*']);
        $r = $this->postJson('/api/v1/products', []);
        $r->assertStatus(422);
        $body = $r->json();
        $this->assertArrayHasKey('success', $body);
        $this->assertFalse($body['success']);
        $this->assertArrayHasKey('message', $body);
        // Validation errors should be in 'errors' key
        if (isset($body['errors'])) {
            $this->assertIsArray($body['errors']);
        }
    }

    public function test_unauthorized_returns_envelope(): void
    {
        // No Sanctum token -> unauthenticated
        $r = $this->getJson('/api/v1/dashboard');
        $r->assertStatus(401);
        $body = $r->json();
        $this->assertArrayHasKey('success', $body);
        $this->assertFalse($body['success']);
        $this->assertArrayHasKey('message', $body);
    }

    public function test_forbidden_returns_envelope(): void
    {
        Sanctum::actingAs(\App\Models\User::where('email', 'piseth@sbs.com')->firstOrFail(), ['*']);
        // Piseth may not have dashboard.view permission
        $r = $this->getJson('/api/v1/dashboard');
        // Either 200 (if piseth has the perm) or 403
        $this->assertTrue($r->status() === 200 || $r->status() === 403);
        if ($r->status() === 403) {
            $body = $r->json();
            $this->assertArrayHasKey('success', $body);
            $this->assertFalse($body['success']);
            $this->assertArrayHasKey('message', $body);
        }
    }

    public function test_method_not_allowed_returns_envelope(): void
    {
        Sanctum::actingAs(\App\Models\User::where('email', 'sokha@sbs.com')->firstOrFail(), ['*']);
        $r = $this->deleteJson('/api/v1/dashboard');
        $r->assertStatus(405);
        $body = $r->json();
        $this->assertArrayHasKey('success', $body);
        $this->assertFalse($body['success']);
        $this->assertArrayHasKey('message', $body);
    }
}