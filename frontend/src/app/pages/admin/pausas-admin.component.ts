import { DatePipe, DecimalPipe } from '@angular/common';
import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Area, AreaCompliance, TelemetryEvent, TelemetrySummaryRow } from '../../core/api.types';
import { AdminService } from '../../core/services/admin.service';
import { AnalyticsService } from '../../core/services/analytics.service';
import { apiError, downloadBlob, localTime } from '../../core/utils';

type StatusKey = 'all' | 'inicio' | 'fin' | 'aplazado' | 'cancelado';

interface StatusMeta {
  key: StatusKey;
  label: string;
  kpiLabel: string;
  types: number[];
  /** Color del número grande en la tarjeta KPI. */
  valueClass: string;
  /** Fondo + color del icono dentro de la tarjeta KPI. */
  iconBox: string;
  iconPath: string;
  /** Clases del chip/etiqueta de estado en la tabla. */
  chipClass: string;
  /** Color del icono suelto (columna "Evento"). */
  iconClass: string;
}

const STATUS_META: StatusMeta[] = [
  {
    key: 'inicio',
    label: 'Inicio',
    kpiLabel: 'INICIO',
    types: [1],
    valueClass: 'text-blue-900',
    iconBox: 'bg-blue-50 text-blue-700',
    iconPath: 'M8 5v14l11-7z',
    chipClass: 'bg-blue-50 border-blue-100 text-brand-800',
    iconClass: 'text-brand-700',
  },
  {
    key: 'fin',
    label: 'Completadas',
    kpiLabel: 'COMPLETADAS',
    types: [2],
    valueClass: 'text-emerald-700',
    iconBox: 'bg-emerald-50 text-emerald-600',
    iconPath: 'M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z',
    chipClass: 'bg-emerald-50 border-emerald-200/80 text-emerald-700',
    iconClass: 'text-emerald-600',
  },
  {
    key: 'aplazado',
    label: 'Aplazado',
    kpiLabel: 'APLAZADO',
    types: [3],
    valueClass: 'text-amber-600',
    iconBox: 'bg-amber-50 text-amber-600',
    iconPath: 'M12 8v4l3 2m6-2a9 9 0 11-18 0 9 9 0 0118 0z',
    chipClass: 'bg-amber-50 border-amber-200/80 text-amber-800',
    iconClass: 'text-amber-600',
  },
  {
    key: 'cancelado',
    label: 'Cancelado',
    kpiLabel: 'CANCELADO',
    types: [4],
    valueClass: 'text-rose-600',
    iconBox: 'bg-rose-50 text-rose-600',
    iconPath: 'M10 10v6M14 10v6M4 7h16M6 7l1 13h10l1-13',
    chipClass: 'bg-rose-50 border-rose-200/80 text-rose-700',
    iconClass: 'text-rose-500',
  },
];

const AVATAR_BG = [
  'bg-blue-100 text-brand-900',
  'bg-indigo-100 text-indigo-900',
  'bg-amber-100 text-amber-900',
  'bg-teal-100 text-teal-900',
  'bg-rose-100 text-rose-800',
  'bg-emerald-100 text-emerald-900',
];

@Component({
  selector: 'app-pausas-admin',
  imports: [DatePipe, DecimalPipe, FormsModule],
  templateUrl: './pausas-admin.component.html',
  styleUrl: './pausas-admin.component.scss',
})
export class PausasAdminComponent implements OnInit {
  private readonly admin = inject(AdminService);
  private readonly analytics = inject(AnalyticsService);

  readonly statusMeta = STATUS_META;
  readonly events = signal<TelemetryEvent[]>([]);
  readonly summary = signal<TelemetrySummaryRow[]>([]);
  readonly areas = signal<Area[]>([]);
  readonly compliance = signal<AreaCompliance[]>([]);
  readonly loading = signal(false);
  readonly error = signal('');
  readonly typeFilter = signal<StatusKey>('all');
  readonly areaFilter = signal('');
  readonly query = signal('');
  readonly today = new Date();

  readonly hasFilters = computed(
    () => this.typeFilter() !== 'all' || this.areaFilter() !== '' || this.query().trim() !== '',
  );

  ngOnInit(): void {
    this.admin.getAreas().subscribe({ next: (a) => this.areas.set(a), error: () => undefined });
    this.load();
    this.analytics.getAreas().subscribe({ next: (rows) => this.compliance.set(rows), error: () => undefined });
  }

  // ── KPIs con conteos reales del endpoint /telemetry/summary ──
  readonly kpis = computed(() => {
    const counts = new Map(this.summary().map((r) => [r.type, r.count]));
    return STATUS_META.map((meta) => ({
      meta,
      count: meta.types.reduce((acc, t) => acc + (counts.get(t) ?? 0), 0),
    }));
  });

  readonly totalEvents = computed(() => this.kpis().reduce((acc, k) => acc + k.count, 0));

  /** Tasa de cumplimiento = completadas / (completadas + aplazadas + canceladas). */
  readonly completionRate = computed(() => {
    const finished = this.summary()
      .filter((r) => r.type === 2 || r.type === 3 || r.type === 4)
      .reduce((acc, r) => acc + r.count, 0);
    if (finished === 0) return null;
    const completed = this.summary().filter((r) => r.type === 2).reduce((acc, r) => acc + r.count, 0);
    return Math.round((completed / finished) * 100);
  });

  readonly pills = computed(() => {
    const all = this.events();
    const rows = [
      { key: 'all' as StatusKey, label: 'Todos', count: all.length },
      ...STATUS_META.map((meta) => ({
        key: meta.key,
        label: meta.label,
        count: this.countOfType(all, meta.types),
      })),
    ];
    return rows;
  });

  readonly filtered = computed(() => {
    const q = this.query().trim().toLowerCase();
    const meta = STATUS_META.find((m) => m.key === this.typeFilter());
    const areaId = this.areaFilter();
    return this.events().filter((event) => {
      if (meta && !meta.types.includes(event.type)) return false;
      if (areaId && String(event.idArea ?? '') !== areaId) return false;
      if (!q) return true;
      return (
        (event.userName ?? '').toLowerCase().includes(q) ||
        (event.areaName ?? '').toLowerCase().includes(q) ||
        (event.typeLabel ?? '').toLowerCase().includes(q) ||
        (event.reason ?? '').toLowerCase().includes(q)
      );
    });
  });

  /** Cumplimiento real por área (endpoint analytics/areas). */
  readonly areaBars = computed(() =>
    this.compliance()
      .filter((row) => row.total > 0)
      .sort((a, b) => b.complianceRate - a.complianceRate),
  );

  readonly globalRate = computed(() => {
    const total = this.areaBars().reduce((acc, r) => acc + r.total, 0);
    if (total === 0) return 0;
    const done = this.areaBars().reduce((acc, r) => acc + r.completadas, 0);
    return Math.round((done / total) * 100);
  });

  readonly lastSync = signal('');

  load(): void {
    this.loading.set(true);
    this.error.set('');
    this.lastSync.set(localTime(new Date().toISOString()));

    const filters: { type?: number; areaId?: number; limit: number } = { limit: 200 };
    const meta = STATUS_META.find((m) => m.key === this.typeFilter());
    if (meta) filters.type = meta.types[0];
    if (this.areaFilter()) filters.areaId = Number(this.areaFilter());

    this.admin.getTelemetry(filters).subscribe({
      next: (events) => {
        this.events.set(events);
        this.loading.set(false);
      },
      error: (err) => {
        this.error.set(apiError(err, 'No se pudo cargar la telemetría.'));
        this.loading.set(false);
      },
    });
    this.admin.getTelemetrySummary().subscribe({ next: (rows) => this.summary.set(rows), error: () => undefined });
  }

  setType(type: StatusKey): void {
    this.typeFilter.set(type);
    this.load();
  }

  setArea(value: string): void {
    this.areaFilter.set(value);
    this.load();
  }

  resetFilters(): void {
    this.query.set('');
    this.typeFilter.set('all');
    this.areaFilter.set('');
    this.load();
  }

  metaFor(type: number): StatusMeta {
    return STATUS_META.find((m) => m.types.includes(type)) ?? STATUS_META[3];
  }

  initials(name: string | null, fallbackId: number): string {
    const source = (name ?? '').trim();
    if (!source) return `#${fallbackId}`;
    const parts = source.split(/\s+/).slice(0, 2);
    return parts.map((p) => p.charAt(0).toUpperCase()).join('');
  }

  avatarClass(event: TelemetryEvent): string {
    return AVATAR_BG[event.idUser % AVATAR_BG.length];
  }

  /**
   * Mapa usuario → último evento de tipo INICIO. Permite calcular la duración
   * de una pausa completada (FIN − INICIO) sin recorrer la lista en cada fila.
   */
  private readonly lastStartByUser = computed(() => {
    const map = new Map<number, string>();
    for (const event of this.events()) {
      if (event.type !== 1) continue;
      const current = map.get(event.idUser);
      if (!current || event.occurredAt > current) map.set(event.idUser, event.occurredAt);
    }
    return map;
  });

  /** Duración entre el último INICIO y este FIN del mismo usuario, si existe. */
  durationOf(event: TelemetryEvent): string | null {
    if (event.type !== 2) return null;
    const start = this.lastStartByUser().get(event.idUser);
    if (!start) return null;
    const ms = new Date(event.occurredAt).getTime() - new Date(start).getTime();
    if (!Number.isFinite(ms) || ms < 0) return null;
    return `${Math.max(1, Math.round(ms / 60_000))} min`;
  }

  exportCsv(): void {
    const rows = this.filtered();
    if (rows.length === 0) return;
    const header = ['ID', 'Trabajador', 'Área', 'Evento', 'Motivo', 'Ocurrió', 'Duración'];
    const lines = rows.map((e) => {
      const meta = this.metaFor(e.type);
      return [
        e.id,
        `"${(e.userName ?? `#${e.idUser}`).replace(/"/g, '""')}"`,
        `"${(e.areaName ?? '').replace(/"/g, '""')}"`,
        meta.label,
        `"${(e.reason ?? '').replace(/"/g, '""')}"`,
        e.occurredAt,
        this.durationOf(e) ?? '--',
      ].join(',');
    });
    const csv = '\uFEFF' + [header.join(','), ...lines].join('\n');
    downloadBlob(new Blob([csv], { type: 'text/csv;charset=utf-8;' }), 'bitacora-pausas.csv');
  }

  exportXlsx(): void {
    this.analytics.exportExcel().subscribe({
      next: (blob) => downloadBlob(blob, 'cumplimiento-pausas.xlsx'),
      error: (err) => this.error.set(apiError(err, 'No se pudo exportar el reporte.')),
    });
  }

  exportPdf(): void {
    this.analytics.exportPdf().subscribe({
      next: (blob) => downloadBlob(blob, 'cumplimiento-pausas.pdf'),
      error: (err) => this.error.set(apiError(err, 'No se pudo exportar el reporte.')),
    });
  }

  private countOfType(list: TelemetryEvent[], types: number[]): number {
    return list.filter((e) => types.includes(e.type)).length;
  }
}