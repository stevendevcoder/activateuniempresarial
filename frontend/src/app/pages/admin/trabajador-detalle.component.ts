import { Component, computed, inject } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { UsersService } from '../../core/services/users.service';
import { AvatarComponent } from '../../shared/avatar.component';
import { IconComponent } from '../../shared/icon.component';
import { ProgressRingComponent } from '../../shared/progress-ring.component';

@Component({
  selector: 'app-trabajador-detalle',
  imports: [RouterLink, AvatarComponent, IconComponent, ProgressRingComponent],
  template: `
    @if (worker(); as worker) {
      <section class="page">
        <header class="hero-navy">
          <a routerLink="/admin/seguimiento" class="back"><app-icon name="arrow-left" [size]="20" /></a>
          <h1>Detalle</h1>
        </header>
        <div class="sheet">
          <article class="card center">
            <app-avatar [kind]="worker.avatar" [size]="72" />
            <h2>{{ worker.name }}</h2>
            <p>{{ worker.area }}</p>
            <small>{{ worker.email }}</small>
            <small>Jornada {{ worker.jornada }}</small>
          </article>
          <article class="card row">
            <app-progress-ring [done]="worker.completedToday" [total]="worker.totalToday" />
            <div>
              <b>{{ worker.compliance }}%</b>
              <p>Promedio de la semana</p>
              <span [class]="worker.status">{{ worker.status === 'ok' ? 'Al día' : 'Pausas pendientes' }}</span>
            </div>
          </article>
        </div>
      </section>
    } @else {
      <section class="page" style="padding:24px">
        <a routerLink="/admin/seguimiento">Volver</a>
        <p>No encontramos ese trabajador.</p>
      </section>
    }
  `,
  styles: `
    .back { color: #fff; display: inline-grid; margin-bottom: 8px; }
    .center { text-align: center; }
    .center app-avatar { margin: 0 auto 8px; }
    h2 { margin: 8px 0 4px; }
    p, small { display: block; color: #64748b; }
    .row { display: flex; align-items: center; gap: 16px; }
    b { display: block; font-size: 32px; color: #1b2f8a; }
    span { display: inline-flex; margin-top: 8px; padding: 4px 10px; border-radius: 999px; font-size: 12px; font-weight: 800; }
    .ok { background: #ecfdf3; color: #16a34a; }
    .pending { background: #fff1f2; color: #e11d48; }
  `,
})
export class TrabajadorDetalleComponent {
  private readonly route = inject(ActivatedRoute);
  private readonly users = inject(UsersService);
  private readonly id = Number(this.route.snapshot.paramMap.get('id'));
  readonly worker = computed(() => this.users.workers().find((w) => w.id === this.id));
}
