import { DatePipe } from '@angular/common';
import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { FormBuilder, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { GlobalConfig, Holiday } from '../../core/api.types';
import { AdminService } from '../../core/services/admin.service';
import { DialogService } from '../../core/services/dialog.service';
import { apiError, downloadBlob, minutesFromTime, toMeridiem } from '../../core/utils';

const DASHBOARD_MODES: { value: GlobalConfig['dashboardMode']; label: string }[] = [
  { value: 'realtime', label: 'Tiempo real (Sincronización activa)' },
  { value: 'batch', label: 'Modo Ahorro de Recursos (Por lote)' },
];

/** El backend no expone preferencias de escritorio, así que se guardan en el navegador. */
const DESKTOP_NOTIFICATIONS_KEY = 'activate.admin.desktopNotifications';

@Component({
  selector: 'app-configuracion',
  imports: [DatePipe, FormsModule, ReactiveFormsModule],
  templateUrl: './configuracion.component.html',
  styleUrl: './configuracion.component.scss',
})
export class ConfiguracionComponent implements OnInit {
  private readonly admin = inject(AdminService);
  private readonly fb = inject(FormBuilder);
  private readonly dialog = inject(DialogService);

  readonly holidays = signal<Holiday[]>([]);
  readonly config = signal<GlobalConfig | null>(null);
  readonly loading = signal(false);
  readonly saving = signal(false);
  readonly addingHoliday = signal(false);
  readonly message = signal('');
  readonly error = signal('');

  readonly dashboardModes = DASHBOARD_MODES;

  readonly form = this.fb.nonNullable.group({
    lunchStart: ['12:00', Validators.required],
    lunchEnd: ['14:00', Validators.required],
    maxPostponements: [2, [Validators.required, Validators.min(0), Validators.max(10)]],
    dashboardMode: ['realtime' as GlobalConfig['dashboardMode'], Validators.required],
    desktopNotifications: [this.readDesktopNotifications(), Validators.required],
  });

  readonly holidayForm = this.fb.nonNullable.group({
    date: ['', Validators.required],
    name: ['', [Validators.required, Validators.minLength(3)]],
    recurring: [false],
  });

  /** Duración real de la franja de almuerzo a partir de los valores del formulario. */
  /** Espejo en signals de los dos horarios, para que los textos derivados reacconen al teclear. */
  readonly lunchStart = signal('12:00');
  readonly lunchEnd = signal('14:00');

  readonly lunchWindow = computed(() => {
    const start = this.lunchStart();
    const end = this.lunchEnd();
    if (!start || !end) return '';
    const diff = minutesFromTime(end) - minutesFromTime(start);
    if (diff <= 0) return 'Intervalo inválido: el fin de almuerzo debe ser posterior al inicio.';
    if (diff === 60) return 'Durante 1 hora quedan deshabilitadas las notificaciones sonoras.';
    const hours = diff / 60;
    const label = Number.isInteger(hours) ? `${hours} hora${hours === 1 ? '' : 's'}` : `${hours.toFixed(1)} horas`;
    return `Durante este intervalo (${label}) quedan deshabilitadas las notificaciones sonoras.`;
  });

  readonly lunchValid = computed(() => {
    const start = this.lunchStart();
    const end = this.lunchEnd();
    return !!start && !!end && minutesFromTime(end) > minutesFromTime(start);
  });

  readonly recurringCount = computed(() => this.holidays().filter((h) => h.recurring).length);

  readonly sortedHolidays = computed(() =>
    [...this.holidays()].sort((a, b) => a.date.localeCompare(b.date)),
  );

  constructor() {
    this.form.controls.lunchStart.valueChanges.subscribe((v) => this.lunchStart.set(v));
    this.form.controls.lunchEnd.valueChanges.subscribe((v) => this.lunchEnd.set(v));
  }

  ngOnInit(): void {
    this.loading.set(true);
    this.admin.getConfig().subscribe({
      next: (config) => {
        this.config.set(config);
        this.form.patchValue({
          lunchStart: config.lunchStart,
          lunchEnd: config.lunchEnd,
          maxPostponements: config.maxPostponements,
          dashboardMode: config.dashboardMode,
        });
        this.loading.set(false);
      },
      error: (err) => {
        this.error.set(apiError(err, 'No se pudo cargar la configuración.'));
        this.loading.set(false);
      },
    });
    this.loadHolidays();
  }

  loadHolidays(): void {
    this.admin.getHolidays().subscribe({ next: (h) => this.holidays.set(h), error: () => undefined });
  }

  save(): void {
    if (this.form.invalid || !this.lunchValid()) return;
    this.saving.set(true);
    this.message.set('');
    this.error.set('');
    const raw = this.form.getRawValue();
    this.admin
      .updateConfig({
        lunchStart: raw.lunchStart,
        lunchEnd: raw.lunchEnd,
        maxPostponements: Number(raw.maxPostponements),
        dashboardMode: raw.dashboardMode,
      })
      .subscribe({
        next: (res) => {
          this.writeDesktopNotifications(raw.desktopNotifications);
          this.saving.set(false);
          this.config.set(res.config);
          this.message.set('Parámetros guardados correctamente.');
        },
        error: (err) => {
          this.saving.set(false);
          this.error.set(apiError(err, 'No se pudo guardar la configuración.'));
        },
      });
  }

  /** Vuelve a los valores servidos por el backend y refresca la vista. */
  restore(): void {
    const config = this.config();
    if (!config) return;
    this.form.patchValue({
      lunchStart: config.lunchStart,
      lunchEnd: config.lunchEnd,
      maxPostponements: config.maxPostponements,
      dashboardMode: config.dashboardMode,
    });
    this.message.set('Valores restaurados a la última configuración guardada.');
    this.error.set('');
  }

  time(value: string): string {
    return toMeridiem(value);
  }

  addHoliday(): void {
    if (this.holidayForm.invalid) return;
    this.addingHoliday.set(true);
    this.error.set('');
    this.admin.createHoliday(this.holidayForm.getRawValue()).subscribe({
      next: () => {
        this.addingHoliday.set(false);
        this.holidayForm.reset({ date: '', name: '', recurring: false });
        this.loadHolidays();
      },
      error: (err) => {
        this.addingHoliday.set(false);
        this.error.set(apiError(err, 'No se pudo registrar el festivo.'));
      },
    });
  }

  removeHoliday(holiday: Holiday): void {
    this.dialog
      .confirm({ title: 'Eliminar festivo', message: `¿Eliminar el festivo ${holiday.name}?`, danger: true, confirmLabel: 'Eliminar' })
      .subscribe((ok) => {
        if (!ok) return;
        this.admin.deleteHoliday(holiday.id).subscribe({
          next: () => this.loadHolidays(),
          error: (err) => this.error.set(apiError(err, 'No se pudo eliminar el festivo.')),
        });
      });
  }

  private readDesktopNotifications(): boolean {
    try {
      return localStorage.getItem(DESKTOP_NOTIFICATIONS_KEY) !== 'false';
    } catch {
      return true;
    }
  }

  private writeDesktopNotifications(enabled: boolean): void {
    try {
      localStorage.setItem(DESKTOP_NOTIFICATIONS_KEY, String(enabled));
    } catch {
      /* almacenamiento no disponible: se ignora */
    }
  }

  exportCalendar(): void {
    const rows = this.sortedHolidays();
    if (rows.length === 0) return;
    const header = ['Fecha', 'Festivo', 'Repetir anualmente'];
    const lines = rows.map((h) => [
      h.date,
      `"${(h.name ?? '').replace(/"/g, '""')}"`,
      h.recurring ? 'Sí' : 'No',
    ]);
    const csv = '\uFEFF' + [header.join(','), ...lines].join('\n');
    downloadBlob(new Blob([csv], { type: 'text/csv;charset=utf-8;' }), 'dias-festivos.csv');
  }
}