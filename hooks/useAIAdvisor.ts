import { useState, useCallback } from 'react';
import { aiAdvisorApi } from '../services/aiAdvisorApi';
import type { BriefingResponse, TrendsResponse, ChatMessage } from '../types/ai';

export function useAIAdvisor() {
  const [briefing, setBriefing]               = useState<BriefingResponse | null>(null);
  const [trends, setTrends]                   = useState<TrendsResponse | null>(null);
  const [chatMessages, setChatMessages]       = useState<ChatMessage[]>([]);
  const [isLoadingBriefing, setLoadingBriefing] = useState(false);
  const [isLoadingTrends, setLoadingTrends]   = useState(false);
  const [isStreaming, setStreaming]            = useState(false);
  const [error, setError]                     = useState<string | null>(null);

  const loadBriefing = useCallback(async () => {
    if (briefing) return; // already loaded
    setLoadingBriefing(true);
    setError(null);
    try {
      const data = await aiAdvisorApi.getBriefing();
      setBriefing(data);
    } catch {
      setError('Failed to load briefing. Please try again.');
    } finally {
      setLoadingBriefing(false);
    }
  }, [briefing]);

  const loadTrends = useCallback(async () => {
    if (trends) return;
    setLoadingTrends(true);
    try {
      const data = await aiAdvisorApi.getTrends();
      setTrends(data);
    } catch {
      // silently fail
    } finally {
      setLoadingTrends(false);
    }
  }, [trends]);

  const sendMessage = useCallback(async (message: string) => {
    const userMsg: ChatMessage = { role: 'user', content: message };
    setChatMessages(prev => [...prev, userMsg]);
    setStreaming(true);

    try {
      const reply = await aiAdvisorApi.chat(message, [...chatMessages, userMsg]);
      setChatMessages(prev => [...prev, { role: 'model', content: reply }]);
    } catch {
      setChatMessages(prev => [...prev, { role: 'model', content: 'Sorry, I encountered an issue. Please try again.' }]);
    } finally {
      setStreaming(false);
    }
  }, [chatMessages]);

  const reset = useCallback(() => {
    setBriefing(null);
    setTrends(null);
    setChatMessages([]);
    setError(null);
  }, []);

  return {
    briefing, trends, chatMessages,
    isLoadingBriefing, isLoadingTrends, isStreaming,
    error, loadBriefing, loadTrends, sendMessage, reset,
    geminiEnabled: briefing?.gemini_enabled ?? false,
    healthScore:   briefing?.health_score ?? null,
  };
}
