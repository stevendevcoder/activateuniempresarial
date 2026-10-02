import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { AdminUser } from '../../core/api.types';
import { AdminService } from '../../core/services/admin.service';
import { AnalyticsService } from '../../core/services/analytics.service';
import { AuthService } from '../../core/services/auth.service';
import { apiError, assetUrl, downloadBlob, isSameLocalDay } from '../../core/utils';

/** El backend limita la foto de perfil a 5 MB en JPG, PNG o WEBP. */
const MAX_PHOTO_BYTES = 5 * 1024 * 1024;
const PHOTO_ACCEPT = 'image/jpeg,image/png,image/webp';
/** Mismo mínimo que aplica el backend (joi: password.min(6)). */
const MIN_PASSWORD = 6;

@Component({
  selector: 'app-admin-perfil',
  imports: [FormsModule],
  templateUrl: './perfil.component.html',
  styleUrl: './perfil.component.scss',
})
export class AdminPerfilComponent implements OnInit {
  private readonly admin = inject(AdminService);
  private readonly analytics = inject(AnalyticsService);
  readonly auth = inject(AuthService);

  readonly users = signal<AdminUser[]>([]);
  readonly loading = signal(false);
  readonly savingName = signal(false);
  readonly savingPassword = signal(false);
  readonly uploading = signal(false);
  readonly exporting = signal(false);
  readonly message = signal('');
  readonly error = signal('');

  readonly photoAccept = PHOTO_ACCEPT;

  // ── Datos del perfil (solo el nombre es editable) ──
  readonly nameDraft = signal(this.auth.user()?.name ?? '');
  readonly currentPassword = signal('');
  readonly newPassword = signal('');
  readonly confirmPassword = signal('');
  /** Alterna la visibilidad de los campos de contraseña. */
  readonly showPasswords = signal(false);

  readonly user = computed(() => this.auth.user());
  readonly roleLabel = computed(() => this.user()?.roleName ?? 'Administrador');
  readonly photoUrl = computed(() => {
    const photo = this.user()?.photo;
    return photo ? assetUrl(photo) : null;
  });

  readonly nameValid = computed(() => this.nameDraft().trim().length >= 2);
  readonly nameDirty = computed(() => this.nameDraft().trim() !== (this.user()?.name ?? '').trim());

  // ── Contraseña ──
  /** Fuerza calculada sobre la contraseña nueva: longitud, mezcla de tipos y símbolos. */
  readonly passwordStrength = computed(() => {
    const value = this.newPassword();
    if (!value) return { score: 0, label: 'Sin definir', bar: 'w-0', fill: 'bg-slate-300', tone: 'text-slate-400' };
    let score = 0;
    if (value.length >= 8) score++;
    if (value.length >= 12) score++;
    if (/[a-z]/.test(value) && /[A-Z]/.test(value)) score++;
    if (/\d/.test(value)) score++;
    if (/[^A-Za-z0-9]/.test(value)) score++;
    const level = Math.min(4, score);
    if (level <= 1) return { score: level, label: 'Débil', bar: 'w-1/4', fill: 'bg-rose-500', tone: 'text-rose-600' };
    if (level === 2) return { score: level, label: 'Media', bar: 'w-2/4', fill: 'bg-amber-500', tone: 'text-amber-600' };
    if (level === 3) return { score: level, label: 'Buena', bar: 'w-3/4', fill: 'bg-brand-500', tone: 'text-brand-600' };
    return { score: level, label: 'Fuerte', bar: 'w-full', fill: 'bg-emerald-500', tone: 'text-emerald-600' };
  });

  readonly confirmMismatch = computed(() => this.confirmPassword().length > 0 && this.confirmPassword() !== this.newPassword());

  readonly passwordValid = computed(
    () =>
      this.currentPassword().length > 0 &&
      this.newPassword().length >= MIN_PASSWORD &&
      this.newPassword() === this.confirmPassword(),
  );

  // ── Contexto institucional ──
  readonly activeUsers = computed(() => this.users().filter((u) => u.status === 1).length);
  readonly permissions = computed(() => this.user()?.permissions ?? []);
  readonly fullAccess = computed(() => this.permissions().includes('*'));

  /** Inicio de la sesión actual, leído del claim iat del JWT. */
  readonly sessionLabel = computed(() => {
    const token = this.auth.getToken();
    if (!token) return 'Sesión actual';
    try {
      const base64 = (token.split('.')[1] ?? '').replace(/-/g, '+').replace(/_/g, '/');
      const payload = JSON.parse(atob(base64)) as { iat?: number };
      if (!payload.iat) return 'Sesión actual';
      const started = new Date(payload.iat * 1000);
      const time = `${String(started.getHours()).padStart(2, '0')}:${String(started.getMinutes()).padStart(2, '0')}`;
      return isSameLocalDay(started.toISOString(), new Date())
        ? `Hoy, ${time}`
        : `${started.getDate().toString().padStart(2, '0')}/${(started.getMonth() + 1).toString().padStart(2, '0')}, ${time}`;
    } catch {
      return 'Sesión actual';
    }
  });

  ngOnInit(): void {
    this.nameDraft.set(this.user()?.name ?? '');
    this.loadUsers();
  }

  private loadUsers(): void {
    this.loading.set(true);
    this.admin.getUsers().subscribe({
      next: (rows) => {
        this.users.set(rows);
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });
  }

  // ── Datos del perfil ──
  saveName(): void {
    const name = this.nameDraft().trim();
    if (name.length < 2) {
      this.error.set('El nombre debe tener al menos 2 caracteres.');
      return;
    }
    this.savingName.set(true);
    this.message.set('');
    this.error.set('');
    this.auth.updateProfile({ name }).subscribe({
      next: () => {
        this.savingName.set(false);
        this.nameDraft.set(this.user()?.name ?? name);
        this.message.set('Nombre actualizado correctamente.');
      },
      error: (err) => {
        this.savingName.set(false);
        this.error.set(apiError(err, 'No se pudo actualizar el nombre.'));
      },
    });
  }

  // ── Foto ──
  onPhoto(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    input.value = '';
    if (!file) return;
    if (file.size > MAX_PHOTO_BYTES) {
      this.error.set('La imagen supera el tamaño máximo de 5 MB.');
      return;
    }
    this.uploading.set(true);
    this.message.set('');
    this.error.set('');
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

  // ── Contraseña ──
  togglePasswords(): void {
    this.showPasswords.set(!this.showPasswords());
  }

  savePassword(): void {
    if (this.newPassword().length < MIN_PASSWORD) {
      this.error.set(`La nueva contraseña debe tener al menos ${MIN_PASSWORD} caracteres.`);
      return;
    }
    if (this.newPassword() !== this.confirmPassword()) {
      this.error.set('La nueva contraseña y su confirmación no coinciden.');
      return;
    }
    this.savingPassword.set(true);
    this.message.set('');
    this.error.set('');
    this.auth
      .updateProfile({ password: this.newPassword(), currentPassword: this.currentPassword() })
      .subscribe({
        next: () => {
          this.savingPassword.set(false);
          this.currentPassword.set('');
          this.newPassword.set('');
          this.confirmPassword.set('');
          this.message.set('Contraseña actualizada.');
        },
        error: (err) => {
          this.savingPassword.set(false);
          this.error.set(apiError(err, 'No se pudo actualizar la contraseña.'));
        },
      });
  }

  // ── Reportes institucionales ──
  exportPdf(): void {
    this.exporting.set(true);
    this.error.set('');
    this.analytics.exportPdf().subscribe({
      next: (blob) => {
        this.exporting.set(false);
        downloadBlob(blob, 'reporte-institucional.pdf');
      },
      error: (err) => {
        this.exporting.set(false);
        this.error.set(apiError(err, 'No se pudo generar el reporte.'));
      },
    });
  }

  exportXlsx(): void {
    this.exporting.set(true);
    this.error.set('');
    this.analytics.exportExcel().subscribe({
      next: (blob) => {
        this.exporting.set(false);
        downloadBlob(blob, 'reporte-institucional.xlsx');
      },
      error: (err) => {
        this.exporting.set(false);
        this.error.set(apiError(err, 'No se pudo generar el reporte.'));
      },
    });
  }

  logout(): void {
    this.auth.logout();
  }
}
