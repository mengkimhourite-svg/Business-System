<?php

namespace App\Models;

use App\Models\Concerns\BelongsToBusiness;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\MorphMany;

class Sale extends Model
{
    use BelongsToBusiness;

    protected $table = 'sales';
    protected $fillable = ['business_id', 'branch_id', 'customer_id', 'user_id', 'number', 'mode', 'subtotal', 'discount', 'discount_percent', 'tax', 'tax_rate', 'total', 'currency', 'exchange_rate', 'total_in_currency', 'status', 'payment_status', 'idempotency_key', 'note'];
    protected $casts = ['subtotal' => 'decimal:2', 'discount' => 'decimal:2', 'discount_percent' => 'decimal:2', 'tax' => 'decimal:2', 'tax_rate' => 'decimal:2', 'total' => 'decimal:2', 'exchange_rate' => 'decimal:6', 'total_in_currency' => 'decimal:2'];

    public function items(): HasMany { return $this->hasMany(SaleItem::class); }
    public function payments(): MorphMany { return $this->morphMany(Payment::class, 'payable'); }
    public function customer(): BelongsTo { return $this->belongsTo(Customer::class); }
    public function user(): BelongsTo { return $this->belongsTo(User::class); }
    public function branch(): BelongsTo { return $this->belongsTo(Branch::class); }
}
