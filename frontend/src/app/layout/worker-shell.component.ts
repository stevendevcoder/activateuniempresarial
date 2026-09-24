import { Component, OnInit, inject } from '@angular/core';
import { Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { AuthService } from '../core/services/auth.service';
import { PausasService } from '../core/services/pausas.service';
import { RutinasService } from '../core/services/rutinas.service';
import { IconComponent } from '../shared/icon.component';

@Component({
  selector: 'app-worker-shell',
  imports: [RouterOutlet, RouterLink, RouterLinkActive, IconComponent],
  template: `
    <div class="page-full">
      @if (!hideNav()) {
        <nav class="tabbar">
          <div class="brand-side">
            <img src="logo-ue.png" alt="Uniempresarial" />
            <strong>ACTIVATE</strong>
          </div>
          @for (item of items; track item.path) {
            <a
              [routerLink]="item.path"
              routerLinkActive="active-link"
              [routerLinkActiveOptions]="{ exact: item.exact }"
            >
              <app-icon [name]="item.icon" [size]="22" />
              {{ item.label }}
            </a>
          }
        </nav>
      }
      <div class="app-content">
        <router-outlet />
      </div>
    </div>
  `,
})
export class WorkerShellComponent implements OnInit {
  private readonly router = inject(Router);
  private readonly auth = inject(AuthService);
  private readonly pausas = inject(PausasService);
  private readonly rutinas = inject(RutinasService);

  ngOnInit(): void {
    this.rutinas.load();
    // El área puede haber cambiado desde el último login: se refresca antes de armar la jornada.
    this.auth.refreshProfile().subscribe({
      next: () => this.pausas.load(),
      error: () => this.pausas.load(),
    });
  }

  hideNav(): boolean {
    return this.router.url.includes('/pausas/ejecutar');
  }

  readonly items = [
    { path: '/app', label: 'Inicio', icon: 'home', exact: true },
    { path: '/app/pausas', label: 'Mis pausas', icon: 'clock', exact: false },
    { path: '/app/rutinas', label: 'Rutinas', icon: 'activity', exact: false },
    { path: '/app/perfil', label: 'Perfil', icon: 'user', exact: false },
  ];
}
