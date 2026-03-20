import React, { useState, useRef, useEffect } from 'react';
import type { ChatMessage } from '../../../types/ai';

interface Props {
  messages: ChatMessage[];
  isStreaming: boolean;
  geminiEnabled: boolean;
  onSend: (msg: string) => void;
  onStop: () => void;
  onReset: () => void;
}

const STARTERS = [
  'What is our biggest retention risk right now?',
  'How does our attendance compare to last month?',
  'What should I focus on this week?',
  'Give me a career development plan for my role.',
];

const AskTab: React.FC<Props> = ({ messages, isStreaming, geminiEnabled, onSend, onStop, onReset }) => {
  const [input, setInput] = useState('');
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isStreaming]);

  const handleSend = () => {
    const msg = input.trim();
    if (!msg || isStreaming) return;
    setInput('');
    onSend(msg);
  };

  if (!geminiEnabled) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center gap-3">
        <div className="w-14 h-14 rounded-full bg-slate-100 dark:bg-white/5 flex items-center justify-center text-2xl">✦</div>
        <p className="text-sm font-semibold text-slate-700 dark:text-slate-200">Chat requires Gemini</p>
        <p className="text-xs text-slate-400 dark:text-slate-500 max-w-xs">
          Add <code className="bg-slate-100 dark:bg-white/10 px-1 rounded text-[11px]">GEMINI_API_KEY</code> to your backend <code className="bg-slate-100 dark:bg-white/10 px-1 rounded text-[11px]">.env</code> to enable conversational AI.
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full min-h-0">
      {/* Header with Back button */}
      {messages.length > 0 && (
        <div className="flex items-center justify-between mb-4 pb-2 border-b border-slate-100 dark:border-white/5 flex-shrink-0">
          <button
            onClick={onReset}
            className="group flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-slate-400 hover:text-brand-primary transition-colors"
          >
            <span className="text-sm group-hover:-translate-x-0.5 transition-transform">←</span>
            Back to Ask
          </button>
          
          {isStreaming && (
            <button
              onClick={onStop}
              className="px-3 py-1 bg-red-500/10 text-red-500 hover:bg-red-500/20 rounded-full text-[9px] font-black uppercase tracking-widest transition-all animate-pulse"
            >
              Stop Generation
            </button>
          )}
        </div>
      )}

      {/* Messages */}
      <div className="flex-1 overflow-y-auto space-y-4 pb-2 min-h-[200px] max-h-[380px] scrollbar-hide">
        {messages.length === 0 ? (
          <div className="space-y-2 pt-2">
            <p className="text-[10px] font-semibold uppercase tracking-widest text-slate-400 dark:text-slate-500 mb-3">
              Suggested questions
            </p>
            {STARTERS.map((s, i) => (
              <button
                key={i}
                onClick={() => onSend(s)}
                className="w-full text-left text-xs text-slate-600 dark:text-slate-300 bg-white dark:bg-white/5 border border-slate-100 dark:border-white/10 rounded-xl px-4 py-3 hover:border-brand-primary/50 hover:shadow-sm transition-all duration-150"
              >
                {s}
              </button>
            ))}
          </div>
        ) : (
          messages.map((msg, i) => (
            <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-[85%] rounded-2xl px-4 py-2.5 text-xs leading-relaxed ${
                msg.role === 'user'
                  ? 'bg-brand-primary text-white rounded-br-sm'
                  : 'bg-slate-100 dark:bg-white/10 text-slate-700 dark:text-slate-200 rounded-bl-sm'
              }`}>
                {msg.content}
              </div>
            </div>
          ))
        )}

        {isStreaming && (
          <div className="flex justify-start">
            <div className="bg-slate-100 dark:bg-white/10 rounded-2xl rounded-bl-sm px-4 py-2.5">
              <span className="flex gap-1">
                {[0, 1, 2].map(i => (
                  <span key={i} className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: `${i * 0.15}s` }} />
                ))}
              </span>
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div className="pt-3 border-t border-slate-100 dark:border-white/10 flex gap-2">
        <input
          type="text"
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && handleSend()}
          placeholder="Ask anything about your organisation..."
          className="flex-1 text-sm bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl px-4 py-2.5 text-slate-700 dark:text-slate-200 placeholder-slate-400 dark:placeholder-slate-600 focus:outline-none focus:border-brand-primary/50 transition-colors"
        />
        <button
          onClick={handleSend}
          disabled={!input.trim() || isStreaming}
          className="flex-shrink-0 w-10 h-10 rounded-xl bg-brand-primary text-white flex items-center justify-center disabled:opacity-40 hover:opacity-90 transition-opacity"
        >
          ↑
        </button>
      </div>
    </div>
  );
};

export default AskTab;
