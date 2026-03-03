<?php

namespace App\Http\Controllers;

use App\Models\MemoFolder;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Str;

class MemoFolderController extends Controller
{
    public function index()
    {
        $folders = MemoFolder::forUser(Auth::id())
            ->visible()
            ->ordered()
            ->get()
            ->map(function ($folder) {
                return [
                    'id' => $folder->id,
                    'name' => $folder->name,
                    'slug' => $folder->slug,
                    'icon' => $folder->icon,
                    'color' => $folder->color,
                    'is_system' => $folder->is_system,
                    'memo_count' => $folder->getMemoCount(),
                    'unread_count' => $folder->getUnreadCount(),
                ];
            });
        
        return response()->json($folders);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'icon' => 'nullable|string|max:10',
            'color' => 'nullable|string|max:50',
        ]);
        
        $folder = MemoFolder::create([
            'user_id' => Auth::id(),
            'name' => $validated['name'],
            'slug' => Str::slug($validated['name']),
            'icon' => $validated['icon'] ?? '📁',
            'color' => $validated['color'] ?? '#8252e9',
            'sort_order' => MemoFolder::forUser(Auth::id())->max('sort_order') + 1,
            'is_system' => false,
            'is_visible' => true,
        ]);
        
        return response()->json($folder, 201);
    }

    public function update(Request $request, $id)
    {
        $folder = MemoFolder::findOrFail($id);
        
        if ($folder->user_id !== Auth::id()) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }
        
        if ($folder->is_system) {
            return response()->json(['message' => 'Cannot edit system folders'], 400);
        }
        
        $validated = $request->validate([
            'name' => 'sometimes|string|max:255',
            'icon' => 'sometimes|string|max:10',
            'color' => 'sometimes|string|max:50',
            'is_visible' => 'sometimes|boolean',
        ]);
        
        if (isset($validated['name'])) {
            $validated['slug'] = Str::slug($validated['name']);
        }
        
        $folder->update($validated);
        
        return response()->json($folder);
    }

    public function destroy($id)
    {
        $folder = MemoFolder::findOrFail($id);
        
        if ($folder->user_id !== Auth::id()) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }
        
        if ($folder->is_system) {
            return response()->json(['message' => 'Cannot delete system folders'], 400);
        }
        
        // Move memos to inbox
        $inboxFolder = MemoFolder::forUser(Auth::id())
            ->where('slug', 'inbox')
            ->first();
        
        if ($inboxFolder) {
            $folder->memoRecipients()->update(['folder_id' => $inboxFolder->id]);
        }
        
        $folder->delete();
        
        return response()->json(['message' => 'Folder deleted']);
    }
}
