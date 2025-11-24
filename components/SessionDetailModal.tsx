
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
        className="bg-zinc-900 border border-white/10 rounded-2xl p-6 w-full max-w-sm shadow-2xl scale-100 animate-in zoom-in-95 duration-200"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex justify-between items-start mb-4">
            <div>
                <h3 className="text-lg font-bold text-white">{title}</h3>
                <p className="text-emerald-400 text-sm font-mono">{totalMinutes} minutes total</p>
            </div>
            <button onClick={onClose} className="text-gray-500 hover:text-white">✕</button>
        </div>

        <div className="space-y-3 max-h-[300px] overflow-y-auto pr-2">
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
                        <div className="flex justify-between text-xs text-gray-500 font-mono">
                            <span>{new Date(session.startTime).toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'})}</span>
                            <span>{session.durationMinutes}m</span>
                        </div>
                    </div>
                ))
            )}
        </div>
      </div>
    </div>
  );
};
