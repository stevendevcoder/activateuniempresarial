import { Component, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { RutinasService } from '../../core/services/rutinas.service';
import { IconComponent } from '../../shared/icon.component';
import { MascotComponent } from '../../shared/mascot.component';

@Component({
  selector: 'app-rutinas',
  imports: [RouterLink, IconComponent, MascotComponent],
  templateUrl: './rutinas.component.html',
  styleUrl: './rutinas.component.scss',
})
export class RutinasComponent {
  readonly rutinas = inject(RutinasService);
  readonly filter = signal('todas');
  readonly categories = [
    { id: 'todas', label: 'Todas' },
    { id: 'estiramiento', label: 'Estiramiento' },
    { id: 'visual', label: 'Visual' },
    { id: 'respiracion', label: 'Respiración' },
  ];
}
