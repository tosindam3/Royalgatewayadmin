import React, { useState, useEffect } from 'react';
import { useAttendanceStore } from '../../stores/attendanceStore';
import { useTodayStatus, useCheckIn, useCheckOut } from '../../hooks/useAttendance';
import { useGeofences, useIPWhitelist, useMyIP } from '../../hooks/useAttendanceSettings';
import {
    X,
    Clock,
    MapPin,
    Shield,
    Monitor,
    Smartphone,
    CheckCircle2,
    XCircle,
    Loader2,
    Lock,
    Unlock,
    AlertTriangle
} from 'lucide-react';
import { toast } from 'sonner';
import { getRobustLocation } from '../../services/geolocationService';

interface AttendanceClockModalProps {
    isOpen: boolean;
    onClose: () => void;
}

const AttendanceClockModal: React.FC<AttendanceClockModalProps> = ({ isOpen, onClose }) => {
    const { today, setToday, currentPosition, isLocationAllowed, setPosition, setLocationAllowed } = useAttendanceStore();
    const { data: geofences = [] } = useGeofences();
    const { data: whitelist = [] } = useIPWhitelist();
    const { data: myIpData } = useMyIP();

    const { data: freshToday, refetch: refetchToday } = useTodayStatus();
    const checkInMutation = useCheckIn();
    const checkOutMutation = useCheckOut();

    const [isValidating, setIsValidating] = useState(false);
    const [restrictionSource, setRestrictionSource] = useState<'NONE' | 'GEOFENCE' | 'IP'>('NONE');
    const [errorMsg, setErrorMsg] = useState<string | null>(null);
    const [currentTime, setCurrentTime] = useState(new Date());

    // Sync store with fresh data
    useEffect(() => {
        if (freshToday) setToday(freshToday);
    }, [freshToday, setToday]);

    // Dynamic Clock
    useEffect(() => {
        const timer = setInterval(() => setCurrentTime(new Date()), 1000);
        return () => clearInterval(timer);
    }, []);

    // Policy Enforcement Logic
    useEffect(() => {
        if (isOpen) {
            validatePolicy();
        }
    }, [isOpen, geofences, whitelist, myIpData]);

    const validatePolicy = async () => {
        setIsValidating(true);
        setRestrictionSource('NONE');
        setErrorMsg(null);

        // 1. IP Validation
        if (whitelist.length > 0 && myIpData) {
            const isWhitelisted = whitelist.some(entry => entry.value === myIpData.ip || entry.value.includes(myIpData.ip));
            if (!isWhitelisted) {
                setRestrictionSource('IP');
                setErrorMsg('Network: Unauthorized Access Node.');
                setIsValidating(false);
                return;
            }
        }

        // 2. Geofence Validation
        try {
            const loc = await getRobustLocation();
            const lat = loc.latitude;
            const lng = loc.longitude;
            setPosition({ lat, lng, accuracy: loc.accuracy });
            setLocationAllowed(true);

            const matchedZone = geofences.find(zone => {
                const dist = calculateDistance(lat, lng, Number(zone.latitude), Number(zone.longitude));
                return dist <= Number(zone.radius);
            });

            if (!matchedZone && geofences.length > 0) {
                setRestrictionSource('GEOFENCE');
                setErrorMsg('Boundary: Outside Operations Zone.');
            }
        } catch (err: any) {
            setLocationAllowed(false);
            if (err.code === 1) {
                setErrorMsg('Hardware: Location Access Denied.');
            } else {
                setErrorMsg('Hardware: Signal Lock Required.');
            }
        } finally {
            setIsValidating(false);
        }
    };

    const handleClockAction = async () => {
        if (isValidating || checkInMutation.isPending || checkOutMutation.isPending) return;

        const formData = new FormData();
        if (currentPosition) {
            formData.append('latitude', currentPosition.lat.toString());
            formData.append('longitude', currentPosition.lng.toString());
            formData.append('accuracy', currentPosition.accuracy.toString());
        }
        formData.append('source', 'web_app');
        formData.append('device_type', 'browser');

        try {
            if (isCheckedIn) {
                await checkOutMutation.mutateAsync(formData);
                toast.success('Synchronization Complete: Clock-Out Recorded');
            } else {
                await checkInMutation.mutateAsync(formData);
                toast.success('Synchronization Complete: Clock-In Recorded');
            }
            // Vital: refresh local state
            await refetchToday();
            onClose();
        } catch (error: any) {
            toast.error(error?.response?.data?.message || 'Sync Failure: Identity Rejected');
        }
    };

    const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number) => {
        const R = 6371e3;
        const phi1 = lat1 * Math.PI / 180;
        const phi2 = lat2 * Math.PI / 180;
        const deltaPhi = (lat2 - lat1) * Math.PI / 180;
        const deltaLambda = (lon2 - lon1) * Math.PI / 180;
        const a = Math.sin(deltaPhi / 2) * Math.sin(deltaPhi / 2) +
            Math.cos(phi1) * Math.cos(phi2) *
            Math.sin(deltaLambda / 2) * Math.sin(deltaLambda / 2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        return R * c;
    };

    if (!isOpen) return null;

    const isBlocked = restrictionSource !== 'NONE' || !isLocationAllowed;
    const isCheckedIn = today?.checked_in;

    return (
        <div className="fixed inset-0 z-[999] overflow-y-auto bg-slate-900/40 dark:bg-slate-900/80 backdrop-blur-md dark:backdrop-blur-xl animate-in fade-in duration-500">
            <div className="min-h-full flex items-center justify-center p-4">
                <div className="w-full max-w-md bg-white dark:bg-[#0a0a0f] rounded-[3rem] border border-slate-200 dark:border-white/5 shadow-2xl dark:shadow-[0_0_50px_rgba(0,0,0,0.5)] relative overflow-hidden group my-auto">
                    {/* Cyber Scanline Effect - only visible in dark mode to maintain professional light mode */}
                    <div className="absolute inset-0 pointer-events-none opacity-[0.03] dark:opacity-[0.03] bg-[linear-gradient(rgba(18,16,33,0)_50%,rgba(0,0,0,0.1)_50%),linear-gradient(90deg,rgba(0,0,0,0.02),rgba(0,0,0,0.01),rgba(0,0,0,0.02))] dark:bg-[linear-gradient(rgba(18,16,33,0)_50%,rgba(0,0,0,0.25)_50%),linear-gradient(90deg,rgba(255,0,0,0.06),rgba(0,255,0,0.02),rgba(0,0,255,0.06))] bg-[length:100%_4px,3px_100%]" />

                    {/* Dynamic Ambient Glow */}
                    <div className={`absolute -top-32 -right-32 w-80 h-80 blur-[100px] rounded-full opacity-20 dark:opacity-30 transition-all duration-1000 ${isBlocked ? 'bg-red-500 animate-pulse' : isCheckedIn ? 'bg-amber-500' : 'bg-purple-500'}`} />
                    <div className={`absolute -bottom-32 -left-32 w-80 h-80 blur-[100px] rounded-full opacity-10 dark:opacity-20 transition-all duration-1000 ${isCheckedIn ? 'bg-orange-500' : 'bg-indigo-500'}`} />

                    <div className="p-8 md:p-10 relative">
                        <button onClick={onClose} className="absolute top-6 right-6 md:top-8 md:right-8 p-2.5 bg-slate-100 dark:bg-white/5 hover:bg-slate-200 dark:hover:bg-white/10 border border-slate-200 dark:border-white/10 rounded-2xl transition-all group/close z-20">
                            <X className="w-5 h-5 text-slate-400 group-hover:text-slate-900 dark:group-hover:text-white group-hover:rotate-90 transition-all" />
                        </button>

                        <div className="text-center mb-8 md:mb-10">
                            <div className="inline-flex items-center gap-2 px-3 py-1 bg-purple-50 dark:bg-white/5 rounded-full border border-purple-100 dark:border-white/10 mb-4">
                                <span className="w-1.5 h-1.5 rounded-full bg-purple-500 animate-ping" />
                                <span className="text-[9px] font-black uppercase tracking-[0.2em] text-purple-600 dark:text-purple-400">Secure System Connection</span>
                            </div>
                            <h3 className="text-2xl md:text-3xl font-black uppercase tracking-tighter italic text-slate-900 dark:text-white flex items-center justify-center gap-3">
                                <Clock className="w-7 h-7 md:w-8 md:h-8 text-purple-500" />
                                <span>Attendance <span className="text-purple-500">System</span></span>
                            </h3>
                        </div>

                        {/* Time Display */}
                        <div className="mb-8 md:mb-10 relative">
                            <div className="absolute inset-0 bg-purple-500/5 blur-3xl opacity-50" />
                            <div className="relative flex flex-col items-center justify-center py-8 md:py-10 bg-slate-50 dark:bg-white/5 rounded-[2.5rem] border border-slate-200 dark:border-white/10 shadow-inner dark:shadow-2xl backdrop-blur-md overflow-hidden">
                                <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(130,82,233,0.05),transparent)] dark:bg-[radial-gradient(circle_at_center,rgba(130,82,233,0.1),transparent)] pointer-events-none" />

                                <div className="flex items-center gap-1.5 mb-2">
                                    <Clock className="w-3.5 h-3.5 text-purple-500 dark:text-purple-400" />
                                    <span className="text-[9px] font-black uppercase tracking-widest text-slate-500 dark:text-slate-500">Current Time</span>
                                </div>

                                <div className="flex items-baseline gap-1">
                                    <span className="text-5xl md:text-6xl font-black tracking-tighter tabular-nums text-slate-900 dark:text-white drop-shadow-sm dark:drop-shadow-[0_0_15px_rgba(255,255,255,0.3)]">
                                        {currentTime.getHours().toString().padStart(2, '0')}:{currentTime.getMinutes().toString().padStart(2, '0')}
                                    </span>
                                    <span className="text-xl md:text-2xl font-black text-purple-600 dark:text-purple-500 tabular-nums mb-1">
                                        {currentTime.getSeconds().toString().padStart(2, '0')}
                                    </span>
                                </div>

                                <div className="mt-4 px-4 py-1.5 bg-white dark:bg-white/5 rounded-xl border border-slate-200 dark:border-white/5">
                                    <p className="text-[10px] md:text-[11px] font-black uppercase tracking-[0.1em] text-slate-500 dark:text-slate-400 italic">
                                        {currentTime.toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })}
                                    </p>
                                </div>
                            </div>
                        </div>

                        {/* Status Matrix */}
                        <div className="grid grid-cols-2 gap-3 md:gap-4 mb-8 md:mb-10">
                            <div className={`group/matrix p-3 md:p-4 rounded-3xl border transition-all duration-500 ${restrictionSource === 'GEOFENCE' ? 'bg-red-500/10 border-red-500/20' : 'bg-emerald-500/5 border-emerald-500/10'}`}>
                                <div className="flex items-center gap-2 mb-2">
                                    <div className={`p-1 rounded-lg ${restrictionSource === 'GEOFENCE' ? 'bg-red-500 text-white' : 'bg-emerald-500 text-white'}`}>
                                        <MapPin className="w-3 h-3" />
                                    </div>
                                    <span className="text-[9px] font-black uppercase tracking-widest text-slate-500 group-hover/matrix:text-slate-900 dark:group-hover/matrix:text-white transition-colors">Location</span>
                                </div>
                                <p className={`text-[10px] md:text-[11px] font-black uppercase italic ${restrictionSource === 'GEOFENCE' ? 'text-red-500' : 'text-emerald-500'}`}>
                                    {restrictionSource === 'GEOFENCE' ? 'Out of Range' : 'In Range'}
                                </p>
                            </div>
                            <div className={`group/matrix p-3 md:p-4 rounded-3xl border transition-all duration-500 ${restrictionSource === 'IP' ? 'bg-red-500/10 border-red-500/20' : 'bg-emerald-500/5 border-emerald-500/10'}`}>
                                <div className="flex items-center gap-2 mb-2">
                                    <div className={`p-1 rounded-lg ${restrictionSource === 'IP' ? 'bg-red-500 text-white' : 'bg-emerald-500 text-white'}`}>
                                        <Shield className="w-3 h-3" />
                                    </div>
                                    <span className="text-[9px] font-black uppercase tracking-widest text-slate-500 group-hover/matrix:text-slate-900 dark:group-hover/matrix:text-white transition-colors">Network</span>
                                </div>
                                <p className={`text-[10px] md:text-[11px] font-black uppercase italic ${restrictionSource === 'IP' ? 'text-red-500' : 'text-emerald-500'}`}>
                                    {restrictionSource === 'IP' ? 'Unauthorized' : 'Verified'}
                                </p>
                            </div>
                        </div>

                        {/* Action Area */}
                        <div className="space-y-4">
                            {isBlocked && !isValidating ? (
                                <div className="p-5 md:p-6 bg-red-50 dark:bg-red-500/5 border border-red-100 dark:border-red-500/10 rounded-[2.5rem] flex items-center gap-4 md:gap-5 group/error animate-in slide-in-from-top-4 duration-500">
                                    <div className="p-3 md:p-4 bg-red-500 text-white rounded-2xl shadow-[0_0_20px_rgba(239,68,68,0.3)]">
                                        <AlertTriangle className="w-5 h-5 md:w-6 md:h-6 animate-pulse" />
                                    </div>
                                    <div className="flex-1">
                                        <p className="text-[9px] md:text-[10px] font-black text-red-600 dark:text-red-500 uppercase tracking-widest mb-0.5">Validation Error</p>
                                        <p className="text-[11px] md:text-sm font-bold text-slate-700 dark:text-slate-200 leading-tight">{errorMsg}</p>
                                    </div>
                                </div>
                            ) : (
                                <button
                                    onClick={handleClockAction}
                                    disabled={isValidating || checkInMutation.isPending || checkOutMutation.isPending}
                                    className={`w-full py-6 md:py-7 rounded-[2.5rem] text-white font-black uppercase tracking-[0.2em] md:tracking-[0.3em] text-base md:text-lg shadow-2xl transition-all relative overflow-hidden group/btn ${isCheckedIn
                                        ? 'bg-amber-600 shadow-amber-500/20 hover:bg-amber-500'
                                        : 'bg-purple-600 shadow-purple-500/20 hover:bg-purple-500 hover:scale-[1.02]'
                                        } active:scale-95 disabled:opacity-50 disabled:grayscale`}
                                >
                                    <div className="relative flex items-center justify-center gap-3 md:gap-4 z-10">
                                        {(isValidating || checkInMutation.isPending || checkOutMutation.isPending) ? (
                                            <>
                                                <Loader2 className="w-6 h-6 md:w-7 md:h-7 animate-spin" />
                                                <span className="animate-pulse">Processing...</span>
                                            </>
                                        ) : (
                                            <>
                                                <Clock className="w-5 h-5 md:w-6 md:h-6" />
                                                <span>{isCheckedIn ? 'Clock Out' : 'Clock In'}</span>
                                            </>
                                        )}
                                    </div>
                                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover/btn:animate-[shimmer_1.5s_infinite] transition-all" />
                                </button>
                            )}

                            <button
                                onClick={onClose}
                                className="w-full text-[9px] md:text-[10px] font-black uppercase tracking-[0.3em] text-slate-400 dark:text-slate-600 hover:text-slate-900 dark:hover:text-white transition-all py-3 hover:bg-slate-100 dark:hover:bg-white/5 rounded-2xl"
                            >
                                Close Modal
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            <style dangerouslySetInnerHTML={{
                __html: `
                @keyframes shimmer {
                    100% { transform: translateX(100%); }
                }
            `}} />
        </div>
    );
};

export default AttendanceClockModal;
