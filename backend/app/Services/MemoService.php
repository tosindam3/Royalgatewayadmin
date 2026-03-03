<?php

namespace App\Services;

use App\Models\Memo;
use App\Models\MemoThread;
use App\Models\MemoRecipient;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Str;

class MemoService
{
    public function createMemo($senderId, array $data)
    {
        return DB::transaction(function () use ($senderId, $data) {
            // Create thread if needed
            $thread = null;
            if (!isset($data['thread_id'])) {
                $thread = MemoThread::create([
                    'organization_id' => 1,
                    'subject' => $data['subject'],
                    'memo_count' => 1,
                    'last_activity_at' => now(),
                ]);
            }
            
            // Create memo
            $memo = Memo::create([
                'sender_id' => $senderId,
                'organization_id' => 1,
                'thread_id' => $thread ? $thread->id : $data['thread_id'] ?? null,
                'subject' => $data['subject'],
                'body' => $data['body'],
                'body_plain' => strip_tags($data['body']),
                'priority' => $data['priority'] ?? 'normal',
                'status' => isset($data['scheduled_at']) ? 'scheduled' : 'sent',
                'type' => $data['type'] ?? 'memo',
                'scheduled_at' => $data['scheduled_at'] ?? null,
                'sent_at' => isset($data['scheduled_at']) ? null : now(),
                'requires_read_receipt' => $data['requires_read_receipt'] ?? false,
                'is_confidential' => $data['is_confidential'] ?? false,
            ]);
            
            // Update thread first_memo_id
            if ($thread) {
                $thread->update(['first_memo_id' => $memo->id]);
            }
            
            // Create recipients
            $this->createRecipients($memo, $data['recipients']);
            
            // Clear cache
            $this->clearUserCache($senderId);
            
            return $memo;
        });
    }

    public function replyToMemo($senderId, Memo $parentMemo, array $data)
    {
        $replyAll = $data['reply_all'] ?? false;
        
        // Build recipients list
        $recipients = ['to' => [$parentMemo->sender_id]];
        
        if ($replyAll) {
            // Add all original recipients except the current user
            $originalRecipients = $parentMemo->recipients()
                ->where('recipient_id', '!=', $senderId)
                ->pluck('recipient_id')
                ->toArray();
            
            $recipients['to'] = array_unique(array_merge($recipients['to'], $originalRecipients));
        }
        
        return $this->createMemo($senderId, [
            'subject' => 'Re: ' . $parentMemo->subject,
            'body' => $data['body'],
            'thread_id' => $parentMemo->thread_id,
            'parent_memo_id' => $parentMemo->id,
            'type' => 'reply',
            'recipients' => $recipients,
        ]);
    }

    public function forwardMemo($senderId, Memo $originalMemo, array $data)
    {
        $body = ($data['body'] ?? '') . "\n\n--- Forwarded Message ---\n" . $originalMemo->body;
        
        $memo = $this->createMemo($senderId, [
            'subject' => 'Fwd: ' . $originalMemo->subject,
            'body' => $body,
            'type' => 'forward',
            'recipients' => $data['recipients'],
        ]);
        
        // Copy attachments
        foreach ($originalMemo->attachments as $attachment) {
            $memo->attachments()->create([
                'uploaded_by' => $senderId,
                'filename' => $attachment->filename,
                'original_filename' => $attachment->original_filename,
                'mime_type' => $attachment->mime_type,
                'file_size' => $attachment->file_size,
                'storage_path' => $attachment->storage_path,
                'storage_disk' => $attachment->storage_disk,
            ]);
        }
        
        return $memo;
    }

    public function bulkSend($senderId, array $data)
    {
        $memos = [];
        
        foreach ($data['recipients'] as $recipientId) {
            $memos[] = $this->createMemo($senderId, [
                'subject' => $data['subject'],
                'body' => $data['body'],
                'priority' => $data['priority'] ?? 'normal',
                'recipients' => ['to' => [$recipientId]],
            ]);
        }
        
        return $memos;
    }

    public function bulkDelete($userId, array $memoIds)
    {
        $count = 0;
        
        foreach ($memoIds as $memoId) {
            $memo = Memo::find($memoId);
            if (!$memo) continue;
            
            if ($memo->sender_id === $userId) {
                $memo->delete();
                $count++;
            } else {
                $recipient = $memo->recipients()->where('recipient_id', $userId)->first();
                if ($recipient) {
                    $recipient->update(['deleted_at' => now()]);
                    $count++;
                }
            }
        }
        
        $this->clearUserCache($userId);
        return $count;
    }

    public function bulkMarkAsRead($userId, array $memoIds)
    {
        $count = MemoRecipient::whereIn('memo_id', $memoIds)
            ->where('recipient_id', $userId)
            ->whereIn('status', ['pending', 'delivered'])
            ->update([
                'status' => 'read',
                'read_at' => now(),
            ]);
        
        $this->clearUserCache($userId);
        return $count;
    }

    public function getMemosForUser($userId)
    {
        return Memo::forUser($userId);
    }

    public function filterByFolder($query, $userId, $folderSlug)
    {
        switch ($folderSlug) {
            case 'inbox':
                return $query->whereHas('recipients', function ($q) use ($userId) {
                    $q->where('recipient_id', $userId)
                      ->whereIn('status', ['pending', 'delivered', 'read'])
                      ->whereNull('deleted_at');
                });
            
            case 'starred':
                return $query->whereHas('recipients', function ($q) use ($userId) {
                    $q->where('recipient_id', $userId)
                      ->where('is_starred', true)
                      ->whereNull('deleted_at');
                });
            
            case 'sent':
                return $query->where('sender_id', $userId)
                    ->where('status', 'sent');
            
            case 'drafts':
                return $query->where('sender_id', $userId)
                    ->where('status', 'draft');
            
            case 'scheduled':
                return $query->where('sender_id', $userId)
                    ->where('status', 'scheduled');
            
            case 'trash':
                return $query->whereHas('recipients', function ($q) use ($userId) {
                    $q->where('recipient_id', $userId)
                      ->whereNotNull('deleted_at');
                });
            
            default:
                return $query;
        }
    }

    public function getUserStats($userId)
    {
        $cacheKey = "memo_stats_{$userId}";
        
        return Cache::remember($cacheKey, config('memo.cache_ttl.unread_count'), function () use ($userId) {
            return [
                'inbox_count' => MemoRecipient::where('recipient_id', $userId)
                    ->whereIn('status', ['pending', 'delivered', 'read'])
                    ->whereNull('deleted_at')
                    ->count(),
                'unread_count' => MemoRecipient::where('recipient_id', $userId)
                    ->whereIn('status', ['pending', 'delivered'])
                    ->whereNull('deleted_at')
                    ->count(),
                'starred_count' => MemoRecipient::where('recipient_id', $userId)
                    ->where('is_starred', true)
                    ->whereNull('deleted_at')
                    ->count(),
                'drafts_count' => Memo::where('sender_id', $userId)
                    ->where('status', 'draft')
                    ->count(),
                'sent_count' => Memo::where('sender_id', $userId)
                    ->where('status', 'sent')
                    ->count(),
            ];
        });
    }

    public function searchMemos($userId, $searchTerm)
    {
        return Memo::forUser($userId)
            ->search($searchTerm)
            ->with(['sender', 'recipients.recipient'])
            ->latest()
            ->limit(50)
            ->get();
    }

    public function canAccessMemo($userId, Memo $memo)
    {
        return $memo->sender_id === $userId || 
               $memo->recipients()->where('recipient_id', $userId)->exists();
    }

    protected function createRecipients(Memo $memo, array $recipients)
    {
        foreach (['to', 'cc', 'bcc'] as $type) {
            if (isset($recipients[$type])) {
                foreach ($recipients[$type] as $recipientId) {
                    MemoRecipient::create([
                        'memo_id' => $memo->id,
                        'recipient_id' => $recipientId,
                        'recipient_type' => $type,
                        'status' => 'delivered',
                    ]);
                    
                    $this->clearUserCache($recipientId);
                }
            }
        }
    }

    protected function clearUserCache($userId)
    {
        Cache::forget("memo_stats_{$userId}");
        Cache::forget("memo_list_{$userId}");
    }
}
