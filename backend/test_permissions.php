<?php
require __DIR__.'/vendor/autoload.php';
$app = require_once __DIR__.'/bootstrap/app.php';
$app->make(Illuminate\Contracts\Console\Kernel::class)->bootstrap();

use App\Models\User;

// Simulate exactly what AuthController::me() does
$user = User::with('role.permissions', 'branch')->where('email', 'sokha@sbs.com')->first();

if (!$user) {
    echo "ERROR: User not found\n";
    exit(1);
}

echo "=== Raw User ===\n";
echo "ID: {$user->id}\n";
echo "Role ID: " . var_export($user->role_id, true) . "\n";
echo "role relation loaded: " . var_export($user->relationLoaded('role'), true) . "\n";
echo "role.permissions loaded: " . var_export($user->relationLoaded('role.permissions'), true) . "\n";

echo "\n=== Role ===\n";
if ($user->role) {
    echo "Role name: {$user->role->name}\n";
    echo "Role slug: {$user->role->slug}\n";
    echo "Permissions count: {$user->role->permissions->count()}\n";
} else {
    echo "ROLE IS NULL!\n";
}

echo "\n=== permissionNames() result ===\n";
$result = $user->permissionNames();
echo json_encode($result) . "\n";

echo "\n=== Full profile() output ===\n";
// Replicate the profile() method
$profile = [
    'id' => $user->id, 'name' => $user->name, 'email' => $user->email,
    'role' => $user->role ? ['id' => $user->role->id, 'name' => $user->role->name, 'slug' => $user->role->slug] : null,
    'permissions' => $user->permissionNames(),
];
echo json_encode($profile, JSON_PRETTY_PRINT) . "\n";
