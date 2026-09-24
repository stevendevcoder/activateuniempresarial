import { DatePipe } from '@angular/common';
import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ApiRoutine, Area, Schedule, ScheduleEventItem } from '../../core/api.types';
import { AdminService } from '../../core/services/admin.service';
import { DialogService } from '../../core/services/dialog.service';
import { apiError, toMeridiem, WEEKDAY_LABELS } from '../../core/utils';
import { IconComponent } from '../../shared/icon.component';

@Component({
  selector: 'app-cronogramas',
  imports: [DatePipe, ReactiveFormsModule, IconComponent],
  template: `
    <section class="page">
      <header class="hero-navy">
        <div class="hero-row">
          <div>
            <h1>Cronogramas</h1>
            <p>Franjas y frecuencia de pausas por área</p>
          </div>
          <div class="hero-actions">
            <button type="button" class="hero-btn" (click)="runScheduler()" title="Ejecutar ciclo ahora" aria-label="Ejecutar ciclo">
              <app-icon name="zap" [size]="20" />
            </button>
            <button type="button" class="hero-btn" (click)="openCreate()" aria-label="Nuevo cronograma">
              <app-icon name="plus" [size]="20" />
            </button>
          </div>
        </div>
      </header>

      <div class="page-body">
        @if (message()) {
          <p class="alert alert-ok">{{ message() }}</p>
        }
        @if (error()) {
          <p class="alert alert-error">{{ error() }}</p>
        }

        <div class="grid-cards three">
          @for (schedule of schedules(); track schedule.id) {
            <article class="card">
              <div class="card-head">
                <div>
                  <h3>{{ schedule.areaName }}</h3>
                  <p>{{ schedule.routineName ?? 'Sin rutina asignada' }}</p>
                </div>
                <span class="chip chip-sm" [class]="schedule.paused ? 'chip-amber' : 'chip-ok'">
                  {{ schedule.paused ? 'Pausado' : 'Activo' }}
                </span>
              </div>
              <div class="facts">
                <p><app-icon name="clock" [size]="14" /> {{ time(schedule.startTime) }} – {{ time(schedule.endTime) }}</p>
                <p><app-icon name="refresh" [size]="14" /> Cada {{ schedule.frequencyMinutes }} min · {{ schedule.durationMinutes }} min de pausa</p>
              </div>
              <div class="days">
                @for (day of dayOptions; track day.value) {
                  <span [class.on]="schedule.daysOfWeek.includes(day.value)">{{ day.label }}</span>
                }
              </div>
              <div class="card-actions">
                <button type="button" class="icon-btn warn" (click)="togglePause(schedule)" [title]="schedule.paused ? 'Reanudar' : 'Pausar'">
                  <app-icon [name]="schedule.paused ? 'play' : 'pause'" [size]="16" />
                </button>
                <button type="button" class="icon-btn" (click)="openEdit(schedule)" title="Editar"><app-icon name="edit" [size]="16" /></button>
                <button type="button" class="icon-btn danger" (click)="remove(schedule)" title="Eliminar"><app-icon name="trash" [size]="16" /></button>
              </div>
            </article>
          } @empty {
            <p class="empty">{{ loading() ? 'Cargando cronogramas…' : 'No hay cronogramas configurados.' }}</p>
          }
        </div>

        <article class="card">
          <h2 class="section-title">Últimos eventos emitidos</h2>
          <div class="rows">
            @for (event of events(); track event.id) {
              <div class="row-item">
                <div>
                  <b>{{ event.areaName ?? '—' }}</b>
                  <small>{{ routineName(event.idRoutine) }}</small>
                </div>
                <span class="chip chip-sm chip-info">{{ event.scheduledAt | date: 'short' }}</span>
              </div>
            } @empty {
              <p class="empty">Sin eventos emitidos todavía.</p>
            }
          </div>
        </article>
      </div>
    </section>

    @if (showForm()) {
      <div class="modal-backdrop" (click)="showForm.set(false)">
        <form class="modal" [formGroup]="form" (ngSubmit)="save()" (click)="$event.stopPropagation()">
          <div class="modal-head">
            <h2>{{ editingId() ? 'Editar cronograma' : 'Nuevo cronograma' }}</h2>
            <button type="button" class="icon-btn" (click)="showForm.set(false)" aria-label="Cerrar"><app-icon name="x" [size]="18" /></button>
          </div>
          <div class="form-grid">
            <label class="form-field">
              <span>Área</span>
              <select class="input" formControlName="idArea">
                <option value="">Selecciona un área</option>
                @for (area of availableAreas(); track area.id) {
                  <option [value]="area.id">{{ area.name }}</option>
                }
              </select>
            </label>
            <label class="form-field">
              <span>Rutina</span>
              <select class="input" formControlName="idRoutine">
                <option value="">Sin rutina (pausa libre)</option>
                @for (routine of routines(); track routine.id) {
                  <option [value]="routine.id">{{ routine.name }}</option>
                }
              </select>
            </label>
            <div class="form-field-row">
              <label class="form-field">
                <span>Inicio</span>
                <input class="input" type="time" formControlName="startTime" />
              </label>
              <label class="form-field">
                <span>Fin</span>
                <input class="input" type="time" formControlName="endTime" />
              </label>
            </div>
            <div class="form-field-row">
              <label class="form-field">
                <span>Frecuencia (min)</span>
                <input class="input" type="number" min="5" max="720" formControlName="frequencyMinutes" />
              </label>
              <label class="form-field">
                <span>Duración (min)</span>
                <input class="input" type="number" min="1" max="120" formControlName="durationMinutes" />
              </label>
            </div>
            <div class="form-field">
              <span>Días</span>
              <div class="day-picker">
                @for (day of dayOptions; track day.value) {
                  <button type="button" [class.on]="selectedDays().includes(day.value)" (click)="toggleDay(day.value)">{{ day.label }}</button>
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
    .facts { display: grid; gap: 6px; margin-top: 14px; }
    .facts p { display: flex; align-items: center; gap: 6px; margin: 0; color: #475569; font-size: 13px; }
    .days { display: flex; gap: 4px; margin-top: 12px; }
    .days span { display: grid; place-items: center; width: 28px; height: 28px; border-radius: 10px; background: #f1f5f9; color: #94a3b8; font-size: 11px; font-weight: 800; }
    .days span.on { background: #eef2ff; color: #1b2f8a; }
    .day-picker { display: flex; flex-wrap: wrap; gap: 8px; }
    .day-picker button { width: 42px; height: 42px; border: 0; border-radius: 14px; background: #f1f5f9; color: #64748b; font-weight: 800; cursor: pointer; }
    .day-picker button.on { background: #1b2f8a; color: #fff; }
  `,
})
export class CronogramasComponent implements OnInit {
  private readonly admin = inject(AdminService);
  private readonly fb = inject(FormBuilder);
  private readonly dialog = inject(DialogService);

  readonly schedules = signal<Schedule[]>([]);
  readonly areas = signal<Area[]>([]);
  readonly routines = signal<ApiRoutine[]>([]);
  readonly events = signal<ScheduleEventItem[]>([]);
  readonly loading = signal(false);
  readonly saving = signal(false);
  readonly message = signal('');
  readonly error = signal('');
  readonly formError = signal('');
  readonly showForm = signal(false);
  readonly editingId = signal<number | null>(null);
  readonly selectedDays = signal<number[]>([1, 2, 3, 4, 5]);

  readonly dayOptions = [1, 2, 3, 4, 5, 6, 0].map((value) => ({ value, label: WEEKDAY_LABELS[value].charAt(0) }));

  readonly availableAreas = computed(() => {
    if (this.editingId() !== null) return this.areas();
    const taken = new Set(this.schedules().filter((s) => s.status === 1).map((s) => s.idArea));
    return this.areas().filter((a) => !taken.has(a.id));
  });

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
    this.admin.getRoutines().subscribe({ next: (r) => this.routines.set(r.filter((x) => x.status === 1)), error: () => undefined });
    this.load();
  }

  load(): void {
    this.loading.set(true);
    this.admin.getSchedules().subscribe({
      next: (s) => {
        this.schedules.set(s);
        this.loading.set(false);
      },
      error: (err) => {
        this.error.set(apiError(err, 'No se pudieron cargar los cronogramas.'));
        this.loading.set(false);
      },
    });
    this.admin.getScheduleEvents(10).subscribe({ next: (e) => this.events.set(e), error: () => undefined });
  }

  time(value: string): string {
    return toMeridiem(value);
  }

  routineName(idRoutine: number | null): string {
    if (!idRoutine) return 'Pausa libre';
    return this.routines().find((r) => r.id === idRoutine)?.name ?? `Rutina #${idRoutine}`;
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
    const request = editing ? this.admin.updateSchedule(editing, payload) : this.admin.createSchedule(payload);
    request.subscribe({
      next: () => {
        this.saving.set(false);
        this.showForm.set(false);
        this.load();
      },
      error: (err) => {
        this.saving.set(false);
        this.formError.set(apiError(err, 'No se pudo guardar el cronograma.'));
      },
    });
  }

  togglePause(schedule: Schedule): void {
    const request = schedule.paused ? this.admin.resumeSchedule(schedule.id) : this.admin.pauseSchedule(schedule.id);
    request.subscribe({
      next: () => this.load(),
      error: (err) => this.error.set(apiError(err, 'No se pudo cambiar el estado del cronograma.')),
    });
  }

  remove(schedule: Schedule): void {
    this.dialog
      .confirm({ title: 'Eliminar cronograma', message: `¿Eliminar el cronograma de ${schedule.areaName}?`, danger: true, confirmLabel: 'Eliminar' })
      .subscribe((ok) => {
        if (!ok) return;
        this.admin.deleteSchedule(schedule.id).subscribe({
          next: () => this.load(),
          error: (err) => this.error.set(apiError(err, 'No se pudo eliminar el cronograma.')),
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
      error: (err) => this.error.set(apiError(err, 'No se pudo ejecutar el ciclo.')),
    });
  }
}
