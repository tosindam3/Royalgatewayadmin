import React from 'react';

interface MemoSkeletonsProps {
  isDark: boolean;
}

export const MemoListSkeleton: React.FC<MemoSkeletonsProps> = ({ isDark }) => (
  <div className="space-y-2">
    {[1, 2, 3, 4, 5].map((i) => (
      <div key={i} className={`p-4 rounded-[20px] animate-pulse ${
        isDark ? 'bg-white/5' : 'bg-gray-100'
      }`}>
        <div className="flex items-start gap-3 mb-2">
          <div className={`w-8 h-8 rounded-full ${
            isDark ? 'bg-white/10' : 'bg-gray-200'
          }`} />
          <div className="flex-1">
            <div className={`h-3 rounded mb-1 ${
              isDark ? 'bg-white/10' : 'bg-gray-200'
            }`} style={{ width: `${60 + Math.random() * 30}%` }} />
            <div className={`h-2 rounded ${
              isDark ? 'bg-white/10' : 'bg-gray-200'
            }`} style={{ width: `${40 + Math.random() * 20}%` }} />
          </div>
        </div>
        <div className={`h-3 rounded mb-1 ${
          isDark ? 'bg-white/10' : 'bg-gray-200'
        }`} style={{ width: `${70 + Math.random() * 25}%` }} />
        <div className={`h-2 rounded ${
          isDark ? 'bg-white/10' : 'bg-gray-200'
        }`} style={{ width: `${50 + Math.random() * 30}%` }} />
      </div>
    ))}
  </div>
);

export const MemoDetailSkeleton: React.FC<MemoSkeletonsProps> = ({ isDark }) => (
  <div className="p-12 space-y-10">
    {/* Header */}
    <div className="flex justify-between items-start">
      <div className="flex items-center gap-4">
        <div className={`w-12 h-12 rounded-[18px] ${
          isDark ? 'bg-white/10' : 'bg-gray-200'
        }`} />
        <div>
          <div className={`h-4 rounded mb-2 ${
            isDark ? 'bg-white/10' : 'bg-gray-200'
          }`} style={{ width: '120px' }} />
          <div className={`h-3 rounded mb-1 ${
            isDark ? 'bg-white/10' : 'bg-gray-200'
          }`} style={{ width: '200px' }} />
          <div className={`h-2 rounded ${
            isDark ? 'bg-white/10' : 'bg-gray-200'
          }`} style={{ width: '150px' }} />
        </div>
      </div>
      <div className={`h-3 rounded ${
        isDark ? 'bg-white/10' : 'bg-gray-200'
      }`} style={{ width: '60px' }} />
    </div>

    {/* Content */}
    <div className="space-y-6 max-w-2xl">
      <div className={`h-4 rounded ${
        isDark ? 'bg-white/10' : 'bg-gray-200'
      }`} style={{ width: '100px' }} />
      
      <div className={`h-3 rounded ${
        isDark ? 'bg-white/10' : 'bg-gray-200'
      }`} style={{ width: '80%' }} />
      
      {/* Bullet points */}
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="flex gap-4">
            <div className={`w-1.5 h-1.5 rounded-full mt-2 ${
              isDark ? 'bg-white/20' : 'bg-gray-300'
            }`} />
            <div className="flex-1">
              <div className={`h-3 rounded mb-1 ${
                isDark ? 'bg-white/10' : 'bg-gray-200'
              }`} style={{ width: `${60 + Math.random() * 30}%` }} />
              <div className={`h-2 rounded ${
                isDark ? 'bg-white/10' : 'bg-gray-200'
              }`} style={{ width: `${70 + Math.random() * 25}%` }} />
            </div>
          </div>
        ))}
      </div>
      
      <div className={`h-3 rounded ${
        isDark ? 'bg-white/10' : 'bg-gray-200'
      }`} style={{ width: '90%' }} />
      
      {/* Signature */}
      <div className="pt-8 space-y-2">
        <div className={`h-2 rounded ${
          isDark ? 'bg-white/10' : 'bg-gray-200'
        }`} style={{ width: '80px' }} />
        <div className={`h-3 rounded ${
          isDark ? 'bg-white/10' : 'bg-gray-200'
        }`} style={{ width: '120px' }} />
        <div className={`h-2 rounded ${
          isDark ? 'bg-white/10' : 'bg-gray-200'
        }`} style={{ width: '100px' }} />
      </div>
    </div>
  </div>
);

export const StatsSkeleton: React.FC<MemoSkeletonsProps> = ({ isDark }) => (
  <div className="flex gap-2">
    {[1, 2, 3, 4].map((i) => (
      <div key={i} className={`px-1.5 py-0.5 rounded-md ${
        isDark ? 'bg-white/10' : 'bg-gray-200'
      }`}>
        <div className={`h-2 rounded ${
          isDark ? 'bg-white/20' : 'bg-gray-300'
        }`} style={{ width: '12px' }} />
      </div>
    ))}
  </div>
);