import { Component, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { finalize } from 'rxjs';
import {
  LucideAngularModule,
  Mail as MailIcon,
  Lock as LockIcon,
  Eye as EyeIcon,
  EyeOff as EyeOffIcon,
  ShieldCheck,
  Shield,
  Flame,
  Check,
  CheckCircle2,
  HelpCircle,
  Info,
  ArrowRight,
} from 'lucide-angular';
import { AuthService } from '../auth.service';

@Component({
  selector: 'app-login',
  imports: [
    ReactiveFormsModule,
    LucideAngularModule,
  ],
  templateUrl: './login.component.html',
  styleUrl: './login.component.scss',
})
export class LoginComponent {
  private readonly fb = inject(FormBuilder);
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);

  readonly ic = {
    Mail: MailIcon,
    Lock: LockIcon,
    Eye: EyeIcon,
    EyeOff: EyeOffIcon,
    ShieldCheck,
    Shield,
    Flame,
    Check,
    CheckCircle2,
    HelpCircle,
    Info,
    ArrowRight,
  };

  form = this.fb.nonNullable.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, Validators.minLength(6)]],
    remember: [true],
  });

  hidePassword = true;
  loading = false;
  errorMessage = '';

  get emailControl() {
    return this.form.controls.email;
  }

  get passwordControl() {
    return this.form.controls.password;
  }

  get emailValid(): boolean {
    return this.emailControl.valid;
  }

  togglePassword(): void {
    this.hidePassword = !this.hidePassword;
  }

  onSubmit(): void {
    if (this.form.invalid || this.loading) return;

    this.errorMessage = '';
    this.loading = true;
    const { email, password } = this.form.getRawValue();

    this.auth
      .login(email, password)
      .pipe(finalize(() => (this.loading = false)))
      .subscribe({
        next: () => this.router.navigate([this.auth.isAdmin() ? '/admin' : '/portal']),
        error: (err) => {
          const status = err?.status as number | undefined;
          this.errorMessage =
            status === 401
              ? 'Credenciales inválidas. Verifica tu correo y contraseña.'
              : 'No se pudo conectar con el servidor. Inténtalo de nuevo.';
        },
      });
  }
}