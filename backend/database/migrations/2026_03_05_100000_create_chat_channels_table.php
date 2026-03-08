<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('chat_channels', function (Blueprint $table) {
            $table->id();
            $table->string('name');
            $table->string('slug')->unique();
            $table->text('description')->nullable();
            $table->enum('type', ['public', 'private', 'direct'])->default('public');
            $table->foreignId('created_by')->constrained('users')->onDelete('cascade');
            $table->foreignId('organization_id')->nullable()->constrained('branches')->onDelete('cascade');
            $table->boolean('is_archived')->default(false);
            $table->json('metadata')->nullable();
            $table->timestamps();
            $table->softDeletes();

            $table->index(['type', 'is_archived']);
            $table->index('created_by');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('chat_channels');
    }
};
