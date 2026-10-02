import { Component, HostListener, inject } from '@angular/core';
import { PauseAlertService } from '../core/services/pause-alert.service';
import { toMeridiem, localTime } from '../core/utils';
import { IconComponent } from './icon.component';

/** Modal que aparece cuando llega la hora de una pausa (push del servidor o recordatorio local). */
@Component({
  selector: 'app-pause-alert',
  imports: [IconComponent],
  template: `
    @if (alerts.current(); as alert) {
      <div class="fixed inset-0 z-[90] flex items-end sm:items-center justify-center p-4 bg-slate-900/55 backdrop-blur-sm"
        (click)="alerts.dismiss()">
        <div class="pause-alert w-full max-w-md rounded-3xl bg-white shadow-2xl overflow-hidden"
          role="alertdialog" aria-modal="true" aria-labelledby="pause-alert-title" aria-describedby="pause-alert-body"
          (click)="$event.stopPropagation()">
          <div class="relative bg-gradient-to-br from-brand-950 via-brand-900 to-brand-800 px-7 pt-7 pb-6 text-white overflow-hidden">
            <div class="absolute -right-10 -top-10 w-40 h-40 rounded-full border border-white/10"></div>
            <div class="absolute right-6 -bottom-12 w-32 h-32 rounded-full bg-blue-500/20 blur-2xl"></div>
            <div class="relative flex items-center gap-4">
              <span class="relative grid place-items-center w-14 h-14 rounded-2xl bg-white/15 border border-white/20 shrink-0">
                <span class="absolute inset-0 rounded-2xl bg-white/20 animate-ping"></span>
                <app-icon name="bell" [size]="26" />
              </span>
              <div class="min-w-0">
                <p class="text-[11px] font-bold uppercase tracking-[0.18em] text-blue-200">
                  Pausa activa · {{ time(alert.scheduledAt) }}
                </p>
                <h2 id="pause-alert-title" class="mt-1 text-xl font-extrabold leading-tight">{{ alert.title }}</h2>
              </div>
            </div>
          </div>

          <div class="px-7 pt-5 pb-7">
            <p id="pause-alert-body" class="text-sm text-slate-600 leading-relaxed">{{ alert.body }}</p>
            @if (alert.routineName) {
              <div class="mt-4 flex items-center gap-3 rounded-2xl bg-brand-50/70 border border-brand-100 px-4 py-3">
                <app-icon name="activity" [size]="18" class="text-brand-700 shrink-0" />
                <p class="text-sm font-semibold text-slate-900 truncate">{{ alert.routineName }}</p>
              </div>
            }

            <button type="button" (click)="alerts.start()"
              class="mt-6 w-full inline-flex items-center justify-center gap-2 px-5 py-3.5 min-h-12 rounded-xl bg-brand-800 hover:bg-brand-900 text-white text-sm font-bold shadow-lg shadow-brand-900/25 transition-colors">
              <app-icon name="play" [size]="16" />
              Iniciar pausa
            </button>
            <div class="mt-3 grid grid-cols-2 gap-3">
              <button type="button" (click)="alerts.snooze()"
                class="px-4 py-3 rounded-xl bg-white text-slate-700 ring-1 ring-slate-200 text-sm font-bold hover:bg-slate-50 transition-colors">
                En {{ alerts.snoozeMinutes }} min
              </button>
              <button type="button" (click)="alerts.dismiss()"
                class="px-4 py-3 rounded-xl bg-white text-slate-500 ring-1 ring-slate-200 text-sm font-bold hover:bg-slate-50 transition-colors">
                Ahora no
              </button>
            </div>
          </div>
        </div>
      </div>
    }
  `,
  styles: `
    .pause-alert {
      animation: pause-alert-in 220ms cubic-bezier(0.2, 0.8, 0.2, 1);
    }
    @keyframes pause-alert-in {
      from { opacity: 0; transform: translateY(16px) scale(0.98); }
      to { opacity: 1; transform: none; }
    }
  `,
})
export class PauseAlertComponent {
  protected readonly alerts = inject(PauseAlertService);

  @HostListener('document:keydown.escape')
  onEscape(): void {
    this.alerts.dismiss();
  }

  time(iso: string): string {
    return toMeridiem(localTime(iso));
  }
}
