
import React, { useMemo } from 'react';
import { FocusSession } from '../types';

interface StatsGridProps {
  sessions: FocusSession[];
}

export const StatsGrid: React.FC<StatsGridProps> = ({ sessions }) => {
  // Last 14 days
  const days = useMemo(() => {
    const result = [];
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    // 13 days ago -> Today
    for (let i = 13; i >= 0; i--) {
      const d = new Date(today);
      d.setDate(today.getDate() - i);
      result.push(d);
    }
    return result;
  }, []);

  const isSameDay = (d1: Date, d2: Date) => {
    return d1.getFullYear() === d2.getFullYear() &&
           d1.getMonth() === d2.getMonth() &&
           d1.getDate() === d2.getDate();
  };

  const getDayTotal = (date: Date) => {
    return sessions
      .filter(s => s.status !== 'planned' && isSameDay(new Date(s.startTime), date))
      .reduce((acc, curr) => acc + curr.durationMinutes, 0);
  };

  const getIntensityColor = (minutes: number) => {
    if (minutes === 0) return 'bg-zinc-800/50';
    if (minutes < 15) return 'bg-emerald-950/40 border border-emerald-900/50';
    if (minutes < 30) return 'bg-emerald-900/50 border border-emerald-800/50';
    if (minutes < 60) return 'bg-emerald-800/60 border border-emerald-700/50';
    if (minutes < 90) return 'bg-emerald-700/70 border border-emerald-600/50';
    if (minutes < 120) return 'bg-emerald-600/80 border border-emerald-500/50';
    if (minutes < 180) return 'bg-emerald-500/90 border border-emerald-400/50';
    if (minutes < 240) return 'bg-emerald-400 border border-emerald-300/50';
    return 'bg-emerald-300 border border-emerald-200 shadow-[0_0_10px_rgba(52,211,153,0.4)]';
  };

  const completedSessions = sessions.filter(s => s.status !== 'planned');
  const totalMinutes = completedSessions.reduce((acc, s) => acc + s.durationMinutes, 0);
  const hours = Math.floor(totalMinutes / 60);
  const mins = totalMinutes % 60;

  return (
    <div className="flex items-center gap-6 bg-zinc-900/50 backdrop-blur border border-white/5 rounded-full px-5 py-2 mb-6 w-fit mx-auto">
      {/* Total Stat */}
      <div className="flex items-baseline gap-2 border-r border-white/10 pr-5">
         <span className="text-[9px] text-gray-500 uppercase tracking-widest font-bold">Lifetime</span>
         <div className="text-lg font-bold text-white font-mono">
           {hours}<span className="text-xs text-gray-500">h</span> {mins}<span className="text-xs text-gray-500">m</span>
         </div>
      </div>

      {/* Mini Heatmap */}
      <div className="flex gap-1">
        {days.map((d, i) => {
            const minutes = getDayTotal(d);
            return (
                <div key={i} className="group relative">
                    <div 
                        className={`w-2 h-6 rounded-[1px] transition-all ${getIntensityColor(minutes)}`} 
                    />
                    {/* Tooltip */}
                    <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 hidden group-hover:block bg-black border border-white/20 text-[9px] text-white px-2 py-1 rounded whitespace-nowrap z-50">
                        {d.toLocaleDateString(undefined, {month:'short', day:'numeric'})}: {minutes}m
                    </div>
                </div>
            );
        })}
      </div>
      
      <div className="text-[9px] text-gray-500 border-l border-white/10 pl-5 hidden sm:block">
        LAST 14 DAYS
      </div>
    </div>
  );
};
