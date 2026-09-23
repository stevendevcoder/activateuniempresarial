import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import {
  AdminUser,
  Area,
  ConsentItem,
  GlobalConfig,
  Holiday,
  RetentionPreview,
  Role,
  Routine,
  RoutineType,
  Schedule,
  ScheduleEventItem,
  TelemetryEvent,
  TelemetrySummaryRow,
  VideoItem,
} from './admin.types';

@Injectable({ providedIn: 'root' })
export class AdminService {
  private readonly http = inject(HttpClient);
  private readonly api = environment.apiUrl;

  getUsers(): Observable<AdminUser[]> {
    return this.http.get<AdminUser[]>(`${this.api}/api/users`);
  }

  createUser(payload: Record<string, unknown>): Observable<{ message: string; userId: number }> {
    return this.http.post<{ message: string; userId: number }>(`${this.api}/api/users`, payload);
  }

  updateUser(id: number, payload: Record<string, unknown>): Observable<{ message: string }> {
    return this.http.put<{ message: string }>(`${this.api}/api/users/${id}`, payload);
  }

  deleteUser(id: number): Observable<{ message: string }> {
    return this.http.delete<{ message: string }>(`${this.api}/api/users/${id}`);
  }

  getRoles(): Observable<Role[]> {
    return this.http.get<Role[]>(`${this.api}/api/roles`);
  }

  getAreas(): Observable<Area[]> {
    return this.http.get<Area[]>(`${this.api}/api/areas`);
  }

  createArea(payload: Record<string, unknown>): Observable<{ message: string; areaId: number }> {
    return this.http.post<{ message: string; areaId: number }>(`${this.api}/api/areas`, payload);
  }

  updateArea(id: number, payload: Record<string, unknown>): Observable<{ message: string }> {
    return this.http.put<{ message: string }>(`${this.api}/api/areas/${id}`, payload);
  }

  deleteArea(id: number): Observable<{ message: string }> {
    return this.http.delete<{ message: string }>(`${this.api}/api/areas/${id}`);
  }

  getRoutineTypes(): Observable<RoutineType[]> {
    return this.http.get<RoutineType[]>(`${this.api}/api/routine-types`);
  }

  getVideos(): Observable<VideoItem[]> {
    return this.http.get<VideoItem[]>(`${this.api}/api/media`);
  }

  uploadVideo(
    file: File,
    metadata: { title: string; description: string; durationSeconds: number; status: number }
  ): Observable<{ message: string; videoId: number }> {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('title', metadata.title);
    formData.append('description', metadata.description);
    formData.append('durationSeconds', String(metadata.durationSeconds));
    formData.append('status', String(metadata.status));
    return this.http.post<{ message: string; videoId: number }>(`${this.api}/api/media`, formData);
  }

  getVideoBlob(id: number): Observable<Blob> {
    return this.http.get(`${this.api}/api/media/${id}/stream`, { responseType: 'blob' });
  }

  getRoutines(): Observable<Routine[]> {
    return this.http.get<Routine[]>(`${this.api}/api/routines`);
  }

  createRoutine(payload: Record<string, unknown>): Observable<{ message: string; routineId: number }> {
    return this.http.post<{ message: string; routineId: number }>(`${this.api}/api/routines`, payload);
  }

  updateRoutine(id: number, payload: Record<string, unknown>): Observable<{ message: string }> {
    return this.http.put<{ message: string }>(`${this.api}/api/routines/${id}`, payload);
  }

  setRoutineStatus(id: number, status: number): Observable<{ message: string }> {
    return this.http.put<{ message: string }>(`${this.api}/api/routines/${id}/status`, { status });
  }

  deleteRoutine(id: number): Observable<{ message: string }> {
    return this.http.delete<{ message: string }>(`${this.api}/api/routines/${id}`);
  }

  getConfig(): Observable<GlobalConfig> {
    return this.http.get<GlobalConfig>(`${this.api}/api/config`);
  }

  updateConfig(payload: Record<string, unknown>): Observable<{ message: string; config: GlobalConfig }> {
    return this.http.put<{ message: string; config: GlobalConfig }>(`${this.api}/api/config`, payload);
  }

  getHolidays(): Observable<Holiday[]> {
    return this.http.get<Holiday[]>(`${this.api}/api/config/holidays`);
  }

  createHoliday(payload: Record<string, unknown>): Observable<{ message: string; holidayId: number }> {
    return this.http.post<{ message: string; holidayId: number }>(`${this.api}/api/config/holidays`, payload);
  }

  deleteHoliday(id: number): Observable<{ message: string }> {
    return this.http.delete<{ message: string }>(`${this.api}/api/config/holidays/${id}`);
  }

  getSchedules(): Observable<Schedule[]> {
    return this.http.get<Schedule[]>(`${this.api}/api/schedules`);
  }

  createSchedule(payload: Record<string, unknown>): Observable<{ message: string; scheduleId: number }> {
    return this.http.post<{ message: string; scheduleId: number }>(`${this.api}/api/schedules`, payload);
  }

  updateSchedule(id: number, payload: Record<string, unknown>): Observable<{ message: string }> {
    return this.http.put<{ message: string }>(`${this.api}/api/schedules/${id}`, payload);
  }

  pauseSchedule(id: number): Observable<{ message: string }> {
    return this.http.patch<{ message: string }>(`${this.api}/api/schedules/${id}/pause`, {});
  }

  resumeSchedule(id: number): Observable<{ message: string }> {
    return this.http.patch<{ message: string }>(`${this.api}/api/schedules/${id}/resume`, {});
  }

  deleteSchedule(id: number): Observable<{ message: string }> {
    return this.http.delete<{ message: string }>(`${this.api}/api/schedules/${id}`);
  }

  runScheduler(): Observable<{ message: string; emitted: number }> {
    return this.http.post<{ message: string; emitted: number }>(`${this.api}/api/schedules/run`, {});
  }

  getScheduleEvents(limit = 20): Observable<ScheduleEventItem[]> {
    return this.http.get<ScheduleEventItem[]>(`${this.api}/api/schedules/events`, {
      params: { limit },
    });
  }

  getTelemetry(filters: { areaId?: number; type?: number; limit?: number } = {}): Observable<TelemetryEvent[]> {
    let params = new HttpParams();
    if (filters.areaId !== undefined) params = params.set('areaId', filters.areaId);
    if (filters.type !== undefined) params = params.set('type', filters.type);
    if (filters.limit !== undefined) params = params.set('limit', filters.limit);
    return this.http.get<TelemetryEvent[]>(`${this.api}/api/telemetry/events`, { params });
  }

  getTelemetrySummary(): Observable<TelemetrySummaryRow[]> {
    return this.http.get<TelemetrySummaryRow[]>(`${this.api}/api/telemetry/summary`);
  }

  getConsents(): Observable<ConsentItem[]> {
    return this.http.get<ConsentItem[]>(`${this.api}/api/privacy/consents`);
  }

  getRetentionPreview(): Observable<RetentionPreview> {
    return this.http.get<RetentionPreview>(`${this.api}/api/privacy/retention/preview`);
  }

  runRetention(): Observable<{ message: string; anonymized: number; cutoff: string }> {
    return this.http.post<{ message: string; anonymized: number; cutoff: string }>(
      `${this.api}/api/privacy/retention/run`,
      {}
    );
  }
}
