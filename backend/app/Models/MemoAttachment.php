<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Support\Facades\Storage;

class MemoAttachment extends Model
{
    protected $fillable = [
        'memo_id',
        'uploaded_by',
        'filename',
        'original_filename',
        'mime_type',
        'file_size',
        'storage_path',
        'storage_disk',
        'download_count',
        'last_downloaded_at',
        'metadata',
    ];

    protected $casts = [
        'file_size' => 'integer',
        'download_count' => 'integer',
        'last_downloaded_at' => 'datetime',
        'metadata' => 'array',
    ];

    public function memo(): BelongsTo
    {
        return $this->belongsTo(Memo::class);
    }

    public function uploader(): BelongsTo
    {
        return $this->belongsTo(User::class, 'uploaded_by');
    }

    public function incrementDownloadCount(): void
    {
        $this->increment('download_count');
        $this->update(['last_downloaded_at' => now()]);
    }

    public function getUrl(): string
    {
        return Storage::disk($this->storage_disk)->url($this->storage_path);
    }

    public function getPath(): string
    {
        return Storage::disk($this->storage_disk)->path($this->storage_path);
    }

    public function exists(): bool
    {
        return Storage::disk($this->storage_disk)->exists($this->storage_path);
    }

    public function delete(): bool
    {
        if ($this->exists()) {
            Storage::disk($this->storage_disk)->delete($this->storage_path);
        }
        return parent::delete();
    }

    public function getFormattedSize(): string
    {
        $bytes = $this->file_size;
        $units = ['B', 'KB', 'MB', 'GB'];
        
        for ($i = 0; $bytes > 1024 && $i < count($units) - 1; $i++) {
            $bytes /= 1024;
        }
        
        return round($bytes, 2) . ' ' . $units[$i];
    }
}
