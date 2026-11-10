<?php

namespace Tests\Feature;

use Tests\TestCase;

class AuthTest extends TestCase
{
    public function test_login_returns_token_and_profile(): void
    {
        $res = $this->postJson('/api/v1/auth/login', ['email' => 'sokha@sbs.com', 'password' => 'password']);
        $res->assertOk()->assertJsonPath('success', true)->assertJsonStructure(['data' => ['token', 'user' => ['id', 'name', 'role', 'permissions']]]);
        $this->assertContains('*', $res->json('data.user.permissions'));
    }

    public function test_login_rejects_invalid_credentials(): void
    {
        $this->postJson('/api/v1/auth/login', ['email' => 'sokha@sbs.com', 'password' => 'wrongpass'])->assertStatus(401)->assertJsonPath('success', false);
    }

    public function test_protected_route_requires_authentication(): void
    {
        $this->getJson('/api/v1/auth/me')->assertStatus(401)->assertJsonPath('message', 'Unauthenticated');
    }

    public function test_me_and_logout(): void
    {
        $token = $this->postJson('/api/v1/auth/login', ['email' => 'piseth@sbs.com', 'password' => 'password'])->json('data.token');
        $this->withToken($token)->getJson('/api/v1/auth/me')->assertOk()->assertJsonPath('data.role.slug', 'sales');
        $this->withToken($token)->postJson('/api/v1/auth/logout')->assertOk();
        // The auth guard memoizes the resolved user in-process; without clearing it,
        // a deleted token would still resolve from cache. Forget guards so the second
        // request truly re-authenticates against the (now token-less) store.
        $this->app['auth']->forgetGuards();
        $this->withToken($token)->getJson('/api/v1/auth/me')->assertStatus(401);
    }

    public function test_public_settings_expose_branding_only(): void
    {
        $this->getJson('/api/v1/settings/public')->assertOk()->assertJsonPath('data.business_name', 'Angkor Mart')->assertJsonMissingPath('data.business_email');
    }
}
