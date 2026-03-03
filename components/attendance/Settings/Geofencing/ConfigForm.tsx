import React, { useState } from 'react';
import { toast } from 'sonner';
import { Smartphone, Monitor, Navigation, Loader2, Building2 } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { organizationService } from '../../../../services/organizationService';
import { getRobustLocation } from '../../../../services/geolocationService';

interface ConfigFormProps {
    data: any;
    onChange: (data: any) => void;
    onSave: () => void;
    error?: string | null;
    isLoading?: boolean;
}

export const ConfigForm: React.FC<ConfigFormProps> = ({ data, onChange, onSave, error, isLoading }) => {
    const [isDetecting, setIsDetecting] = useState(false);

    // Fetch branches
    const { data: branches = [] } = useQuery({
        queryKey: ['branches'],
        queryFn: () => organizationService.getBranches({ per_page: 'all' }),
    });

    return (
        <div className="space-y-6">
            {error && (
                <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-xl">
                    <p className="text-xs font-medium text-red-600 dark:text-red-400">{error}</p>
                </div>
            )}

            <div className="space-y-6">
                <div>
                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-1.5 block">Branch Zone</label>
                    <div className="relative">
                        <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                        <select
                            value={data.branch_id || ''}
                            onChange={(e) => {
                                const branchId = e.target.value;
                                const selectedBranch = branches.find((b: any) => String(b.id) === branchId);
                                if (selectedBranch) {
                                    onChange({
                                        ...data,
                                        name: selectedBranch.name,
                                        branch_id: parseInt(branchId),
                                        latitude: selectedBranch.latitude || data.latitude,
                                        longitude: selectedBranch.longitude || data.longitude
                                    });
                                } else {
                                    onChange({ ...data, branch_id: null, name: '' });
                                }
                            }}
                            className="w-full bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl pl-10 pr-4 py-2.5 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500/20 transition-all appearance-none cursor-pointer"
                        >
                            <option value="">Select a Branch...</option>
                            {branches.map((branch: any) => (
                                <option key={branch.id} value={branch.id}>
                                    {branch.name}
                                </option>
                            ))}
                        </select>
                        <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none">
                            <svg className="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                            </svg>
                        </div>
                    </div>
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
                            setIsDetecting(true);
                            console.log("[DEBUG] ConfigForm Geolocation v2.1 triggered");
                            try {
                                const { latitude, longitude } = await getRobustLocation();
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
                            } catch (err: any) {
                                let errorMsg = "Hardware signal lost. Please check GPS permissions.";
                                if (err.code === 1) errorMsg = "Location access denied. Please enable permissions.";
                                if (err.code === 3) errorMsg = "Signal timeout. Please try again outside.";

                                toast.error("Telemetry Link Failed", { description: errorMsg });
                                console.error("[DEBUG] ConfigForm Geolocation Error:", err);
                            } finally {
                                setIsDetecting(false);
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
