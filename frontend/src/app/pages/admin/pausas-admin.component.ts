import { DatePipe } from '@angular/common';
import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { Area, TelemetryEvent, TelemetrySummaryRow } from '../../core/api.types';
import { AdminService } from '../../core/services/admin.service';
import { apiError } from '../../core/utils';
import { IconComponent } from '../../shared/icon.component';

const TYPE_META: Record<number, { label: string; icon: string; kpi: string; chip: string }> = {
  1: { label: 'Inicio', icon: 'play', kpi: 'blue', chip: 'chip-info' },
  2: { label: 'Fin', icon: 'check-circle', kpi: 'green', chip: 'chip-ok' },
  3: { label: 'Aplazado', icon: 'clock', kpi: 'amber', chip: 'chip-amber' },
  4: { label: 'Cancelado', icon: 'x-circle', kpi: 'red', chip: 'chip-warn' },
};

@Component({
  selector: 'app-pausas-admin',
  imports: [DatePipe, IconComponent],
  template: `
    <section class="page">
      <header class="hero-navy">
        <div class="hero-row">
          <div>
            <h1>Pausas</h1>
            <p>Registro de eventos de cumplimiento</p>
          </div>
          <button type="button" class="hero-btn" (click)="load()" aria-label="Actualizar">
            <app-icon name="refresh" [size]="20" />
          </button>
        </div>
      </header>

      <div class="page-body">
        <div class="kpi-grid">
          @for (card of cards(); track card.type) {
            <article class="kpi" [class]="card.kpi">
              <span>{{ card.label }} <app-icon [name]="card.icon" [size]="16" /></span>
              <b>{{ card.count }}</b>
            </article>
          }
        </div>

        <div class="toolbar">
          <div class="filters">
            <button type="button" [class.on]="typeFilter() === null" (click)="setType(null)">Todos</button>
            @for (type of types; track type) {
              <button type="button" [class.on]="typeFilter() === type" (click)="setType(type)">{{ meta(type).label }}</button>
            }
          </div>
          <select class="input area-select" [value]="areaFilter()" (change)="setArea($any($event.target).value)" aria-label="Filtrar por área">
            <option value="">Todas las áreas</option>
            @for (area of areas(); track area.id) {
              <option [value]="area.id">{{ area.name }}</option>
            }
          </select>
        </div>

        @if (error()) {
          <p class="alert alert-error">{{ error() }}</p>
        }

        <article class="card">
          <div class="rows">
            @for (event of events(); track event.id) {
              <div class="row-item">
                <div>
                  <b>{{ event.userName ?? 'Trabajador #' + event.idUser }}</b>
                  <small>{{ event.areaName ?? 'Sin área' }} · {{ event.occurredAt | date: 'short' }}</small>
                  @if (event.reason) {
                    <small class="reason">“{{ event.reason }}”</small>
                  }
                </div>
                <span class="chip chip-sm" [class]="meta(event.type).chip">{{ event.typeLabel }}</span>
              </div>
            } @empty {
              <p class="empty">{{ loading() ? 'Cargando eventos…' : 'No hay eventos registrados.' }}</p>
            }
          </div>
        </article>
      </div>
    </section>
  `,
  styles: `
    .toolbar { display: grid; gap: 10px; }
    .area-select { max-width: 320px; background-color: #fff; }
    .reason { color: #64748b !important; font-style: italic; }
    @media (min-width: 900px) {
      .toolbar { grid-template-columns: 1fr auto; align-items: center; }
      .area-select { width: 260px; }
    }
  `,
})
export class PausasAdminComponent implements OnInit {
  private readonly admin = inject(AdminService);

  readonly types = [1, 2, 3, 4];
  readonly events = signal<TelemetryEvent[]>([]);
  readonly summary = signal<TelemetrySummaryRow[]>([]);
  readonly areas = signal<Area[]>([]);
  readonly loading = signal(false);
  readonly error = signal('');
  readonly typeFilter = signal<number | null>(null);
  readonly areaFilter = signal('');

  readonly cards = computed(() => {
    const counts = new Map(this.summary().map((r) => [r.type, r.count]));
    return this.types.map((type) => ({ type, ...TYPE_META[type], count: counts.get(type) ?? 0 }));
  });

  ngOnInit(): void {
    this.admin.getAreas().subscribe({ next: (a) => this.areas.set(a), error: () => undefined });
    this.load();
  }

  meta(type: number) {
    return TYPE_META[type] ?? TYPE_META[4];
  }

  setType(type: number | null): void {
    this.typeFilter.set(type);
    this.load();
  }

  setArea(value: string): void {
    this.areaFilter.set(value);
    this.load();
  }

  load(): void {
    this.loading.set(true);
    this.error.set('');
    const filters: { type?: number; areaId?: number; limit: number } = { limit: 200 };
    if (this.typeFilter() !== null) filters.type = this.typeFilter()!;
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
}
