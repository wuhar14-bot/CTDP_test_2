
import React, { useMemo, useState } from 'react';
import { FocusSession, TaskCategory } from '../types';

interface TimeHorizonProps {
  sessions: FocusSession[];
  onDeleteSession: (sessionId: string) => void;
  onBookSlot: (date: Date, hour: number) => void;
  onSessionClick: (session: FocusSession) => void;
}

// Config
const START_HOUR = 6; // 6 AM
const TOTAL_HOURS = 18; // Span 18 hours
const END_HOUR = START_HOUR + TOTAL_HOURS; // Until Midnight

export const TimeHorizon: React.FC<TimeHorizonProps> = ({ sessions, onDeleteSession, onBookSlot, onSessionClick }) => {
  const [weekOffset, setWeekOffset] = useState(0);

  // Get gradient color based on category
  const getCategoryGradient = (category?: TaskCategory): string => {
    switch (category) {
      case 'research':
        return 'from-indigo-600 to-purple-600'; // Blue-purple (default)
      case 'exercise':
        return 'from-orange-500 to-red-500'; // Orange-red
      case 'eating':
        return 'from-emerald-500 to-teal-500'; // Green
      case 'work':
        return 'from-amber-500 to-yellow-500'; // Yellow
      default:
        return 'from-indigo-600 to-purple-600'; // Default to research
    }
  };

  // Generate Rolling Window based on offset
  // Default: Center on Today [-3, +3]
  // Offset: Center on Today + (offset * 7)
  const rows = useMemo(() => {
    const dates = [];
    const centerDate = new Date();
    centerDate.setHours(0, 0, 0, 0);
    // Apply offset (weeks)
    centerDate.setDate(centerDate.getDate() + (weekOffset * 7));

    for (let i = -3; i <= 3; i++) {
      const d = new Date(centerDate);
      d.setDate(centerDate.getDate() + i);
      dates.push(d);
    }
    return dates;
  }, [weekOffset]);

  const isSameDay = (d1: Date, d2: Date) => {
    return d1.getFullYear() === d2.getFullYear() &&
           d1.getMonth() === d2.getMonth() &&
           d1.getDate() === d2.getDate();
  };

  const getRelativeLabel = (date: Date) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const d = new Date(date);
    d.setHours(0, 0, 0, 0);
    
    const diffTime = d.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Tomorrow';
    if (diffDays === -1) return 'Yesterday';
    return d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
  };

  // Helper to get approx hour from click position
  const handleTrackClick = (e: React.MouseEvent<HTMLDivElement>, date: Date) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const width = rect.width;
    const percent = x / width;
    
    // Map percent to hour
    const hourFloat = START_HOUR + (percent * TOTAL_HOURS);
    const hour = Math.floor(hourFloat);
    
    onBookSlot(date, hour);
  };

  // Calculate percentage position
  const getSessionStyle = (session: FocusSession) => {
    const start = new Date(session.startTime);
    let startHour = start.getHours();
    const startMin = start.getMinutes();
    
    if (startHour < START_HOUR) startHour = START_HOUR; 

    const minutesFromStart = ((startHour - START_HOUR) * 60) + startMin;
    const totalViewMinutes = TOTAL_HOURS * 60;
    
    const leftPercent = (minutesFromStart / totalViewMinutes) * 100;
    const widthPercent = (session.durationMinutes / totalViewMinutes) * 100;

    return {
      left: `${Math.max(0, leftPercent)}%`,
      width: `${Math.max(0.5, widthPercent)}%`,
    };
  };

  const markers = [];
  for(let h = START_HOUR; h <= END_HOUR; h += 3) {
      markers.push(h);
  }

  // Header Data
  const rangeStart = rows[0];
  const rangeEnd = rows[rows.length - 1];
  const rangeLabel = `${rangeStart.toLocaleDateString('en-US', {month:'short', day:'numeric'})} - ${rangeEnd.toLocaleDateString('en-US', {month:'short', day:'numeric'})}`;

  return (
    <div className="bg-zinc-900 border border-white/5 rounded-2xl overflow-hidden shadow-2xl p-6">
      
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
          <div className="flex items-center gap-4">
            <h3 className="text-sm font-bold text-gray-400 uppercase tracking-widest">
              Horizon <span className="text-gray-600 mx-2">|</span> <span className="text-indigo-400">{rangeLabel}</span>
            </h3>
            
            {/* Navigation Controls */}
            <div className="flex items-center bg-zinc-800/50 rounded-lg p-0.5 border border-white/5 ml-2">
                <button 
                  onClick={() => setWeekOffset(p => p - 1)} 
                  className="w-8 h-7 flex items-center justify-center hover:bg-white/10 rounded text-gray-400 transition-colors"
                  title="Previous Week"
                >
                  ←
                </button>
                <button 
                  onClick={() => setWeekOffset(0)} 
                  className={`px-3 h-7 text-xs font-bold rounded hover:bg-white/10 transition-colors ${weekOffset === 0 ? 'text-white' : 'text-gray-500'}`}
                  title="Reset to Today"
                >
                  Today
                </button>
                <button 
                  onClick={() => setWeekOffset(p => p + 1)} 
                  className="w-8 h-7 flex items-center justify-center hover:bg-white/10 rounded text-gray-400 transition-colors"
                  title="Next Week"
                >
                  →
                </button>
            </div>
          </div>

          <div className="flex items-center gap-4 text-[10px] font-mono text-gray-500 self-end md:self-auto">
              <div className="flex items-center gap-1"><div className="w-2 h-2 bg-indigo-500 rounded-sm"></div> Done</div>
              <div className="flex items-center gap-1"><div className="w-2 h-2 border border-dashed border-gray-500 rounded-sm"></div> Planned</div>
          </div>
      </div>

      <div className="relative select-none">
        
        {/* Grid Background Lines - Percentage Based */}
        <div className="absolute inset-0 pointer-events-none pl-24">
            <div className="relative w-full h-full">
                {markers.map((h) => {
                    const percent = ((h - START_HOUR) / TOTAL_HOURS) * 100;
                    return (
                        <div 
                            key={h} 
                            className={`absolute top-0 bottom-0 border-l border-white/5 ${h === START_HOUR ? 'border-l-0' : ''}`}
                            style={{ left: `${percent}%` }}
                        >
                             <span className="absolute -top-4 -left-3 text-[9px] text-gray-600 font-mono">
                                {h}:00
                             </span>
                             <span className="absolute -bottom-4 -left-3 text-[9px] text-gray-600 font-mono">
                                {h}:00
                             </span>
                        </div>
                    );
                })}
            </div>
        </div>

        {/* Rows */}
        <div className="space-y-4 relative z-10 my-6">
            {rows.map((date, rowIndex) => {
                const daySessions = sessions.filter(s => {
                    const sDate = new Date(s.startTime);
                    return isSameDay(sDate, date);
                });

                const isToday = getRelativeLabel(date) === 'Today';

                return (
                    <div key={rowIndex} className="flex items-center group/row h-16">
                        {/* Row Label */}
                        <div className="w-24 flex-shrink-0 text-right pr-4">
                            <div className={`text-xs font-bold transition-colors ${isToday ? 'text-indigo-400' : 'text-gray-500'}`}>
                                {getRelativeLabel(date)}
                            </div>
                            <div className="text-[10px] text-gray-600 font-mono">
                                {date.getDate()}
                            </div>
                        </div>

                        {/* Timeline Track */}
                        <div 
                            className={`flex-1 h-full rounded-lg relative transition-colors cursor-crosshair ${isToday ? 'bg-indigo-500/5' : 'bg-white/5 hover:bg-white/10'}`}
                            onClick={(e) => handleTrackClick(e, date)}
                            title="Click to book a session"
                        >
                            {daySessions.map(session => {
                                const style = getSessionStyle(session);
                                const isPlanned = session.status === 'planned';

                                // Calculate dynamic width based on text length
                                // Rough estimate: 8px per character for text-sm font, with min 288px and max 600px
                                const charLength = session.task.length;
                                const calculatedWidth = Math.max(288, Math.min(600, charLength * 8 + 80));
                                const hoverWidth = `${calculatedWidth}px`;

                                // Get category-specific gradient
                                const categoryGradient = getCategoryGradient(session.category);

                                return (
                                    <div
                                        key={session.id}
                                        style={{
                                            ...style,
                                            '--hover-width': hoverWidth
                                        } as React.CSSProperties & { '--hover-width': string }}
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            onSessionClick(session);
                                        }}
                                        className={`absolute top-1 bottom-1 rounded-md shadow-sm flex flex-col justify-center group/item transition-all duration-300 ease-out cursor-pointer overflow-visible hover:!-translate-x-[35%] hover:!h-auto hover:min-h-[90%] hover:shadow-[0_10px_30px_rgba(0,0,0,0.5)] hover:rounded-xl
                                        [&:hover]:!w-[var(--hover-width)]
                                            ${isPlanned
                                                ? 'border-2 border-dashed border-gray-600 bg-zinc-900/90 text-gray-400 hover:border-gray-400 hover:z-50'
                                                : `bg-gradient-to-r ${categoryGradient} text-white z-10 hover:z-50 hover:brightness-110`
                                            }
                                        `}
                                    >
                                        <div className="w-full px-2 flex items-center justify-between group-hover/item:items-start group-hover/item:flex-col group-hover/item:gap-1 group-hover/item:p-3">
                                            <div className={`text-[11px] font-bold w-full truncate group-hover/item:whitespace-normal group-hover/item:text-sm group-hover/item:leading-tight ${session.durationMinutes > 60 ? 'opacity-100' : 'opacity-0'} group-hover/item:opacity-100`}>
                                                {session.task}
                                            </div>
                                            
                                            {/* Details on Hover */}
                                            <div className="hidden group-hover/item:block w-full border-t border-white/20 pt-2 mt-1 animate-in fade-in slide-in-from-top-1 duration-200">
                                                <div className="flex justify-between text-[10px] opacity-80 font-mono">
                                                    <span>{session.durationMinutes} min</span>
                                                    <span>{new Date(session.startTime).toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'})}</span>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Delete Action */}
                                        <div 
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                if(confirm(`Delete "${session.task}"?`)) onDeleteSession(session.id);
                                            }}
                                            className="absolute top-2 right-2 w-5 h-5 flex items-center justify-center opacity-0 group-hover/item:opacity-100 bg-red-500 rounded-full text-white text-[10px] cursor-pointer hover:bg-red-600 shadow-md z-50"
                                            title="Delete Session"
                                        >
                                            ×
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                );
            })}
        </div>
      </div>
    </div>
  );
};
