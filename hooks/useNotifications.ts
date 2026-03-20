import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import notificationApi, { ApiNotification } from '../services/notificationApi';
import { Notification } from '../types';

const POLL_INTERVAL = 30000; // 30s

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

  const { data, isLoading: loading, refetch } = useQuery({
    queryKey: ['notifications'],
    queryFn: async () => {
      const resp = await notificationApi.getNotifications();
      return {
        list: (resp.notifications ?? []).map(mapNotification),
        unreadCount: resp.unread_count ?? 0
      };
    },
    refetchInterval: POLL_INTERVAL,
    staleTime: POLL_INTERVAL,
  });

  const notifications = data?.list ?? [];
  const unreadCount = data?.unreadCount ?? 0;

  const markReadMutation = useMutation({
    mutationFn: (id: string) => notificationApi.markRead(id),
    onMutate: async (id) => {
      // Cancel any outgoing refetches (so they don't overwrite our optimistic update)
      await queryClient.cancelQueries({ queryKey: ['notifications'] });

      // Snapshot the previous value
      const previousNotifications = queryClient.getQueryData<Notification[]>(['notifications']);

      // Optimistically update to the new value
      queryClient.setQueryData(['notifications'], (old: Notification[] | undefined) =>
        old ? old.map(n => n.id === id ? { ...n, isRead: true } : n) : []
      );

      return { previousNotifications };
    },
    onError: (err, id, context) => {
      if (context?.previousNotifications) {
        queryClient.setQueryData(['notifications'], context.previousNotifications);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    },
  });

  const markAsRead = (id: string) => markReadMutation.mutate(id);

  const markAllAsRead = () => {
     // Optional: Connect to bulk API if available. For now, local only or sequential (not ideal).
     queryClient.setQueryData(['notifications'], (old: Notification[] | undefined) =>
        old ? old.map(n => ({ ...n, isRead: true })) : []
     );
  };

  return { notifications, unreadCount, loading, markAsRead, markAllAsRead, refresh: refetch };
};
