import { Component, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { DayPause } from '../../core/models';
import { AuthService } from '../../core/services/auth.service';
import { PausasService } from '../../core/services/pausas.service';
import { IconComponent } from '../../shared/icon.component';
import { MascotComponent } from '../../shared/mascot.component';
import { ProgressRingComponent } from '../../shared/progress-ring.component';

@Component({
  selector: 'app-home',
  imports: [RouterLink, IconComponent, MascotComponent, ProgressRingComponent],
  templateUrl: './home.component.html',
  styleUrl: './home.component.scss',
})
export class HomeComponent {
  readonly auth = inject(AuthService);
  readonly pausas = inject(PausasService);

  nextTitle(next: DayPause): string {
    if (next.title === 'Pausa activa' && next.subtitle) {
      return next.subtitle.split('·')[0].trim();
    }
    return next.title;
  }

  hour(time: string): string {
    return time.replace(' a.m.', '').replace(' p.m.', '');
  }

  meridiem(time: string): string {
    return time.includes('p.m.') ? 'p.m.' : 'a.m.';
  }
}
