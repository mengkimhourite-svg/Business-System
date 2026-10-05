<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Models\Business;
use App\Services\CurrencyService;
use App\Services\PreferenceService;
use App\Support\ApiResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Storage;

class SettingsController extends Controller
{
    /** GET /settings/public — branding + currency only (safe before authentication). */
    public function publicSettings()
    {
        $data = Cache::remember('settings:public', 300, function () {
            $b = Business::query()->orderBy('id')->first();
            if (!$b) return null;
            return ['business_name' => $b->name, 'business_subtitle' => $b->subtitle, 'business_logo' => $b->logo, 'currency' => $b->currency, 'exchange_rate' => (float) $b->exchange_rate, 'tax_rate' => (float) $b->tax_rate];
        });
        return ApiResponse::success($data);
    }

    public function show(Request $request)
    {
        $b = $request->user()->business;
        $n = $b->notification_settings ?? [];
        $data = ['business_name' => $b->name, 'business_subtitle' => $b->subtitle, 'business_logo' => $b->logo, 'business_email' => $b->email, 'business_phone' => $b->phone, 'business_address' => $b->address,
            'base_currency' => $b->base_currency, 'currency' => $b->currency, 'exchange_rate' => (float) $b->exchange_rate, 'tax_rate' => (float) $b->tax_rate, 'low_stock_threshold' => $b->low_stock_threshold, 'receipt_footer' => $b->receipt_footer,
            'khqr_image' => $b->khqr_image,
            'notify_low_stock' => $n['notify_low_stock'] ?? true, 'notify_orders' => $n['notify_orders'] ?? true, 'notify_reports' => $n['notify_reports'] ?? false];
        return ApiResponse::success($data);
    }

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
        Cache::forget('settings:public');
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

    public function uploadKhqrImage(Request $request)
    {
        $request->validate([
            'khqr_image' => ['required', 'image', 'max:5120'],
        ]);

        $b = $request->user()->business;

        // Delete old image if exists
        if ($b->khqr_image && Storage::disk('public')->exists($b->khqr_image)) {
            Storage::disk('public')->delete($b->khqr_image);
        }

        $file = $request->file('khqr_image');
        $path = $file->store('khqr', 'public');

        $b->update(['khqr_image' => $path]);

        Cache::forget('settings:public');

        return ApiResponse::success(['khqr_image' => $path], 'KHQR image updated');
    }

    private function serialize(Business $b): array
    {
        $n = $b->notification_settings ?? [];
        return ['business_name' => $b->name, 'business_subtitle' => $b->subtitle, 'business_logo' => $b->logo, 'business_email' => $b->email, 'business_phone' => $b->phone, 'business_address' => $b->address,
            'base_currency' => $b->base_currency, 'currency' => $b->currency, 'exchange_rate' => (float) $b->exchange_rate, 'tax_rate' => (float) $b->tax_rate, 'low_stock_threshold' => $b->low_stock_threshold, 'receipt_footer' => $b->receipt_footer,
            'khqr_image' => $b->khqr_image,
            'notify_low_stock' => $n['notify_low_stock'] ?? true, 'notify_orders' => $n['notify_orders'] ?? true, 'notify_reports' => $n['notify_reports'] ?? false];
    }
}
