// Team Chat Type Definitions

export interface User {
  id: number;
  name: string;
  email?: string;
  avatar?: string;
}

export interface Channel {
  id: number;
  name: string;
  slug: string;
  description?: string;
  type: 'public' | 'private' | 'direct';
  created_by: number;
  organization_id?: number;
  is_archived: boolean;
  unread_count: number;
  is_pinned: boolean;
  is_muted: boolean;
  member_role?: 'owner' | 'admin' | 'member';
  messages_count?: number;
  creator?: User;
  members?: User[];
  metadata?: Record<string, any>;
  created_at: string;
  updated_at: string;
}

export interface MessageAttachment {
  id: number;
  message_id: number;
  file_name: string;
  file_path: string;
  file_type: string;
  file_size: number;
  mime_type: string;
  formatted_size?: string;
  metadata?: Record<string, any>;
  created_at: string;
}

export interface MessageReaction {
  id: number;
  message_id: number;
  user_id: number;
  emoji: string;
  user?: User;
  created_at: string;
}

export interface Message {
  id: number;
  channel_id: number;
  user_id: number;
  parent_message_id?: number;
  content: string;
  type: 'text' | 'file' | 'audio' | 'system';
  is_edited: boolean;
  is_deleted: boolean;
  edited_at?: string;
  user?: User;
  attachments?: MessageAttachment[];
  reactions?: MessageReaction[];
  reads?: { user_id: number; read_at?: string }[];
  replies?: Message[];
  parentMessage?: Message;
  metadata?: Record<string, any>;
  created_at: string;
  updated_at: string;
}

export interface TypingUser {
  id: number;
  name: string;
}

export interface BlockedKeyword {
  id: number;
  keyword: string;
  action: 'block' | 'flag' | 'warn';
  is_active: boolean;
  created_by: number;
  creator?: User;
  created_at: string;
  updated_at: string;
}

export interface ChatAnalytics {
  total_channels: number;
  total_messages: number;
  active_users: number;
  messages_today: number;
  top_channels?: Channel[];
}

export interface ChannelStats {
  total_messages: number;
  total_members: number;
  messages_today: number;
  active_members_today: number;
}

export interface MessageActivity {
  date: string;
  count: number;
}

export interface PaginationMeta {
  current_page: number;
  last_page: number;
  per_page: number;
  total: number;
  from?: number;
  to?: number;
}

export interface PaginatedResponse<T> {
  data: T[];
  meta: PaginationMeta;
}

// Request Types
export interface CreateChannelRequest {
  name: string;
  description?: string;
  type: 'public' | 'private' | 'direct';
  organization_id?: number;
  member_ids?: number[];
  metadata?: Record<string, any>;
}

export interface UpdateChannelRequest {
  name?: string;
  description?: string;
  metadata?: Record<string, any>;
}

export interface SendMessageRequest {
  content: string;
  type?: 'text' | 'file' | 'audio' | 'system';
  parent_message_id?: number;
  attachments?: File[];
  metadata?: Record<string, any>;
}

export interface UpdateMessageRequest {
  content: string;
}

export interface AddMembersRequest {
  user_ids: number[];
  role?: 'owner' | 'admin' | 'member';
}

export interface UpdateMemberRoleRequest {
  role: 'owner' | 'admin' | 'member';
}

export interface AddReactionRequest {
  emoji: string;
}

export interface AddBlockedKeywordRequest {
  keyword: string;
  action: 'block' | 'flag' | 'warn';
}

export interface UpdateBlockedKeywordRequest {
  action?: 'block' | 'flag' | 'warn';
  is_active?: boolean;
}
