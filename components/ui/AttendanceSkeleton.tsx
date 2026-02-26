import React from 'react';
import Skeleton from './Skeleton';

export const AttendanceOverviewSkeleton: React.FC = () => (
    <div className="space-y-8 animate-in fade-in duration-500">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[1, 2, 3, 4].map((i) => (
                <div key={i} className="p-6 bg-white/5 border border-white/5 rounded-[32px] space-y-3">
                    <Skeleton width="40%" height="10px" />
                    <Skeleton width="60%" height="24px" />
                </div>
            ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 p-8 bg-white/5 border border-white/5 rounded-[40px] h-[400px]">
                <Skeleton width="150px" height="20px" className="mb-8" />
                <div className="space-y-4">
                    {[1, 2, 3, 4, 5].map((i) => (
                        <Skeleton key={i} height="40px" />
                    ))}
                </div>
            </div>
            <div className="p-8 bg-white/5 border border-white/5 rounded-[40px] h-[400px] space-y-6">
                <Skeleton width="120px" height="20px" />
                <Skeleton variant="circle" width="160px" height="160px" className="mx-auto" />
                <div className="space-y-3">
                    <Skeleton height="12px" />
                    <Skeleton width="80%" height="12px" />
                </div>
            </div>
        </div>
    </div>
);

export const AttendanceSettingsSkeleton: React.FC = () => (
    <div className="grid grid-cols-1 xl:grid-cols-12 gap-8 animate-in fade-in duration-500">
        <div className="xl:col-span-4 p-8 bg-white/5 border border-white/5 rounded-[40px] space-y-6">
            <Skeleton width="60%" height="24px" />
            <div className="space-y-4">
                {[1, 2, 3, 4].map((i) => (
                    <div key={i} className="flex gap-4 items-center p-4 bg-white/5 rounded-2xl">
                        <Skeleton variant="circle" width="40px" height="40px" />
                        <div className="flex-1 space-y-2">
                            <Skeleton width="50%" height="12px" />
                            <Skeleton width="30%" height="8px" />
                        </div>
                    </div>
                ))}
            </div>
        </div>
        <div className="xl:col-span-8 p-8 bg-white/5 border border-white/5 rounded-[40px] space-y-8">
            <div className="flex justify-between">
                <Skeleton width="200px" height="24px" />
                <Skeleton width="120px" height="40px" className="rounded-2xl" />
            </div>
            <Skeleton height="500px" className="!rounded-[32px]" />
        </div>
    </div>
);

export const AttendanceTableSkeleton: React.FC = () => (
    <div className="bg-white/5 border border-white/5 rounded-[40px] overflow-hidden animate-in fade-in duration-500">
        <div className="p-8 border-b border-white/5 flex gap-6">
            {[1, 2, 3, 4, 5].map((i) => (
                <Skeleton key={i} width="120px" height="16px" />
            ))}
        </div>
        <div className="p-8 space-y-6">
            {[1, 2, 3, 4, 5, 6].map((i) => (
                <div key={i} className="flex gap-6 items-center">
                    <Skeleton variant="circle" width="48px" height="48px" />
                    <div className="flex-1 grid grid-cols-4 gap-6">
                        <Skeleton height="14px" />
                        <Skeleton height="14px" />
                        <Skeleton height="14px" />
                        <Skeleton height="14px" />
                    </div>
                </div>
            ))}
        </div>
    </div>
);

const AttendanceSkeleton: React.FC<{ type?: 'overview' | 'settings' | 'table' }> = ({ type = 'table' }) => {
    switch (type) {
        case 'overview': return <AttendanceOverviewSkeleton />;
        case 'settings': return <AttendanceSettingsSkeleton />;
        default: return <AttendanceTableSkeleton />;
    }
};

export default AttendanceSkeleton;
