<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('payroll_items', function (Blueprint $table) {
            $table->id();
            $table->string('name');
            $table->string('code')->unique();
            $table->enum('type', ['earning', 'deduction']);
            $table->enum('method', ['fixed', 'percent_of_base']);
            $table->decimal('default_value', 12, 2)->default(0);
            $table->boolean('active')->default(true);
            $table->text('description')->nullable();
            $table->timestamps();
            
            // Indexes
            $table->index(['type', 'active']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('payroll_items');
    }
};
