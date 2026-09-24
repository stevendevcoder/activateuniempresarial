/** Contratos de la API REST (backend de la rama brayam). */

export interface LoginResponse {
  message: string;
  token: string;
}

export interface TokenPayload {
  id: number;
  email: string;
  id_role: number | null;
  idArea: number | null;
  role: string | null;
  permissions: string[];
  exp: number;
}

export interface MeResponse {
  id: number;
  name: string;
  email: string;
  status: number;
  idRole: number | null;
  role: string | null;
  idArea: number | null;
  area: string | null;
  photo: string | null;
  permissions: string[];
}

export interface AdminUser {
  id: number;
  name: string;
  email: string;
  status: number;
  idRole: number | null;
  roleName: string | null;
  idArea: number | null;
  areaName: string | null;
  photo: string | null;
}

export interface Role {
  id: number;
  name: string;
  description: string;
  status: number;
}

export interface Area {
  id: number;
  name: string;
  description: string;
  idResponsible: number | null;
  responsibleName: string | null;
  status: number;
  workerCount: number;
}

export interface RoutineType {
  id: number;
  name: string;
  description: string;
  icon: string;
  color: string;
  status: number;
}

export interface VideoItem {
  id: number;
  title: string;
  description: string;
  fileName: string;
  mimeType: string;
  size: number;
  durationSeconds: number;
  status: number;
}

export interface RoutineVideo {
  id: number;
  idRoutine: number;
  idVideo: number;
  videoTitle: string | null;
  videoDuration: number;
  position: number;
}

export interface ApiRoutine {
  id: number;
  name: string;
  description: string;
  idRoutineType: number;
  routineTypeName: string | null;
  status: number;
  totalDurationSeconds: number;
  videos: RoutineVideo[];
}

export interface GlobalConfig {
  lunchStart: string;
  lunchEnd: string;
  maxPostponements: number;
  dashboardMode: 'realtime' | 'batch';
  retentionMonths?: number;
  updatedAt: string;
}

export interface Holiday {
  id: number;
  date: string;
  name: string;
  recurring: boolean;
  status: number;
}

export interface Schedule {
  id: number;
  idArea: number;
  areaName: string | null;
  idRoutine: number | null;
  routineName: string | null;
  startTime: string;
  endTime: string;
  frequencyMinutes: number;
  durationMinutes: number;
  daysOfWeek: number[];
  paused: boolean;
  status: number;
}

export interface ScheduleEventItem {
  id: number;
  idSchedule: number;
  idArea: number;
  areaName: string | null;
  idRoutine: number | null;
  scheduledAt: string;
  status: number;
  createdAt: string;
}

export const TELEMETRY_TYPE = {
  INICIO: 1,
  FIN: 2,
  APLAZAMIENTO: 3,
  CANCELACION: 4,
} as const;

export interface TelemetryEvent {
  id: number;
  idUser: number;
  userName: string | null;
  idPausa: number | null;
  idScheduleEvent: number | null;
  idArea: number | null;
  areaName: string | null;
  type: number;
  typeLabel: string;
  reason: string | null;
  occurredAt: string;
  createdAt: string;
}

export interface TelemetrySummaryRow {
  type: number;
  typeLabel: string;
  count: number;
}

export interface ConsentItem {
  id: number;
  idUser: number;
  userName: string | null;
  version: string;
  accepted: boolean;
  acceptedAt: string;
  revokedAt: string | null;
  createdAt: string;
}

export interface RetentionCandidate {
  id: number;
  name: string;
  email: string;
  lastActivity: string | null;
}

export interface RetentionPreview {
  retentionMonths: number;
  cutoff: string;
  candidates: RetentionCandidate[];
}

export interface AnalyticsSummary {
  total: number;
  programadas: number;
  completadas: number;
  aplazadas: number;
  canceladas: number;
  colaboradores: number;
  activeWorkers: number;
  activeAreas: number;
  complianceRate: number;
}

export interface TimelinePoint {
  period: string;
  total: number;
  completadas: number;
  programadas: number;
  aplazadas: number;
  canceladas: number;
}

export interface AreaCompliance {
  idArea: number | null;
  areaName: string;
  total: number;
  completadas: number;
  canceladas: number;
  colaboradores: number;
  complianceRate: number;
  workers: number;
}

export interface UserCompliance {
  idUser: number;
  name: string;
  email: string;
  photo: string | null;
  idArea: number | null;
  areaName: string | null;
  total: number;
  completadas: number;
  aplazadas: number;
  canceladas: number;
  todayTotal: number;
  todayCompleted: number;
  lastActivity: string | null;
  complianceRate: number;
}

export const PAUSA_STATUS = {
  PROGRAMADA: 1,
  COMPLETADA: 2,
  APLAZADA: 3,
  CANCELADA: 4,
} as const;

export interface PortalPause {
  id: number;
  idUser: number;
  idRoutine: number | null;
  routineName: string | null;
  idArea: number | null;
  areaName: string | null;
  scheduledAt: string;
  completedAt: string | null;
  status: number;
}

export interface PortalStats {
  programadas: number;
  completadas: number;
  aplazadas: number;
  canceladas: number;
  currentStreak: number;
  bestStreak: number;
  weeklyCompleted: number;
  memberSince: string | null;
}

export interface PortalStreak {
  current: number;
  best: number;
  totalCompleted: number;
}

export interface ConsentStatus {
  accepted: boolean;
  version: string | null;
  acceptedAt: string | null;
  revokedAt: string | null;
}
