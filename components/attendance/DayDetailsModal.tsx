import React from 'react';
import { X, Clock, MapPin, Smartphone, Monitor, CheckCircle, XCircle, AlertCircle } from 'lucide-react';
import { useRecordDetails } from '../../hooks/useAttendanceData';
import GlassCard from '../GlassCard';
import GeofenceBadge from './GeofenceBadge';

interface DayDetailsModalProps {
    recordId: number;
    onClose: () => void;
}

const DayDetailsModal: React.FC<DayDetailsModalProps> = ({ recordId, onClose }) => {
    const { data, isLoading, error } = useRecordDetails(recordId);

    if (isLoading) {
        return (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
                <div className="bg-white dark:bg-slate-800 rounded-2xl p-8 max-w-4xl w-full mx-4 max-h-[90vh] overflow-y-auto">
                    <div className="animate-pulse space-y-4">
                        <div className="h-8 bg-slate-200 dark:bg-slate-700 rounded w-1/3" />
                        <div className="h-32 bg-slate-200 dark:bg-slate-700 rounded" />
                        <div className="h-64 bg-slate-200 dark:bg-slate-700 rounded" />
                    </div>
                </div>
            </div>
        );
    }

    if (error || !data) {
        return (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
                <div className="bg-white dark:bg-slate-800 rounded-2xl p-8 max-w-md w-full mx-4">
                    <div className="text-center">
                        <AlertCircle className="w-16 h-16 mx-auto mb-4 text-red-500" />
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                            Failed to Load Details
                        </h3>
                        <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
                            Unable to fetch record details. Please try again.
                        </p>
                        <button
                            onClick={onClose}
                            className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-sm font-medium transition-colors"
                        >
                            Close
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    const { record, timeline, geofence, metadata, corrections } = data;

    const formatTime = (isoString: string | null) => {
        if (!isoString) return '—';
        return new Date(isoString).toLocaleTimeString('en-US', { 
            hour: '2-digit', 
            minute: '2-digit',
            hour12: true 
        });
    };

    const formatMinutes = (minutes: number) => {
        const hours = Math.floor(minutes / 60);
        const mins = minutes % 60;
        return hours > 0 ? `${hours}h ${mins}m` : `${mins}m`;
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-6 overflow-y-auto">
            <div className="bg-white dark:bg-slate-800 rounded-2xl max-w-4xl w-full my-auto max-h-[85vh] overflow-hidden flex flex-col">
                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-white/10">
                    <div>
                        <h2 className="text-xl font-bold text-slate-900 dark:text-white">
                            Day Details
                        </h2>
                        <p className="text-sm text-slate-500 dark:text-gray-400 mt-1">
                            {record.employee.name} • {new Date(record.work_date).toLocaleDateString('en-US', { 
                                weekday: 'long',
                                year: 'numeric',
                                month: 'long',
                                day: 'numeric'
                            })}
                        </p>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-slate-100 dark:hover:bg-white/5 rounded-xl transition-colors"
                    >
                        <X className="w-5 h-5 text-gray-500" />
                    </button>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-6 space-y-6">
                    {/* Summary Section */}
                    <GlassCard>
                        <h3 className="text-sm font-semibold text-slate-900 dark:text-white mb-4">
                            Summary
                        </h3>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                            <div>
                                <p className="text-xs text-slate-500 dark:text-gray-400">Status</p>
                                <span className={`inline-flex mt-1 px-2 py-1 rounded-full text-xs font-medium ${
                                    record.status === 'present' 
                                        ? 'bg-green-100 dark:bg-green-900/20 text-green-700 dark:text-green-400'
                                        : record.status === 'partial'
                                        ? 'bg-yellow-100 dark:bg-yellow-900/20 text-yellow-700 dark:text-yellow-400'
                                        : 'bg-red-100 dark:bg-red-900/20 text-red-700 dark:text-red-400'
                                }`}>
                                    {record.status}
                                </span>
                            </div>
                            <div>
                                <p className="text-xs text-slate-500 dark:text-gray-400">Worked</p>
                                <p className="text-lg font-bold text-slate-900 dark:text-white mt-1">
                                    {formatMinutes(record.worked_minutes)}
                                </p>
                            </div>
                            <div>
                                <p className="text-xs text-slate-500 dark:text-gray-400">Late</p>
                                <p className="text-lg font-bold text-orange-600 dark:text-orange-400 mt-1">
                                    {formatMinutes(record.late_minutes)}
                                </p>
                            </div>
                            <div>
                                <p className="text-xs text-slate-500 dark:text-gray-400">Overtime</p>
                                <p className="text-lg font-bold text-blue-600 dark:text-blue-400 mt-1">
                                    {formatMinutes(record.overtime_minutes)}
                                </p>
                            </div>
                        </div>
                    </GlassCard>

                    {/* Timeline Section */}
                    <GlassCard>
                        <h3 className="text-sm font-semibold text-slate-900 dark:text-white mb-4">
                            Timeline
                        </h3>
                        <div className="space-y-4">
                            {timeline.map((event: any, index: number) => (
                                <div key={index} className="flex gap-4">
                                    <div className="flex flex-col items-center">
                                        <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                                            event.type === 'check_in'
                                                ? 'bg-green-100 dark:bg-green-900/20 text-green-600'
                                                : 'bg-blue-100 dark:bg-blue-900/20 text-blue-600'
                                        }`}>
                                            <Clock className="w-5 h-5" />
                                        </div>
                                        {index < timeline.length - 1 && (
                                            <div className="w-0.5 h-full bg-slate-200 dark:bg-slate-700 mt-2" />
                                        )}
                                    </div>
                                    <div className="flex-1 pb-4">
                                        <div className="flex items-center justify-between mb-2">
                                            <h4 className="font-semibold text-slate-900 dark:text-white capitalize">
                                                {event.type.replace('_', ' ')}
                                            </h4>
                                            <span className="text-sm font-mono text-slate-600 dark:text-gray-400">
                                                {formatTime(event.timestamp)}
                                            </span>
                                        </div>
                                        <div className="space-y-2 text-sm text-slate-600 dark:text-gray-400">
                                            <div className="flex items-center gap-2">
                                                {event.source === 'mobile_app' ? (
                                                    <Smartphone className="w-4 h-4" />
                                                ) : (
                                                    <Monitor className="w-4 h-4" />
                                                )}
                                                <span>Source: {event.source.replace('_', ' ')}</span>
                                            </div>
                                            {event.location && (
                                                <div className="flex items-center gap-2">
                                                    <MapPin className="w-4 h-4" />
                                                    <span>
                                                        Location: {event.location.lat.toFixed(6)}, {event.location.lng.toFixed(6)}
                                                    </span>
                                                </div>
                                            )}
                                            {event.device_id && (
                                                <div className="flex items-center gap-2">
                                                    <Monitor className="w-4 h-4" />
                                                    <span>Device: {event.device_id}</span>
                                                </div>
                                            )}
                                            {event.verified !== undefined && (
                                                <div className="flex items-center gap-2">
                                                    {event.verified ? (
                                                        <CheckCircle className="w-4 h-4 text-green-600" />
                                                    ) : (
                                                        <XCircle className="w-4 h-4 text-red-600" />
                                                    )}
                                                    <span>{event.verified ? 'Verified' : 'Unverified'}</span>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </GlassCard>

                    {/* Geofence Detail Section */}
                    <GlassCard>
                        <h3 className="text-sm font-semibold text-slate-900 dark:text-white mb-4">
                            Geofence Validation
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {/* Check In Geofence */}
                            <div className="p-4 bg-slate-50 dark:bg-white/5 rounded-xl">
                                <div className="flex items-center justify-between mb-3">
                                    <h4 className="text-sm font-medium text-slate-700 dark:text-gray-300">
                                        Check In
                                    </h4>
                                    <GeofenceBadge status={geofence.in.status} size="md" />
                                </div>
                                {geofence.in.zone && (
                                    <p className="text-sm text-slate-600 dark:text-gray-400 mb-2">
                                        Zone: {geofence.in.zone.name}
                                    </p>
                                )}
                                {geofence.in.reason && (
                                    <p className="text-xs text-red-600 dark:text-red-400">
                                        {geofence.in.reason}
                                    </p>
                                )}
                            </div>

                            {/* Check Out Geofence */}
                            <div className="p-4 bg-slate-50 dark:bg-white/5 rounded-xl">
                                <div className="flex items-center justify-between mb-3">
                                    <h4 className="text-sm font-medium text-slate-700 dark:text-gray-300">
                                        Check Out
                                    </h4>
                                    <GeofenceBadge status={geofence.out.status} size="md" />
                                </div>
                                {geofence.out.zone && (
                                    <p className="text-sm text-slate-600 dark:text-gray-400 mb-2">
                                        Zone: {geofence.out.zone.name}
                                    </p>
                                )}
                                {geofence.out.reason && (
                                    <p className="text-xs text-red-600 dark:text-red-400">
                                        {geofence.out.reason}
                                    </p>
                                )}
                            </div>
                        </div>
                    </GlassCard>

                    {/* Metadata Section */}
                    <GlassCard>
                        <h3 className="text-sm font-semibold text-slate-900 dark:text-white mb-4">
                            Additional Information
                        </h3>
                        <div className="space-y-2 text-sm">
                            <div className="flex justify-between">
                                <span className="text-slate-500 dark:text-gray-400">Shift:</span>
                                <span className="text-slate-900 dark:text-white font-medium">
                                    {metadata.shift}
                                </span>
                            </div>
                            {metadata.flags.missing_punch && (
                                <div className="flex items-center gap-2 text-orange-600 dark:text-orange-400">
                                    <AlertCircle className="w-4 h-4" />
                                    <span>Missing punch detected</span>
                                </div>
                            )}
                            {metadata.flags.edited && (
                                <div className="flex items-center gap-2 text-blue-600 dark:text-blue-400">
                                    <AlertCircle className="w-4 h-4" />
                                    <span>Record has been edited</span>
                                </div>
                            )}
                            {metadata.flags.duplicate && (
                                <div className="flex items-center gap-2 text-yellow-600 dark:text-yellow-400">
                                    <AlertCircle className="w-4 h-4" />
                                    <span>Duplicate entries detected</span>
                                </div>
                            )}
                        </div>
                    </GlassCard>

                    {/* Corrections History */}
                    {corrections && corrections.length > 0 && (
                        <GlassCard>
                            <h3 className="text-sm font-semibold text-slate-900 dark:text-white mb-4">
                                Corrections History
                            </h3>
                            <div className="space-y-4">
                                {corrections.map((correction: any) => (
                                    <div key={correction.id} className="p-4 bg-slate-50 dark:bg-white/5 rounded-xl">
                                        <div className="flex items-center justify-between mb-2">
                                            <span className="text-sm font-medium text-slate-900 dark:text-white">
                                                Requested by {correction.requested_by}
                                            </span>
                                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                                                correction.approval_status === 'approved'
                                                    ? 'bg-green-100 dark:bg-green-900/20 text-green-700 dark:text-green-400'
                                                    : correction.approval_status === 'rejected'
                                                    ? 'bg-red-100 dark:bg-red-900/20 text-red-700 dark:text-red-400'
                                                    : 'bg-yellow-100 dark:bg-yellow-900/20 text-yellow-700 dark:text-yellow-400'
                                            }`}>
                                                {correction.approval_status}
                                            </span>
                                        </div>
                                        <p className="text-sm text-slate-600 dark:text-gray-400 mb-2">
                                            {correction.reason}
                                        </p>
                                        <div className="text-xs text-slate-500 dark:text-gray-500">
                                            {new Date(correction.requested_at).toLocaleString()}
                                        </div>
                                        {correction.approved_by && (
                                            <div className="mt-2 text-xs text-slate-600 dark:text-gray-400">
                                                {correction.approval_status === 'approved' ? 'Approved' : 'Rejected'} by {correction.approved_by}
                                                {correction.approval_notes && ` • ${correction.approval_notes}`}
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>
                        </GlassCard>
                    )}
                </div>

                {/* Footer */}
                <div className="p-6 border-t border-gray-200 dark:border-white/10">
                    <button
                        onClick={onClose}
                        className="w-full px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-sm font-medium transition-colors"
                    >
                        Close
                    </button>
                </div>
            </div>
        </div>
    );
};

export default DayDetailsModal;
