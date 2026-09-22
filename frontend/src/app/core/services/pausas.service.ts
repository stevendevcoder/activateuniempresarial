import { Injectable, computed, signal } from '@angular/core';
import { HISTORY, HOME_GOALS, INITIAL_PAUSES, NOTIFICATIONS } from '../mock-data';
import { DayPause, HistoryDay, NotificationItem } from '../models';

const PAUSES_KEY = 'activate_pauses';

@Injectable({ providedIn: 'root' })
export class PausasService {
  readonly pauses = signal<DayPause[]>(this.readPauses());
  readonly goals = signal(HOME_GOALS.map((g) => ({ ...g })));
  readonly history = signal<HistoryDay[]>([...HISTORY]);
  readonly notifications = signal<NotificationItem[]>([...NOTIFICATIONS]);

  readonly activePauses = computed(() =>
    this.pauses().filter((p) => p.kind === 'active' || p.kind === 'visual'),
  );

  readonly completedCount = computed(
    () => this.activePauses().filter((p) => p.status === 'completed').length,
  );

  readonly totalActive = computed(() => this.activePauses().length);

  readonly compliance = computed(() => {
    const total = this.totalActive();
    if (!total) return 0;
    return Math.round((this.completedCount() / total) * 100);
  });

  readonly unreadCount = computed(
    () => this.notifications().filter((n) => !n.read).length,
  );

  readonly goalsDone = computed(() => this.goals().filter((g) => g.done).length);

  readonly nextPause = computed(() => {
    return (
      this.pauses().find(
        (p) => (p.kind === 'active' || p.kind === 'visual') && p.status === 'pending',
      ) ?? null
    );
  });

  completePause(id: string): void {
    this.pauses.update((list) =>
      list.map((p) => (p.id === id ? { ...p, status: 'completed' } : p)),
    );
    localStorage.setItem(PAUSES_KEY, JSON.stringify(this.pauses()));

    const pause = this.pauses().find((p) => p.id === id);
    if (pause?.kind === 'active' && pause.period === 'mañana') {
      this.goals.update((g) => g.map((item) => (item.id === 'g1' ? { ...item, done: true } : item)));
    }
    if (pause?.kind === 'visual') {
      this.goals.update((g) => g.map((item) => (item.id === 'g2' ? { ...item, done: true } : item)));
    }
    if (pause?.kind === 'active' && pause.period === 'tarde') {
      this.goals.update((g) => g.map((item) => (item.id === 'g3' ? { ...item, done: true } : item)));
    }
  }

  completeRoutine(routineId: string): void {
    if (routineId === 'respiracion') {
      this.goals.update((g) => g.map((item) => (item.id === 'g4' ? { ...item, done: true } : item)));
    }
    const next = this.nextPause();
    if (next && next.routineId === routineId) {
      this.completePause(next.id);
    }
  }

  markNotificationsRead(): void {
    this.notifications.update((list) => list.map((n) => ({ ...n, read: true })));
  }

  private readPauses(): DayPause[] {
    const raw = localStorage.getItem(PAUSES_KEY);
    if (!raw) return INITIAL_PAUSES.map((p) => ({ ...p }));
    try {
      return JSON.parse(raw) as DayPause[];
    } catch {
      return INITIAL_PAUSES.map((p) => ({ ...p }));
    }
  }
}
