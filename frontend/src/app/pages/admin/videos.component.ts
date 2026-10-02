import { HttpErrorResponse, HttpEvent, HttpEventType } from '@angular/common/http';
import { Component, OnDestroy, OnInit, computed, inject, signal } from '@angular/core';
import { FormBuilder, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { Observable, concat, forkJoin, last } from 'rxjs';
import { ApiRoutine, VideoItem } from '../../core/api.types';
import { AdminService } from '../../core/services/admin.service';
import { DialogService } from '../../core/services/dialog.service';
import { apiError, downloadBlob, formatDuration } from '../../core/utils';
import { IconComponent } from '../../shared/icon.component';

/** Deben coincidir con MEDIA_ALLOWED_MIME y MEDIA_MAX_FILE_SIZE_MB del backend. */
const ALLOWED_MIME = ['video/mp4', 'video/webm', 'video/ogg', 'video/quicktime'];
const MAX_SIZE_MB = 200;

type StatusFilter = 'all' | '1' | '0';

@Component({
  selector: 'app-videos',
  imports: [FormsModule, ReactiveFormsModule, IconComponent],
  templateUrl: './videos.component.html',
})
export class VideosComponent implements OnInit, OnDestroy {
  private readonly admin = inject(AdminService);
  private readonly fb = inject(FormBuilder);
  private readonly dialog = inject(DialogService);

  readonly videos = signal<VideoItem[]>([]);
  readonly routines = signal<ApiRoutine[]>([]);
  readonly loading = signal(false);
  readonly error = signal('');
  readonly message = signal('');
  readonly query = signal('');
  readonly statusFilter = signal<StatusFilter>('all');

  // Formulario crear/editar
  readonly showForm = signal(false);
  readonly editing = signal<VideoItem | null>(null);
  readonly file = signal<File | null>(null);
  readonly saving = signal(false);
  readonly progress = signal<number | null>(null);
  readonly formError = signal('');

  // Vista previa
  readonly preview = signal<{ video: VideoItem; url: string | null; error: string } | null>(null);

  readonly accept = ALLOWED_MIME.join(',');
  readonly maxSizeMb = MAX_SIZE_MB;

  readonly form = this.fb.nonNullable.group({
    title: ['', [Validators.required, Validators.maxLength(255)]],
    description: ['', Validators.maxLength(500)],
    durationSeconds: [0, [Validators.required, Validators.min(0)]],
    status: [1],
  });

  /** Cuántas rutinas usan cada video (no se puede eliminar un video en uso). */
  readonly usage = computed(() => {
    const map = new Map<number, string[]>();
    for (const routine of this.routines()) {
      for (const rv of routine.videos) {
        map.set(rv.idVideo, [...(map.get(rv.idVideo) ?? []), routine.name]);
      }
    }
    return map;
  });

  readonly activeCount = computed(() => this.videos().filter((v) => v.status === 1).length);
  readonly inUseCount = computed(() => this.videos().filter((v) => this.usage().has(v.id)).length);
  readonly totalSize = computed(() => this.videos().reduce((acc, v) => acc + (v.size || 0), 0));

  readonly filtered = computed(() => {
    const q = this.query().trim().toLowerCase();
    const status = this.statusFilter();
    return this.videos().filter((video) => {
      if (status !== 'all' && String(video.status) !== status) return false;
      if (!q) return true;
      return (
        video.title.toLowerCase().includes(q) ||
        (video.description ?? '').toLowerCase().includes(q) ||
        (video.fileName ?? '').toLowerCase().includes(q)
      );
    });
  });

  ngOnInit(): void {
    this.load();
  }

  ngOnDestroy(): void {
    this.closePreview();
  }

  load(): void {
    this.loading.set(true);
    forkJoin({ videos: this.admin.getVideos(), routines: this.admin.getRoutines() }).subscribe({
      next: ({ videos, routines }) => {
        this.videos.set(videos);
        this.routines.set(routines);
        this.loading.set(false);
      },
      error: (err) => {
        this.error.set(apiError(err, 'No se pudieron cargar los videos.'));
        this.loading.set(false);
      },
    });
  }

  setQuery(value: string): void {
    this.query.set(value);
  }

  resetFilters(): void {
    this.query.set('');
    this.statusFilter.set('all');
  }

  duration(seconds: number): string {
    return seconds ? formatDuration(seconds) : '—';
  }

  size(bytes: number): string {
    if (!bytes) return '0 B';
    const units = ['B', 'KB', 'MB', 'GB'];
    const i = Math.min(units.length - 1, Math.floor(Math.log(bytes) / Math.log(1024)));
    return `${(bytes / 1024 ** i).toFixed(i === 0 ? 0 : 1)} ${units[i]}`;
  }

  format(mime: string): string {
    return (mime?.split('/')[1] ?? '').replace('quicktime', 'mov').toUpperCase() || '—';
  }

  usedIn(video: VideoItem): string[] {
    return this.usage().get(video.id) ?? [];
  }

  // ── Crear / editar ──

  openCreate(): void {
    this.editing.set(null);
    this.resetFormState();
    this.form.reset({ title: '', description: '', durationSeconds: 0, status: 1 });
    this.showForm.set(true);
  }

  openEdit(video: VideoItem): void {
    this.editing.set(video);
    this.resetFormState();
    this.form.reset({
      title: video.title,
      description: video.description ?? '',
      durationSeconds: video.durationSeconds ?? 0,
      status: video.status,
    });
    this.showForm.set(true);
  }

  closeForm(): void {
    if (this.saving()) return;
    this.showForm.set(false);
  }

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0] ?? null;
    input.value = '';
    if (!file) return;

    if (!ALLOWED_MIME.includes(file.type)) {
      this.formError.set('Formato no permitido. Usa MP4, WEBM, OGG o MOV.');
      return;
    }
    if (file.size > MAX_SIZE_MB * 1024 * 1024) {
      this.formError.set(`El archivo supera el máximo de ${MAX_SIZE_MB} MB.`);
      return;
    }

    this.formError.set('');
    this.file.set(file);
    if (!this.form.controls.title.value.trim()) {
      this.form.controls.title.setValue(file.name.replace(/\.[^.]+$/, '').slice(0, 255));
    }
    this.readDuration(file);
  }

  clearFile(): void {
    this.file.set(null);
  }

  save(): void {
    if (this.form.invalid || this.saving()) {
      this.form.markAllAsTouched();
      return;
    }
    const editing = this.editing();
    const file = this.file();
    if (!editing && !file) {
      this.formError.set('Selecciona el archivo de video.');
      return;
    }

    const raw = this.form.getRawValue();
    const metadata = {
      title: raw.title.trim(),
      description: raw.description.trim(),
      durationSeconds: Math.max(0, Math.round(Number(raw.durationSeconds) || 0)),
      status: Number(raw.status),
    };

    let request: Observable<unknown>;
    if (!editing) {
      request = this.withProgress(this.admin.uploadVideoWithProgress(file!, metadata));
    } else {
      const steps: Observable<unknown>[] = [this.admin.updateVideo(editing.id, metadata)];
      if (file) steps.push(this.withProgress(this.admin.replaceVideoFile(editing.id, file)));
      request = concat(...steps).pipe(last());
    }

    this.saving.set(true);
    this.formError.set('');
    request.subscribe({
      next: () => {
        this.saving.set(false);
        this.progress.set(null);
        this.showForm.set(false);
        this.flash(editing ? 'Video actualizado.' : 'Video subido correctamente.');
        this.load();
      },
      error: (err) => {
        this.saving.set(false);
        this.progress.set(null);
        this.formError.set(apiError(err, 'No se pudo guardar el video.'));
      },
    });
  }

  // ── Acciones de la tabla ──

  toggleStatus(video: VideoItem): void {
    const status = video.status === 1 ? 0 : 1;
    this.admin
      .updateVideo(video.id, {
        title: video.title,
        description: video.description ?? '',
        durationSeconds: video.durationSeconds ?? 0,
        status,
      })
      .subscribe({
        next: () => {
          this.videos.update((list) => list.map((v) => (v.id === video.id ? { ...v, status } : v)));
          this.flash(status === 1 ? 'Video activado.' : 'Video desactivado.');
        },
        error: (err) => this.error.set(apiError(err, 'No se pudo cambiar el estado del video.')),
      });
  }

  remove(video: VideoItem): void {
    const routines = this.usedIn(video);
    if (routines.length > 0) {
      this.dialog
        .alert({
          title: 'Video en uso',
          message: `"${video.title}" está asignado a: ${routines.join(', ')}. Quítalo de esas rutinas antes de eliminarlo o desactívalo para ocultarlo.`,
        })
        .subscribe();
      return;
    }

    this.dialog
      .confirm({
        title: 'Eliminar video',
        message: `¿Eliminar "${video.title}"? El archivo se borrará del servidor y no se puede deshacer.`,
        danger: true,
        confirmLabel: 'Eliminar',
      })
      .subscribe((ok) => {
        if (!ok) return;
        this.admin.deleteVideo(video.id).subscribe({
          next: () => {
            this.videos.update((list) => list.filter((v) => v.id !== video.id));
            this.flash('Video eliminado.');
          },
          error: (err: HttpErrorResponse) =>
            this.error.set(apiError(err, 'No se pudo eliminar el video.')),
        });
      });
  }

  openPreview(video: VideoItem): void {
    this.closePreview();
    this.preview.set({ video, url: null, error: '' });
    this.admin.getVideoBlob(video.id).subscribe({
      next: (blob) => {
        if (this.preview()?.video.id !== video.id) return;
        this.preview.set({ video, url: URL.createObjectURL(blob), error: '' });
      },
      error: () => this.preview.set({ video, url: null, error: 'No se pudo cargar el video.' }),
    });
  }

  closePreview(): void {
    const url = this.preview()?.url;
    if (url) URL.revokeObjectURL(url);
    this.preview.set(null);
  }

  exportCsv(): void {
    const rows = this.filtered();
    if (rows.length === 0) return;
    const header = ['ID', 'Título', 'Descripción', 'Formato', 'Duración', 'Tamaño', 'Rutinas', 'Estado'];
    const quote = (value: string) => `"${value.replace(/"/g, '""')}"`;
    const lines = rows.map((v) =>
      [
        v.id,
        quote(v.title ?? ''),
        quote(v.description ?? ''),
        this.format(v.mimeType),
        this.duration(v.durationSeconds),
        this.size(v.size),
        quote(this.usedIn(v).join(' | ')),
        v.status === 1 ? 'Activo' : 'Inactivo',
      ].join(','),
    );
    const csv = '﻿' + [header.join(','), ...lines].join('\n');
    downloadBlob(new Blob([csv], { type: 'text/csv;charset=utf-8;' }), 'videos.csv');
  }

  // ── Utilidades ──

  /** Convierte los eventos HTTP en progreso (%) y termina con la respuesta final. */
  private withProgress<T>(events: Observable<HttpEvent<T>>): Observable<unknown> {
    return new Observable((subscriber) => {
      this.progress.set(0);
      const sub = events.subscribe({
        next: (event) => {
          if (event.type === HttpEventType.UploadProgress && event.total) {
            this.progress.set(Math.round((event.loaded / event.total) * 100));
          } else if (event.type === HttpEventType.Response) {
            subscriber.next(event.body);
            subscriber.complete();
          }
        },
        error: (err) => subscriber.error(err),
      });
      return () => sub.unsubscribe();
    });
  }

  /** Lee la duración real del archivo para no tener que escribirla a mano. */
  private readDuration(file: File): void {
    const url = URL.createObjectURL(file);
    const probe = document.createElement('video');
    probe.preload = 'metadata';
    probe.onloadedmetadata = () => {
      if (Number.isFinite(probe.duration)) {
        this.form.controls.durationSeconds.setValue(Math.round(probe.duration));
      }
      URL.revokeObjectURL(url);
    };
    probe.onerror = () => URL.revokeObjectURL(url);
    probe.src = url;
  }

  private resetFormState(): void {
    this.file.set(null);
    this.formError.set('');
    this.progress.set(null);
  }

  private flash(text: string): void {
    this.error.set('');
    this.message.set(text);
    setTimeout(() => {
      if (this.message() === text) this.message.set('');
    }, 3500);
  }
}
