import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import {
  AdminUser,
  ApiRoutine,
  Area,
  ConsentItem,
  GlobalConfig,
  Holiday,
  RetentionPreview,
  Role,
  RoutineType,
  Schedule,
  ScheduleEventItem,
  TelemetryEvent,
  TelemetrySummaryRow,
  VideoItem,
} from '../api.types';

type Payload = Record<string, unknown>;
type Msg = { message: string };

@Injectable({ providedIn: 'root' })
export class AdminService {
  private readonly http = inject(HttpClient);
  private readonly api = `${environment.apiUrl}/api`;

  getUsers(): Observable<AdminUser[]> {
    return this.http.get<AdminUser[]>(`${this.api}/users`);
  }

  getUser(id: number): Observable<AdminUser> {
    return this.http.get<AdminUser>(`${this.api}/users/${id}`);
  }

  createUser(payload: Payload): Observable<Msg & { userId: number }> {
    return this.http.post<Msg & { userId: number }>(`${this.api}/users`, payload);
  }

  updateUser(id: number, payload: Payload): Observable<Msg> {
    return this.http.put<Msg>(`${this.api}/users/${id}`, payload);
  }

  deleteUser(id: number): Observable<Msg> {
    return this.http.delete<Msg>(`${this.api}/users/${id}`);
  }

  getRoles(): Observable<Role[]> {
    return this.http.get<Role[]>(`${this.api}/roles`);
  }

  getAreas(): Observable<Area[]> {
    return this.http.get<Area[]>(`${this.api}/areas`);
  }

  createArea(payload: Payload): Observable<Msg & { areaId: number }> {
    return this.http.post<Msg & { areaId: number }>(`${this.api}/areas`, payload);
  }

  updateArea(id: number, payload: Payload): Observable<Msg> {
    return this.http.put<Msg>(`${this.api}/areas/${id}`, payload);
  }

  deleteArea(id: number): Observable<Msg> {
    return this.http.delete<Msg>(`${this.api}/areas/${id}`);
  }

  getRoutineTypes(): Observable<RoutineType[]> {
    return this.http.get<RoutineType[]>(`${this.api}/routine-types`);
  }

  getVideos(): Observable<VideoItem[]> {
    return this.http.get<VideoItem[]>(`${this.api}/media`);
  }

  uploadVideo(
    file: File,
    metadata: { title: string; description: string; durationSeconds: number; status: number },
  ): Observable<Msg & { videoId: number }> {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('title', metadata.title);
    formData.append('description', metadata.description);
    formData.append('durationSeconds', String(metadata.durationSeconds));
    formData.append('status', String(metadata.status));
    return this.http.post<Msg & { videoId: number }>(`${this.api}/media`, formData);
  }

  getRoutines(): Observable<ApiRoutine[]> {
    return this.http.get<ApiRoutine[]>(`${this.api}/routines`);
  }

  createRoutine(payload: Payload): Observable<Msg & { routineId: number }> {
    return this.http.post<Msg & { routineId: number }>(`${this.api}/routines`, payload);
  }

  updateRoutine(id: number, payload: Payload): Observable<Msg> {
    return this.http.put<Msg>(`${this.api}/routines/${id}`, payload);
  }

  setRoutineStatus(id: number, status: number): Observable<Msg> {
    return this.http.put<Msg>(`${this.api}/routines/${id}/status`, { status });
  }

  deleteRoutine(id: number): Observable<Msg> {
    return this.http.delete<Msg>(`${this.api}/routines/${id}`);
  }

  getConfig(): Observable<GlobalConfig> {
    return this.http.get<GlobalConfig>(`${this.api}/config`);
  }

  updateConfig(payload: Payload): Observable<Msg & { config: GlobalConfig }> {
    return this.http.put<Msg & { config: GlobalConfig }>(`${this.api}/config`, payload);
  }

  getHolidays(): Observable<Holiday[]> {
    return this.http.get<Holiday[]>(`${this.api}/config/holidays`);
  }

  createHoliday(payload: Payload): Observable<Msg & { holidayId: number }> {
    return this.http.post<Msg & { holidayId: number }>(`${this.api}/config/holidays`, payload);
  }

  deleteHoliday(id: number): Observable<Msg> {
    return this.http.delete<Msg>(`${this.api}/config/holidays/${id}`);
  }

  getSchedules(): Observable<Schedule[]> {
    return this.http.get<Schedule[]>(`${this.api}/schedules`);
  }

  createSchedule(payload: Payload): Observable<Msg & { scheduleId: number }> {
    return this.http.post<Msg & { scheduleId: number }>(`${this.api}/schedules`, payload);
  }

  updateSchedule(id: number, payload: Payload): Observable<Msg> {
    return this.http.put<Msg>(`${this.api}/schedules/${id}`, payload);
  }

  pauseSchedule(id: number): Observable<Msg> {
    return this.http.patch<Msg>(`${this.api}/schedules/${id}/pause`, {});
  }

  resumeSchedule(id: number): Observable<Msg> {
    return this.http.patch<Msg>(`${this.api}/schedules/${id}/resume`, {});
  }

  deleteSchedule(id: number): Observable<Msg> {
    return this.http.delete<Msg>(`${this.api}/schedules/${id}`);
  }

  runScheduler(): Observable<Msg & { emitted: number }> {
    return this.http.post<Msg & { emitted: number }>(`${this.api}/schedules/run`, {});
  }

  getScheduleEvents(limit = 20): Observable<ScheduleEventItem[]> {
    return this.http.get<ScheduleEventItem[]>(`${this.api}/schedules/events`, { params: { limit } });
  }

  getTelemetry(filters: { areaId?: number; type?: number; limit?: number } = {}): Observable<TelemetryEvent[]> {
    let params = new HttpParams();
    if (filters.areaId !== undefined) params = params.set('areaId', filters.areaId);
    if (filters.type !== undefined) params = params.set('type', filters.type);
    if (filters.limit !== undefined) params = params.set('limit', filters.limit);
    return this.http.get<TelemetryEvent[]>(`${this.api}/telemetry/events`, { params });
  }

  getTelemetrySummary(): Observable<TelemetrySummaryRow[]> {
    return this.http.get<TelemetrySummaryRow[]>(`${this.api}/telemetry/summary`);
  }

  getConsents(): Observable<ConsentItem[]> {
    return this.http.get<ConsentItem[]>(`${this.api}/privacy/consents`);
  }

  getRetentionPreview(): Observable<RetentionPreview> {
    return this.http.get<RetentionPreview>(`${this.api}/privacy/retention/preview`);
  }

  runRetention(): Observable<Msg & { anonymized: number; cutoff: string }> {
    return this.http.post<Msg & { anonymized: number; cutoff: string }>(`${this.api}/privacy/retention/run`, {});
  }
}
