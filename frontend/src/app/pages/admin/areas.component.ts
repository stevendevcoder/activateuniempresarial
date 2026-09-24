import { Component, OnInit, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Area } from '../../core/api.types';
import { AdminService } from '../../core/services/admin.service';
import { DialogService } from '../../core/services/dialog.service';
import { apiError } from '../../core/utils';
import { IconComponent } from '../../shared/icon.component';

@Component({
  selector: 'app-areas',
  imports: [ReactiveFormsModule, IconComponent],
  template: `
    <section class="page">
      <header class="hero-navy">
        <div class="hero-row">
          <div>
            <h1>Áreas</h1>
            <p>Departamentos y facultades</p>
          </div>
          <button type="button" class="hero-btn" (click)="openCreate()" aria-label="Nueva área">
            <app-icon name="plus" [size]="20" />
          </button>
        </div>
      </header>

      <div class="page-body">
        @if (error()) {
          <p class="alert alert-error">{{ error() }}</p>
        }
        <div class="grid-cards three">
          @for (area of areas(); track area.id) {
            <article class="card">
              <div class="card-head">
                <span class="tile-icon"><app-icon name="building" [size]="20" /></span>
                <span class="chip chip-sm" [class]="area.status === 1 ? 'chip-ok' : 'chip-muted'">
                  {{ area.status === 1 ? 'Activa' : 'Inactiva' }}
                </span>
              </div>
              <h3>{{ area.name }}</h3>
              <p class="muted desc">{{ area.description || 'Sin descripción' }}</p>
              <div class="card-actions between">
                <small class="muted"><app-icon name="users" [size]="14" /> {{ area.workerCount }} trabajadores</small>
                <div>
                  <button type="button" class="icon-btn" (click)="openEdit(area)" title="Editar"><app-icon name="edit" [size]="16" /></button>
                  <button type="button" class="icon-btn danger" (click)="remove(area)" title="Eliminar"><app-icon name="trash" [size]="16" /></button>
                </div>
              </div>
            </article>
          } @empty {
            <p class="empty">{{ loading() ? 'Cargando áreas…' : 'No hay áreas registradas.' }}</p>
          }
        </div>
      </div>
    </section>

    @if (showForm()) {
      <div class="modal-backdrop" (click)="showForm.set(false)">
        <form class="modal" [formGroup]="form" (ngSubmit)="save()" (click)="$event.stopPropagation()">
          <div class="modal-head">
            <h2>{{ editingId() ? 'Editar área' : 'Nueva área' }}</h2>
            <button type="button" class="icon-btn" (click)="showForm.set(false)" aria-label="Cerrar"><app-icon name="x" [size]="18" /></button>
          </div>
          <div class="form-grid">
            <label class="form-field">
              <span>Nombre</span>
              <input class="input" formControlName="name" />
            </label>
            <label class="form-field">
              <span>Descripción</span>
              <textarea class="input" rows="3" formControlName="description"></textarea>
            </label>
            <label class="form-field">
              <span>Estado</span>
              <select class="input" formControlName="status">
                <option [value]="1">Activa</option>
                <option [value]="0">Inactiva</option>
              </select>
            </label>
            @if (formError()) {
              <p class="alert alert-error">{{ formError() }}</p>
            }
            <div class="form-actions">
              <button type="button" class="btn-outline" (click)="showForm.set(false)">Cancelar</button>
              <button type="submit" class="btn-pill" [disabled]="form.invalid || saving()">{{ saving() ? 'Guardando…' : 'Guardar' }}</button>
            </div>
          </div>
        </form>
      </div>
    }
  `,
  styles: `
    h3 { margin: 14px 0 4px; color: #0f172a; font-size: 16px; }
    .desc { min-height: 34px; margin: 0; font-size: 13px; }
    .between { justify-content: space-between; align-items: center; }
    small { display: inline-flex; align-items: center; gap: 4px; font-size: 12px; }
  `,
})
export class AreasComponent implements OnInit {
  private readonly admin = inject(AdminService);
  private readonly fb = inject(FormBuilder);
  private readonly dialog = inject(DialogService);

  readonly areas = signal<Area[]>([]);
  readonly loading = signal(false);
  readonly saving = signal(false);
  readonly error = signal('');
  readonly formError = signal('');
  readonly showForm = signal(false);
  readonly editingId = signal<number | null>(null);

  readonly form = this.fb.nonNullable.group({
    name: ['', [Validators.required, Validators.minLength(3)]],
    description: [''],
    status: [1, Validators.required],
  });

  ngOnInit(): void {
    this.load();
  }

  load(): void {
    this.loading.set(true);
    this.admin.getAreas().subscribe({
      next: (areas) => {
        this.areas.set(areas);
        this.loading.set(false);
      },
      error: (err) => {
        this.error.set(apiError(err, 'No se pudieron cargar las áreas.'));
        this.loading.set(false);
      },
    });
  }

  openCreate(): void {
    this.editingId.set(null);
    this.formError.set('');
    this.form.reset({ name: '', description: '', status: 1 });
    this.showForm.set(true);
  }

  openEdit(area: Area): void {
    this.editingId.set(area.id);
    this.formError.set('');
    this.form.reset({ name: area.name, description: area.description, status: area.status });
    this.showForm.set(true);
  }

  save(): void {
    if (this.form.invalid) return;
    const raw = this.form.getRawValue();
    const payload = { name: raw.name.trim(), description: raw.description.trim(), status: Number(raw.status) };
    const editing = this.editingId();
    this.saving.set(true);
    const request = editing ? this.admin.updateArea(editing, payload) : this.admin.createArea(payload);
    request.subscribe({
      next: () => {
        this.saving.set(false);
        this.showForm.set(false);
        this.load();
      },
      error: (err) => {
        this.saving.set(false);
        this.formError.set(apiError(err, 'No se pudo guardar el área.'));
      },
    });
  }

  remove(area: Area): void {
    this.dialog
      .confirm({ title: 'Eliminar área', message: `¿Eliminar el área ${area.name}?`, danger: true, confirmLabel: 'Eliminar' })
      .subscribe((ok) => {
        if (!ok) return;
        this.admin.deleteArea(area.id).subscribe({
          next: () => this.load(),
          error: (err) => this.error.set(apiError(err, 'No se pudo eliminar el área.')),
        });
      });
  }
}
