<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('payments', function (Blueprint $table) {
            $table->string('status', 20)->nullable()->default(null)->after('reference');
            $table->text('qr_data')->nullable()->after('status');
            $table->string('qr_reference', 100)->nullable()->after('qr_data');
            $table->string('receipt_image', 500)->nullable()->after('qr_reference');
            $table->timestamp('paid_at')->nullable()->after('receipt_image');
            $table->timestamp('expired_at')->nullable()->after('paid_at');
            $table->timestamp('reviewed_at')->nullable()->after('expired_at');
            $table->string('reviewed_by')->nullable()->after('reviewed_at');
            $table->text('review_notes')->nullable()->after('reviewed_by');
            $table->index(['business_id', 'status']);
            $table->index(['business_id', 'qr_reference']);
        });
    }

    public function down(): void
    {
        Schema::table('payments', function (Blueprint $table) {
            $table->dropColumn([
                'status', 'qr_data', 'qr_reference', 'receipt_image',
                'paid_at', 'expired_at', 'reviewed_at', 'reviewed_by', 'review_notes',
            ]);
        });
    }
};
