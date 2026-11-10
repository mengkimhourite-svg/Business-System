<?php

namespace App\Services;

use App\Models\AiChatMessage;
use App\Models\AiInsight;
use App\Models\Customer;
use App\Models\Expense;
use App\Models\Product;
use App\Models\Sale;
use App\Models\SaleItem;
use App\Models\User;
use Illuminate\Http\Client\ConnectionException;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;
use Symfony\Component\HttpKernel\Exception\HttpException;

/**
 * Laravel -> FastAPI bridge. Laravel authenticates/authorizes the user, builds an aggregated,
 * business-scoped payload (no credentials, no other tenants) and forwards it server-to-server.
 * The AI provider key never leaves the FastAPI host.
 */
class AiService
{
    public function __construct(private PeriodService $period) {}

    public function chat(User $user, array $input): array
    {
        try {
            $snapshot = $this->businessSnapshot($user);
        } catch (\Throwable $e) {
            Log::error('AI chat snapshot failed', ['error' => $e->getMessage()]);
            $snapshot = ['series' => [], 'previous_series' => [], 'today' => ['date' => today()->toDateString(), 'revenue' => 0, 'orders' => 0], 'yesterday' => ['date' => today()->subDay()->toDateString(), 'revenue' => 0, 'orders' => 0], 'products' => [], 'customers' => [], 'transactions' => [], 'expenses_by_category' => []];
        }
        $payload = ['context' => $this->context($user, $input), 'message' => $input['message'] ?? null, 'intent' => $input['intent'] ?? null] + $snapshot;
        Log::debug('AI chat payload sample', [
            'products_count' => count($payload['products']),
            'products_0' => $payload['products'][0] ?? null,
            'customers_count' => count($payload['customers']),
            'customers_0' => $payload['customers'][0] ?? null,
            'product_0_id_type' => gettype($payload['products'][0]['id'] ?? null),
        ]);
        $data = $this->call('/api/ai/chatbot', $payload);

        try {
            AiChatMessage::create(['business_id' => $user->business_id, 'user_id' => $user->id, 'role' => 'user', 'content' => $input['message'] ?? $input['intent'] ?? '', 'intent' => $data['intent'] ?? null, 'page' => $input['page'] ?? null]);
            AiChatMessage::create(['business_id' => $user->business_id, 'user_id' => $user->id, 'role' => 'assistant', 'content' => $data['summary'] ?? null, 'intent' => $data['intent'] ?? null, 'payload' => $data, 'page' => $input['page'] ?? null]);
        } catch (\Throwable $e) {
            Log::warning('AI chat message save failed', ['error' => $e->getMessage()]);
        }
        return $data;
    }

    /** Live insights: call multiple FastAPI endpoints in parallel and merge results. */
    public function liveInsights(User $user): array
    {
        $ctx = $this->context($user, []);
        $snapshot = $this->businessSnapshot($user);
        $payload = ['context' => $ctx] + $snapshot;
        $cfg = config('services.ai');
        $baseUrl = rtrim($cfg['url'], '/');
        $headers = array_filter(['X-Internal-Key' => $cfg['internal_key']]);

        $responses = Http::pool(function ($pool) use ($payload, $headers, $baseUrl, $cfg, $snapshot) {
            $pool->withHeaders($headers)->timeout($cfg['timeout'])->acceptJson()->post("{$baseUrl}/api/ai/recommendations", $payload);
            $pool->withHeaders($headers)->timeout($cfg['timeout'])->acceptJson()->post("{$baseUrl}/api/ai/anomaly-detection", $payload);
            if (!empty($snapshot['products'])) {
                $pool->withHeaders($headers)->timeout($cfg['timeout'])->acceptJson()->post("{$baseUrl}/api/ai/inventory-prediction", $payload);
            }
            if (!empty($snapshot['series'])) {
                $pool->withHeaders($headers)->timeout($cfg['timeout'])->acceptJson()->post("{$baseUrl}/api/ai/sales-prediction", $payload);
            }
        });
        $insights = [];
        foreach ($responses as $key => $res) {
            if ($res->failed()) continue;
            if (!($res->json('success'))) continue;
            $data = $res->json('data') ?? [];
            if ($data) $insights[] = $data;
        }

        return ['generated_at' => now()->toIso8601String(), 'insights' => $insights];
    }

    /** Read-only, authorized business snapshot — additive accessor for isolated transformers (e.g. AiInsightsAdapter). */
    public function snapshot(User $user): array
    {
        return $this->businessSnapshot($user);
    }

    public function analyze(User $user, string $kind, array $extra = []): array
    {
        $endpoint = ['sales' => '/api/ai/sales-prediction', 'inventory' => '/api/ai/inventory-prediction', 'customers' => '/api/ai/customer-analysis', 'recommendations' => '/api/ai/recommendations', 'anomalies' => '/api/ai/anomaly-detection'][$kind] ?? null;
        if (!$endpoint) throw new HttpException(404, 'Resource not found.');
        $data = $this->call($endpoint, ['context' => $this->context($user, $extra)] + $this->businessSnapshot($user) + $extra);
        AiInsight::create(['business_id' => $user->business_id, 'type' => $data['intent'] ?? $kind, 'title' => $data['title'] ?? $kind, 'summary' => $data['summary'] ?? null, 'payload' => $data, 'source' => $data['source'] ?? 'rules', 'generated_at' => now()]);
        return $data;
    }

    private function context(User $user, array $input): array
    {
        $b = $user->business;
        return ['business_name' => $b->name, 'currency' => $b->currency ?: 'USD', 'exchange_rate' => max(1, (float) ($b->exchange_rate ?: 1)), 'language' => $input['language'] ?? 'en', 'role' => $input['role'] ?? $user->role?->slug, 'page' => $input['page'] ?? null, 'window_days' => 30];
    }

    /** Aggregated, authorized data only (scoped by BelongsToBusiness). Cached 60s. */
    private function businessSnapshot(User $user): array
    {
        $cacheKey = "ai:snapshot:{$user->business_id}";

        return Cache::remember($cacheKey, 60, fn () => $this->computeSnapshot($user));
    }

    private function computeSnapshot(User $user): array
    {
        $b = $this->period->bounds('last30');
        $daily = fn ($s, $e) => Sale::where('status', '!=', 'cancelled')->whereBetween('created_at', [$s, $e])
            ->selectRaw("DATE(created_at) d, SUM(total) revenue, COUNT(*) orders")->groupBy('d')->orderBy('d')->get()
            ->map(fn ($r) => ['date' => $r->d, 'revenue' => (float) $r->revenue, 'orders' => (int) $r->orders, 'cogs' => 0])->values()->all();
        $today = Sale::where('status', '!=', 'cancelled')->whereDate('created_at', today())->selectRaw('COALESCE(SUM(total),0) revenue, COUNT(*) orders')->first();
        $yesterday = Sale::where('status', '!=', 'cancelled')->whereDate('created_at', today()->subDay())->selectRaw('COALESCE(SUM(total),0) revenue, COUNT(*) orders')->first();
        $sold = SaleItem::join('sales', 'sales.id', '=', 'sale_items.sale_id')->where('sales.status', '!=', 'cancelled')->whereBetween('sales.created_at', [$b['start'], $b['end']])
            ->selectRaw('product_id, SUM(quantity) qty, SUM(line_total) revenue')->groupBy('product_id')->get()->keyBy('product_id');
        $products = Product::where('products.status', 'active')
            ->with('supplier:id,name', 'category:id,name')
            ->select('products.id', 'products.name', 'products.sku', 'products.reorder_level', 'products.cost_price', 'products.selling_price', 'products.category_id', 'products.supplier_id')
            ->leftJoin(
                DB::raw('(SELECT product_id, COALESCE(SUM(quantity),0) as stock FROM inventory GROUP BY product_id) as inv'),
                'inv.product_id', '=', 'products.id'
            )
            ->addSelect(DB::raw('COALESCE(inv.stock, 0) as stock'))
            ->get()->map(fn ($p) => [
            'id' => $p->id, 'name' => $p->name, 'sku' => $p->sku, 'stock' => max(0, (float) $p->stock), 'reorder_level' => max(0, (float) $p->reorder_level),
            'sold_qty' => max(0, (float) ($sold[$p->id]->qty ?? 0)), 'revenue' => max(0, (float) ($sold[$p->id]->revenue ?? 0)), 'cost_price' => max(0, (float) $p->cost_price), 'selling_price' => max(0, (float) $p->selling_price),
            'supplier' => $p->supplier?->name, 'category' => $p->category?->name,
        ])->filter(fn ($p) => $p['id'] !== null && $p['name'] !== null)->values()->all();
        $customers = Customer::where('status', 'active')
            ->select('customers.id', 'customers.name', 'customers.type')
            ->leftJoin(
                DB::raw("(SELECT customer_id, COUNT(*) as orders, COALESCE(SUM(total),0) as total_spent, MAX(created_at) as last_order_at FROM sales WHERE status != 'cancelled' AND customer_id IS NOT NULL GROUP BY customer_id) as agg"),
                'agg.customer_id', '=', 'customers.id'
            )
            ->addSelect(DB::raw('COALESCE(agg.orders,0) as orders, COALESCE(agg.total_spent,0) as total_spent, agg.last_order_at'))
            ->get()
            ->map(fn ($c) => ['id' => $c->id, 'name' => $c->name, 'orders' => max(0, (int) $c->orders), 'total_spent' => max(0, (float) $c->total_spent), 'last_order_at' => $c->last_order_at ? substr($c->last_order_at, 0, 10) : null, 'type' => $c->type])
            ->filter(fn ($c) => $c['id'] !== null && $c['name'] !== null)->values()->all();
        $transactions = Sale::whereBetween('created_at', [$b['start'], $b['end']])->latest()->limit(300)->get()
            ->map(fn ($s) => ['id' => $s->id, 'number' => $s->number, 'total' => max(0, (float) $s->total), 'discount' => max(0, (float) $s->discount), 'status' => $s->status ?? 'completed', 'payment_status' => $s->payment_status ?? 'paid', 'hour' => max(0, min(23, (int) $s->created_at->format('G'))), 'date' => $s->created_at->toDateString()])->values()->all();
        $expenses = Expense::where('status', '!=', 'rejected')->whereBetween('date', [$b['start']->toDateString(), $b['end']->toDateString()])->selectRaw('category, SUM(amount) v')->groupBy('category')->pluck('v', 'category')->map(fn ($v) => (float) $v)->all();

        return [
            'series' => $daily($b['start'], $b['end']), 'previous_series' => $daily($b['prev_start'], $b['prev_end']),
            'today' => ['date' => today()->toDateString(), 'revenue' => max(0, (float) ($today->revenue ?? 0)), 'orders' => max(0, (int) ($today->orders ?? 0))],
            'yesterday' => ['date' => today()->subDay()->toDateString(), 'revenue' => max(0, (float) ($yesterday->revenue ?? 0)), 'orders' => max(0, (int) ($yesterday->orders ?? 0))],
            'products' => $products, 'customers' => $customers, 'transactions' => $transactions, 'expenses_by_category' => $expenses ?: new \stdClass(),
        ];
    }

    private function call(string $path, array $payload): array
    {
        $cfg = config('services.ai');
        if (array_key_exists('expenses_by_category', $payload) && !is_object($payload['expenses_by_category'])) {
            $payload['expenses_by_category'] = !empty($payload['expenses_by_category']) ? $payload['expenses_by_category'] : new \stdClass();
        }
        try {
            $res = Http::timeout($cfg['timeout'])->acceptJson()->withHeaders(array_filter(['X-Internal-Key' => $cfg['internal_key']]))->post(rtrim($cfg['url'], '/').$path, $payload);
        } catch (ConnectionException $e) {
            Log::error('AI service unreachable', ['path' => $path, 'url' => $cfg['url'].$path, 'error' => $e->getMessage()]);
            throw new HttpException(503, 'AI service is unavailable. Please try again later.');
        } catch (\Throwable $e) {
            Log::error('AI service call failed', ['path' => $path, 'error' => $e->getMessage()]);
            throw new HttpException(502, 'AI service communication error. Please try again later.');
        }
        if ($res->status() === 429) throw new HttpException(429, 'AI service is busy. Please try again in a moment.');
        if ($res->failed()) {
            $body = $res->json();
            $msg = $body['message'] ?? 'AI service returned an error.';
            Log::warning('AI service error', ['path' => $path, 'status' => $res->status(), 'body' => $body]);
            throw new HttpException($res->status() >= 500 ? 502 : $res->status(), $msg);
        }
        if (!($res->json('success'))) {
            Log::warning('AI service returned success=false', ['path' => $path, 'body' => $res->json()]);
            throw new HttpException(502, $res->json('message') ?? 'AI service returned an error.');
        }
        return $res->json('data') ?? [];
    }
}
