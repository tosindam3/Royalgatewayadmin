import React, { useState } from 'react';
import { Smartphone, Monitor, Navigation, Loader2 } from 'lucide-react';

interface ConfigFormProps {
    data: any;
    onChange: (data: any) => void;
    onSave: () => void;
    error?: string | null;
    isLoading?: boolean;
}

export const ConfigForm: React.FC<ConfigFormProps> = ({ data, onChange, onSave, error, isLoading }) => {
    const [isDetecting, setIsDetecting] = useState(false);

    return (
        <div className="space-y-6">
            {error && (
                <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-xl">
                    <p className="text-xs font-medium text-red-600 dark:text-red-400">{error}</p>
                </div>
            )}

            <div className="space-y-6">
                <div>
                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-1.5 block">Zone Name</label>
                    <input
                        type="text"
                        placeholder="e.g. Headquarters, North Branch..."
                        value={data.name || ''}
                        onChange={(e) => onChange({ ...data, name: e.target.value })}
                        className="w-full bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl px-4 py-2.5 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500/20 transition-all"
                    />
                </div>

                <div className="grid grid-cols-2 gap-3">
                    <div>
                        <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-1.5 block">Latitude</label>
                        <input
                            type="number"
                            step="0.000001"
                            value={data.latitude}
                            onChange={(e) => onChange({ ...data, latitude: parseFloat(e.target.value) })}
                            className="w-full bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl px-4 py-2.5 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500/20 transition-all font-mono"
                        />
                    </div>
                    <div>
                        <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-1.5 block">Longitude</label>
                        <input
                            type="number"
                            step="0.000001"
                            value={data.longitude}
                            onChange={(e) => onChange({ ...data, longitude: parseFloat(e.target.value) })}
                            className="w-full bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl px-4 py-2.5 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500/20 transition-all font-mono"
                        />
                    </div>
                    <button
                        onClick={async () => {
                            if (navigator.geolocation) {
                                setIsDetecting(true);
                                navigator.geolocation.getCurrentPosition(async (pos) => {
                                    const { latitude, longitude } = pos.coords;
                                    let nameUpdate = data.name;

                                    if (!data.name || data.name.trim() === '') {
                                        try {
                                            const response = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}`);
                                            const geoData = await response.json();
                                            if (geoData.display_name) {
                                                nameUpdate = geoData.display_name.split(',')[0];
                                            }
                                        } catch (e) {
                                            console.error("Reverse geocode failed", e);
                                        }
                                    }

                                    onChange({
                                        ...data,
                                        latitude,
                                        longitude,
                                        name: nameUpdate
                                    });
                                    setIsDetecting(false);
                                }, (err) => {
                                    console.error("Detection failed:", err);
                                    setIsDetecting(false);
                                }, {
                                    enableHighAccuracy: true,
                                    timeout: 10000,
                                    maximumAge: 0
                                });
                            }
                        }}
                        disabled={isDetecting}
                        className="col-span-2 flex items-center justify-center gap-2 py-2 bg-slate-100 dark:bg-white/5 hover:bg-slate-200 dark:hover:bg-white/10 disabled:opacity-50 rounded-xl text-[10px] font-black uppercase tracking-widest text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-white/10 transition-all font-sans"
                    >
                        {isDetecting ? (
                            <>
                                <Loader2 className="w-3 h-3 animate-spin text-purple-500" />
                                <span>Locking Signal...</span>
                            </>
                        ) : (
                            <>
                                <Navigation className="w-3 h-3 text-purple-500" />
                                <span>Detect My Current Location</span>
                            </>
                        )}
                    </button>
                </div>

                <div>
                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-1.5 block">Radius ({data.radius}m)</label>
                    <input
                        type="range"
                        min="10"
                        max="1000"
                        step="10"
                        value={data.radius}
                        onChange={(e) => onChange({ ...data, radius: parseInt(e.target.value) })}
                        className="w-full accent-purple-500"
                    />
                </div>

                <div className="flex items-center justify-between p-4 bg-slate-50 dark:bg-white/5 rounded-2xl border border-slate-200 dark:border-white/10">
                    <div>
                        <p className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-tight">Active Status</p>
                        <p className="text-[9px] text-slate-500">Enable or disable this geofence zone</p>
                    </div>
                    <button
                        onClick={() => onChange({ ...data, isActive: !data.isActive })}
                        className={`w-10 h-6 rounded-full transition-all relative ${data.isActive ? 'bg-emerald-500' : 'bg-slate-300 dark:bg-white/10'}`}
                    >
                        <div className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-all ${data.isActive ? 'left-5' : 'left-1'}`} />
                    </button>
                </div>

                <div className="flex items-center justify-between p-4 bg-slate-50 dark:bg-white/5 rounded-2xl border border-slate-200 dark:border-white/10">
                    <div>
                        <p className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-tight">Strict Mode</p>
                        <p className="text-[9px] text-slate-500">Block clock-in if outside geofence</p>
                    </div>
                    <button
                        onClick={() => onChange({ ...data, isStrict: !data.isStrict })}
                        className={`w-10 h-6 rounded-full transition-all relative ${data.isStrict ? 'bg-purple-500' : 'bg-slate-300 dark:bg-white/10'}`}
                    >
                        <div className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-all ${data.isStrict ? 'left-5' : 'left-1'}`} />
                    </button>
                </div>

                <div className="space-y-3">
                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 block">Allowed Methods</label>
                    <div className="grid grid-cols-2 gap-2">
                        <button
                            onClick={() => onChange({ ...data, allowWeb: !data.allowWeb })}
                            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl border transition-all ${data.allowWeb
                                    ? 'bg-purple-500/10 border-purple-500 text-purple-500'
                                    : 'bg-transparent border-slate-200 dark:border-white/10 text-slate-500'
                                }`}
                        >
                            <Monitor className="w-4 h-4" />
                            <span className="text-[10px] font-black uppercase tracking-widest">Web</span>
                        </button>
                        <button
                            onClick={() => onChange({ ...data, allowApp: !data.allowApp })}
                            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl border transition-all ${data.allowApp
                                    ? 'bg-purple-500/10 border-purple-500 text-purple-500'
                                    : 'bg-transparent border-slate-200 dark:border-white/10 text-slate-500'
                                }`}
                        >
                            <Smartphone className="w-4 h-4" />
                            <span className="text-[10px] font-black uppercase tracking-widest">Mobile</span>
                        </button>
                    </div>
                </div>

                <button
                    onClick={onSave}
                    disabled={isLoading}
                    className="w-full bg-purple-500 hover:bg-purple-600 disabled:bg-gray-400 disabled:cursor-not-allowed text-white font-black uppercase tracking-widest text-[11px] py-3.5 rounded-2xl shadow-lg shadow-purple-500/20 transition-all outline-none"
                >
                    {isLoading ? 'Saving...' : 'Save Geofence Configuration'}
                </button>
            </div>
        </div>
    );
};
