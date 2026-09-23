import { Component, inject } from '@angular/core';
import { LucideAngularModule, AlertTriangle, X } from 'lucide-angular';
import { DialogService } from './dialog.service';

@Component({
  selector: 'app-dialog',
  imports: [LucideAngularModule],
  template: `
    @if (dialog.state(); as state) {
      <div class="fixed inset-0 z-[60] flex items-center justify-center p-4" role="alertdialog" aria-modal="true" aria-labelledby="dialog-title">
        <div class="absolute inset-0 bg-black/50" (click)="dialog.close(false)"></div>
        <div class="relative bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6">
          <div class="flex items-start gap-3">
            <div class="shrink-0 w-10 h-10 rounded-xl flex items-center justify-center"
                 [class]="state.options.danger ? 'bg-brand-soft-red text-brand-red' : 'bg-brand-soft-blue text-brand-blue'">
              <lucide-angular [img]="ic.AlertTriangle" class="w-5 h-5"></lucide-angular>
            </div>
            <div class="flex-1 min-w-0">
              <h2 id="dialog-title" class="text-base font-extrabold text-slate-800">{{ state.options.title }}</h2>
              <p class="text-sm text-slate-500 mt-1 leading-relaxed">{{ state.options.message }}</p>
            </div>
            <button type="button" (click)="dialog.close(false)"
                    class="p-1.5 rounded-lg text-slate-400 hover:bg-slate-100 transition-colors">
              <lucide-angular [img]="ic.X" class="w-4 h-4"></lucide-angular>
            </button>
          </div>
          <div class="flex justify-end gap-2 mt-5">
            @if (state.options.type === 'confirm') {
              <button type="button" (click)="dialog.close(false)"
                      class="px-4 py-2.5 rounded-xl border border-slate-200 text-sm font-bold text-slate-600 hover:bg-slate-50 transition-colors">
                {{ state.options.cancelLabel ?? 'Cancelar' }}
              </button>
            }
            <button type="button" (click)="dialog.close(true)"
                    class="px-4 py-2.5 rounded-xl text-sm font-bold text-white shadow-sm transition-colors"
                    [class]="state.options.danger ? 'bg-brand-red hover:bg-brand-red/90' : 'bg-brand-blue hover:bg-brand-blue-dark'">
              {{ state.options.type === 'confirm'
                    ? (state.options.confirmLabel ?? (state.options.danger ? 'Eliminar' : 'Aceptar'))
                    : (state.options.confirmLabel ?? 'Aceptar') }}
            </button>
          </div>
        </div>
      </div>
    }
  `,
})
export class DialogComponent {
  protected readonly dialog = inject(DialogService);
  protected readonly ic = { AlertTriangle, X };
}