<?php

namespace App\Http\Controllers;

use App\Models\MemoSignature;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Cache;

class MemoSignatureController extends Controller
{
    public function index()
    {
        $userId = Auth::id();
        $cacheKey = "memo_signatures_{$userId}";
        
        $signatures = Cache::remember($cacheKey, config('memo.cache_ttl.signatures'), function () use ($userId) {
            return MemoSignature::forUser($userId)
                ->active()
                ->orderBy('is_default', 'desc')
                ->orderBy('name')
                ->get();
        });
        
        return response()->json($signatures);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'content' => 'required|string',
            'is_default' => 'nullable|boolean',
        ]);
        
        $signature = MemoSignature::create([
            'user_id' => Auth::id(),
            'name' => $validated['name'],
            'content' => $validated['content'],
            'is_default' => $validated['is_default'] ?? false,
            'is_active' => true,
        ]);
        
        if ($signature->is_default) {
            $signature->setAsDefault();
        }
        
        $this->clearCache();
        
        return response()->json($signature, 201);
    }

    public function update(Request $request, $id)
    {
        $signature = MemoSignature::findOrFail($id);
        
        if ($signature->user_id !== Auth::id()) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }
        
        $validated = $request->validate([
            'name' => 'sometimes|string|max:255',
            'content' => 'sometimes|string',
            'is_active' => 'sometimes|boolean',
        ]);
        
        $signature->update($validated);
        
        $this->clearCache();
        
        return response()->json($signature);
    }

    public function destroy($id)
    {
        $signature = MemoSignature::findOrFail($id);
        
        if ($signature->user_id !== Auth::id()) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }
        
        $signature->delete();
        
        $this->clearCache();
        
        return response()->json(['message' => 'Signature deleted']);
    }

    public function setDefault($id)
    {
        $signature = MemoSignature::findOrFail($id);
        
        if ($signature->user_id !== Auth::id()) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }
        
        $signature->setAsDefault();
        
        $this->clearCache();
        
        return response()->json(['message' => 'Default signature updated']);
    }

    protected function clearCache()
    {
        Cache::forget("memo_signatures_" . Auth::id());
    }
}
