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
        
        $maxSize = config('memo.max_attachment_size', 10485760); // 10MB default
        $allowedMimes = config('memo.allowed_mime_types', []);
        
        $request->validate([
            'file' => [
                'required',
                'file',
                'max:' . ($maxSize / 1024), // Convert to KB
            ],
        ]);
        
        $file = $request->file('file');
        
        // Validate MIME type
        if (!empty($allowedMimes) && !in_array($file->getMimeType(), $allowedMimes)) {
            return response()->json([
                'message' => 'Invalid file type. Allowed types: PDF, Word, Excel, PowerPoint, Images, Text files.',
                'errors' => ['file' => ['The file type is not allowed.']]
            ], 422);
        }
        
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
