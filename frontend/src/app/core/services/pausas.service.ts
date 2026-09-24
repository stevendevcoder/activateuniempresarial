import { Injectable, computed, inject, signal } from '@angular/core';
import { catchError, forkJoin, of } from 'rxjs';
import {
  ConsentStatus,
  GlobalConfig,
  PAUSA_STATUS,
  PortalPause,
  PortalStats,
  Schedule,
} from '../api.types';
import { DayPause, HistoryDay, NotificationItem, PauseStatus } from '../models';
import {
  isSameLocalDay,
  isWithinRange,
  localTime,
  minutesFromTime,
  startOfDay,
  timeFromMinutes,
  toMeridiem,
  todayAt,
} from '../utils';
import { AuthService } from './auth.service';
import { PortalService } from './portal.service';

const READ_KEY = 'activate_notifications_read';
const HISTORY_DAYS = 7;
const DAY_LABELS = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];

function statusFor(pausa: PortalPause | undefined): PauseStatus {
  switch (pausa?.status) {
    case PAUSA_STATUS.COMPLETADA:
      return 'completed';
    case PAUSA_STATUS.APLAZADA:
      return 'postponed';
    case PAUSA_STATUS.CANCELADA:
      return 'cancelled';
    default:
      return 'pending';
  }
}

/** Estado del día del trabajador: cronograma del área + pausas registradas en el backend. */
@Injectable({ providedIn: 'root' })
export class PausasService {
  private readonly portal = inject(PortalService);
  private readonly auth = inject(AuthService);

  readonly schedule = signal<Schedule | null>(null);
  readonly config = signal<GlobalConfig | null>(null);
  readonly recent = signal<PortalPause[]>([]);
  readonly stats = signal<PortalStats | null>(null);
  readonly consent = signal<ConsentStatus | null>(null);
  readonly loading = signal(false);
  readonly loaded = signal(false);
  readonly error = signal('');
  private readonly readIds = signal<string[]>(this.readStoredIds());

  readonly todayPausas = computed(() => this.recent().filter((p) => isSameLocalDay(p.scheduledAt, new Date())));

  readonly jornada = computed(() => {
    const s = this.schedule();
    return s ? `${toMeridiem(s.startTime)} – ${toMeridiem(s.endTime)}` : 'Sin cronograma asignado';
  });

  readonly maxPostponements = computed(() => this.config()?.maxPostponements ?? 2);

  /** Línea de tiempo de hoy: inicio de jornada, cupos del cronograma, almuerzo y pausas libres. */
  readonly pauses = computed<DayPause[]>(() => {
    const items: DayPause[] = [];
    const schedule = this.schedule();
    const config = this.config();
    const today = this.todayPausas();
    const used = new Set<number>();

    const slots = schedule ? this.slotsFor(schedule, new Date().getDay()) : [];
    if (schedule && slots.length) {
      items.push(this.item({
        id: 'start',
        time: schedule.startTime,
        title: 'Inicio de jornada',
        subtitle: '',
        kind: 'start',
        status: 'info',
      }));

      for (const slot of slots) {
        const pausa = today.find((p) => !used.has(p.id) && localTime(p.scheduledAt) === slot);
        if (pausa) used.add(pausa.id);
        items.push(this.item({
          id: `slot-${slot}`,
          time: slot,
          title: 'Pausa activa',
          subtitle: `${pausa?.routineName ?? schedule.routineName ?? 'Pausa guiada'} · ${schedule.durationMinutes} min`,
          kind: 'active',
          status: statusFor(pausa),
          durationMin: schedule.durationMinutes,
          routineId: pausa?.idRoutine ?? schedule.idRoutine,
          scheduledAt: todayAt(slot).toISOString(),
          pausaId: pausa?.id ?? null,
        }));
      }

      if (config && minutesFromTime(config.lunchStart) < minutesFromTime(schedule.endTime)) {
        const lunchMinutes = minutesFromTime(config.lunchEnd) - minutesFromTime(config.lunchStart);
        items.push(this.item({
          id: 'lunch',
          time: config.lunchStart,
          title: 'Almuerzo',
          subtitle: `${lunchMinutes} min`,
          kind: 'lunch',
          status: 'info',
          durationMin: lunchMinutes,
        }));
      }
    }

    for (const pausa of today) {
      if (used.has(pausa.id)) continue;
      items.push(this.item({
        id: `pausa-${pausa.id}`,
        time: localTime(pausa.scheduledAt),
        title: pausa.routineName ?? 'Pausa libre',
        subtitle: 'Pausa iniciada por ti',
        kind: 'active',
        status: statusFor(pausa),
        routineId: pausa.idRoutine,
        scheduledAt: pausa.scheduledAt,
        pausaId: pausa.id,
      }));
    }

    return items.sort((a, b) => minutesFromTime(a.time) - minutesFromTime(b.time));
  });

  readonly activePauses = computed(() => this.pauses().filter((p) => p.kind === 'active'));
  readonly completedCount = computed(() => this.activePauses().filter((p) => p.status === 'completed').length);
  readonly totalActive = computed(() => this.activePauses().length);
  readonly compliance = computed(() => {
    const total = this.totalActive();
    return total ? Math.round((this.completedCount() / total) * 100) : 0;
  });

  /** Próxima pausa pendiente; si ya pasaron todas, la pendiente más antigua. */
  readonly nextPause = computed(() => {
    const now = new Date().getHours() * 60 + new Date().getMinutes();
    const pending = this.activePauses().filter((p) => p.status === 'pending' || p.status === 'postponed');
    return pending.find((p) => minutesFromTime(p.time) + p.durationMin >= now) ?? pending[0] ?? null;
  });

  readonly history = computed<HistoryDay[]>(() => {
    const schedule = this.schedule();
    const days: HistoryDay[] = [];
    for (let i = 0; i < HISTORY_DAYS; i++) {
      const day = startOfDay(new Date());
      day.setDate(day.getDate() - i);
      const registered = this.recent().filter((p) => isSameLocalDay(p.scheduledAt, day));
      const expected = schedule ? this.slotsFor(schedule, day.getDay()).length : 0;
      days.push({
        date: day.toLocaleDateString('es-CO', { day: 'numeric', month: 'short' }),
        label: i === 0 ? 'Hoy' : i === 1 ? 'Ayer' : DAY_LABELS[day.getDay()],
        completed: registered.filter((p) => p.status === PAUSA_STATUS.COMPLETADA).length,
        total: Math.max(expected, registered.length),
      });
    }
    return days;
  });

  readonly notifications = computed<NotificationItem[]>(() => {
    const read = new Set(this.readIds());
    const list: Omit<NotificationItem, 'read'>[] = [];
    const next = this.nextPause();
    const consent = this.consent();
    const stats = this.stats();

    if (consent && !consent.accepted) {
      list.push({
        id: 'consent',
        title: 'Consentimiento pendiente',
        body: 'Autoriza el tratamiento de tus datos de cumplimiento desde tu perfil.',
        time: 'Privacidad',
      });
    }
    if (next) {
      list.push({
        id: `next-${next.id}-${new Date().toDateString()}`,
        title: 'Tu próxima pausa',
        body: `${next.subtitle || next.title} a las ${toMeridiem(next.time)}.`,
        time: 'Hoy',
      });
    }
    const overdue = this.activePauses().filter(
      (p) => p.status === 'pending' && minutesFromTime(p.time) + p.durationMin < new Date().getHours() * 60 + new Date().getMinutes(),
    ).length;
    if (overdue > 0) {
      list.push({
        id: `overdue-${overdue}-${new Date().toDateString()}`,
        title: 'Pausas pendientes',
        body: `Tienes ${overdue} pausa(s) sin completar hoy. ¡Aún estás a tiempo!`,
        time: 'Hoy',
      });
    }
    if (stats && stats.currentStreak >= 2) {
      list.push({
        id: `streak-${stats.currentStreak}`,
        title: '¡Vas en racha!',
        body: `Llevas ${stats.currentStreak} días seguidos completando pausas.`,
        time: 'Logro',
      });
    }
    for (const pausa of this.todayPausas().filter((p) => p.status === PAUSA_STATUS.COMPLETADA)) {
      list.push({
        id: `done-${pausa.id}`,
        title: 'Pausa completada',
        body: `Completaste ${pausa.routineName ?? 'una pausa activa'}. ¡Buen trabajo!`,
        time: toMeridiem(localTime(pausa.completedAt ?? pausa.scheduledAt)),
      });
    }
    return list.map((n) => ({ ...n, read: read.has(n.id) }));
  });

  readonly unreadCount = computed(() => this.notifications().filter((n) => !n.read).length);

  load(): void {
    const user = this.auth.user();
    if (!user) return;
    this.loading.set(true);
    this.error.set('');

    const since = startOfDay(new Date());
    since.setDate(since.getDate() - (HISTORY_DAYS - 1));

    forkJoin({
      config: this.portal.getConfig().pipe(catchError(() => of(null))),
      schedule: user.idArea ? this.portal.getScheduleByArea(user.idArea).pipe(catchError(() => of(null))) : of(null),
      pauses: this.portal.getPauses({ limit: 200, start: since.toISOString() }).pipe(catchError(() => of(null))),
      stats: this.portal.getStats().pipe(catchError(() => of(null))),
      consent: this.portal.getConsent().pipe(catchError(() => of(null))),
    }).subscribe(({ config, schedule, pauses, stats, consent }) => {
      this.config.set(config);
      this.schedule.set(schedule && schedule.status === 1 ? schedule : null);
      this.recent.set(pauses?.items ?? []);
      this.stats.set(stats);
      this.consent.set(consent);
      if (!pauses) this.error.set('No se pudieron cargar tus pausas. Verifica tu conexión.');
      this.loading.set(false);
      this.loaded.set(true);
    });
  }

  markNotificationsRead(): void {
    const ids = [...new Set([...this.readIds(), ...this.notifications().map((n) => n.id)])].slice(-100);
    this.readIds.set(ids);
    localStorage.setItem(READ_KEY, JSON.stringify(ids));
  }

  /** Cupos (HH:mm) del cronograma para un día de la semana, excluyendo el almuerzo. */
  private slotsFor(schedule: Schedule, weekday: number): string[] {
    if (schedule.paused || !schedule.daysOfWeek.includes(weekday)) return [];
    const config = this.config();
    const slots: string[] = [];
    const end = minutesFromTime(schedule.endTime);
    for (let m = minutesFromTime(schedule.startTime); m < end; m += Math.max(schedule.frequencyMinutes, 5)) {
      const slot = timeFromMinutes(m);
      if (config && isWithinRange(slot, config.lunchStart, config.lunchEnd)) continue;
      slots.push(slot);
    }
    return slots;
  }

  private item(partial: Partial<DayPause> & Pick<DayPause, 'id' | 'time' | 'title' | 'kind' | 'status'>): DayPause {
    return {
      subtitle: '',
      durationMin: 0,
      routineId: null,
      scheduledAt: null,
      pausaId: null,
      ...partial,
      period: minutesFromTime(partial.time) < 12 * 60 ? 'mañana' : 'tarde',
    };
  }

  private readStoredIds(): string[] {
    try {
      const raw = JSON.parse(localStorage.getItem(READ_KEY) ?? '[]');
      return Array.isArray(raw) ? raw : [];
    } catch {
      return [];
    }
  }
}
