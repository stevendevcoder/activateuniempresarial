import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../core/services/auth.service';
import { apiError } from '../../core/utils';
import { AvatarComponent } from '../../shared/avatar.component';
import { IconComponent } from '../../shared/icon.component';

@Component({
  selector: 'app-admin-perfil',
  imports: [FormsModule, AvatarComponent, IconComponent],
  template: `
    <section class="page">
      <header class="hero-navy"><h1>Mi perfil</h1></header>
      <div class="sheet">
        @if (message()) {
          <p class="alert alert-ok">{{ message() }}</p>
        }
        @if (error()) {
          <p class="alert alert-error">{{ error() }}</p>
        }
        <article class="card person">
          <app-avatar kind="admin" [photo]="auth.user()?.photo" [size]="64" />
          <div>
            <h2>{{ auth.user()?.name }}</h2>
            <p>{{ auth.user()?.email }}</p>
            <small>{{ auth.user()?.area }} · {{ auth.user()?.roleName }}</small>
          </div>
        </article>
        <article class="card">
          Desde este panel gestionas trabajadores, áreas, rutinas y cronogramas, y haces seguimiento al cumplimiento institucional.
        </article>
        <article class="card form-grid">
          <p class="label">Cambiar contraseña</p>
          <label class="form-field">
            <span>Contraseña actual</span>
            <input class="input" type="password" [(ngModel)]="currentPassword" autocomplete="current-password" />
          </label>
          <label class="form-field">
            <span>Nueva contraseña</span>
            <input class="input" type="password" [(ngModel)]="newPassword" autocomplete="new-password" placeholder="Mínimo 6 caracteres" />
          </label>
          <div class="form-actions">
            <button type="button" class="btn-pill" (click)="savePassword()" [disabled]="saving() || !currentPassword || !newPassword">
              {{ saving() ? 'Guardando…' : 'Actualizar' }}
            </button>
          </div>
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
    .label { margin: 0; font-size: 11px; font-weight: 800; letter-spacing: 0.16em; text-transform: uppercase; }
    .logout { display: flex; justify-content: center; gap: 8px; border: 0; background: transparent; color: #e11d48; font-weight: 800; cursor: pointer; }
    @media (min-width: 900px) { .sheet { max-width: 720px; } }
  `,
})
export class AdminPerfilComponent {
  readonly auth = inject(AuthService);
  readonly saving = signal(false);
  readonly message = signal('');
  readonly error = signal('');
  currentPassword = '';
  newPassword = '';

  savePassword(): void {
    if (this.newPassword.length < 6) {
      this.error.set('La nueva contraseña debe tener al menos 6 caracteres.');
      return;
    }
    this.saving.set(true);
    this.message.set('');
    this.error.set('');
    this.auth.updateProfile({ password: this.newPassword, currentPassword: this.currentPassword }).subscribe({
      next: () => {
        this.saving.set(false);
        this.message.set('Contraseña actualizada.');
        this.currentPassword = '';
        this.newPassword = '';
      },
      error: (err) => {
        this.saving.set(false);
        this.error.set(apiError(err, 'No se pudo actualizar la contraseña.'));
      },
    });
  }
}
