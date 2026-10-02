import { Component, OnInit, inject, signal } from '@angular/core';
import { AbstractControl, FormBuilder, ReactiveFormsModule, ValidationErrors, Validators } from '@angular/forms';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { finalize } from 'rxjs';
import { AuthService } from '../../core/services/auth.service';
import { apiError } from '../../core/utils';
import { PasswordLayoutComponent } from './password-layout.component';

/** Misma regla que el backend: mínimo 6 caracteres, solo letras y números, con al menos uno de cada. */
const PASSWORD_PATTERN = /^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d]{6,}$/;

function matchPasswords(group: AbstractControl): ValidationErrors | null {
  const { password, confirm } = group.value as { password: string; confirm: string };
  return confirm && password !== confirm ? { mismatch: true } : null;
}

type ViewState = 'checking' | 'invalid' | 'form' | 'done';

@Component({
  selector: 'app-reset-password',
  imports: [ReactiveFormsModule, RouterLink, PasswordLayoutComponent],
  template: `
    <app-password-layout title="Crea una nueva contraseña" [subtitle]="subtitle()">
      @switch (state()) {
        @case ('checking') {
          <p class="text-sm text-slate-500 animate-pulse">Verificando el enlace…</p>
        }
        @case ('invalid') {
          <div class="rounded-2xl bg-amber-50 border border-amber-200 p-5">
            <p class="text-sm font-bold text-slate-900">El enlace no es válido o ya expiró</p>
            <p class="text-xs text-slate-600 mt-1.5 leading-relaxed">
              Los enlaces de recuperación duran 30 minutos y solo se pueden usar una vez. Solicita uno nuevo.
            </p>
            <a routerLink="/recuperar"
              class="mt-4 inline-flex items-center justify-center w-full py-3 rounded-xl bg-brand-800 hover:bg-brand-900 text-white text-sm font-semibold transition">
              Solicitar un nuevo enlace
            </a>
          </div>
        }
        @case ('done') {
          <div class="rounded-2xl bg-emerald-50 border border-emerald-200 p-5 text-center">
            <p class="text-sm font-bold text-slate-900">¡Contraseña actualizada!</p>
            <p class="text-xs text-slate-600 mt-1.5">Ya puedes iniciar sesión con tu nueva contraseña.</p>
            <a routerLink="/login"
              class="mt-4 inline-flex items-center justify-center w-full py-3 rounded-xl bg-brand-800 hover:bg-brand-900 text-white text-sm font-semibold transition">
              Ir a iniciar sesión
            </a>
          </div>
        }
        @default {
          @if (error()) {
            <p class="mb-5 px-4 py-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-sm font-semibold">{{ error() }}</p>
          }
          <form [formGroup]="form" (ngSubmit)="submit()" novalidate class="space-y-5">
            <label class="block">
              <span class="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-2">Nueva contraseña</span>
              <div class="relative">
                <input [type]="show() ? 'text' : 'password'" formControlName="password" autocomplete="new-password"
                  placeholder="••••••••"
                  class="block w-full pl-4 pr-12 py-3 min-h-12 text-sm font-mono tracking-widest bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:border-brand-800 focus:ring-brand-800/20 transition" />
                <button type="button" (click)="show.set(!show())" [attr.aria-label]="show() ? 'Ocultar contraseña' : 'Mostrar contraseña'"
                  class="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-slate-600">
                  <svg class="h-5 w-5" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
                    <path d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" stroke-linecap="round" stroke-linejoin="round"></path>
                    <path d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" stroke-linecap="round" stroke-linejoin="round"></path>
                  </svg>
                </button>
              </div>
              <span class="block text-[11px] mt-1.5 pl-1"
                [class]="form.controls.password.touched && form.controls.password.invalid ? 'text-rose-600 font-medium' : 'text-slate-400'">
                Mínimo 6 caracteres, con letras y números (sin espacios ni símbolos).
              </span>
            </label>

            <label class="block">
              <span class="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-2">Confirmar contraseña</span>
              <input [type]="show() ? 'text' : 'password'" formControlName="confirm" autocomplete="new-password"
                placeholder="••••••••"
                class="block w-full px-4 py-3 min-h-12 text-sm font-mono tracking-widest bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:border-brand-800 focus:ring-brand-800/20 transition" />
              @if (form.controls.confirm.touched && form.hasError('mismatch')) {
                <span class="block text-[11px] text-rose-600 font-medium mt-1.5 pl-1">Las contraseñas no coinciden.</span>
              }
            </label>

            <button type="submit" [disabled]="loading()"
              class="w-full py-3.5 px-6 min-h-12 rounded-xl bg-brand-800 hover:bg-brand-900 disabled:opacity-60 text-white font-semibold text-sm shadow-lg shadow-brand-900/25 transition-all">
              {{ loading() ? 'Guardando…' : 'Guardar nueva contraseña' }}
            </button>
          </form>
        }
      }
    </app-password-layout>
  `,
})
export class ResetPasswordComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly auth = inject(AuthService);
  private readonly route = inject(ActivatedRoute);

  private readonly token = this.route.snapshot.queryParamMap.get('token') ?? '';

  readonly state = signal<ViewState>('checking');
  readonly loading = signal(false);
  readonly error = signal('');
  readonly show = signal(false);

  readonly form = this.fb.nonNullable.group(
    {
      password: ['', [Validators.required, Validators.pattern(PASSWORD_PATTERN)]],
      confirm: ['', Validators.required],
    },
    { validators: matchPasswords },
  );

  subtitle(): string {
    return this.state() === 'form' ? 'Elige una contraseña que no hayas usado antes.' : '';
  }

  ngOnInit(): void {
    if (!this.token) {
      this.state.set('invalid');
      return;
    }
    this.auth.validateResetToken(this.token).subscribe({
      next: () => this.state.set('form'),
      error: () => this.state.set('invalid'),
    });
  }

  submit(): void {
    if (this.form.invalid || this.loading()) {
      this.form.markAllAsTouched();
      return;
    }
    this.loading.set(true);
    this.error.set('');
    this.auth
      .resetPassword(this.token, this.form.controls.password.value)
      .pipe(finalize(() => this.loading.set(false)))
      .subscribe({
        next: () => this.state.set('done'),
        error: (err) => {
          const message = apiError(err, 'No se pudo actualizar la contraseña.');
          if (message.includes('expiró')) this.state.set('invalid');
          else this.error.set(message);
        },
      });
  }
}
