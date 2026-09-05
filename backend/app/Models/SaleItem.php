<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class SaleItem extends Model
{
    protected $table = 'sale_items';
    protected $fillable = ['sale_id', 'product_id', 'name', 'sku', 'quantity', 'unit_price', 'unit_cost', 'discount', 'line_total'];
    protected $casts = ['quantity' => 'decimal:3', 'unit_price' => 'decimal:2', 'unit_cost' => 'decimal:2', 'discount' => 'decimal:2', 'line_total' => 'decimal:2'];
    public function sale(): BelongsTo { return $this->belongsTo(Sale::class); }
    public function product(): BelongsTo { return $this->belongsTo(Product::class); }
}
