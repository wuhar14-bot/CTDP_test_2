import React, { useState, useEffect } from 'react';
import { Button } from './Button';
import { TaskCategory } from '../types';

interface BookingModalProps {
  isOpen: boolean;
  initialDate: Date | null;
  initialHour: number;
  onClose: () => void;
  onConfirm: (task: string, startTime: string, duration: number, category?: TaskCategory) => void;
}

export const BookingModal: React.FC<BookingModalProps> = ({
  isOpen,
  initialDate,
  initialHour,
  onClose,
  onConfirm
}) => {
  const [task, setTask] = useState('');
  const [timeStr, setTimeStr] = useState('09:00');
  const [duration, setDuration] = useState(60);
  const [category, setCategory] = useState<TaskCategory>('research');

  useEffect(() => {
    if (isOpen && initialDate) {
      // Set default time to clicked hour
      const h = initialHour.toString().padStart(2, '0');
      setTimeStr(`${h}:00`);
      setTask('');
      setCategory('research'); // Reset to default
    }
  }, [isOpen, initialDate, initialHour]);

  if (!isOpen || !initialDate) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!task.trim()) return;

    // Construct ISO string
    const [h, m] = timeStr.split(':').map(Number);
    const start = new Date(initialDate);
    start.setHours(h, m, 0, 0);

    onConfirm(task, start.toISOString(), duration, category);
    onClose();
  };

  const dateLabel = initialDate.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-zinc-900 border border-white/10 rounded-2xl p-6 w-full max-w-md shadow-2xl scale-100 animate-in zoom-in-95 duration-200">
        <h3 className="text-xl font-bold text-white mb-1">Book Focus Session</h3>
        <p className="text-indigo-400 text-sm mb-6">{dateLabel}</p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-2">Task / Event</label>
            <input
              type="text"
              value={task}
              onChange={(e) => setTask(e.target.value)}
              placeholder="e.g. Weekly Review"
              className="w-full bg-black border border-white/10 rounded-lg p-3 text-white focus:border-indigo-500 outline-none"
              autoFocus
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-2">Category</label>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => setCategory('research')}
                className={`p-2 rounded-lg text-xs font-bold transition-all ${
                  category === 'research'
                    ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-lg'
                    : 'bg-zinc-800 text-gray-400 hover:bg-zinc-700'
                }`}
              >
                Research
              </button>
              <button
                type="button"
                onClick={() => setCategory('work')}
                className={`p-2 rounded-lg text-xs font-bold transition-all ${
                  category === 'work'
                    ? 'bg-gradient-to-r from-amber-500 to-yellow-500 text-white shadow-lg'
                    : 'bg-zinc-800 text-gray-400 hover:bg-zinc-700'
                }`}
              >
                Work
              </button>
              <button
                type="button"
                onClick={() => setCategory('infrastructure')}
                className={`p-2 rounded-lg text-xs font-bold transition-all ${
                  category === 'infrastructure'
                    ? 'bg-gradient-to-r from-slate-600 to-gray-600 text-white shadow-lg'
                    : 'bg-zinc-800 text-gray-400 hover:bg-zinc-700'
                }`}
              >
                Infrastructure
              </button>
              <button
                type="button"
                onClick={() => setCategory('exercise')}
                className={`p-2 rounded-lg text-xs font-bold transition-all ${
                  category === 'exercise'
                    ? 'bg-gradient-to-r from-orange-500 to-red-500 text-white shadow-lg'
                    : 'bg-zinc-800 text-gray-400 hover:bg-zinc-700'
                }`}
              >
                Exercise
              </button>
              <button
                type="button"
                onClick={() => setCategory('eating')}
                className={`p-2 rounded-lg text-xs font-bold transition-all ${
                  category === 'eating'
                    ? 'bg-gradient-to-r from-emerald-500 to-teal-500 text-white shadow-lg'
                    : 'bg-zinc-800 text-gray-400 hover:bg-zinc-700'
                }`}
              >
                Eating
              </button>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-2">Start Time</label>
              <input 
                type="time" 
                value={timeStr}
                onChange={(e) => setTimeStr(e.target.value)}
                className="w-full bg-black border border-white/10 rounded-lg p-3 text-white focus:border-indigo-500 outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-2">Duration (min)</label>
              <input 
                type="number" 
                value={duration}
                onChange={(e) => setDuration(Number(e.target.value))}
                min={5}
                max={300}
                step={5}
                className="w-full bg-black border border-white/10 rounded-lg p-3 text-white focus:border-indigo-500 outline-none"
              />
            </div>
          </div>

          <div className="flex gap-3 mt-6">
            <Button type="button" variant="ghost" className="flex-1" onClick={onClose}>Cancel</Button>
            <Button type="submit" variant="primary" className="flex-1">Schedule Session</Button>
          </div>
        </form>
      </div>
    </div>
  );
};