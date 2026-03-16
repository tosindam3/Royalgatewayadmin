<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::table('memos', function (Blueprint $table) {
            $table->index(['sender_id', 'status', 'created_at'], 'memos_sender_status_created_idx');
            $table->index(['organization_id', 'created_at'], 'memos_org_created_idx');
            $table->index(['thread_id', 'created_at'], 'memos_thread_created_idx');
            $table->index(['status', 'scheduled_at'], 'memos_status_scheduled_idx');
            $table->fullText(['subject', 'body_plain'], 'memos_fulltext_idx');
        });

        Schema::table('memo_recipients', function (Blueprint $table) {
            $table->index(['recipient_id', 'status', 'created_at'], 'memo_recipients_user_status_created_idx');
            $table->index(['recipient_id', 'is_starred'], 'memo_recipients_user_starred_idx');
            $table->index(['recipient_id', 'folder_id'], 'memo_recipients_user_folder_idx');
            $table->index(['memo_id', 'recipient_id'], 'memo_recipients_memo_user_idx');
        });

        Schema::table('memo_attachments', function (Blueprint $table) {
            $table->index(['memo_id', 'created_at'], 'memo_attachments_memo_created_idx');
            $table->index('uploaded_by', 'memo_attachments_uploader_idx');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('memos', function (Blueprint $table) {
            $table->dropIndex('memos_sender_status_created_idx');
            $table->dropIndex('memos_org_created_idx');
            $table->dropIndex('memos_thread_created_idx');
            $table->dropIndex('memos_status_scheduled_idx');
            $table->dropFullText('memos_fulltext_idx');
        });

        Schema::table('memo_recipients', function (Blueprint $table) {
            $table->dropIndex('memo_recipients_user_status_created_idx');
            $table->dropIndex('memo_recipients_user_starred_idx');
            $table->dropIndex('memo_recipients_user_folder_idx');
            $table->dropIndex('memo_recipients_memo_user_idx');
        });

        Schema::table('memo_attachments', function (Blueprint $table) {
            $table->dropIndex('memo_attachments_memo_created_idx');
            $table->dropIndex('memo_attachments_uploader_idx');
        });
    }
};
