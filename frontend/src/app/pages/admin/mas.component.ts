import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { ADMIN_NAV } from '../../layout/admin-shell.component';
import { IconComponent } from '../../shared/icon.component';

@Component({
  selector: 'app-admin-mas',
  imports: [RouterLink, IconComponent],
  template: `
    <section class="page">
      <header class="hero-navy">
        <h1>Más opciones</h1>
        <p>Gestión completa del programa de pausas activas</p>
      </header>
      <div class="sheet">
        @for (item of items; track item.path) {
          <a class="card link" [routerLink]="item.path">
            <span class="tile-icon"><app-icon [name]="item.icon" [size]="20" /></span>
            <div>
              <b>{{ item.label }}</b>
              <small>{{ item.description }}</small>
            </div>
            <app-icon name="arrow-right" [size]="18" />
          </a>
        }
      </div>
    </section>
  `,
  styles: `
    .link { display: flex; align-items: center; gap: 14px; color: #94a3b8; }
    .link div { flex: 1; min-width: 0; }
    b { display: block; color: #0f172a; font-size: 15px; }
    small { color: #64748b; font-size: 12px; }
  `,
})
export class AdminMasComponent {
  readonly items = ADMIN_NAV.filter((item) => !item.mobile);
}
