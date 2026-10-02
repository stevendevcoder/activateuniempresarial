import { DatePipe } from '@angular/common';
import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ConsentItem, RetentionPreview } from '../../core/api.types';
import { AdminService } from '../../core/services/admin.service';
import { AnalyticsService } from '../../core/services/analytics.service';
import { AuthService } from '../../core/services/auth.service';
import { DialogService } from '../../core/services/dialog.service';
import { apiError, downloadBlob, localTime } from '../../core/utils';

type ConsentFilter = 'all' | 'active' | 'revoked' | 'pending';

/** Filas por página del registro de consentimientos. */
const PAGE_SIZE = 8;

const AVATAR_BG = [
  'bg-blue-100 text-brand-900',
  'bg-violet-100 text-violet-900',
  'bg-amber-100 text-amber-900',
  'bg-emerald-100 text-emerald-900',
  'bg-rose-100 text-rose-900',
  'bg-indigo-100 text-indigo-900',
];

@Component({
  selector: 'app-privacidad',
  imports: [DatePipe, FormsModule],
  templateUrl: './privacidad.component.html',
  styleUrl: './privacidad.component.scss',
})
export class PrivacidadComponent implements OnInit {
  private readonly admin = inject(AdminService);
  private readonly analytics = inject(AnalyticsService);
  private readonly auth = inject(AuthService);
  private readonly dialog = inject(DialogService);

  readonly consents = signal<ConsentItem[]>([]);
  readonly preview = signal<RetentionPreview | null>(null);
  readonly loading = signal(false);
  readonly saving = signal(false);
  readonly applying = signal(false);
  readonly message = signal('');
  readonly error = signal('');
  readonly lastSync = signal('');

  /** Texto crudo del campo de meses (para no romper la vista con NaN). */
  readonly retentionInput = signal('24');
  readonly query = signal('');
  readonly statusFilter = signal<ConsentFilter>('all');
  readonly page = signal(1);

  readonly statusOptions: { value: ConsentFilter; label: string }[] = [
    { value: 'all', label: 'Estado: Todos' },
    { value: 'active', label: 'Firmado / Vigente' },
    { value: 'pending', label: 'Pendiente de firma' },
    { value: 'revoked', label: 'Revocado' },
  ];

  /** El backend exige el permiso privacy:manage para tocar retención y anonimizar. */
  readonly canManage = computed(() => this.auth.hasPermission('privacy:manage'));

  readonly roleLabel = computed(() => this.auth.user()?.roleName ?? 'Administrador');

  // ── Retención ──
  /** Meses válidos según la misma regla que aplica el backend (1–120). */
  readonly retentionMonths = computed(() => {
    const value = Number(this.retentionInput());
    return Number.isInteger(value) && value >= 1 && value <= 120 ? value : null;
  });

  readonly retentionValid = computed(() => this.retentionMonths() !== null);

  readonly retentionDirty = computed(() => {
    const saved = this.preview()?.retentionMonths;
    const current = this.retentionMonths();
    return saved !== undefined && current !== null && saved !== current;
  });

  readonly candidates = computed(() => this.preview()?.candidates ?? []);

  readonly cutoff = computed(() => this.preview()?.cutoff ?? null);

  // ── Consentimientos ──
  readonly activeConsents = computed(() => this.consents().filter((c) => c.accepted && !c.revokedAt).length);

  readonly revokedConsents = computed(() => this.consents().filter((c) => !!c.revokedAt).length);

  readonly pendingConsents = computed(() => this.consents().filter((c) => !c.accepted).length);

  /** Cobertura = consentimientos vigentes sobre el total de registros. */
  readonly coverage = computed(() => {
    const total = this.consents().length;
    if (total === 0) return 0;
    return Math.round((this.activeConsents() / total) * 100);
  });

  readonly hasFilters = computed(() => this.query().trim() !== '' || this.statusFilter() !== 'all');

  readonly filtered = computed(() => {
    const q = this.query().trim().toLowerCase();
    const status = this.statusFilter();
    return this.consents().filter((consent) => {
      if (status === 'active' && (!consent.accepted || !!consent.revokedAt)) return false;
      if (status === 'revoked' && !consent.revokedAt) return false;
      if (status === 'pending' && consent.accepted) return false;
      if (!q) return true;
      return (
        (consent.userName ?? '').toLowerCase().includes(q) ||
        String(consent.idUser).includes(q) ||
        (consent.version ?? '').toLowerCase().includes(q)
      );
    });
  });

  // ── Paginación del registro ──
  readonly totalPages = computed(() => Math.max(1, Math.ceil(this.filtered().length / PAGE_SIZE)));

  readonly currentPage = computed(() => Math.min(this.page(), this.totalPages()));

  readonly pageRows = computed(() => {
    const start = (this.currentPage() - 1) * PAGE_SIZE;
    return this.filtered().slice(start, start + PAGE_SIZE);
  });

  /** "1 a 8 de 24" — con la lista vacía devuelve "0 de 0". */
  readonly rangeLabel = computed(() => {
    const total = this.filtered().length;
    if (total === 0) return { from: 0, to: 0, total: 0 };
    const from = (this.currentPage() - 1) * PAGE_SIZE + 1;
    return { from, to: Math.min(from + PAGE_SIZE - 1, total), total };
  });

  /** Números de página visibles en el selector (máx. 5 ventanas). */
  readonly pageNumbers = computed(() => {
    const total = this.totalPages();
    const active = this.currentPage();
    const start = Math.max(1, Math.min(active - 2, total - 4));
    return Array.from({ length: Math.min(5, total) }, (_, i) => start + i);
  });

  ngOnInit(): void {
    this.load();
  }

  load(): void {
    this.loading.set(true);
    this.error.set('');
    this.lastSync.set(localTime(new Date().toISOString()));

    this.admin.getConsents().subscribe({
      next: (rows) => {
        this.consents.set(rows);
        this.loading.set(false);
      },
      error: (err) => {
        this.error.set(apiError(err, 'No se pudieron cargar los consentimientos.'));
        this.loading.set(false);
      },
    });

    this.admin.getRetentionPreview().subscribe({
      next: (data) => {
        this.preview.set(data);
        this.retentionInput.set(String(data.retentionMonths));
      },
      error: (err) => this.error.set(apiError(err, 'No se pudo calcular la ventana de retención.')),
    });
  }

  // ── Retención ──
  setRetention(value: string): void {
    this.retentionInput.set(value);
    this.page.set(1);
  }

  /** ▲ / ▼ del mockup: ajusta la ventana de retención dentro del rango del backend. */
  stepRetention(delta: number): void {
    const base = this.retentionMonths() ?? this.preview()?.retentionMonths ?? 24;
    const next = Math.min(120, Math.max(1, base + delta));
    this.retentionInput.set(String(next));
  }

  saveRetention(): void {
    const months = this.retentionMonths();
    if (months === null) {
      this.error.set('La retención debe ser un número entero entre 1 y 120 meses.');
      return;
    }
    this.saving.set(true);
    this.message.set('');
    this.error.set('');
    this.admin.updateConfig({ retentionMonths: months }).subscribe({
      next: () => {
        this.saving.set(false);
        this.message.set(`Política de retención actualizada a ${months} meses.`);
        this.load();
      },
      error: (err) => {
        this.saving.set(false);
        this.error.set(apiError(err, 'No se pudo actualizar la retención.'));
      },
    });
  }

  runRetention(): void {
    const pending = this.candidates().length;
    this.dialog
      .confirm({
        title: 'Aplicar retención',
        message: `Se anonimizarán los datos de ${pending} trabajador(es) sin actividad dentro de la ventana de retención. Esta acción no se puede deshacer.`,
        danger: true,
        confirmLabel: 'Aplicar',
      })
      .subscribe((ok) => {
        if (!ok) return;
        this.applying.set(true);
        this.message.set('');
        this.error.set('');
        this.admin.runRetention().subscribe({
          next: (res) => {
            this.applying.set(false);
            this.message.set(`Retención aplicada. Registros anonimizados: ${res.anonymized}.`);
            this.load();
          },
          error: (err) => {
            this.applying.set(false);
            this.error.set(apiError(err, 'No se pudo aplicar la retención.'));
          },
        });
      });
  }

  // ── Filtros ──
  setQuery(value: string): void {
    this.query.set(value);
    this.page.set(1);
  }

  setStatus(value: ConsentFilter): void {
    this.statusFilter.set(value);
    this.page.set(1);
  }

  resetFilters(): void {
    this.query.set('');
    this.statusFilter.set('all');
    this.page.set(1);
  }

  gotoPage(value: number): void {
    this.page.set(Math.min(Math.max(1, value), this.totalPages()));
  }

  nextPage(): void {
    this.gotoPage(this.currentPage() + 1);
  }

  prevPage(): void {
    this.gotoPage(this.currentPage() - 1);
  }

  // ── Presentación ──
  initials(name: string | null, fallbackId: number): string {
    const source = (name ?? '').trim();
    if (!source) return `#${fallbackId}`;
    return source
      .split(/\s+/)
      .slice(0, 2)
      .map((p) => p.charAt(0).toUpperCase())
      .join('');
  }

  avatarClass(consent: ConsentItem): string {
    return AVATAR_BG[consent.idUser % AVATAR_BG.length];
  }

  /** Estado del registro: revocado, pendiente de firma o vigente. */
  statusOf(consent: ConsentItem): 'active' | 'revoked' | 'pending' {
    if (consent.revokedAt) return 'revoked';
    return consent.accepted ? 'active' : 'pending';
  }

  statusLabel(consent: ConsentItem): string {
    const key = this.statusOf(consent);
    if (key === 'revoked') return 'Revocado';
    if (key === 'pending') return 'Sin aceptar';
    return 'Vigente';
  }

  statusChipClass(consent: ConsentItem): string {
    const key = this.statusOf(consent);
    if (key === 'revoked') return 'bg-rose-50 text-rose-700 border-rose-200';
    if (key === 'pending') return 'bg-amber-50 text-amber-700 border-amber-200';
    return 'bg-emerald-50 text-emerald-700 border-emerald-200';
  }

  statusDotClass(consent: ConsentItem): string {
    const key = this.statusOf(consent);
    if (key === 'revoked') return 'bg-rose-500';
    if (key === 'pending') return 'bg-amber-500';
    return 'bg-emerald-500';
  }

  // ── Exportaciones ──
  exportCsv(): void {
    const rows = this.filtered();
    if (rows.length === 0) return;
    const header = ['ID', 'Trabajador', 'ID usuario', 'Versión', 'Aceptado', 'Fecha de aceptación', 'Revocado', 'Estado'];
    const lines = rows.map((c) => [
      c.id,
      `"${(c.userName ?? `#${c.idUser}`).replace(/"/g, '""')}"`,
      c.idUser,
      `"${(c.version ?? '').replace(/"/g, '""')}"`,
      c.accepted ? 'Sí' : 'No',
      c.acceptedAt || '--',
      c.revokedAt ?? '--',
      this.statusLabel(c),
    ]);
    const csv = '\uFEFF' + [header.join(','), ...lines].join('\n');
    downloadBlob(new Blob([csv], { type: 'text/csv;charset=utf-8;' }), 'registro-consentimientos.csv');
  }

  exportXlsx(): void {
    this.analytics.exportExcel().subscribe({
      next: (blob) => downloadBlob(blob, 'reporte-consentimientos.xlsx'),
      error: (err) => this.error.set(apiError(err, 'No se pudo exportar el reporte.')),
    });
  }

  exportPdf(): void {
    this.analytics.exportPdf().subscribe({
      next: (blob) => downloadBlob(blob, 'reporte-consentimientos.pdf'),
      error: (err) => this.error.set(apiError(err, 'No se pudo exportar el reporte.')),
    });
  }
}
