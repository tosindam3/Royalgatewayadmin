<?php

namespace App\Http\Controllers;

use App\Models\Memo;
use App\Models\MemoAttachment;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;

class MemoAttachmentController extends Controller
{
    public function upload(Request $request, $memoId)
    {
        $memo = Memo::findOrFail($memoId);
        
        // Check access
        if ($memo->sender_id !== Auth::id()) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }
        
        $request->validate([
            'file' => [
                'required',
                'file',
                'max:' . (config('memo.max_attachment_size') / 1024),
                'mimes:' . implode(',', array_map(function ($mime) {
                    return explode('/', $mime)[1];
                }, config('memo.allowed_mime_types'))),
            ],
        ]);
        
        $file = $request->file('file');
        $filename = Str::uuid() . '.' . $file->getClientOriginalExtension();
        $path = $file->storeAs('', $filename, 'memo_attachments');
        
        $attachment = MemoAttachment::create([
            'memo_id' => $memoId,
            'uploaded_by' => Auth::id(),
            'filename' => $filename,
            'original_filename' => $file->getClientOriginalName(),
            'mime_type' => $file->getMimeType(),
            'file_size' => $file->getSize(),
            'storage_path' => $path,
            'storage_disk' => 'memo_attachments',
        ]);
        
        return response()->json($attachment, 201);
    }

    public function index($memoId)
    {
        $memo = Memo::findOrFail($memoId);
        
        // Check access
        $userId = Auth::id();
        if ($memo->sender_id !== $userId && !$memo->recipients()->where('recipient_id', $userId)->exists()) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }
        
        $attachments = $memo->attachments;
        
        return response()->json($attachments);
    }

    public function download($attachmentId)
    {
        $attachment = MemoAttachment::findOrFail($attachmentId);
        $memo = $attachment->memo;
        
        // Check access
        $userId = Auth::id();
        if ($memo->sender_id !== $userId && !$memo->recipients()->where('recipient_id', $userId)->exists()) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }
        
        if (!$attachment->exists()) {
            return response()->json(['message' => 'File not found'], 404);
        }
        
        $attachment->incrementDownloadCount();
        
        return Storage::disk($attachment->storage_disk)->download(
            $attachment->storage_path,
            $attachment->original_filename
        );
    }

    public function destroy($attachmentId)
    {
        $attachment = MemoAttachment::findOrFail($attachmentId);
        $memo = $attachment->memo;
        
        // Only sender can delete attachments
        if ($memo->sender_id !== Auth::id()) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }
        
        $attachment->delete();
        
        return response()->json(['message' => 'Attachment deleted']);
    }
}
