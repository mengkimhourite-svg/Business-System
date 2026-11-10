<?php
require __DIR__.'/vendor/autoload.php';
$app = require_once __DIR__.'/bootstrap/app.php';
$app->make(Illuminate\Contracts\Console\Kernel::class)->bootstrap();

use App\Models\User;

// Test 1: With eager loading (like login and me endpoints)
$user = User::with('role.permissions', 'branch')->where('email', 'sokha@sbs.com')->first();
echo "=== With eager load (login/me endpoint) ===\n";
echo "permissionNames: " . json_encode($user->permissionNames()) . "\n";
echo "profile permissions: " . json_encode((fn() => $user->permissionNames())()) . "\n";

// Test 2: Without eager loading (simulating stale state)
$user2 = User::find(1);
echo "\n=== Without eager load ===\n";
echo "role loaded: " . var_export($user2->relationLoaded('role'), true) . "\n";
echo "permissionNames: " . json_encode($user2->permissionNames()) . "\n";

// Test 3: With only role loaded (no permissions)
$user3 = User::with('role')->find(1);
echo "\n=== With role but NOT permissions ===\n";
echo "role loaded: " . var_export($user3->relationLoaded('role'), true) . "\n";
echo "role.permissions loaded: " . var_export($user3->relationLoaded('role.permissions'), true) . "\n";
echo "permissionNames: " . json_encode($user3->permissionNames()) . "\n";
