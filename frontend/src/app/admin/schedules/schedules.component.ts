import { Component, OnInit, inject, signal } from '@angular/core';
import { DatePipe } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { LucideAngularModule, CalendarClock, Plus, Pencil, Trash2, X, Play, Pause, Zap } from 'lucide-angular';
import { AdminService } from '../admin.service';
import { Area, Routine, Schedule, ScheduleEventItem } from '../admin.types';
import { DialogService } from '../../shared/dialog/dialog.service';

@Component({
  selector: 'app-schedules',
  imports: [DatePipe, ReactiveFormsModule, LucideAngularModule],
  template: `
    <div class="space-y-5">
      <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div class="flex items-center gap-3">
          <div class="w-11 h-11 rounded-2xl bg-brand-blue flex items-center justify-center text-white shadow-md">
            <lucide-angular [img]="ic.CalendarClock" class="w-6 h-6"></lucide-angular>
          </div>
          <div>
            <h1 class="text-xl font-extrabold text-brand-blue tracking-tight">Cronogramas</h1>
            <p class="text-sm text-slate-500">Franjas y frecuencia de pausas por área (EP12)</p>
          </div>
        </div>
        <div class="flex gap-2">
          <button (click)="runScheduler()"
                  class="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border border-slate-200 bg-white text-brand-blue text-sm font-bold hover:bg-brand-soft-blue transition-colors">
            <lucide-angular [img]="ic.Zap" class="w-4 h-4"></lucide-angular>
            Ejecutar ciclo
          </button>
          <button (click)="openCreate()"
                  class="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-brand-blue text-white text-sm font-bold hover:bg-brand-blue-dark transition-colors shadow-sm">
            <lucide-angular [img]="ic.Plus" class="w-4 h-4"></lucide-angular>
            Nuevo cronograma
          </button>
        </div>
      </div>

      @if (message()) {
        <div class="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-700 font-medium">{{ message() }}</div>
      }
      @if (error()) {
        <div class="p-3.5 rounded-xl bg-brand-soft-red border border-brand-red/20 text-xs text-brand-red font-medium">{{ error() }}</div>
      }

      <div class="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
        @for (schedule of schedules(); track schedule.id) {
          <div class="rounded-2xl border border-brand-soft-blue bg-white p-5 shadow-sm">
            <div class="flex items-start justify-between mb-3">
              <div>
                <h3 class="font-bold text-slate-800">{{ schedule.areaName }}</h3>
                <p class="text-xs text-slate-500">{{ schedule.routineName ?? 'Sin rutina asignada' }}</p>
              </div>
              <span class="inline-flex px-2 py-0.5 rounded-full text-xs font-bold"
                    [class]="schedule.paused ? 'bg-amber-50 text-amber-600' : 'bg-emerald-50 text-emerald-600'">
                {{ schedule.paused ? 'Pausado' : 'Activo' }}
              </span>
            </div>
            <div class="text-xs text-slate-600 space-y-1">
              <p><span class="font-semibold">Franja:</span> {{ schedule.startTime }} – {{ schedule.endTime }}</p>
              <p><span class="font-semibold">Frecuencia:</span> cada {{ schedule.frequencyMinutes }} min · {{ schedule.durationMinutes }} min de duración</p>
              <p><span class="font-semibold">Días:</span> {{ daysLabel(schedule.daysOfWeek) }}</p>
            </div>
            <div class="flex items-center justify-end gap-1 mt-4 pt-3 border-t border-brand-soft-blue">
              <button (click)="togglePause(schedule)" [title]="schedule.paused ? 'Reanudar' : 'Pausar'"
                      class="p-2 rounded-lg text-slate-400 hover:text-amber-600 hover:bg-amber-50 transition-colors">
                <lucide-angular [img]="schedule.paused ? ic.Play : ic.Pause" class="w-4 h-4"></lucide-angular>
              </button>
              <button (click)="openEdit(schedule)" class="p-2 rounded-lg text-slate-400 hover:text-brand-blue hover:bg-brand-soft-blue transition-colors">
                <lucide-angular [img]="ic.Pencil" class="w-4 h-4"></lucide-angular>
              </button>
              <button (click)="remove(schedule)" class="p-2 rounded-lg text-slate-400 hover:text-brand-red hover:bg-brand-soft-red transition-colors">
                <lucide-angular [img]="ic.Trash2" class="w-4 h-4"></lucide-angular>
              </button>
            </div>
          </div>
        } @empty {
          <p class="col-span-full text-center text-sm text-slate-400 py-10">
            {{ loading() ? 'Cargando…' : 'No hay cronogramas configurados' }}
          </p>
        }
      </div>

      <div class="rounded-2xl border border-brand-soft-blue bg-white shadow-sm overflow-hidden">
        <div class="px-5 py-4 border-b border-brand-soft-blue">
          <h3 class="text-sm font-bold text-slate-800">Últimos eventos emitidos</h3>
        </div>
        <div class="overflow-x-auto">
          <table class="w-full text-sm">
            <thead>
              <tr class="border-b border-brand-soft-blue bg-brand-surface/50">
                <th class="text-left px-5 py-3 font-semibold text-slate-500">Programado</th>
                <th class="text-left px-5 py-3 font-semibold text-slate-500">Área</th>
                <th class="text-left px-5 py-3 font-semibold text-slate-500">Rutina</th>
                <th class="text-center px-5 py-3 font-semibold text-slate-500">Estado</th>
              </tr>
            </thead>
            <tbody>
              @for (event of scheduleEvents(); track event.id) {
                <tr class="border-b border-brand-soft-blue/60">
                  <td class="px-5 py-3 text-slate-600 whitespace-nowrap">{{ event.scheduledAt | date:'short' }}</td>
                  <td class="px-5 py-3 font-semibold text-slate-800">{{ event.areaName ?? '—' }}</td>
                  <td class="px-5 py-3 text-slate-500 text-xs">{{ routineName(event.idRoutine) }}</td>
                  <td class="px-5 py-3 text-center">
                    <span class="inline-flex px-2 py-0.5 rounded-full text-xs font-bold bg-brand-soft-blue text-brand-blue">
                      Emitido
                    </span>
                  </td>
                </tr>
              } @empty {
                <tr>
                  <td colspan="4" class="px-5 py-8 text-center text-sm text-slate-400">Sin eventos emitidos</td>
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
        <div class="relative bg-white rounded-2xl shadow-2xl w-full max-w-lg p-6 max-h-[90vh] overflow-y-auto">
          <div class="flex items-center justify-between mb-5">
            <h2 class="text-lg font-extrabold text-brand-blue">{{ editingId() ? 'Editar cronograma' : 'Nuevo cronograma' }}</h2>
            <button (click)="closeForm()" class="p-2 rounded-lg text-slate-400 hover:bg-slate-100">
              <lucide-angular [img]="ic.X" class="w-5 h-5"></lucide-angular>
            </button>
          </div>
          <form [formGroup]="form" (ngSubmit)="save()" class="space-y-4">
            <div>
              <label class="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">Área</label>
              <select formControlName="idArea" [disabled]="editingId() !== null"
                      class="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-brand-blue disabled:bg-slate-50">
                <option value="">Selecciona un área</option>
                @for (area of availableAreas(); track area.id) {
                  <option [value]="area.id">{{ area.name }}</option>
                }
              </select>
            </div>
            <div>
              <label class="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">Rutina</label>
              <select formControlName="idRoutine" class="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-brand-blue">
                <option value="">Sin rutina</option>
                @for (routine of routines(); track routine.id) {
                  <option [value]="routine.id">{{ routine.name }}</option>
                }
              </select>
            </div>
            <div class="grid grid-cols-2 gap-4">
              <div>
                <label class="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">Inicio</label>
                <input type="time" formControlName="startTime" class="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-brand-blue" />
              </div>
              <div>
                <label class="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">Fin</label>
                <input type="time" formControlName="endTime" class="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-brand-blue" />
              </div>
            </div>
            <div class="grid grid-cols-2 gap-4">
              <div>
                <label class="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">Frecuencia (min)</label>
                <input type="number" min="5" max="720" formControlName="frequencyMinutes"
                       class="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-brand-blue" />
              </div>
              <div>
                <label class="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">Duración (min)</label>
                <input type="number" min="1" max="120" formControlName="durationMinutes"
                       class="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-brand-blue" />
              </div>
            </div>
            <div>
              <label class="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-2">Días</label>
              <div class="flex flex-wrap gap-2">
                @for (day of dayOptions; track day.value) {
                  <button type="button" (click)="toggleDay(day.value)"
                          class="w-9 h-9 rounded-lg text-xs font-bold transition-colors"
                          [class]="selectedDays().includes(day.value) ? 'bg-brand-blue text-white' : 'bg-slate-100 text-slate-500'">
                    {{ day.label }}
                  </button>
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
export class SchedulesComponent implements OnInit {
  private readonly admin = inject(AdminService);
  private readonly fb = inject(FormBuilder);
  private readonly dialog = inject(DialogService);

  readonly ic = { CalendarClock, Plus, Pencil, Trash2, X, Play, Pause, Zap };
  readonly schedules = signal<Schedule[]>([]);
  readonly areas = signal<Area[]>([]);
  readonly routines = signal<Routine[]>([]);
  readonly scheduleEvents = signal<ScheduleEventItem[]>([]);
  readonly loading = signal(false);
  readonly saving = signal(false);
  readonly message = signal('');
  readonly error = signal('');
  readonly formError = signal('');
  readonly showForm = signal(false);
  readonly editingId = signal<number | null>(null);
  readonly selectedDays = signal<number[]>([1, 2, 3, 4, 5]);

  readonly dayOptions = [
    { value: 1, label: 'L' },
    { value: 2, label: 'M' },
    { value: 3, label: 'X' },
    { value: 4, label: 'J' },
    { value: 5, label: 'V' },
    { value: 6, label: 'S' },
    { value: 0, label: 'D' },
  ];

  readonly form = this.fb.nonNullable.group({
    idArea: ['', Validators.required],
    idRoutine: [''],
    startTime: ['08:00', Validators.required],
    endTime: ['18:00', Validators.required],
    frequencyMinutes: [120, [Validators.required, Validators.min(5)]],
    durationMinutes: [5, [Validators.required, Validators.min(1)]],
  });

  ngOnInit(): void {
    this.admin.getAreas().subscribe({ next: (a) => this.areas.set(a), error: () => undefined });
    this.admin.getRoutines().subscribe({ next: (r) => this.routines.set(r), error: () => undefined });
    this.load();
  }

  load(): void {
    this.loading.set(true);
    this.admin.getSchedules().subscribe({
      next: (s) => {
        this.schedules.set(s);
        this.loading.set(false);
      },
      error: () => {
        this.error.set('No se pudieron cargar los cronogramas.');
        this.loading.set(false);
      },
    });
    this.admin.getScheduleEvents(10).subscribe({
      next: (e) => this.scheduleEvents.set(e),
      error: () => undefined,
    });
  }

  routineName(idRoutine: number | null): string {
    if (!idRoutine) return '—';
    return this.routines().find((r) => r.id === idRoutine)?.name ?? `#${idRoutine}`;
  }

  availableAreas(): Area[] {
    if (this.editingId() !== null) return this.areas();
    const taken = new Set(this.schedules().filter((s) => s.status === 1).map((s) => s.idArea));
    return this.areas().filter((a) => !taken.has(a.id));
  }

  daysLabel(days: number[]): string {
    const labels: Record<number, string> = { 0: 'Dom', 1: 'Lun', 2: 'Mar', 3: 'Mié', 4: 'Jue', 5: 'Vie', 6: 'Sáb' };
    return days.map((d) => labels[d] ?? '').filter(Boolean).join(', ');
  }

  toggleDay(day: number): void {
    const current = this.selectedDays();
    this.selectedDays.set(current.includes(day) ? current.filter((d) => d !== day) : [...current, day]);
  }

  openCreate(): void {
    this.editingId.set(null);
    this.formError.set('');
    this.selectedDays.set([1, 2, 3, 4, 5]);
    this.form.reset({ idArea: '', idRoutine: '', startTime: '08:00', endTime: '18:00', frequencyMinutes: 120, durationMinutes: 5 });
    this.form.controls.idArea.enable();
    this.showForm.set(true);
  }

  openEdit(schedule: Schedule): void {
    this.editingId.set(schedule.id);
    this.formError.set('');
    this.selectedDays.set([...schedule.daysOfWeek]);
    this.form.reset({
      idArea: String(schedule.idArea),
      idRoutine: schedule.idRoutine ? String(schedule.idRoutine) : '',
      startTime: schedule.startTime,
      endTime: schedule.endTime,
      frequencyMinutes: schedule.frequencyMinutes,
      durationMinutes: schedule.durationMinutes,
    });
    this.form.controls.idArea.disable();
    this.showForm.set(true);
  }

  closeForm(): void {
    this.showForm.set(false);
  }

  save(): void {
    if (this.form.invalid) return;
    if (this.selectedDays().length === 0) {
      this.formError.set('Selecciona al menos un día.');
      return;
    }
    const raw = this.form.getRawValue();
    const payload = {
      idArea: Number(raw.idArea),
      idRoutine: raw.idRoutine === '' ? null : Number(raw.idRoutine),
      startTime: raw.startTime,
      endTime: raw.endTime,
      frequencyMinutes: Number(raw.frequencyMinutes),
      durationMinutes: Number(raw.durationMinutes),
      daysOfWeek: this.selectedDays(),
      status: 1,
    };

    const editing = this.editingId();
    this.saving.set(true);
    const request = editing
      ? this.admin.updateSchedule(editing, payload)
      : this.admin.createSchedule(payload);

    request.subscribe({
      next: () => {
        this.saving.set(false);
        this.closeForm();
        this.load();
      },
      error: (err) => {
        this.saving.set(false);
        this.formError.set(err?.error?.error ?? 'No se pudo guardar el cronograma.');
      },
    });
  }

  togglePause(schedule: Schedule): void {
    const request = schedule.paused
      ? this.admin.resumeSchedule(schedule.id)
      : this.admin.pauseSchedule(schedule.id);
    request.subscribe({
      next: () => this.load(),
      error: () => this.error.set('No se pudo cambiar el estado del cronograma.'),
    });
  }

  remove(schedule: Schedule): void {
    this.dialog.confirm({
      title: 'Eliminar cronograma',
      message: `¿Eliminar el cronograma de ${schedule.areaName}?`,
      danger: true,
      confirmLabel: 'Eliminar',
    }).subscribe((ok) => {
      if (!ok) return;
      this.admin.deleteSchedule(schedule.id).subscribe({
        next: () => this.load(),
        error: () => this.error.set('No se pudo eliminar el cronograma.'),
      });
    });
  }

  runScheduler(): void {
    this.message.set('');
    this.error.set('');
    this.admin.runScheduler().subscribe({
      next: (res) => {
        this.message.set(`Ciclo ejecutado. Eventos emitidos: ${res.emitted}.`);
        this.load();
      },
      error: () => this.error.set('No se pudo ejecutar el ciclo.'),
    });
  }
}
