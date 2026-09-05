<?php

namespace App\Http\Middleware;

use App\Support\ApiResponse;
use Closure;
use Illuminate\Http\Request;

/** Usage: ->middleware('permission:products.create') — backend RBAC is the source of truth. */
class EnsurePermission
{
    public function handle(Request $request, Closure $next, string ...$permissions)
    {
        $user = $request->user();
        if (!$user || !$user->isActive()) {
            return ApiResponse::error('Unauthenticated', 401);
        }
        if (!$user->hasPermission($permissions)) {
            return ApiResponse::error('You do not have permission to perform this action.', 403);
        }
        return $next($request);
    }
}
