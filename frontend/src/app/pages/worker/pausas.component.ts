import { Component, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { DayPause } from '../../core/models';
import { PausasService } from '../../core/services/pausas.service';
import { toMeridiem } from '../../core/utils';
import { IconComponent } from '../../shared/icon.component';

@Component({
  selector: 'app-pausas',
  imports: [RouterLink, IconComponent],
  templateUrl: './pausas.component.html',
  styleUrl: './pausas.component.scss',
})
export class PausasComponent {
  readonly pausas = inject(PausasService);
  readonly periods = ['mañana', 'tarde'] as const;

  byPeriod(period: 'mañana' | 'tarde'): DayPause[] {
    return this.pausas.pauses().filter((p) => p.period === period);
  }

  time(value: string): string {
    return toMeridiem(value);
  }

  tone(pause: DayPause): string {
    if (pause.status === 'completed') return 'done';
    if (pause.kind === 'lunch' || pause.kind === 'start') return 'lunch';
    if (pause.status === 'cancelled') return 'cancelled';
    return 'pending';
  }

  badge(pause: DayPause): string {
    if (pause.kind === 'lunch') return 'Almuerzo';
    if (pause.kind === 'start') return 'Jornada';
    switch (pause.status) {
      case 'completed':
        return 'Completada';
      case 'postponed':
        return 'Aplazada';
      case 'cancelled':
        return 'Cancelada';
      default:
        return 'Pendiente';
    }
  }
}
