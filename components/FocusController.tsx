
import React, { useState, useEffect } from 'react';
import { AppStage, ExceptionRule, TodoItem } from '../types';
import { Button } from './Button';

interface FocusControllerProps {
  stage: AppStage;
  currentTask: string;
  currentSteps: string[];
  chainCount: number;
  auxStartTime: number | null;
  focusStartTime: number | null;
  rules: ExceptionRule[];
  todos: TodoItem[];
  onStartAux: (task: string) => void;
  onStartFocus: () => void;
  onFinishFocus: () => void;
  onCancel: () => void;
  onAddRule: (rule: string) => void;
  onDeleteRule: (id: string) => void;
  onAddTodo: (text: string) => void;
  onDeleteTodo: (id: string) => void;
  onAddStep: (step: string) => void;
  onDeleteStep: (index: number) => void;
}

const AUX_DURATION_SEC = 15 * 60; // 15 minutes

export const FocusController: React.FC<FocusControllerProps> = ({
  stage,
  currentTask,
  currentSteps,
  chainCount,
  auxStartTime,
  focusStartTime,
  rules,
  todos,
  onStartAux,
  onStartFocus,
  onFinishFocus,
  onCancel,
  onAddRule,
  onDeleteRule,
  onAddTodo,
  onDeleteTodo,
  onAddStep,
  onDeleteStep
}) => {
  const [taskInput, setTaskInput] = useState('');
  const [ruleInput, setRuleInput] = useState('');
  const [todoInput, setTodoInput] = useState('');
  const [stepInput, setStepInput] = useState('');
  
  // Tab states for IDLE mode
  const [activeTab, setActiveTab] = useState<'backlog' | 'rules'>('backlog');

  const [timeLeft, setTimeLeft] = useState(AUX_DURATION_SEC);
  const [elapsed, setElapsed] = useState(0);

  // Sync current task if it changes externally
  useEffect(() => {
    if (stage === 'IDLE') {
        // Reset input logic could go here if needed
    }
  }, [stage]);

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

  const handleTodoSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (todoInput.trim()) {
      onAddTodo(todoInput);
      setTodoInput('');
    }
  };

  const handleStepSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (stepInput.trim()) {
        onAddStep(stepInput);
        setStepInput('');
    }
  };

  // --- STAGE 1: IDLE / PRE-COMMITMENT ---
  if (stage === 'IDLE') {
    return (
      <div className="bg-zinc-900/80 backdrop-blur border border-white/10 rounded-2xl shadow-2xl relative overflow-hidden flex flex-col">
        {/* Glow effect */}
        <div className="absolute top-0 right-0 -mt-10 -mr-10 w-40 h-40 bg-purple-500/20 rounded-full blur-3xl pointer-events-none"></div>

        <div className="p-8 pb-4">
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

        {/* --- BACKLOG / RULES TABS --- */}
        <div className="border-t border-white/5 bg-black/20 mt-2 flex-1 flex flex-col min-h-[300px]">
            <div className="flex border-b border-white/5">
                <button 
                  onClick={() => setActiveTab('backlog')}
                  className={`flex-1 py-3 text-xs font-bold uppercase tracking-wider transition-colors ${activeTab === 'backlog' ? 'bg-white/5 text-white' : 'text-gray-500 hover:text-gray-300'}`}
                >
                    Backlog
                </button>
                <button 
                  onClick={() => setActiveTab('rules')}
                  className={`flex-1 py-3 text-xs font-bold uppercase tracking-wider transition-colors ${activeTab === 'rules' ? 'bg-white/5 text-white' : 'text-gray-500 hover:text-gray-300'}`}
                >
                    Rules
                </button>
            </div>
            
            <div className="p-4 flex-1 overflow-y-auto max-h-[300px]">
                {activeTab === 'backlog' ? (
                    <div className="space-y-4">
                         <form onSubmit={handleTodoSubmit} className="flex gap-2">
                            <input
                                type="text"
                                value={todoInput}
                                onChange={(e) => setTodoInput(e.target.value)}
                                placeholder="Add new task..."
                                className="flex-1 bg-zinc-950 border border-white/10 rounded px-3 py-2 text-sm text-white focus:border-indigo-500/50 outline-none"
                            />
                            <Button type="submit" size="sm" variant="secondary">+</Button>
                        </form>
                        <div className="space-y-2">
                            {todos.length === 0 ? (
                                <div className="text-gray-600 text-xs italic text-center py-4">No pending tasks.</div>
                            ) : (
                                todos.map(todo => (
                                    <div key={todo.id} className="group flex justify-between items-center bg-zinc-800/30 border border-white/5 p-3 rounded hover:border-indigo-500/30 transition-colors">
                                        <span className="text-sm text-gray-300">{todo.text}</span>
                                        <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                            <button 
                                                onClick={() => setTaskInput(todo.text)}
                                                className="text-[10px] bg-indigo-500/20 text-indigo-400 px-2 py-1 rounded hover:bg-indigo-500/40"
                                            >
                                                Select
                                            </button>
                                            <button 
                                                onClick={() => onDeleteTodo(todo.id)}
                                                className="text-gray-600 hover:text-red-400 px-1"
                                            >
                                                ×
                                            </button>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                ) : (
                    <div className="space-y-4">
                        <form onSubmit={handleRuleSubmit} className="flex gap-2">
                            <input
                                type="text"
                                value={ruleInput}
                                onChange={(e) => setRuleInput(e.target.value)}
                                placeholder="Add exception rule..."
                                className="flex-1 bg-zinc-950 border border-white/10 rounded px-3 py-2 text-sm text-white focus:border-red-500/50 outline-none"
                            />
                            <Button type="submit" size="sm" variant="secondary">+</Button>
                        </form>
                        <div className="space-y-2">
                            {rules.length === 0 ? (
                                <div className="text-gray-600 text-xs italic text-center py-4">No rules defined.</div>
                            ) : (
                                rules.map(rule => (
                                    <div key={rule.id} className="group relative bg-red-500/5 border border-red-500/10 p-3 rounded text-sm text-gray-300">
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
                    </div>
                )}
            </div>
        </div>
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
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-[calc(100vh-80px)] min-h-[600px]">
      
      {/* 1. TIMER COLUMN (CENTER FOCUS) */}
      <div className="bg-zinc-900/50 border border-white/5 rounded-2xl flex flex-col overflow-hidden relative shadow-xl">
        {/* Header */}
        <div className="h-12 border-b border-white/5 bg-black/20 flex items-center px-4 justify-between shrink-0">
             <span className="text-xs font-bold uppercase tracking-wider text-indigo-400 flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 animate-pulse"></span>
                Active Session
             </span>
             <span className="text-[10px] text-gray-500 truncate max-w-[150px]">{currentTask}</span>
        </div>
        
        {/* Main Content */}
        <div className="flex-1 flex flex-col items-center justify-center p-6 relative">
             <div className="absolute inset-0 bg-gradient-to-b from-indigo-500/5 to-transparent pointer-events-none"></div>
             
             <div className="text-6xl xl:text-7xl font-mono font-bold text-white tabular-nums tracking-tighter drop-shadow-2xl z-10 mb-2">
               {formatTime(elapsed)}
             </div>
             <div className="text-indigo-500/50 text-[10px] uppercase tracking-[0.2em] font-bold z-10">Sacred Seat Time</div>
        </div>

        {/* Footer Actions */}
        <div className="p-3 border-t border-white/5 bg-zinc-900/80 backdrop-blur shrink-0 grid gap-2">
            <Button onClick={onFinishFocus} className="w-full bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 shadow-lg shadow-emerald-900/20">
              Complete Session
            </Button>
            <Button onClick={onCancel} variant="danger" size="sm" className="w-full bg-red-500/5 hover:bg-red-500/10 border-red-500/10 text-[10px] py-1">
              Reset (Violation)
            </Button>
        </div>
      </div>

      {/* 2. SESSION LOG COLUMN */}
      <div className="bg-zinc-900/50 border border-white/5 rounded-2xl flex flex-col overflow-hidden relative shadow-xl">
             <div className="h-12 border-b border-white/5 bg-black/20 flex items-center px-4 justify-between shrink-0">
                <span className="text-xs font-bold uppercase tracking-wider text-gray-400">Session Log</span>
                <span className="text-[10px] bg-white/5 text-gray-300 px-1.5 py-0.5 rounded border border-white/5">{currentSteps.length}</span>
             </div>
             
             {/* List of Steps */}
             <div className="p-3 overflow-y-auto flex-1 space-y-2 hide-scrollbar">
                {currentSteps.length === 0 ? (
                    <div className="h-full flex flex-col items-center justify-center text-gray-600 text-xs italic opacity-50">
                        <span>No actions recorded.</span>
                        <span className="mt-1">Log your progress below.</span>
                    </div>
                ) : (
                    // Display steps in chronological order (oldest to newest)
                    currentSteps.map((step, idx) => {
                        return (
                            <div key={idx} className="bg-zinc-800/40 border border-white/5 rounded p-3 text-sm text-gray-300 flex justify-between items-start group animate-in slide-in-from-top-1 fade-in duration-300 hover:bg-zinc-800/60 transition-colors">
                                <div className="flex gap-3">
                                    <span className="text-gray-600 text-xs font-mono mt-0.5 min-w-[1.5rem]">{(idx + 1).toString().padStart(2, '0')}</span>
                                    <span className="break-words leading-relaxed text-xs">{step}</span>
                                </div>
                                <button
                                    onClick={() => onDeleteStep(idx)}
                                    className="text-gray-600 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-opacity px-1 -mr-1"
                                >
                                    ×
                                </button>
                            </div>
                        );
                    })
                )}
            </div>

            {/* Footer Input */}
            <div className="p-3 border-t border-white/5 bg-zinc-900/80 backdrop-blur shrink-0">
                <form onSubmit={handleStepSubmit} className="relative group">
                    <input
                        type="text"
                        value={stepInput}
                        onChange={(e) => setStepInput(e.target.value)}
                        placeholder="Log next action..."
                        className="w-full bg-black/50 border border-white/10 rounded-lg py-2.5 pl-3 pr-10 text-xs text-white placeholder-gray-600 focus:ring-1 focus:ring-indigo-500/50 focus:border-indigo-500/50 outline-none transition-all"
                        autoFocus
                    />
                    <div className="absolute inset-y-0 right-2 flex items-center">
                        <button 
                            type="submit"
                            className="p-1 text-[10px] bg-white/5 hover:bg-white/10 rounded text-gray-400 transition-colors uppercase font-bold tracking-wider"
                            disabled={!stepInput.trim()}
                        >
                            ↵
                        </button>
                    </div>
                </form>
            </div>
      </div>

      {/* 3. ACTIVE RULES COLUMN */}
      <div className="bg-zinc-900/50 border border-white/5 rounded-2xl flex flex-col overflow-hidden relative shadow-xl">
             <div className="h-12 border-b border-white/5 bg-black/20 flex items-center px-4 justify-between shrink-0">
                <span className="text-xs font-bold uppercase tracking-wider text-gray-400">Active Rules</span>
                <span className="text-[10px] bg-red-500/10 text-red-400 px-1.5 py-0.5 rounded border border-red-500/20">{rules.length}</span>
             </div>

             <div className="p-3 overflow-y-auto flex-1 space-y-2 hide-scrollbar">
                {rules.length === 0 ? (
                    <div className="text-gray-600 text-xs italic text-center py-4">No constraints set.</div>
                ) : (
                    rules.map(rule => (
                        <div key={rule.id} className="bg-red-500/5 border border-red-500/10 rounded p-2.5 text-xs text-gray-300 flex gap-2 group relative hover:bg-red-500/10 transition-colors">
                            <span className="text-red-400 font-bold mt-0.5">!</span> 
                            <span className="break-words leading-relaxed opacity-80">{rule.text}</span>
                             <button 
                                onClick={() => onDeleteRule(rule.id)}
                                className="absolute top-1 right-1 text-gray-600 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-opacity"
                            >
                                ×
                            </button>
                        </div>
                    ))
                )}
            </div>

            {/* Footer Input */}
            <div className="p-3 border-t border-white/5 bg-zinc-900/80 backdrop-blur shrink-0">
                 <form onSubmit={handleRuleSubmit} className="flex gap-2">
                    <input
                        type="text"
                        value={ruleInput}
                        onChange={(e) => setRuleInput(e.target.value)}
                        placeholder="Add rule..."
                        className="flex-1 bg-black/50 border border-white/10 rounded-lg px-3 py-2 text-xs text-white focus:border-red-500/50 outline-none"
                    />
                    <button type="submit" className="text-gray-400 hover:text-white px-2.5 py-1 bg-white/5 rounded-lg text-xs hover:bg-white/10 transition-colors">+</button>
                </form>
            </div>
      </div>

    </div>
  );
};
