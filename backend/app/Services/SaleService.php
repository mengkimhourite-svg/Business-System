<?php

namespace App\Services;

use App\Models\Branch;
use App\Models\Customer;
use App\Models\Product;
use App\Models\Sale;
use App\Models\SaleItem;
use App\Models\User;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

/**
 * POS checkout. The server recomputes EVERY money value from the database (prices, stock, tax, rate);
 * client-provided totals are ignored. Idempotency key prevents duplicate submissions.
 */
class SaleService
{
    public function __construct(private CurrencyService $currency, private InventoryService $inventory) {}

    public function checkout(User $user, array $data): Sale
    {
        $business = $user->business;
        $branchId = (int) ($data['branch_id'] ?? $user->branch_id);
        if (!$branchId) throw ValidationException::withMessages(['branch_id' => ['A branch is required.']]);
        $branch = Branch::whereKey($branchId)->where('business_id', $business->id)->where('status', 'active')->first();
        if (!$branch) throw ValidationException::withMessages(['branch_id' => ['Invalid or inactive branch.']]);

        if (!empty($data['idempotency_key'])) {
            $existing = Sale::where('idempotency_key', $data['idempotency_key'])->first();
            if ($existing) return $existing->load('items', 'payments', 'customer', 'user', 'branch');
        }

        $payCurrency = $this->currency->normalize($data['currency'] ?? $business->currency);
        $rate = $this->currency->currentRate($business); // server rate — never trust the client's rate
        $taxRate = (string) $business->tax_rate;
        $discountPct = min(100, max(0, (float) ($data['discount_percent'] ?? 0)));
        $isWholesale = ($data['mode'] ?? 'standard') === 'wholesale';

        return DB::transaction(function () use ($user, $business, $branchId, $data, $payCurrency, $rate, $taxRate, $discountPct, $isWholesale) {
            $subtotal = '0.00';
            $lines = [];

            // Batch fetch all products at once instead of one-by-one
            $productIds = array_column($data['items'], 'product_id');
            $products = Product::whereIn('id', $productIds)->where('status', 'active')->lockForUpdate()->get()->keyBy('id');

            foreach ($data['items'] as $item) {
                /** @var Product $product */
                $product = $products->get($item['product_id']);
                if (!$product) throw ValidationException::withMessages(['items' => ['Product not found or inactive.']]);
                $qty = $this->currency->round($item['qty'], 3);
                if (bccomp($qty, '0', 3) <= 0) throw ValidationException::withMessages(['items' => ['Quantity must be greater than zero.']]);
                $unit = $isWholesale && $product->wholesale_price ? (string) $product->wholesale_price : (string) $product->selling_price;
                $lineTotal = $this->currency->round(bcmul($unit, $qty, 6), 2);
                $subtotal = bcadd($subtotal, $lineTotal, 2);
                $lines[] = compact('product', 'qty', 'unit', 'lineTotal');
            }
            $discount = $this->currency->round(bcmul($subtotal, (string) ($discountPct / 100), 6), 2);
            $taxable = bcsub($subtotal, $discount, 2);
            $tax = $this->currency->round(bcmul($taxable, bcdiv($taxRate, '100', 6), 6), 2);
            $total = bcadd($taxable, $tax, 2);

            $customerId = !empty($data['customer_id']) ? Customer::whereKey($data['customer_id'])->value('id') : null;
            $number = 'ORD-'.str_pad((string) ((Sale::withoutGlobalScopes()->where('business_id', $business->id)->max('id') ?? 0) + 10001), 5, '0', STR_PAD_LEFT);

            $saleStatus = 'completed';
            $paymentStatus = 'paid';

            $sale = Sale::create([
                'business_id' => $business->id, 'branch_id' => $branchId, 'customer_id' => $customerId, 'user_id' => $user->id,
                'number' => $number, 'mode' => $data['mode'] ?? 'standard',
                'subtotal' => $subtotal, 'discount' => $discount, 'discount_percent' => $discountPct, 'tax' => $tax, 'tax_rate' => $taxRate, 'total' => $total,
                'currency' => $payCurrency, 'exchange_rate' => $rate, 'total_in_currency' => $this->currency->fromBase($total, $payCurrency, $rate),
                'status' => $saleStatus, 'payment_status' => $paymentStatus, 'idempotency_key' => $data['idempotency_key'] ?? null, 'note' => $data['note'] ?? null,
            ]);

            foreach ($lines as $l) {
                SaleItem::create(['sale_id' => $sale->id, 'product_id' => $l['product']->id, 'name' => $l['product']->name, 'sku' => $l['product']->sku, 'quantity' => $l['qty'], 'unit_price' => $l['unit'], 'unit_cost' => $l['product']->cost_price, 'line_total' => $l['lineTotal']]);
                $this->inventory->move($l['product'], $branchId, '-'.$l['qty'], 'out', 'Sale', $sale->number, $user->id, $sale);
            }

            return $sale->load('items', 'payments', 'customer', 'user', 'branch');
        });
    }

    public function cancel(Sale $sale, User $user): Sale
    {
        if ($sale->status === 'cancelled') return $sale;
        return DB::transaction(function () use ($sale, $user) {
            foreach ($sale->items as $item) {
                if ($item->product) $this->inventory->move($item->product, $sale->branch_id, (string) $item->quantity, 'in', 'Order cancelled', $sale->number, $user->id, $sale);
            }
            $sale->update(['status' => 'cancelled', 'payment_status' => $sale->payment_status === 'paid' ? 'refunded' : $sale->payment_status]);
            return $sale->fresh('items', 'payments');
        });
    }
}
