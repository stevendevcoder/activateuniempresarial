import { HttpClient } from '@angular/common/http';
import { Injectable, NgZone, inject, signal } from '@angular/core';
import { Subject, firstValueFrom } from 'rxjs';
import { environment } from '../../../environments/environment';

const SW_URL = '/sw-push.js';
const MESSAGE_SOURCE = 'activate-push';

export type PushEnableResult = 'enabled' | 'denied' | 'unsupported' | 'server-disabled' | 'error';

/** Mensaje que el service worker envía a la pestaña (ver public/sw-push.js). */
export interface PushMessage {
  action: 'show' | 'start';
  payload: {
    type?: 'pausa-due' | 'test';
    title?: string;
    body?: string;
    url?: string;
    data?: { idRoutine?: number | null; routineName?: string | null; scheduledAt?: string };
  };
}

function urlBase64ToUint8Array(base64: string): Uint8Array {
  const padding = '='.repeat((4 - (base64.length % 4)) % 4);
  const raw = atob((base64 + padding).replace(/-/g, '+').replace(/_/g, '/'));
  return Uint8Array.from(raw, (c) => c.charCodeAt(0));
}

/** Suscripción Web Push del navegador: llega aunque la pestaña de ACTIVATE esté cerrada. */
@Injectable({ providedIn: 'root' })
export class PushService {
  private readonly http = inject(HttpClient);
  private readonly zone = inject(NgZone);
  private readonly api = `${environment.apiUrl}/api/push`;

  readonly subscribed = signal(false);
  readonly messages = new Subject<PushMessage>();

  private registration: Promise<ServiceWorkerRegistration> | null = null;
  private listening = false;

  supported(): boolean {
    return (
      typeof window !== 'undefined' &&
      'serviceWorker' in navigator &&
      'PushManager' in window &&
      'Notification' in window
    );
  }

  permission(): NotificationPermission | 'unsupported' {
    return this.supported() ? Notification.permission : 'unsupported';
  }

  /**
   * Registra el service worker, escucha sus mensajes y, si el permiso ya estaba concedido,
   * vuelve a enviar la suscripción al backend (por si en este navegador entró otro usuario).
   */
  async init(): Promise<void> {
    if (!this.supported()) return;
    this.listen();
    try {
      const registration = await this.register();
      const subscription = await registration.pushManager.getSubscription();
      this.subscribed.set(!!subscription);
      if (subscription && Notification.permission === 'granted') {
        await firstValueFrom(this.http.post(`${this.api}/subscriptions`, subscription.toJSON()));
      }
    } catch {
      /* sin push la app sigue funcionando con los recordatorios locales */
    }
  }

  /** Pide permiso (debe llamarse desde un clic) y suscribe este navegador. */
  async enable(): Promise<PushEnableResult> {
    if (!this.supported()) return 'unsupported';
    const permission = await Notification.requestPermission();
    if (permission !== 'granted') return 'denied';

    try {
      const { publicKey } = await firstValueFrom(this.http.get<{ publicKey: string }>(`${this.api}/public-key`));
      const registration = await this.register();
      const subscription =
        (await registration.pushManager.getSubscription()) ??
        (await registration.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: urlBase64ToUint8Array(publicKey) as BufferSource,
        }));
      await firstValueFrom(this.http.post(`${this.api}/subscriptions`, subscription.toJSON()));
      this.subscribed.set(true);
      return 'enabled';
    } catch (err) {
      return (err as { status?: number })?.status === 503 ? 'server-disabled' : 'error';
    }
  }

  /** Quita la suscripción de este navegador en el backend y en el navegador. */
  async disable(): Promise<void> {
    const subscription = await this.currentSubscription();
    if (subscription) {
      await firstValueFrom(this.http.delete(`${this.api}/subscriptions`, { body: { endpoint: subscription.endpoint } })).catch(
        () => undefined,
      );
      await subscription.unsubscribe().catch(() => undefined);
    }
    this.subscribed.set(false);
  }

  /**
   * Al cerrar sesión ya no hay token para avisar al backend: se anula la suscripción en el
   * navegador y el backend la borra en el próximo envío (responde 410 Gone).
   */
  async forgetDevice(): Promise<void> {
    const subscription = await this.currentSubscription();
    await subscription?.unsubscribe().catch(() => undefined);
    this.subscribed.set(false);
  }

  sendTest(): Promise<{ message: string }> {
    return firstValueFrom(this.http.post<{ message: string }>(`${this.api}/test`, {}));
  }

  private async currentSubscription(): Promise<PushSubscription | null> {
    if (!this.supported()) return null;
    const registration = await navigator.serviceWorker.getRegistration(SW_URL);
    return (await registration?.pushManager.getSubscription()) ?? null;
  }

  private register(): Promise<ServiceWorkerRegistration> {
    this.registration ??= navigator.serviceWorker.register(SW_URL, { scope: '/' });
    return this.registration;
  }

  private listen(): void {
    if (this.listening) return;
    this.listening = true;
    navigator.serviceWorker.addEventListener('message', (event: MessageEvent) => {
      const data = event.data as (PushMessage & { source?: string }) | null;
      if (data?.source !== MESSAGE_SOURCE) return;
      // El evento llega fuera de la zona de Angular: se reingresa para que el modal se pinte.
      this.zone.run(() => this.messages.next({ action: data.action, payload: data.payload ?? {} }));
    });
  }
}
