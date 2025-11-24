import React, { useMemo } from 'react';
import { FocusSession } from '../types';

interface WeekScheduleProps {
  sessions: FocusSession[];
  onDeleteSession: (sessionId: string) => void;
}

const START_HOUR = 7;
const END_HOUR = 23; // Show until 11 PM
const HOUR_HEIGHT = 60; // 1 min = 1 px

export const WeekSchedule: React.FC<WeekScheduleProps> = ({ sessions, onDeleteSession }) => {
  // Generate Rolling Window: [Today-3, ..., Today, ..., Today+3]
  const weekDates = useMemo(() => {
    const dates = [];
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    for (let i = -3; i <= 3; i++) {
      const d = new Date(today);
      d.setDate(today.getDate() + i);
      dates.push(d);
    }
    return dates;
  }, []);

  const hours = Array.from({ length: END_HOUR - START_HOUR + 1 }, (_, i) => START_HOUR + i);

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
    if (diffDays > 0) return `+${diffDays}d`;
    return `${diffDays}d`;
  };

  const isToday = (date: Date) => {
    const today = new Date();
    return date.getDate() === today.getDate() && 
           date.getMonth() === today.getMonth() && 
           date.getFullYear() === today.getFullYear();
  };

  const getSessionStyle = (session: FocusSession) => {
    const start = new Date(session.startTime);
    // Determine the day column logic is handled in the render loop, 
    // here we just need relative positioning within the day
    const startHour = start.getHours();
    const startMin = start.getMinutes();

    const top = ((startHour - START_HOUR) * 60) + startMin;
    const height = session.durationMinutes;

    return {
      top: `${top}px`,
      height: `${Math.max(height, 20)}px`, // Minimum visual height
    };
  };

  return (
    <div className="bg-zinc-900 border border-white/10 rounded-2xl overflow-hidden flex flex-col h-[600px] shadow-2xl">
      {/* Header */}
      <div className="flex border-b border-white/5 bg-zinc-900/50 backdrop-blur-md sticky top-0 z-20">
        <div className="w-16 flex-shrink-0 bg-zinc-950/50 border-r border-white/5"></div> {/* Time axis placeholder */}
        <div className="flex-1 grid grid-cols-7 divide-x divide-white/5">
          {weekDates.map((date, i) => (
            <div 
              key={i} 
              className={`py-3 text-center transition-colors ${isToday(date) ? 'bg-indigo-500/10' : ''}`}
            >
              <div className={`text-xs font-bold uppercase tracking-wider mb-1 ${isToday(date) ? 'text-indigo-400' : 'text-gray-500'}`}>
                {getRelativeLabel(date)}
              </div>
              <div className={`text-sm font-mono ${isToday(date) ? 'text-white' : 'text-gray-400'}`}>
                {date.getDate()}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Scrollable Body */}
      <div className="overflow-y-auto flex-1 relative hide-scrollbar">
        <div className="flex relative" style={{ height: `${hours.length * HOUR_HEIGHT}px` }}>
          
          {/* Time Axis */}
          <div className="w-16 flex-shrink-0 bg-zinc-950/30 border-r border-white/5 sticky left-0 z-10 text-right pr-3 pt-2 select-none">
            {hours.map(h => (
              <div key={h} className="absolute w-full text-xs text-gray-600 font-mono" style={{ top: `${(h - START_HOUR) * 60}px` }}>
                {h.toString().padStart(2, '0')}:00
              </div>
            ))}
          </div>

          {/* Grid Columns */}
          <div className="flex-1 grid grid-cols-7 divide-x divide-white/5 relative">
            {/* Horizontal Grid Lines */}
            <div className="absolute inset-0 z-0 pointer-events-none">
                {hours.map(h => (
                   <div key={`line-${h}`} className="border-t border-white/5 w-full absolute" style={{ top: `${(h - START_HOUR) * 60}px` }}></div> 
                ))}
            </div>

            {weekDates.map((date, colIndex) => {
              const dateStr = date.toISOString().split('T')[0];
              
              const daySessions = sessions.filter(s => {
                const sDate = s.startTime.split('T')[0];
                return sDate === dateStr;
              });

              return (
                <div key={colIndex} className={`relative h-full ${isToday(date) ? 'bg-indigo-500/5' : ''}`}>
                  {daySessions.map(session => {
                    const style = getSessionStyle(session);
                    // Filter out sessions out of visual range
                    const startH = new Date(session.startTime).getHours();
                    if (startH < START_HOUR || startH > END_HOUR) return null;

                    return (
                      <div
                        key={session.id}
                        style={style}
                        className="absolute inset-x-1 rounded-md bg-gradient-to-b from-blue-600 to-indigo-700 text-white p-2 text-xs overflow-hidden shadow-lg border-t border-white/20 hover:scale-[1.02] hover:z-20 transition-all cursor-pointer group"
                        title={`${session.task} (${session.durationMinutes}m)`}
                      >
                         <div className="font-semibold truncate">{session.task}</div>
                         <div className="opacity-70 text-[10px]">{new Date(session.startTime).toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'})} - {session.durationMinutes}m</div>
                         
                         {/* Delete Button (Visible on Hover) */}
                         <button 
                            onClick={(e) => {
                                e.stopPropagation();
                                if(confirm('Are you sure you want to delete this session?')) onDeleteSession(session.id);
                            }}
                            className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 bg-black/50 hover:bg-red-500 rounded p-0.5 transition-colors"
                         >
                             <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                         </button>
                      </div>
                    );
                  })}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};
