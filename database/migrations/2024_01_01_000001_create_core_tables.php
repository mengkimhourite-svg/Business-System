<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('businesses', function (Blueprint $t) {
            $t->id();
            $t->string('name');
            $t->string('subtitle')->nullable();
            $t->string('email')->nullable();
            $t->string('phone', 40)->nullable();
            $t->text('address')->nullable();
            $t->text('logo')->nullable();
            $t->string('base_currency', 3)->default('USD');
            $t->string('currency', 3)->default('USD');
            $t->decimal('exchange_rate', 15, 6)->default(4047);
            $t->decimal('tax_rate', 5, 2)->default(10);
            $t->unsignedInteger('low_stock_threshold')->default(10);
            $t->string('receipt_footer')->nullable();
            $t->json('notification_settings')->nullable();
            $t->timestamps();
        });

        Schema::create('branches', function (Blueprint $t) {
            $t->id();
            $t->foreignId('business_id')->constrained()->cascadeOnDelete();
            $t->string('name');
            $t->string('code', 30);
            $t->text('address')->nullable();
            $t->string('phone', 40)->nullable();
            $t->string('manager')->nullable();
            $t->string('status', 20)->default('active');
            $t->timestamps();
            $t->unique(['business_id', 'code']);
            $t->index(['business_id', 'status']);
        });

        Schema::create('roles', function (Blueprint $t) {
            $t->id();
            $t->foreignId('business_id')->nullable()->constrained()->cascadeOnDelete();
            $t->string('name');
            $t->string('slug', 60);
            $t->string('description')->nullable();
            $t->boolean('is_system')->default(false);
            $t->timestamps();
            $t->unique(['business_id', 'slug']);
        });

        Schema::create('permissions', function (Blueprint $t) {
            $t->id();
            $t->string('name', 80)->unique(); // products.create
            $t->string('group', 40);
            $t->string('ability', 20);
            $t->timestamps();
            $t->index('group');
        });

        Schema::create('permission_role', function (Blueprint $t) {
            $t->foreignId('permission_id')->constrained()->cascadeOnDelete();
            $t->foreignId('role_id')->constrained()->cascadeOnDelete();
            $t->primary(['permission_id', 'role_id']);
        });

        Schema::create('users', function (Blueprint $t) {
            $t->id();
            $t->foreignId('business_id')->nullable()->constrained()->nullOnDelete();
            $t->foreignId('branch_id')->nullable()->constrained()->nullOnDelete();
            $t->foreignId('role_id')->nullable()->constrained()->nullOnDelete();
            $t->string('name');
            $t->string('email')->unique();
            $t->string('phone', 40)->nullable();
            $t->text('avatar')->nullable();
            $t->string('password');
            $t->string('status', 20)->default('active');
            $t->timestamp('last_active_at')->nullable();
            $t->timestamp('email_verified_at')->nullable();
            $t->rememberToken();
            $t->timestamps();
            $t->index(['business_id', 'status']);
        });

        Schema::create('password_reset_tokens', function (Blueprint $t) {
            $t->string('email')->primary();
            $t->string('token');
            $t->timestamp('created_at')->nullable();
        });

        if (!Schema::hasTable('personal_access_tokens')) {
            Schema::create('personal_access_tokens', function (Blueprint $t) {
                $t->id();
                $t->morphs('tokenable');
                $t->string('name');
                $t->string('token', 64)->unique();
                $t->text('abilities')->nullable();
                $t->timestamp('last_used_at')->nullable();
                $t->timestamp('expires_at')->nullable();
                $t->timestamps();
            });
        }

        Schema::create('currencies', function (Blueprint $t) {
            $t->string('code', 3)->primary();
            $t->string('name', 60);
            $t->string('symbol', 5);
            $t->unsignedTinyInteger('decimals')->default(2);
            $t->boolean('is_active')->default(true);
        });

        Schema::create('exchange_rates', function (Blueprint $t) {
            $t->id();
            $t->foreignId('business_id')->constrained()->cascadeOnDelete();
            $t->string('from_currency', 3);
            $t->string('to_currency', 3);
            $t->decimal('rate', 15, 6);
            $t->date('effective_date');
            $t->foreignId('created_by')->nullable()->constrained('users')->nullOnDelete();
            $t->timestamps();
            $t->index(['business_id', 'from_currency', 'to_currency', 'effective_date'], 'exchange_rates_lookup_idx');
        });
    }

    public function down(): void
    {
        foreach (['exchange_rates', 'currencies', 'personal_access_tokens', 'password_reset_tokens', 'users', 'permission_role', 'permissions', 'roles', 'branches', 'businesses'] as $table) {
            Schema::dropIfExists($table);
        }
    }
};
