<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use App\Models\User;
use Laravel\Socialite\Facades\Socialite;

class GoogleAuthController extends Controller
{
    /**
     * Redirect user to Google
     */
    public function redirect()
    {
        return Socialite::driver('google')->stateless()->redirect();
    }
    public function callback()
    {
        try {
            $googleUser = Socialite::driver('google')
                ->stateless()
                ->user();

            $user = User::firstOrCreate(
                [
                    'email' => $googleUser->getEmail(),
                ],
                [
                    'name' => $googleUser->getName()
                        ?? $googleUser->getNickname()
                        ?? 'Google User',

                    'password' => bcrypt(str()->random(32)),
                ]
            );
            // Sanctum Token
            $token = $user->createToken('google-auth')->plainTextToken;

            return response()->json([
                'success' => true,
                'message' => 'Google login successful',
                'data' => [
                    'token' => $token,
                    'user' => $user,
                ],
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Google authentication failed',
                'error' => $e->getMessage(),
            ], 500);
        }
    }
}