import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import {
  ApiRoutine,
  ConsentStatus,
  GlobalConfig,
  PortalPause,
  PortalStats,
  PortalStreak,
  Schedule,
} from '../api.types';

/** Endpoints de autoservicio del trabajador (/api/me/*) y lecturas permitidas a su rol. */
@Injectable({ providedIn: 'root' })
export class PortalService {
  private readonly http = inject(HttpClient);
  private readonly api = `${environment.apiUrl}/api`;

  getPauses(filters: { limit?: number; start?: string; end?: string } = {}): Observable<{ items: PortalPause[]; total: number }> {
    const params: Record<string, string | number> = { limit: filters.limit ?? 50 };
    if (filters.start) params['start'] = filters.start;
    if (filters.end) params['end'] = filters.end;
    return this.http.get<{ items: PortalPause[]; total: number }>(`${this.api}/me/pauses`, { params });
  }

  getStats(): Observable<PortalStats> {
    return this.http.get<PortalStats>(`${this.api}/me/stats`);
  }

  getStreak(): Observable<PortalStreak> {
    return this.http.get<PortalStreak>(`${this.api}/me/streak`);
  }

  getConfig(): Observable<GlobalConfig> {
    return this.http.get<GlobalConfig>(`${this.api}/config`);
  }

  getScheduleByArea(idArea: number): Observable<Schedule> {
    return this.http.get<Schedule>(`${this.api}/schedules/area/${idArea}`);
  }

  getRoutines(): Observable<ApiRoutine[]> {
    return this.http.get<ApiRoutine[]>(`${this.api}/routines`);
  }

  getRoutine(id: number): Observable<ApiRoutine> {
    return this.http.get<ApiRoutine>(`${this.api}/routines/${id}`);
  }

  getVideoBlob(id: number): Observable<Blob> {
    return this.http.get(`${this.api}/media/${id}/stream`, { responseType: 'blob' });
  }

  registerPause(payload: {
    routineId: number | null;
    scheduledAt?: string;
    status?: 'programada' | 'completada' | 'aplazada' | 'cancelada';
  }): Observable<{ message: string; pausa: PortalPause }> {
    return this.http.post<{ message: string; pausa: PortalPause }>(`${this.api}/me/pauses`, payload);
  }

  sendEvent(payload: {
    type: number;
    idPausa: number | null;
    idArea: number | null;
    reason?: string;
  }): Observable<{ message: string; eventId: number }> {
    return this.http.post<{ message: string; eventId: number }>(`${this.api}/telemetry/events`, payload);
  }

  getConsent(): Observable<ConsentStatus> {
    return this.http.get<ConsentStatus>(`${this.api}/me/consent`);
  }

  acceptConsent(): Observable<{ message: string }> {
    return this.http.post<{ message: string }>(`${this.api}/me/consent`, { version: '1.0' });
  }

  revokeConsent(): Observable<{ message: string }> {
    return this.http.delete<{ message: string }>(`${this.api}/me/consent`);
  }

  requestDataDeletion(): Observable<{ message: string }> {
    return this.http.post<{ message: string }>(`${this.api}/me/data-deletion`, {});
  }
}
