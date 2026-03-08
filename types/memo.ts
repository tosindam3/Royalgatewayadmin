export interface MemoUser {
  id: number;
  name: string;
  email: string;
  avatar?: string;
}

export interface MemoThread {
  id: number;
  organization_id: number;
  first_memo_id?: number;
  subject: string;
  memo_count: number;
  last_activity_at: string;
  created_at: string;
  updated_at: string;
  memos?: Memo[];
}

export interface MemoAttachment {
  id: number;
  memo_id: number;
  uploaded_by: number;
  filename: string;
  original_filename: string;
  mime_type: string;
  file_size: number;
  storage_path: string;
  storage_disk: string;
  download_count: number;
  last_downloaded_at?: string;
  metadata?: any;
  created_at: string;
  updated_at: string;
}

export interface MemoRecipient {
  id: number;
  memo_id: number;
  recipient_id: number;
  recipient_type: 'to' | 'cc' | 'bcc';
  status: 'pending' | 'delivered' | 'read' | 'archived' | 'deleted';
  read_at?: string;
  archived_at?: string;
  deleted_at?: string;
  is_starred: boolean;
  folder_id?: number;
  created_at: string;
  updated_at: string;
  recipient?: MemoUser;
}

export interface Memo {
  id: number;
  sender_id: number;
  organization_id: number;
  thread_id?: number;
  parent_memo_id?: number;
  subject: string;
  body: string;
  body_plain?: string;
  priority: 'low' | 'normal' | 'high' | 'urgent';
  status: 'draft' | 'scheduled' | 'sent' | 'failed';
  type: 'memo' | 'reply' | 'forward';
  scheduled_at?: string;
  sent_at?: string;
  requires_read_receipt: boolean;
  is_confidential: boolean;
  metadata?: any;
  created_at: string;
  updated_at: string;
  deleted_at?: string;

  // Relations
  sender?: MemoUser;
  thread?: MemoThread;
  parent_memo?: Memo;
  recipients?: MemoRecipient[];
  attachments?: MemoAttachment[];
}

export interface MemoFolder {
  id: number;
  user_id: number;
  name: string;
  slug: string;
  icon?: string;
  color?: string;
  sort_order: number;
  is_system: boolean;
  is_visible: boolean;
  created_at: string;
  updated_at: string;
}

export interface MemoSignature {
  id: number;
  user_id: number;
  name: string;
  content: string;
  is_default: boolean;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface MemoStats {
  inbox_count: number;
  unread_count: number;
  starred_count: number;
  drafts_count: number;
  sent_count: number;
}

export interface CreateMemoRequest {
  subject: string;
  body: string;
  recipients: {
    to: number[];
    cc?: number[];
    bcc?: number[];
  };
  priority?: 'low' | 'normal' | 'high' | 'urgent';
  scheduled_at?: string;
  is_confidential?: boolean;
  requires_read_receipt?: boolean;
}

export interface ReplyMemoRequest {
  body: string;
  reply_all?: boolean;
}

export interface ForwardMemoRequest {
  recipients: {
    to: number[];
    cc?: number[];
    bcc?: number[];
  };
  body?: string;
}

export interface MemoFilters {
  folder?: string;
  status?: 'draft' | 'scheduled' | 'sent' | 'failed';
  priority?: 'low' | 'normal' | 'high' | 'urgent';
  search?: string;
  per_page?: number;
}

export interface PaginatedMemos {
  data: Memo[];
  current_page: number;
  last_page: number;
  per_page: number;
  total: number;
  from: number;
  to: number;
}