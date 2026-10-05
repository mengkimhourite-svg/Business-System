<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('products', fn (Blueprint $t) => $t->longText('image')->nullable()->change());
        Schema::table('businesses', fn (Blueprint $t) => $t->longText('logo')->nullable()->change());
        Schema::table('brands', fn (Blueprint $t) => $t->longText('logo')->nullable()->change());
        Schema::table('users', fn (Blueprint $t) => $t->longText('avatar')->nullable()->change());
    }

    public function down(): void
    {
        Schema::table('products', fn (Blueprint $t) => $t->text('image')->nullable()->change());
        Schema::table('businesses', fn (Blueprint $t) => $t->text('logo')->nullable()->change());
        Schema::table('brands', fn (Blueprint $t) => $t->text('logo')->nullable()->change());
        Schema::table('users', fn (Blueprint $t) => $t->text('avatar')->nullable()->change());
    }
};
