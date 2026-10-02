import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { AdminUser, Area, Role } from '../../core/api.types';
import { AdminService } from '../../core/services/admin.service';
import { DialogService } from '../../core/services/dialog.service';
import { apiError } from '../../core/utils';
import { avatarKind } from '../../shared/avatar.component';

type StatusFilter = 'all' | 'active' | 'inactive';

@Component({
  selector: 'app-trabajadores',
  imports: [ReactiveFormsModule],
  templateUrl: './trabajadores.component.html',
  styleUrl: './trabajadores.component.scss',
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
