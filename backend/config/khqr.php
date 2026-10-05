<?php

/**
 * Bakong KHQR static payment configuration.
 * For dynamic QR with API credentials, add KHQR_API_URL, KHQR_MERCHANT_ID, KHQR_API_KEY here.
 */
return [
    'static_qr_image_url' => env('KHQR_STATIC_QR_IMAGE_URL', '/images/khqr-default.png'),
    'merchant_name' => env('KHQR_MERCHANT_NAME', 'KIMHOUR MENG'),
];
