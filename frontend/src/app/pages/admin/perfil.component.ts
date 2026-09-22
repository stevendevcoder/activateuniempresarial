import { Component, inject } from '@angular/core';
import { AuthService } from '../../core/services/auth.service';
import { AvatarComponent } from '../../shared/avatar.component';
import { IconComponent } from '../../shared/icon.component';

@Component({
  selector: 'app-admin-perfil',
  imports: [AvatarComponent, IconComponent],
  template: `
    <section class="page">
      <header class="hero-navy"><h1>Mi perfil</h1></header>
      <div class="sheet">
        <article class="card person">
          <app-avatar [kind]="auth.user()?.avatar || 'admin'" [size]="64" />
          <div>
            <h2>{{ auth.user()?.name }}</h2>
            <p>{{ auth.user()?.email }}</p>
            <small>{{ auth.user()?.area }} · Administrador</small>
          </div>
        </article>
        <article class="card">
          Desde este perfil puedes ver el cumplimiento institucional, crear trabajadores y hacer seguimiento por área.
        </article>
        <button type="button" class="logout" (click)="auth.logout()">
          <app-icon name="logout" [size]="16" />
          Cerrar sesión
        </button>
      </div>
    </section>
  `,
  styles: `
    .person { display: flex; align-items: center; gap: 12px; }
    h2 { margin: 0 0 4px; }
    p, small { margin: 0; color: #64748b; font-size: 13px; }
    .logout { display: flex; justify-content: center; gap: 8px; border: 0; background: transparent; color: #e11d48; font-weight: 800; cursor: pointer; }
  `,
})
export class AdminPerfilComponent {
  readonly auth = inject(AuthService);
}
