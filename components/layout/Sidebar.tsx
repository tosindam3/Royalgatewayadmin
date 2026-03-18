import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import { ICONS } from '../../constants';
import { BrandSettings, UserRole } from '../../types';
import { employeeService } from '../../services/employeeService';

interface SidebarItemProps {
    item: any;
    isCollapsed: boolean;
}

const SidebarItem: React.FC<SidebarItemProps> = ({ item, isCollapsed }) => {
    const location = useLocation();
    const isActive = location.pathname === item.route;
    const queryClient = useQueryClient();

    const handlePrefetch = () => {
        if (!item.route) return;

        // Prefetch logic based on route
        if (item.route === '/employees') {
            queryClient.prefetchQuery({
                queryKey: ['employee-metrics'],
                queryFn: () => employeeService.getMetrics()
            });
            queryClient.prefetchQuery({
                queryKey: ['employee-directory', 1, '', ''],
                queryFn: () => employeeService.getDirectory({ page: 1, per_page: 10 })
            });
        }

        if (item.route === '/attendance') {
            // Add attendance prefetching if applicable
        }

        if (item.route === '/payroll') {
            // Add payroll prefetching if applicable
        }
    };

    if (item.isHeader) {
        return !isCollapsed ? (
            <p className="px-6 mt-8 mb-2 text-[10px] font-extrabold text-slate-400 dark:text-slate-600 uppercase tracking-[0.25em]">{item.label}</p>
        ) : (
            <div className="h-px bg-slate-100 dark:bg-white/5 mx-4 my-6" />
        );
    }

    return (
        <Link
            to={item.route || '#'}
            onMouseEnter={handlePrefetch}
            className={`flex items-center gap-3 px-6 py-3.5 transition-all duration-300 group relative ${isActive ? 'sidebar-active text-[var(--brand-primary)] dark:text-white' : 'text-slate-500 hover:text-slate-900 dark:hover:text-slate-300 hover:bg-slate-50 dark:hover:bg-white/[0.02]'}`}
        >
            <div className={`w-5 h-5 flex-shrink-0 transition-transform ${isActive ? 'text-[var(--brand-primary)] scale-110' : 'group-hover:scale-110'}`}>
                {item.icon}
            </div>
            {!isCollapsed && (
                <span className="font-bold text-[13px] tracking-wide truncate flex-1">{item.label}</span>
            )}
            {item.badge && !isCollapsed && (
                <span className="px-2 py-0.5 rounded-full text-[8px] font-black uppercase bg-[var(--brand-primary)] text-white shadow-lg">
                    {item.badge}
                </span>
            )}
        </Link>
    );
};

interface SidebarProps {
    brand: BrandSettings;
    isCollapsed: boolean;
    onToggleCollapse: () => void;
    menuItems: any[];
}

const Sidebar: React.FC<SidebarProps> = ({ brand, isCollapsed, onToggleCollapse, menuItems }) => {
    return (
        <aside className={`hidden md:flex flex-col border-r border-slate-200 dark:border-white/5 glass transition-all duration-500 ease-in-out ${isCollapsed ? 'w-20' : 'w-72'}`}>
            <div className="p-7 flex items-center justify-between mb-4">
                <div className="flex items-center gap-3 overflow-hidden">
                    {brand.logo_url ? (
                        <img src={brand.logo_url} className="w-10 h-10 rounded-xl object-cover shadow-lg" alt="Logo" />
                    ) : (
                        <div className="w-10 h-10 bg-orange-500 rounded-xl flex-shrink-0 flex items-center justify-center shadow-2xl shadow-orange-500/40">
                            <span className="font-black text-xl text-white italic">{(brand.company_name || 'H').charAt(0)}</span>
                        </div>
                    )}
                    {!isCollapsed && <h1 className="text-xl font-black tracking-tighter text-slate-900 dark:text-white uppercase italic animate-in fade-in slide-in-from-left-2">{brand.company_name || 'HR360'}</h1>}
                </div>
            </div>
            <nav className="flex-1 overflow-y-auto no-scrollbar space-y-0.5" style={{ maxHeight: 'calc(100vh - 200px)' }}>
                {menuItems.map((item, idx) => (
                    <SidebarItem key={idx} item={item} isCollapsed={isCollapsed} />
                ))}
            </nav>
            <div className="p-4 border-t border-slate-200 dark:border-white/5">
                <button
                    onClick={onToggleCollapse}
                    className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-slate-50 dark:hover:bg-white/5 text-slate-500 transition-all"
                >
                    <div className={`transition-transform duration-500 ${isCollapsed ? 'rotate-180' : ''}`}>
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M11 19l-7-7 7-7m8 14l-7-7 7-7" strokeWidth="2.5" /></svg>
                    </div>
                    {!isCollapsed && <span className="text-[11px] font-black uppercase tracking-widest">Collapse Menu</span>}
                </button>
            </div>
        </aside>
    );
};

export default Sidebar;
