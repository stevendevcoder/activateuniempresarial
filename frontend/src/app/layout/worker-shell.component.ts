import { Component, OnDestroy, OnInit, computed, inject, signal } from '@angular/core';
import { Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { AuthService } from '../core/services/auth.service';
import { PausasService } from '../core/services/pausas.service';
import { ReminderService } from '../core/services/reminder.service';
import { RutinasService } from '../core/services/rutinas.service';
import { AvatarComponent, avatarKind } from '../shared/avatar.component';
import { IconComponent } from '../shared/icon.component';

export interface WorkerNavItem {
  path: string;
  label: string;
  icon: string;
  description: string;
  exact?: boolean;
  /** Visible en la barra inferior del móvil (el resto vive en el menú de escritorio). */
  mobile?: boolean;
  /** Contador de no leídas en la barra lateral de escritorio. */
  badge?: boolean;
}

export const WORKER_NAV: WorkerNavItem[] = [
  { path: '/app', label: 'Inicio', icon: 'home', description: 'Tu jornada de hoy', exact: true, mobile: true },
  { path: '/app/pausas', label: 'Mis pausas', icon: 'clock', description: 'Línea de tiempo del día', mobile: true },
  { path: '/app/pausas/historial', label: 'Historial', icon: 'calendar', description: 'Cumplimiento semanal' },
  { path: '/app/rutinas', label: 'Rutinas', icon: 'activity', description: 'Ejercicios guiados', mobile: true },
  { path: '/app/notificaciones', label: 'Notificaciones', icon: 'bell', description: 'Avisos y recordatorios', badge: true },
  { path: '/app/perfil', label: 'Perfil', icon: 'user', description: 'Preferencias y privacidad', mobile: true },
];

const UE_LOGO = 'https://fabricasoluciones.uniempresarial.edu.co/assets/logo%20ue-Bilhu64G.png';

@Component({
  selector: 'app-worker-shell',
  imports: [RouterOutlet, RouterLink, RouterLinkActive, IconComponent, AvatarComponent],
  template: `
    <div class="min-h-dvh bg-slate-50 flex flex-col">
      @if (!immersive()) {
        <!-- ══ ESCRITORIO: MENÚ LATERAL ══ -->
        <aside
          class="hidden lg:flex fixed left-0 top-0 h-dvh w-72 flex-col z-50 bg-white border-r border-slate-200 shadow-[0_1px_8px_rgba(0,0,0,0.04)]"
          aria-label="Menú lateral"
        >
          <a routerLink="/app"
            class="px-6 py-6 border-b border-slate-100 flex items-center gap-3 hover:bg-slate-50 transition-colors">
            <img
              [src]="logo"
              class="w-10 h-10 object-contain rounded-xl shadow-sm border border-slate-200"
              alt="Logo Uniempresarial" />
            <span class="flex flex-col leading-none min-w-0">
              <span class="text-xl font-extrabold tracking-wider text-brand-900">ACTIVATE</span>
              <span class="text-[10px] font-semibold tracking-widest text-slate-400 uppercase mt-1">Pausas Saludables</span>
            </span>
          </a>

          <nav class="flex-1 px-4 py-5 space-y-1 overflow-y-auto" aria-label="Navegación principal">
            @for (item of items; track item.path) {
              <a
                [routerLink]="item.path"
                routerLinkActive="bg-brand-50 text-brand-700 font-semibold shadow-sm border border-brand-100"
                [routerLinkActiveOptions]="{ exact: !!item.exact }"
                class="group flex items-start gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium text-slate-600 hover:bg-slate-50 hover:text-slate-900 transition-colors"
              >
                <app-icon [name]="item.icon" [size]="20" class="mt-0.5" />
                <span class="min-w-0 flex-1">
                  <span class="flex items-center gap-2">
                    <span class="truncate">{{ item.label }}</span>
                    @if (item.badge && unread() > 0) {
                      <span
                        class="ml-auto shrink-0 min-w-[20px] h-5 px-1.5 rounded-full bg-rose-500 text-white text-[10px] font-bold flex items-center justify-center">
                        {{ unreadLabel() }}
                      </span>
                    }
                  </span>
                  <span class="block text-[11px] font-normal text-slate-400 truncate">{{ item.description }}</span>
                </span>
              </a>
            }
          </nav>

          <div class="p-4 border-t border-slate-100">
            <div
              class="flex items-center justify-between gap-2 p-2 rounded-xl bg-slate-50 border border-slate-200/70 shadow-sm">
              <a routerLink="/app/perfil" class="flex items-center gap-3 min-w-0 group">
                <app-avatar [kind]="avatarKind()" [photo]="auth.user()?.photo" [size]="36" />
                <span class="min-w-0 text-left">
                  <span class="block text-xs font-bold text-slate-900 truncate group-hover:text-brand-800">
                    {{ auth.user()?.name }}
                  </span>
                  <span class="block text-[11px] text-slate-500 truncate">{{ auth.user()?.area }}</span>
                </span>
              </a>
              <button type="button" (click)="auth.logout()"
                class="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors shrink-0"
                title="Cerrar sesión" aria-label="Cerrar sesión">
                <app-icon name="logout" [size]="16" />
              </button>
            </div>
          </div>
        </aside>
      }

      @if (!immersive()) {
        <!-- ══ MÓVIL: BARRA SUPERIOR ══ -->
        <header class="lg:hidden sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200">
          <div class="max-w-2xl mx-auto px-4 h-16 flex items-center justify-between gap-3">
            <a routerLink="/app" class="flex items-center gap-2.5 min-w-0">
              <img
                [src]="logo"
                class="w-9 h-9 rounded-xl object-contain bg-white border border-slate-200 shadow-sm shrink-0"
                alt="Uniempresarial" />
              <span class="flex flex-col leading-none min-w-0">
                <span class="text-base font-extrabold tracking-wider text-brand-900">ACTIVATE</span>
                <span class="text-[9px] font-semibold tracking-widest text-slate-400 uppercase mt-1">Pausas Saludables</span>
              </span>
            </a>

            <div class="flex items-center gap-1.5 shrink-0">
              <a
                routerLink="/app/notificaciones"
                class="relative p-2.5 rounded-xl text-slate-500 hover:bg-slate-100 hover:text-brand-700 transition-colors"
                aria-label="Notificaciones"
              >
                <app-icon name="bell" [size]="20"></app-icon>
                @if (unread() > 0) {
                  <span
                    class="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] px-1 rounded-full bg-rose-500 text-white text-[10px] font-bold flex items-center justify-center ring-2 ring-white">
                    {{ unreadLabel() }}
                  </span>
                }
              </a>
              <a routerLink="/app/perfil" class="rounded-full block" aria-label="Mi perfil">
                <app-avatar [kind]="avatarKind()" [photo]="auth.user()?.photo" [size]="36" />
              </a>
            </div>
          </div>
        </header>
      }

      <!-- ══ CONTENIDO ══ -->
      <main
        class="flex-1 w-full pb-[calc(4.75rem+env(safe-area-inset-bottom))] lg:pb-8"
        [class]="immersive() ? '' : 'lg:pl-72'">
        <router-outlet />
      </main>

      @if (!immersive()) {
        <!-- ══ MÓVIL: BARRA INFERIOR ══ -->
        <nav
          class="lg:hidden fixed bottom-0 inset-x-0 z-40 bg-white/97 backdrop-blur-md border-t border-slate-200 shadow-[0_-2px_12px_rgba(15,23,42,0.04)] pb-[env(safe-area-inset-bottom)]"
          aria-label="Navegación principal"
        >
          <div class="max-w-2xl mx-auto grid grid-cols-4">
            @for (item of mobileItems; track item.path) {
              <a
                [routerLink]="item.path"
                routerLinkActive=""
                [routerLinkActiveOptions]="{ exact: !!item.exact }"
                (isActiveChange)="onActive(item.path, $event)"
                [class]="activePath() === item.path
                  ? 'flex flex-col items-center gap-1 py-2 text-[11px] font-semibold text-brand-700'
                  : 'flex flex-col items-center gap-1 py-2 text-[11px] font-semibold text-slate-400 hover:text-slate-600'"
              >
                <span
                  class="grid place-items-center w-10 h-8 rounded-xl transition-colors"
                  [class]="activePath() === item.path ? 'bg-brand-50 text-brand-700 shadow-sm' : ''"
                >
                  <app-icon [name]="item.icon" [size]="20"></app-icon>
                </span>
                {{ item.label }}
              </a>
            }
          </div>
        </nav>
      }
    </div>
  `,
})
export class WorkerShellComponent implements OnInit, OnDestroy {
  private readonly router = inject(Router);
  private readonly rutinas = inject(RutinasService);
  private readonly reminders = inject(ReminderService);
  readonly auth = inject(AuthService);
  readonly pausas = inject(PausasService);

  readonly logo = UE_LOGO;
  readonly items = WORKER_NAV;
  /** Las cuatro pestañas de la barra inferior del móvil. */
  readonly mobileItems = WORKER_NAV.filter((item) => item.mobile);
  readonly avatarKind = computed(() => avatarKind(this.auth.user()?.id));
  readonly unread = computed(() => this.pausas.unreadCount());
  /** Pestaña activa de la barra inferior (RouterLinkActive solo informa los cambios a `true`). */
  readonly activePath = signal<string | null>(null);

  ngOnInit(): void {
    this.rutinas.load();
    // El área puede haber cambiado desde el último login: se refresca antes de armar la jornada.
    this.auth.refreshProfile().subscribe({
      next: () => this.pausas.load(),
      error: () => this.pausas.load(),
    });
    this.reminders.start();
  }

  ngOnDestroy(): void {
    this.reminders.stop();
  }

  /** Durante la pausa activa no hay chrome: la pantalla es inmersiva a pantalla completa. */
  immersive(): boolean {
    return this.router.url.includes('/pausas/ejecutar');
  }

  unreadLabel(): string {
    const count = this.unread();
    return count > 9 ? '9+' : String(count);
  }

  onActive(path: string, active: boolean): void {
    if (active) this.activePath.set(path);
  }
}
