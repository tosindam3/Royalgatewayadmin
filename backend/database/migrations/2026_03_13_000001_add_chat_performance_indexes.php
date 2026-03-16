<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('chat_messages', function (Blueprint $table) {
            // Add composite index for common queries
            $table->index(['channel_id', 'is_deleted', 'created_at'], 'idx_channel_deleted_created');
            $table->index('is_deleted');
        });

        Schema::table('chat_channel_members', function (Blueprint $table) {
            // Add index for last_read_at queries
            $table->index('last_read_at');
        });

        Schema::table('chat_message_reactions', function (Blueprint $table) {
            // Add composite index for reaction grouping
            $table->index(['message_id', 'emoji'], 'idx_message_emoji');
        });
    }

    public function down(): void
    {
        Schema::table('chat_messages', function (Blueprint $table) {
            $table->dropIndex('idx_channel_deleted_created');
            $table->dropIndex(['is_deleted']);
        });

        Schema::table('chat_channel_members', function (Blueprint $table) {
            $table->dropIndex(['last_read_at']);
        });

        Schema::table('chat_message_reactions', function (Blueprint $table) {
            $table->dropIndex('idx_message_emoji');
        });
    }
};
