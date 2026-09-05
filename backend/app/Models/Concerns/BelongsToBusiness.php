<?php

namespace App\Models\Concerns;

use App\Models\Business;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

/**
 * Business (tenant) isolation: every query is scoped to the authenticated user's business and
 * every created record is stamped with it. Applied automatically as a global scope.
 */
trait BelongsToBusiness
{
    public static function bootBelongsToBusiness(): void
    {
        static::addGlobalScope('business', function (Builder $builder) {
            if ($user = auth('sanctum')->user() ?? auth()->user()) {
                $builder->where($builder->getModel()->getTable().'.business_id', $user->business_id);
            }
        });

        static::creating(function (Model $model) {
            if (empty($model->business_id) && ($user = auth('sanctum')->user() ?? auth()->user())) {
                $model->business_id = $user->business_id;
            }
        });
    }

    public function business(): BelongsTo
    {
        return $this->belongsTo(Business::class);
    }
}
