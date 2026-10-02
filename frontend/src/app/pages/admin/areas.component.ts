import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { FormBuilder, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { Area, AreaCompliance } from '../../core/api.types';
import { AdminService } from '../../core/services/admin.service';
import { AnalyticsService } from '../../core/services/analytics.service';
import { DialogService } from '../../core/services/dialog.service';
import { apiError, downloadBlob } from '../../core/utils';

type AreaFilter = 'all' | 'assigned' | 'unassigned';

interface AreaCardMeta {
  total: number;
  rate: number | null;
  label: string;
}

@Component({
  selector: 'app-areas',
  imports: [FormsModule, ReactiveFormsModule],
  templateUrl: './areas.component.html',
  styleUrl: './areas.component.scss',
})
export class AreasComponent implements OnInit {
  private readonly admin = inject(AdminService);
  private readonly analytics = inject(AnalyticsService);
  private readonly fb = inject(FormBuilder);
  private readonly dialog = inject(DialogService);

  readonly areas = signal<Area[]>([]);
  readonly compliance = signal<AreaCompliance[]>([]);
  readonly loading = signal(false);
  readonly saving = signal(false);
  readonly error = signal('');
  readonly formError = signal('');
  readonly showForm = signal(false);
  readonly editingId = signal<number | null>(null);
  readonly query = signal('');
  readonly filter = signal<AreaFilter>('all');
  readonly statusFilter = signal<'all' | '1' | '0'>('all');

  readonly form = this.fb.nonNullable.group({
    name: ['', [Validators.required, Validators.minLength(3)]],
    description: [''],
    status: [1],
  });

  readonly activeCount = computed(() => this.areas().filter((a) => a.status === 1).length);

  readonly activeRate = computed(() => {
    const total = this.areas().length;
    return total === 0 ? 0 : Math.round((this.activeCount() / total) * 100);
  });

  readonly totalWorkers = computed(() => this.areas().reduce((acc, a) => acc + a.workerCount, 0));

  readonly tabs: { id: AreaFilter; label: string; count: () => number }[] = [
    { id: 'all', label: 'Todas las áreas', count: () => this.areas().length },
    { id: 'assigned', label: 'Con colaboradores', count: () => this.areas().filter((a) => a.workerCount > 0).length },
    { id: 'unassigned', label: 'Sin asignar', count: () => this.areas().filter((a) => a.workerCount === 0).length },
  ];

  readonly filtered = computed(() => {
    const q = this.query().trim().toLowerCase();
    const filter = this.filter();
    const status = this.statusFilter();
    return this.areas().filter((area) => {
      if (status !== 'all' && String(area.status) !== status) return false;
      const matchesFilter =
        filter === 'all' ? true : filter === 'assigned' ? area.workerCount > 0 : area.workerCount === 0;
      if (!matchesFilter) return false;
      if (!q) return true;
      return (
        area.name.toLowerCase().includes(q) ||
        (area.description ?? '').toLowerCase().includes(q) ||
        (area.responsibleName ?? '').toLowerCase().includes(q)
      );
    });
  });

  ngOnInit(): void {
    this.load();
    this.analytics.getAreas().subscribe({
      next: (rows) => this.compliance.set(rows),
      error: () => undefined,
    });
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

  setQuery(value: string): void {
    this.query.set(value);
  }

  resetFilters(): void {
    this.query.set('');
    this.filter.set('all');
    this.statusFilter.set('all');
  }

  /** Datos de cumplimiento (pausas registradas) del área indicada. */
  areaMeta(idArea: number): AreaCardMeta {
    const row = this.compliance().find((c) => c.idArea === idArea);
    if (!row || row.total === 0) return { total: 0, rate: null, label: 'Sin datos' };
    const rate = Math.round(row.complianceRate);
    return { total: row.total, rate, label: `${rate}%` };
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
    this.form.reset({ name: area.name, description: area.description ?? '', status: area.status });
    this.showForm.set(true);
  }

  save(): void {
    if (this.form.invalid) return;
    const raw = this.form.getRawValue();
    const payload = {
      name: raw.name.trim(),
      description: raw.description.trim(),
      status: Number(raw.status),
    };
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
      .confirm({
        title: 'Eliminar área',
        message: `¿Eliminar el área ${area.name}? Esta acción no se puede deshacer.`,
        danger: true,
        confirmLabel: 'Eliminar',
      })
      .subscribe((ok) => {
        if (!ok) return;
        this.admin.deleteArea(area.id).subscribe({
          next: () => this.load(),
          error: (err) => this.error.set(apiError(err, 'No se pudo eliminar el área.')),
        });
      });
  }

  exportCsv(): void {
    const rows = this.filtered();
    if (rows.length === 0) return;
    const header = ['ID', 'Área', 'Descripción', 'Responsable', 'Estado', 'Trabajadores', 'Cumplimiento'];
    const lines = rows.map((a) =>
      [
        a.id,
        `"${(a.name ?? '').replace(/"/g, '""')}"`,
        `"${(a.description ?? '').replace(/"/g, '""')}"`,
        `"${(a.responsibleName ?? '').replace(/"/g, '""')}"`,
        a.status === 1 ? 'Activa' : 'Inactiva',
        a.workerCount,
        this.areaMeta(a.id).label,
      ].join(','),
    );
    const csv = '\uFEFF' + [header.join(','), ...lines].join('\n');
    downloadBlob(new Blob([csv], { type: 'text/csv;charset=utf-8;' }), 'areas.csv');
  }
}