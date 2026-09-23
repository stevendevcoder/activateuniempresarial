import { Component, OnInit, inject, signal } from '@angular/core';
import { DatePipe } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { LucideAngularModule, Settings, Save, Plus, Trash2, CalendarOff } from 'lucide-angular';
import { AdminService } from '../admin.service';
import { Holiday } from '../admin.types';
import { DialogService } from '../../shared/dialog/dialog.service';

@Component({
  selector: 'app-config',
  imports: [DatePipe, ReactiveFormsModule, LucideAngularModule],
  template: `
    <div class="space-y-5">
      <div class="flex items-center gap-3">
        <div class="w-11 h-11 rounded-2xl bg-brand-blue flex items-center justify-center text-white shadow-md">
          <lucide-angular [img]="ic.Settings" class="w-6 h-6"></lucide-angular>
        </div>
        <div>
          <h1 class="text-xl font-extrabold text-brand-blue tracking-tight">Configuración global</h1>
          <p class="text-sm text-slate-500">Parámetros institucionales (EP15)</p>
        </div>
      </div>

      @if (message()) {
        <div class="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-700 font-medium">{{ message() }}</div>
      }
      @if (error()) {
        <div class="p-3.5 rounded-xl bg-brand-soft-red border border-brand-red/20 text-xs text-brand-red font-medium">{{ error() }}</div>
      }

      <div class="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div class="rounded-2xl border border-brand-soft-blue bg-white p-5 shadow-sm">
          <h3 class="text-sm font-bold text-slate-800 mb-4">Parámetros generales</h3>
          <form [formGroup]="form" (ngSubmit)="save()" class="space-y-4">
            <div class="grid grid-cols-2 gap-4">
              <div>
                <label class="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">Inicio almuerzo</label>
                <input type="time" formControlName="lunchStart" class="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-brand-blue" />
              </div>
              <div>
                <label class="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">Fin almuerzo</label>
                <input type="time" formControlName="lunchEnd" class="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-brand-blue" />
              </div>
            </div>
            <div>
              <label class="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">Máximo de aplazamientos</label>
              <input type="number" min="0" max="10" formControlName="maxPostponements"
                     class="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-brand-blue" />
            </div>
            <div>
              <label class="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">Modo del dashboard</label>
              <select formControlName="dashboardMode" class="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-brand-blue">
                <option value="realtime">Tiempo real</option>
                <option value="batch">Por lote</option>
              </select>
            </div>
            <div class="flex justify-end">
              <button type="submit" [disabled]="form.invalid || saving()"
                      class="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-brand-blue text-white text-sm font-bold hover:bg-brand-blue-dark disabled:opacity-60">
                <lucide-angular [img]="ic.Save" class="w-4 h-4"></lucide-angular>
                {{ saving() ? 'Guardando…' : 'Guardar' }}
              </button>
            </div>
          </form>
        </div>

        <div class="rounded-2xl border border-brand-soft-blue bg-white p-5 shadow-sm">
          <div class="flex items-center gap-2 mb-4">
            <lucide-angular [img]="ic.CalendarOff" class="w-4 h-4 text-brand-blue"></lucide-angular>
            <h3 class="text-sm font-bold text-slate-800">Días festivos</h3>
          </div>

          <form [formGroup]="holidayForm" (ngSubmit)="addHoliday()" class="flex flex-wrap gap-2 mb-4">
            <input type="date" formControlName="date" class="px-3 py-2 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-brand-blue" />
            <input formControlName="name" placeholder="Nombre" class="flex-1 min-w-32 px-3 py-2 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-brand-blue" />
            <label class="flex items-center gap-1.5 text-xs text-slate-600">
              <input type="checkbox" formControlName="recurring" class="rounded text-brand-blue" /> Anual
            </label>
            <button type="submit" [disabled]="holidayForm.invalid"
                    class="inline-flex items-center gap-1 px-3 py-2 rounded-xl bg-brand-blue text-white text-sm font-bold hover:bg-brand-blue-dark disabled:opacity-60">
              <lucide-angular [img]="ic.Plus" class="w-4 h-4"></lucide-angular>
            </button>
          </form>

          <div class="space-y-2 max-h-72 overflow-y-auto">
            @for (holiday of holidays(); track holiday.id) {
              <div class="flex items-center justify-between px-3 py-2 rounded-xl bg-brand-surface border border-brand-soft-blue">
                <div>
                  <p class="text-sm font-semibold text-slate-800">{{ holiday.name }}</p>
                  <p class="text-xs text-slate-500">{{ holiday.date | date:'longDate' }} {{ holiday.recurring ? '· anual' : '' }}</p>
                </div>
                <button (click)="removeHoliday(holiday)" class="p-2 rounded-lg text-slate-400 hover:text-brand-red hover:bg-brand-soft-red">
                  <lucide-angular [img]="ic.Trash2" class="w-4 h-4"></lucide-angular>
                </button>
              </div>
            } @empty {
              <p class="text-center text-sm text-slate-400 py-6">No hay festivos registrados</p>
            }
          </div>
        </div>
      </div>
    </div>
  `,
})
export class ConfigComponent implements OnInit {
  private readonly admin = inject(AdminService);
  private readonly fb = inject(FormBuilder);
  private readonly dialog = inject(DialogService);

  readonly ic = { Settings, Save, Plus, Trash2, CalendarOff };
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
      next: (config) => this.form.patchValue(config),
      error: () => this.error.set('No se pudo cargar la configuración.'),
    });
    this.loadHolidays();
  }

  loadHolidays(): void {
    this.admin.getHolidays().subscribe({
      next: (h) => this.holidays.set(h),
      error: () => undefined,
    });
  }

  save(): void {
    if (this.form.invalid) return;
    this.saving.set(true);
    this.message.set('');
    this.error.set('');
    this.admin.updateConfig(this.form.getRawValue()).subscribe({
      next: () => {
        this.saving.set(false);
        this.message.set('Configuración actualizada con éxito.');
      },
      error: (err) => {
        this.saving.set(false);
        this.error.set(err?.error?.error ?? 'No se pudo guardar la configuración.');
      },
    });
  }

  addHoliday(): void {
    if (this.holidayForm.invalid) return;
    const raw = this.holidayForm.getRawValue();
    this.admin.createHoliday(raw).subscribe({
      next: () => {
        this.holidayForm.reset({ date: '', name: '', recurring: false });
        this.loadHolidays();
      },
      error: (err) => this.error.set(err?.error?.error ?? 'No se pudo registrar el festivo.'),
    });
  }

  removeHoliday(holiday: Holiday): void {
    this.dialog.confirm({
      title: 'Eliminar festivo',
      message: `¿Eliminar el festivo ${holiday.name}?`,
      danger: true,
      confirmLabel: 'Eliminar',
    }).subscribe((ok) => {
      if (!ok) return;
      this.admin.deleteHoliday(holiday.id).subscribe({
        next: () => this.loadHolidays(),
        error: () => this.error.set('No se pudo eliminar el festivo.'),
      });
    });
  }
}
