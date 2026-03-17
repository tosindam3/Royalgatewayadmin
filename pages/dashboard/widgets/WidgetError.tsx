import React, { Component, type ReactNode } from 'react';

interface Props {
  title: string;
  children: ReactNode;
  onRetry?: () => void;
}

interface State { hasError: boolean }

export class WidgetErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false };

  static getDerivedStateFromError(): State {
    return { hasError: true };
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-2xl p-6 flex flex-col items-center justify-center gap-3 min-h-[120px]">
          <span className="text-slate-400 dark:text-slate-500 text-sm">Failed to load {this.props.title}</span>
          {this.props.onRetry && (
            <button
              onClick={() => { this.setState({ hasError: false }); this.props.onRetry?.(); }}
              className="text-brand-primary text-xs underline"
            >
              Retry
            </button>
          )}
        </div>
      );
    }
    return this.props.children;
  }
}

// Inline error state (no boundary — for query errors)
export const WidgetError: React.FC<{ title: string; onRetry?: () => void }> = ({ title, onRetry }) => (
  <div className="bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-2xl p-6 flex flex-col items-center justify-center gap-3 min-h-[120px]">
    <span className="text-slate-400 dark:text-slate-500 text-sm">Failed to load {title}</span>
    {onRetry && (
      <button onClick={onRetry} className="text-brand-primary text-xs underline">Retry</button>
    )}
  </div>
);
