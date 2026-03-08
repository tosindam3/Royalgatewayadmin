<?php

namespace App\Http\Controllers;

use App\Models\Memo;
use App\Models\MemoRecipient;
use App\Services\MemoService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class MemoController extends Controller
{
    protected $memoService;

    public function __construct(MemoService $memoService)
    {
        $this->memoService = $memoService;
    }

    public function index(Request $request)
    {
        $userId = Auth::id();
        $perPage = min($request->get('per_page', 20), config('memo.pagination.max_per_page'));
        
        $query = $this->memoService->getMemosForUser($userId);
        
        // Apply filters
        if ($request->has('folder')) {
            $query = $this->memoService->filterByFolder($query, $userId, $request->folder);
        }
        
        if ($request->has('status')) {
            $query->where('status', $request->status);
        }
        
        if ($request->has('priority')) {
            $query->where('priority', $request->priority);
        }
        
        if ($request->has('search')) {
            $query->search($request->search);
        }
        
        $memos = $query->with(['sender', 'recipients.recipient', 'attachments'])
            ->latest('created_at')
            ->paginate($perPage);
        
        return response()->json($memos);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'subject' => 'required|string|max:255',
            'body' => 'required|string',
            'recipients' => 'required|array',
            'recipients.to' => 'required|array|min:1',
            'recipients.to.*' => 'exists:users,id',
            'recipients.cc' => 'nullable|array',
            'recipients.cc.*' => 'exists:users,id',
            'recipients.bcc' => 'nullable|array',
            'recipients.bcc.*' => 'exists:users,id',
            'priority' => 'nullable|in:low,normal,high,urgent',
            'scheduled_at' => 'nullable|date|after:now',
            'is_confidential' => 'nullable|boolean',
            'requires_read_receipt' => 'nullable|boolean',
        ]);
        
        $memo = $this->memoService->createMemo(Auth::id(), $validated);
        
        return response()->json($memo->load(['sender', 'recipients.recipient', 'attachments']), 201);
    }

    public function show($id)
    {
        $memo = Memo::with(['sender', 'recipients.recipient', 'attachments', 'thread.memos'])
            ->findOrFail($id);
        
        // Check access
        $userId = Auth::id();
        if (!$this->memoService->canAccessMemo($userId, $memo)) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }
        
        // Mark as read if user is recipient
        $recipient = $memo->recipients()->where('recipient_id', $userId)->first();
        if ($recipient && $recipient->isUnread()) {
            $recipient->markAsRead();
        }
        
        return response()->json($memo);
    }

    public function update(Request $request, $id)
    {
        $memo = Memo::findOrFail($id);
        
        // Only sender can update
        if ($memo->sender_id !== Auth::id()) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }
        
        // Only drafts can be updated
        if (!$memo->isDraft()) {
            return response()->json(['message' => 'Only drafts can be updated'], 400);
        }
        
        $validated = $request->validate([
            'subject' => 'sometimes|string|max:255',
            'body' => 'sometimes|string',
            'priority' => 'sometimes|in:low,normal,high,urgent',
            'scheduled_at' => 'nullable|date|after:now',
        ]);
        
        $memo->update($validated);
        
        return response()->json($memo->load(['sender', 'recipients.recipient', 'attachments']));
    }

    public function destroy($id)
    {
        $memo = Memo::findOrFail($id);
        $userId = Auth::id();
        
        // Sender can delete
        if ($memo->sender_id === $userId) {
            $memo->delete();
            return response()->json(['message' => 'Memo deleted']);
        }
        
        // Recipient can mark as deleted
        $recipient = $memo->recipients()->where('recipient_id', $userId)->first();
        if ($recipient) {
            $recipient->update(['deleted_at' => now()]);
            return response()->json(['message' => 'Memo moved to trash']);
        }
        
        return response()->json(['message' => 'Unauthorized'], 403);
    }

    public function reply(Request $request, $id)
    {
        $parentMemo = Memo::findOrFail($id);
        
        $validated = $request->validate([
            'body' => 'required|string',
            'reply_all' => 'nullable|boolean',
        ]);
        
        $memo = $this->memoService->replyToMemo(Auth::id(), $parentMemo, $validated);
        
        return response()->json($memo->load(['sender', 'recipients.recipient']), 201);
    }

    public function forward(Request $request, $id)
    {
        $originalMemo = Memo::findOrFail($id);
        
        $validated = $request->validate([
            'recipients' => 'required|array',
            'recipients.to' => 'required|array|min:1',
            'recipients.to.*' => 'exists:users,id',
            'body' => 'nullable|string',
        ]);
        
        $memo = $this->memoService->forwardMemo(Auth::id(), $originalMemo, $validated);
        
        return response()->json($memo->load(['sender', 'recipients.recipient', 'attachments']), 201);
    }

    public function toggleStar($id)
    {
        $memo = Memo::findOrFail($id);
        $userId = Auth::id();
        
        $recipient = $memo->recipients()->where('recipient_id', $userId)->firstOrFail();
        $recipient->toggleStar();
        
        return response()->json(['is_starred' => $recipient->is_starred]);
    }

    public function markAsRead($id)
    {
        $memo = Memo::findOrFail($id);
        $userId = Auth::id();
        
        // Only recipients can mark memos as read, not senders
        $recipient = $memo->recipients()->where('recipient_id', $userId)->first();
        
        if (!$recipient) {
            return response()->json(['message' => 'You are not a recipient of this memo'], 400);
        }
        
        $recipient->markAsRead();
        
        return response()->json(['message' => 'Marked as read']);
    }

    public function moveToFolder(Request $request, $id)
    {
        $validated = $request->validate([
            'folder_id' => 'required|exists:memo_folders,id',
        ]);
        
        $memo = Memo::findOrFail($id);
        $userId = Auth::id();
        
        $recipient = $memo->recipients()->where('recipient_id', $userId)->firstOrFail();
        $recipient->moveToFolder($validated['folder_id']);
        
        return response()->json(['message' => 'Moved to folder']);
    }

    public function bulkSend(Request $request)
    {
        $validated = $request->validate([
            'subject' => 'required|string|max:255',
            'body' => 'required|string',
            'recipients' => 'required|array|min:1',
            'recipients.*' => 'exists:users,id',
            'priority' => 'nullable|in:low,normal,high,urgent',
        ]);
        
        $memos = $this->memoService->bulkSend(Auth::id(), $validated);
        
        return response()->json([
            'message' => 'Memos sent successfully',
            'count' => count($memos),
        ], 201);
    }

    public function bulkDelete(Request $request)
    {
        $validated = $request->validate([
            'memo_ids' => 'required|array|min:1',
            'memo_ids.*' => 'exists:memos,id',
        ]);
        
        $count = $this->memoService->bulkDelete(Auth::id(), $validated['memo_ids']);
        
        return response()->json(['message' => "{$count} memos deleted"]);
    }

    public function bulkMarkAsRead(Request $request)
    {
        $validated = $request->validate([
            'memo_ids' => 'required|array|min:1',
            'memo_ids.*' => 'exists:memos,id',
        ]);
        
        $count = $this->memoService->bulkMarkAsRead(Auth::id(), $validated['memo_ids']);
        
        return response()->json(['message' => "{$count} memos marked as read"]);
    }

    public function stats()
    {
        $userId = Auth::id();
        $stats = $this->memoService->getUserStats($userId);
        
        return response()->json($stats);
    }

    public function search(Request $request)
    {
        $validated = $request->validate([
            'q' => 'required|string|min:2',
        ]);
        
        $userId = Auth::id();
        $results = $this->memoService->searchMemos($userId, $validated['q']);
        
        return response()->json($results);
    }
}
