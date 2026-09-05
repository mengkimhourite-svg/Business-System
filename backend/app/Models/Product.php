<?php

namespace App\Models;

use App\Models\Concerns\BelongsToBusiness;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\MorphMany;

class Product extends Model
{
    use BelongsToBusiness;

    protected $table = 'products';
    protected $fillable = ['business_id', 'category_id', 'brand_id', 'supplier_id', 'name', 'sku', 'barcode', 'unit', 'cost_price', 'selling_price', 'wholesale_price', 'reorder_level', 'description', 'image', 'status'];
    protected $casts = ['cost_price' => 'decimal:2', 'selling_price' => 'decimal:2', 'wholesale_price' => 'decimal:2', 'reorder_level' => 'decimal:3'];

    public function category(): BelongsTo { return $this->belongsTo(Category::class); }
    public function brand(): BelongsTo { return $this->belongsTo(Brand::class); }
    public function supplier(): BelongsTo { return $this->belongsTo(Supplier::class); }
    public function inventory(): HasMany { return $this->hasMany(Inventory::class); }
    public function movements(): HasMany { return $this->hasMany(InventoryMovement::class); }
    public function saleItems(): HasMany { return $this->hasMany(SaleItem::class); }

    /** Total on-hand across branches (eager-loaded via withSum('inventory as stock', 'quantity')). */
    public function getStockAttribute(): float { return (float) ($this->attributes['stock'] ?? $this->inventory()->sum('quantity')); }
    public function getStockStatusAttribute(): string
    {
        $stock = $this->stock;
        return $stock <= 0 ? 'out_of_stock' : ($stock <= (float) $this->reorder_level ? 'low_stock' : 'in_stock');
    }
}
