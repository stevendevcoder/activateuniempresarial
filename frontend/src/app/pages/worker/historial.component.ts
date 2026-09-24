import { Component, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { PausasService } from '../../core/services/pausas.service';
import { IconComponent } from '../../shared/icon.component';

@Component({
  selector: 'app-historial',
  imports: [RouterLink, IconComponent],
  template: `
    <section class="page">
      <header class="hero-navy">
        <a routerLink="/app/pausas" class="back"><app-icon name="arrow-left" [size]="20" /></a>
        <h1>Historial</h1>
        <p>Cumplimiento de pausas activas</p>
      </header>
      <div class="list">
        @for (day of pausas.history(); track day.date) {
          <article class="card">
            <div class="row">
              <div>
                <b>{{ day.label }}</b>
                <small>{{ day.date }}</small>
              </div>
              <em>{{ day.completed }}/{{ day.total }}</em>
            </div>
            <div class="bar"><i [style.width.%]="day.total ? (day.completed / day.total) * 100 : 0"></i></div>
          </article>
        }
        @if (pausas.stats(); as stats) {
          <article class="card summary">
            <div><b>{{ stats.weeklyCompleted }}</b><small>Últimos 7 días</small></div>
            <div><b>{{ stats.completadas }}</b><small>Total completadas</small></div>
            <div><b>{{ stats.aplazadas }}</b><small>Aplazadas</small></div>
            <div><b>{{ stats.canceladas }}</b><small>Canceladas</small></div>
          </article>
        }
      </div>
    </section>
  `,
  styles: `
    .back { display: inline-grid; place-items: center; width: 32px; height: 32px; color: #fff; margin-bottom: 8px; }
    .list { padding: 16px; display: grid; gap: 12px; }
    .row { display: flex; justify-content: space-between; }
    b { display: block; }
    small, em { color: #94a3b8; font-size: 12px; font-style: normal; }
    .bar { height: 8px; margin-top: 10px; border-radius: 999px; background: #eef2ff; overflow: hidden; }
    .bar i { display: block; height: 100%; background: #1b2f8a; }
    .summary { display: grid; grid-template-columns: repeat(2, 1fr); gap: 12px; text-align: center; }
    .summary b { color: #1b2f8a; font-size: 22px; }
    @media (min-width: 900px) {
      .list { padding: 24px 40px; max-width: 980px; }
      .summary { grid-template-columns: repeat(4, 1fr); }
    }
  `,
})
export class HistorialComponent {
  readonly pausas = inject(PausasService);
}
