import { useEffect, useRef, useCallback } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import chatApi from '../services/chatApi';
import memoService from '../services/memoService';

export interface UnreadCounts {
  chatUnread: number;
  memoUnread: number;
  total: number;
}

/**
 * Polls chat channels and memo stats every 30s to get unread counts.
 * Returns { chatUnread, memoUnread, total }.
 */
export const useUnreadCounts = (): UnreadCounts => {
  const { data: channels } = useQuery({
    queryKey: ['channels'],
    queryFn: () => chatApi.getChannels({}),
    staleTime: 30000,
    refetchInterval: 30000,
  });

  const { data: memoStats } = useQuery({
    queryKey: ['memo-stats-unread'],
    queryFn: () => memoService.getStats(),
    staleTime: 30000,
    refetchInterval: 30000,
  });

  const chatUnread: number = Array.isArray(channels)
    ? channels.reduce((sum: number, ch: any) => sum + (ch.unread_count || 0), 0)
    : 0;

  const memoUnread: number = (memoStats as any)?.inbox_count ?? 0;

  return {
    chatUnread,
    memoUnread,
    total: chatUnread + memoUnread,
  };
};
