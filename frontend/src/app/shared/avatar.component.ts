import { Component, Input } from '@angular/core';
import { assetUrl } from '../core/utils';

const KINDS = ['sharit', 'laura', 'carlos', 'maria'];

/** Ilustración estable para un usuario sin foto. */
export function avatarKind(id: number | null | undefined, admin = false): string {
  if (admin) return 'admin';
  return KINDS[Math.abs(id ?? 0) % KINDS.length];
}

@Component({
  selector: 'app-avatar',
  template: `
    <div
      class="overflow-hidden rounded-full shrink-0"
      [style.width.px]="size"
      [style.height.px]="size"
      [style.background]="bg"
    >
      @if (photoUrl) {
        <img [src]="photoUrl" alt="" />
      } @else {
      <svg viewBox="0 0 80 80" aria-hidden="true">
        <rect width="80" height="80" [attr.fill]="bg" />
        <circle cx="40" cy="30" r="14" [attr.fill]="skin" />
        @if (kind === 'sharit') {
          <path d="M22 28c4-18 32-18 36 2-8 4-28 4-36-2z" fill="#2b2118" />
          <path d="M20 34c0-10 8-16 12-10" fill="#e11d48" />
          <path d="M18 58c6-10 38-10 44 0v22H18z" fill="#d97706" />
        } @else if (kind === 'laura') {
          <path d="M18 34c2-20 42-20 44 2-6 12-32 12-44-2z" fill="#3f2a1d" />
          <path d="M16 58c8-12 40-12 48 0v22H16z" fill="#e7d3b8" />
        } @else if (kind === 'carlos') {
          <path d="M24 24c8-12 28-12 34 4H24z" fill="#2c241c" />
          <rect x="24" y="32" width="32" height="6" rx="2" fill="#111827" />
          <path d="M30 44c6 8 16 8 22 0" fill="#3f2a1d" />
          <path d="M18 58c8-10 36-10 44 0v22H18z" fill="#1e3a5f" />
        } @else if (kind === 'maria') {
          <path d="M16 40c4-24 44-24 48 2-10 8-38 8-48-2z" fill="#1f140e" />
          <path d="M18 58c8-10 36-10 44 0v22H18z" fill="#166534" />
        } @else {
          <path d="M22 26c8-14 30-14 36 4H22z" fill="#1e293b" />
          <path d="M18 58c8-10 36-10 44 0v22H18z" fill="#1b2f8a" />
        }
      </svg>
      }
    </div>
  `,
  styles: `
    :host { display: inline-flex; line-height: 0; flex-shrink: 0; }
    div { overflow: hidden; border-radius: 50%; }
    svg, img { width: 100%; height: 100%; display: block; }
    img { object-fit: cover; }
  `,
})
export class AvatarComponent {
  @Input() kind = 'sharit';
  @Input() size = 52;
  @Input() photo: string | null | undefined = null;

  get photoUrl(): string | null {
    return this.photo ? assetUrl(this.photo) : null;
  }

  get skin(): string {
    return this.kind === 'sharit' ? '#8d5b3b' : '#f0c7a0';
  }

  get bg(): string {
    const map: Record<string, string> = {
      sharit: '#fde68a',
      laura: '#f5e6d3',
      carlos: '#dbeafe',
      maria: '#dcfce7',
      admin: '#e0e7ff',
    };
    return map[this.kind] ?? '#e0e7ff';
  }
}
