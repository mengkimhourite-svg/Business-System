<?php

namespace App\Services;

use App\Models\User;
use App\Models\UserPreference;

/** User settings, dashboard/navigation/AI preferences — namespaced keys (sbs.dashboard, sbs.layout, sbs.ai.settings, theme, language, currency). */
class PreferenceService
{
    public const ALLOWED_PREFIX = ['sbs.', 'theme', 'language', 'currency'];

    public function all(User $user): array
    {
        $prefs = $user->preferences()->pluck('value', 'key')->all();
        $nested = [];
        foreach ($prefs as $key => $value) {
            $keys = explode('.', $key);
            $ref = &$nested;
            foreach ($keys as $k) {
                if (!isset($ref[$k]) || !is_array($ref[$k])) {
                    $ref[$k] = [];
                }
                $ref = &$ref[$k];
            }
            $ref = $value;
        }
        return $nested;
    }

    public function set(User $user, string $key, mixed $value): void
    {
        abort_unless(collect(self::ALLOWED_PREFIX)->contains(fn ($p) => str_starts_with($key, $p)), 422, 'Unsupported preference key.');
        UserPreference::updateOrCreate(['user_id' => $user->id, 'key' => $key], ['value' => $value]);
    }

    public function reset(User $user, string $key): void
    {
        UserPreference::where('user_id', $user->id)->where('key', $key)->delete();
    }
}
