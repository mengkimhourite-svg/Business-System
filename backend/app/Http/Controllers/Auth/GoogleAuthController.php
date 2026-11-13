<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Http\Request;
use Laravel\Socialite\Facades\Socialite;

class GoogleAuthController extends Controller
{
    /**
     * Redirect user to Google
     */
    public function redirect(Request $request)
    {
        try {
            $clientId = config('services.google.client_id');
            $clientSecret = config('services.google.client_secret');

            if (empty($clientId) || empty($clientSecret)) {
                $msg = 'Google Client ID or Secret is not configured in backend/.env';
                if (!$request->expectsJson() && $request->acceptsHtml()) {
                    $frontendUrl = env('FRONTEND_URL', 'http://localhost:5173');
                    return redirect($frontendUrl . '/#/login?error=' . urlencode($msg));
                }
                return response()->json([
                    'success' => false,
                    'message' => $msg,
                ], 422);
            }

            $targetUrl = Socialite::driver('google')->stateless()->redirect()->getTargetUrl();

            if ($request->expectsJson()) {
                return response()->json([
                    'success' => true,
                    'data' => [
                        'url' => $targetUrl,
                    ],
                ]);
            }

            return redirect($targetUrl);
        } catch (\Throwable $e) {
            $msg = 'Google OAuth initiation failed: ' . $e->getMessage();
            if (!$request->expectsJson() && $request->acceptsHtml()) {
                $frontendUrl = env('FRONTEND_URL', 'http://localhost:5173');
                return redirect($frontendUrl . '/#/login?error=' . urlencode($msg));
            }

            return response()->json([
                'success' => false,
                'message' => $msg,
            ], 500);
        }
    }

    public function callback(Request $request)
    {
        try {
            $googleUser = Socialite::driver('google')
                ->stateless()
                ->user();

            $defaultRole = \App\Models\Role::where('slug', 'sales')->value('id') ?? \App\Models\Role::min('id');
            $defaultBusiness = \App\Models\Business::value('id') ?? 1;

            $user = User::firstOrCreate(
                [
                    'email' => $googleUser->getEmail(),
                ],
                [
                    'name' => $googleUser->getName()
                        ?? $googleUser->getNickname()
                        ?? 'Google User',

                    'password' => bcrypt(str()->random(32)),
                    'business_id' => $defaultBusiness,
                    'role_id' => $defaultRole,
                    'status' => 'active',
                ]
            );
            $user->load('role.permissions', 'branch');
            // Sanctum Token
            $token = $user->createToken('google-auth')->plainTextToken;

            if (!$request->expectsJson() && $request->acceptsHtml()) {
                $frontendUrl = env('FRONTEND_URL', 'http://localhost:5173');
                return redirect($frontendUrl . '/#/auth/google/callback?token=' . urlencode($token));
            }

            return response()->json([
                'success' => true,
                'message' => 'Google login successful',
                'data' => [
                    'token' => $token,
                    'user' => $user,
                ],
            ]);
        } catch (\Exception $e) {
            if (!$request->expectsJson() && $request->acceptsHtml()) {
                $frontendUrl = env('FRONTEND_URL', 'http://localhost:5173');
                return redirect($frontendUrl . '/#/login?error=' . urlencode($e->getMessage()));
            }

            return response()->json([
                'success' => false,
                'message' => 'Google authentication failed',
                'error' => $e->getMessage(),
            ], 500);
        }
    }
}