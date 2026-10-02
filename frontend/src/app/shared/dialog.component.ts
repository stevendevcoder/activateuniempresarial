import { Component, inject } from '@angular/core';
import { DialogService } from '../core/services/dialog.service';
import { IconComponent } from './icon.component';

@Component({
  selector: 'app-dialog',
  imports: [IconComponent],
  template: `
    @if (dialog.state(); as state) {
      <div
        class="fixed inset-0 z-[100] flex items-center justify-center p-5 bg-slate-900/50 backdrop-blur-sm"
        (click)="dialog.close(false)"
      >
        <div
          class="w-full max-w-md rounded-3xl bg-white p-7 text-center shadow-2xl"
          role="alertdialog"
          aria-modal="true"
          aria-labelledby="dialog-title"
          (click)="$event.stopPropagation()"
        >
          <span
            class="inline-grid place-items-center w-14 h-14 rounded-full"
            [class]="state.options.danger ? 'bg-rose-50 text-rose-600' : 'bg-brand-50 text-brand-700'"
          >
            <app-icon [name]="state.options.danger ? 'alert' : 'info'" [size]="24" />
          </span>

          <h2 id="dialog-title" class="mt-3.5 text-lg font-extrabold tracking-tight text-slate-900">
            {{ state.options.title }}
          </h2>
          <p class="mt-2 mx-auto max-w-sm text-sm text-slate-500 leading-relaxed">{{ state.options.message }}</p>

          <div class="grid grid-cols-2 gap-3 mt-6">
            @if (state.options.type === 'confirm') {
              <button type="button" (click)="dialog.close(false)"
                class="px-4 py-3 min-h-12 rounded-xl bg-white text-slate-600 ring-1 ring-slate-200 text-sm font-bold hover:bg-slate-50 transition-colors">
                {{ state.options.cancelLabel ?? 'Cancelar' }}
              </button>
            }
            <button type="button" (click)="dialog.close(true)"
              class="px-4 py-3 min-h-12 rounded-xl text-white text-sm font-bold transition-colors"
              [class]="state.options.danger
                ? 'bg-rose-600 hover:bg-rose-700'
                : 'bg-brand-800 hover:bg-brand-900'"
              [class.col-span-2]="state.options.type !== 'confirm'">
              {{ state.options.confirmLabel ?? (state.options.danger ? 'Eliminar' : 'Aceptar') }}
            </button>
          </div>
        </div>
      </div>
    }
  `,
})
export class DialogComponent {
  protected readonly dialog = inject(DialogService);
}