
import React, { useState, useEffect } from 'react';
import { AppStage, ExceptionRule } from '../types';
import { Button } from './Button';

interface FocusControllerProps {
  stage: AppStage;
  currentTask: string;
  chainCount: number;
  auxStartTime: number | null;
  focusStartTime: number | null;
  rules: ExceptionRule[];
  onStartAux: (task: string) => void;
  onStartFocus: () => void;
  onFinishFocus: () => void;
  onCancel: () => void;
  onAddRule: (rule: string) => void;
  onDeleteRule: (id: string) => void;
}

const AUX_DURATION_SEC = 15 * 60; // 15 minutes

export const FocusController: React.FC<FocusControllerProps> = ({
  stage,
  currentTask,
  chainCount,
  auxStartTime,
  focusStartTime,
  rules,
  onStartAux,
  onStartFocus,
  onFinishFocus,
  onCancel,
  onAddRule,
  onDeleteRule
}) => {
  const [taskInput, setTaskInput] = useState('');
  const [ruleInput, setRuleInput] = useState('');
  const [timeLeft, setTimeLeft] = useState(AUX_DURATION_SEC);
  const [elapsed, setElapsed] = useState(0);

  // Aux Countdown Timer
  useEffect(() => {
    if (stage === 'AUX_COUNTDOWN' && auxStartTime) {
      const interval = setInterval(() => {
        const now = Date.now();
        const diff = Math.floor((now - auxStartTime) / 1000);
        const remaining = Math.max(0, AUX_DURATION_SEC - diff);
        setTimeLeft(remaining);
      }, 1000);
      return () => clearInterval(interval);
    }
  }, [stage, auxStartTime]);

  // Focus Elapsed Timer
  useEffect(() => {
    if (stage === 'FOCUS' && focusStartTime) {
      const interval = setInterval(() => {
        const now = Date.now();
        setElapsed(Math.floor((now - focusStartTime) / 1000));
      }, 1000);
      return () => clearInterval(interval);
    }
  }, [stage, focusStartTime]);

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const handleAuxSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (taskInput.trim()) onStartAux(taskInput);
  };

  const handleRuleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (ruleInput.trim()) {
      onAddRule(ruleInput);
      setRuleInput('');
    }
  };

  // --- STAGE 1: IDLE / PRE-COMMITMENT ---
  if (stage === 'IDLE') {
    return (
      <div className="p-8 bg-zinc-900/80 backdrop-blur border border-white/10 rounded-2xl shadow-2xl relative overflow-hidden">
        {/* Glow effect */}
        <div className="absolute top-0 right-0 -mt-10 -mr-10 w-40 h-40 bg-purple-500/20 rounded-full blur-3xl pointer-events-none"></div>

        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <span className="text-2xl">⚡</span> Start Focus Chain
          </h2>
          <div className="px-3 py-1 bg-zinc-800 rounded-full border border-white/10 text-xs font-mono text-gray-400">
            Chain: <span className="text-white font-bold">{chainCount}</span>
          </div>
        </div>

        <form onSubmit={handleAuxSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-gray-400 mb-1 uppercase tracking-wide">
              What will you focus on?
            </label>
            <input
              type="text"
              value={taskInput}
              onChange={(e) => setTaskInput(e.target.value)}
              placeholder="e.g., Read Research Paper on CTDP"
              className="w-full bg-zinc-950 border border-white/10 rounded-lg p-4 text-lg text-white placeholder-gray-600 focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none transition-all"
              autoFocus
            />
          </div>
          <div className="flex gap-4 items-center text-sm text-gray-500">
             <span className="flex items-center gap-1">⏱️ 15m Prep</span>
             <span className="flex items-center gap-1">🔒 Sacred Seat</span>
          </div>
          <Button type="submit" size="lg" className="w-full" disabled={!taskInput.trim()}>
            Start Auxiliary Chain
          </Button>
        </form>
      </div>
    );
  }

  // --- STAGE 2: AUXILIARY CHAIN COUNTDOWN ---
  if (stage === 'AUX_COUNTDOWN') {
    return (
      <div className="p-8 bg-zinc-900/90 border border-orange-500/30 rounded-2xl shadow-[0_0_30px_rgba(234,88,12,0.1)] relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-1 bg-gray-800">
           <div 
             className="h-full bg-orange-500 transition-all duration-1000 ease-linear"
             style={{ width: `${(timeLeft / AUX_DURATION_SEC) * 100}%` }}
           />
        </div>

        <div className="text-center py-6">
          <div className="text-orange-400 text-sm uppercase tracking-widest font-bold mb-2">Pre-Commitment Phase</div>
          <h3 className="text-2xl font-bold text-white mb-6">"{currentTask}"</h3>
          
          <div className="text-6xl font-mono font-bold text-white mb-8 tabular-nums tracking-tighter">
            {formatTime(timeLeft)}
          </div>

          <div className="flex gap-4 justify-center">
            <Button onClick={onCancel} variant="ghost">Cancel</Button>
            <Button onClick={onStartFocus} className="bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-400 hover:to-red-400 shadow-orange-500/20 px-8">
              Sit in Sacred Seat Now
            </Button>
          </div>
          <p className="mt-4 text-xs text-gray-500 max-w-xs mx-auto">
            You can start anytime within 15 minutes. Prepare your environment.
          </p>
        </div>
      </div>
    );
  }

  // --- STAGE 3: ACTIVE FOCUS (SACRED SEAT) ---
  return (
    <div className="flex flex-col md:flex-row gap-6">
      {/* Main Focus Card */}
      <div className="flex-1 p-8 bg-black border border-indigo-500/30 rounded-2xl shadow-[0_0_50px_rgba(99,102,241,0.15)] relative overflow-hidden flex flex-col items-center justify-center min-h-[400px]">
        {/* Ambient Background */}
        <div className="absolute inset-0 bg-gradient-to-br from-indigo-900/10 via-transparent to-purple-900/10 pointer-events-none"></div>
        
        <div className="relative z-10 text-center w-full max-w-lg">
          <div className="inline-block px-3 py-1 bg-indigo-500/10 border border-indigo-500/20 rounded-full text-indigo-300 text-xs font-bold uppercase tracking-widest mb-6 animate-pulse">
            Sacred Seat Active
          </div>
          
          <h2 className="text-3xl font-bold text-white mb-2 leading-tight">{currentTask}</h2>
          
          <div className="my-10">
             <div className="text-8xl font-mono font-bold text-transparent bg-clip-text bg-gradient-to-b from-white to-gray-400 tabular-nums tracking-tighter">
               {formatTime(elapsed)}
             </div>
             <div className="text-gray-500 text-sm mt-2 font-mono uppercase">Time Elapsed</div>
          </div>

          <div className="grid grid-cols-2 gap-4 w-full">
            <Button onClick={onCancel} variant="danger" className="w-full">
              Reset (Violation)
            </Button>
            <Button onClick={onFinishFocus} className="w-full bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-white shadow-emerald-500/20">
              Complete Session
            </Button>
          </div>
        </div>
      </div>

      {/* Rules / Exceptions Side Panel */}
      <div className="w-full md:w-80 bg-zinc-900/50 border border-white/5 rounded-2xl p-6 flex flex-col">
        <h3 className="text-sm font-bold text-gray-400 uppercase tracking-widest mb-4">
          Exception Rules
        </h3>
        
        <div className="flex-1 overflow-y-auto mb-4 space-y-2 max-h-[250px] hide-scrollbar">
          {rules.length === 0 ? (
            <div className="text-gray-600 text-sm italic text-center py-4">No exceptions recorded yet.</div>
          ) : (
            rules.map(rule => (
              <div key={rule.id} className="bg-red-500/5 border border-red-500/10 rounded p-3 text-sm text-gray-300 group relative">
                 <span className="text-red-400 font-bold mr-2">!</span> {rule.text}
                 <button 
                  onClick={() => onDeleteRule(rule.id)}
                  className="absolute top-2 right-2 text-gray-600 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-opacity"
                 >
                   ×
                 </button>
              </div>
            ))
          )}
        </div>

        <form onSubmit={handleRuleSubmit} className="mt-auto">
          <label className="block text-xs text-gray-500 mb-2">
            "Exception Becomes Rule" Principle
          </label>
          <div className="flex gap-2">
            <input
              type="text"
              value={ruleInput}
              onChange={(e) => setRuleInput(e.target.value)}
              placeholder="Add new rule..."
              className="flex-1 bg-zinc-950 border border-white/10 rounded px-3 py-2 text-sm text-white focus:border-red-500/50 outline-none"
            />
            <Button type="submit" size="sm" variant="secondary">+</Button>
          </div>
        </form>
      </div>
    </div>
  );
};
