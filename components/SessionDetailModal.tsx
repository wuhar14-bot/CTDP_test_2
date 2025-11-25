
import React from 'react';
import { FocusSession } from '../types';

interface SessionDetailModalProps {
  isOpen: boolean;
  title: string;
  sessions: FocusSession[];
  onClose: () => void;
}

export const SessionDetailModal: React.FC<SessionDetailModalProps> = ({
  isOpen,
  title,
  sessions,
  onClose
}) => {
  if (!isOpen) return null;

  const totalMinutes = sessions.reduce((acc, s) => acc + s.durationMinutes, 0);

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200" onClick={onClose}>
      <div 
        className="bg-zinc-900 border border-white/10 rounded-2xl p-6 w-full max-w-sm shadow-2xl scale-100 animate-in zoom-in-95 duration-200 flex flex-col max-h-[80vh]"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex justify-between items-start mb-4 flex-shrink-0">
            <div>
                <h3 className="text-lg font-bold text-white">{title}</h3>
                <p className="text-emerald-400 text-sm font-mono">{totalMinutes} minutes total</p>
            </div>
            <button onClick={onClose} className="text-gray-500 hover:text-white">✕</button>
        </div>

        <div className="space-y-4 overflow-y-auto pr-2 flex-1">
            {sessions.length === 0 ? (
                <div className="text-gray-600 italic text-sm py-4 text-center">No recorded sessions.</div>
            ) : (
                sessions.map(session => (
                    <div key={session.id} className="bg-white/5 rounded-lg p-3 border border-white/5">
                        <div className="flex justify-between items-start mb-1">
                            <span className="font-medium text-gray-200 text-sm">{session.task}</span>
                            <span className={`text-[10px] px-1.5 py-0.5 rounded ${session.status === 'planned' ? 'bg-gray-700 text-gray-400' : 'bg-emerald-900 text-emerald-400'}`}>
                                {session.status === 'planned' ? 'Planned' : 'Done'}
                            </span>
                        </div>
                        <div className="flex justify-between text-xs text-gray-500 font-mono mb-2">
                            <span>{new Date(session.startTime).toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'})}</span>
                            <span>{session.durationMinutes}m</span>
                        </div>
                        
                        {/* Recorded Steps Display */}
                        {session.steps && session.steps.length > 0 && (
                            <div className="mt-2 pt-2 border-t border-white/5">
                                <p className="text-[10px] text-gray-500 uppercase font-bold mb-1">Activity Log</p>
                                <ul className="space-y-1">
                                    {session.steps.map((step, idx) => (
                                        <li key={idx} className="text-xs text-gray-400 flex items-start gap-1.5">
                                            <span className="text-gray-600 mt-0.5">•</span>
                                            {step}
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        )}
                    </div>
                ))
            )}
        </div>
      </div>
    </div>
  );
};
