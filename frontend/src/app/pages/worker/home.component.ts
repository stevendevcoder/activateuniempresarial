import { Component, computed, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { DayPause } from '../../core/models';
import { AuthService } from '../../core/services/auth.service';
import { PausasService } from '../../core/services/pausas.service';
import { PortalService } from '../../core/services/portal.service';
import { minutesFromTime, toMeridiem } from '../../core/utils';
import { AchievementsComponent } from '../../shared/achievements.component';

import { MascotaComponent } from '../../shared/mascota.component';
import { ProgressRingComponent } from '../../shared/progress-ring.component';

@Component({
  selector: 'app-home',
  imports: [RouterLink, MascotaComponent, ProgressRingComponent, AchievementsComponent],
  templateUrl: './home.component.html',
  styleUrl: './home.component.scss',
})
export class HomeComponent {
  readonly auth = inject(AuthService);
  readonly pausas = inject(PausasService);
  private readonly portal = inject(PortalService);

  readonly goals = computed(() => this.pausas.activePauses().slice(0, 4));

  /** Cara de la mascota según el cumplimiento de HOY (acompaña el anillo de progreso). */
  readonly todayMascot = computed<'feliz' | 'triste'>(() => {
    if (this.pausas.totalActive() === 0) return 'feliz';
    return this.pausas.compliance() >= 50 ? 'feliz' : 'triste';
  });

  /** Mensaje de ánimo según cómo le fue al trabajador el día anterior. */
  readonly yesterdayNote = computed(() => {
    // Si hoy ya completaste todas tus pausas, no tiene sentido recordar lo de ayer.
    if (this.pausas.totalActive() > 0 && this.pausas.compliance() >= 100) return null;
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
    if (pause.status === 'postponed') return { label: 'Aplazada', tone: 'bg-amber-50 text-amber-700 ring-amber-200' };
    if (diff > 60) return { label: `En ${Math.floor(diff / 60)} h ${diff % 60} min`, tone: 'bg-brand-50 text-brand-700 ring-brand-100' };
    if (diff > 0) return { label: `En ${diff} minutos`, tone: 'bg-emerald-50 text-emerald-700 ring-emerald-200' };
    if (diff > -pause.durationMin) return { label: 'Es ahora', tone: 'bg-emerald-50 text-emerald-700 ring-emerald-200' };
    return { label: 'Pendiente', tone: 'bg-rose-50 text-rose-600 ring-rose-200' };
  }

  acceptConsent(): void {
    this.portal.acceptConsent().subscribe({ next: () => this.pausas.load(), error: () => undefined });
  }
}
