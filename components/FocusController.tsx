
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
  
  // Tab states
  const [activeTab, setActiveTab] = useState<'backlog' | 'rules'>('backlog');
  const [focusTab, setFocusTab] = useState<'steps' | 'rules'>('steps');

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
    <div className="flex flex-col md:flex-row gap-6 h-[calc(100vh-140px)] min-h-[500px]">
      {/* Main Focus Card */}
      <div className="flex-1 p-8 bg-black border border-indigo-500/30 rounded-2xl shadow-[0_0_50px_rgba(99,102,241,0.15)] relative overflow-hidden flex flex-col items-center justify-center">
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

      {/* Side Panel (Tabs: Steps vs Rules) */}
      <div className="w-full md:w-80 bg-zinc-900/50 border border-white/5 rounded-2xl flex flex-col overflow-hidden">
        {/* Tab Header */}
        <div className="flex border-b border-white/5">
            <button 
                onClick={() => setFocusTab('steps')}
                className={`flex-1 py-3 text-xs font-bold uppercase tracking-wider transition-colors ${focusTab === 'steps' ? 'bg-white/5 text-white' : 'text-gray-500 hover:text-gray-300'}`}
            >
                Steps
            </button>
            <button 
                onClick={() => setFocusTab('rules')}
                className={`flex-1 py-3 text-xs font-bold uppercase tracking-wider transition-colors ${focusTab === 'rules' ? 'bg-white/5 text-white' : 'text-gray-500 hover:text-gray-300'}`}
            >
                Rules
            </button>
        </div>

        {/* Tab Content */}
        <div className="flex-1 p-4 flex flex-col min-h-0">
            {focusTab === 'steps' ? (
                // STEPS CONTENT
                <>
                    <div className="flex-1 overflow-y-auto mb-4 space-y-2 hide-scrollbar">
                        {currentSteps.length === 0 ? (
                            <div className="text-gray-600 text-sm italic text-center py-4">
                                No steps recorded. <br/> Log your actions here.
                            </div>
                        ) : (
                            currentSteps.map((step, idx) => (
                                <div key={idx} className="bg-zinc-800/50 border border-white/5 rounded p-2 text-sm text-gray-300 flex justify-between items-start group">
                                    <span className="flex-1 break-words mr-2">
                                        <span className="text-indigo-500/50 mr-2">{idx + 1}.</span>
                                        {step}
                                    </span>
                                    <button 
                                        onClick={() => onDeleteStep(idx)}
                                        className="text-gray-600 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-opacity px-1"
                                    >
                                        ×
                                    </button>
                                </div>
                            ))
                        )}
                    </div>
                    <form onSubmit={handleStepSubmit} className="mt-auto">
                        <div className="flex gap-2">
                            <input
                                type="text"
                                value={stepInput}
                                onChange={(e) => setStepInput(e.target.value)}
                                placeholder="Record action..."
                                className="flex-1 bg-zinc-950 border border-white/10 rounded px-3 py-2 text-sm text-white focus:border-indigo-500/50 outline-none"
                            />
                            <Button type="submit" size="sm" variant="secondary">→</Button>
                        </div>
                    </form>
                </>
            ) : (
                // RULES CONTENT
                <>
                     <div className="flex-1 overflow-y-auto mb-4 space-y-2 hide-scrollbar">
                        {rules.length === 0 ? (
                            <div className="text-gray-600 text-sm italic text-center py-4">No exceptions recorded.</div>
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
                        <div className="flex gap-2">
                            <input
                                type="text"
                                value={ruleInput}
                                onChange={(e) => setRuleInput(e.target.value)}
                                placeholder="Add rule..."
                                className="flex-1 bg-zinc-950 border border-white/10 rounded px-3 py-2 text-sm text-white focus:border-red-500/50 outline-none"
                            />
                            <Button type="submit" size="sm" variant="secondary">+</Button>
                        </div>
                    </form>
                </>
            )}
        </div>
      </div>
    </div>
  );
};
