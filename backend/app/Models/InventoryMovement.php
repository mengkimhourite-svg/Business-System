<?php

namespace App\Models;

use App\Models\Concerns\BelongsToBusiness;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\MorphMany;

class InventoryMovement extends Model
{
    use BelongsToBusiness;

    protected $table = 'inventory_movements';
    protected $fillable = ['business_id', 'branch_id', 'product_id', 'user_id', 'type', 'quantity', 'quantity_after', 'reason', 'reference', 'source_type', 'source_id'];
    protected $casts = ['quantity' => 'decimal:3', 'quantity_after' => 'decimal:3'];

    public function product(): BelongsTo { return $this->belongsTo(Product::class); }
    public function branch(): BelongsTo { return $this->belongsTo(Branch::class); }
    public function user(): BelongsTo { return $this->belongsTo(User::class); }
}
