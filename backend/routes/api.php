<?php

use App\Http\Controllers\Api\V1\{AiController, AuthController, DashboardController, InventoryController, MiscController, PosController, PurchaseController, ResourceController, SettingsController};
use App\Support\ApiResponse;
use Illuminate\Support\Facades\Route;

/*
 * Smart Business System REST API — /api/v1
 * Every protected route: auth:sanctum → active user → business scope (global scopes) → permission middleware.
 */
Route::prefix('v1')->group(function () {
    // Password reset (required by Laravel's default ResetPassword notification for URL generation)
    Route::get('password/reset/{token}', fn () => response()->json(['message' => 'Reset link received.']))->name('password.reset');

    // Health check
    Route::get('health', fn () => ApiResponse::success(['service' => config('app.name'), 'status' => 'ok', 'version' => '1.0.0']));

    // Public
    Route::get('settings/public', [SettingsController::class, 'publicSettings']);
    Route::prefix('auth')->middleware('throttle:20,1')->group(function () {
        Route::post('login', [AuthController::class, 'login']);
        Route::post('register', [AuthController::class, 'register']);
        Route::post('forgot-password', [AuthController::class, 'forgotPassword']);
        Route::post('reset-password', [AuthController::class, 'resetPassword']);
    });

    Route::middleware(['auth:sanctum', 'throttle:120,1', 'writes:90'])->group(function () {
        Route::prefix('auth')->group(function () {
            Route::get('me', [AuthController::class, 'me']);
            Route::post('logout', [AuthController::class, 'logout']);
            Route::put('profile', [AuthController::class, 'updateProfile']);
            Route::post('change-password', [AuthController::class, 'changePassword']);
        });

        Route::get('dashboard', [DashboardController::class, 'summary'])->middleware('permission:dashboard.view');
        Route::get('reports/overview', [DashboardController::class, 'reports'])->middleware('permission:reports.view');

        // Generic CRUD resources — {resource} maps to ResourceController::CONFIG; permission = <resource>.<ability>
        foreach (['products', 'categories', 'brands', 'suppliers', 'customers', 'branches', 'expenses', 'users', 'roles'] as $r) {
            Route::get($r, [ResourceController::class, 'index'])->middleware("permission:$r.view")->defaults('resource', $r);
            Route::get("$r/{id}", [ResourceController::class, 'show'])->middleware("permission:$r.view")->defaults('resource', $r)->whereNumber('id');
            Route::post($r, [ResourceController::class, 'store'])->middleware("permission:$r.create")->defaults('resource', $r);
            Route::put("$r/{id}", [ResourceController::class, 'update'])->middleware("permission:$r.update")->defaults('resource', $r)->whereNumber('id');
            Route::delete("$r/{id}", [ResourceController::class, 'destroy'])->middleware("permission:$r.delete")->defaults('resource', $r)->whereNumber('id');
            Route::post("$r/bulk-delete", [ResourceController::class, 'bulkDestroy'])->middleware("permission:$r.delete")->defaults('resource', $r);
        }

        // POS / orders
        Route::post('pos/checkout', [PosController::class, 'checkout'])->middleware('permission:sales.create');
        Route::get('orders', [PosController::class, 'index'])->middleware('permission:orders.view,sales.view');
        Route::get('orders/{id}', [PosController::class, 'show'])->middleware('permission:orders.view,sales.view')->whereNumber('id');
        Route::patch('orders/{id}', [PosController::class, 'update'])->middleware('permission:orders.update')->whereNumber('id');
        Route::delete('orders/{id}', [PosController::class, 'destroy'])->middleware('permission:orders.delete')->whereNumber('id');
        Route::post('orders/bulk-delete', [PosController::class, 'bulkDestroy'])->middleware('permission:orders.delete');

        // Purchases
        Route::get('purchases', [PurchaseController::class, 'index'])->middleware('permission:purchases.view');
        Route::get('purchases/{id}', [PurchaseController::class, 'show'])->middleware('permission:purchases.view')->whereNumber('id');
        Route::post('purchases', [PurchaseController::class, 'store'])->middleware('permission:purchases.create');
        Route::post('purchases/{id}/receive', [PurchaseController::class, 'receive'])->middleware('permission:purchases.update')->whereNumber('id');
        Route::delete('purchases/{id}', [PurchaseController::class, 'destroy'])->middleware('permission:purchases.delete')->whereNumber('id');

        // Inventory
        Route::get('inventory/movements', [InventoryController::class, 'movements'])->middleware('permission:inventory.view');
        Route::get('inventory/low-stock', [InventoryController::class, 'lowStock'])->middleware('permission:inventory.view');
        Route::post('inventory/adjust', [InventoryController::class, 'adjust'])->middleware('permission:inventory.adjust');

        // Settings & preferences
        Route::get('settings', [SettingsController::class, 'show'])->middleware('permission:settings.view');
        Route::put('settings', [SettingsController::class, 'update'])->middleware('permission:settings.update');
        Route::get('preferences', [SettingsController::class, 'preferences']);
        Route::put('preferences/{key}', [SettingsController::class, 'setPreference'])->where('key', '[A-Za-z0-9_.\-]+');
        Route::delete('preferences/{key}', [SettingsController::class, 'resetPreference'])->where('key', '[A-Za-z0-9_.\-]+');

        // AI (Laravel → FastAPI)
        Route::post('ai/chat', [AiController::class, 'chat'])->middleware(['permission:ai.view', 'throttle:30,1']);
        Route::post('ai/analyze/{kind}', [AiController::class, 'analyze'])->middleware(['permission:ai.view', 'throttle:20,1'])->whereIn('kind', ['sales', 'inventory', 'customers', 'recommendations', 'anomalies']);
        Route::get('ai/insights', [AiController::class, 'insights'])->middleware('permission:ai.view');

        // Misc
        Route::get('notifications', [MiscController::class, 'notifications']);
        Route::post('notifications/read', [MiscController::class, 'markRead']);
        Route::get('search', [MiscController::class, 'search']);
    });
});
