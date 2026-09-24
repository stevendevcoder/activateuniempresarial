import { Component, inject } from '@angular/core';
import { DialogService } from '../core/services/dialog.service';
import { IconComponent } from './icon.component';

@Component({
  selector: 'app-dialog',
  imports: [IconComponent],
  template: `
    @if (dialog.state(); as state) {
      <div class="modal-backdrop" (click)="dialog.close(false)">
        <div
          class="modal dialog"
          role="alertdialog"
          aria-modal="true"
          aria-labelledby="dialog-title"
          (click)="$event.stopPropagation()"
        >
          <span class="badge" [class.danger]="state.options.danger">
            <app-icon [name]="state.options.danger ? 'alert' : 'info'" [size]="22" />
          </span>
          <h2 id="dialog-title">{{ state.options.title }}</h2>
          <p>{{ state.options.message }}</p>
          <div class="actions">
            @if (state.options.type === 'confirm') {
              <button type="button" class="btn-outline" (click)="dialog.close(false)">
                {{ state.options.cancelLabel ?? 'Cancelar' }}
              </button>
            }
            <button type="button" class="btn-pill" [class.btn-danger]="state.options.danger" (click)="dialog.close(true)">
              {{ state.options.confirmLabel ?? (state.options.danger ? 'Eliminar' : 'Aceptar') }}
            </button>
          </div>
        </div>
      </div>
    }
  `,
  styles: `
    .dialog { text-align: center; }
    .badge {
      display: inline-grid;
      place-items: center;
      width: 52px;
      height: 52px;
      border-radius: 50%;
      background: #eef2ff;
      color: #1b2f8a;
    }
    .badge.danger { background: #fff1f2; color: #e11d48; }
    h2 { margin: 12px 0 6px; color: #0f172a; font-size: 18px; font-weight: 800; }
    p { margin: 0 auto; max-width: 360px; color: #64748b; font-size: 14px; line-height: 1.45; }
    .actions { display: grid; grid-auto-flow: column; grid-auto-columns: 1fr; gap: 10px; margin-top: 20px; }
    @media (min-width: 900px) { .dialog { max-width: 420px; } }
  `,
})
export class DialogComponent {
  protected readonly dialog = inject(DialogService);
}
