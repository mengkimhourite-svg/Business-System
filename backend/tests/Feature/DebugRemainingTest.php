<?php

namespace Tests\Feature;

use App\Models\Business;
use App\Models\Product;
use Tests\TestCase;

class DebugRemainingTest extends TestCase
{
    public function test_logout_debug(): void
    {
        $loginRes = $this->postJson('/api/v1/auth/login', ['email' => 'piseth@sbs.com', 'password' => 'password']);
        $token = $loginRes->json('data.token');

        $meRes = $this->withToken($token)->getJson('/api/v1/auth/me');
        $this->assertEquals(200, $meRes->status(), 'ME failed: ' . $meRes->getContent());

        $logoutRes = $this->withToken($token)->postJson('/api/v1/auth/logout');
        echo "Logout status: " . $logoutRes->status() . "\n";
        echo "Logout body: " . $logoutRes->getContent() . "\n";

        $meRes2 = $this->withToken($token)->getJson('/api/v1/auth/me');
        echo "ME after logout status: " . $meRes2->status() . "\n";
    }

    public function test_product_crud_debug(): void
    {
        $this->actingAsRole('sokha@sbs.com');
        $res = $this->postJson('/api/v1/products', ['name' => 'Test Item', 'sku' => 'SKU-T1', 'category_id' => 1, 'cost_price' => 1, 'selling_price' => 2.5, 'stock' => 7]);
        echo "Create status: " . $res->status() . "\n";
        echo "Create body: " . $res->getContent() . "\n";
    }

    public function test_isolation_debug(): void
    {
        $other = Business::create(['name' => 'Other Shop']);
        $foreign = Product::withoutGlobalScopes()->create(['business_id' => $other->id, 'name' => 'Foreign', 'sku' => 'F-1', 'cost_price' => 1, 'selling_price' => 2]);
        $this->actingAsRole('sokha@sbs.com');
        $res = $this->getJson("/api/v1/products/{$foreign->id}");
        echo "Show status: " . $res->status() . "\n";
        echo "Show body: " . $res->getContent() . "\n";
    }

    public function test_role_delete_debug(): void
    {
        $admin = $this->actingAsRole('sokha@sbs.com');
        echo "admin role_id type: " . gettype($admin->role_id) . " value: " . $admin->role_id . "\n";
        echo "admin id type: " . gettype($admin->id) . " value: " . $admin->id . "\n";

        $res = $this->deleteJson("/api/v1/roles/{$admin->role_id}");
        echo "Role delete status: " . $res->status() . "\n";
        echo "Role delete body: " . $res->getContent() . "\n";

        $res2 = $this->deleteJson("/api/v1/users/{$admin->id}");
        echo "User delete status: " . $res2->status() . "\n";
        echo "User delete body: " . $res2->getContent() . "\n";
    }
}
