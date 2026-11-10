<?php

namespace App\Models;

use App\Models\Concerns\BelongsToBusiness;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\MorphMany;

class Notification extends Model
{
    use BelongsToBusiness;

    protected $table = 'notifications';
    protected $fillable = ['business_id', 'user_id', 'type', 'title', 'message', 'link', 'read_at'];
    protected $casts = ['read_at' => 'datetime'];

}
