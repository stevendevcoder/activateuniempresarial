import { DatePipe, DecimalPipe } from '@angular/common';
import { Component, OnInit, inject, signal } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { AdminUser, UserCompliance } from '../../core/api.types';
import { AdminService } from '../../core/services/admin.service';
import { AnalyticsService } from '../../core/services/analytics.service';
import { apiError } from '../../core/utils';
import { AvatarComponent, avatarKind } from '../../shared/avatar.component';
import { IconComponent } from '../../shared/icon.component';
import { ProgressRingComponent } from '../../shared/progress-ring.component';
import { trackStatus } from './seguimiento.component';

@Component({
  selector: 'app-trabajador-detalle',
  imports: [RouterLink, DatePipe, DecimalPipe, AvatarComponent, IconComponent, ProgressRingComponent],
  template: `
    <section class="page">
      <header class="hero-navy">
        <a routerLink="/admin/seguimiento" class="back"><app-icon name="arrow-left" [size]="20" /></a>
        <h1>Detalle</h1>
      </header>
      @if (worker(); as worker) {
        <div class="sheet">
          <article class="card center">
            <app-avatar [kind]="kind" [photo]="worker.photo" [size]="72" />
            <h2>{{ worker.name }}</h2>
            <p>{{ worker.areaName ?? 'Sin área asignada' }}</p>
            <small>{{ worker.email }}</small>
            @if (user(); as user) {
              <small>{{ user.roleName ?? 'Sin rol' }} · {{ user.status === 1 ? 'Activo' : 'Inactivo' }}</small>
            }
          </article>
          <article class="card row">
            <app-progress-ring [done]="worker.todayCompleted" [total]="worker.todayTotal" />
            <div>
              <b>{{ worker.complianceRate | number: '1.0-1' }}%</b>
              <p>Cumplimiento histórico</p>
              <span [class]="status">{{ status === 'ok' ? 'Al día' : 'Pausas pendientes' }}</span>
            </div>
          </article>
          <div class="stats">
            <div><b>{{ worker.total }}</b><span>Registradas</span></div>
            <div class="ok"><b>{{ worker.completadas }}</b><span>Completadas</span></div>
            <div class="amber"><b>{{ worker.aplazadas }}</b><span>Aplazadas</span></div>
            <div class="bad"><b>{{ worker.canceladas }}</b><span>Canceladas</span></div>
          </div>
          <article class="card">
            <p class="label">Última actividad</p>
            <p class="last">
              {{ worker.lastActivity ? (worker.lastActivity | date: 'fullDate') + ' · ' + (worker.lastActivity | date: 'shortTime') : 'Sin actividad registrada' }}
            </p>
          </article>
        </div>
      } @else {
        <div class="sheet">
          <article class="card center">
            <p>{{ error() || (loading() ? 'Cargando…' : 'No encontramos ese trabajador.') }}</p>
          </article>
        </div>
      }
    </section>
  `,
  styles: `
    .back { color: #fff; display: inline-grid; margin-bottom: 8px; }
    .center { display: grid; justify-items: center; text-align: center; }
    .center app-avatar { margin: 0 auto 8px; }
    h2 { margin: 8px 0 4px; }
    p, small { display: block; margin: 2px 0; color: #64748b; }
    .row { display: flex; align-items: center; gap: 16px; }
    b { display: block; font-size: 32px; color: #1b2f8a; }
    span.ok, span.pending { display: inline-flex; margin-top: 8px; padding: 4px 10px; border-radius: 999px; font-size: 12px; font-weight: 800; }
    span.ok { background: #ecfdf3; color: #16a34a; }
    span.pending { background: #fff1f2; color: #e11d48; }
    .stats { display: grid; grid-template-columns: repeat(2, 1fr); overflow: hidden; border-radius: 24px; background: #eef2ff; text-align: center; }
    .stats div { padding: 14px 8px; }
    .stats b { font-size: 22px; }
    .stats span { color: #64748b; font-size: 12px; }
    .stats .ok b { color: #16a34a; }
    .stats .amber b { color: #d97706; }
    .stats .bad b { color: #e11d48; }
    .label { margin: 0 0 6px; font-size: 11px; font-weight: 800; letter-spacing: 0.16em; text-transform: uppercase; }
    .last { color: #0f172a; font-weight: 700; text-transform: capitalize; }
    @media (min-width: 900px) {
      .sheet { max-width: 720px; }
      .stats { grid-template-columns: repeat(4, 1fr); }
    }
  `,
})
export class TrabajadorDetalleComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly analytics = inject(AnalyticsService);
  private readonly admin = inject(AdminService);
  private readonly id = Number(this.route.snapshot.paramMap.get('id'));

  readonly worker = signal<UserCompliance | null>(null);
  readonly user = signal<AdminUser | null>(null);
  readonly loading = signal(true);
  readonly error = signal('');
  readonly kind = avatarKind(this.id);

  get status(): 'ok' | 'pending' {
    const w = this.worker();
    return w ? trackStatus(w) : 'pending';
  }

  ngOnInit(): void {
    this.analytics.getUsers().subscribe({
      next: (list) => {
        this.worker.set(list.find((w) => w.idUser === this.id) ?? null);
        this.loading.set(false);
      },
      error: (err) => {
        this.error.set(apiError(err, 'No se pudo cargar el detalle.'));
        this.loading.set(false);
      },
    });
    this.admin.getUser(this.id).subscribe({ next: (u) => this.user.set(u), error: () => undefined });
  }
}
