import { HttpErrorResponse } from '@angular/common/http';
import { environment } from '../../environments/environment';

/** Convierte una ruta del backend (/api/uploads/...) en URL absoluta. */
export function assetUrl(path: string): string {
  if (/^(https?:|blob:|data:)/.test(path)) return path;
  return `${environment.apiUrl}${path.startsWith('/') ? '' : '/'}${path}`;
}

/** Mensaje legible a partir de un error HTTP del backend. */
export function apiError(err: unknown, fallback: string): string {
  if (err instanceof HttpErrorResponse) {
    if (err.status === 0) return 'No hay conexión con el servidor. Verifica que el backend esté activo.';
    const body = err.error as { error?: string; message?: string } | null;
    return body?.error ?? body?.message ?? fallback;
  }
  return fallback;
}

export function downloadBlob(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

export function minutesFromTime(value: string): number {
  const [h, m] = value.split(':');
  return Number(h ?? 0) * 60 + Number(m ?? 0);
}

export function timeFromMinutes(total: number): string {
  const normalized = ((total % 1440) + 1440) % 1440;
  return `${String(Math.floor(normalized / 60)).padStart(2, '0')}:${String(normalized % 60).padStart(2, '0')}`;
}

/** "14:30" → "02:30 p.m." (formato usado en el diseño de main). */
export function toMeridiem(time: string): string {
  const minutes = minutesFromTime(time);
  const h24 = Math.floor(minutes / 60);
  const h12 = h24 % 12 === 0 ? 12 : h24 % 12;
  return `${String(h12).padStart(2, '0')}:${String(minutes % 60).padStart(2, '0')} ${h24 < 12 ? 'a.m.' : 'p.m.'}`;
}

/** Hora local HH:mm de una fecha ISO. */
export function localTime(iso: string): string {
  const d = new Date(iso);
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
}

export function isSameLocalDay(iso: string, day: Date): boolean {
  const d = new Date(iso);
  return d.getFullYear() === day.getFullYear() && d.getMonth() === day.getMonth() && d.getDate() === day.getDate();
}

export function startOfDay(date: Date): Date {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
}

/** Fecha de hoy a la hora indicada (HH:mm), en hora local. */
export function todayAt(time: string): Date {
  const d = startOfDay(new Date());
  d.setMinutes(minutesFromTime(time));
  return d;
}

export function isWithinRange(time: string, start: string, end: string): boolean {
  const value = minutesFromTime(time);
  const from = minutesFromTime(start);
  const to = minutesFromTime(end);
  return from <= to ? value >= from && value < to : value >= from || value < to;
}

export function formatDuration(seconds: number): string {
  if (seconds <= 0) return '—';
  if (seconds < 60) return `${seconds} s`;
  const minutes = Math.round(seconds / 60);
  return `${minutes} min`;
}

export const WEEKDAY_LABELS: Record<number, string> = {
  0: 'Dom',
  1: 'Lun',
  2: 'Mar',
  3: 'Mié',
  4: 'Jue',
  5: 'Vie',
  6: 'Sáb',
};
