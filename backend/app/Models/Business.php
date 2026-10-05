<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Business extends Model
{
    protected $fillable = ['name', 'subtitle', 'email', 'phone', 'address', 'logo', 'khqr_image', 'base_currency', 'currency', 'exchange_rate', 'tax_rate', 'low_stock_threshold', 'receipt_footer', 'notification_settings'];
    protected $casts = ['exchange_rate' => 'decimal:6', 'tax_rate' => 'decimal:2', 'notification_settings' => 'array'];

    public function branches(): HasMany { return $this->hasMany(Branch::class); }
    public function users(): HasMany { return $this->hasMany(User::class); }
    public function products(): HasMany { return $this->hasMany(Product::class); }
    public function sales(): HasMany { return $this->hasMany(Sale::class); }
    public function exchangeRates(): HasMany { return $this->hasMany(ExchangeRate::class); }
}
