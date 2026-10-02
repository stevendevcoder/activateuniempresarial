import { Component, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { DayMood } from '../../core/models';
import { PausasService } from '../../core/services/pausas.service';
import { MoodComponent } from '../../shared/mood.component';

@Component({
  selector: 'app-historial',
  imports: [RouterLink, MoodComponent],
  templateUrl: './historial.component.html',
})
export class HistorialComponent {
  readonly pausas = inject(PausasService);

  /** Color de la barra de avance según el ánimo del día. */
  barTone(mood: DayMood): string {
    switch (mood) {
      case 'happy':
        return 'bg-emerald-500';
      case 'sad':
        return 'bg-rose-400';
      case 'pending':
        return 'bg-amber-500';
      default:
        return 'bg-slate-300';
    }
  }
}