import { DecimalPipe } from '@angular/common';
import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { UserCompliance } from '../../core/api.types';
import { AnalyticsService } from '../../core/services/analytics.service';
import { apiError } from '../../core/utils';
import { AvatarComponent, avatarKind } from '../../shared/avatar.component';
import { IconComponent } from '../../shared/icon.component';

/** Umbral de cumplimiento histórico para considerar a un trabajador "al día". */
export const ON_TRACK_RATE = 80;

export function trackStatus(worker: UserCompliance): 'ok' | 'pending' {
  const pendingToday = worker.todayTotal > worker.todayCompleted;
  return worker.total > 0 && worker.complianceRate >= ON_TRACK_RATE && !pendingToday ? 'ok' : 'pending';
}

@Component({
  selector: 'app-seguimiento',
  imports: [RouterLink, DecimalPipe, AvatarComponent, IconComponent],
  templateUrl: './seguimiento.component.html',
  styleUrl: './seguimiento.component.scss',
})
export class SeguimientoComponent implements OnInit {
  private readonly analytics = inject(AnalyticsService);

  readonly workers = signal<UserCompliance[]>([]);
  readonly loading = signal(false);
  readonly error = signal('');
  readonly query = signal('');
  readonly filter = signal<'all' | 'ok' | 'pending'>('all');
  readonly tabs = [
    { id: 'all' as const, label: 'Todos' },
    { id: 'ok' as const, label: 'Al día' },
    { id: 'pending' as const, label: 'Pendientes' },
  ];

  readonly counts = computed(() => {
    const list = this.workers();
    const ok = list.filter((w) => trackStatus(w) === 'ok').length;
    return { total: list.length, ok, pending: list.length - ok };
  });

  readonly filtered = computed(() => {
    const q = this.query().toLowerCase();
    return this.workers().filter((w) => {
      const matchesFilter = this.filter() === 'all' || trackStatus(w) === this.filter();
      const matchesQuery =
        !q || w.name.toLowerCase().includes(q) || (w.areaName ?? '').toLowerCase().includes(q);
      return matchesFilter && matchesQuery;
    });
  });

  ngOnInit(): void {
    this.loading.set(true);
    this.analytics.getUsers().subscribe({
      next: (list) => {
        this.workers.set(list);
        this.loading.set(false);
      },
      error: (err) => {
        this.error.set(apiError(err, 'No se pudo cargar el seguimiento.'));
        this.loading.set(false);
      },
    });
  }

  status(worker: UserCompliance): 'ok' | 'pending' {
    return trackStatus(worker);
  }

  kind(id: number): string {
    return avatarKind(id);
  }
}
