import { Component, OnDestroy, OnInit, inject, signal } from '@angular/core';
import { DatePipe } from '@angular/common';
import { LucideAngularModule, Play, Check, Clock, XCircle, Flame, Trophy, LogOut, Timer, Maximize2, Shield, ShieldAlert } from 'lucide-angular';
import { AuthService } from '../auth/auth.service';
import { ConsentStatus, PortalConfig, PortalPause, PortalStats, PortalStreak, PortalService } from './portal.service';
import { DialogService } from '../shared/dialog/dialog.service';

@Component({
  selector: 'app-portal',
  imports: [DatePipe, LucideAngularModule],
  template: `
    <div class="min-h-dvh bg-brand-surface">
      <header class="bg-white border-b border-brand-soft-blue">
        <div class="max-w-5xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between">
          <div class="flex items-center gap-3">
            <div class="w-10 h-10 rounded-xl bg-brand-blue flex items-center justify-center text-white font-extrabold text-sm">FC</div>
            <div>
              <p class="text-sm font-bold text-slate-800 leading-tight">UActive</p>
              <p class="text-xs text-slate-400">Portal del trabajador</p>
            </div>
          </div>
          <div class="flex items-center gap-3">
            <div class="text-right hidden sm:block">
              <p class="text-sm font-bold text-slate-800 leading-tight">{{ userName }}</p>
              <p class="text-xs text-slate-400">Trabajador</p>
            </div>
            <button (click)="logout()" class="p-2 rounded-lg text-slate-400 hover:text-brand-red hover:bg-brand-soft-red transition-colors">
              <lucide-angular [img]="ic.LogOut" class="w-5 h-5"></lucide-angular>
            </button>
          </div>
        </div>
      </header>

      <main class="max-w-5xl mx-auto px-4 sm:px-6 py-6 space-y-6">
        @if (message()) {
          <div class="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-700 font-medium">{{ message() }}</div>
        }
        @if (error()) {
          <div class="p-3.5 rounded-xl bg-brand-soft-red border border-brand-red/20 text-xs text-brand-red font-medium">{{ error() }}</div>
        }

        @if (consent() && !consent()!.accepted) {
          <div class="rounded-2xl border border-amber-300 bg-amber-50 p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div class="flex items-start gap-3">
              <lucide-angular [img]="ic.ShieldAlert" class="w-5 h-5 text-amber-600 shrink-0 mt-0.5"></lucide-angular>
              <div>
                <p class="text-sm font-bold text-amber-800">Consentimiento informado pendiente</p>
                <p class="text-xs text-amber-700 mt-0.5">
                  Autoriza el tratamiento de tus datos de cumplimiento conforme a la Ley 1581 de 2012 (Habeas Data).
                </p>
              </div>
            </div>
            <button (click)="acceptConsent()"
                    class="shrink-0 px-4 py-2.5 rounded-xl bg-amber-600 text-white text-sm font-bold hover:bg-amber-700 transition-colors">
              Aceptar
            </button>
          </div>
        }

        <div class="grid grid-cols-2 xl:grid-cols-4 gap-4">
          <div class="rounded-2xl border border-brand-soft-blue bg-white p-5 shadow-sm">
            <p class="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Completadas</p>
            <p class="text-3xl font-extrabold text-brand-blue mt-1">{{ stats()?.completadas ?? 0 }}</p>
          </div>
          <div class="rounded-2xl border border-brand-soft-blue bg-white p-5 shadow-sm">
            <p class="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Aplazadas</p>
            <p class="text-3xl font-extrabold text-brand-blue mt-1">{{ stats()?.aplazadas ?? 0 }}</p>
          </div>
          <div class="rounded-2xl border border-brand-soft-blue bg-white p-5 shadow-sm">
            <div class="flex items-center gap-2">
              <lucide-angular [img]="ic.Flame" class="w-4 h-4 text-brand-red"></lucide-angular>
              <p class="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Racha actual</p>
            </div>
            <p class="text-3xl font-extrabold text-brand-blue mt-1">{{ streak()?.current ?? 0 }}</p>
          </div>
          <div class="rounded-2xl border border-brand-soft-blue bg-white p-5 shadow-sm">
            <div class="flex items-center gap-2">
              <lucide-angular [img]="ic.Trophy" class="w-4 h-4 text-amber-500"></lucide-angular>
              <p class="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Mejor racha</p>
            </div>
            <p class="text-3xl font-extrabold text-brand-blue mt-1">{{ streak()?.best ?? 0 }}</p>
          </div>
        </div>

        <div class="rounded-2xl border border-brand-soft-blue bg-white p-6 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-4">
          <div>
            <h2 class="text-lg font-extrabold text-brand-blue">¿Listo para tu pausa activa?</h2>
            <p class="text-sm text-slate-500 mt-1">
              Límite de aplazamientos: {{ config()?.maxPostponements ?? 2 }} · Almuerzo {{ config()?.lunchStart }}–{{ config()?.lunchEnd }}
            </p>
          </div>
          <button (click)="beginPause()" [disabled]="starting()"
                  class="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-brand-blue text-white font-bold text-sm hover:bg-brand-blue-dark transition-colors shadow-lg shadow-brand-blue/20 disabled:opacity-60">
            <lucide-angular [img]="ic.Play" class="w-5 h-5"></lucide-angular>
            {{ starting() ? 'Preparando…' : 'Iniciar pausa' }}
          </button>
        </div>

        <div class="rounded-2xl border border-brand-soft-blue bg-white shadow-sm overflow-hidden">
          <div class="px-5 py-4 border-b border-brand-soft-blue">
            <h3 class="text-sm font-bold text-slate-800">Mis pausas recientes</h3>
          </div>
          <div class="overflow-x-auto">
            <table class="w-full text-sm">
              <thead>
                <tr class="border-b border-brand-soft-blue bg-brand-surface/50">
                  <th class="text-left px-5 py-3 font-semibold text-slate-500">Programada</th>
                  <th class="text-left px-5 py-3 font-semibold text-slate-500">Rutina</th>
                  <th class="text-left px-5 py-3 font-semibold text-slate-500">Área</th>
                  <th class="text-center px-5 py-3 font-semibold text-slate-500">Estado</th>
                  <th class="text-right px-5 py-3 font-semibold text-slate-500">Acción</th>
                </tr>
              </thead>
              <tbody>
                @for (pause of pauses(); track pause.id) {
                  <tr class="border-b border-brand-soft-blue/60 hover:bg-brand-surface/50 transition-colors">
                    <td class="px-5 py-3 text-slate-600 whitespace-nowrap">{{ pause.scheduledAt | date:'short' }}</td>
                    <td class="px-5 py-3 font-semibold text-slate-800">{{ pause.routineName ?? 'Libre' }}</td>
                    <td class="px-5 py-3 text-slate-600">{{ pause.areaName ?? '—' }}</td>
                    <td class="px-5 py-3 text-center">
                      <span class="inline-flex px-2 py-0.5 rounded-full text-xs font-bold" [class]="statusClass(pause.status)">
                        {{ statusLabel(pause.status) }}
                      </span>
                    </td>
                    <td class="px-5 py-3 text-right">
                      @if (pause.status === 1) {
                        <button (click)="beginPause(pause)"
                                class="text-xs font-bold text-brand-blue hover:underline">Ejecutar</button>
                      } @else {
                        <span class="text-xs text-slate-300">—</span>
                      }
                    </td>
                  </tr>
                } @empty {
                  <tr>
                    <td colspan="5" class="px-5 py-10 text-center text-sm text-slate-400">No tienes pausas registradas</td>
                  </tr>
                }
              </tbody>
            </table>
          </div>
        </div>

        <div class="rounded-2xl border border-brand-soft-blue bg-white p-5 shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div class="flex items-start gap-3">
            <lucide-angular [img]="ic.Shield" class="w-5 h-5 text-brand-blue shrink-0 mt-0.5"></lucide-angular>
            <div>
              <p class="text-sm font-bold text-slate-800">Privacidad y datos personales</p>
              <p class="text-xs text-slate-500 mt-0.5">
                Consentimiento:
                <span class="font-bold" [class]="consent()?.accepted ? 'text-emerald-600' : 'text-amber-600'">
                  {{ consent()?.accepted ? 'Aceptado (v' + consent()?.version + ')' : 'No aceptado' }}
                </span>
              </p>
            </div>
          </div>
          <div class="flex gap-2">
            @if (consent()?.accepted) {
              <button (click)="revokeConsent()"
                      class="px-4 py-2.5 rounded-xl border border-slate-200 text-slate-600 text-sm font-bold hover:bg-slate-50 transition-colors">
                Revocar consentimiento
              </button>
            }
            <button (click)="requestDeletion()"
                    class="px-4 py-2.5 rounded-xl border border-brand-red/30 bg-brand-soft-red text-brand-red text-sm font-bold hover:bg-red-100 transition-colors">
              Eliminar mis datos
            </button>
          </div>
        </div>
      </main>
    </div>

    @if (engineOpen()) {
      <div class="fixed inset-0 z-[9999] bg-slate-900/95 backdrop-blur-sm flex items-center justify-center p-4">
        <div class="w-full max-w-3xl bg-white rounded-3xl overflow-hidden shadow-2xl">
          <div class="bg-brand-blue text-white px-6 py-4 flex items-center justify-between">
            <div class="flex items-center gap-3">
              <lucide-angular [img]="ic.Timer" class="w-5 h-5"></lucide-angular>
              <div>
                <p class="text-sm font-bold">{{ activeRoutine()?.name ?? 'Pausa activa' }}</p>
                <p class="text-xs text-white/70">Sigue la rutina y completa al terminar</p>
              </div>
            </div>
            <button (click)="toggleFullscreen()" class="p-2 rounded-lg hover:bg-white/10" title="Pantalla completa">
              <lucide-angular [img]="ic.Maximize2" class="w-5 h-5"></lucide-angular>
            </button>
          </div>

          <div class="relative bg-black aspect-video flex items-center justify-center">
            @if (videoUrl()) {
              <video [src]="videoUrl()" class="w-full h-full object-contain" autoplay muted playsinline
                     (ended)="onVideoEnded()"></video>
            } @else {
              <div class="text-center text-white/60">
                <lucide-angular [img]="ic.Play" class="w-12 h-12 mx-auto mb-2"></lucide-angular>
                <p class="text-sm">{{ loadingVideo() ? 'Cargando video…' : 'Sin video asignado' }}</p>
              </div>
            }
            <div class="absolute top-4 right-4 px-4 py-2 rounded-2xl bg-black/60 text-white font-extrabold text-2xl tabular-nums">
              {{ formattedRemaining() }}
            </div>
          </div>

          <div class="p-6 space-y-4">
            <div class="h-2 rounded-full bg-slate-100 overflow-hidden">
              <div class="h-full bg-brand-blue transition-all" [style.width.%]="progress()"></div>
            </div>

            @if (engineError()) {
              <p class="text-xs text-brand-red font-medium">{{ engineError() }}</p>
            }

            <div class="flex flex-col sm:flex-row gap-2">
              <button (click)="complete()"
                      class="flex-1 inline-flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-emerald-600 text-white font-bold text-sm hover:bg-emerald-700 transition-colors">
                <lucide-angular [img]="ic.Check" class="w-4 h-4"></lucide-angular>
                Completar
              </button>
              <button (click)="postpone()" [disabled]="postponementsUsed() >= maxPostponements()"
                      class="flex-1 inline-flex items-center justify-center gap-2 px-4 py-3 rounded-xl border border-amber-300 bg-amber-50 text-amber-700 font-bold text-sm hover:bg-amber-100 transition-colors disabled:opacity-50">
                <lucide-angular [img]="ic.Clock" class="w-4 h-4"></lucide-angular>
                Aplazar ({{ postponementsUsed() }}/{{ maxPostponements() }})
              </button>
              <button (click)="cancel()"
                      class="flex-1 inline-flex items-center justify-center gap-2 px-4 py-3 rounded-xl border border-brand-red/30 bg-brand-soft-red text-brand-red font-bold text-sm hover:bg-red-100 transition-colors">
                <lucide-angular [img]="ic.XCircle" class="w-4 h-4"></lucide-angular>
                Cancelar
              </button>
            </div>
          </div>
        </div>
      </div>
    }
  `,
})
export class PortalComponent implements OnInit, OnDestroy {
  private readonly portal = inject(PortalService);
  private readonly auth = inject(AuthService);
  private readonly dialog = inject(DialogService);

  readonly ic = { Play, Check, Clock, XCircle, Flame, Trophy, LogOut, Timer, Maximize2, Shield, ShieldAlert };
  readonly stats = signal<PortalStats | null>(null);
  readonly streak = signal<PortalStreak | null>(null);
  readonly pauses = signal<PortalPause[]>([]);
  readonly config = signal<PortalConfig | null>(null);
  readonly consent = signal<ConsentStatus | null>(null);
  readonly message = signal('');
  readonly error = signal('');
  readonly starting = signal(false);

  readonly engineOpen = signal(false);
  readonly activeRoutine = signal<{ name: string } | null>(null);
  readonly loadingVideo = signal(false);
  readonly videoUrl = signal<string | null>(null);
  readonly remaining = signal(0);
  readonly totalSeconds = signal(0);
  readonly engineError = signal('');
  readonly postponementsUsed = signal(0);

  private activePauseId: number | null = null;
  private activeAreaId: number | null = null;
  private timerHandle: ReturnType<typeof setInterval> | null = null;

  get userName(): string {
    return this.auth.getUser()?.email?.split('@')[0] ?? 'Trabajador';
  }

  maxPostponements(): number {
    return this.config()?.maxPostponements ?? 2;
  }

  formattedRemaining(): string {
    const total = Math.max(0, this.remaining());
    const m = Math.floor(total / 60);
    const s = total % 60;
    return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  }

  progress(): number {
    const total = this.totalSeconds();
    if (total <= 0) return 0;
    return Math.min(100, ((total - this.remaining()) / total) * 100);
  }

  ngOnInit(): void {
    this.load();
  }

  ngOnDestroy(): void {
    this.clearTimer();
    this.releaseVideo();
  }

  load(): void {
    this.portal.getStats().subscribe({ next: (s) => this.stats.set(s), error: () => undefined });
    this.portal.getStreak().subscribe({ next: (s) => this.streak.set(s), error: () => undefined });
    this.portal.getConfig().subscribe({ next: (c) => this.config.set(c), error: () => undefined });
    this.portal.getConsent().subscribe({ next: (c) => this.consent.set(c), error: () => undefined });
    this.portal.getPauses().subscribe({
      next: (res) => this.pauses.set(res.items),
      error: () => this.error.set('No se pudieron cargar tus pausas.'),
    });
  }

  statusLabel(status: number): string {
    return status === 1 ? 'Programada' : status === 2 ? 'Completada' : status === 3 ? 'Aplazada' : 'Cancelada';
  }

  statusClass(status: number): string {
    return status === 1
      ? 'bg-brand-soft-blue text-brand-blue'
      : status === 2
        ? 'bg-emerald-50 text-emerald-600'
        : status === 3
          ? 'bg-amber-50 text-amber-600'
          : 'bg-brand-soft-red text-brand-red';
  }

  beginPause(pause?: PortalPause): void {
    if (this.consent() && !this.consent()!.accepted) {
      this.error.set('Debes aceptar el consentimiento informado antes de registrar tu pausa.');
      return;
    }
    this.message.set('');
    this.error.set('');
    this.starting.set(true);

    if (pause) {
      this.launchEngine(pause);
      return;
    }

    this.portal.registerPause({}).subscribe({
      next: (res) => this.launchEngine(res.pausa),
      error: () => {
        this.starting.set(false);
        this.error.set('No se pudo iniciar la pausa.');
      },
    });
  }

  private launchEngine(pause: PortalPause): void {
    this.activePauseId = pause.id;
    this.activeAreaId = pause.idArea;
    this.postponementsUsed.set(0);
    this.engineError.set('');
    this.loadingVideo.set(false);
    this.videoUrl.set(null);
    this.activeRoutine.set(null);

    this.portal.sendEvent({ type: 1, idPausa: pause.id, idArea: pause.idArea }).subscribe({
      next: () => undefined,
      error: () => undefined,
    });

    let total = 60;
    if (pause.idRoutine) {
      this.loadingVideo.set(true);
      this.portal.getRoutine(pause.idRoutine).subscribe({
        next: (routine) => {
          this.activeRoutine.set({ name: routine.name });
          total = routine.totalDurationSeconds > 0 ? routine.totalDurationSeconds : 60;
          const firstVideo = routine.videos[0];
          if (firstVideo) {
            this.loadVideo(firstVideo.idVideo);
          } else {
            this.loadingVideo.set(false);
          }
          this.startTimer(total);
          this.engineOpen.set(true);
          this.starting.set(false);
          this.requestFullscreen();
        },
        error: () => {
          this.loadingVideo.set(false);
          this.startTimer(total);
          this.engineOpen.set(true);
          this.starting.set(false);
          this.requestFullscreen();
        },
      });
    } else {
      this.startTimer(total);
      this.engineOpen.set(true);
      this.starting.set(false);
      this.requestFullscreen();
    }
  }

  private loadVideo(idVideo: number): void {
    this.portal.getVideoBlob(idVideo).subscribe({
      next: (blob) => {
        this.releaseVideo();
        this.videoUrl.set(URL.createObjectURL(blob));
        this.loadingVideo.set(false);
      },
      error: () => this.loadingVideo.set(false),
    });
  }

  private startTimer(seconds: number): void {
    this.clearTimer();
    this.totalSeconds.set(seconds);
    this.remaining.set(seconds);
    this.timerHandle = setInterval(() => {
      this.remaining.update((value) => (value > 0 ? value - 1 : 0));
    }, 1000);
  }

  onVideoEnded(): void {
    this.remaining.set(0);
  }

  complete(): void {
    this.sendAndClose(2);
  }

  postpone(): void {
    if (this.postponementsUsed() >= this.maxPostponements()) {
      this.engineError.set('Alcanzaste el límite de aplazamientos para esta pausa.');
      return;
    }
    this.portal
      .sendEvent({ type: 3, idPausa: this.activePauseId, idArea: this.activeAreaId })
      .subscribe({
        next: () => {
          this.postponementsUsed.update((v) => v + 1);
          this.closeEngine();
          this.message.set('Pausa aplazada.');
          this.load();
        },
        error: (err) => {
          this.engineError.set(err?.error?.error ?? 'No se pudo aplazar la pausa.');
        },
      });
  }

  cancel(): void {
    const reason = prompt('Motivo de la cancelación (obligatorio):');
    if (reason === null) return;
    if (reason.trim().length < 3) {
      this.engineError.set('El motivo debe tener al menos 3 caracteres.');
      return;
    }
    this.portal
      .sendEvent({ type: 4, idPausa: this.activePauseId, idArea: this.activeAreaId, reason: reason.trim() })
      .subscribe({
        next: () => {
          this.closeEngine();
          this.message.set('Pausa cancelada.');
          this.load();
        },
        error: (err) => this.engineError.set(err?.error?.error ?? 'No se pudo cancelar la pausa.'),
      });
  }

  private sendAndClose(type: number): void {
    this.portal
      .sendEvent({ type, idPausa: this.activePauseId, idArea: this.activeAreaId })
      .subscribe({
        next: () => {
          this.closeEngine();
          this.message.set(type === 2 ? '¡Pausa completada! Buen trabajo.' : 'Pausa registrada.');
          this.load();
        },
        error: () => this.engineError.set('No se pudo registrar el evento.'),
      });
  }

  private closeEngine(): void {
    this.engineOpen.set(false);
    this.clearTimer();
    this.releaseVideo();
    this.activeRoutine.set(null);
    this.activePauseId = null;
    this.activeAreaId = null;
    if (document.fullscreenElement) {
      document.exitFullscreen().catch(() => undefined);
    }
  }

  private clearTimer(): void {
    if (this.timerHandle) {
      clearInterval(this.timerHandle);
      this.timerHandle = null;
    }
  }

  private releaseVideo(): void {
    const url = this.videoUrl();
    if (url) URL.revokeObjectURL(url);
    this.videoUrl.set(null);
  }

  toggleFullscreen(): void {
    if (document.fullscreenElement) {
      document.exitFullscreen().catch(() => undefined);
    } else {
      this.requestFullscreen();
    }
  }

  private requestFullscreen(): void {
    document.documentElement.requestFullscreen?.().catch(() => undefined);
  }

  logout(): void {
    this.auth.logout();
  }

  acceptConsent(): void {
    this.error.set('');
    this.portal.acceptConsent().subscribe({
      next: () => {
        this.message.set('Consentimiento informado registrado. ¡Gracias!');
        this.portal.getConsent().subscribe({ next: (c) => this.consent.set(c), error: () => undefined });
      },
      error: () => this.error.set('No se pudo registrar el consentimiento.'),
    });
  }

  revokeConsent(): void {
    this.dialog.confirm({
      title: 'Revocar consentimiento',
      message: '¿Revocar tu consentimiento informado? No podrás registrar nuevas pausas.',
      danger: true,
      confirmLabel: 'Revocar',
    }).subscribe((ok) => {
      if (!ok) return;
      this.portal.revokeConsent().subscribe({
        next: () => {
          this.message.set('Consentimiento revocado.');
          this.portal.getConsent().subscribe({ next: (c) => this.consent.set(c), error: () => undefined });
        },
        error: () => this.error.set('No se pudo revocar el consentimiento.'),
      });
    });
  }

  requestDeletion(): void {
    this.dialog.confirm({
      title: 'Eliminar mis datos',
      message: '¿Eliminar tus datos personales? Esta acción anonimiza tu información y cierra tu sesión.',
      danger: true,
      confirmLabel: 'Eliminar',
    }).subscribe((ok) => {
      if (!ok) return;
      this.portal.requestDataDeletion().subscribe({
        next: () => {
          this.dialog.alert({
            title: 'Datos eliminados',
            message: 'Tus datos personales fueron eliminados. Se cerrará la sesión.',
          }).subscribe(() => this.auth.logout());
        },
        error: () => this.error.set('No se pudo procesar la eliminación de datos.'),
      });
    });
  }
}
