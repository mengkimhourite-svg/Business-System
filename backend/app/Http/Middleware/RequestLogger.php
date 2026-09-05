<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;

/** Lightweight access logger for API requests. Never logs request bodies or the Authorization header. */
class RequestLogger
{
    public function handle(Request $request, Closure $next)
    {
        $path = $request->path() ?? '/';
        if (!str_starts_with($path, '/api/')) {
            return $next($request);
        }

        $started = microtime(true);
        $response = $next($request);

        $status = $response instanceof \Symfony\Component\HttpFoundation\Response
            ? $response->getStatusCode()
            : 0;
        $ms = (int) round((microtime(true) - $started) * 1000);

        error_log(sprintf('[API] %s %s %d %dms', $request->method(), $path, $status, $ms));

        return $response;
    }
}