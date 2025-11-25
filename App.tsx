
import { useState, useEffect } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { AppState, FocusSession, ExceptionRule, TodoItem, STORAGE_KEY, SacredSeatData } from './types';
import { FocusController } from './components/FocusController';
import { TimeHorizon } from './components/TimeHorizon';
import { StatsBoard } from './components/StatsBoard';
import { BackupManager } from './components/BackupManager';
import { BookingModal } from './components/BookingModal';
import { SessionDetailModal } from './components/SessionDetailModal';

const generateId = uuidv4;

// --- DEMO DATA FOR TESTING ---
const DEMO_ID_1 = 'demo-1';
const DEMO_ID_2 = 'demo-2';
const DEMO_ID_3 = 'demo-3';
const DEMO_ID_4 = 'demo-4';

const DEMO_SESSIONS: FocusSession[] = [
  {
    id: DEMO_ID_1,
    task: 'Research CTDP Protocol',
    startTime: new Date(Date.now() - 1000 * 60 * 60 * 24 * 2).toISOString(), // 2 days ago
    endTime: new Date(Date.now() - 1000 * 60 * 60 * 23.5 * 2).toISOString(),
    durationMinutes: 45,
    status: 'completed'
  },
  {
    id: DEMO_ID_2,
    task: 'Draft System Architecture',
    startTime: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(), // 1 day ago
    endTime: new Date(Date.now() - 1000 * 60 * 60 * 22).toISOString(),
    durationMinutes: 90,
    status: 'completed'
  },
  {
    id: DEMO_ID_3,
    task: 'Setup Supabase Database',
    startTime: new Date(Date.now() - 1000 * 60 * 60 * 4).toISOString(), // 4 hours ago
    endTime: new Date(Date.now() - 1000 * 60 * 60 * 3.5).toISOString(),
    durationMinutes: 30,
    status: 'completed'
  },
  {
    id: DEMO_ID_4,
    task: 'Implement Authentication',
    startTime: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(), // 2 hours ago
    endTime: new Date(Date.now() - 1000 * 60 * 60 * 1).toISOString(),
    durationMinutes: 60,
    status: 'completed'
  }
];

const INITIAL_DATA: SacredSeatData = {
  chainCount: 4,
  history: DEMO_SESSIONS,
  rules: [],
  todos: []
};

const INITIAL_STATE: AppState = {
  stage: 'IDLE',
  currentTask: '',
  auxStartTime: null,
  focusStartTime: null,
  data: INITIAL_DATA
};

export default function App() {
  const [state, setState] = useState<AppState>(INITIAL_STATE);
  const [loaded, setLoaded] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);

  // Modals State
  const [isBookingOpen, setIsBookingOpen] = useState(false);
  const [bookingDate, setBookingDate] = useState<Date | null>(null);
  const [bookingHour, setBookingHour] = useState(9);

  const [detailModalOpen, setDetailModalOpen] = useState(false);
  const [detailTitle, setDetailTitle] = useState('');
  const [detailSessions, setDetailSessions] = useState<FocusSession[]>([]);

  // Load from local storage
  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (!parsed.data) parsed.data = INITIAL_DATA;
        // Ensure todos array exists for legacy data
        if (!parsed.data.todos) parsed.data.todos = [];
        if (!parsed.data.rules) parsed.data.rules = [];
        setState(parsed);
      } catch (e) {
        console.error("Failed to load state", e);
      }
    }
    setLoaded(true);
  }, []);

  // Auto-Save
  useEffect(() => {
    if (loaded) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
      setLastSaved(new Date());
    }
  }, [state, loaded]);

  const updateData = (updater: (data: SacredSeatData) => SacredSeatData) => {
    setState(prev => ({ ...prev, data: updater(prev.data) }));
  };

  // --- Core Actions ---

  const startAuxChain = (task: string) => {
    setState(prev => ({
      ...prev,
      stage: 'AUX_COUNTDOWN',
      currentTask: task,
      auxStartTime: Date.now()
    }));
  };

  const startFocus = () => {
    setState(prev => ({
      ...prev,
      stage: 'FOCUS',
      focusStartTime: Date.now()
    }));
  };

  const cancelSession = () => {
    if (confirm("Resetting will break your current chain. Continue?")) {
      setState(prev => ({
        ...prev,
        stage: 'IDLE',
        currentTask: '',
        auxStartTime: null,
        focusStartTime: null,
        data: {
            ...prev.data,
            chainCount: 0 // Penalty: Reset chain
        }
      }));
    }
  };

  const finishFocus = () => {
    if (!state.focusStartTime) return;
    
    const endTime = Date.now();
    let durationMinutes = Math.floor((endTime - state.focusStartTime) / 60000);

    if (durationMinutes < 1) {
        if (!confirm("Session is less than 1 minute. Do you want to save it?")) {
             setState(prev => ({
                ...prev,
                stage: 'IDLE',
                currentTask: '',
                auxStartTime: null,
                focusStartTime: null,
            }));
            return;
        }
        durationMinutes = 1;
    }

    const newSession: FocusSession = {
      id: generateId(),
      task: state.currentTask,
      startTime: new Date(state.focusStartTime).toISOString(),
      endTime: new Date(endTime).toISOString(),
      durationMinutes,
      status: 'completed'
    };

    setState(prev => ({
      ...prev,
      stage: 'IDLE',
      currentTask: '',
      auxStartTime: null,
      focusStartTime: null,
      data: {
        ...prev.data,
        chainCount: prev.data.chainCount + 1,
        history: [...prev.data.history, newSession]
      }
    }));
  };

  // --- Booking Actions ---

  const openBooking = (date: Date, hour: number) => {
    setBookingDate(date);
    setBookingHour(hour);
    setIsBookingOpen(true);
  };

  const confirmBooking = (task: string, startTimeIso: string, duration: number) => {
    const newSession: FocusSession = {
      id: generateId(),
      task,
      startTime: startTimeIso,
      endTime: new Date(new Date(startTimeIso).getTime() + duration * 60000).toISOString(),
      durationMinutes: duration,
      status: 'planned'
    };
    updateData(d => ({ ...d, history: [...d.history, newSession] }));
  };

  // --- Details Actions ---
  
  const openSlotDetails = (title: string, sessions: FocusSession[]) => {
    setDetailTitle(title);
    setDetailSessions(sessions);
    setDetailModalOpen(true);
  };

  // --- Rule & Data Mgmt ---

  const addRule = (text: string) => {
    const newRule: ExceptionRule = {
      id: generateId(),
      text,
      createdAt: new Date().toISOString()
    };
    updateData(data => ({ ...data, rules: [newRule, ...data.rules] }));
  };

  const deleteRule = (id: string) => {
    updateData(data => ({ ...data, rules: data.rules.filter(r => r.id !== id) }));
  };

  // --- Todo Mgmt ---

  const addTodo = (text: string) => {
    const newItem: TodoItem = {
      id: generateId(),
      text,
      createdAt: new Date().toISOString()
    };
    updateData(data => ({ ...data, todos: [newItem, ...data.todos] }));
  };

  const deleteTodo = (id: string) => {
    updateData(data => ({ ...data, todos: data.todos.filter(t => t.id !== id) }));
  };

  const deleteSession = (id: string) => {
    updateData(data => ({ ...data, history: data.history.filter(s => s.id !== id) }));
  };

  const importData = (newData: SacredSeatData) => {
    // Merge or replace logic - for now replace, but ensure structures exist
    if (!newData.todos) newData.todos = [];
    if (!newData.rules) newData.rules = [];
    setState(prev => ({ ...prev, data: newData }));
  };

  if (!loaded) return <div className="min-h-screen bg-black text-white flex items-center justify-center">Loading...</div>;

  // --- RENDER: NORMAL STAGE ---

  return (
    <div className="min-h-screen bg-black text-white p-4 md:p-6 font-sans selection:bg-indigo-500/30">
      <div className="max-w-[1600px] mx-auto space-y-6">
        
        {/* Header */}
        <header className="flex justify-between items-center py-4 border-b border-white/5 bg-black/50 backdrop-blur sticky top-0 z-40">
          <div className="flex items-center gap-4">
            <div>
                <h1 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-gray-400">
                Focus<span className="text-indigo-500">Tracker</span>
                </h1>
                <div className="flex items-center gap-2">
                    <p className="text-[9px] text-gray-500 tracking-widest uppercase">CTDP Protocol</p>
                    {lastSaved && (
                        <span className="text-[9px] text-emerald-500/70 animate-pulse transition-opacity duration-1000">
                        • Synced
                        </span>
                    )}
                </div>
            </div>
          </div>
          
          <div className="flex items-center gap-4 bg-zinc-900/50 px-4 py-2 rounded-lg border border-white/5">
             <div className="text-[10px] text-gray-500 uppercase font-bold tracking-wider">Current Chain</div>
             <div className="text-xl font-bold font-mono text-indigo-400 leading-none">{state.data.chainCount}</div>
          </div>
        </header>

        {/* --- MAIN LAYOUT --- */}
        
        {state.stage === 'FOCUS' ? (
          // MODE A: ZEN FOCUS MODE (Full Screen)
          <div className="animate-in fade-in zoom-in-95 duration-500 py-8">
             <FocusController
                stage={state.stage}
                currentTask={state.currentTask}
                chainCount={state.data.chainCount}
                auxStartTime={state.auxStartTime}
                focusStartTime={state.focusStartTime}
                rules={state.data.rules}
                todos={state.data.todos}
                onStartAux={startAuxChain}
                onStartFocus={startFocus}
                onFinishFocus={finishFocus}
                onCancel={cancelSession}
                onAddRule={addRule}
                onDeleteRule={deleteRule}
                onAddTodo={addTodo}
                onDeleteTodo={deleteTodo}
              />
          </div>
        ) : (
          // MODE B: COCKPIT MODE (Split View)
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            
            {/* LEFT COLUMN: ACTION (Focus Controller) - INCREASED WIDTH (col-span-4 -> col-span-5) */}
            <div className="lg:col-span-5 space-y-6 sticky top-24">
               <FocusController
                stage={state.stage}
                currentTask={state.currentTask}
                chainCount={state.data.chainCount}
                auxStartTime={state.auxStartTime}
                focusStartTime={state.focusStartTime}
                rules={state.data.rules}
                todos={state.data.todos}
                onStartAux={startAuxChain}
                onStartFocus={startFocus}
                onFinishFocus={finishFocus}
                onCancel={cancelSession}
                onAddRule={addRule}
                onDeleteRule={deleteRule}
                onAddTodo={addTodo}
                onDeleteTodo={deleteTodo}
              />
              
              {/* Tip Card */}
              <div className="p-4 bg-zinc-900/30 border border-white/5 rounded-xl text-xs text-gray-500 leading-relaxed">
                 <strong className="text-gray-400 block mb-1">Tip:</strong>
                 The "Sacred Seat" rule implies that once you sit down (start focus), you cannot engage in any other activity. If you must break, the chain resets.
              </div>
            </div>

            {/* RIGHT COLUMN: CONTEXT (Stats & Timeline) - DECREASED WIDTH (col-span-8 -> col-span-7) */}
            <div className="lg:col-span-7 space-y-6">
               
               {/* 1. Plan Future (Horizon) - Moved to Top */}
               <TimeHorizon 
                 sessions={state.data.history} 
                 onDeleteSession={deleteSession} 
                 onBookSlot={openBooking}
               />

               {/* 2. Review Past (Stats) - Moved Below */}
               <StatsBoard 
                  sessions={state.data.history} 
                  onSlotClick={openSlotDetails}
               />

            </div>
          </div>
        )}

        {/* Footer Utilities */}
        <BackupManager data={state.data} onImport={importData} />

        {/* Modals */}
        <BookingModal 
          isOpen={isBookingOpen}
          initialDate={bookingDate}
          initialHour={bookingHour}
          onClose={() => setIsBookingOpen(false)}
          onConfirm={confirmBooking}
        />

        <SessionDetailModal
          isOpen={detailModalOpen}
          title={detailTitle}
          sessions={detailSessions}
          onClose={() => setDetailModalOpen(false)}
        />
      </div>
    </div>
  );
}
