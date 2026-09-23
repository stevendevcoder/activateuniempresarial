import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { LucideAngularModule, Plus, Pencil, Power, X, Users as UsersIcon, Search } from 'lucide-angular';
import { AdminService } from '../admin.service';
import { AdminUser, Area, Role } from '../admin.types';
import { DialogService } from '../../shared/dialog/dialog.service';

@Component({
  selector: 'app-users',
  imports: [CommonModule, ReactiveFormsModule, LucideAngularModule],
  template: `
    <div class="space-y-5">
      <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div class="flex items-center gap-3">
          <div class="w-11 h-11 rounded-2xl bg-brand-blue flex items-center justify-center text-white shadow-md">
            <lucide-angular [img]="ic.Users" class="w-6 h-6"></lucide-angular>
          </div>
          <div>
            <h1 class="text-xl font-extrabold text-brand-blue tracking-tight">Usuarios</h1>
            <p class="text-sm text-slate-500">Trabajadores y administradores</p>
          </div>
        </div>
        <button (click)="openCreate()"
                class="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-brand-blue text-white text-sm font-bold hover:bg-brand-blue-dark transition-colors shadow-sm">
          <lucide-angular [img]="ic.Plus" class="w-4 h-4"></lucide-angular>
          Nuevo usuario
        </button>
      </div>

      <div class="relative max-w-sm">
        <lucide-angular [img]="ic.Search" class="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2"></lucide-angular>
        <input [value]="query()" (input)="query.set($any($event.target).value)"
               placeholder="Buscar por nombre o correo…"
               class="w-full pl-9 pr-3 py-2.5 rounded-xl border border-slate-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-brand-blue" />
      </div>

      @if (error()) {
        <div class="p-3.5 rounded-xl bg-brand-soft-red border border-brand-red/20 text-xs text-brand-red font-medium">{{ error() }}</div>
      }

      <div class="rounded-2xl border border-brand-soft-blue bg-white shadow-sm overflow-hidden">
        <div class="overflow-x-auto">
          <table class="w-full text-sm">
            <thead>
              <tr class="border-b border-brand-soft-blue bg-brand-surface/50">
                <th class="text-left px-5 py-3 font-semibold text-slate-500">Nombre</th>
                <th class="text-left px-5 py-3 font-semibold text-slate-500">Correo</th>
                <th class="text-left px-5 py-3 font-semibold text-slate-500">Rol</th>
                <th class="text-left px-5 py-3 font-semibold text-slate-500">Área</th>
                <th class="text-center px-5 py-3 font-semibold text-slate-500">Estado</th>
                <th class="text-right px-5 py-3 font-semibold text-slate-500">Acciones</th>
              </tr>
            </thead>
            <tbody>
              @for (user of filtered(); track user.id) {
                <tr class="border-b border-brand-soft-blue/60 hover:bg-brand-surface/50 transition-colors">
                  <td class="px-5 py-3 font-semibold text-slate-800">{{ user.name }}</td>
                  <td class="px-5 py-3 text-slate-600">{{ user.email }}</td>
                  <td class="px-5 py-3">
                    <span class="inline-flex px-2 py-0.5 rounded-full text-xs font-bold"
                          [class]="user.roleName === 'Administrador' ? 'bg-brand-soft-blue text-brand-blue' : 'bg-slate-100 text-slate-600'">
                      {{ user.roleName ?? '—' }}
                    </span>
                  </td>
                  <td class="px-5 py-3 text-slate-600">{{ user.areaName ?? '—' }}</td>
                  <td class="px-5 py-3 text-center">
                    <span class="inline-flex px-2 py-0.5 rounded-full text-xs font-bold"
                          [class]="user.status === 1 ? 'bg-emerald-50 text-emerald-600' : 'bg-slate-100 text-slate-400'">
                      {{ user.status === 1 ? 'Activo' : 'Inactivo' }}
                    </span>
                  </td>
                  <td class="px-5 py-3">
                    <div class="flex items-center justify-end gap-1">
                      <button (click)="openEdit(user)" title="Editar"
                              class="p-2 rounded-lg text-slate-400 hover:text-brand-blue hover:bg-brand-soft-blue transition-colors">
                        <lucide-angular [img]="ic.Pencil" class="w-4 h-4"></lucide-angular>
                      </button>
                      @if (user.status === 1) {
                        <button (click)="deactivate(user)" title="Desactivar"
                                class="p-2 rounded-lg text-slate-400 hover:text-brand-red hover:bg-brand-soft-red transition-colors">
                          <lucide-angular [img]="ic.Power" class="w-4 h-4"></lucide-angular>
                        </button>
                      }
                    </div>
                  </td>
                </tr>
              } @empty {
                <tr>
                  <td colspan="6" class="px-5 py-10 text-center text-sm text-slate-400">
                    {{ loading() ? 'Cargando…' : 'No hay usuarios' }}
                  </td>
                </tr>
              }
            </tbody>
          </table>
        </div>
      </div>
    </div>

    @if (showForm()) {
      <div class="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div class="absolute inset-0 bg-black/50" (click)="closeForm()"></div>
        <div class="relative bg-white rounded-2xl shadow-2xl w-full max-w-lg p-6">
          <div class="flex items-center justify-between mb-5">
            <h2 class="text-lg font-extrabold text-brand-blue">{{ editingId() ? 'Editar usuario' : 'Nuevo usuario' }}</h2>
            <button (click)="closeForm()" class="p-2 rounded-lg text-slate-400 hover:bg-slate-100">
              <lucide-angular [img]="ic.X" class="w-5 h-5"></lucide-angular>
            </button>
          </div>

          <form [formGroup]="form" (ngSubmit)="save()" class="space-y-4">
            <div>
              <label class="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">Nombre</label>
              <input formControlName="name" class="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-brand-blue" />
            </div>
            <div>
              <label class="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">Correo</label>
              <input type="email" formControlName="email" class="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-brand-blue" />
            </div>
            <div>
              <label class="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                Contraseña {{ editingId() ? '(dejar vacío para no cambiar)' : '' }}
              </label>
              <input type="password" formControlName="password" class="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-brand-blue" />
            </div>
            <div class="grid grid-cols-2 gap-4">
              <div>
                <label class="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">Rol</label>
                <select formControlName="idRole" class="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-brand-blue">
                  @for (role of roles(); track role.id) {
                    <option [value]="role.id">{{ role.name }}</option>
                  }
                </select>
              </div>
              <div>
                <label class="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">Área</label>
                <select formControlName="idArea" class="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-brand-blue">
                  <option [value]="''">Sin área</option>
                  @for (area of areas(); track area.id) {
                    <option [value]="area.id">{{ area.name }}</option>
                  }
                </select>
              </div>
            </div>
            <div>
              <label class="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">Estado</label>
              <select formControlName="status" class="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-brand-blue">
                <option [value]="1">Activo</option>
                <option [value]="0">Inactivo</option>
              </select>
            </div>

            @if (formError()) {
              <p class="text-xs text-brand-red font-medium">{{ formError() }}</p>
            }

            <div class="flex justify-end gap-2 pt-2">
              <button type="button" (click)="closeForm()"
                      class="px-4 py-2.5 rounded-xl border border-slate-200 text-sm font-bold text-slate-600 hover:bg-slate-50">
                Cancelar
              </button>
              <button type="submit" [disabled]="form.invalid || saving()"
                      class="px-4 py-2.5 rounded-xl bg-brand-blue text-white text-sm font-bold hover:bg-brand-blue-dark disabled:opacity-60">
                {{ saving() ? 'Guardando…' : 'Guardar' }}
              </button>
            </div>
          </form>
        </div>
      </div>
    }
  `,
})
export class UsersComponent implements OnInit {
  private readonly admin = inject(AdminService);
  private readonly fb = inject(FormBuilder);
  private readonly dialog = inject(DialogService);

  readonly ic = { Users: UsersIcon, Plus, Pencil, Power, X, Search };
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

  filtered(): AdminUser[] {
    const q = this.query().trim().toLowerCase();
    if (!q) return this.users();
    return this.users().filter(
      (u) => u.name.toLowerCase().includes(q) || u.email.toLowerCase().includes(q)
    );
  }

  load(): void {
    this.loading.set(true);
    this.admin.getUsers().subscribe({
      next: (users) => {
        this.users.set(users);
        this.loading.set(false);
      },
      error: () => {
        this.error.set('No se pudieron cargar los usuarios.');
        this.loading.set(false);
      },
    });
  }

  openCreate(): void {
    this.editingId.set(null);
    this.formError.set('');
    this.form.reset({ name: '', email: '', password: '', idRole: 2, idArea: '', status: 1 });
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
      idArea: String(user.idArea ?? ''),
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
      this.formError.set('La contraseña debe tener al menos 6 caracteres.');
      return;
    }

    const payload: Record<string, unknown> = {
      name: raw.name,
      email: raw.email,
      idRole: Number(raw.idRole),
      idArea: raw.idArea === '' ? null : Number(raw.idArea),
      status: Number(raw.status),
    };
    if (raw.password) payload['password'] = raw.password;

    this.saving.set(true);
    const request = editing
      ? this.admin.updateUser(editing, payload)
      : this.admin.createUser(payload);

    request.subscribe({
      next: () => {
        this.saving.set(false);
        this.closeForm();
        this.load();
      },
      error: (err) => {
        this.saving.set(false);
        this.formError.set(err?.error?.error ?? 'No se pudo guardar el usuario.');
      },
    });
  }

  deactivate(user: AdminUser): void {
    this.dialog.confirm({
      title: 'Desactivar usuario',
      message: `¿Desactivar a ${user.name}?`,
      danger: true,
      confirmLabel: 'Desactivar',
    }).subscribe((ok) => {
      if (!ok) return;
      this.admin.deleteUser(user.id).subscribe({
        next: () => this.load(),
        error: () => this.error.set('No se pudo desactivar el usuario.'),
      });
    });
  }
}
