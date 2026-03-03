<?php

return [
    'max_attachment_size' => env('MEMO_MAX_ATTACHMENT_SIZE', 10 * 1024 * 1024), // 10MB
    'max_attachments_per_memo' => env('MEMO_MAX_ATTACHMENTS', 10),
    
    'allowed_mime_types' => [
        'application/pdf',
        'application/msword',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'application/vnd.ms-excel',
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'application/vnd.ms-powerpoint',
        'application/vnd.openxmlformats-officedocument.presentationml.presentation',
        'image/jpeg',
        'image/png',
        'image/gif',
        'image/webp',
        'text/plain',
        'text/csv',
    ],
    
    'cache_ttl' => [
        'memo_list' => 300, // 5 minutes
        'memo_detail' => 900, // 15 minutes
        'unread_count' => 60, // 1 minute
        'folder_counts' => 60, // 1 minute
        'signatures' => 3600, // 1 hour
        'thread' => 600, // 10 minutes
    ],
    
    'pagination' => [
        'per_page' => 20,
        'max_per_page' => 100,
    ],
    
    'auto_save_draft_interval' => 30, // seconds
    
    'system_folders' => [
        'inbox' => ['name' => 'Inbox', 'icon' => '📥', 'sort' => 1],
        'starred' => ['name' => 'Starred', 'icon' => '⭐', 'sort' => 2],
        'sent' => ['name' => 'Sent', 'icon' => '📤', 'sort' => 3],
        'drafts' => ['name' => 'Drafts', 'icon' => '📝', 'sort' => 4],
        'scheduled' => ['name' => 'Scheduled', 'icon' => '📅', 'sort' => 5],
        'trash' => ['name' => 'Trash', 'icon' => '🗑️', 'sort' => 6],
    ],
];
