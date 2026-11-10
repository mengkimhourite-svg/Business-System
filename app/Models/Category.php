<?php

namespace App\Models;

use App\Models\Concerns\BelongsToBusiness;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\MorphMany;

class Category extends Model
{
    use BelongsToBusiness;

    protected $table = 'categories';
    protected $fillable = ['business_id', 'name', 'description', 'status'];
    protected $casts = [];

    public function products(): HasMany { return $this->hasMany(Product::class); }
}
