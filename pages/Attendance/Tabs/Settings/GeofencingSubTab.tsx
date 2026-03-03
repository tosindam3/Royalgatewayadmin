import React, { useState } from 'react';
import GlassCard from '../../../../components/GlassCard';
import MapPanel from '../../../../components/attendance/Settings/Geofencing/MapPanel';
import { GeofenceList } from '../../../../components/attendance/Settings/Geofencing/GeofenceList';
import { ConfigForm } from '../../../../components/attendance/Settings/Geofencing/ConfigForm';
import TestValidationModal from '../../../../components/attendance/Settings/Geofencing/TestValidationModal';
import { useGeofences, useCreateGeofence, useUpdateGeofence, useDeleteGeofence } from '../../../../hooks/useAttendanceSettings';
import { Search, MapPin, Plus, Layers, TestTube } from 'lucide-react';

const GeofencingSubTab: React.FC = () => {
    const { data: zones = [], isLoading } = useGeofences();
    const createMutation = useCreateGeofence();
    const updateMutation = useUpdateGeofence();
    const deleteMutation = useDeleteGeofence();

    const [isTestModalOpen, setIsTestModalOpen] = useState(false);
    const [selectedZone, setSelectedZone] = useState<any>(null);
    const [validationError, setValidationError] = useState<string | null>(null);
    const [formData, setFormData] = useState({
        name: '',
        latitude: 6.5244,
        longitude: 3.3792,
        radius: 100,
        isActive: true,
        isStrict: true,
        allowWeb: true,
        allowApp: true,
        branch_id: null as number | null
    });

    const handleLocationChange = (lat: number, lng: number) => {
        setFormData(prev => ({ ...prev, latitude: lat, longitude: lng }));
    };

    const handleSave = () => {
        // Clear previous errors
        setValidationError(null);

        // Validate form
        if (!formData.name || formData.name.trim() === '') {
            setValidationError('Zone name is required');
            return;
        }

        if (formData.radius < 10 || formData.radius > 10000) {
            setValidationError('Radius must be between 10 and 10,000 meters');
            return;
        }

        // Transform camelCase to snake_case for API
        const apiData = {
            name: formData.name,
            latitude: formData.latitude,
            longitude: formData.longitude,
            radius: formData.radius,
            geometry_type: 'circle',
            is_active: formData.isActive,
            is_strict: formData.isStrict,
            allow_web: formData.allowWeb,
            allow_app: formData.allowApp,
            branch_id: formData.branch_id
        };

        if (selectedZone) {
            updateMutation.mutate({ id: selectedZone.id, data: apiData }, {
                onError: (error: any) => {
                    const errorMsg = error?.response?.data?.message || 'Failed to update geofence zone';
                    setValidationError(errorMsg);
                }
            });
        } else {
            createMutation.mutate(apiData, {
                onSuccess: () => {
                    resetForm();
                },
                onError: (error: any) => {
                    const errorMsg = error?.response?.data?.message || 'Failed to create geofence zone';
                    setValidationError(errorMsg);
                }
            });
        }
    };

    const resetForm = () => {
        setSelectedZone(null);
        setValidationError(null);
        setFormData({
            name: '',
            latitude: 6.5244,
            longitude: 3.3792,
            radius: 100,
            isActive: true,
            isStrict: true,
            allowWeb: true,
            allowApp: true,
            branch_id: null
        });
    };

    return (
        <div className="grid grid-cols-1 xl:grid-cols-12 gap-6">
            {/* Left Panel: Zones List */}
            <div className="xl:col-span-4 space-y-6">
                <GlassCard
                    title="Geofence Zones"
                    action={
                        <button onClick={resetForm} className="p-2 hover:bg-slate-100 dark:hover:bg-white/5 rounded-xl transition-all">
                            <Plus className="w-4 h-4 text-purple-500" />
                        </button>
                    }
                >
                    <div className="space-y-4">
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
                            <input
                                type="text"
                                placeholder="Search zones..."
                                className="w-full bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl py-2 pl-9 pr-4 text-[11px] text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500/10"
                            />
                        </div>
                        <GeofenceList
                            zones={zones}
                            onEdit={(z) => {
                                setSelectedZone(z);
                                // Transform snake_case from API to camelCase for form
                                // Ensure numbers are parsed correctly
                                setFormData({
                                    name: z.name,
                                    latitude: typeof z.latitude === 'string' ? parseFloat(z.latitude) : z.latitude,
                                    longitude: typeof z.longitude === 'string' ? parseFloat(z.longitude) : z.longitude,
                                    radius: typeof z.radius === 'string' ? parseInt(z.radius) : z.radius,
                                    isActive: z.is_active ?? z.isActive ?? true,
                                    isStrict: z.is_strict ?? z.isStrict ?? true,
                                    allowWeb: z.allow_web ?? z.allowWeb ?? true,
                                    allowApp: z.allow_app ?? z.allowApp ?? true,
                                    branch_id: z.branch_id
                                });
                            }}
                            onDelete={(id) => deleteMutation.mutate(id)}
                            onToggle={(id) => {
                                const zone = zones.find(z => z.id === id);
                                if (zone) {
                                    const currentStatus = (zone as any).is_active ?? zone.isActive ?? true;
                                    updateMutation.mutate({ id, data: { is_active: !currentStatus } });
                                }
                            }}
                        />
                    </div>
                </GlassCard>
            </div>

            {/* Right Panel: Map & Config */}
            <div className="xl:col-span-8 space-y-6">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <div className="space-y-4">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <MapPin className="w-4 h-4 text-purple-500" />
                                <h3 className="text-xs font-black uppercase tracking-widest text-slate-900 dark:text-white">Boundary Map</h3>
                            </div>
                            <div className="text-[10px] font-bold text-slate-500 italic">
                                {Number(formData.latitude).toFixed(6)}, {Number(formData.longitude).toFixed(6)}
                            </div>
                        </div>
                        <MapPanel
                            center={[Number(formData.latitude), Number(formData.longitude)]}
                            radius={Number(formData.radius)}
                            onLocationChange={handleLocationChange}
                        />
                    </div>

                    <div className="space-y-4">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <Layers className="w-4 h-4 text-purple-500" />
                                <h3 className="text-xs font-black uppercase tracking-widest text-slate-900 dark:text-white">
                                    {selectedZone ? 'Edit Zone Rules' : 'New Zone Configuration'}
                                </h3>
                            </div>
                            <button
                                onClick={() => setIsTestModalOpen(true)}
                                className="flex items-center gap-2 px-3 py-1.5 bg-purple-500/10 text-purple-500 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-purple-500/20 transition-all border border-purple-500/20"
                            >
                                <TestTube className="w-3 h-3" />
                                Test Validation
                            </button>
                        </div>
                        <GlassCard>
                            <ConfigForm
                                data={formData}
                                onChange={setFormData}
                                onSave={handleSave}
                                error={validationError}
                                isLoading={createMutation.isPending || updateMutation.isPending}
                            />
                        </GlassCard>
                    </div>
                </div>
            </div>

            <TestValidationModal
                isOpen={isTestModalOpen}
                onClose={() => setIsTestModalOpen(false)}
                targetLat={formData.latitude}
                targetLng={formData.longitude}
                radius={formData.radius}
            />
        </div>
    );
};

export default GeofencingSubTab;
