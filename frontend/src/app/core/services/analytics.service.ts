import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { AnalyticsSummary, AreaCompliance, TimelinePoint, UserCompliance } from '../api.types';

@Injectable({ providedIn: 'root' })
export class AnalyticsService {
  private readonly http = inject(HttpClient);
  private readonly base = `${environment.apiUrl}/api/analytics`;

  getSummary(): Observable<AnalyticsSummary> {
    return this.http.get<AnalyticsSummary>(`${this.base}/summary`);
  }

  getTimeline(granularity: 'day' | 'month' = 'day', start?: string): Observable<TimelinePoint[]> {
    const params: Record<string, string> = { granularity };
    if (start) params['start'] = start;
    return this.http.get<TimelinePoint[]>(`${this.base}/timeline`, { params });
  }

  getAreas(): Observable<AreaCompliance[]> {
    return this.http.get<AreaCompliance[]>(`${this.base}/areas`);
  }

  getUsers(): Observable<UserCompliance[]> {
    return this.http.get<UserCompliance[]>(`${this.base}/users`);
  }

  exportPdf(): Observable<Blob> {
    return this.http.get(`${this.base}/export/pdf`, { responseType: 'blob' });
  }

  exportExcel(): Observable<Blob> {
    return this.http.get(`${this.base}/export/xlsx`, { responseType: 'blob' });
  }
}
