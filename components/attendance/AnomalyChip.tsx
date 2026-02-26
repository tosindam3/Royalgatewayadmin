import React from 'react';
import { AlertCircle, MapPin, Copy, Edit3 } from 'lucide-react';

interface AnomalyChipProps {
    type: 'missing_punch' | 'geofence_fail' | 'duplicate' | 'edited';
    count?: number;
}

const AnomalyChip: React.FC<AnomalyChipProps> = ({ type, count }) => {
    const config = {
        missing_punch: {
            icon: AlertCircle,
            label: 'Missing Punch',
            color: 'bg-orange-100 dark:bg-orange-900/20 text-orange-700 dark:text-orange-400',
        },
        geofence_fail: {
            icon: MapPin,
            label: 'Geofence Fail',
            color: 'bg-red-100 dark:bg-red-900/20 text-red-700 dark:text-red-400',
        },
        duplicate: {
            icon: Copy,
            label: 'Duplicate',
            color: 'bg-yellow-100 dark:bg-yellow-900/20 text-yellow-700 dark:text-yellow-400',
        },
        edited: {
            icon: Edit3,
            label: 'Edited',
            color: 'bg-blue-100 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400',
        },
    };

    const { icon: Icon, label, color } = config[type];

    return (
        <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${color}`}>
            <Icon className="w-3 h-3" />
            {label}
            {count !== undefined && count > 0 && (
                <span className="ml-1 font-bold">{count}</span>
            )}
        </span>
    );
};

export default AnomalyChip;
