<?php
require __DIR__ . '/vendor/autoload.php';
$app = require __DIR__ . '/bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

$user = \App\Models\User::where('email', 'sokha@sbs.com')->first();
echo "user id=" . $user->id . " business_id=" . ($user->business_id ?? 'NULL') . PHP_EOL;

// Try snapshot
try {
    $ai = new \App\Services\AiService($user);
    $snap = $ai->snapshot();
    echo "snapshot products count=" . count($snap['products']) . PHP_EOL;
    echo "first product keys=" . json_encode(array_keys($snap['products'][0] ?? null)) . PHP_EOL;
} catch (\Throwable $e) {
    echo "snapshot error: " . $e->getMessage() . PHP_EOL . PHP_EOL;
    echo "trace: " . $e->getTraceAsString() . PHP_EOL;
}