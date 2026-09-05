<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Services\DashboardService;
use App\Services\ReportService;
use App\Support\ApiResponse;
use Illuminate\Http\Request;

class DashboardController extends Controller
{
    public function summary(Request $request, DashboardService $service)
    {
        $data = $request->validate(['range' => ['nullable', 'string', 'max:20'], 'from' => ['nullable', 'date'], 'to' => ['nullable', 'date'], 'branch_id' => ['nullable', 'integer']]);
        return ApiResponse::success($service->summary($request->user()->business_id, $data['range'] ?? 'last30', $data['from'] ?? null, $data['to'] ?? null, $data['branch_id'] ?? null));
    }

    public function reports(Request $request, ReportService $service)
    {
        $data = $request->validate(['range' => ['nullable', 'string', 'max:20'], 'from' => ['nullable', 'date'], 'to' => ['nullable', 'date']]);
        return ApiResponse::success($service->overview($data['range'] ?? 'last30', $data['from'] ?? null, $data['to'] ?? null));
    }
}
