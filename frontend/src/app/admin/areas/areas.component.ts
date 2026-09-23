import { Component, OnInit, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { LucideAngularModule, Plus, Pencil, Trash2, X, Building2 } from 'lucide-angular';
import { AdminService } from '../admin.service';
import { Area } from '../admin.types';
import { DialogService } from '../../shared/dialog/dialog.service';

@Component({
  selector: 'app-areas',
  imports: [ReactiveFormsModule, LucideAngularModule],
  template: `
    <div class="space-y-5">
      <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div class="flex items-center gap-3">
          <div class="w-11 h-11 rounded-2xl bg-brand-blue flex items-center justify-center text-white shadow-md">
            <lucide-angular [img]="ic.Building2" class="w-6 h-6"></lucide-angular>
          </div>
          <div>
            <h1 class="text-xl font-extrabold text-brand-blue tracking-tight">Áreas</h1>
            <p class="text-sm text-slate-500">Departamentos y facultades</p>
          </div>
        </div>
        <button (click)="openCreate()"
                class="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-brand-blue text-white text-sm font-bold hover:bg-brand-blue-dark transition-colors shadow-sm">
          <lucide-angular [img]="ic.Plus" class="w-4 h-4"></lucide-angular>
          Nueva área
        </button>
      </div>

      @if (error()) {
        <div class="p-3.5 rounded-xl bg-brand-soft-red border border-brand-red/20 text-xs text-brand-red font-medium">{{ error() }}</div>
      }

      <div class="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
        @for (area of areas(); track area.id) {
          <div class="rounded-2xl border border-brand-soft-blue bg-white p-5 shadow-sm">
            <div class="flex items-start justify-between mb-3">
              <div class="w-10 h-10 rounded-xl bg-brand-soft-blue flex items-center justify-center">
                <lucide-angular [img]="ic.Building2" class="w-5 h-5 text-brand-blue"></lucide-angular>
              </div>
              <span class="inline-flex px-2 py-0.5 rounded-full text-xs font-bold"
                    [class]="area.status === 1 ? 'bg-emerald-50 text-emerald-600' : 'bg-slate-100 text-slate-400'">
                {{ area.status === 1 ? 'Activa' : 'Inactiva' }}
              </span>
            </div>
            <h3 class="font-bold text-slate-800">{{ area.name }}</h3>
            <p class="text-xs text-slate-500 mt-1 min-h-8">{{ area.description || 'Sin descripción' }}</p>
            <div class="flex items-center justify-between mt-4 pt-3 border-t border-brand-soft-blue">
              <span class="text-xs text-slate-500">{{ area.workerCount }} trabajadores</span>
              <div class="flex gap-1">
                <button (click)="openEdit(area)" class="p-2 rounded-lg text-slate-400 hover:text-brand-blue hover:bg-brand-soft-blue transition-colors">
                  <lucide-angular [img]="ic.Pencil" class="w-4 h-4"></lucide-angular>
                </button>
                <button (click)="remove(area)" class="p-2 rounded-lg text-slate-400 hover:text-brand-red hover:bg-brand-soft-red transition-colors">
                  <lucide-angular [img]="ic.Trash2" class="w-4 h-4"></lucide-angular>
                </button>
              </div>
            </div>
          </div>
        } @empty {
          <p class="col-span-full text-center text-sm text-slate-400 py-10">
            {{ loading() ? 'Cargando…' : 'No hay áreas registradas' }}
          </p>
        }
      </div>
    </div>

    @if (showForm()) {
      <div class="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div class="absolute inset-0 bg-black/50" (click)="closeForm()"></div>
        <div class="relative bg-white rounded-2xl shadow-2xl w-full max-w-md p-6">
          <div class="flex items-center justify-between mb-5">
            <h2 class="text-lg font-extrabold text-brand-blue">{{ editingId() ? 'Editar área' : 'Nueva área' }}</h2>
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
              <label class="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">Descripción</label>
              <textarea formControlName="description" rows="3"
                        class="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-brand-blue"></textarea>
            </div>
            <div>
              <label class="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">Estado</label>
              <select formControlName="status" class="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-brand-blue">
                <option [value]="1">Activa</option>
                <option [value]="0">Inactiva</option>
              </select>
            </div>
            @if (formError()) {
              <p class="text-xs text-brand-red font-medium">{{ formError() }}</p>
            }
            <div class="flex justify-end gap-2 pt-2">
              <button type="button" (click)="closeForm()" class="px-4 py-2.5 rounded-xl border border-slate-200 text-sm font-bold text-slate-600 hover:bg-slate-50">Cancelar</button>
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
export class AreasComponent implements OnInit {
  private readonly admin = inject(AdminService);
  private readonly fb = inject(FormBuilder);
  private readonly dialog = inject(DialogService);

  readonly ic = { Building2, Plus, Pencil, Trash2, X };
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
      error: () => {
        this.error.set('No se pudieron cargar las áreas.');
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

  closeForm(): void {
    this.showForm.set(false);
  }

  save(): void {
    if (this.form.invalid) return;
    const raw = this.form.getRawValue();
    const payload = {
      name: raw.name,
      description: raw.description,
      status: Number(raw.status),
    };
    const editing = this.editingId();
    this.saving.set(true);

    const request = editing
      ? this.admin.updateArea(editing, payload)
      : this.admin.createArea(payload);

    request.subscribe({
      next: () => {
        this.saving.set(false);
        this.closeForm();
        this.load();
      },
      error: (err) => {
        this.saving.set(false);
        this.formError.set(err?.error?.error ?? 'No se pudo guardar el área.');
      },
    });
  }

  remove(area: Area): void {
    this.dialog.confirm({
      title: 'Eliminar área',
      message: `¿Eliminar el área ${area.name}?`,
      danger: true,
      confirmLabel: 'Eliminar',
    }).subscribe((ok) => {
      if (!ok) return;
      this.admin.deleteArea(area.id).subscribe({
        next: () => this.load(),
        error: () => this.error.set('No se pudo eliminar el área.'),
      });
    });
  }
}
