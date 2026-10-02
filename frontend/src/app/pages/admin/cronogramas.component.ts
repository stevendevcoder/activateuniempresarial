import { DatePipe } from '@angular/common';
import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { FormBuilder, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { ApiRoutine, Area, Schedule, ScheduleEventItem } from '../../core/api.types';
import { AdminService } from '../../core/services/admin.service';
import { DialogService } from '../../core/services/dialog.service';
import { apiError, downloadBlob, toMeridiem, WEEKDAY_LABELS } from '../../core/utils';

type ScheduleFilter = 'all' | 'active' | 'paused';

@Component({
  selector: 'app-cronogramas',
  imports: [DatePipe, FormsModule, ReactiveFormsModule],
  templateUrl: './cronogramas.component.html',
  styleUrl: './cronogramas.component.scss',
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
  readonly running = signal(false);
  readonly message = signal('');
  readonly error = signal('');
  readonly formError = signal('');
  readonly showForm = signal(false);
  readonly editingId = signal<number | null>(null);
  readonly selectedDays = signal<number[]>([1, 2, 3, 4, 5]);
  readonly query = signal('');
  readonly filter = signal<ScheduleFilter>('all');

  /** Orden de la semana: Lunes → Domingo (valores del backend: 1..6, 0). */
  readonly dayOptions = [1, 2, 3, 4, 5, 6, 0].map((value) => ({
    value,
    label: WEEKDAY_LABELS[value].charAt(0),
    full: WEEKDAY_LABELS[value],
  }));

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

  // ── KPIs reales derivados de los cronogramas cargados ──
  readonly activeCount = computed(() => this.schedules().filter((s) => s.status === 1 && !s.paused).length);
  readonly pausedCount = computed(() => this.schedules().filter((s) => s.paused).length);
  readonly syncedAreas = computed(() => new Set(this.schedules().filter((s) => s.status === 1).map((s) => s.idArea)).size);

  readonly avgStart = computed(() => this.averageTime(true));
  readonly avgEnd = computed(() => this.averageTime(false));

  readonly freqRange = computed(() => {
    const list = this.filtered();
    if (list.length === 0) return '—';
    const min = Math.min(...list.map((s) => s.frequencyMinutes));
    const max = Math.max(...list.map((s) => s.frequencyMinutes));
    const hours = (m: number) => (m % 60 === 0 ? `${m / 60} hr${m / 60 === 1 ? '' : 's'}` : `${m} min`);
    return min === max ? `${hours(min)}` : `${hours(min)} – ${hours(max)}`;
  });

  readonly durationRange = computed(() => {
    const list = this.filtered();
    if (list.length === 0) return '—';
    const min = Math.min(...list.map((s) => s.durationMinutes));
    const max = Math.max(...list.map((s) => s.durationMinutes));
    return min === max ? `${min} min` : `${min} – ${max} min`;
  });

  readonly tabs: { id: ScheduleFilter; label: string; count: () => number }[] = [
    { id: 'all', label: 'Todos los cronogramas', count: () => this.schedules().length },
    { id: 'active', label: 'Activos', count: () => this.activeCount() },
    { id: 'paused', label: 'En pausa', count: () => this.pausedCount() },
  ];

  readonly filtered = computed(() => {
    const q = this.query().trim().toLowerCase();
    const filter = this.filter();
    return this.schedules().filter((schedule) => {
      if (filter === 'active' && (schedule.paused || schedule.status !== 1)) return false;
      if (filter === 'paused' && !schedule.paused) return false;
      if (!q) return true;
      const routine = this.routineName(schedule.idRoutine);
      return (
        (schedule.areaName ?? '').toLowerCase().includes(q) ||
        routine.toLowerCase().includes(q) ||
        toMeridiem(schedule.startTime).toLowerCase().includes(q)
      );
    });
  });

  /**
   * Próxima emisión estimada por cronograma, calculada una sola vez por
   * señal (evita recorrer días/franjas en cada ciclo de detección de cambios).
   */
  readonly nextPauseById = computed(() => {
    const map = new Map<number, string | null>();
    for (const schedule of this.schedules()) {
      const next = this.computeNextPause(schedule);
      map.set(schedule.id, next ? this.relativeDay(next, new Date()) : null);
    }
    return map;
  });

  /** Texto de la próxima pausa estimada; null si el cronograma está pausado o sin días. */
  nextPause(schedule: Schedule): string | null {
    return this.nextPauseById().get(schedule.id) ?? null;
  }

  private computeNextPause(schedule: Schedule): Date | null {
    if (schedule.paused || schedule.status !== 1) return null;
    const step = Math.max(schedule.frequencyMinutes, 5);
    const now = new Date();
    const cursor = new Date(now);
    cursor.setSeconds(0, 0);

    for (let dayOffset = 0; dayOffset <= 8; dayOffset++) {
      const probe = new Date(now);
      probe.setDate(probe.getDate() + dayOffset);
      if (!schedule.daysOfWeek.includes(probe.getDay())) continue;

      const [sh, sm] = schedule.startTime.split(':').map(Number);
      const [eh, em] = schedule.endTime.split(':').map(Number);
      const startMin = (sh ?? 0) * 60 + (sm ?? 0);
      const endMin = (eh ?? 0) * 60 + (em ?? 0);

      for (let m = startMin; m < endMin; m += step) {
        const slot = new Date(probe);
        slot.setHours(Math.floor(m / 60), m % 60, 0, 0);
        if (slot.getTime() > now.getTime()) return slot;
      }
    }
    return null;
  }

  time(value: string): string {
    return toMeridiem(value);
  }

  isDayOn(schedule: Schedule, day: number): boolean {
    return schedule.daysOfWeek.includes(day);
  }

  countEvents(areaId: number): number {
    return this.events().filter((e) => e.idArea === areaId).length;
  }

  routineName(idRoutine: number | null): string {
    if (!idRoutine) return 'Pausa libre';
    return this.routines().find((r) => r.id === idRoutine)?.name ?? `Rutina #${idRoutine}`;
  }

  toggleDay(day: number): void {
    const current = this.selectedDays();
    this.selectedDays.set(current.includes(day) ? current.filter((d) => d !== day) : [...current, day]);
  }

  resetFilters(): void {
    this.query.set('');
    this.filter.set('all');
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
    this.running.set(true);
    this.admin.runScheduler().subscribe({
      next: (res) => {
        this.running.set(false);
        this.message.set(`Ciclo ejecutado. Eventos emitidos: ${res.emitted}.`);
        this.load();
      },
      error: (err) => {
        this.running.set(false);
        this.error.set(apiError(err, 'No se pudo ejecutar el ciclo.'));
      },
    });
  }

  exportCsv(): void {
    const rows = this.filtered();
    if (rows.length === 0) return;
    const header = ['ID', 'Área', 'Rutina', 'Inicio', 'Fin', 'Frecuencia (min)', 'Duración (min)', 'Días', 'Estado'];
    const lines = rows.map((s) =>
      [
        s.id,
        `"${(s.areaName ?? '').replace(/"/g, '""')}"`,
        `"${this.routineName(s.idRoutine).replace(/"/g, '""')}"`,
        s.startTime,
        s.endTime,
        s.frequencyMinutes,
        s.durationMinutes,
        `"${s.daysOfWeek.map((d) => WEEKDAY_LABELS[d]).join(', ').replace(/"/g, '""')}"`,
        s.paused ? 'En pausa' : 'Activo',
      ].join(','),
    );
    const csv = '\uFEFF' + [header.join(','), ...lines].join('\n');
    downloadBlob(new Blob([csv], { type: 'text/csv;charset=utf-8;' }), 'cronogramas.csv');
  }

  /** Promedio real de la hora de inicio (o de fin) de los cronogramas filtrados. */
  private averageTime(start: boolean): string {
    const list = this.filtered();
    if (list.length === 0) return '—';
    const total = list.reduce((acc, s) => {
      const [h, m] = (start ? s.startTime : s.endTime).split(':').map(Number);
      return acc + (h ?? 0) * 60 + (m ?? 0);
    }, 0);
    const avg = Math.round(total / list.length);
    return toMeridiem(`${String(Math.floor(avg / 60)).padStart(2, '0')}:${String(avg % 60).padStart(2, '0')}`);
  }

  private relativeDay(target: Date, now: Date): string {
    const a = new Date(now);
    a.setHours(0, 0, 0, 0);
    const b = new Date(target);
    b.setHours(0, 0, 0, 0);
    const diff = Math.round((b.getTime() - a.getTime()) / 86_400_000);
    const clock = target.toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit', hour12: true });
    if (diff === 0) return `Hoy, ${clock}`;
    if (diff === 1) return `Mañana, ${clock}`;
    return `${target.toLocaleDateString('es-CO', { weekday: 'long' })}, ${clock}`;
  }
}