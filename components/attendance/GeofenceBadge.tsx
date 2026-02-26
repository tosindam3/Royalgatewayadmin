import React from 'react';
import { CheckCircle, XCircle, MinusCircle, Circle } from 'lucide-react';

interface GeofenceBadgeProps {
    status: 'pass' | 'fail' | 'bypass' | 'na';
    size?: 'sm' | 'md';
}

const GeofenceBadge: React.FC<GeofenceBadgeProps> = ({ status, size = 'sm' }) => {
    const config = {
        pass: {
            icon: CheckCircle,
            color: 'text-green-600 dark:text-green-400',
            label: 'Pass',
        },
        fail: {
            icon: XCircle,
            color: 'text-red-600 dark:text-red-400',
            label: 'Fail',
        },
        bypass: {
            icon: MinusCircle,
            color: 'text-yellow-600 dark:text-yellow-400',
            label: 'Bypass',
        },
        na: {
            icon: Circle,
            color: 'text-gray-400 dark:text-gray-600',
            label: 'N/A',
        },
    };

    const { icon: Icon, color, label } = config[status];
    const iconSize = size === 'sm' ? 'w-4 h-4' : 'w-5 h-5';

    return (
        <span className={`inline-flex items-center gap-1 ${color}`} title={label}>
            <Icon className={iconSize} />
            {size === 'md' && <span className="text-xs">{label}</span>}
        </span>
    );
};

export default GeofenceBadge;
