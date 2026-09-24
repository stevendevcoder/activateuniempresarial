import { Injectable, computed, inject, signal } from '@angular/core';
import { Observable, catchError, map, of, tap } from 'rxjs';
import { ApiRoutine } from '../api.types';
import { Exercise, MascotPose, Routine } from '../models';
import { formatDuration } from '../utils';
import { PortalService } from './portal.service';

const POSE_TINT: Record<MascotPose, string> = {
  'arms-up': '#EEF2FF',
  eyes: '#FDECEC',
  breathe: '#ECFDF3',
  wave: '#EEF2FF',
  idle: '#FEF3C7',
};

const TIPS = [
  'Respira lentamente y mantén la espalda recta.',
  'Muévete solo hasta donde te sientas cómodo.',
  'Relaja los hombros y suelta la tensión del cuello.',
  'Mantén un ritmo suave, sin rebotes.',
];

/** Ejercicios guiados para pausas sin rutina asignada. */
export const FREE_PAUSE_EXERCISES: Exercise[] = [
  {
    id: 'libre-1',
    name: 'Estiramiento de brazos',
    instruction: 'Levanta lentamente ambos brazos y mantén la posición.',
    seconds: 30,
    pose: 'arms-up',
    tip: 'Mantén la postura y respira lentamente.',
    videoId: null,
  },
  {
    id: 'libre-2',
    name: 'Rotación de hombros',
    instruction: 'Haz círculos amplios hacia atrás con ambos hombros.',
    seconds: 30,
    pose: 'wave',
    tip: 'Suelta la tensión de la zona cervical y la espalda alta.',
    videoId: null,
  },
  {
    id: 'libre-3',
    name: 'Descanso visual',
    instruction: 'Mira un punto lejano y parpadea suavemente.',
    seconds: 20,
    pose: 'eyes',
    tip: 'Regla 20-20-20: cada 20 minutos, 20 segundos a lo lejos.',
    videoId: null,
  },
  {
    id: 'libre-4',
    name: 'Respiración profunda',
    instruction: 'Inhala en 4 segundos, sostén y exhala en 6.',
    seconds: 30,
    pose: 'breathe',
    tip: 'Una exhalación larga activa el sistema de calma.',
    videoId: null,
  },
];

export function poseForType(typeName: string | null): MascotPose {
  const name = (typeName ?? '').toLowerCase();
  if (name.includes('visual') || name.includes('ojo')) return 'eyes';
  if (name.includes('estir')) return 'arms-up';
  if (name.includes('respir')) return 'breathe';
  if (name.includes('cogn') || name.includes('mental')) return 'idle';
  return 'wave';
}

export function toRoutine(api: ApiRoutine): Routine {
  const pose = poseForType(api.routineTypeName);
  const videos = [...api.videos].sort((a, b) => a.position - b.position);
  return {
    id: api.id,
    name: api.name,
    description: api.description || 'Rutina de pausa activa',
    category: api.routineTypeName ?? 'General',
    duration: formatDuration(api.totalDurationSeconds),
    pose,
    tint: POSE_TINT[pose],
    exercises: videos.length
      ? videos.map((video, i) => ({
          id: `v-${video.id}`,
          name: video.videoTitle ?? `Ejercicio ${i + 1}`,
          instruction: 'Sigue el video y replica cada movimiento con calma.',
          seconds: video.videoDuration > 0 ? video.videoDuration : 60,
          pose,
          tip: TIPS[i % TIPS.length],
          videoId: video.idVideo,
        }))
      : FREE_PAUSE_EXERCISES,
  };
}

@Injectable({ providedIn: 'root' })
export class RutinasService {
  private readonly portal = inject(PortalService);

  readonly routines = signal<Routine[]>([]);
  readonly loading = signal(false);
  readonly error = signal('');

  readonly categories = computed(() => [...new Set(this.routines().map((r) => r.category))]);

  load(): void {
    this.loading.set(true);
    this.error.set('');
    this.portal.getRoutines().subscribe({
      next: (list) => {
        this.routines.set(list.filter((r) => r.status === 1).map(toRoutine));
        this.loading.set(false);
      },
      error: () => {
        this.error.set('No se pudieron cargar las rutinas.');
        this.loading.set(false);
      },
    });
  }

  byCategory(category: string): Routine[] {
    if (category === 'todas') return this.routines();
    return this.routines().filter((r) => r.category === category);
  }

  /** Obtiene una rutina (de la caché o del backend). */
  fetch(id: number): Observable<Routine | null> {
    const cached = this.routines().find((r) => r.id === id);
    if (cached) return of(cached);
    return this.portal.getRoutine(id).pipe(
      map(toRoutine),
      tap((routine) => this.routines.update((list) => (list.some((r) => r.id === id) ? list : [...list, routine]))),
      catchError(() => of(null)),
    );
  }
}
