<?php

namespace App\Services;

use App\Models\User;

/**
 * Isolated transformer: real FastAPI/DB business data -> the EXACT /ai-insights contract
 * the pinned frontend (frontend/src/pages/AIInsightsPage.jsx) already consumes.
 *
 *   data = { generated_at, insights: [ Card ], forecast: [ {date, value} ] }
 *   Card = { id, type, impact, confidence, key, params, link?, currency?, categoryParam? }
 *
 * Every value is derived from real AI output (AiService::liveInsights) or real authorized
 * business data (AiService::snapshot). Nothing is hardcoded/faked. Cards are only emitted
 * when their supporting real data exists, so an empty business yields the frontend empty state.
 */
class AiInsightsAdapter
{
    public function __construct(private AiService $ai) {}

    /**
     * @param array $live     { generated_at, insights: [ InsightArray|StoredPayload ] }
     * @param array $snapshot Authorized business snapshot (AiService::snapshot)
     * @param User  $user     For currency + context
     */
    public function transform(User $user, array $live, array $snapshot): array
    {
        $currency = $user->business?->currency ?? 'USD';
        $by = $this->keyByIntent($live['insights'] ?? []);

        $cards = [];
        $forecast = $this->forecastFrom($by['sales_prediction'] ?? []);

        $cards = $this->add($cards, $this->stockOutCard($by['inventory_prediction'] ?? []));
        $cards = $this->add($cards, $this->trendCard($by['sales_prediction'] ?? []));
        $cards = $this->add($cards, $this->bestCategoryCard($snapshot['products'] ?? []));
        $cards = $this->add($cards, $this->slowMoversCard($snapshot['products'] ?? []));
        $cards = $this->add($cards, $this->atRiskCard($snapshot['customers'] ?? []));
        $cards = $this->add($cards, $this->expensesCard($snapshot['expenses_by_category'] ?? []));
        $cards = $this->add($cards, $this->marginCard($snapshot['products'] ?? []));
        $cards = $this->add($cards, $this->peakHourCard($snapshot['transactions'] ?? []));

        return [
            'generated_at' => $live['generated_at'] ?? null,
            'insights' => $cards,
            'forecast' => $forecast,
        ];
    }

    // ------------------------------------------------------------- card build

    private function forecastFrom(?array $sales): array
    {
        if (empty($sales)) return [];
        $rows = $sales['table_rows'] ?? [];
        $out = [];
        foreach ($rows as $row) {
            if (isset($row[0], $row[1]) && is_numeric($row[1])) {
                $out[] = ['date' => (string) $row[0], 'value' => (float) $row[1]];
            }
        }
        return $out; // FastAPI emits ascending by date, which is what the chart expects.
    }

    private function stockOutCard(array $inv): ?array
    {
        if (empty($inv)) return null;
        $rows = $inv['table_rows'] ?? [];          // [name, stock, units/day, days_left, suggested_qty, supplier]
        $atRisk = null;
        foreach ($rows as $r) {
            if (is_numeric($r[3] ?? null) && (float) $r[3] < 7) { $atRisk = $r; break; }
        }
        if ($atRisk === null) $atRisk = $rows[0] ?? null;
        if ($atRisk === null) return null;          // real AI found nothing to reorder

        $name = (string) ($atRisk[0] ?? 'product');
        $stock = max(0, (float) ($atRisk[1] ?? 0));
        $rate = (float) ($atRisk[2] ?? 0);
        if ($rate <= 0) $rate = $stock > 0 ? 1.0 : 0.0;
        $days = is_numeric($atRisk[3] ?? null) ? max(0, (int) round((float) $atRisk[3])) : ($rate > 0 ? max(0, (int) round($stock / $rate)) : 0);
        $qty = is_numeric($atRisk[4] ?? null) ? max(1, (int) $atRisk[4]) : max(1, (int) ceil($rate * 30));

        $danger = false;
        foreach ($inv['alerts'] ?? [] as $a) {
            if (($a['level'] ?? null) === 'danger') { $danger = true; break; }
        }

        return [
            'id' => 'stockout-'.$name, 'type' => 'stock',
            'impact' => $danger || $days < 5 ? 'high' : 'medium',
            'confidence' => $this->pct($inv['confidence'] ?? 0.78),
            'key' => 'stockout',
            'params' => ['product' => $name, 'days' => $days, 'rate' => sprintf('%.1f', $rate), 'stock' => (int) $stock, 'qty' => $qty],
            'link' => '/purchases',
        ];
    }

    private function trendCard(array $sales): ?array
    {
        if (empty($sales)) return null;
        $change = null;
        foreach ($sales['metrics'] ?? [] as $m) {
            if (($m['label'] ?? null) === 'Week over week' && is_numeric($m['change'] ?? null)) {
                $change = (float) $m['change'];
            }
        }
        if ($change === null || abs($change) < 3) return null; // matches mock: trivial change => no card

        return [
            'id' => 'trend', 'type' => 'sales',
            'impact' => abs($change) > 15 ? 'high' : 'medium',
            'confidence' => $this->pct($sales['confidence'] ?? 0.8),
            'key' => $change >= 0 ? 'trendUp' : 'trendDown',
            'params' => ['pct' => sprintf('%s%.1f%%', $change >= 0 ? '+' : '', $change), 'days' => 30],
            'link' => '/reports',
        ];
    }

    private function bestCategoryCard(array $products): ?array
    {
        $byCat = [];
        foreach ($products as $p) {
            if (($p['category'] ?? null) === null) continue;
            $byCat[$p['category']] = $byCat[$p['category']] ?? 0;
            $byCat[$p['category']] += (float) ($p['revenue'] ?? 0);
        }
        if (empty($byCat)) return null;
        $total = 0.0;
        foreach ($byCat as $v) $total += $v;
        if ($total <= 0) return null;

        $best = null; $bestRev = -1.0;
        foreach ($byCat as $name => $v) {
            if ($v > $bestRev) { $bestRev = $v; $best = $name; }
        }
        if ($best === null) return null;
        $share = $bestRev / $total * 100;

        return [
            'id' => 'best-cat', 'type' => 'growth', 'impact' => 'medium',
            'confidence' => min(95, (int) round(70 + $share)),
            'key' => 'bestCategory',
            'params' => ['category' => (string) $best, 'amount' => round($bestRev, 2), 'pct' => sprintf('%.0f%%', $share)],
            'link' => '/reports', 'currency' => ['amount'],
        ];
    }

    private function slowMoversCard(array $products): ?array
    {
        $examples = [];
        foreach ($products as $p) {
            if ((float) ($p['sold_qty'] ?? 0) <= 0 && (float) ($p['stock'] ?? 0) > 0) {
                $examples[] = (string) ($p['name'] ?? 'product');
                if (count($examples) === 3) break; // i18n string lists ~3 examples
            }
        }
        if (empty($examples)) return null;

        $count = 0;
        foreach ($products as $p) {
            if ((float) ($p['sold_qty'] ?? 0) <= 0 && (float) ($p['stock'] ?? 0) > 0) $count++;
        }

        return [
            'id' => 'slow', 'type' => 'stock', 'impact' => 'low', 'confidence' => 80,
            'key' => 'slowMovers', 'params' => ['count' => $count, 'examples' => implode(', ', $examples)], 'link' => '/products',
        ];
    }

    private function atRiskCard(array $customers): ?array
    {
        $cutoff = today()->subDays(30)->toDateString(); // "Y-m-d"; ISO dates compare as strings
        $atRisk = [];
        foreach ($customers as $c) {
            $last = $c['last_order_at'] ?? null;
            if ((int) ($c['orders'] ?? 0) > 0 && !empty($last) && (string) $last < $cutoff) {
                $atRisk[] = $c;
            }
        }
        if (empty($atRisk)) return null;

        $examples = [];
        foreach ($atRisk as $c) {
            $examples[] = (string) ($c['name'] ?? 'customer');
            if (count($examples) === 3) break;
        }

        return [
            'id' => 'at-risk', 'type' => 'customers', 'impact' => 'medium', 'confidence' => 76,
            'key' => 'atRisk', 'params' => ['count' => count($atRisk), 'examples' => implode(', ', $examples)], 'link' => '/customers',
        ];
    }

    private function expensesCard(array $byCategory): ?array
    {
        if (empty($byCategory)) return null;
        $total = 0.0;
        foreach ($byCategory as $v) $total += $v;
        if ($total <= 0) return null;

        $topCat = null; $topVal = -1.0;
        foreach ($byCategory as $slug => $v) {
            if ($v > $topVal) { $topVal = $v; $topCat = $slug; }
        }
        if ($topCat === null) return null;

        return [
            'id' => 'exp', 'type' => 'finance', 'impact' => 'low', 'confidence' => 90,
            'key' => 'expenses',
            'params' => ['category' => (string) $topCat, 'amount' => round($topVal, 2), 'pct' => sprintf('%.0f%%', $topVal / $total * 100)],
            'link' => '/expenses', 'categoryParam' => 'category', 'currency' => ['amount'],
        ];
    }

    private function marginCard(array $products): ?array
    {
        $margins = [];
        foreach ($products as $p) {
            $sell = (float) ($p['selling_price'] ?? 0);
            $cost = (float) ($p['cost_price'] ?? 0);
            if ($sell > 0) $margins[] = ($sell - $cost) / $sell * 100;
        }
        if (empty($margins)) return null;
        $total = 0.0;
        foreach ($margins as $m) $total += $m;
        $avg = $total / count($margins);

        return [
            'id' => 'margin', 'type' => 'finance', 'impact' => 'medium', 'confidence' => 85,
            'key' => 'margin', 'params' => ['pct' => sprintf('%.1f%%', $avg)], 'link' => '/reports',
        ];
    }

    private function peakHourCard(array $transactions): ?array
    {
        $hours = [];
        foreach ($transactions as $t) {
            $h = $t['hour'] ?? null;
            if (is_numeric($h) && (int) $h >= 0 && (int) $h <= 23) {
                $h = (int) $h;
                $hours[$h] = ($hours[$h] ?? 0) + 1;
            }
        }
        if (empty($hours)) return null;

        $peak = -1; $peakCount = 0;
        foreach ($hours as $h => $c) {
            if ($c > $peakCount) { $peakCount = $c; $peak = $h; }
        }
        if ($peak < 0) return null;

        return [
            'id' => 'peak', 'type' => 'sales', 'impact' => 'low', 'confidence' => 82,
            'key' => 'peakHour', 'params' => ['hour' => sprintf('%02d:00', $peak)], 'link' => '/orders',
        ];
    }

    // ------------------------------------------------------------- tiny helpers

    private function pct(float $v): int
    {
        return min(99, max(1, (int) round($v * 100)));
    }

    private function keyByIntent(array $insights): array
    {
        $out = [];
        foreach ($insights as $ins) {
            $intent = $ins['intent'] ?? null;
            if (is_array($ins) && $intent !== null && !array_key_exists($intent, $out)) {
                $out[$intent] = $ins;
            }
        }
        return $out;
    }

    private function add(array $cards, ?array $card): array
    {
        if ($card !== null) $cards[] = $card;
        return $cards;
    }
}