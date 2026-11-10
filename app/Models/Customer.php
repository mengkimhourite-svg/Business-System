<?php

namespace App\Models;

use App\Models\Concerns\BelongsToBusiness;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\MorphMany;

class Customer extends Model
{
    use BelongsToBusiness;

    protected $table = 'customers';
    protected $fillable = ['business_id', 'name', 'email', 'phone', 'address', 'type', 'status'];
    protected $casts = [];

    public function sales(): HasMany { return $this->hasMany(Sale::class); }
}
