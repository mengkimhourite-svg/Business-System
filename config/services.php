<?php

return [

    'ai' => [
        'url' => env('AI_SERVICE_URL', 'http://127.0.0.1:8001'),
        'internal_key' => env('AI_SERVICE_INTERNAL_KEY', ''),
        'timeout' => (int) env('AI_SERVICE_TIMEOUT', 20),
    ],

    'google' => [
        'client_id' => env('GOOGLE_CLIENT_ID'),
        'client_secret' => env('GOOGLE_CLIENT_SECRET'),
        'redirect' => env('GOOGLE_REDIRECT_URI'),
    ],

];