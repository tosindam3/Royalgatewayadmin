import { useState, useCallback, useEffect, useRef } from 'react';
import { aiAdvisorApi } from '../services/aiAdvisorApi';
import type { BriefingResponse, TrendsResponse, ChatMessage } from '../types/ai';
import Echo from 'laravel-echo';
import Pusher from 'pusher-js';

declare global {
  interface Window {
    Pusher: typeof Pusher;
    Echo: Echo<any>;
  }
}

window.Pusher = Pusher;

export function useAIAdvisor() {
  const [briefing, setBriefing]               = useState<BriefingResponse | null>(null);
  const [trends, setTrends]                   = useState<TrendsResponse | null>(null);
  const [chatMessages, setChatMessages]       = useState<ChatMessage[]>([]);
  const [isLoadingBriefing, setLoadingBriefing] = useState(false);
  const [isLoadingTrends, setLoadingTrends]   = useState(false);
  const [isStreaming, setStreaming]            = useState(false);
  const [error, setError]                     = useState<string | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  // Setup WebSocket connection for background enrichment
  useEffect(() => {
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
          authEndpoint: import.meta.env.VITE_API_URL 
            ? `${import.meta.env.VITE_API_URL}/broadcasting/auth` 
            : 'http://localhost:8000/api/v1/broadcasting/auth',
          auth: {
              headers: {
                  Authorization: `Bearer ${token}`
              }
          }
      });
    }

    const channel = window.Echo.private(`App.Models.User.${user.id}`);
    
    channel.listen('.AiBriefingReady', (e: { data: BriefingResponse }) => {
      console.log('AI Briefing Ready (WS):', e.data);
      setBriefing(e.data);
    });

    return () => {
      channel.stopListening('.AiBriefingReady');
    };
  }, []);

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
      setError('Failed to load trends. The service might be temporarily unavailable.');
    } finally {
      setLoadingTrends(false);
    }
  }, [trends]);

  const sendMessage = useCallback(async (message: string) => {
    const userMsg: ChatMessage = { role: 'user', content: message };
    const assistantMsg: ChatMessage = { role: 'model', content: '' };
    
    setChatMessages(prev => [...prev, userMsg, assistantMsg]);
    setStreaming(true);

    const token = localStorage.getItem('royalgateway_auth_token');

    const controller = new AbortController();
    abortControllerRef.current = controller;

    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:8000'}/api/v1/ai/chat/stream`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ message, history: chatMessages }),
        signal: controller.signal
      });

      if (!response.ok) throw new Error('Stream failed');

      const reader = response.body?.getReader();
      const decoder = new TextDecoder();
      let fullContent = '';

      if (reader) {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          const chunk = decoder.decode(value, { stream: true });
          const lines = chunk.split('\n');

          for (const line of lines) {
            if (line.startsWith('data: ')) {
              try {
                const data = JSON.parse(line.substring(6));
                if (data.text) {
                  fullContent += data.text;
                  // Update the last message in the list
                  setChatMessages(prev => {
                    const newMsgs = [...prev];
                    const last = newMsgs[newMsgs.length - 1];
                    if (last && last.role === 'model') {
                      last.content = fullContent;
                    }
                    return newMsgs;
                  });
                } else if (data.error) {
                   throw new Error(data.error);
                }
              } catch (e) {
                // Ignore parse errors for incomplete JSON chunks
              }
            }
          }
        }
      }
    } catch (e: any) {
      if (e.name === 'AbortError') {
        console.log('Chat stream aborted');
        return;
      }
      setChatMessages(prev => {
        const newMsgs = [...prev];
        const last = newMsgs[newMsgs.length - 1];
        if (last && last.role === 'model') {
          last.content = `Error: ${e.message || 'I encountered an issue. Please try again.'}`;
        }
        return newMsgs;
      });
    } finally {
      abortControllerRef.current = null;
      setStreaming(false);
    }
  }, [chatMessages]);

  const reset = useCallback(() => {
    setBriefing(null);
    setTrends(null);
    setChatMessages([]);
    setError(null);
  }, []);

  const stopStreaming = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      setStreaming(false);
    }
  }, []);

  const resetChat = useCallback(() => {
    setChatMessages([]);
    setStreaming(false);
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
  }, []);

  return {
    briefing, trends, chatMessages,
    isLoadingBriefing, isLoadingTrends, isStreaming,
    error, loadBriefing, loadTrends, sendMessage, reset,
    stopStreaming, resetChat,
    geminiEnabled: briefing?.gemini_enabled ?? false,
    healthScore:   briefing?.health_score ?? null,
  };
}
