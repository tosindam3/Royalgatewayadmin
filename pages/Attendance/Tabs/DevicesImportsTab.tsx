import React from 'react';
import { useDevicesImports } from '../../../hooks/useAttendanceData';
import AttendanceSkeleton from '../../../components/ui/AttendanceSkeleton';
import GlassCard from '../../../components/GlassCard';
import { Smartphone, Upload, CheckCircle, XCircle, Clock } from 'lucide-react';

const DevicesImportsTab: React.FC = () => {
    const { data, isLoading, error } = useDevicesImports();

    if (isLoading) {
        return <AttendanceSkeleton type="table" />;
    }

    if (error) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="text-center">
                    <p className="text-red-500 font-medium mb-2">Failed to load devices & imports</p>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Please try again later</p>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-black uppercase tracking-tighter italic text-slate-900 dark:text-white">
                    Devices & USB Imports
                </h2>
                <button className="inline-flex items-center gap-2 px-4 py-2 bg-purple-500 hover:bg-purple-600 text-white rounded-xl text-sm font-medium transition-colors">
                    <Upload className="w-4 h-4" />
                    Import from USB
                </button>
            </div>

            {/* Biometric Devices */}
            <GlassCard title="Connected Biometric Devices">
                {!data?.devices || data.devices.length === 0 ? (
                    <div className="text-center py-8">
                        <Smartphone className="w-12 h-12 mx-auto mb-3 text-gray-400 dark:text-gray-600" />
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                            No biometric devices configured
                        </p>
                        <button className="mt-3 px-4 py-2 bg-purple-100 dark:bg-purple-900/20 text-purple-600 dark:text-purple-400 rounded-lg text-sm font-medium hover:bg-purple-200 dark:hover:bg-purple-900/30">
                            Add Device
                        </button>
                    </div>
                ) : (
                    <div className="space-y-3">
                        {data.devices.map((device: any) => (
                            <div key={device.id} className="flex items-center justify-between p-3 bg-slate-50 dark:bg-white/5 rounded-xl">
                                <div className="flex items-center gap-3">
                                    <div className="p-2 rounded-lg bg-purple-100 dark:bg-purple-900/20">
                                        <Smartphone className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                                    </div>
                                    <div>
                                        <p className="text-sm font-medium text-gray-900 dark:text-white">
                                            {device.name}
                                        </p>
                                        <p className="text-xs text-gray-500 dark:text-gray-400">
                                            {device.ip_address} • Last sync: {device.last_sync || 'Never'}
                                        </p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-2">
                                    <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${
                                        device.status === 'online' 
                                            ? 'bg-green-100 dark:bg-green-900/20 text-green-700 dark:text-green-400'
                                            : 'bg-red-100 dark:bg-red-900/20 text-red-700 dark:text-red-400'
                                    }`}>
                                        <div className={`w-1.5 h-1.5 rounded-full ${device.status === 'online' ? 'bg-green-500' : 'bg-red-500'}`} />
                                        {device.status}
                                    </span>
                                    <button className="px-3 py-1 bg-purple-100 dark:bg-purple-900/20 text-purple-600 dark:text-purple-400 rounded-lg text-xs font-medium hover:bg-purple-200 dark:hover:bg-purple-900/30">
                                        Sync Now
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </GlassCard>

            {/* Recent Imports */}
            <GlassCard title="Recent Import History">
                {!data?.recentImports || data.recentImports.length === 0 ? (
                    <div className="text-center py-8">
                        <Upload className="w-12 h-12 mx-auto mb-3 text-gray-400 dark:text-gray-600" />
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                            No import history available
                        </p>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead>
                                <tr className="border-b border-gray-200 dark:border-white/10">
                                    <th className="text-left py-3 px-4 text-xs font-bold uppercase text-gray-600 dark:text-gray-400">
                                        Date & Time
                                    </th>
                                    <th className="text-left py-3 px-4 text-xs font-bold uppercase text-gray-600 dark:text-gray-400">
                                        Source
                                    </th>
                                    <th className="text-left py-3 px-4 text-xs font-bold uppercase text-gray-600 dark:text-gray-400">
                                        Records
                                    </th>
                                    <th className="text-left py-3 px-4 text-xs font-bold uppercase text-gray-600 dark:text-gray-400">
                                        Status
                                    </th>
                                </tr>
                            </thead>
                            <tbody>
                                {data.recentImports.map((imp: any) => (
                                    <tr key={imp.id} className="border-b border-gray-100 dark:border-white/5">
                                        <td className="py-3 px-4 text-sm text-gray-900 dark:text-white">
                                            {imp.timestamp}
                                        </td>
                                        <td className="py-3 px-4 text-sm text-gray-600 dark:text-gray-400">
                                            {imp.source}
                                        </td>
                                        <td className="py-3 px-4 text-sm text-gray-600 dark:text-gray-400">
                                            {imp.records_count}
                                        </td>
                                        <td className="py-3 px-4">
                                            <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${
                                                imp.status === 'success' 
                                                    ? 'bg-green-100 dark:bg-green-900/20 text-green-700 dark:text-green-400'
                                                    : imp.status === 'failed'
                                                    ? 'bg-red-100 dark:bg-red-900/20 text-red-700 dark:text-red-400'
                                                    : 'bg-yellow-100 dark:bg-yellow-900/20 text-yellow-700 dark:text-yellow-400'
                                            }`}>
                                                {imp.status === 'success' && <CheckCircle className="w-3 h-3" />}
                                                {imp.status === 'failed' && <XCircle className="w-3 h-3" />}
                                                {imp.status === 'processing' && <Clock className="w-3 h-3" />}
                                                {imp.status}
                                            </span>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </GlassCard>
        </div>
    );
};

export default DevicesImportsTab;
