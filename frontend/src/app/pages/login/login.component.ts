import { HttpClient } from '@angular/common/http';
import { Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { finalize } from 'rxjs';
import { environment } from '../../../environments/environment';
import { AuthService } from '../../core/services/auth.service';
import { apiError } from '../../core/utils';

type ServiceStatus = 'checking' | 'online' | 'offline';

@Component({
  selector: 'app-login',
  imports: [ReactiveFormsModule, RouterLink],
  templateUrl: './login.component.html',
  styleUrl: './login.component.scss',
})
export class LoginComponent {
  private readonly fb = inject(FormBuilder);
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);
  private readonly http = inject(HttpClient);

  hidePassword = true;
  loading = false;
  errorMessage = '';

  /** Clases base de los campos: el mockup dependía del plugin "forms" de Tailwind. */
  readonly fieldBase =
    'block w-full pl-11 py-3 min-h-12 text-sm font-medium bg-slate-50 border rounded-xl focus:bg-white focus:outline-none focus:ring-2 transition duration-150 placeholder-slate-400';
  readonly fieldOk = 'border-slate-300 focus:border-brand-800 focus:ring-brand-800/20';
  readonly fieldBad = 'border-rose-300 text-rose-700 focus:border-rose-500 focus:ring-rose-500/20';

  readonly serviceStatus = signal<ServiceStatus>('checking');

  form = this.fb.nonNullable.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, Validators.minLength(6)]],
  });

  constructor() {
    this.checkService();
  }

  get emailInvalid(): boolean {
    const control = this.form.controls.email;
    return control.touched && control.invalid;
  }

  get passwordInvalid(): boolean {
    const control = this.form.controls.password;
    return control.touched && control.invalid;
  }

  togglePassword(): void {
    this.hidePassword = !this.hidePassword;
  }

  onSubmit(): void {
    if (this.form.invalid || this.loading) {
      this.form.markAllAsTouched();
      return;
    }
    this.loading = true;
    this.errorMessage = '';
    const { email, password } = this.form.getRawValue();

    this.auth
      .login(email, password)
      .pipe(finalize(() => (this.loading = false)))
      .subscribe({
        next: (user) => this.router.navigate([user.role === 'administrador' ? '/admin' : '/app']),
        error: (err) => {
          this.errorMessage =
            err?.status === 401
              ? 'Credenciales inválidas. Verifica tu correo y contraseña.'
              : err?.status === 429
                ? 'Demasiados intentos. Espera unos minutos antes de volver a intentar.'
                : apiError(err, 'No se pudo iniciar sesión. Inténtalo de nuevo.');
        },
      });
  }

  /** Estado real del backend: GET /api/health responde con el estado de la base de datos. */
  private checkService(): void {
    this.http.get<{ status: string; db: string }>(`${environment.apiUrl}/api/health`).subscribe({
      next: (res) => this.serviceStatus.set(res.status === 'ok' && res.db === 'connected' ? 'online' : 'offline'),
      error: () => this.serviceStatus.set('offline'),
    });
  }
}
