<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('categories', function (Blueprint $t) {
            $t->id();
            $t->foreignId('business_id')->constrained()->cascadeOnDelete();
            $t->string('name');
            $t->string('description')->nullable();
            $t->string('status', 20)->default('active');
            $t->timestamps();
            $t->index(['business_id', 'status']);
        });

        Schema::create('brands', function (Blueprint $t) {
            $t->id();
            $t->foreignId('business_id')->constrained()->cascadeOnDelete();
            $t->string('name');
            $t->string('description')->nullable();
            $t->string('website')->nullable();
            $t->text('logo')->nullable();
            $t->string('status', 20)->default('active');
            $t->timestamps();
            $t->index(['business_id', 'status']);
        });

        Schema::create('suppliers', function (Blueprint $t) {
            $t->id();
            $t->foreignId('business_id')->constrained()->cascadeOnDelete();
            $t->string('name');
            $t->string('contact_name')->nullable();
            $t->string('email')->nullable();
            $t->string('phone', 40)->nullable();
            $t->text('address')->nullable();
            $t->string('status', 20)->default('active');
            $t->timestamps();
            $t->index(['business_id', 'status']);
        });

        Schema::create('customers', function (Blueprint $t) {
            $t->id();
            $t->foreignId('business_id')->constrained()->cascadeOnDelete();
            $t->string('name');
            $t->string('email')->nullable();
            $t->string('phone', 40)->nullable();
            $t->text('address')->nullable();
            $t->string('type', 20)->default('retail'); // retail | wholesale
            $t->string('status', 20)->default('active');
            $t->timestamps();
            $t->index(['business_id', 'status']);
            $t->index(['business_id', 'phone']);
        });

        Schema::create('products', function (Blueprint $t) {
            $t->id();
            $t->foreignId('business_id')->constrained()->cascadeOnDelete();
            $t->foreignId('category_id')->nullable()->constrained()->nullOnDelete();
            $t->foreignId('brand_id')->nullable()->constrained()->nullOnDelete();
            $t->foreignId('supplier_id')->nullable()->constrained()->nullOnDelete();
            $t->string('name');
            $t->string('sku', 60);
            $t->string('barcode', 60)->nullable();
            $t->string('unit', 20)->default('pcs');
            $t->decimal('cost_price', 15, 2)->default(0);
            $t->decimal('selling_price', 15, 2)->default(0);
            $t->decimal('wholesale_price', 15, 2)->nullable();
            $t->decimal('reorder_level', 15, 3)->default(10);
            $t->text('description')->nullable();
            $t->text('image')->nullable();
            $t->string('status', 20)->default('active');
            $t->timestamps();
            $t->unique(['business_id', 'sku']);
            $t->index(['business_id', 'barcode']);
            $t->index(['business_id', 'status']);
            $t->index(['business_id', 'category_id']);
        });

        Schema::create('inventory', function (Blueprint $t) { // stock per product per branch
            $t->id();
            $t->foreignId('business_id')->constrained()->cascadeOnDelete();
            $t->foreignId('branch_id')->constrained()->cascadeOnDelete();
            $t->foreignId('product_id')->constrained()->cascadeOnDelete();
            $t->decimal('quantity', 15, 3)->default(0);
            $t->timestamps();
            $t->unique(['branch_id', 'product_id']);
            $t->index(['business_id', 'product_id']);
        });

        Schema::create('inventory_movements', function (Blueprint $t) {
            $t->id();
            $t->foreignId('business_id')->constrained()->cascadeOnDelete();
            $t->foreignId('branch_id')->constrained()->cascadeOnDelete();
            $t->foreignId('product_id')->constrained()->cascadeOnDelete();
            $t->foreignId('user_id')->nullable()->constrained()->nullOnDelete();
            $t->string('type', 20); // in | out | adjustment
            $t->decimal('quantity', 15, 3); // signed
            $t->decimal('quantity_after', 15, 3)->nullable();
            $t->string('reason')->nullable();
            $t->string('reference', 60)->nullable();
            $t->nullableMorphs('source'); // sale | purchase | manual adjustment
            $t->timestamps();
            $t->index(['business_id', 'created_at']);
            $t->index(['product_id', 'created_at']);
        });
    }

    public function down(): void
    {
        foreach (['inventory_movements', 'inventory', 'products', 'customers', 'suppliers', 'brands', 'categories'] as $table) {
            Schema::dropIfExists($table);
        }
    }
};
