import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

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
}

export interface PortalStreak {
  current: number;
  best: number;
}

export interface PortalConfig {
  lunchStart: string;
  lunchEnd: string;
  maxPostponements: number;
  dashboardMode: 'realtime' | 'batch';
  updatedAt: string;
}

export interface RoutineVideoInfo {
  id: number;
  idRoutine: number;
  idVideo: number;
  videoTitle: string | null;
  videoDuration: number;
  position: number;
}

export interface PortalRoutine {
  id: number;
  name: string;
  description: string;
  totalDurationSeconds: number;
  videos: RoutineVideoInfo[];
}

export interface ConsentStatus {
  accepted: boolean;
  version: string | null;
  acceptedAt: string | null;
  revokedAt: string | null;
}

@Injectable({ providedIn: 'root' })
export class PortalService {
  private readonly http = inject(HttpClient);
  private readonly api = environment.apiUrl;

  getPauses(limit = 20): Observable<{ items: PortalPause[]; total: number }> {
    return this.http.get<{ items: PortalPause[]; total: number }>(`${this.api}/api/me/pauses`, {
      params: { limit },
    });
  }

  getStats(): Observable<PortalStats> {
    return this.http.get<PortalStats>(`${this.api}/api/me/stats`);
  }

  getStreak(): Observable<PortalStreak> {
    return this.http.get<PortalStreak>(`${this.api}/api/me/streak`);
  }

  getConfig(): Observable<PortalConfig> {
    return this.http.get<PortalConfig>(`${this.api}/api/config`);
  }

  getRoutine(id: number): Observable<PortalRoutine> {
    return this.http.get<PortalRoutine>(`${this.api}/api/routines/${id}`);
  }

  getVideoBlob(id: number): Observable<Blob> {
    return this.http.get(`${this.api}/api/media/${id}/stream`, { responseType: 'blob' });
  }

  registerPause(payload: Record<string, unknown>): Observable<{ message: string; pausa: PortalPause }> {
    return this.http.post<{ message: string; pausa: PortalPause }>(`${this.api}/api/me/pauses`, payload);
  }

  sendEvent(payload: Record<string, unknown>): Observable<{ message: string; eventId: number }> {
    return this.http.post<{ message: string; eventId: number }>(`${this.api}/api/telemetry/events`, payload);
  }

  getConsent(): Observable<ConsentStatus> {
    return this.http.get<ConsentStatus>(`${this.api}/api/me/consent`);
  }

  acceptConsent(): Observable<{ message: string; consent: unknown }> {
    return this.http.post<{ message: string; consent: unknown }>(`${this.api}/api/me/consent`, { version: '1.0' });
  }

  revokeConsent(): Observable<{ message: string }> {
    return this.http.delete<{ message: string }>(`${this.api}/api/me/consent`);
  }

  requestDataDeletion(): Observable<{ message: string }> {
    return this.http.post<{ message: string }>(`${this.api}/api/me/data-deletion`, {});
  }
}
