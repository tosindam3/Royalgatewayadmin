import React, { Component, ErrorInfo, ReactNode } from 'react';

interface Props {
  children: ReactNode;
  isDark?: boolean;
}

interface State {
  hasError: boolean;
  error?: Error;
}

export class MemoErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Memo Error Boundary caught an error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      const { isDark = false } = this.props;
      
      return (
        <div className={`flex items-center justify-center h-96 rounded-[32px] border ${
          isDark 
            ? 'bg-[#0f172a] border-white/5 text-white' 
            : 'bg-white border-gray-200 text-gray-900'
        }`}>
          <div className="text-center space-y-4 p-8">
            <div className={`w-16 h-16 mx-auto rounded-full flex items-center justify-center ${
              isDark ? 'bg-red-500/10 text-red-400' : 'bg-red-50 text-red-500'
            }`}>
              <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" 
                      d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
            </div>
            
            <div>
              <h3 className={`text-lg font-semibold mb-2 ${
                isDark ? 'text-white' : 'text-gray-900'
              }`}>
                Something went wrong
              </h3>
              <p className={`text-sm ${
                isDark ? 'text-slate-400' : 'text-gray-600'
              }`}>
                The memo system encountered an error. Please try refreshing the page.
              </p>
            </div>
            
            <button
              onClick={() => window.location.reload()}
              className={`px-4 py-2 rounded-xl text-sm font-medium transition-colors ${
                isDark 
                  ? 'bg-white/10 hover:bg-white/20 text-white border border-white/20' 
                  : 'bg-gray-100 hover:bg-gray-200 text-gray-900 border border-gray-200'
              }`}
            >
              Refresh Page
            </button>
            
            {process.env.NODE_ENV === 'development' && this.state.error && (
              <details className={`mt-4 text-left text-xs ${
                isDark ? 'text-slate-500' : 'text-gray-500'
              }`}>
                <summary className="cursor-pointer mb-2">Error Details</summary>
                <pre className={`p-2 rounded border overflow-auto ${
                  isDark ? 'bg-white/5 border-white/10' : 'bg-gray-50 border-gray-200'
                }`}>
                  {this.state.error.stack}
                </pre>
              </details>
            )}
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}