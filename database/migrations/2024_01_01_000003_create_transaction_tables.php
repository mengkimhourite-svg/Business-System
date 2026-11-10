<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /** Money: decimal(15,2). Quantity: decimal(15,3). Exchange rate: decimal(15,6). Amounts stored in base currency. */
    public function up(): void
    {
        Schema::create('sales', function (Blueprint $t) {
            $t->id();
            $t->foreignId('business_id')->constrained()->cascadeOnDelete();
            $t->foreignId('branch_id')->constrained()->cascadeOnDelete();
            $t->foreignId('customer_id')->nullable()->constrained()->nullOnDelete();
            $t->foreignId('user_id')->nullable()->constrained()->nullOnDelete();
            $t->string('number', 30);
            $t->string('mode', 20)->default('standard'); // quick | standard | wholesale | refund (UI mode, informational)
            $t->decimal('subtotal', 15, 2);
            $t->decimal('discount', 15, 2)->default(0);
            $t->decimal('discount_percent', 5, 2)->default(0);
            $t->decimal('tax', 15, 2)->default(0);
            $t->decimal('tax_rate', 5, 2)->default(0);
            $t->decimal('total', 15, 2);
            $t->string('currency', 3)->default('USD');              // currency the customer paid in
            $t->decimal('exchange_rate', 15, 6)->default(1);        // rate at transaction time (never recomputed)
            $t->decimal('total_in_currency', 15, 2)->nullable();    // converted total snapshot
            $t->string('status', 20)->default('completed');         // pending | completed | cancelled
            $t->string('payment_status', 20)->default('paid');      // paid | unpaid | partial | refunded
            $t->string('idempotency_key', 80)->nullable();
            $t->text('note')->nullable();
            $t->timestamps();
            $t->unique(['business_id', 'number']);
            $t->unique(['business_id', 'idempotency_key']);
            $t->index(['business_id', 'created_at']);
            $t->index(['business_id', 'status']);
            $t->index(['branch_id', 'created_at']);
        });

        Schema::create('sale_items', function (Blueprint $t) {
            $t->id();
            $t->foreignId('sale_id')->constrained()->cascadeOnDelete();
            $t->foreignId('product_id')->nullable()->constrained()->nullOnDelete();
            $t->string('name');
            $t->string('sku', 60)->nullable();
            $t->decimal('quantity', 15, 3);
            $t->decimal('unit_price', 15, 2);
            $t->decimal('unit_cost', 15, 2)->default(0);
            $t->decimal('discount', 15, 2)->default(0);
            $t->decimal('line_total', 15, 2);
            $t->timestamps();
            $t->index('product_id');
        });

        // Orders: the API keeps orders as a view over sales with fulfilment status (one table, no duplication)
        Schema::create('purchases', function (Blueprint $t) {
            $t->id();
            $t->foreignId('business_id')->constrained()->cascadeOnDelete();
            $t->foreignId('branch_id')->constrained()->cascadeOnDelete();
            $t->foreignId('supplier_id')->nullable()->constrained()->nullOnDelete();
            $t->foreignId('user_id')->nullable()->constrained()->nullOnDelete();
            $t->string('number', 30);
            $t->decimal('total', 15, 2);
            $t->string('currency', 3)->default('USD');
            $t->decimal('exchange_rate', 15, 6)->default(1);
            $t->string('status', 20)->default('ordered'); // ordered | received | cancelled
            $t->string('payment_status', 20)->default('unpaid');
            $t->date('expected_at')->nullable();
            $t->timestamp('received_at')->nullable();
            $t->text('note')->nullable();
            $t->timestamps();
            $t->unique(['business_id', 'number']);
            $t->index(['business_id', 'status']);
        });

        Schema::create('purchase_items', function (Blueprint $t) {
            $t->id();
            $t->foreignId('purchase_id')->constrained()->cascadeOnDelete();
            $t->foreignId('product_id')->nullable()->constrained()->nullOnDelete();
            $t->string('name');
            $t->string('sku', 60)->nullable();
            $t->decimal('quantity', 15, 3);
            $t->decimal('unit_cost', 15, 2);
            $t->decimal('line_total', 15, 2);
            $t->timestamps();
        });

        Schema::create('payments', function (Blueprint $t) {
            $t->id();
            $t->foreignId('business_id')->constrained()->cascadeOnDelete();
            $t->morphs('payable'); // sale | purchase
            $t->foreignId('user_id')->nullable()->constrained()->nullOnDelete();
            $t->string('method', 20); // cash | card | qr | bank_transfer
            $t->decimal('amount', 15, 2);              // base currency
            $t->decimal('received', 15, 2)->nullable(); // in paid currency
            $t->decimal('change_given', 15, 2)->default(0);
            $t->string('currency', 3)->default('USD');
            $t->decimal('exchange_rate', 15, 6)->default(1);
            $t->string('reference', 80)->nullable();
            $t->timestamps();
            $t->index(['business_id', 'created_at']);
        });

        Schema::create('expenses', function (Blueprint $t) {
            $t->id();
            $t->foreignId('business_id')->constrained()->cascadeOnDelete();
            $t->foreignId('branch_id')->nullable()->constrained()->nullOnDelete();
            $t->foreignId('user_id')->nullable()->constrained()->nullOnDelete();
            $t->string('reference', 30);
            $t->string('category', 40);
            $t->decimal('amount', 15, 2);
            $t->string('currency', 3)->default('USD');
            $t->decimal('exchange_rate', 15, 6)->default(1);
            $t->string('payment_method', 20)->default('cash');
            $t->date('date');
            $t->string('status', 20)->default('approved'); // pending | approved | rejected
            $t->text('note')->nullable();
            $t->timestamps();
            $t->unique(['business_id', 'reference']);
            $t->index(['business_id', 'date']);
            $t->index(['business_id', 'category']);
        });
    }

    public function down(): void
    {
        foreach (['expenses', 'payments', 'purchase_items', 'purchases', 'sale_items', 'sales'] as $table) {
            Schema::dropIfExists($table);
        }
    }
};
