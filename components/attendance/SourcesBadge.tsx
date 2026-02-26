import React from 'react';
import { Smartphone, Monitor, Upload } from 'lucide-react';

interface SourcesBadgeProps {
    sources: {
        app: number;
        device: number;
        import: number;
    };
    compact?: boolean;
}

const SourcesBadge: React.FC<SourcesBadgeProps> = ({ sources, compact = false }) => {
    if (compact) {
        return (
            <div className="flex items-center gap-2 text-xs text-slate-600 dark:text-gray-400">
                {sources.app > 0 && (
                    <span className="flex items-center gap-1">
                        <Smartphone className="w-3 h-3" />
                        {sources.app}
                    </span>
                )}
                {sources.device > 0 && (
                    <span className="flex items-center gap-1">
                        <Monitor className="w-3 h-3" />
                        {sources.device}
                    </span>
                )}
                {sources.import > 0 && (
                    <span className="flex items-center gap-1">
                        <Upload className="w-3 h-3" />
                        {sources.import}
                    </span>
                )}
            </div>
        );
    }

    return (
        <div className="flex flex-wrap gap-2 text-xs">
            <span className="inline-flex items-center gap-1 px-2 py-1 rounded-md bg-blue-100 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400">
                <Smartphone className="w-3 h-3" />
                App: {sources.app}
            </span>
            <span className="inline-flex items-center gap-1 px-2 py-1 rounded-md bg-purple-100 dark:bg-purple-900/20 text-purple-700 dark:text-purple-400">
                <Monitor className="w-3 h-3" />
                Device: {sources.device}
            </span>
            <span className="inline-flex items-center gap-1 px-2 py-1 rounded-md bg-green-100 dark:bg-green-900/20 text-green-700 dark:text-green-400">
                <Upload className="w-3 h-3" />
                Import: {sources.import}
            </span>
        </div>
    );
};

export default SourcesBadge;
