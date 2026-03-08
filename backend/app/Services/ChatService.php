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

        return DB::transaction(function () use ($channel, $data, $userId) {
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

            $message = $message->load(['user', 'attachments', 'reactions']);

            broadcast(new MessageSent($message))->toOthers();

            return $message;
        });
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

        broadcast(new MessageUpdated($message))->toOthers();

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

        broadcast(new MessageDeleted($channelId, $messageId))->toOthers();
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

        broadcast(new ReactionAdded($reaction->load('message')))->toOthers();

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

        broadcast(new ReactionRemoved($channelId, $messageId, $userId, $emoji))->toOthers();
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

        $user = \App\Models\User::find($userId);
        broadcast(new TypingIndicatorUpdated($channel->id, [
            'id' => $user->id,
            'name' => $user->name
        ]))->toOthers();
    }

    /**
     * Get active typing users in a channel
     */
    public function getTypingUsers(ChatChannel $channel): array
    {
        return $channel->typingIndicators()
            ->active()
            ->with('user:id,name')
            ->get()
            ->pluck('user')
            ->toArray();
    }

    /**
     * Attach a file to a message
     */
    protected function attachFile(ChatMessage $message, $file): ChatMessageAttachment
    {
        $path = $file->store('chat/attachments', 'public');

        return ChatMessageAttachment::create([
            'message_id' => $message->id,
            'file_name' => $file->getClientOriginalName(),
            'file_path' => $path,
            'file_type' => $file->getClientOriginalExtension(),
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
