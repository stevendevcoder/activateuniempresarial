import { Component, OnDestroy, computed, inject, signal } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';
import { PausasService } from '../../core/services/pausas.service';
import { RutinasService } from '../../core/services/rutinas.service';
import { IconComponent } from '../../shared/icon.component';
import { MascotComponent } from '../../shared/mascot.component';

@Component({
  selector: 'app-player',
  imports: [RouterLink, IconComponent, MascotComponent],
  templateUrl: './player.component.html',
  styleUrl: './player.component.scss',
})
export class PlayerComponent implements OnDestroy {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly rutinas = inject(RutinasService);
  private readonly pausas = inject(PausasService);
  private readonly auth = inject(AuthService);

  readonly routineId = this.route.snapshot.paramMap.get('id') ?? 'pausas-activas';
  readonly pauseId = this.route.snapshot.queryParamMap.get('pauseId');
  readonly routine = computed(() => this.rutinas.byId(this.routineId));
  readonly index = signal(0);
  readonly remaining = signal(this.current().seconds);
  private timer: ReturnType<typeof setInterval> | null = null;

  constructor() {
    this.auth.setPreference('dnd', true);
    this.startTimer();
  }

  current() {
    const fallback = {
      id: 'empty',
      name: 'Pausa',
      instruction: 'Sigue la guía en pantalla.',
      seconds: 30,
      pose: 'idle' as const,
      tip: 'Respira con calma.',
    };
    const routine = this.routine();
    return routine?.exercises[this.index()] ?? routine?.exercises[0] ?? fallback;
  }

  progress(): number {
    const routine = this.routine();
    if (!routine) return 0;
    return Math.round(((this.index() + 1) / routine.exercises.length) * 100);
  }

  exerciseProgress(): number {
    const total = this.current().seconds;
    return Math.round(((total - this.remaining()) / total) * 100);
  }

  clock(): string {
    return `00:${String(this.remaining()).padStart(2, '0')}`;
  }

  isLast(): boolean {
    return this.index() === (this.routine()?.exercises.length ?? 1) - 1;
  }

  next(): void {
    if (this.isLast()) {
      this.finish();
      return;
    }
    this.index.update((i) => i + 1);
    this.resetTimer();
  }

  prev(): void {
    if (this.index() === 0) return;
    this.index.update((i) => i - 1);
    this.resetTimer();
  }

  finish(): void {
    if (this.pauseId) this.pausas.completePause(this.pauseId);
    this.pausas.completeRoutine(this.routineId);
    this.auth.setPreference('dnd', false);
    this.router.navigate(['/app/pausas']);
  }

  ngOnDestroy(): void {
    this.stopTimer();
    this.auth.setPreference('dnd', false);
  }

  private startTimer(): void {
    this.stopTimer();
    this.remaining.set(this.current().seconds);
    this.timer = setInterval(() => {
      if (this.remaining() <= 1) {
        this.next();
        return;
      }
      this.remaining.update((n) => n - 1);
    }, 1000);
  }

  private resetTimer(): void {
    this.startTimer();
  }

  private stopTimer(): void {
    if (this.timer) clearInterval(this.timer);
    this.timer = null;
  }
}
