<?php

namespace App\Providers;

use Illuminate\Foundation\Support\Providers\AuthServiceProvider as ServiceProvider;
use Illuminate\Support\Facades\Gate;

class AuthServiceProvider extends ServiceProvider
{
    protected $policies = [];

    public function boot(): void
    {
        // Gate::before: super admins pass every ability; everything else resolves against role permissions (products.create, ...)
        Gate::before(fn ($user, string $ability) => $user->hasPermission($ability) ? true : null);
    }
}
