import { Component, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { RutinasService } from '../../core/services/rutinas.service';

import { MascotComponent } from '../../shared/mascot.component';

@Component({
  selector: 'app-rutinas',
  imports: [RouterLink, MascotComponent],
  templateUrl: './rutinas.component.html',
})
export class RutinasComponent {
  readonly rutinas = inject(RutinasService);
  readonly filter = signal('todas');
}