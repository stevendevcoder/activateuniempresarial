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

export interface Routine {
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

export interface TelemetrySummaryRow {
  type: number;
  typeLabel: string;
  count: number;
}
