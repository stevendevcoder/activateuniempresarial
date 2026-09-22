import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Preferences } from '../../core/models';
import { AuthService } from '../../core/services/auth.service';
import { AvatarComponent } from '../../shared/avatar.component';
import { IconComponent } from '../../shared/icon.component';

@Component({
  selector: 'app-perfil',
  imports: [FormsModule, AvatarComponent, IconComponent],
  templateUrl: './perfil.component.html',
  styleUrl: './perfil.component.scss',
})
export class PerfilComponent {
  readonly auth = inject(AuthService);
  readonly editing = signal(false);
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

  toggleEdit(): void {
    if (this.editing()) {
      const name = this.nameDraft.trim();
      if (name.length >= 3) this.auth.updateProfile(name).subscribe();
    }
    this.editing.update((v) => !v);
  }
}
