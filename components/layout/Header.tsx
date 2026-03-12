import React from 'react';
import ThemeToggle from './ThemeToggle';
import NotificationCenter from './NotificationCenter';
import { UserProfile, Notification } from '../../types';
import HeaderClockPanel from '../attendance/HeaderClockPanel';
import { useAttendanceOverview } from '../../hooks/useAttendanceData';

interface HeaderProps {
    userProfile: UserProfile;
    theme: 'dark' | 'light';
    onToggleTheme: () => void;
    onLogout: () => void;
    notifications: Notification[];
    onMarkAsRead: (id: string) => void;
    selectedBranchScope: string;
    onBranchScopeChange: (scope: string) => void;
    onOpenClockModal: () => void;
}

const Header: React.FC<HeaderProps> = ({
    userProfile,
    theme,
    onToggleTheme,
    onLogout,
    notifications,
    onMarkAsRead,
    selectedBranchScope,
    onBranchScopeChange,
    onOpenClockModal,
}) => {
    const { data: overview } = useAttendanceOverview();
    const presentCount = overview?.todayPresent ?? '—';
    const totalCount   = overview?.totalEmployees ?? '—';

    return (
        <header className="hidden md:flex h-20 border-b border-slate-200 dark:border-white/5 items-center px-4 md:px-10 bg-white/80 dark:bg-[#0d0a1a]/60 backdrop-blur-2xl justify-between z-40">
            <div className="flex items-center gap-4 flex-1">
                <div className="relative flex-1 max-w-lg hidden sm:block">
                    <svg className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" strokeWidth="2.5" /></svg>
                    <input type="text" placeholder="Search Identity, Cycles, or Assets..." className="w-full bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-2xl py-2.5 pl-12 pr-4 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500/20 transition-all" />
                </div>

                <div className="hidden lg:flex items-center gap-2 bg-white/5 border border-white/10 rounded-2xl px-4 py-2 hover:bg-white/10 transition-all cursor-pointer group">
                    <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest group-hover:text-white">Scope:</span>
                    <select
                        value={selectedBranchScope}
                        onChange={(e) => onBranchScopeChange(e.target.value)}
                        className="bg-transparent text-[10px] font-black text-slate-200 uppercase tracking-widest outline-none appearance-none cursor-pointer"
                    >
                        <option value="All Branches" className="bg-[#0d0a1a]">Global Overview</option>
                        <option value="Main HQ" className="bg-[#0d0a1a]">Main HQ (San Francisco)</option>
                        <option value="Tech North" className="bg-[#0d0a1a]">Tech North (Seattle)</option>
                        <option value="Lagos Branch" className="bg-[#0d0a1a]">Lagos Branch (Nigeria)</option>
                    </select>
                    <svg className="w-3 h-3 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M19 9l-7 7-7-7" strokeWidth="3" /></svg>
                </div>
            </div>

            <div className="flex items-center gap-4">
                <HeaderClockPanel onOpenModal={onOpenClockModal} />

                <button className="hidden xl:flex items-center gap-2 px-4 py-2 bg-emerald-500/5 text-emerald-600 dark:text-emerald-400 border border-emerald-500/10 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-emerald-500/10 transition-all">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                    Live Hub: {presentCount}/{totalCount} Active
                </button>

                <div className="h-6 w-px bg-slate-200 dark:bg-white/10 hidden md:block" />

                <ThemeToggle theme={theme} onToggle={onToggleTheme} />

                <NotificationCenter notifications={notifications} onMarkAsRead={onMarkAsRead} />

                <div className="flex items-center gap-3 group cursor-pointer p-1 rounded-2xl hover:bg-slate-50 dark:hover:bg-white/5 transition-all" onClick={onLogout}>
                    <div className="text-right hidden sm:block">
                        <p className="text-xs font-black text-slate-900 dark:text-white">{userProfile.name}</p>
                        <p className="text-[9px] font-bold text-slate-500 uppercase tracking-widest">Logout</p>
                    </div>
                    {userProfile.avatar ? (
                        <img src={userProfile.avatar} className="w-10 h-10 rounded-2xl border-2 border-orange-500 shadow-lg object-cover" alt="Profile" />
                    ) : (
                        <div className="w-10 h-10 rounded-2xl border-2 border-orange-500 bg-orange-500/20 flex items-center justify-center text-orange-500 font-black italic shadow-lg">
                            {userProfile.name.charAt(0)}
                        </div>
                    )}
                </div>
            </div>

        </header>
    );
};

export default Header;
