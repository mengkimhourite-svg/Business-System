<?php

namespace App\Models;

use App\Models\Concerns\BelongsToBusiness;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\MorphMany;

class AiInsight extends Model
{
    use BelongsToBusiness;

    protected $table = 'ai_insights';
    protected $fillable = ['business_id', 'type', 'title', 'summary', 'payload', 'source', 'generated_at'];
    protected $casts = ['payload' => 'array', 'generated_at' => 'datetime'];

}
