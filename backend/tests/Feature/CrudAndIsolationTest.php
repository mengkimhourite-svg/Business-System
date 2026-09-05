<?php

namespace Tests\Feature;

use App\Models\Business;
use App\Models\Product;
use Tests\TestCase;

class CrudAndIsolationTest extends TestCase
{
    public function test_product_crud_with_validation_and_pagination(): void
    {
        $this->actingAsRole('sokha@sbs.com');
        $this->postJson('/api/v1/products', ['name' => ''])->assertStatus(422)->assertJsonStructure(['errors' => ['name', 'sku']]);
        $created = $this->postJson('/api/v1/products', ['name' => 'Test Item', 'sku' => 'SKU-T1', 'category_id' => 1, 'cost_price' => 1, 'selling_price' => 2.5, 'stock' => 7])->assertStatus(201)->json('data');
        $this->assertSame(7.0, (float) $created['stock']);
        $this->assertSame('low_stock', $created['stock_status']);
        $this->getJson('/api/v1/products?search=Test%20Item&per_page=5')->assertOk()->assertJsonPath('meta.total', 1);
        $this->putJson("/api/v1/products/{$created['id']}", ['name' => 'Test Item 2', 'sku' => 'SKU-T1', 'cost_price' => 1, 'selling_price' => 3])->assertOk()->assertJsonPath('data.name', 'Test Item 2');
        $this->deleteJson("/api/v1/products/{$created['id']}")->assertOk();
        $this->getJson("/api/v1/products/{$created['id']}")->assertStatus(404)->assertJsonPath('message', 'Resource not found.');
    }

    public function test_business_isolation_hides_other_tenants_data(): void
    {
        $other = Business::create(['name' => 'Other Shop']);
        $foreign = Product::withoutGlobalScopes()->create(['business_id' => $other->id, 'name' => 'Foreign', 'sku' => 'F-1', 'cost_price' => 1, 'selling_price' => 2]);
        $this->actingAsRole('sokha@sbs.com');
        $this->getJson("/api/v1/products/{$foreign->id}")->assertStatus(404);
        $this->getJson('/api/v1/products?search=Foreign')->assertOk()->assertJsonPath('meta.total', 0);
    }

    public function test_dashboard_and_reports_return_expected_shape(): void
    {
        $this->actingAsRole('vanna@sbs.com');
        $this->getJson('/api/v1/dashboard?range=last30')->assertOk()->assertJsonStructure(['data' => ['kpis' => ['revenue', 'orders', 'lowStock', 'grossProfit'], 'series', 'byCategory', 'byPayment', 'topProducts', 'recentOrders']]);
        $this->getJson('/api/v1/dashboard?range=custom&from=2026-01-01&to=2026-01-31')->assertOk();
        $this->getJson('/api/v1/reports/overview?range=last90')->assertOk()->assertJsonStructure(['data' => ['sales', 'profit', 'inventory', 'expenses', 'payments']]);
    }

    public function test_preferences_round_trip(): void
    {
        $this->actingAsRole('sokha@sbs.com');
        $this->putJson('/api/v1/preferences/sbs.dashboard', ['value' => ['columns' => 4]])->assertOk();
        $this->getJson('/api/v1/preferences')->assertOk()->assertJsonPath('data.sbs.dashboard.columns', 4);
        $this->putJson('/api/v1/preferences/evil.key', ['value' => 1])->assertStatus(422);
        $this->deleteJson('/api/v1/preferences/sbs.dashboard')->assertOk();
    }
}
