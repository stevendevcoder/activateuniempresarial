import { Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { finalize } from 'rxjs';
import { AuthService } from '../../core/services/auth.service';
import { apiError } from '../../core/utils';
import { PasswordLayoutComponent } from './password-layout.component';

@Component({
  selector: 'app-forgot-password',
  imports: [ReactiveFormsModule, PasswordLayoutComponent],
  template: `
    <app-password-layout
      title="¿Olvidaste tu contraseña?"
      subtitle="Escribe tu correo institucional y te enviaremos un enlace para crear una nueva contraseña."
    >
      @if (sentTo()) {
        <div class="rounded-2xl bg-emerald-50 border border-emerald-200 p-5 text-center">
          <span class="inline-grid place-items-center w-12 h-12 rounded-full bg-emerald-100 text-emerald-700 mb-3">
            <svg class="w-6 h-6" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
              <path d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" stroke-linecap="round" stroke-linejoin="round"></path>
            </svg>
          </span>
          <p class="text-sm font-bold text-slate-900">Revisa tu correo</p>
          <p class="text-xs text-slate-600 mt-1.5 leading-relaxed">
            Si <strong>{{ sentTo() }}</strong> está registrado, recibirás un enlace válido por 30 minutos.
            Revisa también la carpeta de spam.
          </p>
          <button type="button" (click)="sentTo.set('')"
            class="mt-4 text-xs font-semibold text-brand-800 hover:text-brand-950">Usar otro correo</button>
        </div>
      } @else {
        @if (error()) {
          <p class="mb-5 px-4 py-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-sm font-semibold">{{ error() }}</p>
        }
        <form [formGroup]="form" (ngSubmit)="submit()" novalidate class="space-y-5">
          <label class="block">
            <span class="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-2">Correo institucional</span>
            <input type="email" formControlName="email" autocomplete="username"
              placeholder="nombre.apellido&#64;uniempresarial.edu"
              class="block w-full px-4 py-3 min-h-12 text-sm font-medium bg-slate-50 border rounded-xl focus:bg-white focus:outline-none focus:ring-2 transition placeholder-slate-400"
              [class]="invalid() ? 'border-rose-300 focus:border-rose-500 focus:ring-rose-500/20' : 'border-slate-300 focus:border-brand-800 focus:ring-brand-800/20'" />
            @if (invalid()) {
              <span class="block text-[11px] text-rose-600 font-medium mt-1.5 pl-1">Ingresa un correo válido.</span>
            }
          </label>
          <button type="submit" [disabled]="loading()"
            class="w-full py-3.5 px-6 min-h-12 rounded-xl bg-brand-800 hover:bg-brand-900 disabled:opacity-60 text-white font-semibold text-sm shadow-lg shadow-brand-900/25 transition-all">
            {{ loading() ? 'Enviando…' : 'Enviar enlace de recuperación' }}
          </button>
        </form>
      }
    </app-password-layout>
  `,
})
export class ForgotPasswordComponent {
  private readonly fb = inject(FormBuilder);
  private readonly auth = inject(AuthService);

  readonly loading = signal(false);
  readonly error = signal('');
  readonly sentTo = signal('');

  readonly form = this.fb.nonNullable.group({
    email: ['', [Validators.required, Validators.email]],
  });

  invalid(): boolean {
    const control = this.form.controls.email;
    return control.touched && control.invalid;
  }

  submit(): void {
    if (this.form.invalid || this.loading()) {
      this.form.markAllAsTouched();
      return;
    }
    const email = this.form.controls.email.value.trim();
    this.loading.set(true);
    this.error.set('');
    this.auth
      .forgotPassword(email)
      .pipe(finalize(() => this.loading.set(false)))
      .subscribe({
        next: () => this.sentTo.set(email),
        error: (err) =>
          this.error.set(
            err?.status === 429
              ? 'Demasiadas solicitudes. Espera unos minutos antes de intentarlo de nuevo.'
              : apiError(err, 'No se pudo enviar el enlace. Inténtalo de nuevo.'),
          ),
      });
  }
}
