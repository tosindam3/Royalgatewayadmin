import { 
  Memo, 
  MemoStats, 
  MemoFolder, 
  MemoSignature,
  CreateMemoRequest, 
  ReplyMemoRequest, 
  ForwardMemoRequest,
  MemoFilters,
  PaginatedMemos 
} from '../types/memo';
import apiClient from './apiClient';

class MemoService {
  // Get memos with filters
  async getMemos(filters: MemoFilters = {}): Promise<PaginatedMemos> {
    const params = new URLSearchParams();
    
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        params.append(key, value.toString());
      }
    });
    
    return apiClient.get(`/memos?${params}`);
  }

  // Get single memo
  async getMemo(id: number): Promise<Memo> {
    return apiClient.get(`/memos/${id}`);
  }

  // Create memo
  async createMemo(data: CreateMemoRequest): Promise<Memo> {
    return apiClient.post('/memos', data);
  }

  // Update memo (drafts only)
  async updateMemo(id: number, data: Partial<CreateMemoRequest>): Promise<Memo> {
    return apiClient.put(`/memos/${id}`, data);
  }

  // Delete memo
  async deleteMemo(id: number): Promise<void> {
    return apiClient.delete(`/memos/${id}`);
  }

  // Reply to memo
  async replyToMemo(id: number, data: ReplyMemoRequest): Promise<Memo> {
    return apiClient.post(`/memos/${id}/reply`, data);
  }

  // Forward memo
  async forwardMemo(id: number, data: ForwardMemoRequest): Promise<Memo> {
    return apiClient.post(`/memos/${id}/forward`, data);
  }

  // Toggle star
  async toggleStar(id: number): Promise<{ is_starred: boolean }> {
    return apiClient.post(`/memos/${id}/star`);
  }

  // Mark as read
  async markAsRead(id: number): Promise<void> {
    return apiClient.post(`/memos/${id}/read`);
  }

  // Move to folder
  async moveToFolder(id: number, folderId: number): Promise<void> {
    return apiClient.post(`/memos/${id}/move`, { folder_id: folderId });
  }

  // Bulk operations
  async bulkDelete(memoIds: number[]): Promise<void> {
    return apiClient.post('/memos/bulk-delete', { memo_ids: memoIds });
  }

  async bulkMarkAsRead(memoIds: number[]): Promise<void> {
    return apiClient.post('/memos/bulk-read', { memo_ids: memoIds });
  }

  // Get user stats
  async getStats(): Promise<MemoStats> {
    return apiClient.get('/memos/stats');
  }

  // Search memos
  async searchMemos(query: string): Promise<Memo[]> {
    return apiClient.get(`/memos/search?q=${encodeURIComponent(query)}`);
  }

  // Folders
  async getFolders(): Promise<MemoFolder[]> {
    return apiClient.get('/memo-folders');
  }

  // Signatures
  async getSignatures(): Promise<MemoSignature[]> {
    return apiClient.get('/memo-signatures');
  }

  // Upload attachment
  async uploadAttachment(memoId: number, file: File): Promise<any> {
    const formData = new FormData();
    formData.append('file', file);
    
    return apiClient.post(`/memos/${memoId}/attachments`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
  }

  // Download attachment
  async downloadAttachment(attachmentId: number): Promise<Blob> {
    const response = await apiClient.get(`/memos/attachments/${attachmentId}/download`, {
      responseType: 'blob',
    });
    return response;
  }

  getAttachmentDownloadUrl(attachmentId: number): string {
    // Deprecated: Use downloadAttachment() instead for secure downloads
    return `/api/v1/memos/attachments/${attachmentId}/download?token=${localStorage.getItem('royalgateway_auth_token')}`;
  }
}

export const memoService = new MemoService();
export default memoService;