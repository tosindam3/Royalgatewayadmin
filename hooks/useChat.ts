import { useQuery, useMutation, useQueryClient, useInfiniteQuery } from '@tanstack/react-query';
import { useEffect } from 'react';
import { showSuccessToast, showErrorToast } from '../utils/toastUtils';
import { playMessageSentSound, playMessageReceivedSound } from '../utils/soundUtils';
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
      showSuccessToast('Channel created successfully');
    },
    onError: () => {
      showErrorToast('Failed to create channel');
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

export const useMessages = (channelId: number | null) => {
  const queryClient = useQueryClient();

  const query = useInfiniteQuery({
    queryKey: ['messages', channelId],
    queryFn: async ({ pageParam = 1 }) => {
      const res: any = await chatApi.getMessages(channelId!, { page: pageParam as number, per_page: 50 });
      // apiClient unwraps {status,data,meta} — paginator puts items in data and meta separately.
      // Normalize so page.data is always the items array and page.meta has pagination info.
      if (Array.isArray(res)) {
        // Already unwrapped to items array — meta was stripped; treat as single page
        return { data: res, meta: { current_page: 1, last_page: 1, per_page: 50, total: res.length } };
      }
      // Has data + meta at top level (apiClient returned the full unwrapped object)
      if (res && Array.isArray(res.data)) {
        return res;
      }
      return { data: [], meta: { current_page: 1, last_page: 1, per_page: 50, total: 0 } };
    },
    initialPageParam: 1,
    getNextPageParam: (lastPage: any) => {
      const currentPage = lastPage?.meta?.current_page ?? lastPage?.current_page;
      const lastPageNum = lastPage?.meta?.last_page ?? lastPage?.last_page;
      return currentPage < lastPageNum ? currentPage + 1 : undefined;
    },
    enabled: !!channelId,
    staleTime: 60000,
    gcTime: 300000,
  });

  useEffect(() => {
    if (!channelId) return;

    const token = localStorage.getItem('royalgateway_auth_token');
    const echo = initEcho(token);

    if (!echo) return;

    const channel = echo.private(`chat.channel.${channelId}`)
      .error((error: any) => {
        console.error('Echo subscription error:', error);
        showErrorToast('Real-time connection lost. Attempting to reconnect...');
      })
      .listen('.message.sent', (data: any) => {
        playMessageReceivedSound();
        
        queryClient.setQueryData(['messages', channelId], (oldData: any) => {
          if (!oldData) return oldData;
          
          // Check if message already exists (real id match or sender already has it optimistically)
          const currentUser = JSON.parse(localStorage.getItem('royalgateway_user') || '{}');
          const isSelf = data.user_id === currentUser.id;

          const exists = oldData.pages.some((page: any) => 
            page.data.some((msg: any) => msg.id === data.id)
          );

          if (isSelf) {
            // Replace the optimistic message with the confirmed server message
            return {
              ...oldData,
              pages: oldData.pages.map((page: any) => ({
                ...page,
                data: page.data.map((msg: any) =>
                  msg._optimistic ? data : msg
                ),
              })),
            };
          }

          if (exists) return oldData;

          // Add to the first page for other users
          const newPages = [...oldData.pages];
          newPages[0] = {
            ...newPages[0],
            data: [data, ...newPages[0].data]
          };

          return {
            ...oldData,
            pages: newPages
          };
        });
        queryClient.invalidateQueries({ queryKey: ['channels'] });
      })
      .listen('.message.updated', (data: any) => {
        queryClient.setQueryData(['messages', channelId], (oldData: any) => {
          if (!oldData) return oldData;
          return {
            ...oldData,
            pages: oldData.pages.map((page: any) => ({
              ...page,
              data: page.data.map((msg: Message) =>
                msg.id === data.id ? { ...msg, ...data } : msg
              )
            }))
          };
        });
      })
      .listen('.message.deleted', (data: any) => {
        queryClient.setQueryData(['messages', channelId], (oldData: any) => {
          if (!oldData) return oldData;
          return {
            ...oldData,
            pages: oldData.pages.map((page: any) => ({
              ...page,
              data: page.data.filter((msg: Message) => msg.id !== data.messageId)
            }))
          };
        });
      })
      .listen('.message.read', (data: any) => {
        queryClient.setQueryData(['messages', channelId], (oldData: any) => {
          if (!oldData) return oldData;
          return {
            ...oldData,
            pages: oldData.pages.map((page: any) => ({
              ...page,
              data: page.data.map((msg: Message) => {
                if (msg.id === data.messageId) {
                  const reads = msg.reads || [];
                  if (!reads.some((r: any) => r.user_id === data.userId)) {
                    return { ...msg, reads: [...reads, { user_id: data.userId }] };
                  }
                }
                return msg;
              })
            }))
          };
        });
        queryClient.invalidateQueries({ queryKey: ['channels'] });
      })
      .listen('.reaction.added', (data: any) => {
        queryClient.invalidateQueries({ queryKey: ['messages', channelId] });
      })
      .listen('.reaction.removed', (data: any) => {
        queryClient.invalidateQueries({ queryKey: ['messages', channelId] });
      })
      .listen('.typing.updated', (data: any) => {
        // Never show the current user as typing to themselves
        const currentUser = JSON.parse(localStorage.getItem('royalgateway_user') || '{}');
        if (data.user?.id === currentUser.id) return;

        queryClient.setQueryData(['typing', channelId], (oldData: any) => {
          const users = Array.isArray(oldData) ? oldData : [];
          const exists = users.some((u: any) => u.id === data.user.id);
          if (exists) return users;
          return [...users, data.user];
        });

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

  }, [channelId, queryClient]);

  return query;
};

export const useSendMessage = (channelId: number) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: SendMessageRequest) => chatApi.sendMessage(channelId, data),
    onMutate: async (data) => {
      // Cancel any outgoing refetches
      await queryClient.cancelQueries({ queryKey: ['messages', channelId] });

      // Snapshot previous state for rollback
      const previousMessages = queryClient.getQueryData(['messages', channelId]);

      // Build optimistic message
      const currentUser = JSON.parse(localStorage.getItem('royalgateway_user') || '{}');
      const optimisticMessage = {
        id: Date.now(), // temp id
        channel_id: channelId,
        user_id: currentUser.id,
        content: data.content,
        type: data.type || 'text',
        is_edited: false,
        is_deleted: false,
        parent_message_id: data.parent_message_id || null,
        user: { id: currentUser.id, name: currentUser.name || currentUser.display_name },
        attachments: [],
        reactions: [],
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        _optimistic: true,
      };

      // Inject into first page immediately
      queryClient.setQueryData(['messages', channelId], (oldData: any) => {
        if (!oldData) return oldData;
        const newPages = [...oldData.pages];
        newPages[0] = {
          ...newPages[0],
          data: [optimisticMessage, ...newPages[0].data],
        };
        return { ...oldData, pages: newPages };
      });

      // Clear typing indicator for self immediately
      queryClient.setQueryData(['typing', channelId], (oldData: any) => {
        if (!Array.isArray(oldData)) return [];
        return oldData.filter((u: any) => u.id !== currentUser.id);
      });

      return { previousMessages };
    },
    onSuccess: (newMessage, _vars, context) => {
      playMessageSentSound();
      // Replace optimistic message with real one from server
      queryClient.setQueryData(['messages', channelId], (oldData: any) => {
        if (!oldData) return oldData;
        return {
          ...oldData,
          pages: oldData.pages.map((page: any) => ({
            ...page,
            data: page.data.map((msg: any) =>
              msg._optimistic ? newMessage : msg
            ),
          })),
        };
      });
    },
    onError: (error: any, _vars, context) => {
      // Roll back optimistic update
      if (context?.previousMessages) {
        queryClient.setQueryData(['messages', channelId], context.previousMessages);
      }
      const message = error.response?.data?.message || 'Failed to send message';
      showErrorToast(message);
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
      showSuccessToast('Message updated');
    },
    onError: () => {
      showErrorToast('Failed to update message');
    },
  });
};

export const useDeleteMessage = (channelId: number) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (messageId: number) => chatApi.deleteMessage(channelId, messageId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['messages', channelId] });
      showSuccessToast('Message deleted');
    },
    onError: () => {
      showErrorToast('Failed to delete message');
    },
  });
};

// ==================== REACTIONS ====================

export const useAddReaction = (channelId: number) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ messageId, emoji }: { messageId: number; emoji: string }) =>
      chatApi.addReaction(channelId, messageId, { emoji }),
    onSuccess: (_, { messageId, emoji }) => {
      // Optimistically update message reactions
      queryClient.setQueryData(['messages', channelId, 1], (oldData: any) => {
        if (!oldData) return oldData;
        return {
          ...oldData,
          data: oldData.data.map((msg: any) => {
            if (msg.id === messageId) {
              const reactions = msg.reactions || [];
              return { ...msg, reactions: [...reactions, { emoji, user_id: 1 }] };
            }
            return msg;
          })
        };
      });
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
      showSuccessToast('Keyword blocked successfully');
    },
    onError: () => {
      showErrorToast('Failed to block keyword');
    },
  });
};

export const useDeleteBlockedKeyword = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (keywordId: number) => chatApi.deleteBlockedKeyword(keywordId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['blocked-keywords'] });
      showSuccessToast('Keyword removed');
    },
    onError: () => {
      showErrorToast('Failed to remove keyword');
    },
  });
};
