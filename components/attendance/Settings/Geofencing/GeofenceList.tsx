import React from 'react';
import { GeofenceZone } from '@/types';
import { Edit2, Trash2, Copy, ToggleLeft, ToggleRight } from 'lucide-react';

interface GeofenceListProps {
    zones: GeofenceZone[];
    onEdit: (zone: GeofenceZone) => void;
    onDelete: (id: string) => void;
    onToggle: (id: string) => void;
}

export const GeofenceList: React.FC<GeofenceListProps> = ({ zones, onEdit, onDelete, onToggle }) => {
    return (
        <div className="overflow-x-auto">
            <table className="w-full text-left">
                <thead>
                    <tr className="border-b border-slate-100 dark:border-white/5 uppercase text-[10px] font-black tracking-widest text-slate-400">
                        <th className="px-4 py-3">Zone Name</th>
                        <th className="px-4 py-3">Radius (m)</th>
                        <th className="px-4 py-3">Status</th>
                        <th className="px-4 py-3 text-right">Actions</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-slate-50 dark:divide-white/5">
                    {zones.map((zone) => (
                        <tr key={zone.id} className="hover:bg-slate-50 dark:hover:bg-white/5 transition-colors">
                            <td className="px-4 py-4">
                                <p className="text-xs font-bold text-slate-900 dark:text-white">{zone.name}</p>
                            </td>
                            <td className="px-4 py-4">
                                <span className="text-[10px] font-black text-slate-500">{zone.radius}m</span>
                            </td>
                            <td className="px-4 py-4">
                                <button
                                    onClick={() => onToggle(zone.id)}
                                    className={`flex items-center gap-1.5 px-2 py-1 rounded-full text-[9px] font-black uppercase transition-all ${
                                        (zone.is_active ?? zone.isActive)
                                            ? 'bg-emerald-500/10 text-emerald-600'
                                            : 'bg-slate-500/10 text-slate-500'
                                    }`}
                                >
                                    {(zone.is_active ?? zone.isActive) ? <ToggleRight className="w-3 h-3" /> : <ToggleLeft className="w-3 h-3" />}
                                    {(zone.is_active ?? zone.isActive) ? 'Active' : 'Disabled'}
                                </button>
                            </td>
                            <td className="px-4 py-4 text-right">
                                <div className="flex items-center justify-end gap-2">
                                    <button onClick={() => onEdit(zone)} className="p-1.5 hover:bg-purple-500/10 hover:text-purple-500 rounded-lg transition-all">
                                        <Edit2 className="w-3.5 h-3.5" />
                                    </button>
                                    <button onClick={() => onDelete(zone.id)} className="p-1.5 hover:bg-red-500/10 hover:text-red-500 rounded-lg transition-all">
                                        <Trash2 className="w-3.5 h-3.5" />
                                    </button>
                                </div>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
};
