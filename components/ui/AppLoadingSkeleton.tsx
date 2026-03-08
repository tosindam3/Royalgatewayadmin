import React from 'react';

/**
 * Professional skeleton loader for initial app loading
 * Displays a realistic dashboard skeleton while the app initializes
 */
const AppLoadingSkeleton: React.FC = () => {
  return (
    <div className="min-h-screen bg-white dark:bg-[#0d0a1a] flex">
      {/* Sidebar Skeleton */}
      <div className="hidden lg:flex w-64 border-r border-slate-200 dark:border-white/5 flex-col p-6 space-y-6">
        {/* Logo */}
        <div className="flex items-center gap-3 animate-pulse">
          <div className="w-10 h-10 bg-slate-200 dark:bg-white/5 rounded-xl shimmer" />
          <div className="h-6 w-24 bg-slate-200 dark:bg-white/5 rounded-lg shimmer" />
        </div>

        {/* Menu Items */}
        <div className="space-y-2 flex-1">
          {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
            <div key={i} className="flex items-center gap-3 p-3 animate-pulse">
              <div className="w-5 h-5 bg-slate-200 dark:bg-white/5 rounded shimmer" />
              <div className="h-4 flex-1 bg-slate-200 dark:bg-white/5 rounded shimmer" />
            </div>
          ))}
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        {/* Header Skeleton */}
        <div className="h-20 border-b border-slate-200 dark:border-white/5 px-6 flex items-center justify-between animate-pulse">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 bg-slate-200 dark:bg-white/5 rounded-full shimmer" />
            <div className="space-y-2">
              <div className="h-4 w-32 bg-slate-200 dark:bg-white/5 rounded shimmer" />
              <div className="h-3 w-24 bg-slate-200 dark:bg-white/5 rounded shimmer" />
            </div>
          </div>
          <div className="flex gap-3">
            <div className="w-10 h-10 bg-slate-200 dark:bg-white/5 rounded-full shimmer" />
            <div className="w-10 h-10 bg-slate-200 dark:bg-white/5 rounded-full shimmer" />
            <div className="w-10 h-10 bg-slate-200 dark:bg-white/5 rounded-full shimmer" />
          </div>
        </div>

        {/* Page Content */}
        <div className="flex-1 overflow-y-auto p-4 md:p-10">
          <div className="max-w-[1400px] mx-auto space-y-8">
            {/* Page Title */}
            <div className="space-y-2 animate-pulse">
              <div className="h-8 w-48 bg-slate-200 dark:bg-white/5 rounded-lg shimmer" />
              <div className="h-4 w-64 bg-slate-200 dark:bg-white/5 rounded shimmer" />
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              {[1, 2, 3, 4].map((i) => (
                <div
                  key={i}
                  className="bg-white dark:bg-white/5 border border-slate-200 dark:border-white/5 rounded-[24px] p-6 space-y-3 animate-pulse"
                >
                  <div className="h-4 w-20 bg-slate-200 dark:bg-white/5 rounded shimmer" />
                  <div className="h-8 w-24 bg-slate-200 dark:bg-white/5 rounded-lg shimmer" />
                  <div className="h-3 w-16 bg-slate-200 dark:bg-white/5 rounded shimmer" />
                </div>
              ))}
            </div>

            {/* Main Content Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Large Card */}
              <div className="lg:col-span-2 space-y-6">
                <div className="bg-white dark:bg-white/5 border border-slate-200 dark:border-white/5 rounded-[32px] p-6 space-y-4 animate-pulse">
                  <div className="h-6 w-48 bg-slate-200 dark:bg-white/5 rounded-lg shimmer" />
                  <div className="h-64 bg-slate-200 dark:bg-white/5 rounded-2xl shimmer" />
                </div>

                <div className="bg-white dark:bg-white/5 border border-slate-200 dark:border-white/5 rounded-[32px] p-6 space-y-4 animate-pulse">
                  <div className="h-6 w-40 bg-slate-200 dark:bg-white/5 rounded-lg shimmer" />
                  <div className="space-y-3">
                    {[1, 2, 3, 4].map((i) => (
                      <div key={i} className="flex gap-4 items-center">
                        <div className="w-12 h-12 bg-slate-200 dark:bg-white/5 rounded-full shimmer" />
                        <div className="flex-1 space-y-2">
                          <div className="h-4 w-full bg-slate-200 dark:bg-white/5 rounded shimmer" />
                          <div className="h-3 w-2/3 bg-slate-200 dark:bg-white/5 rounded shimmer" />
                        </div>
                        <div className="w-20 h-8 bg-slate-200 dark:bg-white/5 rounded-lg shimmer" />
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Sidebar Cards */}
              <div className="space-y-6">
                <div className="bg-white dark:bg-white/5 border border-slate-200 dark:border-white/5 rounded-[32px] p-6 space-y-4 animate-pulse">
                  <div className="h-6 w-32 bg-slate-200 dark:bg-white/5 rounded-lg shimmer" />
                  {[1, 2, 3, 4].map((i) => (
                    <div key={i} className="flex gap-3 items-center">
                      <div className="w-10 h-10 bg-slate-200 dark:bg-white/5 rounded-full shimmer" />
                      <div className="flex-1 space-y-2">
                        <div className="h-3 w-full bg-slate-200 dark:bg-white/5 rounded shimmer" />
                        <div className="h-2 w-2/3 bg-slate-200 dark:bg-white/5 rounded shimmer" />
                      </div>
                    </div>
                  ))}
                </div>

                <div className="bg-white dark:bg-white/5 border border-slate-200 dark:border-white/5 rounded-[32px] p-6 space-y-4 animate-pulse">
                  <div className="h-6 w-28 bg-slate-200 dark:bg-white/5 rounded-lg shimmer" />
                  <div className="h-40 bg-slate-200 dark:bg-white/5 rounded-2xl shimmer" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Loading Indicator */}
      <div className="fixed bottom-8 right-8 flex items-center gap-3 bg-white dark:bg-[#1c1633] border border-slate-200 dark:border-white/10 rounded-full px-6 py-3 shadow-2xl animate-in fade-in slide-in-from-bottom-4">
        <div className="relative flex items-center justify-center">
          <div className="w-2 h-2 bg-purple-500 rounded-full animate-pulse" />
          <div className="absolute w-4 h-4 border-2 border-purple-500/30 rounded-full animate-ping" />
        </div>
        <span className="text-xs font-bold text-slate-600 dark:text-white/70">
          Initializing workspace...
        </span>
      </div>
    </div>
  );
};

export default AppLoadingSkeleton;
