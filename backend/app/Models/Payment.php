<?php

namespace App\Models;

use App\Models\Concerns\BelongsToBusiness;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\MorphMany;

class Payment extends Model
{
    use BelongsToBusiness;

    protected $table = 'payments';
    protected $fillable = ['business_id', 'payable_type', 'payable_id', 'user_id', 'method', 'amount', 'received', 'change_given', 'currency', 'exchange_rate', 'reference'];
    protected $casts = ['amount' => 'decimal:2', 'received' => 'decimal:2', 'change_given' => 'decimal:2', 'exchange_rate' => 'decimal:6'];

    public function payable() { return $this->morphTo(); }
}
