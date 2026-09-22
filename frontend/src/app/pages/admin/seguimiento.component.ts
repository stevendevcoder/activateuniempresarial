import { Component, computed, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { DashboardService } from '../../core/services/dashboard.service';
import { UsersService } from '../../core/services/users.service';
import { AvatarComponent } from '../../shared/avatar.component';
import { IconComponent } from '../../shared/icon.component';

@Component({
  selector: 'app-seguimiento',
  imports: [RouterLink, AvatarComponent, IconComponent],
  templateUrl: './seguimiento.component.html',
  styleUrl: './seguimiento.component.scss',
})
export class SeguimientoComponent {
  private readonly users = inject(UsersService);
  readonly dash = inject(DashboardService);
  readonly query = signal('');
  readonly filter = signal<'all' | 'ok' | 'pending'>('all');
  readonly counts = this.dash.liveCounts;
  readonly tabs = [
    { id: 'all' as const, label: 'Todos' },
    { id: 'ok' as const, label: 'Al día' },
    { id: 'pending' as const, label: 'Pendientes' },
  ];

  readonly filtered = computed(() => {
    const q = this.query().toLowerCase();
    return this.users.workers().filter((w) => {
      const matchesFilter = this.filter() === 'all' || w.status === this.filter();
      const matchesQuery = !q || w.name.toLowerCase().includes(q) || w.area.toLowerCase().includes(q);
      return matchesFilter && matchesQuery;
    });
  });
}
