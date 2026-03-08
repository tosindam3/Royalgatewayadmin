<?php

namespace App\Http\Controllers;

use App\Http\Requests\CreateChannelRequest;
use App\Http\Requests\UpdateChannelRequest;
use App\Http\Requests\ManageMembersRequest;
use App\Models\ChatChannel;
use App\Services\ChatService;
use App\Services\AuditLogger;
use App\Traits\ApiResponse;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class ChatChannelController extends Controller
{
    use ApiResponse;

    protected ChatService $chatService;

    public function __construct(ChatService $chatService)
    {
        $this->chatService = $chatService;
    }

    /**
     * Get all channels for the authenticated user
     */
    public function index(Request $request): JsonResponse
    {
        try {
            $user = $request->user();
            $type = $request->get('type'); // public, private, direct
            $includeArchived = $request->boolean('include_archived', false);

            $query = ChatChannel::forUser($user->id)
                ->with(['creator:id,name', 'members:id,name'])
                ->withCount('messages');

            if ($type) {
                $query->where('type', $type);
            }

            if (!$includeArchived) {
                $query->active();
            }

            $channels = $query->orderBy('created_at', 'desc')->get();

            // Add unread count for each channel
            $channels->each(function ($channel) use ($user) {
                $channel->unread_count = $channel->getUnreadCountForUser($user->id);
                $member = $channel->members->firstWhere('id', $user->id);
                $channel->is_pinned = $member ? $member->pivot->is_pinned : false;
                $channel->is_muted = $member ? $member->pivot->is_muted : false;
            });

            return $this->success($channels, 'Channels retrieved successfully');
        } catch (\Exception $e) {
            return $this->error('Failed to retrieve channels: ' . $e->getMessage(), 500);
        }
    }

    /**
     * Get a specific channel
     */
    public function show(Request $request, ChatChannel $channel): JsonResponse
    {
        try {
            $user = $request->user();

            // Check if user is a member
            if (!$channel->hasMember($user->id) && !$channel->isPublic()) {
                return $this->error('Unauthorized access to this channel', 403);
            }

            $channel->load(['creator:id,name', 'members:id,name,email']);
            $channel->unread_count = $channel->getUnreadCountForUser($user->id);
            
            $member = $channel->members->firstWhere('id', $user->id);
            $channel->is_pinned = $member ? $member->pivot->is_pinned : false;
            $channel->is_muted = $member ? $member->pivot->is_muted : false;
            $channel->member_role = $member ? $member->pivot->role : null;

            return $this->success($channel, 'Channel retrieved successfully');
        } catch (\Exception $e) {
            return $this->error('Failed to retrieve channel: ' . $e->getMessage(), 500);
        }
    }

    /**
     * Create a new channel
     */
    public function store(CreateChannelRequest $request): JsonResponse
    {
        try {
            $validated = $request->validated();
            $user = $request->user();

            $channel = $this->chatService->createChannel($validated, $user->id);

            AuditLogger::log(
                'chat_channel_created',
                'ChatChannel',
                $channel->id,
                null,
                $channel->toArray()
            );

            return $this->success($channel, 'Channel created successfully', 201);
        } catch (\Exception $e) {
            return $this->error('Failed to create channel: ' . $e->getMessage(), 500);
        }
    }

    /**
     * Update a channel
     */
    public function update(UpdateChannelRequest $request, ChatChannel $channel): JsonResponse
    {
        try {
            $user = $request->user();
            $member = $channel->members()->where('user_id', $user->id)->first();

            // Only owners and admins can update
            if (!$member || !in_array($member->pivot->role, ['owner', 'admin'])) {
                return $this->error('Unauthorized to update this channel', 403);
            }

            $oldData = $channel->toArray();
            $validated = $request->validated();
            
            $channel = $this->chatService->updateChannel($channel, $validated);

            AuditLogger::log(
                'chat_channel_updated',
                'ChatChannel',
                $channel->id,
                $oldData,
                $channel->toArray()
            );

            return $this->success($channel, 'Channel updated successfully');
        } catch (\Exception $e) {
            return $this->error('Failed to update channel: ' . $e->getMessage(), 500);
        }
    }

    /**
     * Delete a channel
     */
    public function destroy(Request $request, ChatChannel $channel): JsonResponse
    {
        try {
            $user = $request->user();
            $member = $channel->members()->where('user_id', $user->id)->first();

            // Only owners can delete
            if (!$member || $member->pivot->role !== 'owner') {
                return $this->error('Unauthorized to delete this channel', 403);
            }

            $channelData = $channel->toArray();
            $channel->delete();

            AuditLogger::log(
                'chat_channel_deleted',
                'ChatChannel',
                $channel->id,
                $channelData,
                null
            );

            return $this->success(null, 'Channel deleted successfully');
        } catch (\Exception $e) {
            return $this->error('Failed to delete channel: ' . $e->getMessage(), 500);
        }
    }

    /**
     * Archive/unarchive a channel
     */
    public function toggleArchive(Request $request, ChatChannel $channel): JsonResponse
    {
        try {
            $user = $request->user();
            $member = $channel->members()->where('user_id', $user->id)->first();

            if (!$member || !in_array($member->pivot->role, ['owner', 'admin'])) {
                return $this->error('Unauthorized to archive this channel', 403);
            }

            $channel = $this->chatService->toggleArchive($channel);

            return $this->success($channel, 'Channel archive status updated');
        } catch (\Exception $e) {
            return $this->error('Failed to update archive status: ' . $e->getMessage(), 500);
        }
    }

    /**
     * Add members to a channel
     */
    public function addMembers(ManageMembersRequest $request, ChatChannel $channel): JsonResponse
    {
        try {
            $user = $request->user();
            $member = $channel->members()->where('user_id', $user->id)->first();

            if (!$member || !in_array($member->pivot->role, ['owner', 'admin'])) {
                return $this->error('Unauthorized to add members', 403);
            }

            $validated = $request->validated();
            $this->chatService->addMembers(
                $channel,
                $validated['user_ids'],
                $validated['role'] ?? 'member'
            );

            return $this->success(null, 'Members added successfully');
        } catch (\Exception $e) {
            return $this->error('Failed to add members: ' . $e->getMessage(), 500);
        }
    }

    /**
     * Remove a member from a channel
     */
    public function removeMember(Request $request, ChatChannel $channel, $userId): JsonResponse
    {
        try {
            $user = $request->user();
            $member = $channel->members()->where('user_id', $user->id)->first();

            // Users can remove themselves, or admins/owners can remove others
            if ($user->id != $userId) {
                if (!$member || !in_array($member->pivot->role, ['owner', 'admin'])) {
                    return $this->error('Unauthorized to remove members', 403);
                }
            }

            $this->chatService->removeMember($channel, $userId);

            return $this->success(null, 'Member removed successfully');
        } catch (\Exception $e) {
            return $this->error('Failed to remove member: ' . $e->getMessage(), 500);
        }
    }

    /**
     * Update member role
     */
    public function updateMemberRole(Request $request, ChatChannel $channel, $userId): JsonResponse
    {
        try {
            $user = $request->user();
            $member = $channel->members()->where('user_id', $user->id)->first();

            if (!$member || $member->pivot->role !== 'owner') {
                return $this->error('Unauthorized to update member roles', 403);
            }

            $validated = $request->validate([
                'role' => 'required|in:owner,admin,member',
            ]);

            $this->chatService->updateMemberRole($channel, $userId, $validated['role']);

            return $this->success(null, 'Member role updated successfully');
        } catch (\Exception $e) {
            return $this->error('Failed to update member role: ' . $e->getMessage(), 500);
        }
    }

    /**
     * Pin/unpin a channel
     */
    public function togglePin(Request $request, ChatChannel $channel): JsonResponse
    {
        try {
            $user = $request->user();

            if (!$channel->hasMember($user->id)) {
                return $this->error('You are not a member of this channel', 403);
            }

            $this->chatService->togglePin($channel, $user->id);

            return $this->success(null, 'Channel pin status updated');
        } catch (\Exception $e) {
            return $this->error('Failed to update pin status: ' . $e->getMessage(), 500);
        }
    }

    /**
     * Mute/unmute a channel
     */
    public function toggleMute(Request $request, ChatChannel $channel): JsonResponse
    {
        try {
            $user = $request->user();

            if (!$channel->hasMember($user->id)) {
                return $this->error('You are not a member of this channel', 403);
            }

            $this->chatService->toggleMute($channel, $user->id);

            return $this->success(null, 'Channel mute status updated');
        } catch (\Exception $e) {
            return $this->error('Failed to update mute status: ' . $e->getMessage(), 500);
        }
    }

    /**
     * Mark channel as read
     */
    public function markAsRead(Request $request, ChatChannel $channel): JsonResponse
    {
        try {
            $user = $request->user();

            if (!$channel->hasMember($user->id)) {
                return $this->error('You are not a member of this channel', 403);
            }

            $channel->markAsReadForUser($user->id);

            return $this->success(null, 'Channel marked as read');
        } catch (\Exception $e) {
            return $this->error('Failed to mark as read: ' . $e->getMessage(), 500);
        }
    }

    /**
     * Get channel statistics
     */
    public function stats(Request $request, ChatChannel $channel): JsonResponse
    {
        try {
            $user = $request->user();
            $member = $channel->members()->where('user_id', $user->id)->first();

            if (!$member || !in_array($member->pivot->role, ['owner', 'admin'])) {
                return $this->error('Unauthorized to view channel statistics', 403);
            }

            $stats = $this->chatService->getChannelStats($channel);

            return $this->success($stats, 'Channel statistics retrieved successfully');
        } catch (\Exception $e) {
            return $this->error('Failed to retrieve statistics: ' . $e->getMessage(), 500);
        }
    }
}
