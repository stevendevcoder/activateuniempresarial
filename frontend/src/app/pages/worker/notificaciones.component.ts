import { Component, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { PausasService } from '../../core/services/pausas.service';
import { IconComponent } from '../../shared/icon.component';

@Component({
  selector: 'app-notificaciones',
  imports: [RouterLink, IconComponent],
  template: `
    <section class="page">
      <header class="hero-navy">
        <a routerLink="/app" class="back"><app-icon name="arrow-left" [size]="20" /></a>
        <div class="row">
          <h1>Notificaciones</h1>
          <button type="button" (click)="pausas.markNotificationsRead()">Marcar leídas</button>
        </div>
      </header>
      <div class="list">
        @for (item of pausas.notifications(); track item.id) {
          <article class="card" [class.read]="item.read">
            <b>{{ item.title }}</b>
            <p>{{ item.body }}</p>
            <small>{{ item.time }}</small>
          </article>
        } @empty {
          <p class="empty">No tienes notificaciones por ahora.</p>
        }
      </div>
    </section>
  `,
  styles: `
    .back { color: #fff; display: inline-grid; margin-bottom: 8px; }
    .row { display: flex; justify-content: space-between; align-items: center; }
    button { border: 0; background: transparent; color: rgba(255,255,255,.8); font-weight: 700; cursor: pointer; }
    @media (min-width: 900px) { .list { padding: 24px 40px; max-width: 980px; } }
    .list { padding: 16px; display: grid; gap: 12px; }
    .read { opacity: .7; }
    p, small { margin: 4px 0 0; color: #64748b; }
  `,
})
export class NotificacionesComponent {
  readonly pausas = inject(PausasService);
}
