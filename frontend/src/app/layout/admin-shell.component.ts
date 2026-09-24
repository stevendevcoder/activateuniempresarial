import { Component, OnInit, inject } from '@angular/core';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { AuthService } from '../core/services/auth.service';
import { IconComponent } from '../shared/icon.component';

export interface AdminNavItem {
  path: string;
  label: string;
  icon: string;
  description: string;
  exact?: boolean;
  /** Visible en la barra inferior del móvil (el resto va en "Más"). */
  mobile?: boolean;
}

export const ADMIN_NAV: AdminNavItem[] = [
  { path: '/admin', label: 'Inicio', icon: 'grid', description: 'Resumen y métricas', exact: true, mobile: true },
  { path: '/admin/trabajadores', label: 'Trabajadores', icon: 'users', description: 'Usuarios, roles y áreas', mobile: true },
  { path: '/admin/seguimiento', label: 'Seguimiento', icon: 'bars', description: 'Cumplimiento por persona', mobile: true },
  { path: '/admin/areas', label: 'Áreas', icon: 'building', description: 'Departamentos y facultades' },
  { path: '/admin/rutinas', label: 'Rutinas', icon: 'activity', description: 'Rutinas y videos' },
  { path: '/admin/cronogramas', label: 'Cronogramas', icon: 'calendar', description: 'Franjas y frecuencia por área' },
  { path: '/admin/pausas', label: 'Pausas', icon: 'clock', description: 'Registro de telemetría' },
  { path: '/admin/configuracion', label: 'Configuración', icon: 'settings', description: 'Almuerzo, aplazamientos y festivos' },
  { path: '/admin/privacidad', label: 'Privacidad', icon: 'shield', description: 'Consentimientos y retención' },
  { path: '/admin/perfil', label: 'Perfil', icon: 'user', description: 'Tu cuenta' },
];

@Component({
  selector: 'app-admin-shell',
  imports: [RouterOutlet, RouterLink, RouterLinkActive, IconComponent],
  template: `
    <div class="page-full">
      <nav class="tabbar">
        <div class="brand-side">
          <img src="logo-ue.png" alt="Uniempresarial" />
          <strong>ACTIVATE</strong>
        </div>
        @for (item of items; track item.path) {
          <a
            [routerLink]="item.path"
            routerLinkActive="active-link"
            [routerLinkActiveOptions]="{ exact: !!item.exact }"
            [class.desk-only]="!item.mobile"
          >
            <app-icon [name]="item.icon" [size]="22" />
            {{ item.label }}
          </a>
        }
        <a routerLink="/admin/mas" routerLinkActive="active-link" class="mobile-only">
          <app-icon name="more" [size]="22" />
          Más
        </a>
      </nav>
      <div class="app-content">
        <router-outlet />
      </div>
    </div>
  `,
})
export class AdminShellComponent implements OnInit {
  private readonly auth = inject(AuthService);
  readonly items = ADMIN_NAV;

  ngOnInit(): void {
    this.auth.refreshProfile().subscribe({ error: () => undefined });
  }
}
