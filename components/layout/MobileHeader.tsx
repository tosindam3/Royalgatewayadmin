import React from 'react';
import { BrandSettings, UserProfile, Notification } from '../../types';
import ThemeToggle from './ThemeToggle';
import NotificationCenter from './NotificationCenter';
import HeaderClockPanel from '../attendance/HeaderClockPanel';

interface MobileHeaderProps {
  brand: BrandSettings;
  userProfile: UserProfile;
  theme: 'dark' | 'light';
  onToggleTheme: () => void;
  onLogout: () => void;
  notifications: Notification[];
  onMarkAsRead: (id: string) => void;
  onOpenSidebar: () => void;
  onOpenClockModal: () => void;
}

const MobileHeader: React.FC<MobileHeaderProps> = ({
  brand,
  userProfile,
  theme,
  onToggleTheme,
  onLogout,
  notifications,
  onMarkAsRead,
  onOpenSidebar,
  onOpenClockModal
}) => {
  return (
    <header className="md:hidden flex h-16 border-b border-slate-200 dark:border-white/5 items-center px-4 bg-white/80 dark:bg-[#0d0a1a]/60 backdrop-blur-2xl justify-between z-40 sticky top-0">
      <div className="flex items-center gap-3">
        <button 
          onClick={onOpenSidebar}
          className="p-2 rounded-xl text-slate-500 hover:bg-slate-100 dark:hover:bg-white/5 transition-colors"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>
        
        {brand.logo_url ? (
          <img src={brand.logo_url} className="w-8 h-8 rounded-lg object-cover shadow-sm" alt="Logo" />
        ) : (
          <div className="w-8 h-8 bg-orange-500 rounded-lg flex items-center justify-center shadow-lg shadow-orange-500/40 shrink-0">
            <span className="font-black text-sm text-white italic">{(brand.company_name || 'H').charAt(0)}</span>
          </div>
        )}
      </div>

      <div className="flex items-center gap-2">
        <HeaderClockPanel onOpenModal={onOpenClockModal} />
        
        <ThemeToggle theme={theme} onToggle={onToggleTheme} />
        
        <NotificationCenter notifications={notifications} onMarkAsRead={onMarkAsRead} />
        
        <div 
          className="w-8 h-8 rounded-full border-2 border-orange-500 bg-orange-500/20 flex items-center justify-center text-orange-500 font-black italic shadow-sm overflow-hidden cursor-pointer shrink-0"
          onClick={onLogout}
        >
          {userProfile.avatar ? (
             <img src={userProfile.avatar} className="w-full h-full object-cover" alt="Profile" />
          ) : (
             userProfile.name.charAt(0)
          )}
        </div>
      </div>
    </header>
  );
};

export default MobileHeader;
