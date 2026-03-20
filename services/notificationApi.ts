import apiClient from './apiClient';

export interface ApiNotification {
  id: string;
  type: 'MEMO' | 'PENDING_REVIEW' | 'CHAT' | 'CYCLE_EVENT' | 'EVALUATION_COMPLETE' | 'SYSTEM';
  title: string;
  message: string;
  timestamp: string;
  isRead: boolean;
  priority: 'LOW' | 'MEDIUM' | 'HIGH';
  actionUrl?: string;
  meta?: Record<string, any>;
}

export interface NotificationsResponse {
  notifications: ApiNotification[];
  unread_count: number;
}

const notificationApi = {
  getNotifications: (): Promise<NotificationsResponse> =>
    apiClient.get('/notifications'),

  markRead: (id: string): Promise<void> =>
    apiClient.post('/notifications/mark-read', { id }),
};

export default notificationApi;
