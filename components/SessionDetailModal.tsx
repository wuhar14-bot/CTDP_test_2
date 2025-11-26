
import React, { useState } from 'react';
import { FocusSession, TaskCategory } from '../types';
import { Button } from './Button';

interface SessionDetailModalProps {
  isOpen: boolean;
  title: string;
  sessions: FocusSession[];
  onClose: () => void;
  onUpdateSession: (id: string, updates: Partial<FocusSession>) => void;
  onDeleteSession: (id: string) => void;
}

export const SessionDetailModal: React.FC<SessionDetailModalProps> = ({
  isOpen,
  title,
  sessions,
  onClose,
  onUpdateSession,
  onDeleteSession
}) => {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<{
    task: string;
    duration: number;
    steps: string[];
    category: TaskCategory;
  } | null>(null);
  const [newStepInput, setNewStepInput] = useState('');

  if (!isOpen) return null;

  const totalMinutes = sessions.reduce((acc, s) => acc + s.durationMinutes, 0);

  const getCategoryGradient = (category?: TaskCategory): string => {
    switch (category) {
      case 'research':
        return 'from-indigo-600 to-purple-600';
      case 'exercise':
        return 'from-orange-500 to-red-500';
      case 'eating':
        return 'from-emerald-500 to-teal-500';
      case 'work':
        return 'from-amber-500 to-yellow-500';
      default:
        return 'from-indigo-600 to-purple-600';
    }
  };

  const startEditing = (session: FocusSession) => {
    setEditingId(session.id);
    setEditForm({
      task: session.task,
      duration: session.durationMinutes,
      steps: session.steps ? [...session.steps] : [],
      category: session.category || 'research'
    });
    setNewStepInput('');
  };

  const cancelEditing = () => {
    setEditingId(null);
    setEditForm(null);
  };

  const saveEditing = () => {
    if (editingId && editForm) {
      onUpdateSession(editingId, {
        task: editForm.task,
        durationMinutes: editForm.duration,
        steps: editForm.steps,
        category: editForm.category
      });
      cancelEditing();
    }
  };

  const handleAddStep = (e: React.FormEvent) => {
    e.preventDefault();
    if (newStepInput.trim() && editForm) {
      setEditForm({
        ...editForm,
        steps: [...editForm.steps, newStepInput.trim()]
      });
      setNewStepInput('');
    }
  };

  const handleDeleteStep = (index: number) => {
    if (editForm) {
      setEditForm({
        ...editForm,
        steps: editForm.steps.filter((_, i) => i !== index)
      });
    }
  };

  return (
    <div 
      className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200" 
      onClick={onClose}
    >
      <div 
        className="bg-zinc-900 border border-white/10 rounded-2xl p-6 w-full max-w-md shadow-2xl scale-100 animate-in zoom-in-95 duration-200 flex flex-col max-h-[85vh]"
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
                sessions.map(session => {
                    const isEditing = editingId === session.id;

                    if (isEditing && editForm) {
                        // --- EDIT MODE ---
                        return (
                            <div key={session.id} className="bg-zinc-800 border border-indigo-500/50 rounded-lg p-3 space-y-3">
                                <div>
                                    <label className="text-[10px] text-gray-500 uppercase font-bold">Task Name</label>
                                    <input
                                        value={editForm.task}
                                        onChange={e => setEditForm({...editForm, task: e.target.value})}
                                        className="w-full bg-black/50 border border-white/10 rounded px-2 py-1 text-sm text-white focus:border-indigo-500 outline-none"
                                    />
                                </div>

                                <div>
                                    <label className="text-[10px] text-gray-500 uppercase font-bold mb-2 block">Category</label>
                                    <div className="grid grid-cols-2 gap-2">
                                        <button
                                            type="button"
                                            onClick={() => setEditForm({...editForm, category: 'research'})}
                                            className={`p-2 rounded-lg text-xs font-bold transition-all ${
                                                editForm.category === 'research'
                                                    ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-lg'
                                                    : 'bg-zinc-700 text-gray-400 hover:bg-zinc-600'
                                            }`}
                                        >
                                            Research
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => setEditForm({...editForm, category: 'exercise'})}
                                            className={`p-2 rounded-lg text-xs font-bold transition-all ${
                                                editForm.category === 'exercise'
                                                    ? 'bg-gradient-to-r from-orange-500 to-red-500 text-white shadow-lg'
                                                    : 'bg-zinc-700 text-gray-400 hover:bg-zinc-600'
                                            }`}
                                        >
                                            Exercise
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => setEditForm({...editForm, category: 'eating'})}
                                            className={`p-2 rounded-lg text-xs font-bold transition-all ${
                                                editForm.category === 'eating'
                                                    ? 'bg-gradient-to-r from-emerald-500 to-teal-500 text-white shadow-lg'
                                                    : 'bg-zinc-700 text-gray-400 hover:bg-zinc-600'
                                            }`}
                                        >
                                            Eating
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => setEditForm({...editForm, category: 'work'})}
                                            className={`p-2 rounded-lg text-xs font-bold transition-all ${
                                                editForm.category === 'work'
                                                    ? 'bg-gradient-to-r from-amber-500 to-yellow-500 text-white shadow-lg'
                                                    : 'bg-zinc-700 text-gray-400 hover:bg-zinc-600'
                                            }`}
                                        >
                                            Work
                                        </button>
                                    </div>
                                </div>

                                <div className="flex gap-4">
                                    <div className="flex-1">
                                        <label className="text-[10px] text-gray-500 uppercase font-bold">Duration (min)</label>
                                        <input 
                                            type="number"
                                            value={editForm.duration}
                                            onChange={e => setEditForm({...editForm, duration: parseInt(e.target.value) || 0})}
                                            className="w-full bg-black/50 border border-white/10 rounded px-2 py-1 text-sm text-white focus:border-indigo-500 outline-none"
                                        />
                                    </div>
                                    <div className="flex items-end">
                                         <button 
                                            onClick={() => onDeleteSession(session.id)}
                                            className="text-xs text-red-400 hover:text-red-300 underline"
                                         >
                                            Delete Session
                                         </button>
                                    </div>
                                </div>

                                {/* Step Editor */}
                                <div className="border-t border-white/5 pt-2">
                                    <label className="text-[10px] text-gray-500 uppercase font-bold mb-1 block">Activity Log</label>
                                    <div className="space-y-1 mb-2">
                                        {editForm.steps.map((step, idx) => (
                                            <div key={idx} className="flex gap-2 items-center text-xs bg-black/30 p-1 rounded">
                                                <span className="text-gray-500 font-mono">{(idx+1).toString().padStart(2,'0')}</span>
                                                <input 
                                                   value={step}
                                                   onChange={(e) => {
                                                       const newSteps = [...editForm.steps];
                                                       newSteps[idx] = e.target.value;
                                                       setEditForm({...editForm, steps: newSteps});
                                                   }}
                                                   className="flex-1 bg-transparent border-none outline-none text-gray-300"
                                                />
                                                <button onClick={() => handleDeleteStep(idx)} className="text-gray-600 hover:text-red-400">×</button>
                                            </div>
                                        ))}
                                    </div>
                                    <form onSubmit={handleAddStep} className="flex gap-2">
                                        <input 
                                            value={newStepInput}
                                            onChange={e => setNewStepInput(e.target.value)}
                                            placeholder="Add log entry..."
                                            className="flex-1 bg-black/50 border border-white/10 rounded px-2 py-1 text-xs text-white outline-none focus:border-indigo-500"
                                        />
                                        <button type="submit" disabled={!newStepInput} className="text-gray-400 hover:text-white px-2 bg-white/5 rounded text-xs">+</button>
                                    </form>
                                </div>

                                <div className="flex gap-2 pt-2">
                                    <Button size="sm" variant="primary" onClick={saveEditing} className="flex-1">Save</Button>
                                    <Button size="sm" variant="ghost" onClick={cancelEditing} className="flex-1">Cancel</Button>
                                </div>
                            </div>
                        );
                    }

                    // --- VIEW MODE ---
                    return (
                        <div key={session.id} className="bg-white/5 rounded-lg p-3 border border-white/5 group relative">
                            <button
                                onClick={() => startEditing(session)}
                                className="absolute top-2 right-2 text-gray-500 hover:text-indigo-400 opacity-0 group-hover:opacity-100 transition-opacity p-1"
                                title="Edit Session"
                            >
                                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg>
                            </button>

                            <div className="flex justify-between items-start mb-1 pr-6">
                                <span className="font-medium text-gray-200 text-sm">{session.task}</span>
                                <div className="flex gap-1.5">
                                    <span className={`text-[10px] px-1.5 py-0.5 rounded bg-gradient-to-r ${getCategoryGradient(session.category)} text-white font-bold`}>
                                        {session.category ? session.category.charAt(0).toUpperCase() + session.category.slice(1) : 'Research'}
                                    </span>
                                    <span className={`text-[10px] px-1.5 py-0.5 rounded ${session.status === 'planned' ? 'bg-gray-700 text-gray-400' : 'bg-emerald-900 text-emerald-400'}`}>
                                        {session.status === 'planned' ? 'Planned' : 'Done'}
                                    </span>
                                </div>
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
                    );
                })
            )}
        </div>
      </div>
    </div>
  );
};
