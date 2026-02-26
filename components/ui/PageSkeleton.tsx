import React from 'react';
import Skeleton from './Skeleton';

const PageSkeleton: React.FC = () => {
    return (
        <div className="space-y-8 animate-in fade-in duration-500">
            <div className="flex justify-between items-center">
                <div className="space-y-2">
                    <Skeleton width="200px" height="32px" />
                    <Skeleton width="150px" height="12px" />
                </div>
                <div className="flex gap-3">
                    <Skeleton width="120px" height="40px" />
                    <Skeleton width="140px" height="40px" />
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                {[1, 2, 3, 4].map((i) => (
                    <Skeleton key={i} height="120px" className="!p-0" />
                ))}
            </div>

            <div className="bg-white/5 border border-white/5 rounded-[32px] overflow-hidden">
                <div className="p-6 border-b border-white/5">
                    <Skeleton width="300px" height="20px" />
                </div>
                <div className="p-6 space-y-4">
                    {[1, 2, 3, 4, 5].map((i) => (
                        <div key={i} className="flex gap-4 items-center">
                            <Skeleton variant="circle" width="40px" height="40px" />
                            <div className="flex-1 space-y-2">
                                <Skeleton width="40%" height="12px" />
                                <Skeleton width="20%" height="8px" />
                            </div>
                            <Skeleton width="80px" height="20px" />
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default PageSkeleton;
