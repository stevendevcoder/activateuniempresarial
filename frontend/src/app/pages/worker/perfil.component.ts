import { Component, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Preferences } from '../../core/models';
import { AuthService } from '../../core/services/auth.service';
import { DialogService } from '../../core/services/dialog.service';
import { PausasService } from '../../core/services/pausas.service';
import { PortalService } from '../../core/services/portal.service';
import { apiError } from '../../core/utils';
import { AvatarComponent, avatarKind } from '../../shared/avatar.component';
import { IconComponent } from '../../shared/icon.component';

@Component({
  selector: 'app-perfil',
  imports: [FormsModule, AvatarComponent, IconComponent],
  templateUrl: './perfil.component.html',
  styleUrl: './perfil.component.scss',
})
export class PerfilComponent {
  readonly auth = inject(AuthService);
  readonly pausas = inject(PausasService);
  private readonly portal = inject(PortalService);
  private readonly dialog = inject(DialogService);

  readonly editing = signal(false);
  readonly changingPassword = signal(false);
  readonly saving = signal(false);
  readonly uploading = signal(false);
  readonly message = signal('');
  readonly error = signal('');
  readonly kind = computed(() => avatarKind(this.auth.user()?.id));

  nameDraft = this.auth.user()?.name ?? '';
  currentPassword = '';
  newPassword = '';

  readonly items: Array<{
    key: keyof Preferences;
    label: string;
    icon: string;
    on: string;
    off: string;
  }> = [
    { key: 'notifications', label: 'Notificaciones', icon: 'bell', on: 'Activadas', off: 'Desactivadas' },
    { key: 'dnd', label: 'Modo No Molestar', icon: 'moon', on: 'Activado', off: 'Desactivado' },
    { key: 'reminders', label: 'Recordatorios', icon: 'clock', on: 'Activados', off: 'Desactivados' },
    { key: 'visualRest', label: 'Descanso visual', icon: 'eye', on: 'Activado', off: 'Desactivado' },
  ];

  toggleEdit(): void {
    if (!this.editing()) {
      this.nameDraft = this.auth.user()?.name ?? '';
      this.editing.set(true);
      return;
    }
    const name = this.nameDraft.trim();
    if (name.length < 2 || name === this.auth.user()?.name) {
      this.editing.set(false);
      return;
    }
    this.run(this.auth.updateProfile({ name }), 'Perfil actualizado.', () => this.editing.set(false));
  }

  savePassword(): void {
    if (this.newPassword.length < 6) {
      this.error.set('La nueva contraseña debe tener al menos 6 caracteres.');
      return;
    }
    this.run(
      this.auth.updateProfile({ password: this.newPassword, currentPassword: this.currentPassword }),
      'Contraseña actualizada.',
      () => {
        this.changingPassword.set(false);
        this.currentPassword = '';
        this.newPassword = '';
      },
    );
  }

  onPhoto(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    input.value = '';
    if (!file) return;
    this.uploading.set(true);
    this.auth.uploadPhoto(file).subscribe({
      next: () => {
        this.uploading.set(false);
        this.message.set('Foto de perfil actualizada.');
      },
      error: (err) => {
        this.uploading.set(false);
        this.error.set(apiError(err, 'No se pudo subir la foto.'));
      },
    });
  }

  acceptConsent(): void {
    this.portal.acceptConsent().subscribe({
      next: () => {
        this.message.set('Consentimiento registrado. ¡Gracias!');
        this.pausas.load();
      },
      error: (err) => this.error.set(apiError(err, 'No se pudo registrar el consentimiento.')),
    });
  }

  revokeConsent(): void {
    this.dialog
      .confirm({
        title: 'Revocar consentimiento',
        message: '¿Revocar tu consentimiento informado? Es posible que no puedas registrar nuevas pausas.',
        danger: true,
        confirmLabel: 'Revocar',
      })
      .subscribe((ok) => {
        if (!ok) return;
        this.portal.revokeConsent().subscribe({
          next: () => {
            this.message.set('Consentimiento revocado.');
            this.pausas.load();
          },
          error: (err) => this.error.set(apiError(err, 'No se pudo revocar el consentimiento.')),
        });
      });
  }

  requestDeletion(): void {
    this.dialog
      .confirm({
        title: 'Eliminar mis datos',
        message: 'Esta acción anonimiza tu información personal y cierra tu sesión. No se puede deshacer.',
        danger: true,
        confirmLabel: 'Eliminar',
      })
      .subscribe((ok) => {
        if (!ok) return;
        this.portal.requestDataDeletion().subscribe({
          next: () =>
            this.dialog
              .alert({ title: 'Datos eliminados', message: 'Tus datos personales fueron eliminados. Se cerrará la sesión.' })
              .subscribe(() => this.auth.logout()),
          error: (err) => this.error.set(apiError(err, 'No se pudo procesar la eliminación de datos.')),
        });
      });
  }

  private run(request: ReturnType<AuthService['updateProfile']>, ok: string, done: () => void): void {
    this.saving.set(true);
    this.message.set('');
    this.error.set('');
    request.subscribe({
      next: () => {
        this.saving.set(false);
        this.message.set(ok);
        done();
      },
      error: (err) => {
        this.saving.set(false);
        this.error.set(apiError(err, 'No se pudo guardar el cambio.'));
      },
    });
  }
}
