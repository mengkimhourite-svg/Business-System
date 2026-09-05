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
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;
use Symfony\Component\HttpKernel\Exception\HttpException;

/**
 * Laravel → FastAPI bridge. Laravel authenticates/authorizes the user, builds an aggregated,
 * business-scoped payload (no credentials, no other tenants) and forwards it server-to-server.
 * The AI provider key never leaves the FastAPI host.
 */
class AiService
{
    public function __construct(private PeriodService $period) {}

    public function chat(User $user, array $input): array
    {
        $payload = ['context' => $this->context($user, $input), 'message' => $input['message'] ?? null, 'intent' => $input['intent'] ?? null] + $this->businessSnapshot($user);
        $data = $this->call('/api/ai/chatbot', $payload);

        AiChatMessage::create(['business_id' => $user->business_id, 'user_id' => $user->id, 'role' => 'user', 'content' => $input['message'] ?? $input['intent'] ?? '', 'intent' => $data['intent'] ?? null, 'page' => $input['page'] ?? null]);
        AiChatMessage::create(['business_id' => $user->business_id, 'user_id' => $user->id, 'role' => 'assistant', 'content' => $data['summary'] ?? null, 'intent' => $data['intent'] ?? null, 'payload' => $data, 'page' => $input['page'] ?? null]);
        return $data;
    }

    /** Live insights: call multiple FastAPI endpoints and merge results. */
    public function liveInsights(User $user): array
    {
        $ctx = $this->context($user, []);
        $snapshot = $this->businessSnapshot($user);
        $payload = ['context' => $ctx] + $snapshot;

        $insights = [];

        // Recommendations
        try {
            $recs = $this->call('/api/ai/recommendations', $payload);
            if ($recs) $insights[] = $recs;
        } catch (\Throwable) {}

        // Anomaly detection
        try {
            $anom = $this->call('/api/ai/anomaly-detection', $payload);
            if ($anom) $insights[] = $anom;
        } catch (\Throwable) {}

        // Inventory prediction
        if (!empty($snapshot['products'])) {
            try {
                $inv = $this->call('/api/ai/inventory-prediction', $payload);
                if ($inv) $insights[] = $inv;
            } catch (\Throwable) {}
        }

        // Sales prediction
        if (!empty($snapshot['series'])) {
            try {
                $sales = $this->call('/api/ai/sales-prediction', $payload);
                if ($sales) $insights[] = $sales;
            } catch (\Throwable) {}
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
        return ['business_name' => $b->name, 'currency' => $b->currency, 'exchange_rate' => (float) $b->exchange_rate, 'language' => $input['language'] ?? 'en', 'role' => $user->role?->slug, 'page' => $input['page'] ?? null, 'window_days' => 30];
    }

    /** Aggregated, authorized data only (scoped by BelongsToBusiness). */
    private function businessSnapshot(User $user): array
    {
        $b = $this->period->bounds('last30');
        $daily = fn ($s, $e) => Sale::where('status', '!=', 'cancelled')->whereBetween('created_at', [$s, $e])
            ->selectRaw("DATE(created_at) d, SUM(total) revenue, COUNT(*) orders")->groupBy('d')->orderBy('d')->get()
            ->map(fn ($r) => ['date' => $r->d, 'revenue' => (float) $r->revenue, 'orders' => (int) $r->orders, 'cogs' => 0])->values()->all();
        $today = Sale::where('status', '!=', 'cancelled')->whereDate('created_at', today())->selectRaw('COALESCE(SUM(total),0) revenue, COUNT(*) orders')->first();
        $yesterday = Sale::where('status', '!=', 'cancelled')->whereDate('created_at', today()->subDay())->selectRaw('COALESCE(SUM(total),0) revenue, COUNT(*) orders')->first();
        $sold = SaleItem::join('sales', 'sales.id', '=', 'sale_items.sale_id')->where('sales.status', '!=', 'cancelled')->whereBetween('sales.created_at', [$b['start'], $b['end']])
            ->selectRaw('product_id, SUM(quantity) qty, SUM(line_total) revenue')->groupBy('product_id')->get()->keyBy('product_id');
        $products = Product::where('status', 'active')->with('supplier:id,name', 'category:id,name')->withSum('inventory as stock', 'quantity')->get()->map(fn ($p) => [
            'id' => $p->id, 'name' => $p->name, 'sku' => $p->sku, 'stock' => (float) $p->stock, 'reorder_level' => (float) $p->reorder_level,
            'sold_qty' => (float) ($sold[$p->id]->qty ?? 0), 'revenue' => (float) ($sold[$p->id]->revenue ?? 0), 'cost_price' => (float) $p->cost_price, 'selling_price' => (float) $p->selling_price,
            'supplier' => $p->supplier?->name, 'category' => $p->category?->name,
        ])->values()->all();
        $customers = Customer::where('status', 'active')->withCount(['sales as orders' => fn ($q) => $q->where('status', '!=', 'cancelled')])->withSum(['sales as total_spent' => fn ($q) => $q->where('status', '!=', 'cancelled')], 'total')->withMax('sales as last_order_at', 'created_at')->get()
            ->map(fn ($c) => ['id' => $c->id, 'name' => $c->name, 'orders' => (int) $c->orders, 'total_spent' => (float) $c->total_spent, 'last_order_at' => $c->last_order_at ? substr($c->last_order_at, 0, 10) : null, 'type' => $c->type])->values()->all();
        $transactions = Sale::whereBetween('created_at', [$b['start'], $b['end']])->latest()->limit(300)->get()
            ->map(fn ($s) => ['id' => $s->id, 'number' => $s->number, 'total' => (float) $s->total, 'discount' => (float) $s->discount, 'status' => $s->status, 'payment_status' => $s->payment_status, 'hour' => (int) $s->created_at->format('G'), 'date' => $s->created_at->toDateString()])->values()->all();
        $expenses = Expense::where('status', '!=', 'rejected')->whereBetween('date', [$b['start']->toDateString(), $b['end']->toDateString()])->selectRaw('category, SUM(amount) v')->groupBy('category')->pluck('v', 'category')->map(fn ($v) => (float) $v)->all();

        return [
            'series' => $daily($b['start'], $b['end']), 'previous_series' => $daily($b['prev_start'], $b['prev_end']),
            'today' => ['date' => today()->toDateString(), 'revenue' => (float) $today->revenue, 'orders' => (int) $today->orders],
            'yesterday' => ['date' => today()->subDay()->toDateString(), 'revenue' => (float) $yesterday->revenue, 'orders' => (int) $yesterday->orders],
            'products' => $products, 'customers' => $customers, 'transactions' => $transactions, 'expenses_by_category' => $expenses,
        ];
    }

    private function call(string $path, array $payload): array
    {
        $cfg = config('services.ai');
        if (array_key_exists('expenses_by_category', $payload) && empty($payload['expenses_by_category'])) {
            $payload['expenses_by_category'] = new \stdClass();
        }
        try {
            $res = Http::timeout($cfg['timeout'])->acceptJson()->withHeaders(array_filter(['X-Internal-Key' => $cfg['internal_key']]))->post(rtrim($cfg['url'], '/').$path, $payload);
        } catch (ConnectionException) {
            Log::error('AI service unreachable', ['path' => $path, 'url' => $cfg['url'].$path]);
            throw new HttpException(503, 'AI service is unavailable. Please try again later.');
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
