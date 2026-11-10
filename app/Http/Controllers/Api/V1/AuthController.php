<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Http\Requests\LoginRequest;
use App\Models\Role;
use App\Models\User;
use App\Support\ApiResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Password;
use Illuminate\Support\Facades\RateLimiter;
use Illuminate\Validation\ValidationException;

/** User authentication: login, register, logout, profile, password reset. */
class AuthController extends Controller
{
    public function login(LoginRequest $request)
    {
        $key = 'login:'.strtolower($request->email).'|'.$request->ip();
        if (RateLimiter::tooManyAttempts($key, 5)) return ApiResponse::error('Too many login attempts. Please try again later.', 429);

        $user = User::with('role.permissions', 'branch')->where('email', $request->email)->first();
        if (!$user || !Hash::check($request->password, $user->password)) {
            RateLimiter::hit($key, 60);
            return ApiResponse::error('Invalid email or password.', 401);
        }
        if (!$user->isActive()) return ApiResponse::error('Your account is inactive.', 403);
        RateLimiter::clear($key);

        $user->forceFill(['last_active_at' => now()])->save();
        $token = $user->createToken('spa', ['*'], $request->boolean('remember') ? now()->addDays(30) : now()->addHours(12))->plainTextToken;
        return ApiResponse::success(['token' => $token, 'user' => $this->profile($user)]);
    }

    public function me(Request $request)
    {
        return ApiResponse::success($this->profile($request->user()->load('role.permissions', 'branch')));
    }

    public function logout(Request $request)
    {
        $request->user()->currentAccessToken()?->delete();
        $request->user()->tokens()->delete();
        return ApiResponse::success(null, 'Logged out');
    }

    public function updateProfile(Request $request)
    {
        $data = $request->validate(['name' => ['sometimes', 'string', 'max:100'], 'phone' => ['nullable', 'string', 'max:40'], 'avatar' => ['nullable', 'string', 'max:2000000']]);
        $request->user()->update($data);
        return ApiResponse::success($this->profile($request->user()->fresh('role.permissions', 'branch')), 'Profile updated');
    }

    public function changePassword(Request $request)
    {
        $data = $request->validate(['current_password' => ['required'], 'new_password' => ['required', 'string', 'min:6']]);
        if (!Hash::check($data['current_password'], $request->user()->password)) {
            throw ValidationException::withMessages(['current_password' => ['The current password is incorrect.']]);
        }
        $request->user()->update(['password' => $data['new_password']]);
        return ApiResponse::success(null, 'Password changed');
    }

    public function register(LoginRequest $request)
    {
        $data = $request->validate([
            'name' => ['required', 'string', 'max:100'],
            'email' => ['required', 'email', 'unique:users,email'],
            'password' => ['required', 'string', 'min:6', 'confirmed'],
        ]);
        $user = User::create([
            'name' => $data['name'],
            'email' => $data['email'],
            'password' => $data['password'],
            'business_id' => 1,
            'role_id' => Role::where('slug', 'sales')->value('id') ?? Role::min('id'),
            'status' => 'active',
        ]);
        $token = $user->createToken('spa', ['*'])->plainTextToken;
        return ApiResponse::success(['token' => $token, 'user' => $this->profile($user->load('role.permissions', 'branch'))], 'Registered', 201);
    }

    public function forgotPassword(Request $request)
    {
        $request->validate(['email' => ['required', 'email']]);
        try {
            Password::sendResetLink($request->only('email'));
        } catch (\Throwable $e) {
            \Illuminate\Support\Facades\Log::warning('Password reset link delivery failed: ' . $e->getMessage());
        }
        return ApiResponse::success(null, 'If an account exists, a reset link has been sent.');
    }

    public function resetPassword(Request $request)
    {
        $request->validate(['token' => ['required'], 'email' => ['required', 'email'], 'password' => ['required', 'confirmed', 'min:6']]);
        $status = Password::reset($request->only('email', 'password', 'password_confirmation', 'token'), fn (User $user, string $password) => $user->forceFill(['password' => $password])->save());
        return $status === Password::PASSWORD_RESET ? ApiResponse::success(null, 'Password has been reset.') : ApiResponse::error('This reset link is invalid or has expired.', 422);
    }

    private function profile(User $user): array
    {
        return [
            'id' => $user->id, 'name' => $user->name, 'email' => $user->email, 'phone' => $user->phone, 'avatar' => $user->avatar, 'status' => $user->status,
            'business_id' => $user->business_id, 'branch_id' => $user->branch_id, 'branch_name' => $user->branch?->name,
            'role' => $user->role ? ['id' => $user->role->id, 'name' => $user->role->name, 'slug' => $user->role->slug] : null,
            'permissions' => $user->permissionNames(),
        ];
    }
}


