<?php

namespace App\Models;

use App\Models\Concerns\BelongsToBusiness;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\MorphMany;

class Inventory extends Model
{
    use BelongsToBusiness;

    protected $table = 'inventory';
    protected $fillable = ['business_id', 'branch_id', 'product_id', 'quantity'];
    protected $casts = ['quantity' => 'decimal:3'];

    public function product(): BelongsTo { return $this->belongsTo(Product::class); }
    public function branch(): BelongsTo { return $this->belongsTo(Branch::class); }
    public function movements(): HasMany { return $this->hasMany(InventoryMovement::class, 'product_id', 'product_id'); }
}
