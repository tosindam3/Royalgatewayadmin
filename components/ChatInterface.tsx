
import React, { useState, useEffect, useRef } from 'react';
import GlassCard from './GlassCard';
import NewChatModal from './NewChatModal';
import RichTextEditor from './chat/RichTextEditor';
import { useChannels, useMessages, useSendMessage, useUpdateMessage, useDeleteMessage, useAddReaction, useTogglePin, useMarkAsRead, useSetTyping, useTypingIndicator, usePresence, useOnlineUsers } from '../hooks/useChat';
import { Channel, Message } from '../types/chat';
import { format } from 'date-fns';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import chatApi from '../services/chatApi';
import { toast } from 'sonner';
import DOMPurify from 'dompurify';
import { useInView } from 'react-intersection-observer';
import CallModal from './chat/CallModal';
import PushService from '../services/PushService';
import ChatAdminDashboard from './chat/ChatAdminDashboard';
import { hasPermission } from '../utils/permissions';


const ChatInterface: React.FC = () => {
  const [selectedChannelId, setSelectedChannelId] = useState<number | null>(null);
  const [mobilePanelView, setMobilePanelView] = useState<'sidebar' | 'chat'>('sidebar');
  const [messageInput, setMessageInput] = useState('');
  const [sidebarSearchTerm, setSidebarSearchTerm] = useState('');
  const [channelSearchTerm, setChannelSearchTerm] = useState('');
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isNewChatModalOpen, setIsNewChatModalOpen] = useState(false);
  const [replyingTo, setReplyingTo] = useState<Message | null>(null);
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [globalSearchLoading, setGlobalSearchLoading] = useState(false);
  const [globalSearchResults, setGlobalSearchResults] = useState<any[]>([]);
  const [activeCall, setActiveCall] = useState<{ type: 'video' | 'voice', isOpen: boolean }>({ type: 'video', isOpen: false });
  const [isAdminDashboardOpen, setIsAdminDashboardOpen] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const queryClient = useQueryClient();

  // Infinite scroll trigger
  const { ref: loadMoreRef, inView } = useInView({
    threshold: 0,
  });

  // Get current user ID from localStorage
  const currentUser = JSON.parse(localStorage.getItem('royalgateway_user') || '{}');
  const currentUserId = currentUser.id;

  // Initialize Presence
  usePresence();
  const { data: onlineUsers = [] } = useOnlineUsers();

  const { data: channels = [], isLoading: channelsLoading } = useChannels();
  const { 
    data: messagesData, 
    isLoading: messagesLoading,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage
  } = useMessages(selectedChannelId);
  const { data: typingUsers = [] } = useTypingIndicator(selectedChannelId);

  const sendMessageMutation = useSendMessage(selectedChannelId!);
  const updateMessageMutation = useUpdateMessage(selectedChannelId!);
  const deleteMessageMutation = useDeleteMessage(selectedChannelId!);
  const addReactionMutation = useAddReaction(selectedChannelId!);
  const togglePinMutation = useTogglePin();
  const markAsReadMutation = useMarkAsRead();
  const setTypingMutation = useSetTyping();

  // Create channel mutation
  const createChannelMutation = useMutation({
    mutationFn: (data: any) => chatApi.createChannel(data),
    onSuccess: (newChannel) => {
      queryClient.invalidateQueries({ queryKey: ['channels'] });
      setSelectedChannelId(newChannel.id);
      toast.success('Channel created successfully!');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to create channel');
    },
  });

  const selectedChannel = channels.find(c => c.id === selectedChannelId);
  const isAdminOrOwner = selectedChannel?.member_role === 'owner' || selectedChannel?.member_role === 'admin';
  
  // Flatten messages from pages and reverse for display (oldest at top, newest at bottom)
  const messages = messagesData?.pages.flatMap(page => page.data) || [];
  const displayMessages = [...messages].reverse();

  const handleSelectChannel = (id: number) => {
    setSelectedChannelId(id);
    setMobilePanelView('chat');
  };

  // Auto-select first channel (desktop only — don't force mobile into chat view)
  useEffect(() => {
    if (!selectedChannelId && channels.length > 0) {
      setSelectedChannelId(channels[0].id);
    }
  }, [channels, selectedChannelId]);

  // Scroll to bottom on initial load or new messages
  useEffect(() => {
    // Only auto-scroll to bottom if we are on the first page of messages
    // This prevents jumping when loading older messages
    if (messages.length > 0 && messages.length <= 50) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages.length]);

  // Load more messages when scrolling to top
  useEffect(() => {
    if (inView && hasNextPage && !isFetchingNextPage) {
      fetchNextPage();
    }
  }, [inView, hasNextPage, isFetchingNextPage, fetchNextPage]);

  // Initialize Push Notifications
  useEffect(() => {
    PushService.register();
  }, []);

  // Trigger browser notification on new message if tab is blurred
  const lastMessageRef = useRef<Message | null>(null);
  useEffect(() => {
    if (messages.length > 0) {
      const latestMessage = messages[messages.length - 1];

      if (
        document.hidden &&
        Notification.permission === 'granted' &&
        latestMessage.id !== lastMessageRef.current?.id &&
        latestMessage.user_id !== currentUserId &&
        latestMessage.channel_id === selectedChannelId
      ) {
        new Notification(`New message in ${selectedChannel?.name || 'chat'}`, {
          body: latestMessage.content,
          icon: '/logo192.png' // Replace with your actual icon path
        });
      }
      lastMessageRef.current = latestMessage;
    }
  }, [messages, currentUserId, selectedChannelId, selectedChannel]);

  // Handle online/offline status
  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Mark as read when channel changes
  useEffect(() => {
    if (selectedChannelId) {
      markAsReadMutation.mutate(selectedChannelId);
    }
  }, [selectedChannelId]);

  const handleSendMessage = async (content: string, files?: File[]) => {
    if (!content.trim() && (!files || files.length === 0)) return;
    if (!selectedChannelId) return;

    // Clear typing timeout immediately
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
      typingTimeoutRef.current = null;
    }

    await sendMessageMutation.mutateAsync({
      content: content,
      type: files && files.length > 0 ? 'file' : 'text',
      attachments: files,
      parent_message_id: replyingTo?.id,
    });

    setReplyingTo(null);
  };

  const handleTyping = () => {
    if (!selectedChannelId) return;

    // Clear existing timeout
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    // Set typing indicator
    setTypingMutation.mutate(selectedChannelId);

    // Clear after 3 seconds
    typingTimeoutRef.current = setTimeout(() => {
      // Typing indicator expires automatically on backend
    }, 3000);
  };

  const handleGlobalSearch = async (term: string) => {
    setSidebarSearchTerm(term);
    if (!term.trim()) {
      setGlobalSearchResults([]);
      return;
    }

    setGlobalSearchLoading(true);
    try {
      const results = await chatApi.globalSearch(term);
      setGlobalSearchResults(results.data || []);
    } catch (error) {
      console.error('Global search error:', error);
    } finally {
      setGlobalSearchLoading(false);
    }
  };

  const handleReaction = (messageId: number, emoji: string) => {
    addReactionMutation.mutate({ messageId, emoji });
  };

  const handlePinChannel = (channelId: number) => {
    togglePinMutation.mutate(channelId);
  };

  const formatTime = (dateString: string) => {
    try {
      return format(new Date(dateString), 'h:mm a');
    } catch {
      return '';
    }
  };

  const highlightText = (text: string, highlight: string) => {
    if (!highlight.trim()) return text;
    const regex = new RegExp(`(${highlight})`, 'gi');
    return text.replace(regex, '<mark class="bg-yellow-500/40 text-white rounded px-0.5 border border-yellow-500/20">$1</mark>');
  };

  const safeChannels = Array.isArray(channels) ? channels : [];
  const safeMessages = Array.isArray(displayMessages) ? displayMessages : [];

  const filteredMessages = safeMessages.filter(msg =>
    !channelSearchTerm ||
    msg?.content?.toLowerCase().includes(channelSearchTerm.toLowerCase())
  );

  console.log('[Diagnostic] channels:', channels);
  console.log('[Diagnostic] messagesData:', messagesData);
  console.log('[Diagnostic] messages:', messages);

  return (
    <div className="flex h-full gap-3 md:gap-6 animate-in fade-in duration-500 flex-col md:flex-row overflow-hidden pb-1 max-w-full">
      {/* Chat Sidebar */}
      <div className={`${mobilePanelView === 'chat' ? 'hidden md:flex' : 'flex'} w-full md:w-72 lg:w-80 flex-col gap-4 min-h-0 min-w-0 shrink-0 h-full`}>
        <div className="relative shrink-0">
          <input
            type="text"
            placeholder="Search messages everywhere..."
            value={sidebarSearchTerm}
            onChange={(e) => handleGlobalSearch(e.target.value)}
            className="w-full bg-slate-200/50 dark:bg-white/5 border border-slate-300/50 dark:border-white/10 rounded-xl px-4 py-3 text-xs text-slate-900 dark:text-white outline-none focus:border-[#8252e9]/50 transition-all font-medium placeholder:text-slate-500"
          />
          {globalSearchLoading && (
            <div className="absolute right-3 top-3">
              <div className="w-4 h-4 border-2 border-[#8252e9]/50 border-t-[#8252e9] rounded-full animate-spin" />
            </div>
          )}
        </div>

        {/* New Chat Button */}
        <button
          onClick={() => setIsNewChatModalOpen(true)}
          className="w-full px-4 py-3.5 gradient-bg text-white rounded-xl text-[10px] font-black uppercase tracking-widest shadow-lg shadow-purple-500/20 hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center gap-2 cursor-pointer shrink-0"
          type="button"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          New Chat
        </button>

        {/* Channels List - Scrollable */}
        <div className="flex-1 overflow-y-auto custom-scrollbar space-y-2 pr-1">
          {/* Public Channels */}
          {sidebarSearchTerm.trim() && (
            <div>
              <p className="text-[10px] font-black text-[#8252e9] uppercase tracking-widest mb-3 px-2">Global Search</p>
              <div className="space-y-2">
                {globalSearchResults.length === 0 && !globalSearchLoading ? (
                  <p className="text-[10px] text-slate-500 px-2 italic">No messages found matching "{sidebarSearchTerm}"</p>
                ) : (
                  globalSearchResults.map((msg: any) => (
                    <button
                      key={msg.id}
                      onClick={() => {
                        handleSelectChannel(msg.channel_id);
                        setSidebarSearchTerm('');
                        setGlobalSearchResults([]);
                      }}
                      className="w-full p-3 rounded-2xl bg-slate-100 dark:bg-white/[0.03] border border-slate-200 dark:border-white/5 hover:bg-slate-200 dark:hover:bg-white/10 transition-all text-left group"
                    >
                      <div className="flex justify-between items-start mb-1">
                        <p className="text-[10px] font-bold text-[#8252e9]">#{msg.channel?.name}</p>
                        <p className="text-[8px] text-slate-500 font-bold uppercase">{formatTime(msg.created_at)}</p>
                      </div>
                      <p className="text-[11px] text-slate-900 dark:text-white line-clamp-2" dangerouslySetInnerHTML={{ __html: msg.content }} />
                      <p className="text-[8px] text-slate-500 font-bold mt-1 uppercase tracking-tighter">by {msg.user?.name}</p>
                    </button>
                  ))
                )}
              </div>
            </div>
          )}

          {channelsLoading ? (
            <div className="text-center text-slate-500 py-8">Loading channels...</div>
          ) : (
            <>
              {(safeChannels.filter(c => c.is_pinned && c.name?.toLowerCase().includes(sidebarSearchTerm.toLowerCase())).length > 0) && (
                <div>
                  <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-3 px-2">Pinned</p>
                  <div className="space-y-1">
                    {safeChannels.filter(c => c.is_pinned && c.name?.toLowerCase().includes(sidebarSearchTerm.toLowerCase())).map((channel) => (
                      <button
                        key={channel.id}
                        onClick={() => handleSelectChannel(channel.id)}
                        className={`w-full flex gap-3 p-3 rounded-2xl transition-all text-left group ${selectedChannelId === channel.id ? 'bg-slate-200 dark:bg-[#8252e9]/10 border border-slate-300 dark:border-[#8252e9]/30' : 'hover:bg-slate-100 dark:hover:bg-white/[0.02]'}`}
                      >
                        <div className="relative shrink-0">
                          <div className="w-10 h-10 rounded-xl border border-slate-200 dark:border-white/10 bg-gradient-to-br from-purple-500/10 to-blue-500/10 dark:from-purple-500/20 dark:to-blue-500/20 flex items-center justify-center relative">
                            <span className="text-lg">{channel.type === 'direct' ? '👤' : '#'}</span>
                            {channel.type === 'direct' && onlineUsers.some(u => channel.name.includes(u.name)) && (
                              <div className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 bg-green-500 border border-white dark:border-[#0f172a] rounded-full" />
                            )}
                          </div>
                          {channel.unread_count > 0 && (
                            <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-[#8252e9] border-2 border-white dark:border-[#0f172a] rounded-full flex items-center justify-center">
                              <span className="text-[8px] font-bold text-white">{channel.unread_count}</span>
                            </div>
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex justify-between items-baseline">
                            <p className="text-xs font-black text-slate-900 dark:text-white truncate">{channel.name}</p>
                            {isAdminOrOwner && (
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handlePinChannel(channel.id);
                                }}
                                className="text-[8px] text-yellow-500"
                              >
                                📌
                              </button>
                            )}
                          </div>
                          <p className="text-[10px] text-slate-500 truncate mt-0.5">
                            {channel.description || `${channel.members?.length || 0} members`}
                          </p>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {(safeChannels.filter(c => !c.is_pinned && c.name?.toLowerCase().includes(sidebarSearchTerm.toLowerCase())).length > 0) && (
                <div>
                  <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-3 px-2">Recent</p>
                  <div className="space-y-1">
                    {safeChannels.filter(c => !c.is_pinned && c.name?.toLowerCase().includes(sidebarSearchTerm.toLowerCase())).map((channel) => (
                      <button
                        key={channel.id}
                        onClick={() => handleSelectChannel(channel.id)}
                        className={`w-full flex gap-3 p-3 rounded-2xl transition-all text-left ${selectedChannelId === channel.id ? 'bg-slate-200 dark:bg-[#8252e9]/10 border border-slate-300 dark:border-[#8252e9]/30' : 'hover:bg-slate-100 dark:hover:bg-white/[0.02]'}`}
                      >
                        <div className="w-10 h-10 rounded-xl border border-white/10 bg-gradient-to-br from-slate-500/20 to-slate-600/20 flex items-center justify-center opacity-60">
                          <span className="text-lg">{channel.type === 'direct' ? '👤' : '#'}</span>
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex justify-between items-baseline">
                            <p className="text-xs font-black text-slate-800 dark:text-slate-400 truncate">{channel.name}</p>
                            {channel.unread_count > 0 && (
                              <span className="text-[8px] text-[#8252e9] font-bold">{channel.unread_count}</span>
                            )}
                          </div>
                          <p className="text-[10px] text-slate-500 dark:text-slate-600 truncate mt-0.5">
                            {channel.description || `${channel.members?.length || 0} members`}
                          </p>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {onlineUsers.length > 0 && (
                <div>
                  <p className="text-[10px] font-black text-green-500 uppercase tracking-widest mb-3 px-2">Online ({onlineUsers.length})</p>
                  <div className="flex flex-wrap gap-2 px-2">
                    {onlineUsers.map((user: any) => (
                      <div key={user.id} className="relative group" title={user.name}>
                        <div className="w-8 h-8 rounded-full border border-green-500/30 bg-gradient-to-br from-green-500/10 to-blue-500/10 flex items-center justify-center overflow-hidden">
                          {user.avatar ? (
                            <img src={user.avatar} alt={user.name} className="w-full h-full object-cover" />
                          ) : (
                            <span className="text-[10px] text-green-500 uppercase font-black">{user.name.charAt(0)}</span>
                          )}
                        </div>
                        <div className="absolute -bottom-0.5 -right-0.5 w-2 h-2 bg-green-500 border border-[#0f172a] rounded-full" />
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* Main Chat Window */}
      <div className={`${mobilePanelView === 'sidebar' ? 'hidden md:flex' : 'flex'} flex-1 flex-col min-h-0 min-w-0 bg-white dark:bg-white/[0.02] border border-slate-200 dark:border-white/5 rounded-none md:rounded-[32px] overflow-hidden relative shadow-xl shadow-slate-200/50 dark:shadow-none translate-z-0`}>
        {!isOnline && (
          <div className="absolute top-0 left-0 right-0 bg-red-500/90 text-white text-[10px] font-black uppercase tracking-widest py-1 text-center z-50 backdrop-blur-sm">
            Connection Lost - You are currently offline
          </div>
        )}
        {selectedChannel ? (
          <>
            {/* Chat Header */}
            <div className="shrink-0 p-3 md:p-6 bg-slate-50/80 dark:bg-[#1a1625]/80 backdrop-blur-md border-b border-slate-200 dark:border-white/5 flex justify-between items-center z-20">
              <div className="flex items-center gap-2 md:gap-4 min-w-0">
                {/* Back button — mobile only */}
                <button
                  onClick={() => setMobilePanelView('sidebar')}
                  className="md:hidden p-2 rounded-xl bg-slate-100 dark:bg-white/5 text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-all shrink-0"
                  aria-label="Back to channels"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                  </svg>
                </button>
                <div className="relative">
                  <div className="w-10 h-10 rounded-xl border-2 border-[#8252e9]/30 bg-gradient-to-br from-purple-500/20 to-blue-500/20 flex items-center justify-center">
                    <span className="text-lg">{selectedChannel.type === 'direct' ? '👤' : '#'}</span>
                  </div>
                  {/* Presence indicator for direct chats */}
                  {selectedChannel.type === 'direct' && onlineUsers.some(u => selectedChannel.name.includes(u.name)) && (
                    <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-green-500 border-2 border-white dark:border-[#1a1625] rounded-full shadow-lg shadow-green-500/50" />
                  )}
                 </div>
                <div className="flex-1 min-w-0">
                  <h4 className="text-sm font-black text-slate-900 dark:text-white truncate">{selectedChannel.name}</h4>
                  <div className="flex items-center gap-2">
                    <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest whitespace-nowrap">
                      {selectedChannel.members?.length || 0} members
                    </p>
                    {typingUsers.length > 0 && (
                      <p className="text-[9px] text-purple-400 font-bold animate-pulse">
                        • {typingUsers.map(u => u.name).join(', ')} typing...
                      </p>
                    )}
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-1 md:gap-4 shrink-0">
                <div className="relative flex items-center">
                  {isSearchOpen && (
                    <input
                      autoFocus
                      type="text"
                      placeholder="Search in channel..."
                      value={channelSearchTerm}
                      onChange={(e) => setChannelSearchTerm(e.target.value)}
                      className="mr-2 md:mr-3 w-24 sm:w-36 md:w-48 bg-slate-100 dark:bg-white/10 border border-slate-200 dark:border-white/20 rounded-lg px-3 py-1.5 text-[10px] text-slate-900 dark:text-white outline-none focus:border-[#8252e9] transition-all animate-in slide-in-from-right-2 fade-in"
                    />
                  )}
                  <button
                    onClick={() => {
                      setIsSearchOpen(!isSearchOpen);
                      if (isSearchOpen) setChannelSearchTerm('');
                    }}
                    className={`p-2.5 rounded-xl transition-all ${isSearchOpen ? 'bg-purple-500/20 text-[#8252e9] dark:text-white' : 'bg-slate-100 dark:bg-white/5 text-slate-400 hover:text-slate-900 dark:hover:text-white'}`}
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" strokeWidth="2" /></svg>
                  </button>
                </div>
                
                {/* Admin Dashboard Action */}
                {hasPermission(currentUser, 'chat.admin') && (
                  <button
                    onClick={() => setIsAdminDashboardOpen(true)}
                    className="hidden sm:block p-2.5 bg-purple-500/10 dark:bg-gradient-to-br dark:from-purple-500/20 dark:to-blue-500/20 border border-purple-500/20 dark:border-purple-500/30 rounded-xl text-purple-600 dark:text-purple-400 hover:bg-purple-500/20 dark:hover:text-white transition-all shadow-sm"
                    title="Admin Dashboard"
                  >
                    📊
                  </button>
                )}
                
                {/* Call Actions */}
                <div className="hidden sm:flex items-center gap-2">
                  <button
                    onClick={() => setActiveCall({ type: 'voice', isOpen: true })}
                    className="p-2.5 bg-slate-100 dark:bg-white/5 rounded-xl text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-all"
                    title="Voice Call"
                  >
                    📞
                  </button>
                  <button
                    onClick={() => setActiveCall({ type: 'video', isOpen: true })}
                    className="p-2.5 bg-slate-100 dark:bg-white/5 rounded-xl text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-all"
                    title="Video Call"
                  >
                    📹
                  </button>
                </div>

                 {isAdminOrOwner && (
                  <button
                    onClick={() => handlePinChannel(selectedChannel.id)}
                    className="hidden sm:block p-2.5 bg-slate-100 dark:bg-white/5 rounded-xl text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-all"
                  >
                    📌
                  </button>
                )}
              </div>
            </div>

            {/* Message Feed */}
            <div className="flex-1 overflow-y-auto p-4 md:p-8 space-y-6 custom-scrollbar chat-scroll-lock bg-slate-50/50 dark:bg-[#0d0a1a]/50 dark:bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] dark:bg-repeat dark:opacity-90">
              {/* Load More Trigger */}
              <div ref={loadMoreRef} className="h-4 flex items-center justify-center pt-2">
                {isFetchingNextPage && <div className="text-[10px] text-slate-500 animate-pulse font-bold tracking-widest uppercase">Loading history...</div>}
              </div>

              {messagesLoading ? (
                <div className="text-center text-slate-500 py-8">Loading messages...</div>
              ) : filteredMessages.length === 0 ? (
                <div className="text-center text-slate-500 py-8">
                  {channelSearchTerm ? `No messages found matching "${channelSearchTerm}"` : 'No messages yet. Start the conversation!'}
                </div>
              ) : (
                filteredMessages.map((message) => {
                  const isCurrentUser = message.user_id === currentUserId;
                  return (
                  <div key={message.id} className={`flex gap-2.5 group relative ${isCurrentUser ? 'flex-row-reverse' : ''}`}>
                    {!isCurrentUser && (
                      <div className="w-8 h-8 rounded-xl border border-slate-200 dark:border-white/10 bg-gradient-to-br from-[#8252e9]/10 to-blue-500/10 dark:from-[#8252e9]/20 dark:to-blue-500/20 flex items-center justify-center self-end shrink-0 shadow-sm">
                        <span className="text-[10px] font-black text-[#8252e9] dark:text-white">{message.user?.name?.charAt(0) || '?'}</span>
                       </div>
                    )}
                    <div className={`flex-1 min-w-0 max-w-[92%] md:max-w-[80%] space-y-1 ${isCurrentUser ? 'flex flex-col items-end' : ''}`}>
                      <div className={`${isCurrentUser ? 'gradient-bg text-white' : 'bg-slate-100 dark:bg-[#1a1625] border border-slate-200 dark:border-white/10 text-slate-900 dark:text-white'} p-2.5 md:p-4 px-3.5 md:px-5 rounded-[22px] ${isCurrentUser ? 'rounded-tr-none' : 'rounded-tl-none'} shadow-sm transition-all hover:shadow-md relative overflow-hidden`}>
                        {!isCurrentUser && (
                          <p className="text-[10px] font-bold text-[#8252e9] mb-1 opacity-80">{message.user?.name}</p>
                        )}
                        {message.parentMessage && (
                          <div className="mb-2 p-2 bg-black/20 rounded-lg border-l-2 border-purple-500 overflow-hidden">
                            <p className="text-[8px] font-black uppercase tracking-widest text-purple-400 mb-0.5">Replying to {message.parentMessage.user?.name}</p>
                            <p className="text-[10px] text-slate-400 line-clamp-1 italic">{message.parentMessage.content.replace(/<[^>]*>/g, '')}</p>
                          </div>
                        )}
                        <div
                          className="text-xs font-medium prose prose-invert prose-xs max-w-none"
                          dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(highlightText(message.content, channelSearchTerm)) }}
                        />

                        {message.attachments && message.attachments.length > 0 && (
                          <div className="mt-2 space-y-2">
                            {message.attachments.map((att) => (
                              <div key={att.id} className="flex items-center gap-3 p-2 bg-[#0f172a]/40 rounded-xl border border-white/5">
                                <div className="w-8 h-8 bg-blue-500/20 rounded flex items-center justify-center text-xs">📄</div>
                                <div className="flex-1 min-w-0">
                                  <p className="text-[10px] font-bold truncate">{att.file_name}</p>
                                  <p className="text-[8px] text-slate-500 font-bold uppercase">{att.formatted_size || `${(att.file_size / 1024).toFixed(2)} KB`}</p>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                        {message.reactions && message.reactions.length > 0 && (
                          <div className="flex gap-1 mt-2 flex-wrap">
                            {Object.entries(
                              message.reactions.reduce((acc, r) => {
                                acc[r.emoji] = (acc[r.emoji] || 0) + 1;
                                return acc;
                              }, {} as Record<string, number>)
                            ).map(([emoji, count]) => (
                              <button
                                key={emoji}
                                onClick={() => handleReaction(message.id, emoji)}
                                className="px-2 py-0.5 bg-white/10 rounded-full text-[10px] hover:bg-white/20 transition-all"
                              >
                                {emoji} {count as number}
                              </button>
                            ))}
                          </div>
                        )}

                        {/* Hover Actions - Now Inside Bubble */}
                        <div className={`absolute top-0 right-0 h-full flex items-center opacity-0 group-hover:opacity-100 group-focus-within:opacity-100 active:opacity-100 transition-opacity px-2 bg-gradient-to-l ${isCurrentUser ? 'from-purple-600 to-transparent' : 'from-slate-200 dark:from-slate-800 to-transparent'} z-10`}>
                          <div className="flex gap-1 bg-white/90 dark:bg-slate-900/90 backdrop-blur-md rounded-lg p-1 border border-slate-200 dark:border-white/10 shadow-xl">
                            <button
                              onClick={() => setReplyingTo(message)}
                              className="p-1 px-1.5 hover:bg-slate-100 dark:hover:bg-white/10 rounded transition-colors" title="Reply">↩️</button>
                            <button
                              onClick={() => handleReaction(message.id, '👍')}
                              className="p-1 px-1.5 hover:bg-slate-100 dark:hover:bg-white/10 rounded transition-colors" title="Like">👍</button>
                            {isCurrentUser && (
                              <>
                                <button
                                  onClick={() => {
                                    const newContent = prompt('Edit message:', message.content);
                                    if (newContent) updateMessageMutation.mutate({ messageId: message.id, data: { content: newContent } });
                                  }}
                                  className="p-1 px-1.5 hover:bg-slate-100 dark:hover:bg-white/10 rounded transition-colors" title="Edit">✏️</button>
                                <button
                                  onClick={() => {
                                    if (confirm('Delete this message?')) deleteMessageMutation.mutate(message.id);
                                  }}
                                  className="p-1 px-1.5 hover:bg-slate-100 dark:hover:bg-white/10 rounded text-red-400 transition-colors" title="Delete">🗑️</button>
                              </>
                            )}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-[8px] font-black text-slate-600 uppercase tracking-widest px-2 group-hover:text-slate-400">
                          {formatTime(message.created_at)}
                          {message.is_edited && ' (edited)'}
                        </span>
                        
                        {isCurrentUser && (
                          <div className="flex items-center gap-0.5" title={message.reads && message.reads.length > 0 ? `Read by ${message.reads.length} people` : 'Sent'}>
                            {message.reads && message.reads.length > 0 ? (
                              <span className="text-[10px] text-blue-500 font-bold">✓✓</span>
                            ) : (
                              <span className="text-[10px] text-slate-500 font-bold">✓</span>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                  );
                })
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Input Area */}
            <div className="p-3 md:p-6 bg-slate-50 dark:bg-black/10 border-t border-slate-200 dark:border-white/5 chat-input-area safe-area-bottom">
              <RichTextEditor
                onSend={handleSendMessage}
                onTyping={handleTyping}
                placeholder={`Message ${selectedChannel.name}...`}
                replyingTo={replyingTo}
                onCancelReply={() => setReplyingTo(null)}
              />
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center text-slate-500">
            <div className="text-center">
              <div className="text-6xl mb-4">💬</div>
              <p className="text-lg font-bold">Select a channel to start chatting</p>
            </div>
          </div>
        )}
      </div>

      {/* Call Modal */}
      {selectedChannel && (
        <CallModal
          isOpen={activeCall.isOpen}
          onClose={() => setActiveCall(p => ({ ...p, isOpen: false }))}
          channelName={selectedChannel.name}
          channelId={selectedChannel.id}
          callType={activeCall.type}
        />
      )}

      {/* Chat Admin Dashboard Modal */}
      {isAdminDashboardOpen && (
        <ChatAdminDashboard onClose={() => setIsAdminDashboardOpen(false)} />
      )}

      {/* New Chat Modal */}
      <NewChatModal
        isOpen={isNewChatModalOpen}
        onClose={() => setIsNewChatModalOpen(false)}
        onCreateChannel={(data) => createChannelMutation.mutate(data)}
      />
    </div>
  );
};

export default ChatInterface;
