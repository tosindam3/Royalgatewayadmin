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

const API_BASE = '/api/v1/memos';
const API_FOLDERS = '/api/v1/memo-folders';
const API_SIGNATURES = '/api/v1/memo-signatures';

class MemoService {
  // Get memos with filters
  async getMemos(filters: MemoFilters = {}): Promise<PaginatedMemos> {
    const params = new URLSearchParams();
    
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        params.append(key, value.toString());
      }
    });
    
    const response = await fetch(`${API_BASE}?${params}`, {
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('royalgateway_auth_token')}`,
        'Accept': 'application/json',
      },
    });
    
    if (!response.ok) {
      throw new Error('Failed to fetch memos');
    }
    
    return response.json();
  }

  // Get single memo
  async getMemo(id: number): Promise<Memo> {
    const response = await fetch(`${API_BASE}/${id}`, {
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('royalgateway_auth_token')}`,
        'Accept': 'application/json',
      },
    });
    
    if (!response.ok) {
      throw new Error('Failed to fetch memo');
    }
    
    return response.json();
  }

  // Create memo
  async createMemo(data: CreateMemoRequest): Promise<Memo> {
    const response = await fetch(API_BASE, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('royalgateway_auth_token')}`,
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      body: JSON.stringify(data),
    });
    
    if (!response.ok) {
      throw new Error('Failed to create memo');
    }
    
    return response.json();
  }

  // Update memo (drafts only)
  async updateMemo(id: number, data: Partial<CreateMemoRequest>): Promise<Memo> {
    const response = await fetch(`${API_BASE}/${id}`, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('royalgateway_auth_token')}`,
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      body: JSON.stringify(data),
    });
    
    if (!response.ok) {
      throw new Error('Failed to update memo');
    }
    
    return response.json();
  }

  // Delete memo
  async deleteMemo(id: number): Promise<void> {
    const response = await fetch(`${API_BASE}/${id}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('royalgateway_auth_token')}`,
        'Accept': 'application/json',
      },
    });
    
    if (!response.ok) {
      throw new Error('Failed to delete memo');
    }
  }

  // Reply to memo
  async replyToMemo(id: number, data: ReplyMemoRequest): Promise<Memo> {
    const response = await fetch(`${API_BASE}/${id}/reply`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('royalgateway_auth_token')}`,
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      body: JSON.stringify(data),
    });
    
    if (!response.ok) {
      throw new Error('Failed to reply to memo');
    }
    
    return response.json();
  }

  // Forward memo
  async forwardMemo(id: number, data: ForwardMemoRequest): Promise<Memo> {
    const response = await fetch(`${API_BASE}/${id}/forward`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('royalgateway_auth_token')}`,
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      body: JSON.stringify(data),
    });
    
    if (!response.ok) {
      throw new Error('Failed to forward memo');
    }
    
    return response.json();
  }

  // Toggle star
  async toggleStar(id: number): Promise<{ is_starred: boolean }> {
    const response = await fetch(`${API_BASE}/${id}/star`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('royalgateway_auth_token')}`,
        'Accept': 'application/json',
      },
    });
    
    if (!response.ok) {
      throw new Error('Failed to toggle star');
    }
    
    return response.json();
  }

  // Mark as read
  async markAsRead(id: number): Promise<void> {
    const response = await fetch(`${API_BASE}/${id}/read`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('royalgateway_auth_token')}`,
        'Accept': 'application/json',
      },
    });
    
    if (!response.ok) {
      throw new Error('Failed to mark as read');
    }
  }

  // Move to folder
  async moveToFolder(id: number, folderId: number): Promise<void> {
    const response = await fetch(`${API_BASE}/${id}/move`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('royalgateway_auth_token')}`,
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      body: JSON.stringify({ folder_id: folderId }),
    });
    
    if (!response.ok) {
      throw new Error('Failed to move memo');
    }
  }

  // Bulk operations
  async bulkDelete(memoIds: number[]): Promise<void> {
    const response = await fetch(`${API_BASE}/bulk-delete`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('royalgateway_auth_token')}`,
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      body: JSON.stringify({ memo_ids: memoIds }),
    });
    
    if (!response.ok) {
      throw new Error('Failed to bulk delete memos');
    }
  }

  async bulkMarkAsRead(memoIds: number[]): Promise<void> {
    const response = await fetch(`${API_BASE}/bulk-read`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('royalgateway_auth_token')}`,
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      body: JSON.stringify({ memo_ids: memoIds }),
    });
    
    if (!response.ok) {
      throw new Error('Failed to bulk mark as read');
    }
  }

  // Get user stats
  async getStats(): Promise<MemoStats> {
    const response = await fetch(`${API_BASE}/stats`, {
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('royalgateway_auth_token')}`,
        'Accept': 'application/json',
      },
    });
    
    if (!response.ok) {
      throw new Error('Failed to fetch stats');
    }
    
    return response.json();
  }

  // Search memos
  async searchMemos(query: string): Promise<Memo[]> {
    const response = await fetch(`${API_BASE}/search?q=${encodeURIComponent(query)}`, {
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('royalgateway_auth_token')}`,
        'Accept': 'application/json',
      },
    });
    
    if (!response.ok) {
      throw new Error('Failed to search memos');
    }
    
    return response.json();
  }

  // Folders
  async getFolders(): Promise<MemoFolder[]> {
    const response = await fetch(API_FOLDERS, {
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('royalgateway_auth_token')}`,
        'Accept': 'application/json',
      },
    });
    
    if (!response.ok) {
      throw new Error('Failed to fetch folders');
    }
    
    return response.json();
  }

  // Signatures
  async getSignatures(): Promise<MemoSignature[]> {
    const response = await fetch(API_SIGNATURES, {
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('royalgateway_auth_token')}`,
        'Accept': 'application/json',
      },
    });
    
    if (!response.ok) {
      throw new Error('Failed to fetch signatures');
    }
    
    return response.json();
  }

  // Upload attachment
  async uploadAttachment(memoId: number, file: File): Promise<any> {
    const formData = new FormData();
    formData.append('file', file);
    
    const response = await fetch(`${API_BASE}/${memoId}/attachments`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('royalgateway_auth_token')}`,
        'Accept': 'application/json',
      },
      body: formData,
    });
    
    if (!response.ok) {
      throw new Error('Failed to upload attachment');
    }
    
    return response.json();
  }

  // Download attachment
  getAttachmentDownloadUrl(attachmentId: number): string {
    return `/api/v1/memos/attachments/${attachmentId}/download?token=${localStorage.getItem('royalgateway_auth_token')}`;
  }
}

export const memoService = new MemoService();
export default memoService;