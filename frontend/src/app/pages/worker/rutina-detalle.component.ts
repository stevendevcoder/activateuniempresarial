import { Component, OnInit, inject, signal } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { Routine } from '../../core/models';
import { RutinasService } from '../../core/services/rutinas.service';
import { formatDuration } from '../../core/utils';

import { MascotComponent } from '../../shared/mascot.component';

@Component({
  selector: 'app-rutina-detalle',
  imports: [RouterLink, MascotComponent],
  templateUrl: './rutina-detalle.component.html',
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