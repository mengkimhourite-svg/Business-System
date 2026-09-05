<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Laravel\Sanctum\HasApiTokens;

class User extends Authenticatable
{
    use HasApiTokens, Notifiable;

    protected $fillable = ['business_id', 'branch_id', 'role_id', 'name', 'email', 'phone', 'avatar', 'password', 'status', 'last_active_at'];
    protected $hidden = ['password', 'remember_token'];
    protected $casts = ['last_active_at' => 'datetime', 'password' => 'hashed'];

    public function business(): BelongsTo { return $this->belongsTo(Business::class); }
    public function branch(): BelongsTo { return $this->belongsTo(Branch::class); }
    public function role(): BelongsTo { return $this->belongsTo(Role::class); }
    public function preferences(): HasMany { return $this->hasMany(UserPreference::class); }

    /** Flat permission list; '*' for super admin. Backend is the source of truth. */
    public function permissionNames(): array
    {
        if (!$this->role) return [];
        if ($this->role->slug === 'super_admin') return ['*'];
        return $this->role->permissions->pluck('name')->all();
    }

    public function hasPermission(string|array $permission): bool
    {
        $granted = $this->permissionNames();
        if (in_array('*', $granted, true)) return true;
        foreach ((array) $permission as $p) {
            if (in_array($p, $granted, true)) return true;
        }
        return false;
    }

    public function isActive(): bool { return $this->status === 'active'; }
}
