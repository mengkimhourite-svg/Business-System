<?php

namespace App\Models;

use App\Models\Concerns\BelongsToBusiness;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\MorphMany;

class ActivityLog extends Model
{
    use BelongsToBusiness;

    protected $table = 'activity_logs';
    protected $fillable = ['business_id', 'user_id', 'action', 'subject_type', 'subject_id', 'properties', 'ip'];
    protected $casts = ['properties' => 'array'];

}
