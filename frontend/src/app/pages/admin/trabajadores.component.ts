import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { AdminUser, Area, Role } from '../../core/api.types';
import { AdminService } from '../../core/services/admin.service';
import { DialogService } from '../../core/services/dialog.service';
import { apiError } from '../../core/utils';
import { AvatarComponent, avatarKind } from '../../shared/avatar.component';
import { IconComponent } from '../../shared/icon.component';

type StatusFilter = 'all' | 'active' | 'inactive';

@Component({
  selector: 'app-trabajadores',
  imports: [RouterLink, ReactiveFormsModule, AvatarComponent, IconComponent],
  template: `
    <section class="page">
      <header class="hero-navy">
        <div class="hero-row">
          <div>
            <h1>Trabajadores</h1>
            <p>Usuarios, roles y áreas</p>
          </div>
          <button type="button" class="hero-btn" (click)="openCreate()" aria-label="Nuevo usuario">
            <app-icon name="plus" [size]="20" />
          </button>
        </div>
        <div class="search search-hero">
          <app-icon name="search" [size]="16" />
          <input placeholder="Buscar por nombre o correo…" [value]="query()" (input)="query.set($any($event.target).value)" />
        </div>
      </header>

      <div class="page-body">
        <div class="filters">
          @for (tab of tabs; track tab.id) {
            <button type="button" [class.on]="filter() === tab.id" (click)="filter.set(tab.id)">
              {{ tab.label }} ({{ count(tab.id) }})
            </button>
          }
        </div>

        @if (error()) {
          <p class="alert alert-error">{{ error() }}</p>
        }

        <div class="grid-cards">
          @for (user of filtered(); track user.id) {
            <article class="card person" [class.off]="user.status !== 1">
              <div class="top">
                <app-avatar [kind]="kind(user)" [photo]="user.photo" [size]="48" />
                <div class="meta">
                  <h2>{{ user.name }}</h2>
                  <p>{{ user.email }}</p>
                  <div class="chips">
                    <span class="chip chip-sm" [class]="user.roleName === 'Administrador' ? 'chip-info' : 'chip-muted'">
                      {{ user.roleName ?? 'Sin rol' }}
                    </span>
                    <span class="chip chip-sm chip-muted">{{ user.areaName ?? 'Sin área' }}</span>
                    <span class="chip chip-sm" [class]="user.status === 1 ? 'chip-ok' : 'chip-warn'">
                      {{ user.status === 1 ? 'Activo' : 'Inactivo' }}
                    </span>
                  </div>
                </div>
              </div>
              <div class="card-actions">
                @if (user.roleName !== 'Administrador') {
                  <a class="icon-btn" [routerLink]="['/admin/seguimiento', user.id]" title="Ver seguimiento">
                    <app-icon name="eye" [size]="16" />
                  </a>
                }
                <button type="button" class="icon-btn" (click)="openEdit(user)" title="Editar">
                  <app-icon name="edit" [size]="16" />
                </button>
                @if (user.status === 1) {
                  <button type="button" class="icon-btn danger" (click)="deactivate(user)" title="Desactivar">
                    <app-icon name="power" [size]="16" />
                  </button>
                }
              </div>
            </article>
          } @empty {
            <p class="empty">{{ loading() ? 'Cargando usuarios…' : 'No hay usuarios para este filtro.' }}</p>
          }
        </div>
      </div>
    </section>

    @if (showForm()) {
      <div class="modal-backdrop" (click)="closeForm()">
        <form class="modal" [formGroup]="form" (ngSubmit)="save()" (click)="$event.stopPropagation()">
          <div class="modal-head">
            <h2>{{ editingId() ? 'Editar usuario' : 'Nuevo usuario' }}</h2>
            <button type="button" class="icon-btn" (click)="closeForm()" aria-label="Cerrar"><app-icon name="x" [size]="18" /></button>
          </div>
          <div class="form-grid">
            <label class="form-field">
              <span>Nombre</span>
              <input class="input" formControlName="name" placeholder="Nombre Apellido" />
            </label>
            <label class="form-field">
              <span>Correo</span>
              <input class="input" type="email" formControlName="email" placeholder="correo@uniempresarial.edu.co" />
            </label>
            <label class="form-field">
              <span>Contraseña {{ editingId() ? '(vacío = no cambiar)' : '' }}</span>
              <input class="input" type="password" formControlName="password" placeholder="Letras y números, mínimo 6" />
            </label>
            <div class="form-field-row">
              <label class="form-field">
                <span>Rol</span>
                <select class="input" formControlName="idRole">
                  @for (role of roles(); track role.id) {
                    <option [value]="role.id">{{ role.name }}</option>
                  }
                </select>
              </label>
              <label class="form-field">
                <span>Área</span>
                <select class="input" formControlName="idArea">
                  <option value="">Sin área</option>
                  @for (area of areas(); track area.id) {
                    <option [value]="area.id">{{ area.name }}</option>
                  }
                </select>
              </label>
            </div>
            <label class="form-field">
              <span>Estado</span>
              <select class="input" formControlName="status">
                <option [value]="1">Activo</option>
                <option [value]="0">Inactivo</option>
              </select>
            </label>
            @if (formError()) {
              <p class="alert alert-error">{{ formError() }}</p>
            }
            <div class="form-actions">
              <button type="button" class="btn-outline" (click)="closeForm()">Cancelar</button>
              <button type="submit" class="btn-pill" [disabled]="form.invalid || saving()">
                {{ saving() ? 'Guardando…' : 'Guardar' }}
              </button>
            </div>
          </div>
        </form>
      </div>
    }
  `,
  styles: `
    .person.off { opacity: 0.7; }
    .top { display: flex; gap: 12px; }
    .meta { flex: 1; min-width: 0; }
    h2 { margin: 0; color: #1b2f8a; font-size: 16px; }
    .meta p { margin: 2px 0 0; overflow: hidden; color: #64748b; font-size: 12px; text-overflow: ellipsis; white-space: nowrap; }
    .chips { display: flex; flex-wrap: wrap; gap: 6px; margin-top: 10px; }
  `,
})
export class TrabajadoresComponent implements OnInit {
  private readonly admin = inject(AdminService);
  private readonly fb = inject(FormBuilder);
  private readonly dialog = inject(DialogService);

  readonly users = signal<AdminUser[]>([]);
  readonly roles = signal<Role[]>([]);
  readonly areas = signal<Area[]>([]);
  readonly loading = signal(false);
  readonly saving = signal(false);
  readonly error = signal('');
  readonly formError = signal('');
  readonly showForm = signal(false);
  readonly editingId = signal<number | null>(null);
  readonly query = signal('');
  readonly filter = signal<StatusFilter>('active');

  readonly tabs: { id: StatusFilter; label: string }[] = [
    { id: 'active', label: 'Activos' },
    { id: 'inactive', label: 'Inactivos' },
    { id: 'all', label: 'Todos' },
  ];

  readonly filtered = computed(() => {
    const q = this.query().trim().toLowerCase();
    return this.users().filter((u) => {
      const matchesStatus = this.matchesStatus(u, this.filter());
      const matchesQuery = !q || u.name.toLowerCase().includes(q) || u.email.toLowerCase().includes(q);
      return matchesStatus && matchesQuery;
    });
  });

  readonly form = this.fb.nonNullable.group({
    name: ['', [Validators.required, Validators.minLength(3)]],
    email: ['', [Validators.required, Validators.email]],
    password: [''],
    idRole: [2, Validators.required],
    idArea: [''],
    status: [1, Validators.required],
  });

  ngOnInit(): void {
    this.load();
    this.admin.getRoles().subscribe({ next: (r) => this.roles.set(r), error: () => undefined });
    this.admin.getAreas().subscribe({ next: (a) => this.areas.set(a), error: () => undefined });
  }

  count(filter: StatusFilter): number {
    return this.users().filter((u) => this.matchesStatus(u, filter)).length;
  }

  kind(user: AdminUser): string {
    return avatarKind(user.id, user.roleName === 'Administrador');
  }

  load(): void {
    this.loading.set(true);
    this.admin.getUsers().subscribe({
      next: (users) => {
        this.users.set(users);
        this.loading.set(false);
      },
      error: (err) => {
        this.error.set(apiError(err, 'No se pudieron cargar los usuarios.'));
        this.loading.set(false);
      },
    });
  }

  openCreate(): void {
    const workerRole = this.roles().find((r) => r.name === 'Trabajador')?.id ?? 2;
    this.editingId.set(null);
    this.formError.set('');
    this.form.reset({ name: '', email: '', password: '', idRole: workerRole, idArea: '', status: 1 });
    this.showForm.set(true);
  }

  openEdit(user: AdminUser): void {
    this.editingId.set(user.id);
    this.formError.set('');
    this.form.reset({
      name: user.name,
      email: user.email,
      password: '',
      idRole: user.idRole ?? 2,
      idArea: user.idArea ? String(user.idArea) : '',
      status: user.status,
    });
    this.showForm.set(true);
  }

  closeForm(): void {
    this.showForm.set(false);
  }

  save(): void {
    if (this.form.invalid) return;
    const raw = this.form.getRawValue();
    const editing = this.editingId();

    if (!editing && raw.password.length < 6) {
      this.formError.set('La contraseña debe tener al menos 6 caracteres, con letras y números.');
      return;
    }

    const payload: Record<string, unknown> = {
      name: raw.name.trim(),
      email: raw.email.trim(),
      idRole: Number(raw.idRole),
      idArea: raw.idArea === '' ? null : Number(raw.idArea),
      status: Number(raw.status),
    };
    if (raw.password) payload['password'] = raw.password;

    this.saving.set(true);
    const request = editing ? this.admin.updateUser(editing, payload) : this.admin.createUser(payload);
    request.subscribe({
      next: () => {
        this.saving.set(false);
        this.closeForm();
        this.load();
      },
      error: (err) => {
        this.saving.set(false);
        this.formError.set(apiError(err, 'No se pudo guardar el usuario.'));
      },
    });
  }

  deactivate(user: AdminUser): void {
    this.dialog
      .confirm({ title: 'Desactivar usuario', message: `¿Desactivar a ${user.name}? No podrá iniciar sesión.`, danger: true, confirmLabel: 'Desactivar' })
      .subscribe((ok) => {
        if (!ok) return;
        this.admin.deleteUser(user.id).subscribe({
          next: () => this.load(),
          error: (err) => this.error.set(apiError(err, 'No se pudo desactivar el usuario.')),
        });
      });
  }

  private matchesStatus(user: AdminUser, filter: StatusFilter): boolean {
    if (filter === 'active') return user.status === 1;
    if (filter === 'inactive') return user.status !== 1;
    return true;
  }
}
