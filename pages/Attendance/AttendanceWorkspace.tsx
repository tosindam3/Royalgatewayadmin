import React, { useState, useEffect, lazy, Suspense } from 'react';
import { useSearchParams } from 'react-router-dom';
import GlassCard from '../../components/GlassCard';
import AttendanceSkeleton from '../../components/ui/AttendanceSkeleton';
import {
    BarChart3,
    Activity,
    ListOrdered,
    Clock,
    CheckSquare,
    Smartphone,
    FileText,
    Settings,
    Table
} from 'lucide-react';

// Lazy load tab contents
const OverviewTab = lazy(() => import('./Tabs/OverviewTab'));
const AttendanceSummaryTab = lazy(() => import('./Tabs/AttendanceSummaryTab'));
const LiveAttendanceTab = lazy(() => import('./Tabs/LiveAttendanceTab'));
const DailySummaryTab = lazy(() => import('./Tabs/DailySummaryTab'));
const OvertimeTab = lazy(() => import('./Tabs/OvertimeTab'));
const CorrectionsTab = lazy(() => import('./Tabs/CorrectionsTab'));
const DevicesImportsTab = lazy(() => import('./Tabs/DevicesImportsTab'));
const ReportsTab = lazy(() => import('./Tabs/ReportsTab'));
const SettingsTab = lazy(() => import('./Tabs/SettingsTab'));

const TABS = [
    { id: 'overview', label: 'Overview', icon: <BarChart3 className="w-4 h-4" /> },
    { id: 'summary', label: 'Summary', icon: <Table className="w-4 h-4" /> },
    { id: 'live', label: 'Live Attendance', icon: <Activity className="w-4 h-4" /> },
    { id: 'daily', label: 'Daily Records', icon: <ListOrdered className="w-4 h-4" /> },
    { id: 'overtime', label: 'Overtime', icon: <Clock className="w-4 h-4" /> },
    { id: 'corrections', label: 'Corrections', icon: <CheckSquare className="w-4 h-4" /> },
    { id: 'devices_imports', label: 'Devices & Imports', icon: <Smartphone className="w-4 h-4" /> },
    { id: 'reports', label: 'Reports', icon: <FileText className="w-4 h-4" /> },
    { id: 'settings', label: 'Settings', icon: <Settings className="w-4 h-4" /> },
];

const AttendanceWorkspace: React.FC = () => {
    const [searchParams, setSearchParams] = useSearchParams();
    const activeTabId = searchParams.get('tab') || 'overview';

    const setActiveTab = (id: string) => {
        setSearchParams({ tab: id });
    };

    const renderTabContent = () => {
        switch (activeTabId) {
            case 'overview': return <OverviewTab />;
            case 'summary': return <AttendanceSummaryTab />;
            case 'live': return <LiveAttendanceTab />;
            case 'daily': return <DailySummaryTab />;
            case 'overtime': return <OvertimeTab />;
            case 'corrections': return <CorrectionsTab />;
            case 'devices_imports': return <DevicesImportsTab />;
            case 'reports': return <ReportsTab />;
            case 'settings': return <SettingsTab />;
            default: return <OverviewTab />;
        }
    };

    return (
        <div className="flex flex-col gap-6 animate-in fade-in duration-500">
            {/* Horizontal Tabs Header */}
            <div className="flex flex-col gap-4">
                <div className="flex items-center justify-between">
                    <h1 className="text-3xl font-black tracking-tighter uppercase italic text-slate-900 dark:text-white">
                        Attendance <span className="text-[var(--brand-primary)]">Workspace</span>
                    </h1>
                    <div className="flex items-center gap-2 px-4 py-2 bg-slate-100 dark:bg-white/5 rounded-2xl border border-slate-200 dark:border-white/10">
                        <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                        <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">Live Sync Active</span>
                    </div>
                </div>

                <div className="flex items-center gap-1 p-1 bg-slate-100 dark:bg-white/5 rounded-2xl border border-slate-200 dark:border-white/10 overflow-x-auto no-scrollbar">
                    {TABS.map((tab) => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-[11px] font-black uppercase tracking-widest transition-all whitespace-nowrap ${activeTabId === tab.id
                                ? 'bg-white dark:bg-white/10 text-[var(--brand-primary)] dark:text-white shadow-sm border border-slate-200 dark:border-white/20'
                                : 'text-slate-500 hover:text-slate-900 dark:hover:text-slate-300 hover:bg-white/50 dark:hover:bg-white/5 border border-transparent'
                                }`}
                        >
                            {tab.icon}
                            {tab.label}
                        </button>
                    ))}
                </div>
            </div>

            {/* Tab Content Area */}
            <div className="flex-1 min-h-[600px]">
                <Suspense fallback={<AttendanceSkeleton type="table" />}>
                    {renderTabContent()}
                </Suspense>
            </div>
        </div>
    );
};

export default AttendanceWorkspace;
