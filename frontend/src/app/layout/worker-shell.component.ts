import { Component, OnDestroy, OnInit, computed, inject, signal } from '@angular/core';
import { ActivatedRoute, Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { Subscription } from 'rxjs';
import { AuthService } from '../core/services/auth.service';
import { DialogService } from '../core/services/dialog.service';
import { PausasService } from '../core/services/pausas.service';
import { PausePushData, PauseAlertService } from '../core/services/pause-alert.service';
import { PushMessage, PushService } from '../core/services/push.service';
import { ReminderService } from '../core/services/reminder.service';
import { RutinasService } from '../core/services/rutinas.service';
import { AvatarComponent, avatarKind } from '../shared/avatar.component';
import { IconComponent } from '../shared/icon.component';
import { PauseAlertComponent } from '../shared/pause-alert.component';

const PROMPT_DISMISSED_KEY = 'activate_push_prompt_dismissed';

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
  imports: [RouterOutlet, RouterLink, RouterLinkActive, IconComponent, AvatarComponent, PauseAlertComponent],
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

      <app-pause-alert />

      @if (showPrompt()) {
        <!-- ══ INVITACIÓN A ACTIVAR NOTIFICACIONES ══ -->
        <div class="fixed inset-0 z-[80] flex items-end sm:items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm"
          (click)="dismissPrompt()">
          <div class="w-full max-w-md rounded-3xl bg-white p-7 text-center shadow-2xl"
            role="dialog" aria-modal="true" aria-labelledby="push-prompt-title" (click)="$event.stopPropagation()">
            <span class="inline-grid place-items-center w-14 h-14 rounded-full bg-brand-50 text-brand-700">
              <app-icon name="bell" [size]="26" />
            </span>
            <h2 id="push-prompt-title" class="mt-3.5 text-lg font-extrabold tracking-tight text-slate-900">
              ¿Te avisamos cuando sea hora de tu pausa?
            </h2>
            <p class="mt-2 mx-auto max-w-sm text-sm text-slate-500 leading-relaxed">
              Activa las notificaciones y te recordaremos tus pausas activas aunque tengas ACTIVATE cerrado.
              Puedes cambiarlo cuando quieras desde tu perfil.
            </p>
            @if (promptError()) {
              <p class="mt-4 text-xs font-medium text-rose-600 bg-rose-50 border border-rose-200 rounded-xl px-3 py-2">{{ promptError() }}</p>
            }
            <div class="grid grid-cols-2 gap-3 mt-6">
              <button type="button" (click)="dismissPrompt()"
                class="px-4 py-3 min-h-12 rounded-xl bg-white text-slate-600 ring-1 ring-slate-200 text-sm font-bold hover:bg-slate-50 transition-colors">
                Ahora no
              </button>
              <button type="button" (click)="enablePush()" [disabled]="enabling()"
                class="px-4 py-3 min-h-12 rounded-xl bg-brand-800 hover:bg-brand-900 disabled:opacity-60 text-white text-sm font-bold transition-colors">
                {{ enabling() ? 'Activando…' : 'Activar' }}
              </button>
            </div>
          </div>
        </div>
      }
    </div>
  `,
})
export class WorkerShellComponent implements OnInit, OnDestroy {
  private readonly router = inject(Router);
  private readonly rutinas = inject(RutinasService);
  private readonly route = inject(ActivatedRoute);
  private readonly reminders = inject(ReminderService);
  private readonly push = inject(PushService);
  private readonly alerts = inject(PauseAlertService);
  private readonly dialog = inject(DialogService);
  private pushMessages: Subscription | null = null;
  readonly auth = inject(AuthService);
  readonly pausas = inject(PausasService);

  readonly showPrompt = signal(false);
  readonly enabling = signal(false);
  readonly promptError = signal('');

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
    this.setupPush();
  }

  ngOnDestroy(): void {
    this.reminders.stop();
    this.pushMessages?.unsubscribe();
    this.alerts.dismiss();
  }

  async enablePush(): Promise<void> {
    this.enabling.set(true);
    this.promptError.set('');
    const result = await this.push.enable();
    this.enabling.set(false);
    if (result === 'enabled') {
      this.auth.setPreference('notifications', true);
      this.showPrompt.set(false);
    } else if (result === 'denied') {
      this.promptError.set('El navegador bloqueó las notificaciones. Puedes permitirlas en la configuración del sitio.');
    } else {
      this.promptError.set('No pudimos activar las notificaciones en este navegador. Inténtalo más tarde.');
    }
  }

  dismissPrompt(): void {
    this.showPrompt.set(false);
    try {
      localStorage.setItem(PROMPT_DISMISSED_KEY, '1');
    } catch {
      /* sin almacenamiento local se vuelve a preguntar en la próxima sesión */
    }
  }

  private setupPush(): void {
    // Avisos que el service worker reenvía a la pestaña (push recibido o clic en la notificación).
    this.pushMessages = this.push.messages.subscribe((message) => this.handlePushMessage(message));
    void this.push.init();

    // La app se abrió desde una notificación con la pestaña cerrada: /app/pausas?aviso={...}
    const aviso = this.route.snapshot.queryParamMap.get('aviso')
      ?? this.route.firstChild?.snapshot.queryParamMap.get('aviso');
    if (aviso) {
      try {
        this.alerts.fromPush(JSON.parse(aviso) as PausePushData, undefined, undefined, true);
      } catch {
        /* parámetro mal formado: se ignora */
      }
      this.router.navigate([], { relativeTo: this.route.firstChild ?? this.route, queryParams: { aviso: null }, queryParamsHandling: 'merge', replaceUrl: true });
    }

    let dismissed = false;
    try {
      dismissed = localStorage.getItem(PROMPT_DISMISSED_KEY) === '1';
    } catch {
      dismissed = false;
    }
    this.showPrompt.set(this.push.permission() === 'default' && !dismissed && !aviso);
  }

  private handlePushMessage(message: PushMessage): void {
    const { payload } = message;
    if (payload.type === 'test') {
      this.dialog.alert({ title: payload.title ?? 'Notificación', message: payload.body ?? '' }).subscribe();
      return;
    }
    if (payload.type !== 'pausa-due') return;
    const opened = this.alerts.fromPush(payload.data ?? {}, payload.title, payload.body, message.action === 'start');
    if (message.action === 'start' && opened) this.alerts.start();
    // Llegó una pausa nueva: se refresca la línea de tiempo del día.
    this.pausas.load();
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
