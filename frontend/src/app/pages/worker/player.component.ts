import { Component, OnDestroy, OnInit, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { Observable, of, switchMap } from 'rxjs';
import { PortalPause, TELEMETRY_TYPE } from '../../core/api.types';
import { Exercise, Routine } from '../../core/models';
import { AuthService } from '../../core/services/auth.service';
import { PausasService } from '../../core/services/pausas.service';
import { PortalService } from '../../core/services/portal.service';
import { FREE_PAUSE_EXERCISES, RutinasService } from '../../core/services/rutinas.service';
import { apiError } from '../../core/utils';
import { IconComponent } from '../../shared/icon.component';
import { MascotComponent } from '../../shared/mascot.component';

type Phase = 'loading' | 'running' | 'done' | 'error';

const FREE_ROUTINE: Routine = {
  id: 0,
  name: 'Pausa libre',
  description: 'Ejercicios guiados para recargar energía',
  category: 'General',
  duration: '2 min',
  pose: 'arms-up',
  tint: '#EEF2FF',
  exercises: FREE_PAUSE_EXERCISES,
};

@Component({
  selector: 'app-player',
  imports: [RouterLink, FormsModule, IconComponent, MascotComponent],
  templateUrl: './player.component.html',
  styleUrl: './player.component.scss',
})
export class PlayerComponent implements OnInit, OnDestroy {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly rutinas = inject(RutinasService);
  private readonly pausas = inject(PausasService);
  private readonly portal = inject(PortalService);
  private readonly auth = inject(AuthService);

  private readonly routineParam = this.route.snapshot.paramMap.get('id') ?? 'libre';
  private readonly slot = this.route.snapshot.queryParamMap.get('slot');
  private readonly pausaParam = Number(this.route.snapshot.queryParamMap.get('pausaId')) || null;

  readonly phase = signal<Phase>('loading');
  readonly routine = signal<Routine>(FREE_ROUTINE);
  readonly index = signal(0);
  readonly remaining = signal(30);
  readonly videoUrl = signal<string | null>(null);
  readonly loadingVideo = signal(false);
  readonly error = signal('');
  readonly actionError = signal('');
  readonly busy = signal(false);
  readonly cancelling = signal(false);
  readonly postponed = signal(0);
  cancelReason = '';

  readonly current = computed<Exercise>(() => {
    const list = this.routine().exercises;
    return list[this.index()] ?? list[0] ?? FREE_PAUSE_EXERCISES[0];
  });

  readonly maxPostponements = this.pausas.maxPostponements;

  private pausa: PortalPause | null = null;
  private timer: ReturnType<typeof setInterval> | null = null;

  ngOnInit(): void {
    this.auth.setPreference('dnd', true);
    const routineId = Number(this.routineParam);
    const routine$: Observable<Routine | null> = routineId > 0 ? this.rutinas.fetch(routineId) : of(FREE_ROUTINE);

    routine$
      .pipe(
        switchMap((routine) => {
          this.routine.set(routine ?? FREE_ROUTINE);
          return this.ensurePausa(routine && routine.id > 0 ? routine.id : null);
        }),
      )
      .subscribe({
        next: (pausa) => {
          this.pausa = pausa;
          this.portal
            .sendEvent({ type: TELEMETRY_TYPE.INICIO, idPausa: pausa.id, idArea: pausa.idArea })
            .subscribe({ error: () => undefined });
          this.phase.set('running');
          this.startExercise();
        },
        error: (err) => {
          this.error.set(apiError(err, 'No se pudo iniciar la pausa.'));
          this.phase.set('error');
        },
      });
  }

  ngOnDestroy(): void {
    this.stopTimer();
    this.releaseVideo();
    this.auth.setPreference('dnd', false);
  }

  progress(): number {
    return Math.round(((this.index() + 1) / this.routine().exercises.length) * 100);
  }

  exerciseProgress(): number {
    const total = this.current().seconds;
    return Math.round(((total - this.remaining()) / total) * 100);
  }

  clock(): string {
    const total = Math.max(0, this.remaining());
    return `${String(Math.floor(total / 60)).padStart(2, '0')}:${String(total % 60).padStart(2, '0')}`;
  }

  isLast(): boolean {
    return this.index() === this.routine().exercises.length - 1;
  }

  next(): void {
    if (this.isLast()) {
      this.finish();
      return;
    }
    this.index.update((i) => i + 1);
    this.startExercise();
  }

  prev(): void {
    if (this.index() === 0) return;
    this.index.update((i) => i - 1);
    this.startExercise();
  }

  finish(): void {
    if (this.busy()) return;
    this.stopTimer();
    this.send(TELEMETRY_TYPE.FIN, undefined, () => {
      this.releaseVideo();
      this.phase.set('done');
    });
  }

  postpone(): void {
    if (this.postponed() >= this.maxPostponements()) {
      this.actionError.set('Alcanzaste el límite de aplazamientos para esta pausa.');
      return;
    }
    this.send(TELEMETRY_TYPE.APLAZAMIENTO, undefined, () => {
      this.postponed.update((n) => n + 1);
      this.exit();
    });
  }

  confirmCancel(): void {
    const reason = this.cancelReason.trim();
    if (reason.length < 3) {
      this.actionError.set('Cuéntanos brevemente el motivo (mínimo 3 caracteres).');
      return;
    }
    this.send(TELEMETRY_TYPE.CANCELACION, reason, () => this.exit());
  }

  exit(): void {
    this.router.navigate(['/app/pausas']);
  }

  private ensurePausa(routineId: number | null): Observable<PortalPause> {
    if (this.pausaParam) {
      const existing = this.pausas.recent().find((p) => p.id === this.pausaParam);
      if (existing) return of(existing);
    }
    return this.portal
      .registerPause({
        routineId,
        scheduledAt: this.slot ?? new Date().toISOString(),
        status: 'programada',
      })
      .pipe(switchMap((res) => of(res.pausa)));
  }

  private send(type: number, reason: string | undefined, done: () => void): void {
    if (!this.pausa) return;
    this.busy.set(true);
    this.actionError.set('');
    this.portal.sendEvent({ type, idPausa: this.pausa.id, idArea: this.pausa.idArea, reason }).subscribe({
      next: () => {
        this.busy.set(false);
        this.pausas.load();
        done();
      },
      error: (err) => {
        this.busy.set(false);
        this.actionError.set(apiError(err, 'No se pudo registrar la acción.'));
        if (type === TELEMETRY_TYPE.FIN) this.startTimer();
      },
    });
  }

  private startExercise(): void {
    this.remaining.set(this.current().seconds);
    this.loadVideo(this.current().videoId);
    this.startTimer();
  }

  private startTimer(): void {
    this.stopTimer();
    this.timer = setInterval(() => {
      if (this.remaining() <= 1) {
        this.remaining.set(0);
        this.next();
        return;
      }
      this.remaining.update((n) => n - 1);
    }, 1000);
  }

  private stopTimer(): void {
    if (this.timer) clearInterval(this.timer);
    this.timer = null;
  }

  private loadVideo(videoId: number | null): void {
    this.releaseVideo();
    if (!videoId) return;
    this.loadingVideo.set(true);
    this.portal.getVideoBlob(videoId).subscribe({
      next: (blob) => {
        this.releaseVideo();
        this.videoUrl.set(URL.createObjectURL(blob));
        this.loadingVideo.set(false);
      },
      error: () => this.loadingVideo.set(false),
    });
  }

  private releaseVideo(): void {
    const url = this.videoUrl();
    if (url) URL.revokeObjectURL(url);
    this.videoUrl.set(null);
  }
}
