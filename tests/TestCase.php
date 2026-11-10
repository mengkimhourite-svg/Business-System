<?php

namespace Tests;

use App\Models\User;
use Database\Seeders\BusinessSeeder;
use Database\Seeders\DemoDataSeeder;
use Database\Seeders\PermissionSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Foundation\Testing\TestCase as BaseTestCase;
use Laravel\Sanctum\Sanctum;

abstract class TestCase extends BaseTestCase
{
    use RefreshDatabase;

    public function createApplication()
    {
        $app = require __DIR__.'/../bootstrap/app.php';
        $app->make(\Illuminate\Contracts\Console\Kernel::class)->bootstrap();
        return $app;
    }

    protected function setUp(): void
    {
        parent::setUp();
        $this->seed([PermissionSeeder::class, BusinessSeeder::class, DemoDataSeeder::class]);
    }

    protected function actingAsRole(string $email = 'sokha@sbs.com'): User
    {
        $user = User::where('email', $email)->firstOrFail();
        Sanctum::actingAs($user, ['*']);
        return $user;
    }
}
