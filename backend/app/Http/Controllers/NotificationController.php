<?php

namespace App\Http\Controllers;

use App\Models\ApprovalRequest;
use App\Models\MemoRecipient;
use App\Models\ChatChannel;
use App\Traits\ApiResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;

class NotificationController extends Controller
{
    use ApiResponse;

    /**
     * GET /v1/notifications
     * Returns aggregated real-time notifications for the authenticated user.
     * Sources: unread memos, pending approvals, unread chat messages.
     */
    public function index(Request $request)
    {
        $userId = Auth::id();
        $items = [];

        // --- Unread Memos ---
        try {
            $unreadMemos = MemoRecipient::with(['memo.sender'])
                ->where('recipient_id', $userId)
                ->whereNull('read_at')
                ->whereNull('deleted_at')
                ->orderByDesc('created_at')
                ->limit(10)
                ->get();

            foreach ($unreadMemos as $recipient) {
                $memo = $recipient->memo;
                if (!$memo) continue;
                $items[] = [
                    'id'         => 'memo_' . $memo->id,
                    'type'       => 'MEMO',
                    'title'      => 'New Memo',
                    'message'    => $memo->subject,
                    'timestamp'  => $memo->created_at->diffForHumans(),
                    'isRead'     => false,
                    'priority'   => strtoupper($memo->priority ?? 'MEDIUM'),
                    'actionUrl'  => '/communication/memo',
                    'meta'       => [
                        'sender' => optional($memo->sender)->name,
                    ],
                ];
            }
        } catch (\Exception $e) {
            \Log::warning('NotificationController: failed to load memo notifications', ['error' => $e->getMessage()]);
        }

        // --- Pending Approvals (where current user is the approver) ---
        try {
            $pendingApprovals = ApprovalRequest::with(['requester'])
                ->where('current_approver_id', $userId)
                ->where('status', 'pending')
                ->orderByDesc('submitted_at')
                ->limit(10)
                ->get();

            foreach ($pendingApprovals as $approval) {
                $items[] = [
                    'id'        => 'approval_' . $approval->id,
                    'type'      => 'PENDING_REVIEW',
                    'title'     => 'Pending Approval',
                    'message'   => 'Approval request #' . $approval->request_number . ' from ' . optional($approval->requester)->name . ' awaits your action.',
                    'timestamp' => $approval->submitted_at ? \Carbon\Carbon::parse($approval->submitted_at)->diffForHumans() : 'Recently',
                    'isRead'    => false,
                    'priority'  => 'HIGH',
                    'actionUrl' => '/approvals',
                    'meta'      => [
                        'requester' => optional($approval->requester)->name,
                        'module'    => $approval->entity_type ?? null,
                    ],
                ];
            }
        } catch (\Exception $e) {
            \Log::warning('NotificationController: failed to load approval notifications', ['error' => $e->getMessage()]);
        }

        // --- Unread Chat Messages ---
        try {
            $channels = ChatChannel::whereHas('members', function ($q) use ($userId) {
                    $q->where('user_id', $userId);
                })
                ->with(['members' => function ($q) use ($userId) {
                    $q->where('user_id', $userId);
                }])
                ->withCount(['messages as unread_count' => function ($q) use ($userId) {
                    $q->where('user_id', '!=', $userId);
                }])
                ->get();

            foreach ($channels as $channel) {
                $member = $channel->members->first();
                if (!$member) continue;

                $lastReadAt = $member->pivot->last_read_at ?? $member->pivot->created_at ?? null;

                $unreadCount = $channel->messages()
                    ->where('user_id', '!=', $userId)
                    ->when($lastReadAt, fn($q) => $q->where('created_at', '>', $lastReadAt))
                    ->count();

                if ($unreadCount === 0) continue;

                $latestMsg = $channel->messages()
                    ->with('user:id,name')
                    ->where('user_id', '!=', $userId)
                    ->when($lastReadAt, fn($q) => $q->where('created_at', '>', $lastReadAt))
                    ->latest()
                    ->first();

                if (!$latestMsg) continue;

                $items[] = [
                    'id'        => 'chat_' . $channel->id,
                    'type'      => 'CHAT',
                    'title'     => $channel->name ?? 'Team Chat',
                    'message'   => (optional($latestMsg->user)->name ?? 'Someone') . ': ' . \Str::limit(strip_tags($latestMsg->content ?? ''), 80),
                    'timestamp' => $latestMsg->created_at->diffForHumans(),
                    'isRead'    => false,
                    'priority'  => 'MEDIUM',
                    'actionUrl' => '/communication/chat',
                    'meta'      => [
                        'channel_id'   => $channel->id,
                        'unread_count' => $unreadCount,
                        'sender'       => optional($latestMsg->user)->name,
                    ],
                ];
            }
        } catch (\Exception $e) {
            \Log::warning('NotificationController: failed to load chat notifications', ['error' => $e->getMessage()]);
        }

        // Sort by most recent first (items already ordered per source, just merge)
        return $this->success([
            'notifications' => $items,
            'unread_count'  => count($items),
        ]);
    }

    /**
     * POST /v1/notifications/mark-read
     * Mark specific notification(s) as read based on their source type.
     */
    public function markRead(Request $request)
    {
        $validated = $request->validate([
            'id' => 'required|string',
        ]);

        $userId = Auth::id();
        $id = $validated['id'];

        try {
            if (str_starts_with($id, 'memo_')) {
                $memoId = (int) substr($id, 5);
                MemoRecipient::where('recipient_id', $userId)
                    ->where('memo_id', $memoId)
                    ->whereNull('read_at')
                    ->update(['read_at' => now()]);
            }
            // Approvals and chat don't have a simple "mark read" — they clear when actioned
        } catch (\Exception $e) {
            \Log::warning('NotificationController: failed to mark read', ['id' => $id, 'error' => $e->getMessage()]);
        }

        return $this->success(null, 'Marked as read');
    }
}
