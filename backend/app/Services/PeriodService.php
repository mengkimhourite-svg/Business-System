<?php

namespace App\Services;

use Carbon\CarbonImmutable;

/** Resolves range presets (today, yesterday, last7, last30, last90, thisMonth, lastMonth, thisYear, lastYear, custom). */
class PeriodService
{
    public function bounds(string $range = 'last30', ?string $from = null, ?string $to = null): array
    {
        $now = CarbonImmutable::now();
        [$start, $end] = match ($range) {
            'today' => [$now->startOfDay(), $now->endOfDay()],
            'yesterday' => [$now->subDay()->startOfDay(), $now->subDay()->endOfDay()],
            'last7' => [$now->subDays(6)->startOfDay(), $now->endOfDay()],
            'last90' => [$now->subDays(89)->startOfDay(), $now->endOfDay()],
            'thisMonth' => [$now->startOfMonth(), $now->endOfDay()],
            'lastMonth' => [$now->subMonthNoOverflow()->startOfMonth(), $now->subMonthNoOverflow()->endOfMonth()],
            'thisYear' => [$now->startOfYear(), $now->endOfDay()],
            'lastYear' => [$now->subYear()->startOfYear(), $now->subYear()->endOfYear()],
            'custom' => [CarbonImmutable::parse($from ?: $now)->startOfDay(), CarbonImmutable::parse($to ?: $now)->endOfDay()],
            default => [$now->subDays(29)->startOfDay(), $now->endOfDay()],
        };
        if ($end->lt($start)) [$start, $end] = [$end->startOfDay(), $start->endOfDay()];
        $days = $start->diffInDays($end) + 1;
        $prevEnd = $start->subSecond();
        $prevStart = $prevEnd->sub($end->diff($start));
        return ['start' => $start, 'end' => $end, 'prev_start' => $prevStart, 'prev_end' => $prevEnd, 'days' => $days, 'mode' => $days <= 1 ? 'hour' : ($days > 92 ? 'month' : 'day')];
    }
}
