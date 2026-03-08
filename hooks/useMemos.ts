import { useState, useEffect, useCallback } from 'react';
import { Memo, MemoStats, MemoFolder, MemoFilters, PaginatedMemos } from '../types/memo';
import memoService from '../services/memoService';

interface UsMemosResult {
  memos: Memo[];
  stats: MemoStats | null;
  folders: MemoFolder[];
  loading: boolean;
  error: string | null;
  selectedMemoId: number | null;
  setSelectedMemoId: (id: number | null) => void;
  refreshMemos: () => Promise<void>;
  refreshSelectedMemo: () => Promise<void>;
  searchMemos: (query: string) => Promise<void>;
  markAsRead: (id: number) => Promise<void>;
  toggleStar: (id: number) => Promise<void>;
  deleteMemo: (id: number) => Promise<void>;
  createMemo: (data: any) => Promise<Memo>;
  replyToMemo: (id: number, data: any) => Promise<Memo>;
  forwardMemo: (id: number, data: any) => Promise<Memo>;
}

export const useMemos = (filters: MemoFilters = {}): UsMemosResult => {
  const [memos, setMemos] = useState<Memo[]>([]);
  const [stats, setStats] = useState<MemoStats | null>(null);
  const [folders, setFolders] = useState<MemoFolder[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedMemoId, setSelectedMemoId] = useState<number | null>(null);

  const loadMemoData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const [memosData, statsData, foldersData] = await Promise.all([
        memoService.getMemos(filters),
        memoService.getStats(),
        memoService.getFolders()
      ]);

      setMemos(memosData.data);
      setStats(statsData);
      setFolders(foldersData);

      // Auto-select first memo if none selected
      if (memosData.data.length > 0 && !selectedMemoId) {
        setSelectedMemoId(memosData.data[0].id);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load memo data');
      console.error('Failed to load memo data:', err);
    } finally {
      setLoading(false);
    }
  }, [filters, selectedMemoId]);

  const searchMemos = useCallback(async (query: string) => {
    if (!query.trim()) {
      await loadMemoData();
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const results = await memoService.searchMemos(query);
      setMemos(results);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Search failed');
      console.error('Search failed:', err);
    } finally {
      setLoading(false);
    }
  }, [loadMemoData]);

  const markAsRead = useCallback(async (id: number) => {
    try {
      await memoService.markAsRead(id);
      // Update local state optimistically
      setMemos(prev => prev.map(memo =>
        memo.id === id
          ? { ...memo, recipients: memo.recipients?.map(r => ({ ...r, read_at: new Date().toISOString() })) }
          : memo
      ));
      // Refresh stats
      const newStats = await memoService.getStats();
      setStats(newStats);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to mark as read');
      console.error('Failed to mark as read:', err);
    }
  }, []);

  const toggleStar = useCallback(async (id: number) => {
    try {
      const result = await memoService.toggleStar(id);
      // Update local state optimistically
      setMemos(prev => prev.map(memo =>
        memo.id === id
          ? { ...memo, recipients: memo.recipients?.map(r => ({ ...r, is_starred: result.is_starred })) }
          : memo
      ));
      // Refresh stats
      const newStats = await memoService.getStats();
      setStats(newStats);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to toggle star');
      console.error('Failed to toggle star:', err);
    }
  }, []);

  const deleteMemo = useCallback(async (id: number) => {
    try {
      await memoService.deleteMemo(id);
      // Remove from local state
      setMemos(prev => prev.filter(memo => memo.id !== id));
      // Clear selection if deleted memo was selected
      if (selectedMemoId === id) {
        setSelectedMemoId(null);
      }
      // Refresh stats
      const newStats = await memoService.getStats();
      setStats(newStats);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete memo');
      console.error('Failed to delete memo:', err);
    }
  }, [selectedMemoId]);

  const createMemo = useCallback(async (data: any) => {
    try {
      setLoading(true);
      const newMemo = await memoService.createMemo(data);
      await loadMemoData(); // Refresh list and stats
      return newMemo;
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to create memo';
      setError(msg);
      throw new Error(msg);
    } finally {
      setLoading(false);
    }
  }, [loadMemoData]);

  const replyToMemo = useCallback(async (id: number, data: any) => {
    try {
      setLoading(true);
      const newMemo = await memoService.replyToMemo(id, data);
      await loadMemoData();
      return newMemo;
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to reply to memo';
      setError(msg);
      throw new Error(msg);
    } finally {
      setLoading(false);
    }
  }, [loadMemoData]);

  const forwardMemo = useCallback(async (id: number, data: any) => {
    try {
      setLoading(true);
      const newMemo = await memoService.forwardMemo(id, data);
      await loadMemoData();
      return newMemo;
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to forward memo';
      setError(msg);
      throw new Error(msg);
    } finally {
      setLoading(false);
    }
  }, [loadMemoData]);

  const refreshMemos = useCallback(async () => {
    await loadMemoData();
  }, [loadMemoData]);

  useEffect(() => {
    loadMemoData();
  }, [loadMemoData]);

  const refreshSelectedMemo = useCallback(async () => {
    if (!selectedMemoId) return;
    try {
      const updatedMemo = await memoService.getMemo(selectedMemoId);
      setMemos(prev => prev.map(m => m.id === selectedMemoId ? updatedMemo : m));
    } catch (err) {
      console.error('Failed to refresh selected memo:', err);
    }
  }, [selectedMemoId]);

  return {
    memos,
    stats,
    folders,
    loading,
    error,
    selectedMemoId,
    setSelectedMemoId,
    refreshMemos,
    refreshSelectedMemo,
    searchMemos,
    markAsRead,
    toggleStar,
    deleteMemo,
    createMemo,
    replyToMemo,
    forwardMemo
  };
};