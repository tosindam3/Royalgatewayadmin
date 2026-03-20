import { useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import notificationApi, { ApiNotification } from '../services/notificationApi';
import { Notification } from '../types';
import Echo from 'laravel-echo';
import Pusher from 'pusher-js';

// Polyfill window for Echo
declare global {
  interface Window {
    Pusher: typeof Pusher;
    Echo: Echo;
  }
}

window.Pusher = Pusher;

/** Maps backend notification to the frontend Notification shape */
const mapNotification = (n: ApiNotification): Notification => ({
  id: n.id,
  type: (n.type === 'MEMO' || n.type === 'CHAT' ? 'SYSTEM' : n.type) as Notification['type'],
  title: n.title,
  message: n.message,
  timestamp: n.timestamp,
  isRead: n.isRead,
  priority: n.priority,
  actionUrl: n.actionUrl,
});

export const useNotifications = () => {
  const queryClient = useQueryClient();

  // Fetch initial data WITHOUT HTTP polling
  const { data, isLoading: loading, refetch } = useQuery({
    queryKey: ['notifications'],
    queryFn: async () => {
      const resp = await notificationApi.getNotifications();
      return {
        list: (resp.notifications ?? []).map(mapNotification),
        unreadCount: resp.unread_count ?? 0
      };
    },
    staleTime: Infinity, // Rely on WS to update cache
  });

  // Setup WebSocket connection
  useEffect(() => {
    try {
      const userStr = localStorage.getItem('royalgateway_user');
      const token = localStorage.getItem('royalgateway_auth_token');
      if (!userStr || !token) return;

      const user = JSON.parse(userStr);

      if (!window.Echo) {
        window.Echo = new Echo({
            broadcaster: 'pusher',
            key: '52b91711bf1f63cd7102',
            cluster: 'eu',
            forceTLS: true,
            authEndpoint: import.meta.env.VITE_API_URL ? `${import.meta.env.VITE_API_URL}/broadcasting/auth` : 'http://localhost:8000/api/v1/broadcasting/auth',
            auth: {
                headers: {
                    Authorization: `Bearer ${token}`
                }
            }
        });
      }

      const channel = window.Echo.private(`App.Models.User.${user.id}`);
      
      channel.notification((notification: any) => {
        // Optimistically prepend to cache
        queryClient.setQueryData(['notifications'], (old: any) => {
          if (!old) return old;
          const mapped = mapNotification(notification as unknown as ApiNotification);
          return {
            list: [mapped, ...old.list],
            unreadCount: old.unreadCount + 1,
          };
        });
      });

      return () => {
        channel.stopListening('.Illuminate\\Notifications\\Events\\BroadcastNotificationCreated');
      };
    } catch (e) {
      console.error("Echo WS setup failed", e);
    }
  }, [queryClient]);

  const notifications = data?.list ?? [];
  const unreadCount = data?.unreadCount ?? 0;

  const markReadMutation = useMutation({
    mutationFn: (id: string) => notificationApi.markRead(id),
    onMutate: async (id) => {
      await queryClient.cancelQueries({ queryKey: ['notifications'] });
      const prev = queryClient.getQueryData(['notifications']);
      queryClient.setQueryData(['notifications'], (old: any) => {
        if (!old) return old;
        return {
          list: old.list.map((n: Notification) => n.id === id ? { ...n, isRead: true } : n),
          unreadCount: Math.max(0, old.unreadCount - 1)
        };
      });
      return { prev };
    },
    onError: (err, id, context) => {
      if (context?.prev) queryClient.setQueryData(['notifications'], context.prev);
    },
    onSettled: () => queryClient.invalidateQueries({ queryKey: ['notifications'] }),
  });

  const markAllReadMutation = useMutation({
    mutationFn: () => notificationApi.markAllRead(),
    onMutate: async () => {
      await queryClient.cancelQueries({ queryKey: ['notifications'] });
      const prev = queryClient.getQueryData(['notifications']);
      queryClient.setQueryData(['notifications'], (old: any) => {
        if (!old) return old;
        return {
          list: old.list.map((n: Notification) => ({ ...n, isRead: true })),
          unreadCount: 0
        };
      });
      return { prev };
    },
    onError: (err, _vars, context) => {
      if (context?.prev) queryClient.setQueryData(['notifications'], context.prev);
    },
    onSettled: () => queryClient.invalidateQueries({ queryKey: ['notifications'] }),
  });

  return { 
    notifications, 
    unreadCount, 
    loading, 
    markAsRead: (id: string) => markReadMutation.mutate(id), 
    markAllAsRead: () => markAllReadMutation.mutate(), 
    refresh: refetch 
  };
};
