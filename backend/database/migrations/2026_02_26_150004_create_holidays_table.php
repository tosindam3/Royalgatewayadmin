<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('holidays', function (Blueprint $table) {
            $table->id();
            $table->string('name');
            $table->date('date');
            $table->year('year');
            $table->enum('type', ['global', 'regional', 'branch_specific'])->default('global');
            $table->foreignId('branch_id')->nullable()->constrained('branches')->onDelete('cascade');
            $table->text('description')->nullable();
            $table->boolean('is_mandatory')->default(true);
            $table->boolean('is_recurring')->default(false); // Repeats annually
            $table->timestamps();
            
            // Performance indexes
            $table->index(['date', 'type']);
            $table->index(['year', 'type']);
            $table->index('branch_id');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('holidays');
    }
};
