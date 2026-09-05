<?php

namespace App\Support;

use Illuminate\Http\JsonResponse;
use Illuminate\Http\Resources\Json\ResourceCollection;
use Illuminate\Pagination\LengthAwarePaginator;

/** Standard API envelope: { success, message, data, errors?, meta? } */
class ApiResponse
{
    public static function success(mixed $data = null, string $message = 'Success', int $status = 200): JsonResponse
    {
        return response()->json(['success' => true, 'message' => $message, 'data' => $data], $status);
    }

    public static function paginated(LengthAwarePaginator|ResourceCollection $paginator, string $message = 'Success'): JsonResponse
    {
        $p = $paginator instanceof ResourceCollection ? $paginator->resource : $paginator;
        $items = $paginator instanceof ResourceCollection ? $paginator->collection : $p->items();
        return response()->json([
            'success' => true,
            'message' => $message,
            'data' => $items,
            'meta' => ['current_page' => $p->currentPage(), 'per_page' => $p->perPage(), 'total' => $p->total(), 'last_page' => $p->lastPage()],
        ]);
    }

    public static function error(string $message, int $status = 400, ?array $errors = null): JsonResponse
    {
        $body = ['success' => false, 'message' => $message];
        if ($errors) $body['errors'] = $errors;
        return response()->json($body, $status);
    }
}
