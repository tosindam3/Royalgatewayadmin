<?php

namespace App\Http\Controllers;

use App\Models\ChatBlockedKeyword;
use App\Models\ChatChannel;
use App\Models\ChatMessage;
use App\Services\ChatService;
use App\Services\AuditLogger;
use App\Traits\ApiResponse;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;

class ChatAdminController extends Controller
{
    use ApiResponse;

    protected ChatService $chatService;

    public function __construct(ChatService $chatService)
    {
        $this->chatService = $chatService;
    }

    /**
     * Get chat analytics dashboard
     */
    public function analytics(Request $request): JsonResponse
    {
        try {
            // Check admin permission
            if (!$request->user()->hasPermission('chat.admin')) {
                return $this->error('Unauthorized access', 403);
            }

            $analytics = $this->chatService->getChatAnalytics();

            return $this->success($analytics, 'Analytics retrieved successfully');
        } catch (\Exception $e) {
            return $this->error('Failed to retrieve analytics: ' . $e->getMessage(), 500);
        }
    }

    /**
     * Get all blocked keywords
     */
    public function getBlockedKeywords(Request $request): JsonResponse
    {
        try {
            if (!$request->user()->hasPermission('chat.admin')) {
                return $this->error('Unauthorized access', 403);
            }

            $keywords = ChatBlockedKeyword::with('creator:id,name')
                ->orderBy('created_at', 'desc')
                ->get();

            return $this->success($keywords, 'Blocked keywords retrieved successfully');
        } catch (\Exception $e) {
            return $this->error('Failed to retrieve blocked keywords: ' . $e->getMessage(), 500);
        }
    }

    /**
     * Add a blocked keyword
     */
    public function addBlockedKeyword(Request $request): JsonResponse
    {
        try {
            if (!$request->user()->hasPermission('chat.admin')) {
                return $this->error('Unauthorized access', 403);
            }

            $validated = $request->validate([
                'keyword' => 'required|string|max:255|unique:chat_blocked_keywords,keyword',
                'action' => 'required|in:block,flag,warn',
            ]);

            $keyword = ChatBlockedKeyword::create([
                'keyword' => $validated['keyword'],
                'action' => $validated['action'],
                'created_by' => $request->user()->id,
            ]);

            // Clear cache
            Cache::forget('chat_blocked_keywords');

            AuditLogger::log(
                'chat_keyword_blocked',
                'ChatBlockedKeyword',
                $keyword->id,
                null,
                $keyword->toArray()
            );

            return $this->success($keyword, 'Keyword blocked successfully', 201);
        } catch (\Exception $e) {
            return $this->error('Failed to block keyword: ' . $e->getMessage(), 500);
        }
    }

    /**
     * Update a blocked keyword
     */
    public function updateBlockedKeyword(Request $request, ChatBlockedKeyword $keyword): JsonResponse
    {
        try {
            if (!$request->user()->hasPermission('chat.admin')) {
                return $this->error('Unauthorized access', 403);
            }

            $validated = $request->validate([
                'action' => 'sometimes|in:block,flag,warn',
                'is_active' => 'sometimes|boolean',
            ]);

            $oldData = $keyword->toArray();
            $keyword->update($validated);

            // Clear cache
            Cache::forget('chat_blocked_keywords');

            AuditLogger::log(
                'chat_keyword_updated',
                'ChatBlockedKeyword',
                $keyword->id,
                $oldData,
                $keyword->toArray()
            );

            return $this->success($keyword, 'Keyword updated successfully');
        } catch (\Exception $e) {
            return $this->error('Failed to update keyword: ' . $e->getMessage(), 500);
        }
    }

    /**
     * Delete a blocked keyword
     */
    public function deleteBlockedKeyword(Request $request, ChatBlockedKeyword $keyword): JsonResponse
    {
        try {
            if (!$request->user()->hasPermission('chat.admin')) {
                return $this->error('Unauthorized access', 403);
            }

            $keywordData = $keyword->toArray();
            $keyword->delete();

            // Clear cache
            Cache::forget('chat_blocked_keywords');

            AuditLogger::log(
                'chat_keyword_deleted',
                'ChatBlockedKeyword',
                $keyword->id,
                $keywordData,
                null
            );

            return $this->success(null, 'Keyword deleted successfully');
        } catch (\Exception $e) {
            return $this->error('Failed to delete keyword: ' . $e->getMessage(), 500);
        }
    }

    /**
     * Get message activity report
     */
    public function messageActivity(Request $request): JsonResponse
    {
        try {
            if (!$request->user()->hasPermission('chat.admin')) {
                return $this->error('Unauthorized access', 403);
            }

            $days = $request->get('days', 7);
            $startDate = now()->subDays($days);

            $activity = ChatMessage::selectRaw('DATE(created_at) as date, COUNT(*) as count')
                ->where('created_at', '>=', $startDate)
                ->where('is_deleted', false)
                ->groupBy('date')
                ->orderBy('date', 'asc')
                ->get();

            return $this->success($activity, 'Message activity retrieved successfully');
        } catch (\Exception $e) {
            return $this->error('Failed to retrieve message activity: ' . $e->getMessage(), 500);
        }
    }

    /**
     * Get top active channels
     */
    public function topChannels(Request $request): JsonResponse
    {
        try {
            if (!$request->user()->hasPermission('chat.admin')) {
                return $this->error('Unauthorized access', 403);
            }

            $days = $request->get('days', 7);
            $limit = $request->get('limit', 10);

            $channels = ChatChannel::withCount(['messages' => function ($query) use ($days) {
                    $query->where('created_at', '>=', now()->subDays($days))
                          ->where('is_deleted', false);
                }])
                ->with('creator:id,name')
                ->orderBy('messages_count', 'desc')
                ->limit($limit)
                ->get();

            return $this->success($channels, 'Top channels retrieved successfully');
        } catch (\Exception $e) {
            return $this->error('Failed to retrieve top channels: ' . $e->getMessage(), 500);
        }
    }

    /**
     * Get top active users
     */
    public function topUsers(Request $request): JsonResponse
    {
        try {
            if (!$request->user()->hasPermission('chat.admin')) {
                return $this->error('Unauthorized access', 403);
            }

            $days = $request->get('days', 7);
            $limit = $request->get('limit', 10);

            $users = \App\Models\User::withCount(['chatMessages' => function ($query) use ($days) {
                    $query->where('created_at', '>=', now()->subDays($days))
                          ->where('is_deleted', false);
                }])
                ->orderBy('chat_messages_count', 'desc')
                ->limit($limit)
                ->get(['id', 'name', 'email']);

            return $this->success($users, 'Top users retrieved successfully');
        } catch (\Exception $e) {
            return $this->error('Failed to retrieve top users: ' . $e->getMessage(), 500);
        }
    }

    /**
     * Get compliance settings
     */
    public function getComplianceSettings(Request $request): JsonResponse
    {
        try {
            if (!$request->user()->hasPermission('chat.compliance')) {
                return $this->error('Unauthorized access', 403);
            }

            $settings = [
                'data_retention_days' => config('chat.data_retention_days', 180),
                'max_file_size_mb' => config('chat.max_file_size_mb', 10),
                'max_attachments_per_message' => config('chat.max_attachments_per_message', 10),
                'profanity_filter_enabled' => config('chat.profanity_filter_enabled', true),
            ];

            return $this->success($settings, 'Compliance settings retrieved successfully');
        } catch (\Exception $e) {
            return $this->error('Failed to retrieve compliance settings: ' . $e->getMessage(), 500);
        }
    }
}
