<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('sales', function (Blueprint $t) {
            $t->index('customer_id');
            $t->index('user_id');
        });

        Schema::table('purchase_items', function (Blueprint $t) {
            $t->index('purchase_id');
            $t->index('product_id');
        });

        Schema::table('expenses', function (Blueprint $t) {
            $t->index('user_id');
        });
    }

    public function down(): void
    {
        Schema::table('expenses', function (Blueprint $t) {
            $t->dropIndex('user_id');
        });

        Schema::table('purchase_items', function (Blueprint $t) {
            $t->dropIndex('product_id');
            $t->dropIndex('purchase_id');
        });

        Schema::table('sales', function (Blueprint $t) {
            $t->dropIndex('user_id');
            $t->dropIndex('customer_id');
        });
    }
};
