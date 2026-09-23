import { Component, OnInit, inject, signal } from '@angular/core';
import { DatePipe } from '@angular/common';
import { LucideAngularModule, ShieldCheck, RefreshCw, Trash2, FileWarning, UserCheck } from 'lucide-angular';
import { AdminService } from '../admin.service';
import { ConsentItem, RetentionPreview } from '../admin.types';
import { DialogService } from '../../shared/dialog/dialog.service';

@Component({
  selector: 'app-privacy',
  imports: [DatePipe, LucideAngularModule],
  template: `
    <div class="space-y-5">
      <div class="flex items-center gap-3">
        <div class="w-11 h-11 rounded-2xl bg-brand-blue flex items-center justify-center text-white shadow-md">
          <lucide-angular [img]="ic.ShieldCheck" class="w-6 h-6"></lucide-angular>
        </div>
        <div>
          <h1 class="text-xl font-extrabold text-brand-blue tracking-tight">Privacidad y Habeas Data</h1>
          <p class="text-sm text-slate-500">Consentimiento, retención y anonimización (EP16)</p>
        </div>
      </div>

      @if (message()) {
        <div class="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-700 font-medium">{{ message() }}</div>
      }
      @if (error()) {
        <div class="p-3.5 rounded-xl bg-brand-soft-red border border-brand-red/20 text-xs text-brand-red font-medium">{{ error() }}</div>
      }

      <div class="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div class="rounded-2xl border border-brand-soft-blue bg-white p-5 shadow-sm">
          <div class="flex items-center gap-2 mb-3">
            <lucide-angular [img]="ic.FileWarning" class="w-4 h-4 text-brand-blue"></lucide-angular>
            <h3 class="text-sm font-bold text-slate-800">Retención de datos</h3>
          </div>
          <div class="flex items-end gap-2 mb-3">
            <input type="number" min="1" max="120" [value]="retentionMonths()" (input)="retentionMonths.set(+$any($event.target).value)"
                   class="w-24 px-3 py-2 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-brand-blue" />
            <span class="text-sm text-slate-500 pb-2">meses</span>
            <button (click)="saveRetention()"
                    class="ml-auto px-3 py-2 rounded-xl bg-brand-blue text-white text-xs font-bold hover:bg-brand-blue-dark">
              Guardar
            </button>
          </div>
          <p class="text-xs text-slate-500">Se anonimizan los datos personales de trabajadores sin actividad dentro de la ventana.</p>
        </div>

        <div class="rounded-2xl border border-brand-soft-blue bg-white p-5 shadow-sm">
          <div class="flex items-center gap-2 mb-3">
            <lucide-angular [img]="ic.UserCheck" class="w-4 h-4 text-brand-blue"></lucide-angular>
            <h3 class="text-sm font-bold text-slate-800">Candidatos a anonimizar</h3>
          </div>
          <p class="text-4xl font-extrabold text-brand-blue">{{ preview()?.candidates?.length ?? 0 }}</p>
          <p class="text-xs text-slate-500 mt-1">Corte: {{ preview()?.cutoff | date:'mediumDate' }}</p>
          <button (click)="runRetention()"
                  class="mt-3 inline-flex items-center gap-2 px-3 py-2 rounded-xl border border-slate-200 text-brand-blue text-xs font-bold hover:bg-brand-soft-blue">
            <lucide-angular [img]="ic.Trash2" class="w-3.5 h-3.5"></lucide-angular>
            Ejecutar retención
          </button>
        </div>

        <div class="rounded-2xl border border-brand-soft-blue bg-white p-5 shadow-sm">
          <div class="flex items-center gap-2 mb-3">
            <lucide-angular [img]="ic.ShieldCheck" class="w-4 h-4 text-brand-blue"></lucide-angular>
            <h3 class="text-sm font-bold text-slate-800">Consentimientos activos</h3>
          </div>
          <p class="text-4xl font-extrabold text-brand-blue">{{ activeConsents() }}</p>
          <p class="text-xs text-slate-500 mt-1">de {{ consents().length }} registros</p>
          <button (click)="load()"
                  class="mt-3 inline-flex items-center gap-2 px-3 py-2 rounded-xl border border-slate-200 text-slate-600 text-xs font-bold hover:bg-slate-50">
            <lucide-angular [img]="ic.RefreshCw" class="w-3.5 h-3.5"></lucide-angular>
            Actualizar
          </button>
        </div>
      </div>

      <div class="rounded-2xl border border-brand-soft-blue bg-white shadow-sm overflow-hidden">
        <div class="px-5 py-4 border-b border-brand-soft-blue">
          <h3 class="text-sm font-bold text-slate-800">Registro de consentimientos</h3>
        </div>
        <div class="overflow-x-auto">
          <table class="w-full text-sm">
            <thead>
              <tr class="border-b border-brand-soft-blue bg-brand-surface/50">
                <th class="text-left px-5 py-3 font-semibold text-slate-500">Trabajador</th>
                <th class="text-left px-5 py-3 font-semibold text-slate-500">Versión</th>
                <th class="text-left px-5 py-3 font-semibold text-slate-500">Aceptado</th>
                <th class="text-left px-5 py-3 font-semibold text-slate-500">Revocado</th>
                <th class="text-center px-5 py-3 font-semibold text-slate-500">Estado</th>
              </tr>
            </thead>
            <tbody>
              @for (consent of consents(); track consent.id) {
                <tr class="border-b border-brand-soft-blue/60 hover:bg-brand-surface/50 transition-colors">
                  <td class="px-5 py-3 font-semibold text-slate-800">{{ consent.userName ?? ('#' + consent.idUser) }}</td>
                  <td class="px-5 py-3 text-slate-600">v{{ consent.version }}</td>
                  <td class="px-5 py-3 text-slate-600">{{ consent.acceptedAt | date:'short' }}</td>
                  <td class="px-5 py-3 text-slate-600">{{ consent.revokedAt ? (consent.revokedAt | date:'short') : '—' }}</td>
                  <td class="px-5 py-3 text-center">
                    <span class="inline-flex px-2 py-0.5 rounded-full text-xs font-bold"
                          [class]="consent.revokedAt ? 'bg-slate-100 text-slate-400' : 'bg-emerald-50 text-emerald-600'">
                      {{ consent.revokedAt ? 'Revocado' : 'Activo' }}
                    </span>
                  </td>
                </tr>
              } @empty {
                <tr>
                  <td colspan="5" class="px-5 py-10 text-center text-sm text-slate-400">
                    {{ loading() ? 'Cargando…' : 'No hay consentimientos registrados' }}
                  </td>
                </tr>
              }
            </tbody>
          </table>
        </div>
      </div>
    </div>
  `,
})
export class PrivacyComponent implements OnInit {
  private readonly admin = inject(AdminService);
  private readonly dialog = inject(DialogService);

  readonly ic = { ShieldCheck, RefreshCw, Trash2, FileWarning, UserCheck };
  readonly consents = signal<ConsentItem[]>([]);
  readonly preview = signal<RetentionPreview | null>(null);
  readonly retentionMonths = signal(24);
  readonly loading = signal(false);
  readonly message = signal('');
  readonly error = signal('');

  ngOnInit(): void {
    this.load();
  }

  activeConsents(): number {
    return this.consents().filter((c) => !c.revokedAt).length;
  }

  load(): void {
    this.loading.set(true);
    this.admin.getConsents().subscribe({
      next: (c) => {
        this.consents.set(c);
        this.loading.set(false);
      },
      error: () => {
        this.error.set('No se pudieron cargar los consentimientos.');
        this.loading.set(false);
      },
    });
    this.admin.getRetentionPreview().subscribe({
      next: (p) => {
        this.preview.set(p);
        this.retentionMonths.set(p.retentionMonths);
      },
      error: () => undefined,
    });
  }

  saveRetention(): void {
    this.message.set('');
    this.error.set('');
    this.admin.updateConfig({ retentionMonths: this.retentionMonths() }).subscribe({
      next: () => {
        this.message.set('Política de retención actualizada.');
        this.load();
      },
      error: (err) => this.error.set(err?.error?.error ?? 'No se pudo actualizar la retención.'),
    });
  }

  runRetention(): void {
    this.dialog.confirm({
      title: 'Aplicar retención',
      message: '¿Anonimizar los datos de los trabajadores fuera de la ventana de retención?',
      danger: true,
      confirmLabel: 'Aplicar',
    }).subscribe((ok) => {
      if (!ok) return;
      this.message.set('');
      this.error.set('');
      this.admin.runRetention().subscribe({
        next: (res) => {
          this.message.set(`Retención aplicada. Registros anonimizados: ${res.anonymized}.`);
          this.load();
        },
        error: () => this.error.set('No se pudo aplicar la retención.'),
      });
    });
  }
}
