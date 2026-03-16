<?php

namespace App\Http\Controllers;

use App\Http\Requests\SendMessageRequest;
use App\Http\Requests\UpdateMessageRequest;
use App\Http\Requests\AddReactionRequest;
use App\Models\ChatChannel;
use App\Models\ChatMessage;
use App\Services\ChatService;
use App\Services\AuditLogger;
use App\Traits\ApiResponse;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class ChatMessageController extends Controller
{
    use ApiResponse;

    protected ChatService $chatService;

    public function __construct(ChatService $chatService)
    {
        $this->chatService = $chatService;
    }

    /**
     * Get messages in a channel
     */
    public function index(Request $request, ChatChannel $channel): JsonResponse
    {
        try {
            $user = $request->user();

            // Check if user is a member
            if (!$channel->hasMember($user->id) && !$channel->isPublic()) {
                return $this->error('Unauthorized access to this channel', 403);
            }

            $perPage = $request->get('per_page', 50);
            $search = $request->get('search');

            if ($search) {
                $messages = $this->chatService->searchMessages($channel, $search, $perPage);
            } else {
                $messages = $channel->messages()
                    ->notDeleted()
                    ->with([
                        'user:id,name',
                        'attachments:id,message_id,file_name,file_path,file_size,mime_type',
                        'reactions',
                        'parentMessage:id,content,user_id'
                    ])
                    ->select('id', 'channel_id', 'user_id', 'parent_message_id', 'content', 'type', 'is_edited', 'created_at', 'updated_at')
                    ->orderBy('created_at', 'desc')
                    ->paginate($perPage);
            }

            return $this->success($messages, 'Messages retrieved successfully');
        } catch (\Exception $e) {
            return $this->error('Failed to retrieve messages: ' . $e->getMessage(), 500);
        }
    }

    /**
     * Send a message in a channel
     */
    public function store(SendMessageRequest $request, ChatChannel $channel): JsonResponse
    {
        try {
            $user = $request->user();

            // Rate limiting: 10 messages per minute
            $key = 'send-message:' . $user->id;
            if (\Illuminate\Support\Facades\RateLimiter::tooManyAttempts($key, 10)) {
                return $this->error('Too many messages. Please slow down.', 429);
            }
            \Illuminate\Support\Facades\RateLimiter::hit($key, 60);

            // Check if user is a member
            if (!$channel->hasMember($user->id)) {
                return $this->error('You must be a member to send messages', 403);
            }

            $validated = $request->validated();
            $message = $this->chatService->sendMessage($channel, $validated, $user->id);

            return $this->success($message, 'Message sent successfully', 201);
        } catch (\Exception $e) {
            return $this->error('Failed to send message: ' . $e->getMessage(), 500);
        }
    }

    /**
     * Get a specific message
     */
    public function show(Request $request, ChatChannel $channel, ChatMessage $message): JsonResponse
    {
        try {
            $user = $request->user();

            // Check if user is a member
            if (!$channel->hasMember($user->id) && !$channel->isPublic()) {
                return $this->error('Unauthorized access', 403);
            }

            // Verify message belongs to channel
            if ($message->channel_id != $channel->id) {
                return $this->error('Message not found in this channel', 404);
            }

            $message->load(['user:id,name', 'attachments', 'reactions.user:id,name', 'replies']);

            return $this->success($message, 'Message retrieved successfully');
        } catch (\Exception $e) {
            return $this->error('Failed to retrieve message: ' . $e->getMessage(), 500);
        }
    }

    /**
     * Update a message
     */
    public function update(UpdateMessageRequest $request, ChatChannel $channel, ChatMessage $message): JsonResponse
    {
        try {
            $user = $request->user();

            // Verify message belongs to channel
            if ($message->channel_id != $channel->id) {
                return $this->error('Message not found in this channel', 404);
            }

            // Only message owner can update
            if (!$message->isOwnedBy($user->id)) {
                return $this->error('Unauthorized to update this message', 403);
            }

            $validated = $request->validated();
            $oldContent = $message->content;
            
            $message = $this->chatService->updateMessage($message, $validated['content']);

            AuditLogger::log(
                'chat_message_updated',
                'ChatMessage',
                $message->id,
                ['content' => $oldContent],
                ['content' => $message->content]
            );

            return $this->success($message, 'Message updated successfully');
        } catch (\Exception $e) {
            return $this->error('Failed to update message: ' . $e->getMessage(), 500);
        }
    }

    /**
     * Delete a message
     */
    public function destroy(Request $request, ChatChannel $channel, ChatMessage $message): JsonResponse
    {
        try {
            $user = $request->user();

            // Verify message belongs to channel
            if ($message->channel_id != $channel->id) {
                return $this->error('Message not found in this channel', 404);
            }

            // Message owner or channel admin/owner can delete
            $member = $channel->members()->where('user_id', $user->id)->first();
            $canDelete = $message->isOwnedBy($user->id) || 
                        ($member && in_array($member->pivot->role, ['owner', 'admin']));

            if (!$canDelete) {
                return $this->error('Unauthorized to delete this message', 403);
            }

            $messageData = $message->toArray();
            $this->chatService->deleteMessage($message);

            AuditLogger::log(
                'chat_message_deleted',
                'ChatMessage',
                $message->id,
                $messageData,
                null
            );

            return $this->success(null, 'Message deleted successfully');
        } catch (\Exception $e) {
            return $this->error('Failed to delete message: ' . $e->getMessage(), 500);
        }
    }

    /**
     * Add a reaction to a message
     */
    public function addReaction(AddReactionRequest $request, ChatChannel $channel, ChatMessage $message): JsonResponse
    {
        try {
            $user = $request->user();

            // Check if user is a member
            if (!$channel->hasMember($user->id)) {
                return $this->error('You must be a member to react', 403);
            }

            // Verify message belongs to channel
            if ($message->channel_id != $channel->id) {
                return $this->error('Message not found in this channel', 404);
            }

            $validated = $request->validated();
            $reaction = $this->chatService->addReaction($message, $user->id, $validated['emoji']);

            return $this->success($reaction, 'Reaction added successfully', 201);
        } catch (\Exception $e) {
            return $this->error('Failed to add reaction: ' . $e->getMessage(), 500);
        }
    }

    /**
     * Remove a reaction from a message
     */
    public function removeReaction(Request $request, ChatChannel $channel, ChatMessage $message, string $emoji): JsonResponse
    {
        try {
            $user = $request->user();

            // Verify message belongs to channel
            if ($message->channel_id != $channel->id) {
                return $this->error('Message not found in this channel', 404);
            }

            $this->chatService->removeReaction($message, $user->id, $emoji);

            return $this->success(null, 'Reaction removed successfully');
        } catch (\Exception $e) {
            return $this->error('Failed to remove reaction: ' . $e->getMessage(), 500);
        }
    }

    /**
     * Set typing indicator
     */
    public function setTyping(Request $request, ChatChannel $channel): JsonResponse
    {
        try {
            $user = $request->user();

            if (!$channel->hasMember($user->id)) {
                return $this->error('You must be a member', 403);
            }

            $this->chatService->setTypingIndicator($channel, $user->id);

            return $this->success(null, 'Typing indicator set');
        } catch (\Exception $e) {
            return $this->error('Failed to set typing indicator: ' . $e->getMessage(), 500);
        }
    }

    /**
     * Mark messages as read in a channel
     */
    public function markAsRead(Request $request, ChatChannel $channel): JsonResponse
    {
        try {
            $user = $request->user();

            if (!$channel->hasMember($user->id)) {
                return $this->error('Unauthorized', 403);
            }

            $this->chatService->markChannelAsRead($channel, $user->id);

            return $this->success(null, 'Messages marked as read');
        } catch (\Exception $e) {
            return $this->error('Failed to mark as read: ' . $e->getMessage(), 500);
        }
    }

    /**
     * Get typing users in a channel
     */
    public function getTypingUsers(Request $request, ChatChannel $channel): JsonResponse
    {
        try {
            $user = $request->user();

            if (!$channel->hasMember($user->id) && !$channel->isPublic()) {
                return $this->error('Unauthorized access', 403);
            }

            $typingUsers = $this->chatService->getTypingUsers($channel);

            return $this->success($typingUsers, 'Typing users retrieved successfully');
        } catch (\Exception $e) {
            return $this->error('Failed to retrieve typing users: ' . $e->getMessage(), 500);
        }
    }

    /**
     * Search messages across all joined channels
     */
    public function globalSearch(Request $request): JsonResponse
    {
        try {
            $user = $request->user();
            $query = $request->get('query');
            $perPage = $request->get('per_page', 20);

            if (!$query) {
                return $this->error('Search query is required', 400);
            }

            // Get channels user is a member of
            $channelIds = $user->chatChannels()->pluck('chat_channels.id');

            $messages = ChatMessage::whereIn('channel_id', $channelIds)
                ->notDeleted()
                ->where('content', 'like', "%{$query}%")
                ->with([
                    'user:id,name',
                    'channel:id,name,type',
                    'attachments:id,message_id,file_name,file_path,file_size,mime_type'
                ])
                ->orderBy('created_at', 'desc')
                ->paginate($perPage);

            return $this->success($messages, 'Global search results retrieved');
        } catch (\Exception $e) {
            return $this->error('Global search failed: ' . $e->getMessage(), 500);
        }
    }
}
