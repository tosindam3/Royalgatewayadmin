
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

const ChatInterface: React.FC = () => {
  const [selectedChannelId, setSelectedChannelId] = useState<number | null>(null);
  const [messageInput, setMessageInput] = useState('');
  const [sidebarSearchTerm, setSidebarSearchTerm] = useState('');
  const [channelSearchTerm, setChannelSearchTerm] = useState('');
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isNewChatModalOpen, setIsNewChatModalOpen] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const queryClient = useQueryClient();

  // Initialize Presence
  usePresence();
  const { data: onlineUsers = [] } = useOnlineUsers();

  const { data: channels = [], isLoading: channelsLoading } = useChannels();
  const { data: messagesData, isLoading: messagesLoading } = useMessages(selectedChannelId);
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
  const messages = messagesData?.data || [];

  // Auto-select first channel
  useEffect(() => {
    if (!selectedChannelId && channels.length > 0) {
      setSelectedChannelId(channels[0].id);
    }
  }, [channels, selectedChannelId]);

  // Scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Mark as read when channel changes
  useEffect(() => {
    if (selectedChannelId) {
      markAsReadMutation.mutate(selectedChannelId);
    }
  }, [selectedChannelId]);

  const handleSendMessage = async (content: string, files?: File[]) => {
    if (!content.trim() && (!files || files.length === 0)) return;
    if (!selectedChannelId) return;

    await sendMessageMutation.mutateAsync({
      content: content,
      type: files && files.length > 0 ? 'file' : 'text',
      attachments: files,
    });
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

  const safeChannels = Array.isArray(channels) ? channels : [];
  const safeMessages = Array.isArray(messages) ? messages : [];

  const filteredMessages = safeMessages.filter(msg =>
    !channelSearchTerm ||
    msg?.content?.toLowerCase().includes(channelSearchTerm.toLowerCase())
  );

  console.log('[Diagnostic] channels:', channels);
  console.log('[Diagnostic] messagesData:', messagesData);
  console.log('[Diagnostic] messages:', messages);
  console.log('[Diagnostic] onlineUsers:', onlineUsers);
  console.log('[Diagnostic] typingUsers:', typingUsers);

  return (
    <div className="flex h-full gap-6 animate-in fade-in duration-500">
      {/* Chat Sidebar */}
      <div className="w-80 flex flex-col gap-4">
        <div className="relative">
          <input
            type="text"
            placeholder="Search or start a new chat..."
            value={sidebarSearchTerm}
            onChange={(e) => setSidebarSearchTerm(e.target.value)}
            className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-xs text-white outline-none focus:border-[#8252e9]/50 transition-all"
          />
        </div>

        {/* New Chat Button */}
        <button
          onClick={() => setIsNewChatModalOpen(true)}
          className="w-full px-4 py-3 gradient-bg text-white rounded-xl text-xs font-black uppercase tracking-widest shadow-lg shadow-purple-500/20 hover:scale-105 active:scale-95 transition-all flex items-center justify-center gap-2 cursor-pointer"
          type="button"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          New Chat
        </button>

        <div className="flex-1 overflow-y-auto no-scrollbar space-y-6">
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
                        onClick={() => setSelectedChannelId(channel.id)}
                        className={`w-full flex gap-3 p-3 rounded-2xl transition-all text-left group ${selectedChannelId === channel.id ? 'bg-white/10 border border-white/5' : 'hover:bg-white/[0.02]'}`}
                      >
                        <div className="relative shrink-0">
                          <div className="w-10 h-10 rounded-xl border border-white/10 bg-gradient-to-br from-purple-500/20 to-blue-500/20 flex items-center justify-center relative">
                            <span className="text-lg">{channel.type === 'direct' ? '👤' : '#'}</span>
                            {channel.type === 'direct' && onlineUsers.some(u => channel.name.includes(u.name)) && (
                              <div className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 bg-green-500 border border-[#0f172a] rounded-full" />
                            )}
                          </div>
                          {channel.unread_count > 0 && (
                            <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-[#8252e9] border-2 border-[#0f172a] rounded-full flex items-center justify-center">
                              <span className="text-[8px] font-bold text-white">{channel.unread_count}</span>
                            </div>
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex justify-between items-baseline">
                            <p className="text-xs font-black text-white truncate">{channel.name}</p>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handlePinChannel(channel.id);
                              }}
                              className="text-[8px] text-yellow-500"
                            >
                              📌
                            </button>
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
                        onClick={() => setSelectedChannelId(channel.id)}
                        className={`w-full flex gap-3 p-3 rounded-2xl transition-all text-left ${selectedChannelId === channel.id ? 'bg-white/10 border border-white/5' : 'hover:bg-white/[0.02]'}`}
                      >
                        <div className="w-10 h-10 rounded-xl border border-white/10 bg-gradient-to-br from-slate-500/20 to-slate-600/20 flex items-center justify-center opacity-60">
                          <span className="text-lg">{channel.type === 'direct' ? '👤' : '#'}</span>
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex justify-between items-baseline">
                            <p className="text-xs font-black text-slate-400 truncate">{channel.name}</p>
                            {channel.unread_count > 0 && (
                              <span className="text-[8px] text-[#8252e9] font-bold">{channel.unread_count}</span>
                            )}
                          </div>
                          <p className="text-[10px] text-slate-600 truncate mt-0.5">
                            {channel.description || `${channel.members?.length || 0} members`}
                          </p>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* Main Chat Window */}
      <div className="flex-1 flex flex-col bg-white/[0.02] border border-white/5 rounded-[32px] overflow-hidden">
        {selectedChannel ? (
          <>
            {/* Chat Header */}
            <div className="p-6 bg-gradient-to-r from-[#8252e9]/10 to-transparent border-b border-white/5 flex justify-between items-center">
              <div className="flex items-center gap-4">
                <div className="relative">
                  <div className="w-10 h-10 rounded-xl border-2 border-[#8252e9]/30 bg-gradient-to-br from-purple-500/20 to-blue-500/20 flex items-center justify-center">
                    <span className="text-lg">{selectedChannel.type === 'direct' ? '👤' : '#'}</span>
                  </div>
                  {/* Presence indicator for direct chats */}
                  {selectedChannel.type === 'direct' && onlineUsers.some(u => selectedChannel.name.includes(u.name)) && (
                    <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-green-500 border-2 border-[#0f172a] rounded-full shadow-lg shadow-green-500/50" />
                  )}
                </div>
                <div>
                  <h4 className="text-sm font-black text-white">{selectedChannel.name}</h4>
                  <div className="flex items-center gap-2">
                    <p className="text-[9px] text-slate-500 font-bold uppercase tracking-widest">
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
              <div className="flex items-center gap-4">
                <div className="relative flex items-center">
                  {isSearchOpen && (
                    <input
                      autoFocus
                      type="text"
                      placeholder="Search in channel..."
                      value={channelSearchTerm}
                      onChange={(e) => setChannelSearchTerm(e.target.value)}
                      className="mr-3 w-48 bg-white/10 border border-white/20 rounded-lg px-3 py-1.5 text-[10px] text-white outline-none focus:border-[#8252e9] transition-all animate-in slide-in-from-right-2 fade-in"
                    />
                  )}
                  <button
                    onClick={() => {
                      setIsSearchOpen(!isSearchOpen);
                      if (isSearchOpen) setChannelSearchTerm('');
                    }}
                    className={`p-2.5 rounded-xl transition-all ${isSearchOpen ? 'bg-purple-500/20 text-white' : 'bg-white/5 text-slate-400 hover:text-white'}`}
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" strokeWidth="2" /></svg>
                  </button>
                </div>
                <button
                  onClick={() => handlePinChannel(selectedChannel.id)}
                  className="p-2.5 bg-white/5 rounded-xl text-slate-400 hover:text-white transition-all"
                >
                  📌
                </button>
              </div>
            </div>

            {/* Message Feed */}
            <div className="flex-1 overflow-y-auto p-8 space-y-6 no-scrollbar bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] bg-repeat opacity-90">
              {messagesLoading ? (
                <div className="text-center text-slate-500 py-8">Loading messages...</div>
              ) : filteredMessages.length === 0 ? (
                <div className="text-center text-slate-500 py-8">
                  {channelSearchTerm ? `No messages found matching "${channelSearchTerm}"` : 'No messages yet. Start the conversation!'}
                </div>
              ) : (
                filteredMessages.map((message) => (
                  <div key={message.id} className={`flex gap-4 group relative ${message.user_id === 1 ? 'flex-row-reverse' : ''}`}>
                    {message.user_id !== 1 && (
                      <div className="w-8 h-8 rounded-full border border-white/10 bg-gradient-to-br from-purple-500/20 to-blue-500/20 flex items-center justify-center self-end shrink-0">
                        <span className="text-xs">{message.user?.name?.charAt(0) || '?'}</span>
                      </div>
                    )}
                    <div className={`flex-1 max-w-[70%] space-y-2 ${message.user_id === 1 ? 'flex flex-col items-end' : ''}`}>
                      <div className={`${message.user_id === 1 ? 'gradient-bg text-white' : 'bg-white/5 border border-white/5 text-white'} p-3.5 px-5 rounded-[24px] ${message.user_id === 1 ? 'rounded-br-none' : 'rounded-bl-none'} shadow-xl`}>
                        {message.user_id !== 1 && (
                          <p className="text-[9px] font-bold text-[#8252e9] mb-1">{message.user?.name}</p>
                        )}
                        <div
                          className="text-xs font-medium prose prose-invert prose-xs max-w-none"
                          dangerouslySetInnerHTML={{ __html: message.content }}
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
                                {emoji} {count}
                              </button>
                            ))}
                          </div>
                        )}

                        {/* Hover Actions */}
                        <div className={`absolute top-0 ${message.user_id === 1 ? 'right-full mr-2' : 'left-full ml-2'} opacity-0 group-hover:opacity-100 transition-opacity flex gap-1 bg-white/10 backdrop-blur-sm rounded-lg p-1 border border-white/10`}>
                          <button
                            onClick={() => handleReaction(message.id, '👍')}
                            className="p-1 hover:bg-white/10 rounded" title="Like">👍</button>
                          {message.user_id === 1 && (
                            <>
                              <button
                                onClick={() => {
                                  const newContent = prompt('Edit message:', message.content);
                                  if (newContent) updateMessageMutation.mutate({ messageId: message.id, data: { content: newContent } });
                                }}
                                className="p-1 hover:bg-white/10 rounded" title="Edit">✏️</button>
                              <button
                                onClick={() => {
                                  if (confirm('Delete this message?')) deleteMessageMutation.mutate(message.id);
                                }}
                                className="p-1 hover:bg-white/10 rounded text-red-400" title="Delete">🗑️</button>
                            </>
                          )}
                        </div>
                      </div>
                      <span className="text-[8px] font-black text-slate-600 uppercase tracking-widest px-2 group-hover:text-slate-400">
                        {formatTime(message.created_at)}
                        {message.is_edited && ' (edited)'}
                      </span>
                    </div>
                  </div>
                ))
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Input Area */}
            <div className="p-6 bg-slate-50 dark:bg-black/10 border-t border-slate-200 dark:border-white/5">
              <RichTextEditor
                onSend={handleSendMessage}
                onTyping={handleTyping}
                placeholder={`Message ${selectedChannel.name}...`}
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
