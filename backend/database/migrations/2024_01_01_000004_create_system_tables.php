<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('notifications', function (Blueprint $t) {
            $t->id();
            $t->foreignId('business_id')->constrained()->cascadeOnDelete();
            $t->foreignId('user_id')->nullable()->constrained()->cascadeOnDelete(); // null = broadcast to business
            $t->string('type', 20)->default('info');
            $t->string('title');
            $t->text('message')->nullable();
            $t->string('link')->nullable();
            $t->timestamp('read_at')->nullable();
            $t->timestamps();
            $t->index(['business_id', 'user_id', 'read_at']);
        });

        Schema::create('activity_logs', function (Blueprint $t) {
            $t->id();
            $t->foreignId('business_id')->nullable()->constrained()->cascadeOnDelete();
            $t->foreignId('user_id')->nullable()->constrained()->nullOnDelete();
            $t->string('action', 60);
            $t->nullableMorphs('subject');
            $t->json('properties')->nullable();
            $t->string('ip', 45)->nullable();
            $t->timestamps();
            $t->index(['business_id', 'created_at']);
        });

        // One flexible, namespaced key/value store per user covers user_settings, dashboard_preferences,
        // navigation_preferences and ai_preferences without four near-identical tables.
        Schema::create('user_preferences', function (Blueprint $t) {
            $t->id();
            $t->foreignId('user_id')->constrained()->cascadeOnDelete();
            $t->string('key', 80); // e.g. sbs.dashboard, sbs.layout, sbs.ai.settings, theme, language, currency
            $t->json('value')->nullable();
            $t->timestamps();
            $t->unique(['user_id', 'key']);
        });

        Schema::create('ai_insights', function (Blueprint $t) {
            $t->id();
            $t->foreignId('business_id')->constrained()->cascadeOnDelete();
            $t->string('type', 40);      // sales_prediction | inventory_prediction | ...
            $t->string('title');
            $t->text('summary')->nullable();
            $t->json('payload');          // full structured insight
            $t->string('source', 20)->default('rules');
            $t->timestamp('generated_at');
            $t->timestamps();
            $t->index(['business_id', 'type', 'generated_at']);
        });

        Schema::create('ai_chat_messages', function (Blueprint $t) {
            $t->id();
            $t->foreignId('business_id')->constrained()->cascadeOnDelete();
            $t->foreignId('user_id')->constrained()->cascadeOnDelete();
            $t->string('role', 12); // user | assistant
            $t->text('content')->nullable();
            $t->string('intent', 40)->nullable();
            $t->json('payload')->nullable();
            $t->string('page', 40)->nullable();
            $t->timestamps();
            $t->index(['user_id', 'created_at']);
        });
    }

    public function down(): void
    {
        foreach (['ai_chat_messages', 'ai_insights', 'user_preferences', 'activity_logs', 'notifications'] as $table) {
            Schema::dropIfExists($table);
        }
    }
};
