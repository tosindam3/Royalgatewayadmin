
import React, { useState, useCallback } from 'react';
import { useTheme } from '../contexts/ThemeContext';
import { Memo, MemoFilters } from '../types/memo';
import { useMemos } from '../hooks/useMemos';
import { MemoListSkeleton, MemoDetailSkeleton, StatsSkeleton } from '../components/memo/MemoSkeletons';
import { MemoErrorBoundary } from '../components/memo/MemoErrorBoundary';
import MemoCompose from '../components/memo/MemoCompose';
import { CHAT_LOG } from '../constants/chatData';

const MemoSystem: React.FC = () => {
  const { theme } = useTheme();
  const [selectedFolder, setSelectedFolder] = useState('inbox');
  const [searchQuery, setSearchQuery] = useState('');
  const [filters, setFilters] = useState<MemoFilters>({ folder: 'inbox' });
  const [isComposeOpen, setIsComposeOpen] = useState(false);
  const [composeMode, setComposeMode] = useState<'compose' | 'reply' | 'forward'>('compose');
  const [quickReplyBody, setQuickReplyBody] = useState('');
  const [activeMenu, setActiveMenu] = useState<string | null>(null);

  const {
    memos,
    stats,
    folders,
    loading,
    error,
    selectedMemoId,
    setSelectedMemoId,
    searchMemos,
    markAsRead,
    toggleStar,
    deleteMemo,
    createMemo,
    replyToMemo,
    forwardMemo,
    refreshSelectedMemo
  } = useMemos(filters);

  const isDark = theme === 'dark';

  const handleFolderChange = useCallback((folder: string) => {
    setSelectedFolder(folder);
    setFilters(prev => ({ ...prev, folder }));
  }, []);

  const handleSearch = useCallback(async (query: string) => {
    setSearchQuery(query);
    await searchMemos(query);
  }, [searchMemos]);

  const handleMemoSelect = useCallback(async (memoId: number) => {
    setSelectedMemoId(memoId);
    // Mark as read when selected (only for received memos, not sent)
    const memo = memos.find(m => m.id === memoId);
    if (memo && memo.recipients?.some(r => !r.read_at) && selectedFolder !== 'sent') {
      await markAsRead(memoId);
    }
    // Fetch full detail with thread
    await refreshSelectedMemo();
  }, [memos, setSelectedMemoId, markAsRead, refreshSelectedMemo, selectedFolder]);

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60);

    if (diffInHours < 24) {
      return date.toLocaleTimeString('en-US', {
        hour: 'numeric',
        minute: '2-digit',
        hour12: true
      });
    } else if (diffInHours < 48) {
      return 'Yesterday';
    } else {
      return date.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric'
      });
    }
  };

  const getSelectedMemo = useCallback((): Memo | undefined => {
    return memos.find(memo => memo.id === selectedMemoId);
  }, [memos, selectedMemoId]);

  const handleReply = useCallback(() => {
    setComposeMode('reply');
    setIsComposeOpen(true);
  }, []);

  const handleForward = useCallback(() => {
    setComposeMode('forward');
    setIsComposeOpen(true);
  }, []);

  const handleQuickReply = useCallback(async () => {
    if (!selectedMemoId || !quickReplyBody.trim()) return;
    try {
      await replyToMemo(selectedMemoId, { body: quickReplyBody, reply_all: false });
      setQuickReplyBody('');
      // Refresh thread history
      await refreshSelectedMemo();
    } catch (err) {
      console.error('Failed to send quick reply', err);
    }
  }, [selectedMemoId, quickReplyBody, replyToMemo, refreshSelectedMemo]);

  const systemFolders = [
    { slug: 'inbox', label: 'Inbox', icon: '📥', count: stats?.inbox_count || 0 },
    { slug: 'starred', label: 'Starred', icon: '⭐', count: stats?.starred_count || 0 },
    { slug: 'sent', label: 'Sent', icon: '📤', count: stats?.sent_count || 0 },
    { slug: 'drafts', label: 'Drafts', icon: '📝', count: stats?.drafts_count || 0 },
    { slug: 'scheduled', label: 'Scheduled', icon: '📅', count: 0 },
    { slug: 'trash', label: 'Trash', icon: '🗑️', count: 0 },
  ];

  const selectedMemo = getSelectedMemo();

  // Show error state
  if (error) {
    return (
      <MemoErrorBoundary isDark={isDark}>
        <div className={`h-[calc(100vh-140px)] flex items-center justify-center rounded-[32px] border ${isDark
          ? 'bg-[#0f172a] border-white/5 text-white'
          : 'bg-white border-gray-200 text-gray-900'
          }`}>
          <div className="text-center space-y-4">
            <div className={`w-16 h-16 mx-auto rounded-full flex items-center justify-center ${isDark ? 'bg-red-500/10 text-red-400' : 'bg-red-50 text-red-500'
              }`}>
              <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"
                  d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div>
              <h3 className="text-lg font-semibold mb-2">Failed to load memos</h3>
              <p className={`text-sm ${isDark ? 'text-slate-400' : 'text-gray-600'}`}>
                {error}
              </p>
            </div>
            <button
              onClick={() => window.location.reload()}
              className={`px-4 py-2 rounded-xl text-sm font-medium transition-colors ${isDark
                ? 'bg-white/10 hover:bg-white/20 text-white border border-white/20'
                : 'bg-gray-100 hover:bg-gray-200 text-gray-900 border border-gray-200'
                }`}
            >
              Try Again
            </button>
          </div>
        </div>
      </MemoErrorBoundary>
    );
  }

  return (
    <MemoErrorBoundary isDark={isDark}>
      <div className={`h-[calc(100vh-140px)] flex rounded-[32px] overflow-hidden border animate-in fade-in duration-700 ${isDark
        ? 'bg-[#0f172a] border-white/5'
        : 'bg-white border-gray-200'
        }`}>
        {/* Left Sidebar: Filters */}
        <aside className={`w-56 border-r flex flex-col p-6 space-y-8 ${isDark
          ? 'bg-white/[0.02] border-white/5'
          : 'bg-gray-50 border-gray-200'
          }`}>
          <div className="space-y-4">
            <div className="relative">
              <svg className={`absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 ${isDark ? 'text-slate-500' : 'text-gray-400'
                }`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" strokeWidth="2.5" />
              </svg>
              <input
                type="text"
                placeholder="Search..."
                value={searchQuery}
                onChange={(e) => handleSearch(e.target.value)}
                className={`w-full border rounded-xl py-1.5 pl-9 pr-3 text-[11px] focus:outline-none transition-all ${isDark
                  ? 'bg-white/5 border-white/10 text-white focus:border-[#8252e9]/50'
                  : 'bg-white border-gray-300 text-gray-900 focus:border-blue-500'
                  }`}
              />
            </div>
            <nav className="space-y-1">
              {systemFolders.map((folder) => (
                <button
                  key={folder.slug}
                  onClick={() => handleFolderChange(folder.slug)}
                  className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-[11px] font-black uppercase tracking-widest transition-all ${selectedFolder === folder.slug
                    ? isDark
                      ? 'bg-[#8252e9]/10 text-white'
                      : 'bg-blue-100 text-blue-900'
                    : isDark
                      ? 'text-slate-500 hover:bg-white/5 hover:text-slate-300'
                      : 'text-gray-500 hover:bg-gray-100 hover:text-gray-700'
                    }`}
                >
                  <div className="flex items-center gap-3">
                    <span className="text-sm grayscale opacity-60">{folder.icon}</span>
                    {folder.label}
                  </div>
                  {folder.count > 0 && (
                    <span className={`text-white text-[9px] px-1.5 py-0.5 rounded-md ${isDark ? 'bg-[#4c49d8]' : 'bg-blue-500'
                      }`}>
                      {folder.count}
                    </span>
                  )}
                </button>
              ))}
            </nav>
          </div>
        </aside>

        {/* Middle Pane: Memo List */}
        <aside className={`w-[320px] border-r flex flex-col p-6 ${isDark
          ? 'bg-white/[0.01] border-white/5'
          : 'bg-gray-25 border-gray-200'
          }`}>
          <div className="flex items-center gap-2 mb-6">
            <button
              onClick={() => setIsComposeOpen(true)}
              className="flex-1 py-2.5 bg-[#f59e0b] hover:bg-[#d97706] text-white font-black text-[11px] uppercase tracking-widest rounded-xl shadow-lg shadow-orange-500/20 transition-all"
            >
              + New Memo
            </button>
            <div className="relative">
              <button
                onClick={() => setActiveMenu(activeMenu === 'global' ? null : 'global')}
                className={`p-2.5 border rounded-xl transition-all ${isDark
                  ? 'bg-white/5 border-white/10 text-slate-400 hover:text-white'
                  : 'bg-white border-gray-300 text-gray-400 hover:text-gray-600'
                  }`}>
                •••
              </button>
              {activeMenu === 'global' && (
                <div className={`absolute top-full right-0 mt-2 w-48 rounded-xl border shadow-2xl z-50 py-2 ${isDark ? 'bg-[#1e293b] border-white/10' : 'bg-white border-gray-200'}`}>
                  <button className={`w-full text-left px-4 py-2 text-[10px] font-bold uppercase tracking-widest ${isDark ? 'hover:bg-white/5 text-slate-300' : 'hover:bg-gray-50 text-gray-700'}`}>Mark All Read</button>
                  <button className={`w-full text-left px-4 py-2 text-[10px] font-bold uppercase tracking-widest ${isDark ? 'hover:bg-white/5 text-slate-300' : 'hover:bg-gray-50 text-gray-700'}`}>Archive All</button>
                </div>
              )}
            </div>
          </div>

          <div className="flex justify-between items-center mb-4 px-2">
            <div className="relative">
              <button
                onClick={() => setActiveMenu(activeMenu === 'folder' ? null : 'folder')}
                className={`text-[10px] font-black uppercase tracking-widest flex items-center gap-2 transition-colors hover:opacity-80 ${isDark ? 'text-slate-500' : 'text-gray-500'}`}>
                {selectedFolder} <svg className={`w-3 h-3 transition-transform ${activeMenu === 'folder' ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M19 9l-7 7-7-7" strokeWidth="2" /></svg>
              </button>
              {activeMenu === 'folder' && (
                <div className={`absolute top-full left-0 mt-2 w-40 rounded-xl border shadow-2xl z-50 py-2 ${isDark ? 'bg-[#1e293b] border-white/10' : 'bg-white border-gray-200'}`}>
                  <button className={`w-full text-left px-4 py-2 text-[10px] font-bold uppercase tracking-widest ${isDark ? 'hover:bg-white/5 text-slate-300' : 'hover:bg-gray-50 text-gray-700'}`}>Newest First</button>
                  <button className={`w-full text-left px-4 py-2 text-[10px] font-bold uppercase tracking-widest ${isDark ? 'hover:bg-white/5 text-slate-300' : 'hover:bg-gray-50 text-gray-700'}`}>Oldest First</button>
                  <button className={`w-full text-left px-4 py-2 text-[10px] font-bold uppercase tracking-widest ${isDark ? 'hover:bg-white/5 text-slate-300' : 'hover:bg-gray-50 text-gray-700'}`}>Unread Only</button>
                </div>
              )}
            </div>
            <div className="relative">
              <button
                onClick={() => setActiveMenu(activeMenu === 'filter' ? null : 'filter')}
                className={`transition-colors ${isDark ? 'text-slate-600 hover:text-white' : 'text-gray-400 hover:text-gray-600'}`}>
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M5 12h.01M12 12h.01M19 12h.01" strokeWidth="2" /></svg>
              </button>
              {activeMenu === 'filter' && (
                <div className={`absolute top-full right-0 mt-2 w-40 rounded-xl border shadow-2xl z-50 py-2 ${isDark ? 'bg-[#1e293b] border-white/10' : 'bg-white border-gray-200'}`}>
                  <button className={`w-full text-left px-4 py-2 text-[10px] font-bold uppercase tracking-widest ${isDark ? 'hover:bg-white/5 text-slate-300' : 'hover:bg-gray-50 text-gray-700'}`}>All Memos</button>
                  <button className={`w-full text-left px-4 py-2 text-[10px] font-bold uppercase tracking-widest ${isDark ? 'hover:bg-white/5 text-slate-300' : 'hover:bg-gray-50 text-gray-700'}`}>With Attachments</button>
                </div>
              )}
            </div>
          </div>

          <div className="flex-1 overflow-y-auto no-scrollbar space-y-1">
            {loading ? (
              <MemoListSkeleton isDark={isDark} />
            ) : memos.length === 0 ? (
              <div className={`text-center py-8 ${isDark ? 'text-slate-500' : 'text-gray-500'
                }`}>
                <div className={`w-16 h-16 mx-auto mb-4 rounded-full flex items-center justify-center ${isDark ? 'bg-white/5' : 'bg-gray-100'
                  }`}>
                  <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"
                      d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
                  </svg>
                </div>
                <p className="text-sm font-medium">No memos found</p>
                <p className="text-xs mt-1">
                  {searchQuery ? 'Try adjusting your search terms' : 'No memos in this folder'}
                </p>
              </div>
            ) : (
              memos.map((memo) => (
                <button
                  key={memo.id}
                  onClick={() => handleMemoSelect(memo.id)}
                  className={`w-full text-left p-4 rounded-[20px] transition-all group border-2 ${selectedMemoId === memo.id
                    ? isDark
                      ? 'bg-[#8252e9]/5 border-[#8252e9]/20'
                      : 'bg-blue-50 border-blue-200'
                    : isDark
                      ? 'hover:bg-white/[0.02] border-transparent'
                      : 'hover:bg-gray-50 border-transparent'
                    }`}
                >
                  <div className="flex justify-between items-start mb-2">
                    <div className="flex items-center gap-3">
                      <div className="relative">
                        <div className={`w-8 h-8 rounded-full border flex items-center justify-center text-xs font-bold ${isDark ? 'border-white/10 bg-white/5 text-white' : 'border-gray-200 bg-gray-100 text-gray-600'
                          }`}>
                          {memo.sender?.name?.charAt(0) || 'U'}
                        </div>
                        <div className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 bg-emerald-500 border-2 border-[#0f172a] rounded-full" />
                      </div>
                      <div>
                        <p className={`text-xs font-black tracking-tight ${selectedMemoId === memo.id
                          ? isDark ? 'text-white' : 'text-gray-900'
                          : isDark ? 'text-slate-300' : 'text-gray-700'
                          }`}>
                          {memo.sender?.name || 'Unknown'}
                        </p>
                        <p className={`text-[9px] font-bold uppercase ${isDark ? 'text-slate-500' : 'text-gray-400'
                          }`}>
                          {formatTime(memo.created_at)}
                        </p>
                      </div>
                    </div>
                  </div>
                  <p className={`text-[10px] font-black uppercase tracking-widest truncate mb-1 ${selectedMemoId === memo.id
                    ? isDark ? 'text-[#8252e9]' : 'text-blue-600'
                    : isDark ? 'text-slate-400' : 'text-gray-500'
                    }`}>
                    {memo.subject}
                  </p>
                  <p className={`text-[10px] truncate ${isDark ? 'text-slate-600' : 'text-gray-400'
                    }`}>
                    {memo.body_plain?.substring(0, 50) || 'No preview available'}...
                  </p>
                </button>
              ))
            )}
          </div>
        </aside>

        {/* Main Content: Memo Detail */}
        <main className={`flex-1 flex flex-col relative ${isDark ? 'bg-[#0f172a]' : 'bg-white'
          }`}>
          <div className={`p-8 border-b flex justify-between items-center ${isDark ? 'border-white/5' : 'border-gray-200'
            }`}>
            {selectedMemo ? (
              <h3 className={`text-xl font-black tracking-tight uppercase italic ${isDark ? 'text-white' : 'text-gray-900'
                }`}>
                {selectedMemo.subject}
              </h3>
            ) : (
              <h3 className={`text-xl font-black tracking-tight uppercase italic ${isDark ? 'text-white' : 'text-gray-900'
                }`}>
                Select a memo
              </h3>
            )}
            <div className="flex gap-2">
              <button
                onClick={handleReply}
                className={`px-4 py-2 border rounded-xl text-[10px] font-black uppercase tracking-widest flex items-center gap-2 transition-all ${isDark
                  ? 'bg-white/5 border-white/10 text-slate-400 hover:text-white hover:bg-white/10'
                  : 'bg-gray-50 border-gray-200 text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                  }`}>
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M3 10h10a8 8 0 018 8v2M3 10l5 5m-5-5l5-5" strokeWidth="2.5" /></svg> Reply
              </button>
              <button
                onClick={handleReply}
                className={`px-4 py-2 border rounded-xl text-[10px] font-black uppercase tracking-widest flex items-center gap-2 transition-all ${isDark
                  ? 'bg-white/5 border-white/10 text-slate-400 hover:text-white hover:bg-white/10'
                  : 'bg-gray-50 border-gray-200 text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                  }`}>
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M3 10h10a8 8 0 018 8v2M3 10l5 5m-5-5l5-5" strokeWidth="2.5" /></svg> Reply All
              </button>
              <button
                onClick={handleForward}
                className={`px-4 py-2 border rounded-xl text-[10px] font-black uppercase tracking-widest flex items-center gap-2 transition-all ${isDark
                  ? 'bg-white/5 border-white/10 text-slate-400 hover:text-white hover:bg-white/10'
                  : 'bg-gray-50 border-gray-200 text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                  }`}>
                Forward <svg className="w-3.5 h-3.5 transform rotate-180" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M3 10h10a8 8 0 018 8v2M3 10l5 5m-5-5l5-5" strokeWidth="2.5" /></svg>
              </button>
              <div className="relative">
                <button
                  onClick={() => setActiveMenu(activeMenu === 'detail' ? null : 'detail')}
                  className={`p-2 transition-colors ${isDark ? 'text-slate-600 hover:text-white' : 'text-gray-400 hover:text-gray-600'
                    }`}>
                  •••
                </button>
                {activeMenu === 'detail' && (
                  <div className={`absolute top-full right-0 mt-2 w-48 rounded-xl border shadow-2xl z-50 py-2 ${isDark ? 'bg-[#1e293b] border-white/10' : 'bg-white border-gray-200'}`}>
                    <button className={`w-full text-left px-4 py-2 text-[10px] font-bold uppercase tracking-widest ${isDark ? 'hover:bg-white/5 text-slate-300' : 'hover:bg-gray-50 text-gray-700'}`}>Archive Memo</button>
                    <button className={`w-full text-left px-4 py-2 text-[10px] font-bold uppercase tracking-widest ${isDark ? 'hover:bg-white/5 text-slate-300' : 'hover:bg-gray-50 text-gray-700'}`}>Move to Folder</button>
                    <button className={`w-full text-left px-4 py-2 text-[10px] font-bold uppercase tracking-widest ${isDark ? 'hover:bg-white/5 text-slate-300' : 'hover:bg-gray-50 text-gray-700'}`}>Print Memo</button>
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto no-scrollbar">
            {loading ? (
              <MemoDetailSkeleton isDark={isDark} />
            ) : !selectedMemo ? (
              <div className={`flex items-center justify-center h-full ${isDark ? 'text-slate-500' : 'text-gray-500'
                }`}>
                <div className="text-center space-y-4">
                  <div className={`w-20 h-20 mx-auto rounded-full flex items-center justify-center ${isDark ? 'bg-white/5' : 'bg-gray-100'
                    }`}>
                    <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"
                        d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
                    </svg>
                  </div>
                  <div>
                    <h3 className={`text-lg font-semibold mb-2 ${isDark ? 'text-white' : 'text-gray-900'
                      }`}>
                      No memo selected
                    </h3>
                    <p className="text-sm">
                      Choose a memo from the list to view its content
                    </p>
                  </div>
                </div>
              </div>
            ) : (
              <div className="p-12 space-y-10">
                {/* Memo Metadata */}
                <div className="flex justify-between items-start">
                  <div className="flex items-center gap-4">
                    <img
                      src={selectedMemo.sender?.avatar || `https://picsum.photos/64?sig=${selectedMemo.sender?.name || 'user'}`}
                      className={`w-12 h-12 rounded-[18px] border-2 ${isDark ? 'border-[#8252e9]/30' : 'border-blue-200'
                        }`}
                      alt={selectedMemo.sender?.name || 'User'}
                    />
                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className={`text-base font-black ${isDark ? 'text-white' : 'text-gray-900'
                          }`}>
                          {selectedMemo.sender?.name || 'Unknown Sender'}
                        </h4>
                        <span className={`text-[10px] font-black uppercase tracking-widest px-2 py-0.5 rounded ${isDark
                          ? 'text-slate-500 bg-white/5'
                          : 'text-gray-500 bg-gray-100'
                          }`}>
                          {selectedMemo.type}
                        </span>
                        <span className={`text-[10px] font-black uppercase tracking-widest px-2 py-0.5 rounded border ${selectedMemo.priority === 'high' || selectedMemo.priority === 'urgent'
                          ? isDark
                            ? 'text-red-400 bg-red-500/10 border-red-500/20'
                            : 'text-red-600 bg-red-50 border-red-200'
                          : isDark
                            ? 'text-blue-400 bg-blue-500/10 border-blue-500/20'
                            : 'text-blue-600 bg-blue-50 border-blue-200'
                          }`}>
                          {selectedMemo.priority}
                        </span>
                      </div>
                      <p className={`text-xs mt-1 ${isDark ? 'text-slate-500' : 'text-gray-600'
                        }`}>
                        To: <span className={`font-bold uppercase text-[10px] tracking-widest ${isDark ? 'text-slate-300' : 'text-gray-700'
                          }`}>
                          {selectedMemo.recipients?.filter(r => r.recipient_type === 'to')
                            .map(r => r.recipient?.name).join(', ') || 'Recipients'}
                        </span>
                      </p>
                      {selectedMemo.recipients?.some(r => r.recipient_type === 'cc') && (
                        <div className="flex items-center gap-2 mt-1">
                          <p className={`text-[10px] ${isDark ? 'text-slate-500' : 'text-gray-500'
                            }`}>
                            Cc: <span className={`font-mono italic ${isDark ? 'text-slate-400' : 'text-gray-600'
                              }`}>
                              {selectedMemo.recipients?.filter(r => r.recipient_type === 'cc')
                                .map(r => r.recipient?.email).join(', ')}
                            </span>
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                  <span className={`text-xs font-black tracking-widest uppercase ${isDark ? 'text-slate-600' : 'text-gray-500'
                    }`}>
                    {formatTime(selectedMemo.created_at)}
                  </span>
                </div>

                {/* Memo Body */}
                <div className="space-y-6 max-w-2xl">
                  <div
                    className={`prose max-w-none ${isDark ? 'prose-invert' : 'prose-gray'
                      }`}
                    dangerouslySetInnerHTML={{
                      __html: selectedMemo.body || selectedMemo.body_plain || 'No content available'
                    }}
                  />
                </div>

                {/* Attachments */}
                {selectedMemo.attachments && selectedMemo.attachments.length > 0 && (
                  <div className={`pt-8 border-t max-w-2xl ${isDark ? 'border-white/5' : 'border-gray-200'
                    }`}>
                    <h5 className={`text-sm font-bold mb-4 ${isDark ? 'text-white' : 'text-gray-900'
                      }`}>
                      Attachments ({selectedMemo.attachments.length})
                    </h5>
                    <div className="space-y-3">
                      {selectedMemo.attachments.map((attachment) => (
                        <div key={attachment.id} className={`p-4 border rounded-[24px] flex items-center gap-4 group hover:border-opacity-50 transition-all ${isDark
                          ? 'bg-white/5 border-white/10 hover:border-[#8252e9]/30'
                          : 'bg-gray-50 border-gray-200 hover:border-blue-300'
                          }`}>
                          <div className={`w-12 h-12 rounded-2xl flex items-center justify-center text-2xl group-hover:scale-110 transition-transform ${isDark ? 'bg-blue-500/20' : 'bg-blue-100'
                            }`}>
                            📄
                          </div>
                          <div className="flex-1">
                            <p className={`text-xs font-black uppercase tracking-tight ${isDark ? 'text-white' : 'text-gray-900'
                              }`}>
                              {attachment.original_filename}
                            </p>
                            <p className={`text-[10px] font-bold uppercase ${isDark ? 'text-slate-600' : 'text-gray-500'
                              }`}>
                              {(attachment.file_size / 1024 / 1024).toFixed(1)} MB
                            </p>
                          </div>
                          <div className="flex gap-3">
                            <a
                              href={`/api/v1/memos/attachments/${attachment.id}/download?token=${localStorage.getItem('royalgateway_auth_token')}`}
                              className={`text-[10px] font-black uppercase tracking-widest transition-colors ${isDark
                                ? 'text-slate-400 hover:text-[#8252e9]'
                                : 'text-gray-600 hover:text-blue-600'
                                }`}
                            >
                              Download
                            </a>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Action Buttons */}
                <div className={`flex gap-4 pt-12 border-t max-w-2xl ${isDark ? 'border-white/5' : 'border-gray-200'
                  }`}>
                  <button
                    onClick={handleReply}
                    className={`flex-1 py-3 border rounded-2xl text-[10px] font-black uppercase tracking-widest flex items-center justify-center gap-2 transition-all ${isDark
                      ? 'bg-white/5 border-white/10 text-slate-400 hover:text-white hover:bg-white/10'
                      : 'bg-gray-50 border-gray-200 text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                      }`}>
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M3 10h10a8 8 0 018 8v2M3 10l5 5m-5-5l5-5" strokeWidth="2" /></svg> Reply
                  </button>
                  <button
                    onClick={handleForward}
                    className={`flex-1 py-3 border rounded-2xl text-[10px] font-black uppercase tracking-widest flex items-center justify-center gap-2 transition-all ${isDark
                      ? 'bg-white/5 border-white/10 text-slate-400 hover:text-white hover:bg-white/10'
                      : 'bg-gray-50 border-gray-200 text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                      }`}>
                    Forward <svg className="w-4 h-4 transform rotate-180" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M3 10h10a8 8 0 018 8v2M3 10l5 5m-5-5l5-5" strokeWidth="2" /></svg>
                  </button>
                  <button
                    onClick={() => selectedMemo && toggleStar(selectedMemo.id)}
                    className={`px-4 py-3 border rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all ${selectedMemo?.recipients?.some(r => r.is_starred)
                      ? isDark
                        ? 'bg-yellow-500/10 border-yellow-500/20 text-yellow-400 hover:bg-yellow-500/20'
                        : 'bg-yellow-50 border-yellow-200 text-yellow-600 hover:bg-yellow-100'
                      : isDark
                        ? 'bg-white/5 border-white/10 text-slate-400 hover:text-white hover:bg-white/10'
                        : 'bg-gray-50 border-gray-200 text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                      }`}
                  >
                    ⭐
                  </button>
                  <button
                    onClick={() => selectedMemo && deleteMemo(selectedMemo.id)}
                    className={`px-4 py-3 border rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all ${isDark
                      ? 'bg-red-500/10 border-red-500/20 text-red-400 hover:bg-red-500/20'
                      : 'bg-red-50 border-red-200 text-red-600 hover:bg-red-100'
                      }`}
                  >
                    🗑️
                  </button>
                </div>
              </div>
            )}
          </div>
        </main>

        {/* Right Sidebar: Contextual Chat */}
        <aside className={`w-80 border-l flex flex-col p-6 space-y-6 ${isDark
          ? 'bg-white/[0.01] border-white/5'
          : 'bg-gray-50 border-gray-200'
          }`}>
          <div>
            <div className="flex justify-between items-center mb-4">
              <h3 className={`text-[11px] font-black uppercase tracking-widest ${isDark ? 'text-white' : 'text-gray-900'
                }`}>
                People <span className={`ml-1 ${isDark ? 'text-slate-500' : 'text-gray-500'
                  }`}>(5)</span>
              </h3>
              <button className={`transition-colors ${isDark ? 'text-slate-600 hover:text-white' : 'text-gray-400 hover:text-gray-600'
                }`}>
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path d="M15 13l-3 3m0 0l-3-3m3 3V8m0 13a9 9 0 110-18 9 9 0 010 18z" strokeWidth="2" />
                </svg>
              </button>
            </div>
            {selectedMemo?.sender && (
              <div className={`flex items-center gap-3 p-2 rounded-[20px] border relative group cursor-pointer ${isDark
                ? 'bg-white/5 border-white/5'
                : 'bg-white border-gray-200'
                }`}>
                <img
                  src={selectedMemo.sender.avatar || `https://picsum.photos/32?sig=${selectedMemo.sender.name}`}
                  className={`w-8 h-8 rounded-xl border ${isDark ? 'border-white/10' : 'border-gray-200'
                    }`}
                  alt={selectedMemo.sender.name}
                />
                <div className="flex-1">
                  <p className={`text-[11px] font-black uppercase ${isDark ? 'text-white' : 'text-gray-900'
                    }`}>
                    {selectedMemo.sender.name}
                  </p>
                  <p className={`text-[9px] font-bold uppercase ${isDark ? 'text-slate-500' : 'text-gray-500'
                    }`}>
                    Sender
                  </p>
                </div>
                <button className={`transition-colors ${isDark ? 'text-slate-600 hover:text-white' : 'text-gray-400 hover:text-gray-600'
                  }`}>⭐</button>
              </div>
            )}
          </div>

          <div className={`flex-1 flex flex-col min-h-0 border-t pt-6 ${isDark ? 'border-white/5' : 'border-gray-200'
            }`}>
            <div className="flex justify-between items-center mb-4 px-2">
              <h3 className={`text-[11px] font-black uppercase tracking-widest ${isDark ? 'text-white' : 'text-gray-900'
                }`}>Chat</h3>
              <div className="flex gap-2">
                <button className={`px-2 py-0.5 rounded text-[8px] font-black uppercase border ${isDark
                  ? 'bg-white/5 text-slate-500 border-white/10'
                  : 'bg-gray-100 text-gray-600 border-gray-200'
                  }`}>Unread</button>
                <button className={`px-2 py-0.5 rounded text-[8px] font-black uppercase border ${isDark
                  ? 'bg-rose-500/10 text-rose-500 border-rose-500/20'
                  : 'bg-red-50 text-red-600 border-red-200'
                  }`}>Delete</button>
                <button className={`transition-colors ${isDark ? 'text-slate-600 hover:text-white' : 'text-gray-400 hover:text-gray-600'
                  }`}>▾</button>
              </div>
            </div>

            <div className="mb-4">
              <p className={`text-[10px] font-black uppercase tracking-widest mb-3 flex items-center gap-2 ${isDark ? 'text-slate-500' : 'text-gray-500'
                }`}>
                Thread History ({selectedMemo?.thread?.memo_count || 0}) ▾
              </p>
              <div className="space-y-6 overflow-y-auto max-h-[400px] no-scrollbar pr-1">
                {(selectedMemo?.thread?.memos || []).length > 0 ? (selectedMemo?.thread?.memos || []).map((chat) => (
                  <div key={chat.id} className="group animate-in slide-in-from-right-2 duration-300">
                    <div className="flex items-center justify-between mb-1.5">
                      <div className="flex items-center gap-2">
                        <div className={`w-6 h-6 rounded-lg border flex items-center justify-center text-[10px] font-bold ${isDark ? 'bg-white/5 border-white/10 text-white' : 'bg-gray-100 border-gray-200 text-gray-600'}`}>
                          {chat.sender?.name?.charAt(0)}
                        </div>
                        <p className={`text-[10px] font-black uppercase tracking-tight ${isDark ? 'text-white' : 'text-gray-900'
                          }`}>
                          {chat.sender?.name}
                        </p>
                      </div>
                      <span className={`text-[9px] font-bold ${isDark ? 'text-slate-600' : 'text-gray-500'
                        }`}>
                        {formatTime(chat.created_at)}
                      </span>
                    </div>
                    <div className="pl-8 relative">
                      <p className={`text-[10px] font-medium leading-relaxed group-hover:text-opacity-80 transition-colors ${isDark ? 'text-slate-400 group-hover:text-slate-300' : 'text-gray-600 group-hover:text-gray-700'
                        }`}>
                        {chat.body_plain?.substring(0, 100)}...
                      </p>
                    </div>
                  </div>
                )) : (
                  <div className={`text-center py-4 ${isDark ? 'text-slate-600' : 'text-gray-400'} text-[10px]`}>
                    No thread history available
                  </div>
                )}
              </div>
            </div>

            <div className="mt-auto pt-6">
              <div className={`border rounded-2xl p-3 flex items-center gap-3 shadow-2xl focus-within:border-opacity-50 transition-all ${isDark
                ? 'bg-white/5 border-white/10 focus-within:border-[#8252e9]/50'
                : 'bg-white border-gray-200 focus-within:border-blue-300'
                }`}>
                <input
                  type="text"
                  value={quickReplyBody}
                  onChange={(e) => setQuickReplyBody(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleQuickReply()}
                  placeholder="Type a quick reply..."
                  className={`bg-transparent border-none text-[10px] flex-1 outline-none font-medium py-0.5 ${isDark
                    ? 'text-white placeholder-slate-600'
                    : 'text-gray-900 placeholder-gray-500'
                    }`}
                />
                <button
                  onClick={handleQuickReply}
                  className={`p-1.5 rounded-lg transition-all ${isDark
                    ? 'text-[#8252e9] hover:bg-[#8252e9]/10'
                    : 'text-blue-600 hover:bg-blue-50'
                    }`}>
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path d="M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </button>
              </div>
              <div className="flex items-center justify-between mt-3 px-1">
                <div className="flex gap-1.5">
                  <button className={`transition-colors ${isDark ? 'text-slate-600 hover:text-white' : 'text-gray-400 hover:text-gray-600'
                    }`}>
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" strokeWidth="2.5" />
                    </svg>
                  </button>
                </div>
                <button className={`transition-colors ${isDark ? 'text-slate-600 hover:text-white' : 'text-gray-400 hover:text-gray-600'
                  }`}>
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" strokeWidth="2" />
                    <path d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" strokeWidth="2" />
                  </svg>
                </button>
              </div>
            </div>
          </div>
        </aside>
      </div>

      <MemoCompose
        isOpen={isComposeOpen}
        onClose={() => setIsComposeOpen(false)}
        onSubmit={(data) => {
          if (composeMode === 'reply' && selectedMemoId) return replyToMemo(selectedMemoId, data);
          if (composeMode === 'forward' && selectedMemoId) return forwardMemo(selectedMemoId, data);
          return createMemo(data);
        }}
        isDark={isDark}
        mode={composeMode}
        initialMemo={selectedMemo}
      />
    </MemoErrorBoundary>
  );
};

export default MemoSystem;
