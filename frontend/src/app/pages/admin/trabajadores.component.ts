import { Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { finalize } from 'rxjs';
import { UsersService } from '../../core/services/users.service';
import { AvatarComponent } from '../../shared/avatar.component';
import { IconComponent } from '../../shared/icon.component';

@Component({
  selector: 'app-trabajadores',
  imports: [RouterLink, ReactiveFormsModule, AvatarComponent, IconComponent],
  template: `
    <section class="page">
      <header class="hero-navy row">
        <div>
          <h1>Trabajadores</h1>
          <p>Gestión de usuarios del backend</p>
        </div>
        <button type="button" class="plus" (click)="showForm.set(!showForm())">
          <app-icon name="plus" [size]="20" />
        </button>
      </header>
      <div class="list">
        @if (showForm()) {
          <form class="card form" [formGroup]="form" (ngSubmit)="create()">
            <h2>Nuevo trabajador</h2>
            <input class="input" placeholder="Nombre Apellido" formControlName="name" />
            <input class="input" placeholder="correo@uniempresarial.edu.co" formControlName="email" />
            <input class="input" placeholder="Contraseña (letras y números)" formControlName="password" type="password" />
            @if (formError) { <p class="error">{{ formError }}</p> }
            <button class="btn-pill" [disabled]="form.invalid || saving">{{ saving ? 'Guardando…' : 'Crear usuario' }}</button>
          </form>
        }
        @for (worker of users.workers(); track worker.id) {
          <article class="card person">
            <app-avatar [kind]="worker.avatar" [size]="48" />
            <div>
              <h2>{{ worker.name }}</h2>
              <p>{{ worker.email }}</p>
              <small>{{ worker.area }}</small>
            </div>
            <a [routerLink]="['/admin/seguimiento', worker.id]">Ver</a>
          </article>
        }
      </div>
    </section>
  `,
  styles: `
    .row { display: flex; justify-content: space-between; align-items: flex-start; }
    .plus { width: 44px; height: 44px; border: 0; border-radius: 50%; background: rgba(255,255,255,.16); color: #fff; }
    .list { padding: 16px; display: grid; gap: 12px; }
    .form, .person { display: grid; gap: 10px; }
    .person { grid-template-columns: auto 1fr auto; align-items: center; }
    h2 { margin: 0; font-size: 16px; color: #1b2f8a; }
    p, small { margin: 2px 0 0; color: #64748b; font-size: 12px; }
    a { color: #1b2f8a; font-weight: 800; font-size: 12px; }
    .error { color: #e11d48; }
    @media (min-width: 900px) {
      .list { padding: 24px 40px; max-width: 980px; }
      .form { max-width: 520px; }
    }
  `,
})
export class TrabajadoresComponent {
  readonly users = inject(UsersService);
  private readonly fb = inject(FormBuilder);
  readonly showForm = signal(false);
  saving = false;
  formError = '';

  form = this.fb.nonNullable.group({
    name: ['', [Validators.required, Validators.minLength(3)]],
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, Validators.minLength(6)]],
  });

  create(): void {
    if (this.form.invalid || this.saving) return;
    this.saving = true;
    this.formError = '';
    this.users
      .createWorker(this.form.getRawValue())
      .pipe(finalize(() => (this.saving = false)))
      .subscribe({
        next: () => {
          this.form.reset();
          this.showForm.set(false);
          this.users.loadWorkers().subscribe();
        },
        error: (err) => {
          this.formError = err?.error?.error ?? 'No se pudo crear el usuario. Verifica que el backend esté activo.';
        },
      });
  }
}
