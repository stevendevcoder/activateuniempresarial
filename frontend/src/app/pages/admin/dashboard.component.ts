import { DatePipe, DecimalPipe } from '@angular/common';
import { Component, OnInit, computed, inject, signal } from '@angular/core';

import { AnalyticsSummary, AreaCompliance, TimelinePoint, UserCompliance } from '../../core/api.types';
import { AnalyticsService } from '../../core/services/analytics.service';
import { PausasService } from '../../core/services/pausas.service';
import { apiError, downloadBlob, startOfDay, WEEKDAY_LABELS } from '../../core/utils';

const LOW_COMPLIANCE = 60;

@Component({
  selector: 'app-dashboard',
  imports: [DatePipe, DecimalPipe],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.scss',
})
export class DashboardComponent implements OnInit {
  private readonly analytics = inject(AnalyticsService);
  private readonly pausas = inject(PausasService);

  readonly summary = signal<AnalyticsSummary | null>(null);
  readonly timeline = signal<TimelinePoint[]>([]);
  readonly areas = signal<AreaCompliance[]>([]);
  readonly users = signal<UserCompliance[]>([]);
  readonly error = signal('');
  readonly exporting = signal(false);

  readonly pending = computed(() => {
    const s = this.summary();
    return s ? s.programadas + s.aplazadas : 0;
  });

  readonly proximasSesiones = computed(() => {
    return this.pausas.pauses().filter(p => p.kind === 'active');
  });

  readonly today = new Date();

  readonly avgWeekly = computed(() => {
    const values = this.weekly().map((d) => d.value).filter((v) => v > 0);
    return values.length ? Math.round(values.reduce((a, b) => a + b, 0) / values.length) : 0;
  });

  /** Últimos 7 días (incluye días sin pausas) con el % de cumplimiento diario. */
  readonly weekly = computed(() => {
    const byDay = new Map(this.timeline().map((p) => [p.period, p]));
    const days = [];
    for (let i = 6; i >= 0; i--) {
      const day = startOfDay(new Date());
      day.setDate(day.getDate() - i);
      const key = `${day.getFullYear()}-${String(day.getMonth() + 1).padStart(2, '0')}-${String(day.getDate()).padStart(2, '0')}`;
      const point = byDay.get(key);
      const total = point?.total ?? 0;
      days.push({
        key,
        day: WEEKDAY_LABELS[day.getDay()],
        total,
        value: total ? Math.round(((point?.completadas ?? 0) / total) * 100) : 0,
      });
    }
    return days;
  });

  readonly alerts = computed(() => {
    const list: string[] = [];
    for (const area of this.areas()) {
      if (area.total > 0 && area.complianceRate < LOW_COMPLIANCE) {
        list.push(`${area.areaName} tiene un cumplimiento de ${area.complianceRate}%.`);
      }
    }
    const idle = this.users().filter((u) => u.todayCompleted === 0).length;
    if (idle > 0) list.push(`${idle} trabajador(es) sin pausas completadas hoy.`);
    const cancelled = this.summary()?.canceladas ?? 0;
    if (cancelled > 0) list.push(`${cancelled} pausa(s) cancelada(s) en el periodo.`);
    return list;
  });

  ngOnInit(): void {
    const since = startOfDay(new Date());
    since.setDate(since.getDate() - 6);
    const fail = (err: unknown) => this.error.set(apiError(err, 'No se pudo cargar la analítica.'));

    this.analytics.getSummary().subscribe({ next: (s) => this.summary.set(s), error: fail });
    this.analytics.getTimeline('day', since.toISOString()).subscribe({ next: (t) => this.timeline.set(t), error: fail });
    this.analytics.getAreas().subscribe({ next: (a) => this.areas.set(a), error: fail });
    this.analytics.getUsers().subscribe({ next: (u) => this.users.set(u), error: () => undefined });
    this.pausas.load();
  }

  downloadPdf(): void {
    this.export(this.analytics.exportPdf(), 'informe-pausas-activas.pdf');
  }

  downloadExcel(): void {
    this.export(this.analytics.exportExcel(), 'reporte-pausas-activas.xlsx');
  }

  private export(request: ReturnType<AnalyticsService['exportPdf']>, filename: string): void {
    this.exporting.set(true);
    request.subscribe({
      next: (blob) => {
        this.exporting.set(false);
        downloadBlob(blob, filename);
      },
      error: (err) => {
        this.exporting.set(false);
        this.error.set(apiError(err, 'No se pudo generar el informe.'));
      },
    });
  }
}
