<?php

namespace App\Http\Controllers;

use App\Models\Memo;
use App\Models\MemoAttachment;
use App\Services\AuditLogger;
use App\Traits\ApiResponse;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;

class MemoAttachmentController extends Controller
{
    use ApiResponse;

    /**
     * Upload attachment to memo
     */
    public function upload(Request $request, Memo $memo): JsonResponse
    {
        try {
            $user = $request->user();
            
            // Check authorization
            if ($memo->sender_id !== $user->id) {
                return $this->error('Unauthorized', 403);
            }
            
            // Validate file
            $request->validate([
                'file' => [
                    'required',
                    'file',
                    'max:10240', // 10MB
                    'mimes:pdf,doc,docx,xls,xlsx,ppt,pptx,jpg,jpeg,png,gif,zip'
                ]
            ]);
            
            $file = $request->file('file');
            
            // Sanitize filename
            $originalName = $file->getClientOriginalName();
            $extension = $file->getClientOriginalExtension();
            $baseName = pathinfo($originalName, PATHINFO_FILENAME);
            $sanitizedName = Str::slug($baseName) . '_' . time() . '.' . $extension;
            
            // Store in private disk
            $path = $file->storeAs('memo/attachments', $sanitizedName, 'private');
            
            // Create attachment record
            $attachment = MemoAttachment::create([
                'memo_id' => $memo->id,
                'uploaded_by' => $user->id,
                'filename' => $sanitizedName,
                'original_filename' => $originalName,
                'mime_type' => $file->getMimeType(),
                'file_size' => $file->getSize(),
                'storage_path' => $path,
                'storage_disk' => 'private',
            ]);
            
            AuditLogger::log(
                'memo_attachment_uploaded',
                'MemoAttachment',
                $attachment->id,
                null,
                ['memo_id' => $memo->id, 'filename' => $originalName]
            );
            
            return $this->success($attachment, 'Attachment uploaded successfully', 201);
        } catch (\Exception $e) {
            return $this->error('Failed to upload attachment: ' . $e->getMessage(), 500);
        }
    }

    /**
     * Download attachment
     */
    public function download(Request $request, MemoAttachment $attachment)
    {
        try {
            $user = $request->user();
            $memo = $attachment->memo;
            
            // Check authorization
            $canAccess = $memo->sender_id === $user->id || 
                        $memo->recipients()->where('recipient_id', $user->id)->exists();
            
            if (!$canAccess) {
                abort(403, 'Unauthorized');
            }
            
            // Check if file exists
            if (!$attachment->exists()) {
                abort(404, 'File not found');
            }
            
            // Increment download count
            $attachment->incrementDownloadCount();
            
            // Audit log
            AuditLogger::log(
                'memo_attachment_downloaded',
                'MemoAttachment',
                $attachment->id,
                null,
                ['memo_id' => $memo->id, 'user_id' => $user->id]
            );
            
            // Return file
            return Storage::disk($attachment->storage_disk)
                ->download($attachment->storage_path, $attachment->original_filename);
        } catch (\Exception $e) {
            return response()->json(['error' => $e->getMessage()], 500);
        }
    }

    /**
     * Delete attachment
     */
    public function destroy(Request $request, Memo $memo, MemoAttachment $attachment): JsonResponse
    {
        try {
            $user = $request->user();
            
            // Only memo sender can delete attachments
            if ($memo->sender_id !== $user->id) {
                return $this->error('Unauthorized', 403);
            }
            
            // Verify attachment belongs to memo
            if ($attachment->memo_id !== $memo->id) {
                return $this->error('Attachment not found', 404);
            }
            
            $attachmentData = $attachment->toArray();
            $attachment->delete(); // This also deletes the file
            
            AuditLogger::log(
                'memo_attachment_deleted',
                'MemoAttachment',
                $attachment->id,
                $attachmentData,
                null
            );
            
            return $this->success(null, 'Attachment deleted successfully');
        } catch (\Exception $e) {
            return $this->error('Failed to delete attachment: ' . $e->getMessage(), 500);
        }
    }
}
