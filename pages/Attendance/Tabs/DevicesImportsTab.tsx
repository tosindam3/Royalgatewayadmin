import React, { useState } from 'react';
import { useDevicesImports } from '../../../hooks/useAttendanceData';
import AttendanceSkeleton from '../../../components/ui/AttendanceSkeleton';
import GlassCard from '../../../components/GlassCard';
import { Smartphone, Upload, CheckCircle, XCircle, Clock, Plus, Loader2 } from 'lucide-react';
import { attendanceApi, BiometricDevice } from '../../../services/attendanceApi';
import { toast } from 'sonner';

const DevicesImportsTab: React.FC = () => {
    const { data, isLoading, error, refetch } = useDevicesImports();
    const [showAddDevice, setShowAddDevice] = useState(false);
    const [showImportModal, setShowImportModal] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isImporting, setIsImporting] = useState(false);
    
    // Device form state
    const [deviceForm, setDeviceForm] = useState<BiometricDevice>({
        device_name: '',
        ip_address: '',
        port: 4370,
        location: '',
    });

    const handleAddDevice = () => {
        setDeviceForm({
            device_name: '',
            ip_address: '',
            port: 4370,
            location: '',
        });
        setShowAddDevice(true);
    };

    const handleSubmitDevice = async () => {
        // Validation
        if (!deviceForm.device_name || !deviceForm.ip_address) {
            toast.error('Please fill in all required fields');
            return;
        }

        setIsSubmitting(true);
        try {
            await attendanceApi.createDevice({
                ...deviceForm,
                device_serial: `DEV-${Date.now()}`, // Generate serial
                is_active: true,
            });
            
            toast.success('Device added successfully');
            setShowAddDevice(false);
            refetch(); // Refresh device list
        } catch (error: any) {
            toast.error(error.response?.data?.message || 'Failed to add device');
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleImportFromUSB = () => {
        setShowImportModal(true);
    };

    const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;

        // Validate file size (10MB max)
        if (file.size > 10 * 1024 * 1024) {
            toast.error('File size must be less than 10MB');
            return;
        }

        // Validate file type
        const validExtensions = ['csv', 'txt', 'xlsx', 'xls', 'dat'];
        const extension = file.name.split('.').pop()?.toLowerCase();
        if (!extension || !validExtensions.includes(extension)) {
            toast.error('Invalid file format. Please upload CSV, Excel, or DAT file');
            return;
        }

        setIsImporting(true);
        try {
            const result = await attendanceApi.importFile(file, 'usb');
            
            const stats = result.data;
            toast.success(
                `Import completed! Imported: ${stats.imported}, Updated: ${stats.updated}, Skipped: ${stats.skipped}`
            );

            if (stats.errors && stats.errors.length > 0) {
                console.warn('Import errors:', stats.errors);
            }

            setShowImportModal(false);
            refetch(); // Refresh data
        } catch (error: any) {
            toast.error(error.response?.data?.message || 'Import failed');
        } finally {
            setIsImporting(false);
            // Reset file input
            event.target.value = '';
        }
    };

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
                <button 
                    onClick={handleImportFromUSB}
                    className="inline-flex items-center gap-2 px-4 py-2 bg-purple-500 hover:bg-purple-600 text-white rounded-xl text-sm font-medium transition-colors shadow-lg shadow-purple-500/20"
                >
                    <Upload className="w-4 h-4" />
                    Import from USB
                </button>
            </div>

            {/* Biometric Devices */}
            <GlassCard title="Connected Biometric Devices">
                {!data?.devices || data.devices.length === 0 ? (
                    <div className="text-center py-8">
                        <Smartphone className="w-12 h-12 mx-auto mb-3 text-gray-400 dark:text-gray-600" />
                        <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                            No biometric devices configured
                        </p>
                        <button 
                            onClick={handleAddDevice}
                            className="inline-flex items-center gap-2 px-4 py-2 bg-purple-100 dark:bg-purple-900/20 text-purple-600 dark:text-purple-400 rounded-lg text-sm font-medium hover:bg-purple-200 dark:hover:bg-purple-900/30 transition-colors"
                        >
                            <Plus className="w-4 h-4" />
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
            
            {/* Add Device Modal */}
            {showAddDevice && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl max-w-md w-full p-6">
                        <h3 className="text-xl font-black uppercase tracking-tighter italic text-slate-900 dark:text-white mb-4">
                            Add Biometric Device
                        </h3>
                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                    Device Name <span className="text-red-500">*</span>
                                </label>
                                <input
                                    type="text"
                                    placeholder="e.g., Main Entrance Scanner"
                                    value={deviceForm.device_name}
                                    onChange={(e) => setDeviceForm({...deviceForm, device_name: e.target.value})}
                                    className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-white/10 bg-white dark:bg-white/5 text-gray-900 dark:text-white focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                    IP Address <span className="text-red-500">*</span>
                                </label>
                                <input
                                    type="text"
                                    placeholder="e.g., 192.168.1.100"
                                    value={deviceForm.ip_address}
                                    onChange={(e) => setDeviceForm({...deviceForm, ip_address: e.target.value})}
                                    className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-white/10 bg-white dark:bg-white/5 text-gray-900 dark:text-white focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                    Port
                                </label>
                                <input
                                    type="number"
                                    placeholder="e.g., 4370"
                                    value={deviceForm.port}
                                    onChange={(e) => setDeviceForm({...deviceForm, port: parseInt(e.target.value) || 4370})}
                                    className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-white/10 bg-white dark:bg-white/5 text-gray-900 dark:text-white focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                    Location
                                </label>
                                <input
                                    type="text"
                                    placeholder="e.g., Building A - Floor 1"
                                    value={deviceForm.location}
                                    onChange={(e) => setDeviceForm({...deviceForm, location: e.target.value})}
                                    className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-white/10 bg-white dark:bg-white/5 text-gray-900 dark:text-white focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                                />
                            </div>
                        </div>
                        <div className="flex gap-3 mt-6">
                            <button
                                onClick={() => setShowAddDevice(false)}
                                disabled={isSubmitting}
                                className="flex-1 px-4 py-2 bg-gray-100 dark:bg-white/5 text-gray-700 dark:text-gray-300 rounded-lg text-sm font-medium hover:bg-gray-200 dark:hover:bg-white/10 transition-colors disabled:opacity-50"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleSubmitDevice}
                                disabled={isSubmitting}
                                className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2 bg-purple-500 hover:bg-purple-600 text-white rounded-lg text-sm font-medium transition-colors disabled:opacity-50"
                            >
                                {isSubmitting && <Loader2 className="w-4 h-4 animate-spin" />}
                                {isSubmitting ? 'Adding...' : 'Add Device'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Import from USB Modal */}
            {showImportModal && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl max-w-md w-full p-6">
                        <h3 className="text-xl font-black uppercase tracking-tighter italic text-slate-900 dark:text-white mb-4">
                            Import Attendance Data
                        </h3>
                        <div className="space-y-4">
                            <div className="border-2 border-dashed border-gray-300 dark:border-white/10 rounded-lg p-8 text-center">
                                {isImporting ? (
                                    <>
                                        <Loader2 className="w-12 h-12 mx-auto mb-3 text-purple-500 animate-spin" />
                                        <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                                            Importing attendance data...
                                        </p>
                                        <p className="text-xs text-gray-500 dark:text-gray-500">
                                            Please wait while we process your file
                                        </p>
                                    </>
                                ) : (
                                    <>
                                        <Upload className="w-12 h-12 mx-auto mb-3 text-gray-400 dark:text-gray-600" />
                                        <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                                            Select attendance data file from USB drive
                                        </p>
                                        <label className="inline-flex items-center gap-2 px-4 py-2 bg-purple-100 dark:bg-purple-900/20 text-purple-600 dark:text-purple-400 rounded-lg text-sm font-medium hover:bg-purple-200 dark:hover:bg-purple-900/30 transition-colors cursor-pointer">
                                            <Upload className="w-4 h-4" />
                                            Choose File
                                            <input
                                                type="file"
                                                accept=".csv,.xlsx,.xls,.dat,.txt"
                                                onChange={handleFileUpload}
                                                disabled={isImporting}
                                                className="hidden"
                                            />
                                        </label>
                                        <p className="text-xs text-gray-500 dark:text-gray-500 mt-3">
                                            Supported formats: CSV, Excel, DAT (Max 10MB)
                                        </p>
                                    </>
                                )}
                            </div>
                            <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-3">
                                <p className="text-xs text-blue-700 dark:text-blue-400">
                                    <strong>Required columns:</strong> Employee ID/Code, Date, Check-in Time, Check-out Time
                                </p>
                            </div>
                        </div>
                        <div className="flex gap-3 mt-6">
                            <button
                                onClick={() => setShowImportModal(false)}
                                disabled={isImporting}
                                className="flex-1 px-4 py-2 bg-gray-100 dark:bg-white/5 text-gray-700 dark:text-gray-300 rounded-lg text-sm font-medium hover:bg-gray-200 dark:hover:bg-white/10 transition-colors disabled:opacity-50"
                            >
                                {isImporting ? 'Importing...' : 'Cancel'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default DevicesImportsTab;
