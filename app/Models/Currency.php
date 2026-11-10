<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Currency extends Model
{
    protected $table = 'currencies';
    protected $fillable = ['code', 'name', 'symbol', 'decimals', 'is_active'];
    protected $casts = ['is_active' => 'boolean'];
    protected $primaryKey = 'code';
    public $incrementing = false;
    protected $keyType = 'string';
    public $timestamps = false;

}
