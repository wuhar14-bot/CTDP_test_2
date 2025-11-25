
export type AppStage = 'IDLE' | 'AUX_COUNTDOWN' | 'FOCUS' | 'MINDMAP';

export interface FocusSession {
  id: string;
  task: string;
  startTime: string; // ISO String
  endTime: string; // ISO String
  durationMinutes: number;
  status?: 'completed' | 'planned';
}

export interface ExceptionRule {
  id: string;
  text: string;
  createdAt: string;
}

export interface NodeLayout {
  x: number;
  y: number;
  connections: string[]; // Array of session IDs this node connects TO
}

export interface SacredSeatData {
  chainCount: number;
  history: FocusSession[];
  rules: ExceptionRule[];
  mindMapLayout?: Record<string, NodeLayout>; // Map sessionId -> Layout
}

export interface AppState {
  stage: AppStage;
  currentTask: string;
  auxStartTime: number | null; // Timestamp
  focusStartTime: number | null; // Timestamp
  data: SacredSeatData;
}

export const STORAGE_KEY = 'ctdp_focus_tracker_v1';
