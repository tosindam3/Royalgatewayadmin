<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // 1. Create memo_threads table
        Schema::create('memo_threads', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('organization_id')->default(1);
            $table->unsignedBigInteger('first_memo_id')->nullable();
            $table->string('subject');
            $table->integer('memo_count')->default(1);
            $table->timestamp('last_activity_at')->nullable();
            $table->timestamps();
            
            $table->index(['organization_id', 'last_activity_at']);
        });

        // 2. Create memos table
        Schema::create('memos', function (Blueprint $table) {
            $table->id();
            $table->foreignId('sender_id')->constrained('users')->onDelete('cascade');
            $table->unsignedBigInteger('organization_id')->default(1);
            $table->foreignId('thread_id')->nullable()->constrained('memo_threads')->onDelete('set null');
            $table->foreignId('parent_memo_id')->nullable()->constrained('memos')->onDelete('set null');
            $table->string('subject');
            $table->longText('body');
            $table->text('body_plain')->nullable();
            $table->enum('priority', ['low', 'normal', 'high', 'urgent'])->default('normal');
            $table->enum('status', ['draft', 'scheduled', 'sent', 'failed'])->default('draft');
            $table->enum('type', ['memo', 'reply', 'forward'])->default('memo');
            $table->timestamp('scheduled_at')->nullable();
            $table->timestamp('sent_at')->nullable();
            $table->boolean('requires_read_receipt')->default(false);
            $table->boolean('is_confidential')->default(false);
            $table->json('metadata')->nullable();
            $table->timestamps();
            $table->softDeletes();
            
            $table->index(['sender_id', 'created_at']);
            $table->index(['organization_id', 'status']);
            $table->index(['thread_id', 'created_at']);
            $table->index('scheduled_at');
            
            // Only add fulltext index for MySQL/MariaDB
            if (config('database.default') === 'mysql') {
                $table->fullText(['subject', 'body_plain']);
            }
        });

        // Update memo_threads to add foreign key to first_memo_id
        Schema::table('memo_threads', function (Blueprint $table) {
            $table->foreign('first_memo_id')->references('id')->on('memos')->onDelete('set null');
        });

        // 3. Create memo_folders table
        Schema::create('memo_folders', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained('users')->onDelete('cascade');
            $table->string('name');
            $table->string('slug');
            $table->string('icon')->nullable();
            $table->string('color')->nullable();
            $table->integer('sort_order')->default(0);
            $table->boolean('is_system')->default(false);
            $table->boolean('is_visible')->default(true);
            $table->timestamps();
            
            $table->unique(['user_id', 'slug']);
            $table->index(['user_id', 'is_system']);
            $table->index(['user_id', 'sort_order']);
        });

        // 4. Create memo_recipients table
        Schema::create('memo_recipients', function (Blueprint $table) {
            $table->id();
            $table->foreignId('memo_id')->constrained('memos')->onDelete('cascade');
            $table->foreignId('recipient_id')->constrained('users')->onDelete('cascade');
            $table->enum('recipient_type', ['to', 'cc', 'bcc'])->default('to');
            $table->enum('status', ['pending', 'delivered', 'read', 'archived', 'deleted'])->default('pending');
            $table->timestamp('read_at')->nullable();
            $table->timestamp('archived_at')->nullable();
            $table->timestamp('deleted_at')->nullable();
            $table->boolean('is_starred')->default(false);
            $table->foreignId('folder_id')->nullable()->constrained('memo_folders')->onDelete('set null');
            $table->timestamps();
            
            $table->unique(['memo_id', 'recipient_id', 'recipient_type']);
            $table->index(['recipient_id', 'status']);
            $table->index(['memo_id', 'recipient_type']);
            $table->index(['recipient_id', 'is_starred']);
            $table->index(['recipient_id', 'folder_id']);
        });

        // 5. Create memo_attachments table
        Schema::create('memo_attachments', function (Blueprint $table) {
            $table->id();
            $table->foreignId('memo_id')->constrained('memos')->onDelete('cascade');
            $table->foreignId('uploaded_by')->constrained('users')->onDelete('cascade');
            $table->string('filename');
            $table->string('original_filename');
            $table->string('mime_type');
            $table->unsignedBigInteger('file_size');
            $table->string('storage_path');
            $table->string('storage_disk')->default('local');
            $table->integer('download_count')->default(0);
            $table->timestamp('last_downloaded_at')->nullable();
            $table->json('metadata')->nullable();
            $table->timestamps();
            
            $table->index('memo_id');
            $table->index('uploaded_by');
        });

        // 6. Create memo_signatures table
        Schema::create('memo_signatures', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained('users')->onDelete('cascade');
            $table->string('name');
            $table->text('content');
            $table->boolean('is_default')->default(false);
            $table->boolean('is_active')->default(true);
            $table->timestamps();
            
            $table->index(['user_id', 'is_default']);
            $table->index(['user_id', 'is_active']);
        });

        // 7. Create memo_labels table
        Schema::create('memo_labels', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained('users')->onDelete('cascade');
            $table->string('name');
            $table->string('color')->default('#8252e9');
            $table->integer('sort_order')->default(0);
            $table->timestamps();
            
            $table->index(['user_id', 'sort_order']);
        });

        // 8. Create memo_label_pivot table
        Schema::create('memo_label_pivot', function (Blueprint $table) {
            $table->id();
            $table->foreignId('memo_id')->constrained('memos')->onDelete('cascade');
            $table->foreignId('label_id')->constrained('memo_labels')->onDelete('cascade');
            $table->foreignId('user_id')->constrained('users')->onDelete('cascade');
            $table->timestamps();
            
            $table->unique(['memo_id', 'label_id', 'user_id']);
            $table->index('user_id');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('memo_label_pivot');
        Schema::dropIfExists('memo_labels');
        Schema::dropIfExists('memo_signatures');
        Schema::dropIfExists('memo_attachments');
        Schema::dropIfExists('memo_recipients');
        Schema::dropIfExists('memo_folders');
        Schema::dropIfExists('memos');
        Schema::dropIfExists('memo_threads');
    }
};