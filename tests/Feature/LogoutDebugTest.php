<?php

namespace Tests\Feature;

use Tests\TestCase;

class LogoutDebugTest extends TestCase
{
    public function test_logout_step_by_step(): void
    {
        $loginRes = $this->postJson('/api/v1/auth/login', ['email' => 'piseth@sbs.com', 'password' => 'password']);
        $token = $loginRes->json('data.token');
        $tokenId = explode('|', $token, 2)[0];

        // Verify token works
        $this->withToken($token)->getJson('/api/v1/auth/me')->assertOk();

        // Logout
        $this->withToken($token)->postJson('/api/v1/auth/logout')->assertOk();
        echo "Token exists after logout: " . (\Laravel\Sanctum\PersonalAccessToken::where('id', (int) $tokenId)->exists() ? 'YES' : 'NO') . "\n";

        // Start fresh request - no cookies at all
        $this->app['session']->flush();
        $this->app['auth']->forgetGuards();
        $meRes2 = $this->withToken($token)->getJson('/api/v1/auth/me');
        echo "ME after logout (fresh session) status: " . $meRes2->status() . "\n";
    }
}
