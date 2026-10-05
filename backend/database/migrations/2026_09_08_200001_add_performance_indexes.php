<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('sale_items', function (Blueprint $t) {
            if (!Schema::hasIndex('sale_items', 'sale_items_sale_id_index')) {
                $t->index('sale_id');
            }
        });

        Schema::table('payments', function (Blueprint $t) {
            if (!Schema::hasIndex('payments', 'payments_payable_type_payable_id_index')) {
                $t->index(['payable_type', 'payable_id']);
            }
        });

        Schema::table('sales', function (Blueprint $t) {
            $t->index(['business_id', 'status', 'created_at']);
        });

        Schema::table('products', function (Blueprint $t) {
            $t->index(['business_id', 'status', 'category_id']);
        });

        Schema::table('inventory', function (Blueprint $t) {
            $t->index(['business_id', 'branch_id', 'product_id']);
        });
    }

    public function down(): void
    {
        Schema::table('inventory', function (Blueprint $t) {
            $t->dropIndex(['business_id', 'branch_id', 'product_id']);
        });

        Schema::table('products', function (Blueprint $t) {
            $t->dropIndex(['business_id', 'status', 'category_id']);
        });

        Schema::table('sales', function (Blueprint $t) {
            $t->dropIndex(['business_id', 'status', 'created_at']);
        });

        Schema::table('payments', function (Blueprint $t) {
            $t->dropIndex(['payable_type', 'payable_id']);
            $t->dropIndex('payments_payable_id_index');
        });

        Schema::table('sale_items', function (Blueprint $t) {
            $t->dropIndex('sale_items_sale_id_index');
        });
    }
};
