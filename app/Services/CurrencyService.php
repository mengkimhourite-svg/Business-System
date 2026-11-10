<?php

namespace App\Services;

use App\Models\Business;
use App\Models\ExchangeRate;
use Illuminate\Support\Facades\Cache;

/**
 * Centralized money handling. Amounts are STORED in the base currency (USD).
 * USD -> KHR: amount x rate.  KHR -> USD: amount / rate.  Rounding happens once per conversion.
 * Transactions snapshot the rate in force, so history never changes when the rate is updated.
 */
class CurrencyService
{
    public const BASE = 'USD';
    private const DECIMALS = ['USD' => 2, 'KHR' => 0];

    public function currentRate(Business $business): string
    {
        $cacheKey = "exchange_rate:{$business->id}";
        $latest = Cache::remember($cacheKey, 300, function () use ($business) {
            return ExchangeRate::withoutGlobalScopes()->where('business_id', $business->id)
                ->where('from_currency', self::BASE)->where('to_currency', 'KHR')
                ->orderByDesc('effective_date')->orderByDesc('id')->value('rate');
        });
        return (string) ($latest ?? $business->exchange_rate ?? config('sbs.default_exchange_rate'));
    }

    public function normalize(?string $code): string
    {
        return in_array($code, config('sbs.currencies'), true) ? $code : self::BASE;
    }

    /** Convert a base amount to a display currency using an explicit rate (historical or current). */
    public function fromBase(string|float $amount, string $currency, string|float $rate): string
    {
        $currency = $this->normalize($currency);
        if ($currency === self::BASE) return $this->round($amount, 2);
        return $this->round(bcmul((string) $amount, (string) $rate, 6), self::DECIMALS[$currency] ?? 2);
    }

    /** Convert an amount typed in a display currency back to base (4 decimals for payments to avoid drift). */
    public function toBase(string|float $amount, string $currency, string|float $rate, int $decimals = 2): string
    {
        $currency = $this->normalize($currency);
        if ($currency === self::BASE) return $this->round($amount, $decimals);
        if (bccomp((string) $rate, '0', 6) <= 0) return $this->round(0, $decimals);
        return $this->round(bcdiv((string) $amount, (string) $rate, 8), $decimals);
    }

    public function round(string|float $amount, int $decimals): string
    {
        return number_format(round((float) $amount, $decimals), $decimals, '.', '');
    }

    public function setRate(Business $business, float $rate, int $userId): ExchangeRate
    {
        $business->update(['exchange_rate' => $rate]);
        Cache::forget("exchange_rate:{$business->id}");
        return ExchangeRate::create(['business_id' => $business->id, 'from_currency' => self::BASE, 'to_currency' => 'KHR', 'rate' => $rate, 'effective_date' => now()->toDateString(), 'created_by' => $userId]);
    }
}
