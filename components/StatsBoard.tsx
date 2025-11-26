
import React, { useMemo, useState } from 'react';
import { FocusSession } from '../types';

interface StatsBoardProps {
  sessions: FocusSession[];
  onSlotClick: (title: string, sessions: FocusSession[]) => void;
}

type ViewMode = 'week' | 'month' | 'year';

export const StatsBoard: React.FC<StatsBoardProps> = ({ sessions, onSlotClick }) => {
  const [viewMode, setViewMode] = useState<ViewMode>('week');
  const [offset, setOffset] = useState(0); // Navigation offset

  // --- Helpers ---
  
  const getIntensityColor = (minutes: number) => {
    if (minutes === 0) return 'bg-zinc-800/50 hover:bg-zinc-800';
    if (minutes < 15) return 'bg-emerald-950/40 border-emerald-900/30';
    if (minutes < 30) return 'bg-emerald-900/50 border-emerald-800/40';
    if (minutes < 60) return 'bg-emerald-800/60 border-emerald-700/50';
    if (minutes < 90) return 'bg-emerald-700/70 border-emerald-600/50';
    if (minutes < 120) return 'bg-emerald-600/80 border-emerald-500/60';
    if (minutes < 180) return 'bg-emerald-500/90 border-emerald-400/70 shadow-[0_0_5px_rgba(16,185,129,0.1)]';
    if (minutes < 240) return 'bg-emerald-400 border-emerald-300/80 shadow-[0_0_10px_rgba(52,211,153,0.3)]';
    return 'bg-emerald-300 border-emerald-200 shadow-[0_0_15px_rgba(110,231,183,0.5)]';
  };

  const completedSessions = useMemo(() => sessions.filter(s => s.status !== 'planned'), [sessions]);
  
  const totalLifetime = useMemo(() => {
    const mins = completedSessions.reduce((acc, s) => acc + s.durationMinutes, 0);
    const h = Math.floor(mins / 60);
    const m = mins % 60;
    return `${h}h ${m}m`;
  }, [completedSessions]);

  // --- Navigation Logic ---

  const currentDateReference = useMemo(() => {
    const d = new Date();
    d.setHours(0,0,0,0);
    if (viewMode === 'week') d.setDate(d.getDate() + (offset * 7));
    if (viewMode === 'month') d.setMonth(d.getMonth() + offset);
    if (viewMode === 'year') d.setFullYear(d.getFullYear() + offset);
    return d;
  }, [viewMode, offset]);

  const navLabel = useMemo(() => {
    if (viewMode === 'week') {
        const start = new Date(currentDateReference);
        // Align to Monday
        const day = start.getDay();
        const diff = start.getDate() - day + (day === 0 ? -6 : 1); 
        start.setDate(diff);
        const end = new Date(start);
        end.setDate(start.getDate() + 6);
        return `${start.toLocaleDateString(undefined, {month:'short', day:'numeric'})} - ${end.toLocaleDateString(undefined, {month:'short', day:'numeric'})}`;
    }
    if (viewMode === 'month') return currentDateReference.toLocaleDateString(undefined, { month: 'long', year: 'numeric' });
    if (viewMode === 'year') return currentDateReference.getFullYear().toString();
    return '';
  }, [viewMode, currentDateReference]);

  // --- Views Renderers ---

  const renderWeekView = () => {
    // Get Mon-Sun dates
    const days: Date[] = [];
    const start = new Date(currentDateReference);
    const currentDay = start.getDay();
    const diff = start.getDate() - currentDay + (currentDay === 0 ? -6 : 1);
    const monday = new Date(start.setDate(diff));

    for(let i=0; i<7; i++) {
        const d = new Date(monday);
        d.setDate(monday.getDate() + i);
        days.push(d);
    }

    const timeSlots = [
        { label: 'Morning', startH: 5, endH: 12 },
        { label: 'Afternoon', startH: 12, endH: 18 },
        { label: 'Evening', startH: 18, endH: 24 }, // Extended to end of day
    ];

    return (
        <div className="grid grid-cols-[min-content_repeat(7,1fr)] gap-x-2 gap-y-2 items-center">
            {/* Header Row: Empty Corner + Days */}
            <div className="w-16"></div> {/* Spacer for Y-axis labels */}
            {days.map((d, i) => (
                <div key={i} className="text-center">
                    <div className="text-[10px] text-gray-500 uppercase font-bold">{d.toLocaleDateString(undefined, {weekday:'short'})}</div>
                    <div className="text-xs text-gray-600">{d.getDate()}</div>
                </div>
            ))}

            {/* Matrix Rows */}
            {timeSlots.map((slot) => (
                <React.Fragment key={slot.label}>
                    {/* Y-Axis Label */}
                    <div className="text-[10px] text-gray-500 font-bold uppercase tracking-wider text-right pr-2">
                        {slot.label}
                    </div>

                    {/* Data Cells */}
                    {days.map((day, dayIdx) => {
                        const dayStr = day.toDateString();
                        const slotSessions = completedSessions.filter(s => {
                            const d = new Date(s.startTime);
                            const h = d.getHours();
                            return d.toDateString() === dayStr && h >= slot.startH && h < slot.endH;
                        });
                        
                        const totalMins = slotSessions.reduce((acc, s) => acc + s.durationMinutes, 0);

                        return (
                            <div 
                                key={`${dayIdx}-${slot.label}`}
                                onClick={() => onSlotClick(`${day.toLocaleDateString(undefined, {weekday:'long'})} ${slot.label}`, slotSessions)}
                                className={`
                                    aspect-square rounded-md border border-white/5 transition-all cursor-pointer relative group
                                    ${getIntensityColor(totalMins)}
                                `}
                            >
                                <div className="hidden group-hover:flex absolute -top-8 left-1/2 -translate-x-1/2 bg-black text-white text-[10px] px-2 py-1 rounded whitespace-nowrap z-20 border border-white/20">
                                    {slot.label}: {totalMins}m
                                </div>
                            </div>
                        );
                    })}
                </React.Fragment>
            ))}
        </div>
    );
  };

  const renderMonthView = () => {
    const year = currentDateReference.getFullYear();
    const month = currentDateReference.getMonth();
    
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startOffset = firstDay.getDay() === 0 ? 6 : firstDay.getDay() - 1; // Mon start

    const grid = [];
    // Blanks
    for(let i=0; i<startOffset; i++) grid.push(null);
    // Days
    for(let i=1; i<=daysInMonth; i++) grid.push(new Date(year, month, i));

    return (
        <div className="grid grid-cols-7 gap-2">
            {['M','T','W','T','F','S','S'].map((d,i) => (
                <div key={i} className="text-center text-[10px] text-gray-600 font-bold">{d}</div>
            ))}
            {grid.map((d, i) => {
                if (!d) return <div key={i} className="aspect-square"></div>;
                
                const dayStr = d.toDateString();
                const daySessions = completedSessions.filter(s => new Date(s.startTime).toDateString() === dayStr);
                const totalMins = daySessions.reduce((acc, s) => acc + s.durationMinutes, 0);

                return (
                    <div 
                        key={i}
                        onClick={() => onSlotClick(d.toLocaleDateString(), daySessions)}
                        className={`aspect-square rounded-sm border border-white/5 cursor-pointer relative group ${getIntensityColor(totalMins)}`}
                    >
                         <span className="absolute inset-0 flex items-center justify-center text-[10px] text-white/50 group-hover:text-white font-mono">
                            {d.getDate()}
                         </span>
                    </div>
                );
            })}
        </div>
    );
  };

  const renderYearView = () => {
    // Github style: Columns = Weeks, Rows = Days
    // We render 52 columns
    // This is horizontally scrollable
    
    const weeks = [];
    let current = new Date(currentDateReference);
    current.setMonth(0, 1); // Start of selected year
    
    // Simple 53 week grid
    for(let w=0; w<53; w++) {
        const weekDays = [];
        for(let d=0; d<7; d++) {
             // Create dates
             // This is a naive implementation for visual purposes
             const date = new Date(current.getFullYear(), 0, 1 + (w*7) + d);
             if (date.getFullYear() !== current.getFullYear()) {
                 weekDays.push(null);
             } else {
                 weekDays.push(date);
             }
        }
        weeks.push(weekDays);
    }

    return (
        <div className="overflow-x-auto pb-2 hide-scrollbar">
            <div className="flex gap-1 min-w-max">
                {weeks.map((week, wIdx) => (
                    <div key={wIdx} className="flex flex-col gap-1">
                        {week.map((date, dIdx) => {
                             if (!date) return <div key={dIdx} className="w-2 h-2 bg-transparent"></div>;
                             
                             const daySessions = completedSessions.filter(s => new Date(s.startTime).toDateString() === date.toDateString());
                             const totalMins = daySessions.reduce((acc, s) => acc + s.durationMinutes, 0);

                             return (
                                <div 
                                    key={dIdx} 
                                    title={`${date.toLocaleDateString()}: ${totalMins}m`}
                                    onClick={() => onSlotClick(date.toLocaleDateString(), daySessions)}
                                    className={`w-2 h-2 rounded-[1px] cursor-pointer ${getIntensityColor(totalMins)}`}
                                />
                             );
                        })}
                    </div>
                ))}
            </div>
        </div>
    );
  };

  return (
    <div className="bg-zinc-900 border border-white/5 rounded-2xl p-6 shadow-2xl mb-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <div>
            <div className="text-[9px] text-gray-500 uppercase tracking-widest font-bold">Total Focus</div>
            <div className="text-xl font-bold text-white font-mono tracking-tight">{totalLifetime}</div>
        </div>

        <div className="flex items-center gap-2 bg-black/40 p-1 rounded-lg border border-white/5">
            <button onClick={() => setViewMode('week')} className={`px-3 py-1 text-xs rounded transition-all ${viewMode === 'week' ? 'bg-zinc-700 text-white' : 'text-gray-500 hover:text-gray-300'}`}>Week</button>
            <button onClick={() => setViewMode('month')} className={`px-3 py-1 text-xs rounded transition-all ${viewMode === 'month' ? 'bg-zinc-700 text-white' : 'text-gray-500 hover:text-gray-300'}`}>Month</button>
            <button onClick={() => setViewMode('year')} className={`px-3 py-1 text-xs rounded transition-all ${viewMode === 'year' ? 'bg-zinc-700 text-white' : 'text-gray-500 hover:text-gray-300'}`}>Year</button>
        </div>
        
        <div className="flex items-center gap-2">
            <button onClick={() => setOffset(o => o - 1)} className="w-6 h-6 flex items-center justify-center rounded hover:bg-white/10 text-gray-400">←</button>
            <span className="text-xs font-mono text-gray-300 min-w-[100px] text-center">{navLabel}</span>
            <button onClick={() => setOffset(o => o + 1)} className="w-6 h-6 flex items-center justify-center rounded hover:bg-white/10 text-gray-400">→</button>
        </div>
      </div>

      {/* Grid Content */}
      <div className="animate-in fade-in duration-300">
        {viewMode === 'week' && renderWeekView()}
        {viewMode === 'month' && renderMonthView()}
        {viewMode === 'year' && renderYearView()}
      </div>

      {/* Legend */}
      <div className="flex items-center justify-end gap-1.5 mt-4 text-[9px] text-gray-500 font-mono">
        <span>Less</span>
        {/* Render 8-level legend */}
        <div className="w-2 h-2 bg-zinc-800 rounded-[1px]"></div>
        <div className="w-2 h-2 bg-emerald-950/40 border border-emerald-900/30 rounded-[1px]"></div>
        <div className="w-2 h-2 bg-emerald-900/50 border border-emerald-800/40 rounded-[1px]"></div>
        <div className="w-2 h-2 bg-emerald-800/60 border border-emerald-700/50 rounded-[1px]"></div>
        <div className="w-2 h-2 bg-emerald-700/70 border border-emerald-600/50 rounded-[1px]"></div>
        <div className="w-2 h-2 bg-emerald-600/80 border border-emerald-500/60 rounded-[1px]"></div>
        <div className="w-2 h-2 bg-emerald-500/90 border border-emerald-400/70 rounded-[1px]"></div>
        <div className="w-2 h-2 bg-emerald-400 border border-emerald-300/80 rounded-[1px]"></div>
        <div className="w-2 h-2 bg-emerald-300 border border-emerald-200 rounded-[1px]"></div>
        <span>More</span>
      </div>
    </div>
  );
};
