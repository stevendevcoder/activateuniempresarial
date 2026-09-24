import { Component, OnInit, inject, signal } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { Routine } from '../../core/models';
import { RutinasService } from '../../core/services/rutinas.service';
import { formatDuration } from '../../core/utils';
import { IconComponent } from '../../shared/icon.component';
import { MascotComponent } from '../../shared/mascot.component';

@Component({
  selector: 'app-rutina-detalle',
  imports: [RouterLink, IconComponent, MascotComponent],
  template: `
    @if (routine(); as routine) {
      <section class="page">
        <header class="hero-navy">
          <a routerLink="/app/rutinas" class="back"><app-icon name="arrow-left" [size]="20" /></a>
          <h1>{{ routine.name }}</h1>
          <p>{{ routine.description }}</p>
        </header>
        <div class="sheet">
          <article class="card center">
            <div class="mascot"><app-mascot [pose]="routine.pose" /></div>
            <p>{{ routine.exercises.length }} ejercicios · {{ routine.duration }} · {{ routine.category }}</p>
            <a class="btn-pill" [routerLink]="['/app/pausas/ejecutar', routine.id]">
              <app-icon name="play" [size]="16" />
              Iniciar rutina
            </a>
          </article>
          @for (exercise of routine.exercises; track exercise.id; let i = $index) {
            <article class="card">
              <small>Ejercicio {{ i + 1 }} @if (exercise.videoId) { · <app-icon name="film" [size]="12" /> Video }</small>
              <h2>{{ exercise.name }}</h2>
              <p>{{ exercise.instruction }}</p>
              <em>{{ duration(exercise.seconds) }}</em>
            </article>
          }
        </div>
      </section>
    } @else {
      <section class="page">
        <header class="hero-navy">
          <a routerLink="/app/rutinas" class="back"><app-icon name="arrow-left" [size]="20" /></a>
          <h1>Rutina</h1>
        </header>
        <div class="sheet">
          <article class="card center">
            <p>{{ loading() ? 'Cargando rutina…' : 'No encontramos esta rutina.' }}</p>
          </article>
        </div>
      </section>
    }
  `,
  styles: `
    .back { color: #fff; display: inline-grid; margin-bottom: 8px; }
    .center { text-align: center; }
    .mascot { width: 128px; height: 144px; margin: 0 auto 8px; }
    h2 { margin: 4px 0; }
    p, small, em { color: #64748b; font-style: normal; }
    small { display: inline-flex; align-items: center; gap: 4px; }
    em { color: #1b2f8a; font-size: 12px; font-weight: 700; }
  `,
})
export class RutinaDetalleComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly rutinas = inject(RutinasService);
  readonly routine = signal<Routine | null>(null);
  readonly loading = signal(true);

  ngOnInit(): void {
    const id = Number(this.route.snapshot.paramMap.get('id'));
    this.rutinas.fetch(id).subscribe((routine) => {
      this.routine.set(routine);
      this.loading.set(false);
    });
  }

  duration(seconds: number): string {
    return formatDuration(seconds);
  }
}
