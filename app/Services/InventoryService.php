<?php

namespace App\Services;

use App\Models\Inventory;
use App\Models\InventoryMovement;
use App\Models\Notification;
use App\Models\Product;
use Illuminate\Validation\ValidationException;

class InventoryService
{
    /** Apply a signed quantity change for a product in a branch (row-locked) and record the movement. */
    public function move(Product $product, int $branchId, string $delta, string $type, ?string $reason, ?string $reference, ?int $userId, $source = null): InventoryMovement
    {
        $row = Inventory::withoutGlobalScopes()->lockForUpdate()->firstOrCreate(
            ['branch_id' => $branchId, 'product_id' => $product->id],
            ['business_id' => $product->business_id, 'quantity' => 0]
        );
        $after = bcadd((string) $row->quantity, $delta, 3);
        if (bccomp($after, '0', 3) < 0) {
            throw ValidationException::withMessages(['items' => ["Insufficient stock for {$product->name}."]]);
        }
        $row->update(['quantity' => $after]);

        $movement = InventoryMovement::create([
            'business_id' => $product->business_id, 'branch_id' => $branchId, 'product_id' => $product->id, 'user_id' => $userId,
            'type' => $type, 'quantity' => $delta, 'quantity_after' => $after, 'reason' => $reason, 'reference' => $reference,
            'source_type' => $source ? get_class($source) : null, 'source_id' => $source?->id,
        ]);
        $this->notifyIfLow($product, (float) $after);
        return $movement;
    }

    private function notifyIfLow(Product $product, float $after): void
    {
        if ($after > (float) $product->reorder_level) return;
        $title = $after <= 0 ? "Out of stock: {$product->name}" : "Low stock: {$product->name}";
        $exists = Notification::withoutGlobalScopes()->where('business_id', $product->business_id)->where('title', $title)->whereNull('read_at')->exists();
        if (!$exists) {
            Notification::create(['business_id' => $product->business_id, 'type' => $after <= 0 ? 'danger' : 'warning', 'title' => $title, 'message' => $after <= 0 ? 'Stock reached 0. Consider creating a purchase order.' : "Only {$after} units left (reorder at {$product->reorder_level}).", 'link' => '/inventory']);
        }
    }
}
