import { Component, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Preferences } from '../../core/models';
import { AuthService } from '../../core/services/auth.service';
import { PausasService } from '../../core/services/pausas.service';
import { ReminderService } from '../../core/services/reminder.service';
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
  private readonly reminders = inject(ReminderService);

  readonly editing = signal(false);
  readonly saving = signal(false);
  readonly uploading = signal(false);
  readonly message = signal('');
  readonly error = signal('');
  readonly kind = computed(() => avatarKind(this.auth.user()?.id));

  nameDraft = this.auth.user()?.name ?? '';

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

  async togglePref(key: keyof Preferences): Promise<void> {
    const next = !this.auth.preferences()[key];
    if (key === 'notifications' && next) {
      const granted = await this.reminders.requestPermission();
      if (!granted) {
        this.error.set('Tu navegador bloqueó las notificaciones. Actívalas en los permisos del sitio.');
        return;
      }
    }
    this.auth.setPreference(key, next);
  }

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
