import React, { useState, useEffect } from 'react';
import GlassCard from '../../../../components/GlassCard';
import { MapPin, Navigation, Signal, X, CheckCircle, XCircle } from 'lucide-react';
import { getRobustLocation } from '../../../../services/geolocationService';

interface TestValidationModalProps {
    isOpen: boolean;
    onClose: () => void;
    targetLat: number;
    targetLng: number;
    radius: number;
}

const TestValidationModal: React.FC<TestValidationModalProps> = ({
    isOpen,
    onClose,
    targetLat,
    targetLng,
    radius
}) => {
    const [currentPos, setCurrentPos] = useState<GeolocationPosition | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [distance, setDistance] = useState<number | null>(null);
    const [retryKey, setRetryKey] = useState(0);
    const [useHighAccuracy, setUseHighAccuracy] = useState(true);
    const [logs, setLogs] = useState<string[]>([]);

    const addLog = (msg: string) => {
        setLogs(prev => [msg, ...prev].slice(0, 5));
    };

    const getErrorMessage = (err: GeolocationPositionError) => {
        switch (err.code) {
            case 1: return "Permission denied. Please enable location access.";
            case 2: return "Position unavailable. No signal detected.";
            case 3: return "Timeout. Retrying with low-accuracy...";
            default: return err.message || "Unknown error.";
        }
    };

    useEffect(() => {
        if (isOpen) {
            if (!navigator.geolocation) {
                setError("Geolocation is not supported.");
                return;
            }

            setError(null);
            addLog(`Starting sync (Auto-fallback enabled)...`);

            const getPos = async () => {
                try {
                    const loc = await getRobustLocation({ enableHighAccuracy: useHighAccuracy, timeout: 15000 });
                    setCurrentPos({ coords: loc } as any);
                    const dist = calculateDistance(
                        loc.latitude,
                        loc.longitude,
                        Number(targetLat),
                        Number(targetLng)
                    );
                    setDistance(dist);
                    setError(null);
                    addLog(`Lock found at ${loc.accuracy.toFixed(0)}m accuracy`);
                } catch (err: any) {
                    console.error("Geolocation error:", err);
                    addLog(`Error: ${getErrorMessage(err)}`);
                    setError(getErrorMessage(err));
                }
            };

            getPos();
            const intervalId = setInterval(getPos, 5000);

            return () => clearInterval(intervalId);
        } else {
            setCurrentPos(null);
            setDistance(null);
            setError(null);
            setLogs([]);
            setUseHighAccuracy(true);
        }
    }, [isOpen, targetLat, targetLng, retryKey, useHighAccuracy]);

    const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number) => {
        const R = 6371e3; // meters
        const phi1 = (lat1 * Math.PI) / 180;
        const phi2 = (lat2 * Math.PI) / 180;
        const deltaPhi = ((lat2 - lat1) * Math.PI) / 180;
        const deltaLambda = ((lon2 - lon1) * Math.PI) / 180;

        const a = Math.sin(deltaPhi / 2) * Math.sin(deltaPhi / 2) +
            Math.cos(phi1) * Math.cos(phi2) *
            Math.sin(deltaLambda / 2) * Math.sin(deltaLambda / 2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

        return R * c;
    };

    if (!isOpen) return null;

    const isInside = distance !== null && distance <= radius;

    return (
        <div
            className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-300"
            onClick={onClose}
        >
            <div
                className="w-full max-w-md bg-white dark:bg-[#0d0a1a] rounded-3xl border border-slate-200 dark:border-white/10 shadow-2xl p-6 relative overflow-hidden"
                onClick={(e) => e.stopPropagation()}
            >
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-purple-500 to-indigo-500" />

                <button onClick={onClose} className="absolute top-4 right-4 p-2 hover:bg-slate-100 dark:hover:bg-white/5 rounded-xl transition-all">
                    <X className="w-4 h-4 text-slate-400" />
                </button>

                <div className="space-y-6">
                    <div className="text-center">
                        <h3 className="text-lg font-black uppercase tracking-tight text-slate-900 dark:text-white italic">Geofence Validation <span className="text-purple-500">Test</span></h3>
                        <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mt-1">Real-time Location Synchronization</p>
                    </div>

                    <div className="space-y-4">
                        <div className={`p-6 rounded-2xl border flex flex-col items-center justify-center gap-3 transition-all ${isInside
                            ? 'bg-emerald-500/5 border-emerald-500/20 text-emerald-600'
                            : 'bg-red-500/5 border-red-500/20 text-red-500'
                            }`}>
                            {isInside ? <CheckCircle className="w-12 h-12" /> : <XCircle className="w-12 h-12" />}
                            <div className="text-center">
                                <p className="text-xl font-black uppercase tracking-tighter italic">
                                    {isInside ? 'Validated: Inside' : 'Restricted: Outside'}
                                </p>
                                <p className="text-[11px] font-bold opacity-70">
                                    {distance !== null ? `Distance: ${distance.toFixed(1)} meters` : 'Calculating...'}
                                </p>
                            </div>
                        </div>

                        {/* Status Feed */}
                        <div className="bg-slate-50 dark:bg-white/5 rounded-2xl p-3 border border-slate-200 dark:border-white/10">
                            <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-2 flex items-center gap-1.5">
                                <span className="w-1 h-1 rounded-full bg-slate-400 animate-pulse" />
                                Hardware Diagnostic Feed
                            </p>
                            <div className="space-y-1">
                                {logs.length === 0 && <p className="text-[10px] text-slate-500 italic">Initializing signal handlers...</p>}
                                {logs.map((log, i) => (
                                    <p key={i} className={`text-[10px] font-bold ${i === 0 ? 'text-purple-500' : 'text-slate-500'}`}>
                                        {i === 0 ? '> ' : '  '}{log}
                                    </p>
                                ))}
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="p-4 bg-slate-50 dark:bg-white/5 rounded-2xl border border-slate-200 dark:border-white/10 text-center">
                                <Navigation className="w-4 h-4 mx-auto mb-2 text-purple-500" />
                                <p className="text-[10px] font-black text-slate-500 uppercase">Your Pos</p>
                                <p className="text-[11px] font-black text-slate-900 dark:text-white mt-1">
                                    {currentPos ? `${currentPos.coords.latitude.toFixed(4)}, ${currentPos.coords.longitude.toFixed(4)}` : 'Wait...'}
                                </p>
                            </div>
                            <div className="p-4 bg-slate-50 dark:bg-white/5 rounded-2xl border border-slate-200 dark:border-white/10 text-center">
                                <Signal className="w-4 h-4 mx-auto mb-2 text-purple-500" />
                                <p className="text-[10px] font-black text-slate-500 uppercase">
                                    Accuracy {useHighAccuracy ? '(Fine)' : '(Coarse)'}
                                </p>
                                <p className="text-[11px] font-black text-slate-900 dark:text-white mt-1">
                                    ±{currentPos ? currentPos.coords.accuracy.toFixed(1) : '0'}m
                                </p>
                            </div>
                        </div>

                        {error && (
                            <div className="flex flex-col gap-2">
                                <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-xl text-[10px] font-bold text-red-500 text-center">
                                    Error: {error}
                                </div>
                                <button
                                    onClick={() => setRetryKey(k => k + 1)}
                                    className="text-[10px] font-black uppercase tracking-widest text-purple-500 hover:text-purple-600 transition-all underline decoration-purple-500/30"
                                >
                                    Retry Connection
                                </button>
                            </div>
                        )}
                    </div>

                    <button
                        onClick={onClose}
                        className="w-full bg-slate-100 dark:bg-white/5 hover:bg-slate-200 dark:hover:bg-white/10 text-slate-600 dark:text-slate-300 font-black uppercase tracking-widest text-[11px] py-3 rounded-2xl transition-all"
                    >
                        End Test Session
                    </button>
                </div>
            </div>
        </div>
    );
};

export default TestValidationModal;
