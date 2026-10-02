import { Injectable, effect, inject } from '@angular/core';
import { minutesFromTime } from '../utils';
import { AuthService } from './auth.service';
import { PausasService } from './pausas.service';

const VISUAL_REST_MINUTES = 20;

/** Recordatorios reales vía notificaciones del navegador, respetando las preferencias del trabajador. */
@Injectable({ providedIn: 'root' })
export class ReminderService {
  private readonly auth = inject(AuthService);
  private readonly pausas = inject(PausasService);

  private pauseTimer: ReturnType<typeof setInterval> | null = null;
  private visualTimer: ReturnType<typeof setInterval> | null = null;
  private readonly notified = new Set<string>();
  private lastVisualRest = Date.now();

  constructor() {
    // Si el trabajador desactiva No Molestar vuelve a reiniciar el ciclo de descanso visual.
    effect(() => {
      if (!this.auth.preferences().dnd) this.lastVisualRest = Date.now();
    });
  }

  /** Arranca la vigilancia de recordatorios (idempotente). */
  start(): void {
    if (this.pauseTimer || typeof window === 'undefined') return;
    this.pauseTimer = setInterval(() => this.checkNextPause(), 30_000);
    this.visualTimer = setInterval(() => this.checkVisualRest(), 60_000);
  }

  stop(): void {
    if (this.pauseTimer) clearInterval(this.pauseTimer);
    if (this.visualTimer) clearInterval(this.visualTimer);
    this.pauseTimer = null;
    this.visualTimer = null;
  }

  /** Solicita permiso de notificaciones al navegador (debe invocarse desde una interacción). */
  async requestPermission(): Promise<boolean> {
    if (!this.supported()) return false;
    if (Notification.permission === 'granted') return true;
    const result = await Notification.requestPermission();
    return result === 'granted';
  }

  supported(): boolean {
    return typeof window !== 'undefined' && 'Notification' in window;
  }

  private canNotify(): boolean {
    const prefs = this.auth.preferences();
    return this.supported() && Notification.permission === 'granted' && prefs.notifications && !prefs.dnd;
  }

  private checkNextPause(): void {
    const prefs = this.auth.preferences();
    if (!this.canNotify() || !prefs.reminders) return;
    const next = this.pausas.nextPause();
    if (!next || next.status === 'completed') return;

    const now = new Date();
    const nowMinutes = now.getHours() * 60 + now.getMinutes();
    const slotMinutes = minutesFromTime(next.time);
    if (nowMinutes < slotMinutes || nowMinutes > slotMinutes + 2) return;

    const key = `${now.toDateString()}:${next.id}`;
    if (this.notified.has(key)) return;
    this.notified.add(key);
    this.notify('Es hora de tu pausa activa', 'Tómate unos minutos para moverte y respirar.');
  }

  private checkVisualRest(): void {
    const prefs = this.auth.preferences();
    if (!this.canNotify() || !prefs.visualRest) return;
    const elapsedMinutes = (Date.now() - this.lastVisualRest) / 60_000;
    if (elapsedMinutes < VISUAL_REST_MINUTES) return;
    this.lastVisualRest = Date.now();
    this.notify('Descanso visual', 'Mira un punto lejano durante 20 segundos (regla 20-20-20).');
  }

  private notify(title: string, body: string): void {
    try {
      new Notification(title, { body, icon: 'logo-ue.png' });
    } catch {
      /* el navegador puede bloquear la creación directa; se ignora */
    }
  }
}
