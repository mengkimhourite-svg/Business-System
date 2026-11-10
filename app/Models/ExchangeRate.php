<?php

namespace App\Models;

use App\Models\Concerns\BelongsToBusiness;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\MorphMany;

class ExchangeRate extends Model
{
    use BelongsToBusiness;

    protected $table = 'exchange_rates';
    protected $fillable = ['business_id', 'from_currency', 'to_currency', 'rate', 'effective_date', 'created_by'];
    protected $casts = ['rate' => 'decimal:6', 'effective_date' => 'date'];

}
