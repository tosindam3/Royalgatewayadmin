import React from 'react';
import { Clock, Fingerprint } from 'lucide-react';
import { useTodayStatus } from '../../hooks/useAttendance';

interface HeaderClockPanelProps {
    onOpenModal: () => void;
}

const HeaderClockPanel: React.FC<HeaderClockPanelProps> = ({ onOpenModal }) => {
    const { data: today } = useTodayStatus();
    const isCheckedIn = today?.checked_in;
    const [currentTime, setCurrentTime] = React.useState(new Date());

    React.useEffect(() => {
        const timer = setInterval(() => setCurrentTime(new Date()), 1000);
        return () => clearInterval(timer);
    }, []);

    return (
        <button
            onClick={onOpenModal}
            className={`hidden md:flex items-center gap-3 px-5 py-2.5 rounded-2xl border transition-all duration-500 group relative overflow-hidden ${isCheckedIn
                    ? 'bg-emerald-500/5 border-emerald-500/20 text-emerald-600'
                    : 'bg-purple-500/5 border-purple-500/20 text-purple-600'
                }`}
        >
            <div className={`p-1.5 rounded-lg transition-all ${isCheckedIn ? 'bg-emerald-500 text-white' : 'bg-purple-500 text-white group-hover:bg-purple-600'
                }`}>
                {isCheckedIn ? <Fingerprint className="w-3.5 h-3.5" /> : <Clock className="w-3.5 h-3.5" />}
            </div>
            <div className="text-left font-mono">
                <p className="text-[11px] font-black flex items-center gap-1.5 leading-none transition-all tabular-nums">
                    {currentTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                    {isCheckedIn && <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />}
                </p>
                <p className="text-[8px] font-black uppercase tracking-widest opacity-60 mt-1 leading-none">
                    {isCheckedIn ? `Logged In: ${today?.check_in_time}` : 'Attendance System'}
                </p>
            </div>
        </button>
    );
};

export default HeaderClockPanel;
