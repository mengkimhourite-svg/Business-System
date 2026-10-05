<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;

/** Eager-loads role + permissions once after auth, but only when the route uses permission middleware. */
class LoadUserPermissions
{
    public function handle(Request $request, Closure $next)
    {
        $user = $request->user();
        if ($user && !$user->relationLoaded('role.permissions')) {
            $route = $request->route();
            $needsPerms = $route && collect($route->gatherMiddleware())->contains(fn ($m) => is_string($m) && str_starts_with($m, 'permission:'));
            if ($needsPerms) {
                $user->load('role.permissions');
            }
        }
        return $next($request);
    }
}
