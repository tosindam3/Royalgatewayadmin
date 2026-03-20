import React, { useState, useEffect, useRef } from 'react';
import { Notification } from '../../types';
import { playNotificationAlertSound } from '../../utils/soundUtils';

interface NotificationCenterProps {
    notifications: Notification[];
    onMarkAsRead: (id: string) => void;
    onMarkAllAsRead?: () => void;
    extraUnread?: number; // unread count from chat + memo
}

const NotificationCenter: React.FC<NotificationCenterProps> = ({ notifications, onMarkAsRead, onMarkAllAsRead, extraUnread = 0 }) => {
    const [isOpen, setIsOpen] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);
    const soundIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
    const unreadCount = notifications.filter(n => !n.isRead).length + extraUnread;
    const hasUnread = unreadCount > 0;

    useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) setIsOpen(false);
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const prevUnreadCountRef = useRef(unreadCount);

    // Play sound ONLY when NEW notifications arrive (count increases)
    useEffect(() => {
        if (unreadCount > prevUnreadCountRef.current && !isOpen) {
            playNotificationAlertSound();
        }
        prevUnreadCountRef.current = unreadCount;
    }, [unreadCount, isOpen]);

    return (
        <div className="relative" ref={dropdownRef}>
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="p-3 bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-2xl text-slate-400 hover:text-slate-900 dark:hover:text-white transition-all relative group"
            >
                <svg
                    className={`w-5 h-5 ${hasUnread ? 'animate-bell-shake' : ''}`}
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                </svg>
                {hasUnread && (
                    <span className="absolute top-1.5 right-1.5 min-w-[18px] h-[18px] px-1 bg-rose-500 border-2 border-white dark:border-[#0f172a] rounded-full flex items-center justify-center text-[9px] font-black text-white shadow-[0_0_8px_#f43f5e]">
                        {unreadCount > 99 ? '99+' : unreadCount}
                    </span>
                )}
            </button>

            {isOpen && (
                <div className="absolute right-0 mt-4 w-[380px] bg-white dark:bg-[#120e24]/95 backdrop-blur-3xl border border-slate-200 dark:border-white/10 rounded-[32px] shadow-[0_40px_100px_-20px_rgba(0,0,0,0.2)] dark:shadow-[0_40px_100px_-20px_rgba(0,0,0,0.5)] z-[100] animate-in fade-in zoom-in-95 duration-200">
                    <div className="p-6 border-b border-slate-100 dark:border-white/5 flex justify-between items-center">
                        <h3 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-widest italic">Notifications</h3>
                        <span className="px-2.5 py-1 bg-[var(--brand-primary)]/10 text-[var(--brand-primary)] text-[9px] font-black uppercase rounded-lg">{unreadCount} New</span>
                    </div>

                    <div className="max-h-[450px] overflow-y-auto no-scrollbar py-2 text-slate-900 dark:text-white">
                        {/* Chat & Memo unread summary banners */}
                        {extraUnread > 0 && (
                            <div className="px-5 pt-3 pb-1 space-y-2">
                                <p className="text-[9px] font-black uppercase tracking-widest text-slate-400 dark:text-slate-500">Live Activity</p>
                            </div>
                        )}
                        {notifications.length === 0 && extraUnread === 0 ? (
                            <div className="py-20 text-center px-10">
                                <div className="text-4xl mb-4 opacity-20">📭</div>
                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-relaxed">No new alerts.</p>
                            </div>
                        ) : (
                            notifications.map((n) => {
                                const icon =
                                    (n as any).type === 'MEMO'  ? '✉️' :
                                    (n as any).type === 'CHAT'  ? '💬' :
                                    n.type === 'CYCLE_EVENT'    ? '🎯' :
                                    n.type === 'PENDING_REVIEW' ? '⌛' : '✅';
                                const iconBg =
                                    (n as any).type === 'MEMO'  ? 'bg-blue-500/10 text-blue-400' :
                                    (n as any).type === 'CHAT'  ? 'bg-emerald-500/10 text-emerald-400' :
                                    n.type === 'CYCLE_EVENT'    ? 'bg-purple-500/10 text-purple-400' :
                                    n.type === 'PENDING_REVIEW' ? 'bg-amber-500/10 text-amber-400' :
                                                                   'bg-emerald-500/10 text-emerald-400';
                                return (
                                    <div
                                        key={n.id}
                                        onClick={() => onMarkAsRead(n.id)}
                                        className={`p-5 hover:bg-slate-50 dark:hover:bg-white/[0.03] transition-all cursor-pointer border-b border-slate-50 dark:border-white/5 last:border-0 relative ${!n.isRead ? 'bg-[#8252e9]/5' : ''}`}
                                    >
                                        <div className="flex gap-4">
                                            <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-lg flex-shrink-0 ${iconBg}`}>
                                                {icon}
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <div className="flex justify-between items-start mb-1">
                                                    <p className={`text-[11px] font-black uppercase tracking-tight ${!n.isRead ? 'text-slate-900 dark:text-white' : 'text-slate-400'}`}>{n.title}</p>
                                                    <span className="text-[8px] font-bold text-slate-500 uppercase whitespace-nowrap ml-2">{n.timestamp}</span>
                                                </div>
                                                <p className="text-[11px] text-slate-500 line-clamp-2 leading-relaxed">{n.message}</p>
                                            </div>
                                        </div>
                                        {!n.isRead && (
                                            <div className="absolute left-1 top-1/2 -translate-y-1/2 w-1 h-8 bg-[var(--brand-primary)] rounded-full shadow-[0_0_8px_var(--brand-primary)]" />
                                        )}
                                    </div>
                                );
                            })
                        )}
                    </div>

                    <div className="p-4 bg-slate-50 dark:bg-white/[0.02] rounded-b-[32px] text-center">
                        <button
                            onClick={onMarkAllAsRead}
                            className="text-[9px] font-black text-[var(--brand-primary)] uppercase tracking-[0.2em] hover:text-slate-900 dark:hover:text-white transition-colors"
                        >
                            Mark All Read
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default NotificationCenter;
