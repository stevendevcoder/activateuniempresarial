export type UserRole = 'trabajador' | 'administrador';

export interface SessionUser {
  id: number;
  name: string;
  email: string;
  role: UserRole;
  roleName: string;
  area: string;
  idArea: number | null;
  photo: string | null;
  permissions: string[];
}

export interface Preferences {
  notifications: boolean;
  dnd: boolean;
  reminders: boolean;
  visualRest: boolean;
}

export type PauseKind = 'start' | 'active' | 'lunch';
export type PauseStatus = 'pending' | 'completed' | 'postponed' | 'cancelled' | 'info';

/** Elemento de la línea de tiempo del día del trabajador. */
export interface DayPause {
  id: string;
  /** HH:mm en hora local. */
  time: string;
  title: string;
  subtitle: string;
  kind: PauseKind;
  status: PauseStatus;
  durationMin: number;
  period: 'mañana' | 'tarde';
  routineId: number | null;
  /** Fecha ISO del cupo del cronograma o de la pausa registrada. */
  scheduledAt: string | null;
  /** Pausa registrada en el backend para este cupo, si existe. */
  pausaId: number | null;
}

export interface HistoryDay {
  date: string;
  label: string;
  completed: number;
  total: number;
}

export type MascotPose = 'idle' | 'arms-up' | 'eyes' | 'wave' | 'breathe';

export interface Exercise {
  id: string;
  name: string;
  instruction: string;
  seconds: number;
  pose: MascotPose;
  tip: string;
  videoId: number | null;
}

export interface Routine {
  id: number;
  name: string;
  description: string;
  category: string;
  duration: string;
  pose: MascotPose;
  tint: string;
  exercises: Exercise[];
}

export interface NotificationItem {
  id: string;
  title: string;
  body: string;
  time: string;
  read: boolean;
}
