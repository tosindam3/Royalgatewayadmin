import React, { useState, lazy, Suspense } from 'react';
import AttendanceSkeleton from '../../../components/ui/AttendanceSkeleton';
import { Map, Shield, Smartphone, FileCheck, History } from 'lucide-react';

// Lazy load settings sub-tabs
const GeofencingSubTab = lazy(() => import('./Settings/GeofencingSubTab'));
const IPWhitelistSubTab = lazy(() => import('./Settings/IPWhitelistSubTab'));
const BiometricSubTab = lazy(() => import('./Settings/BiometricSubTab'));
const PoliciesSubTab = lazy(() => import('./Settings/PoliciesSubTab'));
const AuditSubTab = lazy(() => import('./Settings/AuditSubTab'));

const SUB_TABS = [
    { id: 'geofencing', label: 'Geofencing', icon: <Map className="w-4 h-4" /> },
    { id: 'ip_whitelist', label: 'IP Whitelisting', icon: <Shield className="w-4 h-4" /> },
    { id: 'biometric', label: 'Biometric', icon: <Smartphone className="w-4 h-4" /> },
    { id: 'policies', label: 'Policies & Rules', icon: <FileCheck className="w-4 h-4" /> },
    { id: 'audit', label: 'Audit', icon: <History className="w-4 h-4" /> },
];

const SettingsTab: React.FC = () => {
    const [activeSubTab, setActiveSubTab] = useState('geofencing');

    const renderSubTab = () => {
        switch (activeSubTab) {
            case 'geofencing': return <GeofencingSubTab />;
            case 'ip_whitelist': return <IPWhitelistSubTab />;
            case 'biometric': return <BiometricSubTab />;
            case 'policies': return <PoliciesSubTab />;
            case 'audit': return <AuditSubTab />;
            default: return <GeofencingSubTab />;
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center gap-1 p-1 bg-slate-100/50 dark:bg-white/5 rounded-2xl border border-slate-200/50 dark:border-white/10 w-fit">
                {SUB_TABS.map((tab) => (
                    <button
                        key={tab.id}
                        onClick={() => setActiveSubTab(tab.id)}
                        className={`flex items-center gap-2 px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${activeSubTab === tab.id
                            ? 'bg-white dark:bg-white/10 text-[var(--brand-primary)] dark:text-white shadow-sm border border-slate-200 dark:border-white/20'
                            : 'text-slate-500 hover:text-slate-900 dark:hover:text-slate-300'
                            }`}
                    >
                        {tab.icon}
                        {tab.label}
                    </button>
                ))}
            </div>

            <div className="min-h-[400px]">
                <Suspense fallback={<AttendanceSkeleton type="settings" />}>
                    {renderSubTab()}
                </Suspense>
            </div>
        </div>
    );
};

export default SettingsTab;
