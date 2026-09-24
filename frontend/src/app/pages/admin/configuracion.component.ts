import { DatePipe } from '@angular/common';
import { Component, OnInit, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Holiday } from '../../core/api.types';
import { AdminService } from '../../core/services/admin.service';
import { DialogService } from '../../core/services/dialog.service';
import { apiError } from '../../core/utils';
import { IconComponent } from '../../shared/icon.component';

@Component({
  selector: 'app-configuracion',
  imports: [DatePipe, ReactiveFormsModule, IconComponent],
  template: `
    <section class="page">
      <header class="hero-navy">
        <h1>Configuración</h1>
        <p>Parámetros institucionales del programa</p>
      </header>

      <div class="page-body">
        @if (message()) {
          <p class="alert alert-ok">{{ message() }}</p>
        }
        @if (error()) {
          <p class="alert alert-error">{{ error() }}</p>
        }

        <div class="grid-two">
          <form class="card form-grid" [formGroup]="form" (ngSubmit)="save()">
            <div class="card-head">
              <div>
                <h2>Parámetros generales</h2>
                <p>Aplican a todas las áreas</p>
              </div>
              <span class="tile-icon"><app-icon name="settings" [size]="20" /></span>
            </div>
            <div class="form-field-row">
              <label class="form-field">
                <span>Inicio almuerzo</span>
                <input class="input" type="time" formControlName="lunchStart" />
              </label>
              <label class="form-field">
                <span>Fin almuerzo</span>
                <input class="input" type="time" formControlName="lunchEnd" />
              </label>
            </div>
            <label class="form-field">
              <span>Máximo de aplazamientos por pausa</span>
              <input class="input" type="number" min="0" max="10" formControlName="maxPostponements" />
            </label>
            <label class="form-field">
              <span>Modo del dashboard</span>
              <select class="input" formControlName="dashboardMode">
                <option value="realtime">Tiempo real</option>
                <option value="batch">Por lote</option>
              </select>
            </label>
            <div class="form-actions">
              <button type="submit" class="btn-pill" [disabled]="form.invalid || saving()">
                <app-icon name="save" [size]="16" /> {{ saving() ? 'Guardando…' : 'Guardar' }}
              </button>
            </div>
          </form>

          <article class="card">
            <div class="card-head">
              <div>
                <h2>Días festivos</h2>
                <p>No se programan pausas en estas fechas</p>
              </div>
              <span class="tile-icon"><app-icon name="calendar" [size]="20" /></span>
            </div>
            <form class="holiday-form" [formGroup]="holidayForm" (ngSubmit)="addHoliday()">
              <input class="input" type="date" formControlName="date" aria-label="Fecha" />
              <input class="input" formControlName="name" placeholder="Nombre del festivo" />
              <label class="check">
                <input type="checkbox" formControlName="recurring" /> Anual
              </label>
              <button type="submit" class="btn-pill btn-sm" [disabled]="holidayForm.invalid">
                <app-icon name="plus" [size]="14" /> Agregar
              </button>
            </form>
            <div class="rows list">
              @for (holiday of holidays(); track holiday.id) {
                <div class="row-item">
                  <div>
                    <b>{{ holiday.name }}</b>
                    <small>{{ holiday.date | date: 'longDate' }}{{ holiday.recurring ? ' · anual' : '' }}</small>
                  </div>
                  <button type="button" class="icon-btn danger" (click)="removeHoliday(holiday)" aria-label="Eliminar">
                    <app-icon name="trash" [size]="16" />
                  </button>
                </div>
              } @empty {
                <p class="empty">No hay festivos registrados.</p>
              }
            </div>
          </article>
        </div>
      </div>
    </section>
  `,
  styles: `
    .grid-two { display: grid; gap: 14px; align-items: start; }
    .holiday-form { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; margin: 16px 0 8px; }
    .holiday-form .input:nth-child(2) { grid-column: span 1; }
    .check { display: flex; align-items: center; gap: 6px; color: #475569; font-size: 13px; font-weight: 700; }
    .list { max-height: 340px; overflow-y: auto; }
    @media (min-width: 1000px) { .grid-two { grid-template-columns: 1fr 1fr; gap: 20px; } }
  `,
})
export class ConfiguracionComponent implements OnInit {
  private readonly admin = inject(AdminService);
  private readonly fb = inject(FormBuilder);
  private readonly dialog = inject(DialogService);

  readonly holidays = signal<Holiday[]>([]);
  readonly saving = signal(false);
  readonly message = signal('');
  readonly error = signal('');

  readonly form = this.fb.nonNullable.group({
    lunchStart: ['12:00', Validators.required],
    lunchEnd: ['14:00', Validators.required],
    maxPostponements: [2, [Validators.required, Validators.min(0), Validators.max(10)]],
    dashboardMode: ['realtime', Validators.required],
  });

  readonly holidayForm = this.fb.nonNullable.group({
    date: ['', Validators.required],
    name: ['', [Validators.required, Validators.minLength(3)]],
    recurring: [false],
  });

  ngOnInit(): void {
    this.admin.getConfig().subscribe({
      next: (config) =>
        this.form.patchValue({
          lunchStart: config.lunchStart,
          lunchEnd: config.lunchEnd,
          maxPostponements: config.maxPostponements,
          dashboardMode: config.dashboardMode,
        }),
      error: (err) => this.error.set(apiError(err, 'No se pudo cargar la configuración.')),
    });
    this.loadHolidays();
  }

  loadHolidays(): void {
    this.admin.getHolidays().subscribe({ next: (h) => this.holidays.set(h), error: () => undefined });
  }

  save(): void {
    if (this.form.invalid) return;
    this.saving.set(true);
    this.message.set('');
    this.error.set('');
    const raw = this.form.getRawValue();
    this.admin.updateConfig({ ...raw, maxPostponements: Number(raw.maxPostponements) }).subscribe({
      next: () => {
        this.saving.set(false);
        this.message.set('Configuración actualizada con éxito.');
      },
      error: (err) => {
        this.saving.set(false);
        this.error.set(apiError(err, 'No se pudo guardar la configuración.'));
      },
    });
  }

  addHoliday(): void {
    if (this.holidayForm.invalid) return;
    this.admin.createHoliday(this.holidayForm.getRawValue()).subscribe({
      next: () => {
        this.holidayForm.reset({ date: '', name: '', recurring: false });
        this.loadHolidays();
      },
      error: (err) => this.error.set(apiError(err, 'No se pudo registrar el festivo.')),
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
}
