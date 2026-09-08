<?php

require __DIR__.'/vendor/autoload.php';

$app = require_once __DIR__.'/bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

use Illuminate\Support\Facades\DB;

echo "=== Sales permissions ===\n";
$perms = DB::table('permissions')->where('name', 'like', 'sales.%')->get();
foreach ($perms as $p) echo "  [{$p->id}] {$p->name}\n";

echo "\n=== Roles ===\n";
$roles = DB::table('roles')->get();
foreach ($roles as $r) echo "  [{$r->id}] slug={$r->slug} name={$r->name} business_id={$r->business_id}\n";

echo "\n=== Cashier role (slug='sales') permission_role mappings ===\n";
$cashierRole = DB::table('roles')->where('slug', 'sales')->first();
if ($cashierRole) {
    echo "  Role ID: {$cashierRole->id}\n";
    $perms = DB::table('permission_role')->where('role_id', $cashierRole->id)->get();
    echo "  Permission count: " . count($perms) . "\n";
    foreach ($perms as $pr) {
        $perm = DB::table('permissions')->where('id', $pr->permission_id)->first();
        echo "    [{$pr->permission_id}] " . ($perm ? $perm->name : 'UNKNOWN') . "\n";
    }
} else {
    echo "  Cashier role NOT FOUND!\n";
}

echo "\n=== Users ===\n";
$users = DB::table('users')->select('id', 'name', 'email', 'role_id', 'branch_id', 'business_id', 'status')->get();
foreach ($users as $u) echo "  [{$u->id}] {$u->name} ({$u->email}) role_id={$u->branch_id} branch_id={$u->branch_id} business_id={$u->business_id} status={$u->status}\n";

echo "\nDone.\n";
