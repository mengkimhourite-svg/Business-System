<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Models\Business;
use App\Services\CurrencyService;
use App\Services\PreferenceService;
use App\Support\ApiResponse;
use Illuminate\Http\Request;

class SettingsController extends Controller
{
    /** GET /settings/public — branding + currency only (safe before authentication). */
    public function publicSettings()
    {
        $b = Business::query()->orderBy('id')->first();
        if (!$b) return ApiResponse::success(null);
        return ApiResponse::success(['business_name' => $b->name, 'business_subtitle' => $b->subtitle, 'business_logo' => $b->logo, 'currency' => $b->currency, 'exchange_rate' => (float) $b->exchange_rate, 'tax_rate' => (float) $b->tax_rate]);
    }

    public function show(Request $request) { return ApiResponse::success($this->serialize($request->user()->business)); }

    public function update(Request $request, CurrencyService $currency)
    {
        $data = $request->validate([
            'business_name' => ['sometimes', 'string', 'max:120'], 'business_subtitle' => ['nullable', 'string', 'max:120'], 'business_logo' => ['nullable', 'string', 'max:2000000'],
            'business_email' => ['nullable', 'email'], 'business_phone' => ['nullable', 'string', 'max:40'], 'business_address' => ['nullable', 'string', 'max:500'],
            'currency' => ['sometimes', 'in:USD,KHR'], 'exchange_rate' => ['sometimes', 'numeric', 'gt:0'], 'tax_rate' => ['sometimes', 'numeric', 'min:0', 'max:100'], 'low_stock_threshold' => ['sometimes', 'integer', 'min:0'],
            'receipt_footer' => ['nullable', 'string', 'max:200'], 'notify_low_stock' => ['sometimes', 'boolean'], 'notify_orders' => ['sometimes', 'boolean'], 'notify_reports' => ['sometimes', 'boolean'],
        ]);
        $b = $request->user()->business;
        $map = ['business_name' => 'name', 'business_subtitle' => 'subtitle', 'business_logo' => 'logo', 'business_email' => 'email', 'business_phone' => 'phone', 'business_address' => 'address'];
        $attrs = [];
        foreach ($data as $k => $v) {
            if (isset($map[$k])) $attrs[$map[$k]] = $v;
            elseif (in_array($k, ['currency', 'tax_rate', 'low_stock_threshold', 'receipt_footer'], true)) $attrs[$k] = $v;
        }
        $notify = array_intersect_key($data, array_flip(['notify_low_stock', 'notify_orders', 'notify_reports']));
        if ($notify) $attrs['notification_settings'] = array_merge($b->notification_settings ?? [], $notify);
        $b->update($attrs);
        if (isset($data['exchange_rate']) && (float) $data['exchange_rate'] !== (float) $b->exchange_rate) $currency->setRate($b, (float) $data['exchange_rate'], $request->user()->id);
        return ApiResponse::success($this->serialize($b->fresh()), 'Settings saved');
    }

    public function preferences(Request $request, PreferenceService $prefs) { return ApiResponse::success($prefs->all($request->user())); }

    public function setPreference(Request $request, PreferenceService $prefs, string $key)
    {
        $prefs->set($request->user(), $key, $request->input('value'));
        return ApiResponse::success(null, 'Preference saved');
    }

    public function resetPreference(Request $request, PreferenceService $prefs, string $key)
    {
        $prefs->reset($request->user(), $key);
        return ApiResponse::success(null, 'Preference reset');
    }

    private function serialize(Business $b): array
    {
        $n = $b->notification_settings ?? [];
        return ['business_name' => $b->name, 'business_subtitle' => $b->subtitle, 'business_logo' => $b->logo, 'business_email' => $b->email, 'business_phone' => $b->phone, 'business_address' => $b->address,
            'base_currency' => $b->base_currency, 'currency' => $b->currency, 'exchange_rate' => (float) $b->exchange_rate, 'tax_rate' => (float) $b->tax_rate, 'low_stock_threshold' => $b->low_stock_threshold, 'receipt_footer' => $b->receipt_footer,
            'notify_low_stock' => $n['notify_low_stock'] ?? true, 'notify_orders' => $n['notify_orders'] ?? true, 'notify_reports' => $n['notify_reports'] ?? false];
    }
}
