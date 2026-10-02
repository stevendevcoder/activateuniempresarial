import { Component, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { DayPause } from '../../core/models';
import { PausasService } from '../../core/services/pausas.service';
import { toMeridiem } from '../../core/utils';
@Component({
  selector: 'app-pausas',
  imports: [RouterLink],
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

  /** Clase del punto y de la tarjeta de la línea de tiempo (ver pausa.component.scss). */
  tone(pause: DayPause): string {
    if (pause.status === 'completed') return 'done';
    if (pause.status === 'cancelled') return 'cancelled';
    if (pause.kind !== 'active') return 'lunch';
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

  badgeTone(pause: DayPause): string {
    if (pause.status === 'completed') return 'bg-emerald-50 text-emerald-700 ring-emerald-200';
    if (pause.status === 'cancelled') return 'bg-slate-100 text-slate-500 ring-slate-200';
    if (pause.status === 'postponed') return 'bg-amber-50 text-amber-700 ring-amber-200';
    if (pause.kind !== 'active') return 'bg-slate-100 text-slate-600 ring-slate-200';
    return 'bg-rose-50 text-rose-600 ring-rose-200';
  }
}