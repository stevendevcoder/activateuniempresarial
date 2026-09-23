import { Component, OnInit, inject, signal } from '@angular/core';
import { FormArray, FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { LucideAngularModule, Plus, Pencil, Trash2, X, Activity, Film, Power, Upload } from 'lucide-angular';
import { AdminService } from '../admin.service';
import { Routine, RoutineType, VideoItem } from '../admin.types';
import { DialogService } from '../../shared/dialog/dialog.service';

@Component({
  selector: 'app-routines',
  imports: [ReactiveFormsModule, LucideAngularModule],
  template: `
    <div class="space-y-5">
      <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div class="flex items-center gap-3">
          <div class="w-11 h-11 rounded-2xl bg-brand-blue flex items-center justify-center text-white shadow-md">
            <lucide-angular [img]="ic.Activity" class="w-6 h-6"></lucide-angular>
          </div>
          <div>
            <h1 class="text-xl font-extrabold text-brand-blue tracking-tight">Rutinas</h1>
            <p class="text-sm text-slate-500">Rutinas de pausas activas</p>
          </div>
        </div>
        <button (click)="openCreate()"
                class="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-brand-blue text-white text-sm font-bold hover:bg-brand-blue-dark transition-colors shadow-sm">
          <lucide-angular [img]="ic.Plus" class="w-4 h-4"></lucide-angular>
          Nueva rutina
        </button>
      </div>

      @if (error()) {
        <div class="p-3.5 rounded-xl bg-brand-soft-red border border-brand-red/20 text-xs text-brand-red font-medium">{{ error() }}</div>
      }

      <div class="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
        @for (routine of routines(); track routine.id) {
          <div class="rounded-2xl border border-brand-soft-blue bg-white p-5 shadow-sm">
            <div class="flex items-start justify-between mb-3">
              <div class="w-10 h-10 rounded-xl bg-brand-soft-blue flex items-center justify-center">
                <lucide-angular [img]="ic.Film" class="w-5 h-5 text-brand-blue"></lucide-angular>
              </div>
              <span class="inline-flex px-2 py-0.5 rounded-full text-xs font-bold"
                    [class]="routine.status === 1 ? 'bg-emerald-50 text-emerald-600' : 'bg-slate-100 text-slate-400'">
                {{ routine.status === 1 ? 'Activa' : 'Inactiva' }}
              </span>
            </div>
            <h3 class="font-bold text-slate-800">{{ routine.name }}</h3>
            <p class="text-xs text-slate-500 mt-1 min-h-8">{{ routine.description || 'Sin descripción' }}</p>
            <div class="flex items-center gap-2 mt-2">
              <span class="inline-flex px-2 py-0.5 rounded-full text-[11px] font-bold bg-brand-soft-blue text-brand-blue">
                {{ routine.routineTypeName ?? 'Sin tipo' }}
              </span>
              <span class="text-[11px] text-slate-500">{{ routine.videos.length }} video(s) · {{ routine.totalDurationSeconds }}s</span>
            </div>
            <div class="flex items-center justify-end gap-1 mt-4 pt-3 border-t border-brand-soft-blue">
              <button (click)="toggleStatus(routine)" class="p-2 rounded-lg text-slate-400 hover:text-amber-600 hover:bg-amber-50 transition-colors">
                <lucide-angular [img]="ic.Power" class="w-4 h-4"></lucide-angular>
              </button>
              <button (click)="openEdit(routine)" class="p-2 rounded-lg text-slate-400 hover:text-brand-blue hover:bg-brand-soft-blue transition-colors">
                <lucide-angular [img]="ic.Pencil" class="w-4 h-4"></lucide-angular>
              </button>
              <button (click)="remove(routine)" class="p-2 rounded-lg text-slate-400 hover:text-brand-red hover:bg-brand-soft-red transition-colors">
                <lucide-angular [img]="ic.Trash2" class="w-4 h-4"></lucide-angular>
              </button>
            </div>
          </div>
        } @empty {
          <p class="col-span-full text-center text-sm text-slate-400 py-10">
            {{ loading() ? 'Cargando…' : 'No hay rutinas registradas' }}
          </p>
        }
      </div>
    </div>

    @if (showForm()) {
      <div class="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div class="absolute inset-0 bg-black/50" (click)="closeForm()"></div>
        <div class="relative bg-white rounded-2xl shadow-2xl w-full max-w-xl p-6 max-h-[90vh] overflow-y-auto">
          <div class="flex items-center justify-between mb-5">
            <h2 class="text-lg font-extrabold text-brand-blue">{{ editingId() ? 'Editar rutina' : 'Nueva rutina' }}</h2>
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
              <textarea formControlName="description" rows="2" class="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-brand-blue"></textarea>
            </div>
            <div class="grid grid-cols-2 gap-4">
              <div>
                <label class="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">Tipo</label>
                <select formControlName="idRoutineType" class="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-brand-blue">
                  @for (type of types(); track type.id) {
                    <option [value]="type.id">{{ type.name }}</option>
                  }
                </select>
              </div>
              <div>
                <label class="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">Estado</label>
                <select formControlName="status" class="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-brand-blue">
                  <option [value]="1">Activa</option>
                  <option [value]="0">Inactiva</option>
                </select>
              </div>
            </div>

            <div>
              <div class="flex items-center justify-between mb-2">
                <label class="text-xs font-bold uppercase tracking-wider text-slate-700">Videos</label>
                <div class="flex items-center gap-3">
                  <button type="button" (click)="uploadInput.click()" [disabled]="uploading()"
                          class="inline-flex items-center gap-1 text-xs font-bold text-brand-red hover:underline disabled:opacity-40">
                    <lucide-angular [img]="ic.Upload" class="w-3.5 h-3.5"></lucide-angular>
                    {{ uploading() ? 'Subiendo…' : 'Subir video' }}
                  </button>
                  <button type="button" (click)="addVideo()" [disabled]="videos().length === 0"
                          class="text-xs font-bold text-brand-blue hover:underline disabled:opacity-40">+ Agregar video</button>
                  <input #uploadInput type="file" accept="video/*,.mp4,.webm,.ogg,.mov" class="hidden" (change)="onVideoSelected($event)" />
                </div>
              </div>
              @if (uploadError()) {
                <p class="text-xs text-brand-red font-medium mb-2">{{ uploadError() }}</p>
              }
              @if (videos().length === 0) {
                <p class="text-xs text-slate-400">No hay videos aún. Usa "Subir video" para cargar uno.</p>
              }
              <div formArrayName="videos" class="space-y-2">
                @for (row of videoControls.controls; track $index; let i = $index) {
                  <div [formGroupName]="i" class="flex gap-2 items-center">
                    <select formControlName="idVideo" class="flex-1 px-3 py-2 rounded-xl border border-slate-200 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-brand-blue">
                      @for (video of videos(); track video.id) {
                        <option [value]="video.id">{{ video.title }}</option>
                      }
                    </select>
                    <input type="number" formControlName="durationSeconds" placeholder="seg"
                           class="w-24 px-3 py-2 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-brand-blue" />
                    <button type="button" (click)="removeVideo(i)" class="p-2 rounded-lg text-slate-400 hover:text-brand-red hover:bg-brand-soft-red">
                      <lucide-angular [img]="ic.X" class="w-4 h-4"></lucide-angular>
                    </button>
                  </div>
                }
              </div>
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
export class RoutinesComponent implements OnInit {
  private readonly admin = inject(AdminService);
  private readonly fb = inject(FormBuilder);
  private readonly dialog = inject(DialogService);

  readonly ic = { Activity, Plus, Pencil, Trash2, X, Film, Power, Upload };
  readonly routines = signal<Routine[]>([]);
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
    videos: this.fb.array([]),
  });

  get videoControls(): FormArray {
    return this.form.controls.videos as FormArray;
  }

  ngOnInit(): void {
    this.load();
    this.admin.getRoutineTypes().subscribe({
      next: (types) => {
        this.types.set(types);
        if (types.length > 0 && this.form.controls.idRoutineType.value === 0) {
          this.form.controls.idRoutineType.setValue(types[0]!.id);
        }
      },
      error: () => undefined,
    });
    this.admin.getVideos().subscribe({ next: (v) => this.videos.set(v), error: () => undefined });
  }

  load(): void {
    this.loading.set(true);
    this.admin.getRoutines().subscribe({
      next: (routines) => {
        this.routines.set(routines);
        this.loading.set(false);
      },
      error: () => {
        this.error.set('No se pudieron cargar las rutinas.');
        this.loading.set(false);
      },
    });
  }

  private newVideoRow(idVideo = 0, durationSeconds = 60) {
    return this.fb.nonNullable.group({
      idVideo: [idVideo, Validators.required],
      durationSeconds: [durationSeconds, [Validators.required, Validators.min(1)]],
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
        this.admin.getVideos().subscribe({ next: (v) => this.videos.set(v), error: () => undefined });
        this.selectOrAddRow(res.videoId);
      },
      error: (err) => {
        this.uploading.set(false);
        this.uploadError.set(err?.error?.error ?? 'No se pudo subir el video.');
      },
    });
  }

  private selectOrAddRow(videoId: number): void {
    const controls = this.videoControls.controls;
    const empty = controls.find((c) => c.get('idVideo')?.value === 0);
    if (empty) {
      empty.get('idVideo')?.setValue(videoId);
    } else {
      this.videoControls.push(this.newVideoRow(videoId, 60));
    }
  }

  removeVideo(index: number): void {
    this.videoControls.removeAt(index);
  }

  openCreate(): void {
    this.editingId.set(null);
    this.formError.set('');
    this.videoControls.clear();
    const first = this.videos()[0];
    if (first) this.videoControls.push(this.newVideoRow(first.id, first.durationSeconds || 60));
    this.form.reset({
      name: '',
      description: '',
      idRoutineType: this.types()[0]?.id ?? 0,
      status: 1,
    });
    this.showForm.set(true);
  }

  openEdit(routine: Routine): void {
    this.editingId.set(routine.id);
    this.formError.set('');
    this.videoControls.clear();
    for (const video of routine.videos) {
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

  closeForm(): void {
    this.showForm.set(false);
  }

  save(): void {
    if (this.form.invalid) return;
    const raw = this.form.getRawValue();
    const videos = (raw.videos as { idVideo: number; durationSeconds: number }[]).map((v) => ({
      idVideo: Number(v.idVideo),
      durationSeconds: Number(v.durationSeconds),
    }));

    if (videos.length === 0) {
      this.formError.set('La rutina debe tener al menos un video.');
      return;
    }

    const payload = {
      name: raw.name,
      description: raw.description,
      idRoutineType: Number(raw.idRoutineType),
      status: Number(raw.status),
      videos,
    };

    const editing = this.editingId();
    this.saving.set(true);
    const request = editing
      ? this.admin.updateRoutine(editing, payload)
      : this.admin.createRoutine(payload);

    request.subscribe({
      next: () => {
        this.saving.set(false);
        this.closeForm();
        this.load();
      },
      error: (err) => {
        this.saving.set(false);
        this.formError.set(err?.error?.error ?? 'No se pudo guardar la rutina.');
      },
    });
  }

  toggleStatus(routine: Routine): void {
    const next = routine.status === 1 ? 0 : 1;
    this.admin.setRoutineStatus(routine.id, next).subscribe({
      next: () => this.load(),
      error: () => this.error.set('No se pudo cambiar el estado.'),
    });
  }

  remove(routine: Routine): void {
    this.dialog.confirm({
      title: 'Eliminar rutina',
      message: `¿Eliminar la rutina ${routine.name}?`,
      danger: true,
      confirmLabel: 'Eliminar',
    }).subscribe((ok) => {
      if (!ok) return;
      this.admin.deleteRoutine(routine.id).subscribe({
        next: () => this.load(),
        error: () => this.error.set('No se pudo eliminar la rutina.'),
      });
    });
  }
}
