<?php

namespace App\Models;

use App\Models\Concerns\BelongsToBusiness;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\MorphMany;

class Supplier extends Model
{
    use BelongsToBusiness;

    protected $table = 'suppliers';
    protected $fillable = ['business_id', 'name', 'contact_name', 'email', 'phone', 'address', 'status'];
    protected $casts = [];

    public function products(): HasMany { return $this->hasMany(Product::class); }
    public function purchases(): HasMany { return $this->hasMany(Purchase::class); }
}
