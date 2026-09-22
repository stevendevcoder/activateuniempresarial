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
            <div class="bar"><i [style.width.%]="(day.completed / day.total) * 100"></i></div>
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
  `,
})
export class HistorialComponent {
  readonly pausas = inject(PausasService);
}
