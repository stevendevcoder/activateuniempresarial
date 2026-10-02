import { Injectable, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { localTime } from '../utils';
import { AuthService } from './auth.service';

export interface PauseAlert {
  title: string;
  body: string;
  routineId: number | null;
  routineName: string | null;
  /** Hora programada (ISO). Identifica el aviso para no repetirlo. */
  scheduledAt: string;
}

/** Datos que llegan en el push del backend (PushPayload.data de pausa-due). */
export interface PausePushData {
  idRoutine?: number | null;
  routineName?: string | null;
  scheduledAt?: string;
}

const SNOOZE_MINUTES = 5;

/**
 * Modal "Es hora de tu pausa". Lo abren el push del servidor y el recordatorio local;
 * cada franja se muestra una sola vez aunque lleguen ambos avisos.
 */
@Injectable({ providedIn: 'root' })
export class PauseAlertService {
  private readonly router = inject(Router);
  private readonly auth = inject(AuthService);

  readonly current = signal<PauseAlert | null>(null);
  private readonly shown = new Set<string>();
  private snoozeTimer: ReturnType<typeof setTimeout> | null = null;

  /** Abre el modal salvo que el trabajador esté en No Molestar, en plena pausa o ya lo haya visto. */
  show(alert: PauseAlert, force = false): boolean {
    const key = this.keyFor(alert.scheduledAt);
    if (!force && this.shown.has(key)) return false;
    if (!force && (this.auth.preferences().dnd || this.router.url.includes('/pausas/ejecutar'))) return false;
    this.shown.add(key);
    this.current.set(alert);
    return true;
  }

  fromPush(data: PausePushData, title?: string, body?: string, force = false): boolean {
    const scheduledAt = data.scheduledAt ?? new Date().toISOString();
    return this.show(
      {
        title: title || '¡Es hora de tu pausa activa!',
        body: body || 'Tómate unos minutos para moverte y respirar.',
        routineId: data.idRoutine ?? null,
        routineName: data.routineName ?? null,
        scheduledAt,
      },
      force,
    );
  }

  /** Va directo al reproductor de la rutina programada. */
  start(): void {
    const alert = this.current();
    if (!alert) return;
    this.dismiss();
    this.router.navigate(['/app/pausas/ejecutar', alert.routineId ?? 'libre'], {
      queryParams: { slot: alert.scheduledAt },
    });
  }

  /** Vuelve a mostrar el mismo aviso en unos minutos. */
  snooze(): void {
    const alert = this.current();
    this.dismiss();
    if (!alert) return;
    this.snoozeTimer = setTimeout(() => this.show(alert, true), SNOOZE_MINUTES * 60_000);
  }

  dismiss(): void {
    if (this.snoozeTimer) clearTimeout(this.snoozeTimer);
    this.snoozeTimer = null;
    this.current.set(null);
  }

  readonly snoozeMinutes = SNOOZE_MINUTES;

  private keyFor(scheduledAt: string): string {
    const date = new Date(scheduledAt);
    return Number.isNaN(date.getTime()) ? scheduledAt : `${date.toDateString()}:${localTime(scheduledAt)}`;
  }
}
