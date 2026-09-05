<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\RateLimiter;
use App\Support\ApiResponse;

/** Simple per-user write throttle (defence in depth on top of the global api limiter). */
class ThrottleWrites
{
    public function handle(Request $request, Closure $next, int $max = 60)
    {
        if (!in_array($request->method(), ['POST', 'PUT', 'PATCH', 'DELETE'], true)) {
            return $next($request);
        }
        $key = 'writes:'.($request->user()?->id ?? $request->ip());
        if (RateLimiter::tooManyAttempts($key, $max)) {
            return ApiResponse::error('Too many requests. Please slow down.', 429);
        }
        RateLimiter::hit($key, 60);
        return $next($request);
    }
}
