import { DatePipe, DecimalPipe } from '@angular/common';
import { Component, OnInit, inject, signal } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { AdminUser, UserCompliance } from '../../core/api.types';
import { AdminService } from '../../core/services/admin.service';
import { AnalyticsService } from '../../core/services/analytics.service';
import { apiError } from '../../core/utils';
import { AvatarComponent, avatarKind } from '../../shared/avatar.component';
import { ProgressRingComponent } from '../../shared/progress-ring.component';
import { trackStatus } from './seguimiento.component';

@Component({
  selector: 'app-trabajador-detalle',
  imports: [RouterLink, DatePipe, DecimalPipe, AvatarComponent, ProgressRingComponent],
  templateUrl: './trabajador-detalle.component.html',
  styleUrl: './trabajador-detalle.component.scss',
})
export class TrabajadorDetalleComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly analytics = inject(AnalyticsService);
  private readonly admin = inject(AdminService);
  private readonly id = Number(this.route.snapshot.paramMap.get('id'));

  readonly worker = signal<UserCompliance | null>(null);
  readonly user = signal<AdminUser | null>(null);
  readonly loading = signal(true);
  readonly error = signal('');
  readonly kind = avatarKind(this.id);

  get status(): 'ok' | 'pending' {
    const w = this.worker();
    return w ? trackStatus(w) : 'pending';
  }

  ngOnInit(): void {
    this.analytics.getUsers().subscribe({
      next: (list) => {
        this.worker.set(list.find((w) => w.idUser === this.id) ?? null);
        this.loading.set(false);
      },
      error: (err) => {
        this.error.set(apiError(err, 'No se pudo cargar el detalle.'));
        this.loading.set(false);
      },
    });
    this.admin.getUser(this.id).subscribe({ next: (u) => this.user.set(u), error: () => undefined });
  }
}
