<?php

namespace App\Exceptions;

use App\Support\ApiResponse;
use Illuminate\Auth\AuthenticationException;
use Illuminate\Auth\Access\AuthorizationException;
use Illuminate\Database\Eloquent\ModelNotFoundException;
use Illuminate\Foundation\Exceptions\Handler as ExceptionHandler;
use Illuminate\Http\Exceptions\ThrottleRequestsException;
use Illuminate\Validation\ValidationException;
use Symfony\Component\HttpKernel\Exception\HttpExceptionInterface;
use Symfony\Component\HttpKernel\Exception\NotFoundHttpException;
use Throwable;

/** Every API error uses the standard envelope; stack traces are never exposed. */
class Handler extends ExceptionHandler
{
    protected $dontFlash = ['current_password', 'password', 'password_confirmation'];

    public function render($request, Throwable $e)
    {
        if (!$request->expectsJson() && !$request->is('api/*')) {
            return parent::render($request, $e);
        }
        return match (true) {
            $e instanceof ValidationException => ApiResponse::error('Validation failed', 422, $e->errors()),
            $e instanceof AuthenticationException => ApiResponse::error('Unauthenticated', 401),
            $e instanceof AuthorizationException => ApiResponse::error('You do not have permission to perform this action.', 403),
            $e instanceof ModelNotFoundException, $e instanceof NotFoundHttpException => ApiResponse::error('Resource not found.', 404),
            $e instanceof ThrottleRequestsException => ApiResponse::error('Too many requests. Please try again later.', 429),
            $e instanceof HttpExceptionInterface => ApiResponse::error($e->getMessage() ?: 'Request failed', $e->getStatusCode()),
            default => $this->renderServerError($e),
        };
    }

    private function renderServerError(Throwable $e)
    {
        report($e);
        return ApiResponse::error(config('app.debug') ? $e->getMessage() : 'Something went wrong. Please try again.', 500);
    }
}
