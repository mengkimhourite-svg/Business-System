<?php

use App\Http\Controllers\Api\V1\{
    AuthController,
    DashboardController,
    InventoryController,
    KhqrPaymentController,
    MiscController,
    PosController,
    PurchaseController,
    ResourceController,
    SettingsController
};
use App\Support\ApiResponse;
use Illuminate\Support\Facades\Route;

Route::prefix('v1')->group(function () {
    Route::get(
        'password/reset/{token}',
        fn () => response()->json([
            'message' => 'Reset link received.',
        ])
    )->name('password.reset');

    Route::get(
        'health',
        fn () => ApiResponse::success([
            'service' => config('app.name'),
            'status' => 'ok',
            'version' => '1.0.0',
        ])
    );

    Route::get(
        'settings/public',
        [SettingsController::class, 'publicSettings']
    );

    Route::prefix('auth')
        ->middleware('throttle:20,1')
        ->group(function () {
            Route::post(
                'login',
                [AuthController::class, 'login']
            );

            Route::post(
                'register',
                [AuthController::class, 'register']
            );

            Route::post(
                'forgot-password',
                [AuthController::class, 'forgotPassword']
            );

            Route::post(
                'reset-password',
                [AuthController::class, 'resetPassword']
            );
        });

    Route::middleware([
        'auth:sanctum',
        'load.perms',
        'throttle:120,1',
        'writes:90',
    ])->group(function () {
        Route::prefix('auth')->group(function () {
            Route::get(
                'me',
                [AuthController::class, 'me']
            );

            Route::post(
                'logout',
                [AuthController::class, 'logout']
            );

            Route::put(
                'profile',
                [AuthController::class, 'updateProfile']
            );

            Route::post(
                'change-password',
                [AuthController::class, 'changePassword']
            );
        });

        Route::get(
            'dashboard',
            [DashboardController::class, 'summary']
        )->middleware('permission:dashboard.view');

        Route::get(
            'reports/overview',
            [DashboardController::class, 'reports']
        )->middleware('permission:reports.view');

        $resources = [
            'products',
            'categories',
            'brands',
            'suppliers',
            'customers',
            'branches',
            'expenses',
            'users',
            'roles',
        ];

        foreach ($resources as $resource) {
            Route::get(
                $resource,
                [ResourceController::class, 'index']
            )
                ->middleware("permission:$resource.view")
                ->defaults('resource', $resource);

            Route::get(
                "$resource/{id}",
                [ResourceController::class, 'show']
            )
                ->middleware("permission:$resource.view")
                ->defaults('resource', $resource)
                ->whereNumber('id');

            Route::post(
                $resource,
                [ResourceController::class, 'store']
            )
                ->middleware("permission:$resource.create")
                ->defaults('resource', $resource);

            Route::put(
                "$resource/{id}",
                [ResourceController::class, 'update']
            )
                ->middleware("permission:$resource.update")
                ->defaults('resource', $resource)
                ->whereNumber('id');

            Route::delete(
                "$resource/{id}",
                [ResourceController::class, 'destroy']
            )
                ->middleware("permission:$resource.delete")
                ->defaults('resource', $resource)
                ->whereNumber('id');

            Route::post(
                "$resource/bulk-delete",
                [ResourceController::class, 'bulkDestroy']
            )
                ->middleware("permission:$resource.delete")
                ->defaults('resource', $resource);
        }

        Route::get(
            'permissions',
            fn () => ApiResponse::success(
                \App\Models\Permission::select(
                    'id',
                    'name',
                    'group',
                    'ability'
                )
                    ->orderBy('id')
                    ->get()
            )
        )->middleware('permission:roles.view');

        Route::post(
            'pos/checkout',
            [PosController::class, 'checkout']
        )->middleware('permission:sales.create');

        Route::get(
            'orders',
            [PosController::class, 'index']
        )->middleware('permission:orders.view,sales.view');

        Route::get(
            'orders/{id}',
            [PosController::class, 'show']
        )
            ->middleware('permission:orders.view,sales.view')
            ->whereNumber('id');

        Route::patch(
            'orders/{id}',
            [PosController::class, 'update']
        )
            ->middleware('permission:orders.update')
            ->whereNumber('id');

        Route::delete(
            'orders/{id}',
            [PosController::class, 'destroy']
        )
            ->middleware('permission:orders.delete')
            ->whereNumber('id');

        Route::post(
            'orders/bulk-delete',
            [PosController::class, 'bulkDestroy']
        )->middleware('permission:orders.delete');

        Route::get(
            'purchases',
            [PurchaseController::class, 'index']
        )->middleware('permission:purchases.view');

        Route::get(
            'purchases/{id}',
            [PurchaseController::class, 'show']
        )
            ->middleware('permission:purchases.view')
            ->whereNumber('id');

        Route::post(
            'purchases',
            [PurchaseController::class, 'store']
        )->middleware('permission:purchases.create');

        Route::post(
            'purchases/{id}/receive',
            [PurchaseController::class, 'receive']
        )
            ->middleware('permission:purchases.update')
            ->whereNumber('id');

        Route::delete(
            'purchases/{id}',
            [PurchaseController::class, 'destroy']
        )
            ->middleware('permission:purchases.delete')
            ->whereNumber('id');

        Route::get(
            'inventory/movements',
            [InventoryController::class, 'movements']
        )->middleware('permission:inventory.view');

        Route::get(
            'inventory/low-stock',
            [InventoryController::class, 'lowStock']
        )->middleware('permission:inventory.view');

        Route::post(
            'inventory/adjust',
            [InventoryController::class, 'adjust']
        )->middleware('permission:inventory.adjust');

        Route::get(
            'settings',
            [SettingsController::class, 'show']
        )->middleware('permission:settings.view');

        Route::put(
            'settings',
            [SettingsController::class, 'update']
        )->middleware('permission:settings.update');

        Route::post(
            'settings/khqr-image',
            [SettingsController::class, 'uploadKhqrImage']
        )->middleware('permission:settings.update');

        Route::get(
            'preferences',
            [SettingsController::class, 'preferences']
        );

        Route::put(
            'preferences/{key}',
            [SettingsController::class, 'setPreference']
        )->where('key', '[A-Za-z0-9_.\-]+');

        Route::delete(
            'preferences/{key}',
            [SettingsController::class, 'resetPreference']
        )->where('key', '[A-Za-z0-9_.\-]+');

        Route::prefix('khqr')->group(function () {
            Route::post(
                'payments',
                [KhqrPaymentController::class, 'store']
            )->middleware('permission:sales.create');

            Route::post(
                'payments/{id}/receipt',
                [KhqrPaymentController::class, 'uploadReceipt']
            )
                ->middleware('permission:sales.create')
                ->whereNumber('id');

            Route::get(
                'payments/{id}/status',
                [KhqrPaymentController::class, 'status']
            )->whereNumber('id');

            Route::get(
                'payments',
                [KhqrPaymentController::class, 'index']
            )->middleware('permission:orders.view');

            Route::post(
                'payments/{id}/approve',
                [KhqrPaymentController::class, 'approve']
            )
                ->middleware('permission:orders.update')
                ->whereNumber('id');

            Route::post(
                'payments/{id}/reject',
                [KhqrPaymentController::class, 'reject']
            )
                ->middleware('permission:orders.update')
                ->whereNumber('id');
        });

        Route::get(
            'notifications',
            [MiscController::class, 'notifications']
        );

        Route::post(
            'notifications/read',
            [MiscController::class, 'markRead']
        );

        Route::get(
            'search',
            [MiscController::class, 'search']
        );
    });
});