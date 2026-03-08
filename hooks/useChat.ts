import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useEffect } from 'react';
import { toast } from 'sonner';
import chatApi from '../services/chatApi';
import { initEcho } from '../utils/echo';
import {
  Channel,
  Message,
  CreateChannelRequest,
  SendMessageRequest,
  UpdateMessageRequest,
  AddReactionRequest,
} from '../types/chat';

// ==================== CHANNELS ====================

export const useChannels = (type?: 'public' | 'private' | 'direct') => {
  return useQuery({
    queryKey: ['channels', type],
    queryFn: () => chatApi.getChannels({ type }),
    staleTime: 30000, // 30 seconds
  });
};

export const useChannel = (channelId: number | null) => {
  return useQuery({
    queryKey: ['channel', channelId],
    queryFn: () => chatApi.getChannel(channelId!),
    enabled: !!channelId,
  });
};

export const useCreateChannel = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateChannelRequest) => chatApi.createChannel(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['channels'] });
      toast.success('Channel created successfully');
    },
    onError: () => {
      toast.error('Failed to create channel');
    },
  });
};

export const useTogglePin = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (channelId: number) => chatApi.togglePin(channelId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['channels'] });
    },
  });
};

export const useToggleMute = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (channelId: number) => chatApi.toggleMute(channelId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['channels'] });
    },
  });
};

export const useMarkAsRead = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (channelId: number) => chatApi.markAsRead(channelId),
    onSuccess: (_, channelId) => {
      queryClient.invalidateQueries({ queryKey: ['channels'] });
      queryClient.invalidateQueries({ queryKey: ['channel', channelId] });
    },
  });
};

// ==================== MESSAGES ====================

export const useMessages = (channelId: number | null, page: number = 1) => {
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ['messages', channelId, page],
    queryFn: () => chatApi.getMessages(channelId!, { page, per_page: 50 }),
    enabled: !!channelId,
    staleTime: Infinity, // Rely on real-time updates
  });

  useEffect(() => {
    if (!channelId) return;

    const token = localStorage.getItem('royalgateway_auth_token');
    const echo = initEcho(token);

    if (!echo) return;

    const channel = echo.private(`chat.channel.${channelId}`)
      .listen('.message.sent', (data: any) => {
        // Optimistically or reactively update the cache
        queryClient.setQueryData(['messages', channelId, page], (oldData: any) => {
          if (!oldData) return oldData;
          return {
            ...oldData,
            data: [data, ...oldData.data]
          };
        });
        queryClient.invalidateQueries({ queryKey: ['channels'] });
      })
      .listen('.message.updated', (data: any) => {
        queryClient.setQueryData(['messages', channelId, page], (oldData: any) => {
          if (!oldData) return oldData;
          return {
            ...oldData,
            data: oldData.data.map((msg: Message) =>
              msg.id === data.id ? { ...msg, ...data } : msg
            )
          };
        });
      })
      .listen('.message.deleted', (data: any) => {
        queryClient.setQueryData(['messages', channelId, page], (oldData: any) => {
          if (!oldData) return oldData;
          return {
            ...oldData,
            data: oldData.data.filter((msg: Message) => msg.id !== data.messageId)
          };
        });
      })
      .listen('.reaction.added', (data: any) => {
        queryClient.invalidateQueries({ queryKey: ['messages', channelId] });
      })
      .listen('.reaction.removed', (data: any) => {
        queryClient.invalidateQueries({ queryKey: ['messages', channelId] });
      })
      .listen('.typing.updated', (data: any) => {
        queryClient.setQueryData(['typing', channelId], (oldData: any) => {
          const users = Array.isArray(oldData) ? oldData : [];
          const exists = users.some((u: any) => u.id === data.user.id);
          if (exists) return users;
          return [...users, data.user];
        });

        // Auto-remove after 5 seconds
        setTimeout(() => {
          queryClient.setQueryData(['typing', channelId], (oldData: any) => {
            if (!Array.isArray(oldData)) return [];
            return oldData.filter((u: any) => u.id !== data.user.id);
          });
        }, 5000);
      });

    return () => {
      echo.leave(`chat.channel.${channelId}`);
    };
  }, [channelId, queryClient, page]);

  return query;
};

export const useSendMessage = (channelId: number) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: SendMessageRequest) => chatApi.sendMessage(channelId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['messages', channelId] });
      queryClient.invalidateQueries({ queryKey: ['channels'] });
    },
    onError: (error: any) => {
      const message = error.response?.data?.message || 'Failed to send message';
      toast.error(message);
    },
  });
};

export const useUpdateMessage = (channelId: number) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ messageId, data }: { messageId: number; data: UpdateMessageRequest }) =>
      chatApi.updateMessage(channelId, messageId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['messages', channelId] });
      toast.success('Message updated');
    },
    onError: () => {
      toast.error('Failed to update message');
    },
  });
};

export const useDeleteMessage = (channelId: number) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (messageId: number) => chatApi.deleteMessage(channelId, messageId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['messages', channelId] });
      toast.success('Message deleted');
    },
    onError: () => {
      toast.error('Failed to delete message');
    },
  });
};

// ==================== REACTIONS ====================

export const useAddReaction = (channelId: number) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ messageId, emoji }: { messageId: number; emoji: string }) =>
      chatApi.addReaction(channelId, messageId, { emoji }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['messages', channelId] });
    },
  });
};

export const useRemoveReaction = (channelId: number) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ messageId, emoji }: { messageId: number; emoji: string }) =>
      chatApi.removeReaction(channelId, messageId, emoji),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['messages', channelId] });
    },
  });
};

// ==================== TYPING INDICATORS ====================

export const useTypingIndicator = (channelId: number | null) => {
  return useQuery({
    queryKey: ['typing', channelId],
    queryFn: () => chatApi.getTypingUsers(channelId!),
    enabled: !!channelId,
    staleTime: Infinity,
  });
};

export const useSetTyping = () => {
  return useMutation({
    mutationFn: (channelId: number) => chatApi.setTyping(channelId),
  });
};

// ==================== PRESENCE ====================
export const useOnlineUsers = () => {
  const queryClient = useQueryClient();

  return useQuery({
    queryKey: ['online-users'],
    queryFn: () => {
      // This is primarily managed by Echo, but we can initialize with current members if needed
      return [];
    },
    staleTime: Infinity,
  });
};

export const usePresence = () => {
  const queryClient = useQueryClient();

  useEffect(() => {
    const token = localStorage.getItem('royalgateway_auth_token');
    const echo = initEcho(token);

    if (!echo) return;

    const channel = echo.join('chat.presence')
      .here((users: any) => {
        queryClient.setQueryData(['online-users'], users);
      })
      .joining((user: any) => {
        queryClient.setQueryData(['online-users'], (old: any[] = []) => [...old, user]);
      })
      .leaving((user: any) => {
        queryClient.setQueryData(['online-users'], (old: any[] = []) =>
          old.filter(u => u.id !== user.id)
        );
      });

    return () => {
      echo.leave('chat.presence');
    };
  }, [queryClient]);
};

// ==================== ADMIN ====================

export const useChatAnalytics = () => {
  return useQuery({
    queryKey: ['chat-analytics'],
    queryFn: () => chatApi.getAnalytics(),
    staleTime: 60000, // 1 minute
  });
};

export const useMessageActivity = (days: number = 7) => {
  return useQuery({
    queryKey: ['message-activity', days],
    queryFn: () => chatApi.getMessageActivity(days),
    staleTime: 60000,
  });
};

export const useBlockedKeywords = () => {
  return useQuery({
    queryKey: ['blocked-keywords'],
    queryFn: () => chatApi.getBlockedKeywords(),
  });
};

export const useAddBlockedKeyword = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: chatApi.addBlockedKeyword,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['blocked-keywords'] });
      toast.success('Keyword blocked successfully');
    },
    onError: () => {
      toast.error('Failed to block keyword');
    },
  });
};

export const useDeleteBlockedKeyword = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (keywordId: number) => chatApi.deleteBlockedKeyword(keywordId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['blocked-keywords'] });
      toast.success('Keyword removed');
    },
    onError: () => {
      toast.error('Failed to remove keyword');
    },
  });
};
