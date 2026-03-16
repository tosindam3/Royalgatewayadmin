import apiClient from './apiClient';
import {
  Channel,
  Message,
  BlockedKeyword,
  ChatAnalytics,
  ChannelStats,
  MessageActivity,
  TypingUser,
  PaginatedResponse,
  CreateChannelRequest,
  UpdateChannelRequest,
  SendMessageRequest,
  UpdateMessageRequest,
  AddMembersRequest,
  UpdateMemberRoleRequest,
  AddReactionRequest,
  AddBlockedKeywordRequest,
  UpdateBlockedKeywordRequest,
} from '../types/chat';

const chatApi = {
  // ==================== CHANNELS ====================
  
  getChannels: async (params?: {
    type?: 'public' | 'private' | 'direct';
    include_archived?: boolean;
  }): Promise<Channel[]> => {
    return apiClient.get('/chat/channels', { params });
  },

  getChannel: async (channelId: number): Promise<Channel> => {
    return apiClient.get(`/chat/channels/${channelId}`);
  },

  createChannel: async (data: CreateChannelRequest): Promise<Channel> => {
    return apiClient.post('/chat/channels', data);
  },

  updateChannel: async (channelId: number, data: UpdateChannelRequest): Promise<Channel> => {
    return apiClient.put(`/chat/channels/${channelId}`, data);
  },

  deleteChannel: async (channelId: number): Promise<void> => {
    return apiClient.delete(`/chat/channels/${channelId}`);
  },

  toggleArchive: async (channelId: number): Promise<Channel> => {
    return apiClient.post(`/chat/channels/${channelId}/archive`);
  },

  togglePin: async (channelId: number): Promise<void> => {
    return apiClient.post(`/chat/channels/${channelId}/pin`);
  },

  toggleMute: async (channelId: number): Promise<void> => {
    return apiClient.post(`/chat/channels/${channelId}/mute`);
  },

  markAsRead: async (channelId: number): Promise<void> => {
    return apiClient.post(`/chat/channels/${channelId}/read`);
  },

  getChannelStats: async (channelId: number): Promise<ChannelStats> => {
    return apiClient.get(`/chat/channels/${channelId}/stats`);
  },

  // ==================== MEMBERS ====================

  addMembers: async (channelId: number, data: AddMembersRequest): Promise<void> => {
    return apiClient.post(`/chat/channels/${channelId}/members`, data);
  },

  removeMember: async (channelId: number, userId: number): Promise<void> => {
    return apiClient.delete(`/chat/channels/${channelId}/members/${userId}`);
  },

  updateMemberRole: async (
    channelId: number,
    userId: number,
    data: UpdateMemberRoleRequest
  ): Promise<void> => {
    return apiClient.put(`/chat/channels/${channelId}/members/${userId}/role`, data);
  },

  // ==================== MESSAGES ====================

  getMessages: async (
    channelId: number,
    params?: {
      per_page?: number;
      page?: number;
      search?: string;
    }
  ): Promise<PaginatedResponse<Message>> => {
    return apiClient.get(`/chat/channels/${channelId}/messages`, { params });
  },

  getMessage: async (channelId: number, messageId: number): Promise<Message> => {
    return apiClient.get(`/chat/channels/${channelId}/messages/${messageId}`);
  },

  globalSearch: async (query: string, page: number = 1): Promise<PaginatedResponse<Message>> => {
    return apiClient.get('/chat/search', { params: { query, page } });
  },

  sendMessage: async (channelId: number, data: SendMessageRequest): Promise<Message> => {
    // Handle file uploads with FormData
    if (data.attachments && data.attachments.length > 0) {
      const formData = new FormData();
      formData.append('content', data.content);
      if (data.type) formData.append('type', data.type);
      if (data.parent_message_id) formData.append('parent_message_id', data.parent_message_id.toString());
      
      data.attachments.forEach((file) => {
        formData.append('attachments[]', file);
      });

      return apiClient.post(`/chat/channels/${channelId}/messages`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
    }

    return apiClient.post(`/chat/channels/${channelId}/messages`, data);
  },

  updateMessage: async (
    channelId: number,
    messageId: number,
    data: UpdateMessageRequest
  ): Promise<Message> => {
    return apiClient.put(`/chat/channels/${channelId}/messages/${messageId}`, data);
  },

  deleteMessage: async (channelId: number, messageId: number): Promise<void> => {
    return apiClient.delete(`/chat/channels/${channelId}/messages/${messageId}`);
  },

  // ==================== REACTIONS ====================

  addReaction: async (
    channelId: number,
    messageId: number,
    data: AddReactionRequest
  ): Promise<void> => {
    return apiClient.post(`/chat/channels/${channelId}/messages/${messageId}/reactions`, data);
  },

  removeReaction: async (channelId: number, messageId: number, emoji: string): Promise<void> => {
    return apiClient.delete(`/chat/channels/${channelId}/messages/${messageId}/reactions/${encodeURIComponent(emoji)}`);
  },

  // ==================== TYPING INDICATORS ====================

  setTyping: async (channelId: number): Promise<void> => {
    return apiClient.post(`/chat/channels/${channelId}/typing`);
  },

  getTypingUsers: async (channelId: number): Promise<TypingUser[]> => {
    return apiClient.get(`/chat/channels/${channelId}/typing`);
  },

  // ==================== ADMIN ====================

  getAnalytics: async (): Promise<ChatAnalytics> => {
    return apiClient.get('/chat/admin/analytics');
  },

  getMessageActivity: async (days: number = 7): Promise<MessageActivity[]> => {
    return apiClient.get('/chat/admin/message-activity', { params: { days } });
  },

  getTopChannels: async (days: number = 7, limit: number = 10): Promise<Channel[]> => {
    return apiClient.get('/chat/admin/top-channels', { params: { days, limit } });
  },

  getTopUsers: async (days: number = 7, limit: number = 10): Promise<any[]> => {
    return apiClient.get('/chat/admin/top-users', { params: { days, limit } });
  },

  getComplianceSettings: async (): Promise<Record<string, any>> => {
    return apiClient.get('/chat/admin/compliance-settings');
  },

  // ==================== BLOCKED KEYWORDS ====================

  getBlockedKeywords: async (): Promise<BlockedKeyword[]> => {
    return apiClient.get('/chat/admin/blocked-keywords');
  },

  addBlockedKeyword: async (data: AddBlockedKeywordRequest): Promise<BlockedKeyword> => {
    return apiClient.post('/chat/admin/blocked-keywords', data);
  },

  updateBlockedKeyword: async (
    keywordId: number,
    data: UpdateBlockedKeywordRequest
  ): Promise<BlockedKeyword> => {
    return apiClient.put(`/chat/admin/blocked-keywords/${keywordId}`, data);
  },

  deleteBlockedKeyword: async (keywordId: number): Promise<void> => {
    return apiClient.delete(`/chat/admin/blocked-keywords/${keywordId}`);
  },
};

export default chatApi;
