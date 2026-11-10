<?php

namespace App\Models;

use App\Models\Concerns\BelongsToBusiness;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\MorphMany;

class Expense extends Model
{
    use BelongsToBusiness;

    protected $table = 'expenses';
    protected $fillable = ['business_id', 'branch_id', 'user_id', 'reference', 'category', 'amount', 'currency', 'exchange_rate', 'payment_method', 'date', 'status', 'note'];
    protected $casts = ['amount' => 'decimal:2', 'exchange_rate' => 'decimal:6', 'date' => 'date'];

    public function user(): BelongsTo { return $this->belongsTo(User::class); }
}
