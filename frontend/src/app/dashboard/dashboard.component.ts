import { Component, ElementRef, OnDestroy, effect, inject, signal, viewChild } from '@angular/core';
import { DecimalPipe } from '@angular/common';
import {
  LucideAngularModule,
  BarChart3,
  TrendingUp,
  Users,
  Building2,
  Activity,
  ClipboardList,
  Download,
} from 'lucide-angular';
import { Chart, ChartConfiguration, registerables } from 'chart.js';
import { AnalyticsService } from '../admin/analytics.service';
import { AnalyticsSummary, AreaCompliance, TimelinePoint } from '../admin/analytics.types';

Chart.register(...registerables);

@Component({
  selector: 'app-dashboard',
  imports: [DecimalPipe, LucideAngularModule],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.scss',
})
export class DashboardComponent implements OnDestroy {
  private readonly analytics = inject(AnalyticsService);

  readonly ic = { BarChart3, TrendingUp, Users, Building2, Activity, ClipboardList, Download };

  readonly summary = signal<AnalyticsSummary | null>(null);
  readonly areas = signal<AreaCompliance[]>([]);

  private readonly timelineData = signal<TimelinePoint[] | null>(null);
  private readonly areaData = signal<AreaCompliance[] | null>(null);

  private readonly timelineCanvas = viewChild<ElementRef<HTMLCanvasElement>>('timelineCanvas');
  private readonly areaCanvas = viewChild<ElementRef<HTMLCanvasElement>>('areaCanvas');

  private timelineChart: Chart | null = null;
  private areaBarChart: Chart | null = null;

  constructor() {
    effect(() => {
      const canvas = this.timelineCanvas()?.nativeElement;
      const data = this.timelineData();
      if (canvas && data && !this.timelineChart) {
        this.timelineChart = this.buildTimelineChart(canvas, data);
      }
    });

    effect(() => {
      const canvas = this.areaCanvas()?.nativeElement;
      const data = this.areaData();
      if (canvas && data && !this.areaBarChart) {
        this.areaBarChart = this.buildAreaChart(canvas, data);
      }
    });

    this.analytics.getSummary().subscribe((summary) => this.summary.set(summary));
    this.analytics.getTimeline('day').subscribe((data) => this.timelineData.set(data));
    this.analytics.getAreas().subscribe((data) => {
      this.areas.set(data);
      this.areaData.set(data);
    });
  }

  ngOnDestroy(): void {
    this.timelineChart?.destroy();
    this.areaBarChart?.destroy();
  }

  downloadPdf(): void {
    this.analytics.exportPdf().subscribe((blob) => this.downloadBlob(blob, 'dashboard.pdf'));
  }

  downloadExcel(): void {
    this.analytics.exportExcel().subscribe((blob) => this.downloadBlob(blob, 'dashboard.xlsx'));
  }

  private buildTimelineChart(canvas: HTMLCanvasElement, data: TimelinePoint[]): Chart | null {
    const ctx = canvas.getContext('2d');
    if (!ctx) return null;
    return new Chart(ctx, {
      type: 'line',
      data: {
        labels: data.map((d) => d.period),
        datasets: [
          {
            label: 'Completadas',
            data: data.map((d) => d.completadas),
            borderColor: '#182987',
            backgroundColor: 'rgba(24,41,135,0.08)',
            fill: true,
            tension: 0.4,
            borderWidth: 2,
            pointRadius: 3,
            pointBackgroundColor: '#182987',
          },
          {
            label: 'Aplazadas',
            data: data.map((d) => d.aplazadas),
            borderColor: '#f59e0b',
            backgroundColor: 'rgba(245,158,11,0.08)',
            fill: true,
            tension: 0.4,
            borderWidth: 2,
            pointRadius: 3,
            pointBackgroundColor: '#f59e0b',
          },
          {
            label: 'Canceladas',
            data: data.map((d) => d.canceladas),
            borderColor: '#ed1736',
            backgroundColor: 'rgba(237,23,54,0.08)',
            fill: true,
            tension: 0.4,
            borderWidth: 2,
            pointRadius: 3,
            pointBackgroundColor: '#ed1736',
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: { legend: { position: 'bottom', labels: { usePointStyle: true, padding: 16 } } },
        scales: {
          x: { grid: { display: false }, ticks: { maxRotation: 0, autoSkip: true, maxTicksLimit: 7 } },
          y: { beginAtZero: true, grid: { color: '#f1f5f9' }, ticks: { stepSize: 1 } },
        },
      },
    });
  }

  private buildAreaChart(canvas: HTMLCanvasElement, data: AreaCompliance[]): Chart | null {
    const ctx = canvas.getContext('2d');
    if (!ctx) return null;
    return new Chart(ctx, {
      type: 'bar',
      data: {
        labels: data.map((a) => a.areaName),
        datasets: [
          { label: 'Completadas', data: data.map((a) => a.completadas), backgroundColor: '#182987', borderRadius: 6 },
          { label: 'Canceladas', data: data.map((a) => a.canceladas), backgroundColor: '#ed1736', borderRadius: 6 },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: { legend: { position: 'bottom', labels: { usePointStyle: true, padding: 16 } } },
        scales: {
          x: { grid: { display: false } },
          y: { beginAtZero: true, grid: { color: '#f1f5f9' }, ticks: { stepSize: 1 } },
        },
      },
    });
  }

  private downloadBlob(blob: Blob, filename: string): void {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  }
}
