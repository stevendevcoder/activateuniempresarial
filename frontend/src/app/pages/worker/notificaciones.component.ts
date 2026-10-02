import { Component, computed, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { NotificationItem } from '../../core/models';
import { PausasService } from '../../core/services/pausas.service';
import { PortalService } from '../../core/services/portal.service';
import { apiError } from '../../core/utils';
import { IconComponent } from '../../shared/icon.component';

export type AvisoFiltro = 'todas' | 'no-leidas' | 'pausas' | 'institucional';

export interface AvisoAccion {
  label: string;
  primary: boolean;
  link?: unknown[];
  query?: Record<string, unknown>;
  /** El consentimiento se acepta en línea, sin navegar. */
  consent?: boolean;
}

export interface AvisoVisto {
  item: NotificationItem;
  /** Familia del aviso, derivada del propio generador de notificaciones. */
  family: 'consent' | 'next' | 'overdue' | 'streak' | 'done';
  icon: string;
  /** Clases del badge de icono. */
  badge: string;
  /** Color de la barra lateral de estado. */
  bar: string;
  chip: string;
  chipClass: string;
  actions: AvisoAccion[];
}

@Component({
  selector: 'app-notificaciones',
  imports: [RouterLink, IconComponent],
  templateUrl: './notificaciones.component.html',
})
export class NotificacionesComponent {
  readonly pausas = inject(PausasService);
  private readonly portal = inject(PortalService);

  readonly filtro = signal<AvisoFiltro>('todas');
  readonly query = signal('');
  readonly error = signal('');

  readonly total = computed(() => this.pausas.notifications().length);
  readonly noLeidas = computed(() => this.pausas.notifications().filter((n) => !n.read).length);
  readonly dePausas = computed(() => this.pausas.notifications().filter((n) => !n.isConsent).length);
  readonly institucionales = computed(() => this.pausas.notifications().filter((n) => n.isConsent).length);

  readonly avisos = computed<AvisoVisto[]>(() => {
    const q = this.query().trim().toLowerCase();
    const f = this.filtro();
    return this.pausas
      .notifications()
      .map((item) => this.toVisto(item))
      .filter((v) => (q ? `${v.item.title} ${v.item.body}`.toLowerCase().includes(q) : true))
      .filter((v) =>
        f === 'todas' ? true : f === 'no-leidas' ? !v.item.read : f === 'pausas' ? !v.item.isConsent : v.item.isConsent,
      );
  });

  /** La familia se deduce del prefijo del id que genera `PausasService.notifications`. */
  private familyOf(id: string): AvisoVisto['family'] {
    if (id.startsWith('consent')) return 'consent';
    if (id.startsWith('next-')) return 'next';
    if (id.startsWith('overdue-')) return 'overdue';
    if (id.startsWith('streak-')) return 'streak';
    return 'done';
  }

  private toVisto(item: NotificationItem): AvisoVisto {
    const family = this.familyOf(item.id);
    const next = this.pausas.nextPause();
    const base = { item, family, chip: item.time } as const;

    switch (family) {
      case 'consent':
        return {
          ...base,
          icon: 'shield',
          badge: 'bg-indigo-50 text-indigo-700 border border-indigo-200',
          bar: 'bg-indigo-600',
          chipClass: 'bg-indigo-50 text-indigo-700 border border-indigo-200',
          actions: [{ label: 'Aceptar consentimiento', primary: true, consent: true }],
        };
      case 'next':
        return {
          ...base,
          icon: 'clock',
          badge: 'bg-brand-50 text-brand-700 border border-brand-200',
          bar: 'bg-brand-600',
          chipClass: 'bg-brand-50 text-brand-700 border border-brand-200',
          actions: [
            {
              label: 'Iniciar pausa ahora',
              primary: true,
              link: ['/app/pausas/ejecutar', next?.routineId ?? 'libre'],
              query: { slot: next?.scheduledAt ?? null, pausaId: next?.pausaId ?? null },
            },
            { label: 'Ver mis pausas', primary: false, link: ['/app/pausas'] },
          ],
        };
      case 'overdue':
        return {
          ...base,
          icon: 'alert',
          badge: 'bg-amber-50 text-amber-600 border border-amber-200',
          bar: 'bg-amber-500',
          chipClass: 'bg-amber-50 text-amber-700 border border-amber-200',
          actions: [
            { label: 'Ver mis pausas', primary: true, link: ['/app/pausas'] },
            { label: 'Ver historial', primary: false, link: ['/app/pausas/historial'] },
          ],
        };
      case 'streak':
        return {
          ...base,
          icon: 'flame',
          badge: 'bg-rose-50 text-rose-600 border border-rose-200',
          bar: 'bg-rose-500',
          chipClass: 'bg-rose-50 text-rose-700 border border-rose-200',
          actions: [{ label: 'Ver historial', primary: true, link: ['/app/pausas/historial'] }],
        };
      default:
        return {
          ...base,
          icon: 'check-circle',
          badge: 'bg-emerald-50 text-emerald-600 border border-emerald-200',
          bar: 'bg-emerald-500',
          chipClass: 'bg-emerald-50 text-emerald-700 border border-emerald-200',
          actions: [{ label: 'Ver historial', primary: true, link: ['/app/pausas/historial'] }],
        };
    }
  }

  onQuery(event: Event): void {
    this.query.set((event.target as HTMLInputElement).value);
  }

  setFiltro(f: AvisoFiltro): void {
    this.filtro.set(f);
  }

  tabClass(f: AvisoFiltro): string {
    return this.filtro() === f
      ? 'px-4 py-2 text-xs font-bold rounded-xl bg-brand-950 text-white shadow-sm transition-all'
      : 'px-4 py-2 text-xs font-semibold rounded-xl text-slate-600 hover:text-slate-900 hover:bg-white/70 transition-all';
  }

  acceptConsent(): void {
    this.portal.acceptConsent().subscribe({
      next: () => this.pausas.load(),
      error: (err) => this.error.set(apiError(err, 'No se pudo registrar el consentimiento.')),
    });
  }

  toggleRead(item: NotificationItem): void {
    this.pausas.setNotificationRead(item.id, !item.read);
  }
}
