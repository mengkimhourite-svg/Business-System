<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Models\AiInsight;
use App\Services\AiInsightsAdapter;
use App\Services\AiService;
use App\Support\ApiResponse;
use Illuminate\Http\Request;

/** React → Laravel (auth + RBAC + business scope) → FastAPI. The provider key is never here. */
class AiController extends Controller
{
    public function __construct(private AiService $ai) {}

    public function chat(Request $request)
    {
        $data = $request->validate(['message' => ['nullable', 'string', 'max:2000'], 'intent' => ['nullable', 'string', 'max:40'], 'page' => ['nullable', 'string', 'max:40'], 'language' => ['nullable', 'in:en,km']]);
        abort_if(empty($data['message']) && empty($data['intent']), 422, 'A message is required.');
        return ApiResponse::success($this->ai->chat($request->user(), $data));
    }

    public function analyze(Request $request, string $kind)
    {
        $data = $request->validate(['horizon_days' => ['nullable', 'integer', 'min:1', 'max:90'], 'language' => ['nullable', 'in:en,km']]);
        return ApiResponse::success($this->ai->analyze($request->user(), $kind, $data));
    }

    /** GET /ai/insights — real AI + DB data, adapted to the pinned /ai-insights frontend contract. */
    public function insights(Request $request)
    {
        $user = $request->user();
        $adapter = new AiInsightsAdapter($this->ai);

        // Prefer live FastAPI output; else fall back to the most recent stored AI insights.
        $live = ['generated_at' => null, 'insights' => []];
        try {
            $live = $this->ai->liveInsights($user);
        } catch (\Throwable) {}
        if (empty($live['insights'])) {
            $latest = AiInsight::latest('generated_at')->limit(20)->get()->unique('type')->values();
            $live = [
                'generated_at' => $latest->first()?->generated_at?->toIso8601String() ?? now()->toIso8601String(),
                'insights' => $latest->map(fn ($i) => $i->payload + ['id' => $i->id, 'type' => $i->type])->values()->all(),
            ];
        }

        $snapshot = $this->ai->snapshot($user);
        return ApiResponse::success($adapter->transform($user, $live, $snapshot));
    }
}
