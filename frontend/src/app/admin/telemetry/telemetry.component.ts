import { Component, OnInit, inject, signal } from '@angular/core';
import { DatePipe } from '@angular/common';
import { LucideAngularModule, ClipboardList, RefreshCw, Play, CheckCircle2, Clock, XCircle } from 'lucide-angular';
import { AdminService } from '../admin.service';
import { Area, TelemetryEvent, TelemetrySummaryRow } from '../admin.types';

@Component({
  selector: 'app-telemetry',
  imports: [DatePipe, LucideAngularModule],
  template: `
    <div class="space-y-5">
      <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div class="flex items-center gap-3">
          <div class="w-11 h-11 rounded-2xl bg-brand-blue flex items-center justify-center text-white shadow-md">
            <lucide-angular [img]="ic.ClipboardList" class="w-6 h-6"></lucide-angular>
          </div>
          <div>
            <h1 class="text-xl font-extrabold text-brand-blue tracking-tight">Pausas y telemetría</h1>
            <p class="text-sm text-slate-500">Registro inmutable de eventos de cumplimiento</p>
          </div>
        </div>
        <button (click)="load()"
                class="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border border-slate-200 bg-white text-brand-blue text-sm font-bold hover:bg-brand-soft-blue transition-colors">
          <lucide-angular [img]="ic.RefreshCw" class="w-4 h-4"></lucide-angular>
          Actualizar
        </button>
      </div>

      <div class="grid grid-cols-2 xl:grid-cols-4 gap-4">
        @for (card of summaryCards(); track card.type) {
          <div class="rounded-2xl border border-brand-soft-blue bg-white p-5 shadow-sm">
            <div class="flex items-center justify-between mb-3">
              <div class="w-10 h-10 rounded-xl flex items-center justify-center" [class]="card.bg">
                <lucide-angular [img]="card.icon" class="w-5 h-5" [class]="card.color"></lucide-angular>
              </div>
              <span class="text-[11px] font-bold text-slate-400 uppercase tracking-wider">{{ card.label }}</span>
            </div>
            <p class="text-3xl font-extrabold text-brand-blue">{{ card.count }}</p>
          </div>
        }
      </div>

      <div class="flex flex-wrap gap-3">
        <select [value]="typeFilter()" (change)="typeFilter.set($any($event.target).value); load()"
                class="px-3 py-2.5 rounded-xl border border-slate-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-brand-blue">
          <option value="">Todos los tipos</option>
          <option value="1">Inicio</option>
          <option value="2">Fin</option>
          <option value="3">Aplazamiento</option>
          <option value="4">Cancelación</option>
        </select>
        <select [value]="areaFilter()" (change)="areaFilter.set($any($event.target).value); load()"
                class="px-3 py-2.5 rounded-xl border border-slate-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-brand-blue">
          <option value="">Todas las áreas</option>
          @for (area of areas(); track area.id) {
            <option [value]="area.id">{{ area.name }}</option>
          }
        </select>
      </div>

      @if (error()) {
        <div class="p-3.5 rounded-xl bg-brand-soft-red border border-brand-red/20 text-xs text-brand-red font-medium">{{ error() }}</div>
      }

      <div class="rounded-2xl border border-brand-soft-blue bg-white shadow-sm overflow-hidden">
        <div class="overflow-x-auto">
          <table class="w-full text-sm">
            <thead>
              <tr class="border-b border-brand-soft-blue bg-brand-surface/50">
                <th class="text-left px-5 py-3 font-semibold text-slate-500">Fecha</th>
                <th class="text-left px-5 py-3 font-semibold text-slate-500">Trabajador</th>
                <th class="text-left px-5 py-3 font-semibold text-slate-500">Área</th>
                <th class="text-center px-5 py-3 font-semibold text-slate-500">Evento</th>
                <th class="text-left px-5 py-3 font-semibold text-slate-500">Motivo</th>
              </tr>
            </thead>
            <tbody>
              @for (event of events(); track event.id) {
                <tr class="border-b border-brand-soft-blue/60 hover:bg-brand-surface/50 transition-colors">
                  <td class="px-5 py-3 text-slate-600 whitespace-nowrap">{{ event.occurredAt | date:'short' }}</td>
                  <td class="px-5 py-3 font-semibold text-slate-800">{{ event.userName ?? ('#' + event.idUser) }}</td>
                  <td class="px-5 py-3 text-slate-600">{{ event.areaName ?? '—' }}</td>
                  <td class="px-5 py-3 text-center">
                    <span class="inline-flex px-2 py-0.5 rounded-full text-xs font-bold" [class]="badgeClass(event.type)">
                      {{ event.typeLabel }}
                    </span>
                  </td>
                  <td class="px-5 py-3 text-slate-500 text-xs">{{ event.reason ?? '—' }}</td>
                </tr>
              } @empty {
                <tr>
                  <td colspan="5" class="px-5 py-10 text-center text-sm text-slate-400">
                    {{ loading() ? 'Cargando…' : 'No hay eventos registrados' }}
                  </td>
                </tr>
              }
            </tbody>
          </table>
        </div>
      </div>
    </div>
  `,
})
export class TelemetryComponent implements OnInit {
  private readonly admin = inject(AdminService);

  readonly ic = { ClipboardList, RefreshCw, Play, CheckCircle2, Clock, XCircle };
  readonly events = signal<TelemetryEvent[]>([]);
  readonly summary = signal<TelemetrySummaryRow[]>([]);
  readonly areas = signal<Area[]>([]);
  readonly loading = signal(false);
  readonly error = signal('');
  readonly typeFilter = signal('');
  readonly areaFilter = signal('');

  ngOnInit(): void {
    this.admin.getAreas().subscribe({ next: (a) => this.areas.set(a), error: () => undefined });
    this.load();
  }

  load(): void {
    this.loading.set(true);
    const filters: { type?: number; areaId?: number; limit?: number } = { limit: 200 };
    if (this.typeFilter()) filters.type = Number(this.typeFilter());
    if (this.areaFilter()) filters.areaId = Number(this.areaFilter());

    this.admin.getTelemetry(filters).subscribe({
      next: (events) => {
        this.events.set(events);
        this.loading.set(false);
      },
      error: () => {
        this.error.set('No se pudo cargar la telemetría.');
        this.loading.set(false);
      },
    });

    this.admin.getTelemetrySummary().subscribe({
      next: (rows) => this.summary.set(rows),
      error: () => undefined,
    });
  }

  summaryCards() {
    const map = new Map(this.summary().map((r) => [r.type, r.count]));
    return [
      { type: 1, label: 'Inicio', icon: this.ic.Play, count: map.get(1) ?? 0, bg: 'bg-brand-soft-blue', color: 'text-brand-blue' },
      { type: 2, label: 'Fin', icon: this.ic.CheckCircle2, count: map.get(2) ?? 0, bg: 'bg-emerald-50', color: 'text-emerald-600' },
      { type: 3, label: 'Aplazado', icon: this.ic.Clock, count: map.get(3) ?? 0, bg: 'bg-amber-50', color: 'text-amber-600' },
      { type: 4, label: 'Cancelado', icon: this.ic.XCircle, count: map.get(4) ?? 0, bg: 'bg-brand-soft-red', color: 'text-brand-red' },
    ];
  }

  badgeClass(type: number): string {
    switch (type) {
      case 1:
        return 'bg-brand-soft-blue text-brand-blue';
      case 2:
        return 'bg-emerald-50 text-emerald-600';
      case 3:
        return 'bg-amber-50 text-amber-600';
      default:
        return 'bg-brand-soft-red text-brand-red';
    }
  }
}
