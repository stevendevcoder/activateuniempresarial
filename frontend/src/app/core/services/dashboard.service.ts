import { Injectable, computed, inject } from '@angular/core';
import { ADMIN_SUMMARY } from '../mock-data';
import { UsersService } from './users.service';

@Injectable({ providedIn: 'root' })
export class DashboardService {
  private readonly users = inject(UsersService);
  readonly summary = ADMIN_SUMMARY;

  readonly liveCounts = computed(() => {
    const workers = this.users.workers();
    const pending = workers.filter((w) => w.status === 'pending').length;
    const ok = workers.filter((w) => w.status === 'ok').length;
    return {
      total: workers.length,
      ok,
      pending,
    };
  });
}
