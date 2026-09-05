<?php

namespace App\Models;

use App\Models\Concerns\BelongsToBusiness;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\MorphMany;

class Purchase extends Model
{
    use BelongsToBusiness;

    protected $table = 'purchases';
    protected $fillable = ['business_id', 'branch_id', 'supplier_id', 'user_id', 'number', 'total', 'currency', 'exchange_rate', 'status', 'payment_status', 'expected_at', 'received_at', 'note'];
    protected $casts = ['total' => 'decimal:2', 'exchange_rate' => 'decimal:6', 'expected_at' => 'date', 'received_at' => 'datetime'];

    public function items(): HasMany { return $this->hasMany(PurchaseItem::class); }
    public function supplier(): BelongsTo { return $this->belongsTo(Supplier::class); }
    public function branch(): BelongsTo { return $this->belongsTo(Branch::class); }
    public function payments(): MorphMany { return $this->morphMany(Payment::class, 'payable'); }
}
