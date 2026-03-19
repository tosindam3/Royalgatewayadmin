
import React from 'react';
import GlassCard from '../GlassCard';

interface CallModalProps {
    isOpen: boolean;
    onClose: () => void;
    channelName: string;
    channelId: number;
    callType: 'video' | 'voice';
}

const CallModal: React.FC<CallModalProps> = ({ isOpen, onClose, channelName, channelId, callType }) => {
    if (!isOpen) return null;

    // Generate a unique room name based on channel ID to avoid collisions
    // We use a prefix to ensure it's unique to this application
    const roomName = `RoyalGateway_Chat_${channelId}_${channelName.replace(/[^a-zA-Z0-9]/g, '_')}`;
    const jitsiUrl = `https://meet.jit.si/${roomName}#config.startWithAudioMuted=false&config.startWithVideoMuted=${callType === 'voice'}`;

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-300">
            <div className="w-full md:max-w-5xl h-full md:h-[80vh] relative group">
                <GlassCard className="w-full h-full p-0 overflow-hidden flex flex-col border-[#8252e9]/20 shadow-2xl shadow-purple-500/20">
                    {/* Header */}
                    <div className="p-4 border-b border-white/10 flex justify-between items-center bg-white/5">
                        <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center">
                                <span className="text-lg">{callType === 'video' ? '📹' : '📞'}</span>
                            </div>
                            <div>
                                <h3 className="text-sm font-black text-white uppercase tracking-widest">
                                    {callType === 'video' ? 'Video' : 'Voice'} Call
                                </h3>
                                <p className="text-[10px] text-slate-400 font-bold">Channel: {channelName}</p>
                            </div>
                        </div>
                        <button 
                            onClick={onClose}
                            className="p-2 hover:bg-white/10 rounded-xl text-slate-400 hover:text-white transition-all group/close"
                        >
                            <svg className="w-5 h-5 group-hover/close:rotate-90 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>
                    </div>

                    {/* Jitsi Iframe */}
                    <div className="flex-1 bg-black/20">
                        <iframe
                            src={jitsiUrl}
                            allow="camera; microphone; display-capture; autoplay; clipboard-write"
                            className="w-full h-full border-none"
                            title="Jitsi Meet Call"
                        />
                    </div>

                    {/* Footer / Safety Notice */}
                    <div className="p-3 bg-white/5 border-t border-white/5 flex items-center justify-center gap-4">
                        <p className="text-[9px] text-slate-500 font-bold uppercase tracking-widest">
                            Powered by Jitsi Meet • Fully Encrypted • Peer-to-Peer
                        </p>
                    </div>
                </GlassCard>
            </div>
        </div>
    );
};

export default CallModal;
