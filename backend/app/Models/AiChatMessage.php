<?php

namespace App\Models;

use App\Models\Concerns\BelongsToBusiness;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\MorphMany;

class AiChatMessage extends Model
{
    use BelongsToBusiness;

    protected $table = 'ai_chat_messages';
    protected $fillable = ['business_id', 'user_id', 'role', 'content', 'intent', 'payload', 'page'];
    protected $casts = ['payload' => 'array'];

}
