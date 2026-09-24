import { DatePipe } from '@angular/common';
import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ConsentItem, RetentionPreview } from '../../core/api.types';
import { AdminService } from '../../core/services/admin.service';
import { DialogService } from '../../core/services/dialog.service';
import { apiError } from '../../core/utils';
import { IconComponent } from '../../shared/icon.component';

@Component({
  selector: 'app-privacidad',
  imports: [DatePipe, FormsModule, IconComponent],
  template: `
    <section class="page">
      <header class="hero-navy">
        <div class="hero-row">
          <div>
            <h1>Privacidad</h1>
            <p>Habeas Data: consentimiento, retención y anonimización</p>
          </div>
          <button type="button" class="hero-btn" (click)="load()" aria-label="Actualizar">
            <app-icon name="refresh" [size]="20" />
          </button>
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
          <article class="card">
            <div class="card-head">
              <h3>Retención de datos</h3>
              <span class="tile-icon"><app-icon name="clock" [size]="20" /></span>
            </div>
            <div class="retention">
              <input class="input" type="number" min="1" max="120" [(ngModel)]="retentionMonths" aria-label="Meses de retención" />
              <span class="muted">meses</span>
              <button type="button" class="btn-ghost" (click)="saveRetention()">Guardar</button>
            </div>
            <p class="muted note">Se anonimizan los datos de trabajadores sin actividad dentro de esta ventana.</p>
          </article>

          <article class="card">
            <div class="card-head">
              <h3>Candidatos a anonimizar</h3>
              <span class="tile-icon red"><app-icon name="alert" [size]="20" /></span>
            </div>
            <b class="big">{{ preview()?.candidates?.length ?? 0 }}</b>
            <p class="muted note">Corte: {{ preview()?.cutoff | date: 'mediumDate' }}</p>
            <button type="button" class="btn-outline btn-sm" (click)="runRetention()">
              <app-icon name="trash" [size]="14" /> Ejecutar retención
            </button>
          </article>

          <article class="card">
            <div class="card-head">
              <h3>Consentimientos activos</h3>
              <span class="tile-icon green"><app-icon name="shield" [size]="20" /></span>
            </div>
            <b class="big">{{ activeConsents() }}</b>
            <p class="muted note">de {{ consents().length }} registros</p>
          </article>
        </div>

        <article class="card">
          <h2 class="section-title">Registro de consentimientos</h2>
          <div class="rows">
            @for (consent of consents(); track consent.id) {
              <div class="row-item">
                <div>
                  <b>{{ consent.userName ?? 'Trabajador #' + consent.idUser }}</b>
                  <small>
                    v{{ consent.version }} · Aceptado {{ consent.acceptedAt | date: 'short' }}
                    @if (consent.revokedAt) { · Revocado {{ consent.revokedAt | date: 'short' }} }
                  </small>
                </div>
                <span class="chip chip-sm" [class]="consent.revokedAt ? 'chip-muted' : 'chip-ok'">
                  {{ consent.revokedAt ? 'Revocado' : 'Activo' }}
                </span>
              </div>
            } @empty {
              <p class="empty">{{ loading() ? 'Cargando…' : 'No hay consentimientos registrados.' }}</p>
            }
          </div>
        </article>
      </div>
    </section>
  `,
  styles: `
    h3 { margin: 0; color: #0f172a; font-size: 15px; font-weight: 800; }
    .retention { display: grid; grid-template-columns: 90px auto 1fr; align-items: center; gap: 8px; margin-top: 16px; }
    .retention .btn-ghost { justify-self: end; }
    .note { margin: 8px 0 12px; font-size: 12px; }
    .big { display: block; margin-top: 12px; color: #1b2f8a; font-size: 36px; line-height: 1; }
    .tile-icon.red { background: #fff1f2; color: #e11d48; }
    .tile-icon.green { background: #ecfdf3; color: #16a34a; }
  `,
})
export class PrivacidadComponent implements OnInit {
  private readonly admin = inject(AdminService);
  private readonly dialog = inject(DialogService);

  readonly consents = signal<ConsentItem[]>([]);
  readonly preview = signal<RetentionPreview | null>(null);
  readonly loading = signal(false);
  readonly message = signal('');
  readonly error = signal('');
  retentionMonths = 24;

  readonly activeConsents = computed(() => this.consents().filter((c) => !c.revokedAt).length);

  ngOnInit(): void {
    this.load();
  }

  load(): void {
    this.loading.set(true);
    this.admin.getConsents().subscribe({
      next: (c) => {
        this.consents.set(c);
        this.loading.set(false);
      },
      error: (err) => {
        this.error.set(apiError(err, 'No se pudieron cargar los consentimientos.'));
        this.loading.set(false);
      },
    });
    this.admin.getRetentionPreview().subscribe({
      next: (p) => {
        this.preview.set(p);
        this.retentionMonths = p.retentionMonths;
      },
      error: () => undefined,
    });
  }

  saveRetention(): void {
    this.message.set('');
    this.error.set('');
    this.admin.updateConfig({ retentionMonths: Number(this.retentionMonths) }).subscribe({
      next: () => {
        this.message.set('Política de retención actualizada.');
        this.load();
      },
      error: (err) => this.error.set(apiError(err, 'No se pudo actualizar la retención.')),
    });
  }

  runRetention(): void {
    this.dialog
      .confirm({
        title: 'Aplicar retención',
        message: '¿Anonimizar los datos de los trabajadores fuera de la ventana de retención? No se puede deshacer.',
        danger: true,
        confirmLabel: 'Aplicar',
      })
      .subscribe((ok) => {
        if (!ok) return;
        this.message.set('');
        this.error.set('');
        this.admin.runRetention().subscribe({
          next: (res) => {
            this.message.set(`Retención aplicada. Registros anonimizados: ${res.anonymized}.`);
            this.load();
          },
          error: (err) => this.error.set(apiError(err, 'No se pudo aplicar la retención.')),
        });
      });
  }
}
