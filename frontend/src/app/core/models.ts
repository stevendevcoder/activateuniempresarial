export type UserRole = 'trabajador' | 'administrador';

export interface SessionUser {
  id: number;
  name: string;
  email: string;
  role: UserRole;
  area: string;
  jornada: string;
  avatar: string;
  demo: boolean;
}

export interface ApiUser {
  id: number;
  name: string;
  email: string;
  password?: string;
  status: number;
}

export interface LoginResponse {
  message: string;
  token: string;
}

export interface Preferences {
  notifications: boolean;
  dnd: boolean;
  reminders: boolean;
  visualRest: boolean;
}

export type PauseKind = 'start' | 'active' | 'lunch' | 'visual';
export type PauseStatus = 'pending' | 'completed' | 'info';

export interface DayPause {
  id: string;
  time: string;
  title: string;
  subtitle: string;
  kind: PauseKind;
  status: PauseStatus;
  durationMin: number;
  period: 'mañana' | 'tarde';
  routineId?: string;
}

export interface HistoryDay {
  date: string;
  label: string;
  completed: number;
  total: number;
}

export interface Exercise {
  id: string;
  name: string;
  instruction: string;
  seconds: number;
  pose: MascotPose;
  tip: string;
}

export type MascotPose = 'idle' | 'arms-up' | 'eyes' | 'wave' | 'breathe';

export interface Routine {
  id: string;
  name: string;
  description: string;
  category: 'estiramiento' | 'visual' | 'respiracion' | 'movilidad';
  duration: string;
  pose: MascotPose;
  tint: string;
  exercises: Exercise[];
}

export interface WorkerTrack {
  id: number;
  name: string;
  area: string;
  avatar: string;
  compliance: number;
  status: 'ok' | 'pending';
  email: string;
  jornada: string;
  completedToday: number;
  totalToday: number;
}

export interface WeeklyPoint {
  day: string;
  value: number;
}

export interface AdminSummary {
  compliance: number;
  scheduled: number;
  completed: number;
  pending: number;
  weekly: WeeklyPoint[];
  alerts: string[];
}

export interface NotificationItem {
  id: string;
  title: string;
  body: string;
  time: string;
  read: boolean;
}
