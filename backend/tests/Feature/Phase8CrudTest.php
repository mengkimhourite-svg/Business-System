<?php

namespace Tests\Feature;

use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Foundation\Testing\TestCase as BaseTestCase;
use Laravel\Sanctum\Sanctum;

/**
 * Phase 8 — CRUD QA.
 * Full create/read/update/delete cycle for every config-driven resource, verified
 * via the Laravel HTTP kernel (in-process) on the disposable sbs_test DB.
 */
class Phase8CrudTest extends BaseTestCase
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

    public function test_category_brand_supplier_customer_branch_crud(): void
    {
        Sanctum::actingAs(\App\Models\User::where('email', 'sokha@sbs.com')->firstOrFail(), ['*']);

        $flows = [
            'categories' => fn () => ['name' => 'QA Category', 'description' => 'desc'],
            'brands' => fn () => ['name' => 'QA Brand', 'website' => 'https://qa.example.com'],
            'suppliers' => fn () => ['name' => 'QA Supplier', 'contact_name' => 'Bob', 'email' => 'bob@supplier.com', 'phone' => '+855 111'],
            'customers' => fn () => ['name' => 'QA Customer', 'email' => 'qa@customer.com', 'phone' => '+855 222', 'type' => 'wholesale'],
            'branches' => fn () => ['name' => 'QA Branch', 'code' => 'QA-01', 'address' => 'St 1', 'manager' => 'Alice'],
        ];

        foreach ($flows as $res => $make) {
            $created = $make();
            $r = $this->postJson("/api/v1/$res", $created);
            $r->assertStatus(201)->assertJsonPath('success', true);
            $id = $r->json('data.id');
            $this->assertNotNull($id, "$res create should return an id");

            // read
            $this->getJson("/api/v1/$res/$id")->assertOk()->assertJsonPath('data.id', $id);

            // update — resend full required fields (rules are strict on update)
            $updated = $created;
            $updated['name'] = $created['name'].' Updated';
            if ($res === 'branches') $updated['code'] = $created['code'];
            if ($res === 'expenses') $updated['date'] = $created['date'];
            $r2 = $this->putJson("/api/v1/$res/$id", $updated);
            $r2->assertOk()->assertJsonPath('success', true);
            $this->getJson("/api/v1/$res/$id")->assertJsonPath('data.name', $created['name'].' Updated');

            // delete
            $this->deleteJson("/api/v1/$res/$id")->assertOk();
            $this->getJson("/api/v1/$res/$id")->assertStatus(404);
        }
    }

    public function test_product_crud_with_inventory_and_stock(): void
    {
        Sanctum::actingAs(\App\Models\User::where('email', 'sokha@sbs.com')->firstOrFail(), ['*']);

        $r = $this->postJson('/api/v1/products', [
            'name' => 'QA Product', 'sku' => 'SKU-QA-1', 'category_id' => 1, 'cost_price' => 3.5, 'selling_price' => 6.0, 'stock' => 10,
        ]);
        $r->assertStatus(201)->assertJsonPath('success', true);
        $id = $r->json('data.id');
        $this->assertSame(10.0, (float) $r->json('data.stock'), 'opening stock should be set');

        $this->getJson("/api/v1/products/$id")->assertOk()->assertJsonPath('data.sku', 'SKU-QA-1');

        $this->putJson("/api/v1/products/$id", ['name' => 'QA Product 2', 'sku' => 'SKU-QA-1', 'category_id' => 1, 'cost_price' => 3.5, 'selling_price' => 7.5])->assertOk();
        $this->getJson("/api/v1/products/$id")->assertJsonPath('data.name', 'QA Product 2')->assertJsonPath('data.selling_price', '7.50');

        $this->deleteJson("/api/v1/products/$id")->assertOk();
        $this->getJson("/api/v1/products/$id")->assertStatus(404);
    }

    public function test_expense_crud(): void
    {
        Sanctum::actingAs(\App\Models\User::where('email', 'sokha@sbs.com')->firstOrFail(), ['*']);
        $r = $this->postJson('/api/v1/expenses', ['category' => 'utilities', 'amount' => 120.5, 'date' => '2026-09-01']);
        $r->assertStatus(201)->assertJsonPath('success', true);
        $id = $r->json('data.id');
        $this->assertStringStartsWith('EXP-', $r->json('data.reference'), 'expense should get auto reference');
        $this->getJson("/api/v1/expenses/$id")->assertOk()->assertJsonPath('data.amount', '120.50');
        $this->putJson("/api/v1/expenses/$id", ['category' => 'rent', 'amount' => 500, 'date' => '2026-09-01'])->assertOk();
        $this->getJson("/api/v1/expenses/$id")->assertJsonPath('data.category', 'rent');
        $this->deleteJson("/api/v1/expenses/$id")->assertOk();
        $this->getJson("/api/v1/expenses/$id")->assertStatus(404);
    }

    public function test_user_crud(): void
    {
        Sanctum::actingAs(\App\Models\User::where('email', 'sokha@sbs.com')->firstOrFail(), ['*']);
        $roleId = \App\Models\Role::where('slug', 'sales')->firstOrFail()->id;

        $r = $this->postJson('/api/v1/users', ['name' => 'QA User', 'email' => 'qa-user@sbs.com', 'password' => 'secret123', 'role_id' => $roleId]);
        $r->assertStatus(201)->assertJsonPath('success', true);
        $id = $r->json('data.id');

        $this->getJson("/api/v1/users/$id")->assertOk()->assertJsonPath('data.email', 'qa-user@sbs.com');
        $this->putJson("/api/v1/users/$id", ['name' => 'QA User Renamed', 'email' => 'qa-user@sbs.com', 'role_id' => $roleId])->assertOk();
        $this->getJson("/api/v1/users/$id")->assertJsonPath('data.name', 'QA User Renamed');

        $this->deleteJson("/api/v1/users/$id")->assertOk();
        $this->getJson("/api/v1/users/$id")->assertStatus(404);
    }

    public function test_role_crud_with_permissions(): void
    {
        Sanctum::actingAs(\App\Models\User::where('email', 'sokha@sbs.com')->firstOrFail(), ['*']);
        $r = $this->postJson('/api/v1/roles', ['name' => 'QA Role', 'permissions' => ['products.view', 'dashboard.view']]);
        $r->assertStatus(201)->assertJsonPath('success', true);
        $id = $r->json('data.id');
        $this->assertStringEndsWith('qa_role', $r->json('data.slug'), 'role slug should be generated');

        $this->getJson("/api/v1/roles/$id")->assertOk()->assertJsonPath('data.name', 'QA Role');

        $this->putJson("/api/v1/roles/$id", ['name' => 'QA Role 2', 'permissions' => ['products.create']])->assertOk();
        $this->getJson("/api/v1/roles/$id")->assertJsonPath('data.name', 'QA Role 2');

        $this->deleteJson("/api/v1/roles/$id")->assertOk();
        $this->getJson("/api/v1/roles/$id")->assertStatus(404);
    }

    public function test_purchase_crud_and_receive(): void
    {
        Sanctum::actingAs(\App\Models\User::where('email', 'sokha@sbs.com')->firstOrFail(), ['*']);
        $product = \App\Models\Product::firstOrFail();
        $supplier = \App\Models\Supplier::firstOrFail();

        $r = $this->postJson('/api/v1/purchases', [
            'supplier_id' => $supplier->id,
            'items' => [['product_id' => $product->id, 'qty' => 5, 'cost' => 2.0]],
        ]);
        $r->assertStatus(201)->assertJsonPath('success', true);
        $id = $r->json('data.id');
        $this->assertSame(10.0, (float) $r->json('data.total'), 'purchase total = qty*cost');
        $this->assertSame('ordered', $r->json('data.status'));

        $this->getJson("/api/v1/purchases/$id")->assertOk()->assertJsonPath('data.number', $r->json('data.number'));

        // receive adds stock
        $before = (float) $product->fresh()->stock;
        $this->postJson("/api/v1/purchases/$id/receive")->assertOk()->assertJsonPath('data.status', 'received');
        $this->assertSame($before + 5, (float) $product->fresh()->stock, 'receiving increases stock by purchased qty');

        // received purchases cannot be deleted
        $this->deleteJson("/api/v1/purchases/$id")->assertStatus(422);
    }

    public function test_bulk_delete(): void
    {
        Sanctum::actingAs(\App\Models\User::where('email', 'sokha@sbs.com')->firstOrFail(), ['*']);
        $before = $this->getJson('/api/v1/categories')->json('meta.total');
        $a = $this->postJson('/api/v1/categories', ['name' => 'BulkA'])->json('data.id');
        $b = $this->postJson('/api/v1/categories', ['name' => 'BulkB'])->json('data.id');
        $this->postJson('/api/v1/categories/bulk-delete', ['ids' => [$a, $b]])->assertOk()->assertJsonPath('data.deleted', 2);
        $this->assertGreaterThanOrEqual($before, $this->getJson('/api/v1/categories')->json('meta.total'));
        $this->getJson("/api/v1/categories/$a")->assertStatus(404);
        $this->getJson("/api/v1/categories/$b")->assertStatus(404);
    }
}
