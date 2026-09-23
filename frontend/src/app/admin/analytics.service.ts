import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { AnalyticsSummary, AreaCompliance, TimelinePoint } from './analytics.types';

@Injectable({ providedIn: 'root' })
export class AnalyticsService {
  private readonly http = inject(HttpClient);
  private readonly base = `${environment.apiUrl}/api/analytics`;

  getSummary(): Observable<AnalyticsSummary> {
    return this.http.get<AnalyticsSummary>(`${this.base}/summary`);
  }

  getTimeline(granularity: 'day' | 'month' = 'day'): Observable<TimelinePoint[]> {
    return this.http.get<TimelinePoint[]>(`${this.base}/timeline`, { params: { granularity } });
  }

  getAreas(): Observable<AreaCompliance[]> {
    return this.http.get<AreaCompliance[]>(`${this.base}/areas`);
  }

  exportPdf(): Observable<Blob> {
    return this.http.get(`${this.base}/export/pdf`, { responseType: 'blob' });
  }

  exportExcel(): Observable<Blob> {
    return this.http.get(`${this.base}/export/xlsx`, { responseType: 'blob' });
  }
}
