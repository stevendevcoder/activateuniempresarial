import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { FormArray, FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ApiRoutine, RoutineType, VideoItem } from '../../core/api.types';
import { AdminService } from '../../core/services/admin.service';
import { DialogService } from '../../core/services/dialog.service';
import { apiError, downloadBlob, formatDuration } from '../../core/utils';

const THUMB_GRADIENTS = [
  'bg-gradient-to-tr from-sky-900 to-indigo-800',
  'bg-gradient-to-tr from-blue-900 to-teal-800',
  'bg-gradient-to-tr from-slate-900 to-indigo-950',
  'bg-gradient-to-tr from-blue-950 to-cyan-900',
];

const THUMB_ICONS = [
  'text-sky-200/20',
  'text-teal-200/20',
  'text-indigo-300/20',
  'text-cyan-200/20',
];

@Component({
  selector: 'app-rutinas-admin',
  imports: [ReactiveFormsModule],
  templateUrl: './rutinas-admin.component.html',
  styleUrl: './rutinas-admin.component.scss',
})
export class RutinasAdminComponent implements OnInit {
  private readonly admin = inject(AdminService);
  private readonly fb = inject(FormBuilder);
  private readonly dialog = inject(DialogService);

  readonly routines = signal<ApiRoutine[]>([]);
  readonly types = signal<RoutineType[]>([]);
  readonly videos = signal<VideoItem[]>([]);
  readonly loading = signal(false);
  readonly saving = signal(false);
  readonly uploading = signal(false);
  readonly error = signal('');
  readonly formError = signal('');
  readonly uploadError = signal('');
  readonly showForm = signal(false);
  readonly editingId = signal<number | null>(null);
  readonly query = signal('');
  readonly onlyActive = signal(false);
  readonly typeFilter = signal(0);

  readonly form = this.fb.nonNullable.group({
    name: ['', [Validators.required, Validators.minLength(3)]],
    description: [''],
    idRoutineType: [0, Validators.required],
    status: [1, Validators.required],
    videos: this.fb.array<ReturnType<RutinasAdminComponent['newVideoRow']>>([]),
  });

  get videoControls(): FormArray {
    return this.form.controls.videos;
  }

  readonly totalVideos = computed(() => this.videos().filter((v) => v.status === 1).length);

  readonly avgDuration = computed(() => {
    const list = this.routines();
    if (list.length === 0) return '—';
    const seconds = Math.round(list.reduce((acc, r) => acc + (r.totalDurationSeconds || 0), 0) / list.length);
    return formatDuration(seconds);
  });

  readonly filtered = computed(() => {
    const q = this.query().trim().toLowerCase();
    const typeId = this.typeFilter();
    const active = this.onlyActive();
    return this.routines().filter((r) => {
      if (typeId && r.idRoutineType !== typeId) return false;
      if (active && r.status !== 1) return false;
      if (!q) return true;
      return (
        r.name.toLowerCase().includes(q) ||
        (r.description ?? '').toLowerCase().includes(q) ||
        (r.routineTypeName ?? '').toLowerCase().includes(q)
      );
    });
  });

  ngOnInit(): void {
    this.load();
    this.admin.getRoutineTypes().subscribe({ next: (t) => this.types.set(t), error: () => undefined });
    this.loadVideos();
  }

  load(): void {
    this.loading.set(true);
    this.admin.getRoutines().subscribe({
      next: (routines) => {
        this.routines.set(routines);
        this.loading.set(false);
      },
      error: (err) => {
        this.error.set(apiError(err, 'No se pudieron cargar las rutinas.'));
        this.loading.set(false);
      },
    });
  }

  setQuery(value: string): void {
    this.query.set(value);
  }

  resetFilters(): void {
    this.query.set('');
    this.typeFilter.set(0);
    this.onlyActive.set(false);
  }

  countByType(idRoutineType: number): number {
    return this.routines().filter((r) => r.idRoutineType === idRoutineType).length;
  }

  duration(seconds: number): string {
    return formatDuration(seconds || 0);
  }

  thumbClass(idRoutineType: number): string {
    return THUMB_GRADIENTS[this.indexOfType(idRoutineType) % THUMB_GRADIENTS.length];
  }

  thumbIconClass(idRoutineType: number): string {
    return THUMB_ICONS[this.indexOfType(idRoutineType) % THUMB_ICONS.length];
  }

  addVideo(): void {
    const first = this.videos()[0];
    this.videoControls.push(this.newVideoRow(first?.id ?? 0, first?.durationSeconds || 60));
  }

  onVideoSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    input.value = '';
    if (!file) return;

    this.uploading.set(true);
    this.uploadError.set('');
    const title = file.name.replace(/\.[^.]+$/, '');
    this.admin.uploadVideo(file, { title, description: '', durationSeconds: 0, status: 1 }).subscribe({
      next: (res) => {
        this.uploading.set(false);
        this.loadVideos();
        const empty = this.videoControls.controls.find((c) => Number(c.get('idVideo')?.value) === 0);
        if (empty) empty.get('idVideo')?.setValue(res.videoId);
        else this.videoControls.push(this.newVideoRow(res.videoId, 60));
      },
      error: (err) => {
        this.uploading.set(false);
        this.uploadError.set(apiError(err, 'No se pudo subir el video.'));
      },
    });
  }

  openCreate(): void {
    this.editingId.set(null);
    this.formError.set('');
    this.videoControls.clear();
    const first = this.videos()[0];
    if (first) this.videoControls.push(this.newVideoRow(first.id, first.durationSeconds || 60));
    this.form.patchValue({
      name: '',
      description: '',
      idRoutineType: this.types()[0]?.id ?? 0,
      status: 1,
    });
    this.showForm.set(true);
  }

  openEdit(routine: ApiRoutine): void {
    this.editingId.set(routine.id);
    this.formError.set('');
    this.videoControls.clear();
    for (const video of [...routine.videos].sort((a, b) => a.position - b.position)) {
      this.videoControls.push(this.newVideoRow(video.idVideo, video.videoDuration));
    }
    this.form.patchValue({
      name: routine.name,
      description: routine.description ?? '',
      idRoutineType: routine.idRoutineType,
      status: routine.status,
    });
    this.showForm.set(true);
  }

  save(): void {
    if (this.form.invalid) return;
    const raw = this.form.getRawValue();
    const videos = raw.videos.map((v) => ({ idVideo: Number(v.idVideo), durationSeconds: Number(v.durationSeconds) }));
    if (videos.length === 0 || videos.some((v) => !v.idVideo)) {
      this.formError.set('La rutina debe tener al menos un video válido.');
      return;
    }

    const payload = {
      name: raw.name.trim(),
      description: raw.description.trim(),
      idRoutineType: Number(raw.idRoutineType),
      status: Number(raw.status),
      videos,
    };
    const editing = this.editingId();
    this.saving.set(true);
    const request = editing ? this.admin.updateRoutine(editing, payload) : this.admin.createRoutine(payload);
    request.subscribe({
      next: () => {
        this.saving.set(false);
        this.showForm.set(false);
        this.load();
      },
      error: (err) => {
        this.saving.set(false);
        this.formError.set(apiError(err, 'No se pudo guardar la rutina.'));
      },
    });
  }

  toggleStatus(routine: ApiRoutine): void {
    this.admin.setRoutineStatus(routine.id, routine.status === 1 ? 0 : 1).subscribe({
      next: () => this.load(),
      error: (err) => this.error.set(apiError(err, 'No se pudo cambiar el estado de la rutina.')),
    });
  }

  remove(routine: ApiRoutine): void {
    this.dialog
      .confirm({
        title: 'Eliminar rutina',
        message: `¿Eliminar la rutina ${routine.name}? Esta acción no se puede deshacer.`,
        danger: true,
        confirmLabel: 'Eliminar',
      })
      .subscribe((ok) => {
        if (!ok) return;
        this.admin.deleteRoutine(routine.id).subscribe({
          next: () => this.load(),
          error: (err) => this.error.set(apiError(err, 'No se pudo eliminar la rutina.')),
        });
      });
  }

  exportCsv(): void {
    const rows = this.filtered();
    if (rows.length === 0) return;
    const header = ['ID', 'Rutina', 'Tipo', 'Descripción', 'Estado', 'Videos', 'Duración'];
    const lines = rows.map((r) =>
      [
        r.id,
        `"${(r.name ?? '').replace(/"/g, '""')}"`,
        `"${(r.routineTypeName ?? '').replace(/"/g, '""')}"`,
        `"${(r.description ?? '').replace(/"/g, '""')}"`,
        r.status === 1 ? 'Activa' : 'Inactiva',
        r.videos.length,
        formatDuration(r.totalDurationSeconds || 0),
      ].join(','),
    );
    const csv = '\uFEFF' + [header.join(','), ...lines].join('\n');
    downloadBlob(new Blob([csv], { type: 'text/csv;charset=utf-8;' }), 'rutinas.csv');
  }

  private indexOfType(idRoutineType: number): number {
    const index = this.types().findIndex((t) => t.id === idRoutineType);
    return index < 0 ? 0 : index;
  }

  private loadVideos(): void {
    this.admin.getVideos().subscribe({ next: (v) => this.videos.set(v), error: () => undefined });
  }

  private newVideoRow(idVideo = 0, durationSeconds = 60) {
    return this.fb.nonNullable.group({
      idVideo: [idVideo, Validators.required],
      durationSeconds: [durationSeconds, [Validators.required, Validators.min(1)]],
    });
  }
}