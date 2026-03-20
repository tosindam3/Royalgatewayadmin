<?php

namespace App\Http\Controllers;

use App\Traits\ApiResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class NotificationController extends Controller
{
    use ApiResponse;

    /**
     * GET /v1/notifications
     * Returns real-time notifications from the unified notifications table.
     */
    public function index(Request $request)
    {
        $user = Auth::user();

        // Fetch unread notifications
        // We use cursor pagination or simple limit depending on frontend need. Defaulting to 50 for now.
        $unreadNotifications = $user->unreadNotifications()
            ->latest()
            ->limit(50)
            ->get();

        $items = $unreadNotifications->map(function ($notification) {
            $data = $notification->data;
            return [
                'id'         => $notification->id,
                'type'       => $data['type'] ?? 'SYSTEM',
                'title'      => $data['title'] ?? 'Notification',
                'message'    => $data['message'] ?? '',
                'timestamp'  => $notification->created_at->diffForHumans(),
                'isRead'     => !is_null($notification->read_at),
                'priority'   => $data['priority'] ?? 'MEDIUM',
                'actionUrl'  => $data['actionUrl'] ?? null,
                'meta'       => $data['meta'] ?? [],
            ];
        });

        return $this->success([
            'notifications' => $items,
            'unread_count'  => $user->unreadNotifications()->count(),
        ]);
    }

    /**
     * POST /v1/notifications/mark-read
     * Mark a specific notification as read.
     */
    public function markRead(Request $request)
    {
        $validated = $request->validate([
            'id' => 'required|string',
        ]);

        $user = Auth::user();
        $notification = $user->notifications()->find($validated['id']);

        if ($notification) {
            $notification->markAsRead();
        }

        return $this->success(null, 'Marked as read');
    }

    /**
     * POST /v1/notifications/read-all
     * Mark all user notifications as read.
     */
    public function markAllRead(Request $request)
    {
        Auth::user()->unreadNotifications->markAsRead();
        return $this->success(null, 'All notifications marked as read');
    }
}
