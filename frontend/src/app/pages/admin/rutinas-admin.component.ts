import { Component, OnInit, inject, signal } from '@angular/core';
import { FormArray, FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ApiRoutine, RoutineType, VideoItem } from '../../core/api.types';
import { AdminService } from '../../core/services/admin.service';
import { DialogService } from '../../core/services/dialog.service';
import { poseForType } from '../../core/services/rutinas.service';
import { apiError, formatDuration } from '../../core/utils';
import { IconComponent } from '../../shared/icon.component';
import { MascotComponent } from '../../shared/mascot.component';

@Component({
  selector: 'app-rutinas-admin',
  imports: [ReactiveFormsModule, IconComponent, MascotComponent],
  template: `
    <section class="page">
      <header class="hero-navy">
        <div class="hero-row">
          <div>
            <h1>Rutinas</h1>
            <p>Rutinas de pausas activas y sus videos</p>
          </div>
          <button type="button" class="hero-btn" (click)="openCreate()" aria-label="Nueva rutina">
            <app-icon name="plus" [size]="20" />
          </button>
        </div>
      </header>

      <div class="page-body">
        @if (error()) {
          <p class="alert alert-error">{{ error() }}</p>
        }
        <div class="grid-cards three">
          @for (routine of routines(); track routine.id) {
            <article class="card" [class.off]="routine.status !== 1">
              <div class="head">
                <div class="thumb"><app-mascot [pose]="pose(routine)" /></div>
                <div class="info">
                  <h3>{{ routine.name }}</h3>
                  <p class="muted">{{ routine.description || 'Sin descripción' }}</p>
                </div>
              </div>
              <div class="chips">
                <span class="chip chip-sm chip-info">{{ routine.routineTypeName ?? 'Sin tipo' }}</span>
                <span class="chip chip-sm chip-muted"><app-icon name="film" [size]="12" /> {{ routine.videos.length }} video(s)</span>
                <span class="chip chip-sm chip-muted"><app-icon name="clock" [size]="12" /> {{ duration(routine.totalDurationSeconds) }}</span>
                <span class="chip chip-sm" [class]="routine.status === 1 ? 'chip-ok' : 'chip-muted'">{{ routine.status === 1 ? 'Activa' : 'Inactiva' }}</span>
              </div>
              <div class="card-actions">
                <button type="button" class="icon-btn warn" (click)="toggleStatus(routine)" [title]="routine.status === 1 ? 'Desactivar' : 'Activar'">
                  <app-icon name="power" [size]="16" />
                </button>
                <button type="button" class="icon-btn" (click)="openEdit(routine)" title="Editar"><app-icon name="edit" [size]="16" /></button>
                <button type="button" class="icon-btn danger" (click)="remove(routine)" title="Eliminar"><app-icon name="trash" [size]="16" /></button>
              </div>
            </article>
          } @empty {
            <p class="empty">{{ loading() ? 'Cargando rutinas…' : 'No hay rutinas registradas.' }}</p>
          }
        </div>
      </div>
    </section>

    @if (showForm()) {
      <div class="modal-backdrop" (click)="showForm.set(false)">
        <form class="modal wide" [formGroup]="form" (ngSubmit)="save()" (click)="$event.stopPropagation()">
          <div class="modal-head">
            <h2>{{ editingId() ? 'Editar rutina' : 'Nueva rutina' }}</h2>
            <button type="button" class="icon-btn" (click)="showForm.set(false)" aria-label="Cerrar"><app-icon name="x" [size]="18" /></button>
          </div>
          <div class="form-grid">
            <label class="form-field">
              <span>Nombre</span>
              <input class="input" formControlName="name" />
            </label>
            <label class="form-field">
              <span>Descripción</span>
              <textarea class="input" rows="2" formControlName="description"></textarea>
            </label>
            <div class="form-field-row">
              <label class="form-field">
                <span>Tipo</span>
                <select class="input" formControlName="idRoutineType">
                  @for (type of types(); track type.id) {
                    <option [value]="type.id">{{ type.name }}</option>
                  }
                </select>
              </label>
              <label class="form-field">
                <span>Estado</span>
                <select class="input" formControlName="status">
                  <option [value]="1">Activa</option>
                  <option [value]="0">Inactiva</option>
                </select>
              </label>
            </div>

            <div class="form-field">
              <div class="videos-head">
                <span>Videos</span>
                <div>
                  <button type="button" class="btn-ghost" (click)="uploadInput.click()" [disabled]="uploading()">
                    <app-icon name="upload" [size]="14" /> {{ uploading() ? 'Subiendo…' : 'Subir video' }}
                  </button>
                  <button type="button" class="btn-ghost" (click)="addVideo()" [disabled]="videos().length === 0">
                    <app-icon name="plus" [size]="14" /> Agregar
                  </button>
                </div>
                <input #uploadInput type="file" accept="video/*,.mp4,.webm,.ogg,.mov" hidden (change)="onVideoSelected($event)" />
              </div>
              @if (uploadError()) {
                <p class="alert alert-error">{{ uploadError() }}</p>
              }
              @if (videos().length === 0) {
                <p class="muted hint">No hay videos aún. Usa "Subir video" para cargar el primero.</p>
              }
              <div formArrayName="videos" class="video-rows">
                @for (row of videoControls.controls; track $index; let i = $index) {
                  <div [formGroupName]="i" class="video-row">
                    <span class="num">{{ i + 1 }}</span>
                    <select class="input" formControlName="idVideo">
                      @for (video of videos(); track video.id) {
                        <option [value]="video.id">{{ video.title }}</option>
                      }
                    </select>
                    <input class="input secs" type="number" min="1" formControlName="durationSeconds" aria-label="Segundos" />
                    <button type="button" class="icon-btn danger" (click)="videoControls.removeAt(i)" aria-label="Quitar"><app-icon name="x" [size]="16" /></button>
                  </div>
                }
              </div>
            </div>

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
    .off { opacity: 0.7; }
    .head { display: flex; gap: 12px; }
    .thumb { width: 64px; height: 64px; flex-shrink: 0; padding: 6px; border-radius: 20px; background: #eef2ff; }
    .info { min-width: 0; }
    h3 { margin: 0 0 4px; color: #0f172a; font-size: 16px; }
    .info p { margin: 0; font-size: 13px; }
    .chips { display: flex; flex-wrap: wrap; gap: 6px; margin-top: 12px; }
    .chips .chip { gap: 4px; }
    .videos-head { display: flex; flex-wrap: wrap; align-items: center; justify-content: space-between; gap: 8px; }
    .videos-head > span { color: #111827; font-size: 13px; font-weight: 800; }
    .videos-head > div { display: flex; gap: 6px; }
    .hint { margin: 0; font-size: 12px; }
    .video-rows { display: grid; gap: 8px; }
    .video-row { display: grid; grid-template-columns: 24px 1fr 90px 36px; align-items: center; gap: 8px; }
    .num { color: #94a3b8; font-size: 12px; font-weight: 800; text-align: center; }
    .secs { padding: 14px 10px; }
  `,
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

  ngOnInit(): void {
    this.load();
    this.admin.getRoutineTypes().subscribe({ next: (t) => this.types.set(t), error: () => undefined });
    this.loadVideos();
  }

  pose(routine: ApiRoutine) {
    return poseForType(routine.routineTypeName);
  }

  duration(seconds: number): string {
    return formatDuration(seconds);
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
    this.form.patchValue({ name: '', description: '', idRoutineType: this.types()[0]?.id ?? 0, status: 1 });
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
      description: routine.description,
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
      error: (err) => this.error.set(apiError(err, 'No se pudo cambiar el estado.')),
    });
  }

  remove(routine: ApiRoutine): void {
    this.dialog
      .confirm({ title: 'Eliminar rutina', message: `¿Eliminar la rutina ${routine.name}?`, danger: true, confirmLabel: 'Eliminar' })
      .subscribe((ok) => {
        if (!ok) return;
        this.admin.deleteRoutine(routine.id).subscribe({
          next: () => this.load(),
          error: (err) => this.error.set(apiError(err, 'No se pudo eliminar la rutina.')),
        });
      });
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
