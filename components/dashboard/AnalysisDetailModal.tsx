
import React from 'react';
import GlassCard from '../GlassCard';
import { X } from 'lucide-react';

interface AnalysisDetailModalProps {
    isOpen: boolean;
    onClose: () => void;
    title: string;
    data: any;
    recommendations?: string;
}

const AnalysisDetailModal: React.FC<AnalysisDetailModalProps> = ({
    isOpen,
    onClose,
    title,
    data,
    recommendations
}) => {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-300">
            <div className="w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col glass rounded-[32px] border border-white/10 shadow-2xl animate-in zoom-in-95 duration-300">
                {/* Header */}
                <div className="flex items-center justify-between p-8 border-b border-white/5">
                    <div>
                        <h2 className="text-2xl font-black text-slate-900 dark:text-white uppercase tracking-tighter italic">
                            Deep Analysis: <span className="text-[#8252e9]">{title}</span>
                        </h2>
                        <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mt-1">Data-driven insights and recommendations</p>
                    </div>
                    <button
                        onClick={onClose}
                        className="w-10 h-10 flex items-center justify-center rounded-xl bg-white/5 text-slate-400 hover:text-white hover:bg-white/10 transition-all"
                    >
                        <X size={20} />
                    </button>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-8 space-y-8 no-scrollbar">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {/* Detailed Stats could go here based on data */}
                        {data?.stats?.map((s: any, i: number) => (
                            <div key={i} className="p-6 rounded-2xl bg-white/5 border border-white/10">
                                <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">{s.label}</p>
                                <p className={`text-2xl font-black ${s.color || 'text-slate-900 dark:text-white'}`}>{s.value}</p>
                            </div>
                        ))}
                    </div>

                    {/* Visualization Placeholder / Real Charts */}
                    <GlassCard title="Contextual Breakdown" className="!bg-white/5 border-white/5">
                        <div className="h-64 flex items-center justify-center text-slate-500 italic text-sm">
                            Breakdown visualization for {title} (Department/Branch View)
                        </div>
                    </GlassCard>

                    {/* Recommendations */}
                    <div className="p-8 rounded-[32px] bg-gradient-to-br from-[#8252e9]/20 to-[#4c49d8]/20 border border-[#8252e9]/30 relative overflow-hidden group">
                        <div className="flex items-center gap-3 mb-4">
                            <span className="text-xl">🤖</span>
                            <h4 className="text-sm font-black text-[#8252e9] dark:text-purple-400 uppercase tracking-widest italic">Strategic AI Recommendation</h4>
                        </div>
                        <p className="text-slate-700 dark:text-white/80 text-xs leading-relaxed font-medium italic">
                            {recommendations || "Analyzing historical trends to generate optimized management strategies..."}
                        </p>
                    </div>
                </div>

                {/* Footer */}
                <div className="p-8 border-t border-white/5 flex justify-end">
                    <button
                        onClick={onClose}
                        className="px-8 py-3 bg-[#8252e9] text-white rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-xl hover:scale-[1.02] active:scale-0.98 transition-all"
                    >
                        Close Analysis
                    </button>
                </div>
            </div>
        </div>
    );
};

export default AnalysisDetailModal;
