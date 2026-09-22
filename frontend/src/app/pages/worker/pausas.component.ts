import { Component, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { DayPause } from '../../core/models';
import { AuthService } from '../../core/services/auth.service';
import { PausasService } from '../../core/services/pausas.service';
import { IconComponent } from '../../shared/icon.component';

@Component({
  selector: 'app-pausas',
  imports: [RouterLink, IconComponent],
  templateUrl: './pausas.component.html',
  styleUrl: './pausas.component.scss',
})
export class PausasComponent {
  readonly auth = inject(AuthService);
  readonly pausas = inject(PausasService);
  readonly periods = ['mañana', 'tarde'] as const;

  byPeriod(period: 'mañana' | 'tarde'): DayPause[] {
    return this.pausas.pauses().filter((p) => p.period === period);
  }

  tone(pause: DayPause): string {
    if (pause.status === 'completed') return 'done';
    if (pause.kind === 'lunch') return 'lunch';
    return 'pending';
  }

  badge(pause: DayPause): string {
    if (pause.status === 'completed') return 'Completada';
    if (pause.kind === 'lunch') return 'Almuerzo';
    return 'Pendiente';
  }
}
