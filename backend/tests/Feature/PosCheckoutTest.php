<?php

namespace Tests\Feature;

use App\Models\Product;
use App\Models\Sale;
use Tests\TestCase;

class PosCheckoutTest extends TestCase
{
    public function test_checkout_recomputes_totals_updates_stock_and_snapshots_rate(): void
    {
        $this->actingAsRole('piseth@sbs.com');
        $product = Product::where('sku', 'SKU-1001')->firstOrFail(); // Coca-Cola 0.60
        $before = (float) $product->stock;

        $res = $this->postJson('/api/v1/pos/checkout', [
            'items' => [['product_id' => $product->id, 'qty' => 2]],
            'discount_percent' => 5, 'payment_method' => 'cash', 'currency' => 'KHR', 'received' => 10000,
            'total' => 0.01, 'exchange_rate' => 1, // client-supplied values must be ignored
            'idempotency_key' => 'test-key-1',
        ]);
        $res->assertStatus(201)->assertJsonPath('success', true);
        $d = $res->json('data');
        // subtotal 1.20 → discount 0.06 → taxable 1.14 → tax 0.11 → total 1.25 (server math, not client)
        $this->assertSame(1.2, $d['subtotal']);
        $this->assertSame(0.06, $d['discount']);
        $this->assertSame(0.11, $d['tax']);
        $this->assertSame(1.25, $d['total']);
        $this->assertSame('KHR', $d['currency']);
        $this->assertEquals(4047.0, $d['exchange_rate']);           // server rate snapshot
        $this->assertEquals(5059.0, $d['total_in_currency']);       // 1.25 × 4047 rounded to riel
        $this->assertEquals(4941.0, $d['change']);                  // 10000 − 5059, in KHR
        $this->assertSame($before - 2, (float) Product::find($product->id)->stock);

        // Idempotent: same key → same sale, no second stock deduction
        $again = $this->postJson('/api/v1/pos/checkout', ['items' => [['product_id' => $product->id, 'qty' => 2]], 'payment_method' => 'cash', 'idempotency_key' => 'test-key-1']);
        $this->assertSame($d['number'], $again->json('data.number'));
        $this->assertSame($before - 2, (float) Product::find($product->id)->stock);
    }

    public function test_checkout_rejects_insufficient_stock_and_payment(): void
    {
        $this->actingAsRole('piseth@sbs.com');
        $speaker = Product::where('sku', 'SKU-1012')->firstOrFail(); // stock 4
        $this->postJson('/api/v1/pos/checkout', ['items' => [['product_id' => $speaker->id, 'qty' => 5]], 'payment_method' => 'cash'])->assertStatus(422)->assertJsonPath('message', 'Validation failed');
        $this->postJson('/api/v1/pos/checkout', ['items' => [['product_id' => $speaker->id, 'qty' => 1]], 'payment_method' => 'cash', 'received' => 1])->assertStatus(422)->assertJsonPath('errors.received.0', 'Amount received is less than the total.');
    }

    public function test_cancelling_an_order_restores_stock(): void
    {
        $this->actingAsRole('sokha@sbs.com');
        $product = Product::where('sku', 'SKU-1004')->firstOrFail();
        $before = (float) $product->stock;
        $id = $this->postJson('/api/v1/pos/checkout', ['items' => [['product_id' => $product->id, 'qty' => 3]], 'payment_method' => 'card'])->json('data.id');
        $this->assertSame($before - 3, (float) Product::find($product->id)->stock);
        $this->patchJson("/api/v1/orders/{$id}", ['status' => 'cancelled'])->assertOk()->assertJsonPath('data.status', 'cancelled')->assertJsonPath('data.payment_status', 'refunded');
        $this->assertSame($before, (float) Product::find($product->id)->stock);
    }

    public function test_historical_rate_is_preserved_when_business_rate_changes(): void
    {
        $this->actingAsRole('sokha@sbs.com');
        $id = $this->postJson('/api/v1/pos/checkout', ['items' => [['product_id' => Product::first()->id, 'qty' => 1]], 'payment_method' => 'cash', 'currency' => 'KHR'])->json('data.id');
        $this->putJson('/api/v1/settings', ['exchange_rate' => 4100])->assertOk()->assertJsonPath('data.exchange_rate', 4100);
        $this->assertSame(4047.0, (float) Sale::find($id)->exchange_rate);
        $this->assertEquals(4100.0, $this->getJson('/api/v1/settings/public')->json('data.exchange_rate'));
    }
}
