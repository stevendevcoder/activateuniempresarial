import { Component, OnInit, computed, inject } from '@angular/core';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { AuthService } from '../core/services/auth.service';
import { AvatarComponent, avatarKind } from '../shared/avatar.component';
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

const ICON_MAP: Record<string, string> = {
  grid: 'grid_view',
  users: 'badge',
  bars: 'insights',
  building: 'apartment',
  activity: 'self_improvement',
  calendar: 'calendar_month',
  clock: 'timer',
  settings: 'settings',
  shield: 'shield',
  user: 'person',
  more: 'more_horiz',
};

@Component({
  selector: 'app-admin-shell',
  imports: [RouterOutlet, RouterLink, RouterLinkActive, IconComponent, AvatarComponent],
  template: `
    <div class="h-full bg-slate-50">
      <!-- Sidebar -->
      <aside class="fixed left-0 top-0 h-full w-72 bg-white border-r border-slate-200 flex flex-col z-50 shadow-[0_1px_8px_rgba(0,0,0,0.04)]">
        <div class="px-6 py-6 border-b border-slate-100 flex items-center gap-3">
          <img src="https://fabricasoluciones.uniempresarial.edu.co/assets/logo%20ue-Bilhu64G.png" class="w-10 h-10 object-contain rounded-xl shadow-sm border border-slate-200" alt="Logo Uniempresarial" />
          <div class="flex flex-col">
            <span class="text-xl font-extrabold tracking-wider text-brand-900">ACTIVATE</span>
            <span class="text-[10px] font-semibold tracking-widest text-slate-400 uppercase -mt-1">Pausas Saludables</span>
          </div>
        </div>
        <nav class="flex-1 px-4 py-5 space-y-1 overflow-y-auto" aria-label="Navegación principal">
          @for (item of items; track item.path) {
            <a
              [routerLink]="item.path"
              routerLinkActive="bg-brand-50 text-brand-700 font-semibold shadow-sm border border-brand-100"
              [routerLinkActiveOptions]="{ exact: !!item.exact }"
              class="flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium text-slate-600 hover:bg-slate-50 hover:text-slate-900 transition-colors"
            >
              <app-icon [name]="item.icon" [size]="20"></app-icon>
              {{ item.label }}
            </a>
          }
        </nav>
        <div class="p-4 border-t border-slate-100">
          <div class="flex items-center justify-between p-2 rounded-xl bg-slate-50 border border-slate-200/70 shadow-sm">
            <div class="flex items-center gap-3 min-w-0">
              <app-avatar [kind]="avatarKind()" [photo]="auth.user()?.photo" [size]="36" />
              <div class="truncate text-left">
                <p class="text-xs font-bold text-slate-900 truncate">{{ auth.user()?.name }}</p>
                <p class="text-[11px] text-slate-500 truncate">{{ auth.user()?.email }}</p>
              </div>
            </div>
            <button type="button" (click)="logout()"
              class="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors shrink-0"
              title="Cerrar sesión" aria-label="Cerrar sesión">
              <app-icon name="logout" [size]="16" />
            </button>
          </div>
        </div>
      </aside>

      <!-- Main content -->
      <div class="pl-72 flex flex-col min-h-screen">
        <router-outlet></router-outlet>
      </div>
    </div>
  `,
  styles: `
    .material-symbols-outlined {
      font-family: 'Material Symbols Outlined';
      font-weight: normal;
      font-style: normal;
      font-size: 24px;
      line-height: 1;
      letter-spacing: normal;
      text-transform: none;
      display: inline-block;
      white-space: nowrap;
      word-wrap: normal;
      direction: ltr;
      -webkit-font-smoothing: antialiased;
    }
  `,
})
export class AdminShellComponent implements OnInit {
  readonly auth = inject(AuthService);
  readonly items = ADMIN_NAV;
  readonly avatarKind = computed(() => avatarKind(this.auth.user()?.id, true));

  getIcon(name: string): string {
    return ICON_MAP[name] || name;
  }

  logout(): void {
    this.auth.logout();
  }

  ngOnInit(): void {
    this.auth.refreshProfile().subscribe({ error: () => undefined });
  }
}
