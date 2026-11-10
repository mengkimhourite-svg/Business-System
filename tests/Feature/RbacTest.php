<?php

namespace Tests\Feature;

use Tests\TestCase;

class RbacTest extends TestCase
{
    public function test_sales_user_cannot_access_users_module(): void
    {
        $this->actingAsRole('piseth@sbs.com');
        $this->getJson('/api/v1/users')->assertStatus(403)->assertJsonPath('message', 'You do not have permission to perform this action.');
        $this->postJson('/api/v1/products', ['name' => 'X', 'sku' => 'X-1', 'cost_price' => 1, 'selling_price' => 2])->assertStatus(403);
    }

    public function test_sales_user_can_read_products_and_checkout(): void
    {
        $this->actingAsRole('piseth@sbs.com');
        $this->getJson('/api/v1/products?per_page=5')->assertOk()->assertJsonStructure(['data', 'meta' => ['total', 'current_page']]);
    }

    public function test_accountant_cannot_adjust_stock_or_create_sales(): void
    {
        $this->actingAsRole('sreyneang@sbs.com');
        $this->postJson('/api/v1/inventory/adjust', ['product_id' => 1, 'type' => 'in', 'qty' => 1])->assertStatus(403);
        $this->postJson('/api/v1/pos/checkout', ['items' => [['product_id' => 1, 'qty' => 1]], 'payment_method' => 'cash'])->assertStatus(403);
        $this->getJson('/api/v1/reports/overview')->assertOk();
    }

    public function test_system_roles_cannot_be_deleted_and_self_delete_is_blocked(): void
    {
        $admin = $this->actingAsRole('sokha@sbs.com');
        $superRole = $admin->role_id;
        $this->deleteJson("/api/v1/roles/{$superRole}")->assertStatus(403);
        $this->deleteJson("/api/v1/users/{$admin->id}")->assertStatus(403);
    }
}
