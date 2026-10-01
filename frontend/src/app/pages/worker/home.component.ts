import { Component, computed, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { DayPause } from '../../core/models';
import { AuthService } from '../../core/services/auth.service';
import { PausasService } from '../../core/services/pausas.service';
import { PortalService } from '../../core/services/portal.service';
import { minutesFromTime, toMeridiem } from '../../core/utils';
import { AchievementsComponent } from '../../shared/achievements.component';
import { IconComponent } from '../../shared/icon.component';
import { MascotComponent } from '../../shared/mascot.component';
import { MoodComponent } from '../../shared/mood.component';
import { ProgressRingComponent } from '../../shared/progress-ring.component';

@Component({
  selector: 'app-home',
  imports: [RouterLink, IconComponent, MascotComponent, MoodComponent, ProgressRingComponent, AchievementsComponent],
  templateUrl: './home.component.html',
  styleUrl: './home.component.scss',
})
export class HomeComponent {
  readonly auth = inject(AuthService);
  readonly pausas = inject(PausasService);
  private readonly portal = inject(PortalService);

  readonly goals = computed(() => this.pausas.activePauses().slice(0, 4));

  /** Mensaje de ánimo según cómo le fue al trabajador el día anterior. */
  readonly yesterdayNote = computed(() => {
    const day = this.pausas.yesterday();
    if (!day || day.total === 0) return null;
    if (day.mood === 'happy') {
      return {
        mood: 'happy' as const,
        title: '¡Bien hecho ayer!',
        text: `Completaste tus ${day.total} pausa(s). Sigue cuidando tu bienestar.`,
      };
    }
    return {
      mood: 'sad' as const,
      title: 'Ayer quedaste a mitad de camino',
      text: `No completaste tus pausas de ayer (${day.completed}/${day.total}). Hoy es un nuevo día para intentarlo.`,
    };
  });

  readonly motivation = computed(() => {
    const compliance = this.pausas.compliance();
    if (!this.pausas.totalActive()) return 'Tu bienestar también es parte del trabajo. ¡Regálate unos minutos!';
    if (compliance >= 100) return '¡Excelente! Completaste todas tus pausas de hoy.';
    if (compliance >= 50) return '¡Vas muy bien! Regálate unos minutos para continuar con energía.';
    return 'Cada pausa cuenta. Levántate, estírate y respira profundo.';
  });

  nextTitle(next: DayPause): string {
    if (next.title === 'Pausa activa' && next.subtitle) {
      return next.subtitle.split('·')[0].trim();
    }
    return next.title;
  }

  goalLabel(pause: DayPause): string {
    return `Pausa de las ${toMeridiem(pause.time)}`;
  }

  hour(time: string): string {
    return toMeridiem(time).split(' ')[0];
  }

  meridiem(time: string): string {
    return toMeridiem(time).split(' ')[1];
  }

  when(pause: DayPause): { label: string; tone: string } {
    const now = new Date();
    const diff = minutesFromTime(pause.time) - (now.getHours() * 60 + now.getMinutes());
    if (pause.status === 'postponed') return { label: 'Aplazada', tone: 'chip-amber' };
    if (diff > 60) return { label: `En ${Math.floor(diff / 60)} h ${diff % 60} min`, tone: 'chip-info' };
    if (diff > 0) return { label: `En ${diff} minutos`, tone: 'chip-ok' };
    if (diff > -pause.durationMin) return { label: 'Es ahora', tone: 'chip-ok' };
    return { label: 'Pendiente', tone: 'chip-warn' };
  }

  acceptConsent(): void {
    this.portal.acceptConsent().subscribe({ next: () => this.pausas.load(), error: () => undefined });
  }
}
