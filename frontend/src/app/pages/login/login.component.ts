import { Component, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { finalize } from 'rxjs';
import { AuthService } from '../../core/services/auth.service';
import { apiError } from '../../core/utils';
import { IconComponent } from '../../shared/icon.component';
import { LogoComponent } from '../../shared/logo.component';

@Component({
  selector: 'app-login',
  imports: [ReactiveFormsModule, IconComponent, LogoComponent],
  templateUrl: './login.component.html',
  styleUrl: './login.component.scss',
  host: { class: 'login-host' },
})
export class LoginComponent {
  private readonly fb = inject(FormBuilder);
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);

  hidePassword = true;
  loading = false;
  errorMessage = '';

  form = this.fb.nonNullable.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, Validators.minLength(6)]],
  });

  onSubmit(): void {
    if (this.form.invalid || this.loading) return;
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
}
