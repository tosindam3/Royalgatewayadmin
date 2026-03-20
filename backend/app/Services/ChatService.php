<?php

namespace App\Services;

use App\Models\ChatChannel;
use App\Models\ChatMessage;
use App\Models\ChatMessageAttachment;
use App\Models\ChatMessageReaction;
use App\Models\ChatTypingIndicator;
use App\Models\ChatBlockedKeyword;
use App\Events\MessageSent;
use App\Events\MessageUpdated;
use App\Events\MessageDeleted;
use App\Events\ReactionAdded;
use App\Events\ReactionRemoved;
use App\Events\TypingIndicatorUpdated;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Storage;

class ChatService
{
    /**
     * Create a new chat channel
     */
    public function createChannel(array $data, $userId): ChatChannel
    {
        return DB::transaction(function () use ($data, $userId) {
            $channel = ChatChannel::create([
                'name' => $data['name'],
                'description' => $data['description'] ?? null,
                'type' => $data['type'] ?? 'public',
                'created_by' => $userId,
                'organization_id' => $data['organization_id'] ?? null,
                'metadata' => $data['metadata'] ?? null,
            ]);

            // Add creator as owner
            $channel->members()->attach($userId, [
                'role' => 'owner',
                'is_pinned' => false,
                'is_muted' => false,
            ]);

            // Add additional members if provided
            if (!empty($data['member_ids'])) {
                foreach ($data['member_ids'] as $memberId) {
                    if ($memberId != $userId) {
                        $channel->members()->attach($memberId, [
                            'role' => 'member',
                        ]);
                    }
                }
            }

            return $channel->load(['creator', 'members']);
        });
    }

    /**
     * Update channel details
     */
    public function updateChannel(ChatChannel $channel, array $data): ChatChannel
    {
        $channel->update([
            'name' => $data['name'] ?? $channel->name,
            'description' => $data['description'] ?? $channel->description,
            'metadata' => $data['metadata'] ?? $channel->metadata,
        ]);

        return $channel->fresh(['creator', 'members']);
    }

    /**
     * Archive/unarchive a channel
     */
    public function toggleArchive(ChatChannel $channel): ChatChannel
    {
        $channel->update([
            'is_archived' => !$channel->is_archived,
        ]);

        return $channel;
    }

    /**
     * Add members to a channel
     */
    public function addMembers(ChatChannel $channel, array $userIds, string $role = 'member'): void
    {
        foreach ($userIds as $userId) {
            if (!$channel->hasMember($userId)) {
                $channel->members()->attach($userId, [
                    'role' => $role,
                ]);
            }
        }
    }

    /**
     * Remove a member from a channel
     */
    public function removeMember(ChatChannel $channel, $userId): void
    {
        $channel->members()->detach($userId);
    }

    /**
     * Update member role
     */
    public function updateMemberRole(ChatChannel $channel, $userId, string $role): void
    {
        $channel->members()->updateExistingPivot($userId, [
            'role' => $role,
        ]);
    }

    /**
     * Pin/unpin a channel for a user
     */
    public function togglePin(ChatChannel $channel, $userId): void
    {
        $member = $channel->members()->where('user_id', $userId)->first();
        
        if ($member) {
            $channel->members()->updateExistingPivot($userId, [
                'is_pinned' => !$member->pivot->is_pinned,
            ]);
        }
    }

    /**
     * Mute/unmute a channel for a user
     */
    public function toggleMute(ChatChannel $channel, $userId): void
    {
        $member = $channel->members()->where('user_id', $userId)->first();
        
        if ($member) {
            $channel->members()->updateExistingPivot($userId, [
                'is_muted' => !$member->pivot->is_muted,
            ]);
        }
    }

    /**
     * Send a message in a channel
     */
    public function sendMessage(ChatChannel $channel, array $data, $userId): ChatMessage
    {
        // Check for blocked keywords
        $this->checkBlockedKeywords($data['content']);

        $message = DB::transaction(function () use ($channel, $data, $userId) {
            $message = ChatMessage::create([
                'channel_id' => $channel->id,
                'user_id' => $userId,
                'parent_message_id' => $data['parent_message_id'] ?? null,
                'content' => $data['content'],
                'type' => $data['type'] ?? 'text',
                'metadata' => $data['metadata'] ?? null,
            ]);

            // Handle file attachments
            if (!empty($data['attachments'])) {
                foreach ($data['attachments'] as $file) {
                    $this->attachFile($message, $file);
                }
            }

            // Mark as read for the sender
            $this->markMessageAsRead($message, $userId);

            return $message;
        });

        $message = $message->load(['user', 'attachments', 'reactions']);

        try {
            broadcast(new MessageSent($message))->toOthers();
            
            // Notify other members via unified system notification
            $otherMembers = clone $channel->members()->where('users.id', '!=', $userId)->get();
            if ($otherMembers->isNotEmpty()) {
                \Illuminate\Support\Facades\Notification::send($otherMembers, new \App\Notifications\SystemNotification(
                    'CHAT',
                    $channel->name ?? 'Team Chat',
                    ($message->user->name ?? 'Someone') . ': ' . \Illuminate\Support\Str::limit(strip_tags($message->content), 80),
                    '/communication/chat',
                    'MEDIUM',
                    ['channel_id' => $channel->id]
                ));
            }
        } catch (\Exception $e) {
            \Illuminate\Support\Facades\Log::error('Chat broadcast/notification failed: ' . $e->getMessage());
        }

        return $message;
    }

    /**
     * Mark a specific message as read
     */
    public function markMessageAsRead(ChatMessage $message, $userId): void
    {
        $read = \App\Models\ChatMessageRead::firstOrCreate([
            'message_id' => $message->id,
            'user_id' => $userId,
        ]);
        
        // Also update the pivot for channel unread count logic
        $message->channel->markAsReadForUser($userId);

        // Broadcast read event
        broadcast(new \App\Events\MessageRead($message->id, $userId, $message->channel_id))->toOthers();
    }

    /**
     * Mark all messages in a channel as read
     */
    public function markChannelAsRead(ChatChannel $channel, $userId): void
    {
        $lastReadAt = now();
        
        // Update pivot table
        $channel->markAsReadForUser($userId);

        // Get unread messages (optimized to only ones NOT sent by the current user)
        $unreadMessages = $channel->messages()
            ->where('user_id', '!=', $userId)
            ->whereDoesntHave('reads', function ($query) use ($userId) {
                $query->where('user_id', $userId);
            })
            ->get();

        foreach ($unreadMessages as $message) {
            \App\Models\ChatMessageRead::firstOrCreate([
                'message_id' => $message->id,
                'user_id' => $userId,
            ]);

            // Broadcast individual read event (could be throttled if many, but usually fine for simple chat)
            broadcast(new \App\Events\MessageRead($message->id, $userId, $channel->id))->toOthers();
        }
    }

    /**
     * Update a message
     */
    public function updateMessage(ChatMessage $message, string $content): ChatMessage
    {
        // Check for blocked keywords
        $this->checkBlockedKeywords($content);

        $message->update([
            'content' => $content,
        ]);

        $message->markAsEdited();

        $message = $message->fresh(['user', 'attachments', 'reactions']);

        try {
            broadcast(new MessageUpdated($message))->toOthers();
        } catch (\Exception $e) {
            \Illuminate\Support\Facades\Log::error('Update broadcast failed: ' . $e->getMessage());
        }

        return $message;
    }

    /**
     * Delete a message
     */
    public function deleteMessage(ChatMessage $message): void
    {
        $channelId = $message->channel_id;
        $messageId = $message->id;

        $message->softDelete();

        try {
            broadcast(new MessageDeleted($channelId, $messageId))->toOthers();
        } catch (\Exception $e) {
            \Illuminate\Support\Facades\Log::error('Delete broadcast failed: ' . $e->getMessage());
        }
    }

    /**
     * Add a reaction to a message
     */
    public function addReaction(ChatMessage $message, $userId, string $emoji): ChatMessageReaction
    {
        $reaction = ChatMessageReaction::firstOrCreate([
            'message_id' => $message->id,
            'user_id' => $userId,
            'emoji' => $emoji,
        ]);

        try {
            broadcast(new ReactionAdded($reaction->load('message')))->toOthers();
        } catch (\Exception $e) {
            \Illuminate\Support\Facades\Log::error('Reaction broadcast failed: ' . $e->getMessage());
        }

        return $reaction;
    }

    /**
     * Remove a reaction from a message
     */
    public function removeReaction(ChatMessage $message, $userId, string $emoji): void
    {
        $channelId = $message->channel_id;
        $messageId = $message->id;

        ChatMessageReaction::where('message_id', $message->id)
            ->where('user_id', $userId)
            ->where('emoji', $emoji)
            ->delete();

        try {
            broadcast(new ReactionRemoved($channelId, $messageId, $userId, $emoji))->toOthers();
        } catch (\Exception $e) {
            \Illuminate\Support\Facades\Log::error('Remove reaction broadcast failed: ' . $e->getMessage());
        }
    }

    /**
     * Set typing indicator
     */
    public function setTypingIndicator(ChatChannel $channel, $userId): void
    {
        ChatTypingIndicator::updateOrCreate(
            [
                'channel_id' => $channel->id,
                'user_id' => $userId,
            ],
            [
                'expires_at' => now()->addSeconds(5),
            ]
        );

        // Clear cache
        Cache::forget("typing_users_{$channel->id}");

        $user = \App\Models\User::find($userId);

        try {
            broadcast(new TypingIndicatorUpdated($channel->id, [
                'id' => $user->id,
                'name' => $user->name
            ]))->toOthers();
        } catch (\Exception $e) {
            \Illuminate\Support\Facades\Log::error('Typing broadcast failed: ' . $e->getMessage());
        }
    }

    /**
     * Get active typing users in a channel
     */
    public function getTypingUsers(ChatChannel $channel): array
    {
        return Cache::remember("typing_users_{$channel->id}", 5, function () use ($channel) {
            return $channel->typingIndicators()
                ->where('expires_at', '>', now())
                ->with('user:id,name')
                ->get()
                ->pluck('user')
                ->toArray();
        });
    }

    /**
     * Attach a file to a message
     */
    protected function attachFile(ChatMessage $message, $file): ChatMessageAttachment
    {
        // Validate file
        if ($file->getSize() > 1024 * 1024 * 10) { // 10MB
            throw new \Exception("File too large. Max size is 10MB.");
        }

        $allowedMimes = [
            'application/pdf',
            'application/msword',
            'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
            'application/vnd.ms-excel',
            'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
            'image/jpeg',
            'image/png',
            'image/gif',
            'text/plain',
        ];

        if (!in_array($file->getMimeType(), $allowedMimes)) {
            throw new \Exception("Invalid file type. Allowed: PDF, DOCX, XLSX, Images, Text.");
        }

        // Sanitize filename
        $originalName = $file->getClientOriginalName();
        $extension = $file->getClientOriginalExtension();
        $basename = pathinfo($originalName, PATHINFO_FILENAME);
        $sanitizedName = \Illuminate\Support\Str::slug($basename) . '.' . $extension;

        // Store in private disk for better security
        $path = $file->storeAs('chat/attachments', $sanitizedName, 'private');

        return ChatMessageAttachment::create([
            'message_id' => $message->id,
            'file_name' => $originalName,
            'file_path' => $path,
            'file_type' => $extension,
            'file_size' => $file->getSize(),
            'mime_type' => $file->getMimeType(),
        ]);
    }

    /**
     * Check message content against blocked keywords
     */
    protected function checkBlockedKeywords(string $content): void
    {
        $keywords = Cache::remember('chat_blocked_keywords', 3600, function () {
            return ChatBlockedKeyword::active()->blocking()->pluck('keyword')->toArray();
        });

        foreach ($keywords as $keyword) {
            if (stripos($content, $keyword) !== false) {
                throw new \Exception("Message contains blocked keyword: {$keyword}");
            }
        }
    }

    /**
     * Get channel statistics
     */
    public function getChannelStats(ChatChannel $channel): array
    {
        return [
            'total_messages' => $channel->messages()->notDeleted()->count(),
            'total_members' => $channel->members()->count(),
            'messages_today' => $channel->messages()
                ->notDeleted()
                ->whereDate('created_at', today())
                ->count(),
            'active_members_today' => $channel->messages()
                ->whereDate('created_at', today())
                ->distinct('user_id')
                ->count('user_id'),
        ];
    }

    /**
     * Search messages in a channel
     */
    public function searchMessages(ChatChannel $channel, string $query, int $perPage = 20)
    {
        return $channel->messages()
            ->notDeleted()
            ->search($query)
            ->with(['user', 'attachments'])
            ->orderBy('created_at', 'desc')
            ->paginate($perPage);
    }

    /**
     * Get chat analytics
     */
    public function getChatAnalytics(): array
    {
        return [
            'total_channels' => ChatChannel::active()->count(),
            'total_messages' => ChatMessage::notDeleted()->count(),
            'active_users' => ChatMessage::whereDate('created_at', today())
                ->distinct('user_id')
                ->count('user_id'),
            'messages_today' => ChatMessage::whereDate('created_at', today())->count(),
            'top_channels' => ChatChannel::active()
                ->withCount(['messages' => function ($query) {
                    $query->whereDate('created_at', '>=', now()->subDays(7));
                }])
                ->orderBy('messages_count', 'desc')
                ->limit(10)
                ->get(),
        ];
    }
}
