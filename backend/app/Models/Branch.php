<?php

namespace App\Models;

use App\Models\Concerns\BelongsToBusiness;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\MorphMany;

class Branch extends Model
{
    use BelongsToBusiness;

    protected $table = 'branches';
    protected $fillable = ['business_id', 'name', 'code', 'address', 'phone', 'manager', 'status'];
    protected $casts = [];

    public function users(): HasMany { return $this->hasMany(User::class); }
    public function sales(): HasMany { return $this->hasMany(Sale::class); }
    public function purchases(): HasMany { return $this->hasMany(Purchase::class); }
    public function inventory(): HasMany { return $this->hasMany(Inventory::class); }
}
