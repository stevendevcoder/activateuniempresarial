import { Component, Input } from '@angular/core';

@Component({
  selector: 'app-icon',
  template: `
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
      @switch (name) {
        @case ('home') {
          <path d="M4 10.5 12 4l8 6.5V20a1 1 0 0 1-1 1h-5v-6H10v6H5a1 1 0 0 1-1-1z" />
        }
        @case ('clock') {
          <circle cx="12" cy="12" r="8" />
          <path d="M12 8v5l3 2" />
        }
        @case ('activity') {
          <path d="M3 12h4l2.5-7 5 14L17 12h4" />
        }
        @case ('user') {
          <circle cx="12" cy="8" r="3.2" />
          <path d="M5 19c1.4-3.2 3.8-5 7-5s5.6 1.8 7 5" />
        }
        @case ('grid') {
          <rect x="4" y="4" width="7" height="7" rx="1.5" />
          <rect x="13" y="4" width="7" height="7" rx="1.5" />
          <rect x="4" y="13" width="7" height="7" rx="1.5" />
          <rect x="13" y="13" width="7" height="7" rx="1.5" />
        }
        @case ('users') {
          <circle cx="9" cy="8" r="3" />
          <path d="M3.5 19c.8-3 2.6-4.5 5.5-4.5S14.2 16 15 19" />
          <circle cx="17" cy="9" r="2.4" />
          <path d="M16 19c.4-2 1.5-3.2 3.5-3.6" />
        }
        @case ('bars') {
          <path d="M5 19V10M12 19V5M19 19v-7" />
        }
        @case ('bell') {
          <path d="M6 16h12l-1.2-2.2a6.4 6.4 0 0 1-.8-3.2V9a4 4 0 1 0-8 0v1.6c0 1.1-.27 2.2-.8 3.2z" />
          <path d="M10 16v1a2 2 0 0 0 4 0v-1" />
        }
        @case ('mail') {
          <rect x="4" y="6" width="16" height="12" rx="2" />
          <path d="m4 8 8 6 8-6" />
        }
        @case ('lock') {
          <rect x="6" y="11" width="12" height="9" rx="2" />
          <path d="M8 11V8a4 4 0 0 1 8 0v3" />
        }
        @case ('eye') {
          <path d="M2 12s4-7 10-7 10 7 10 7-4 7-10 7S2 12 2 12z" />
          <circle cx="12" cy="12" r="3" />
        }
        @case ('eye-off') {
          <path d="M3 3l18 18" />
          <path d="M10.6 10.6A3 3 0 0 0 12 15a3 3 0 0 0 2.4-1.2" />
          <path d="M9.9 5.1A10.8 10.8 0 0 1 12 5c6 0 10 7 10 7a18.4 18.4 0 0 1-3.2 3.8" />
          <path d="M6.1 6.1C3.8 7.8 2 12 2 12s4 7 10 7c1.5 0 2.9-.3 4.1-.9" />
        }
        @case ('play') {
          <path d="M9 7.5v9l8-4.5z" fill="currentColor" stroke="none" />
        }
        @case ('check') {
          <path d="M5 12.5 9.5 17 19 7" />
        }
        @case ('calendar') {
          <rect x="4" y="6" width="16" height="14" rx="2" />
          <path d="M8 4v4M16 4v4M4 10h16" />
        }
        @case ('search') {
          <circle cx="11" cy="11" r="6" />
          <path d="m20 20-3.5-3.5" />
        }
        @case ('alert') {
          <path d="M12 4 3 19h18z" />
          <path d="M12 9v5M12 16v.5" />
        }
        @case ('arrow-left') {
          <path d="M15 5 8 12l7 7" />
        }
        @case ('arrow-right') {
          <path d="M9 5l7 7-7 7" />
        }
        @case ('moon') {
          <path d="M16 3a8 8 0 1 0 5 13 7 7 0 0 1-5-13z" />
        }
        @case ('logout') {
          <path d="M10 6H7a2 2 0 0 0-2 2v8a2 2 0 0 0 2 2h3" />
          <path d="m13 8 4 4-4 4M17 12H9" />
        }
        @case ('building') {
          <path d="M5 20V6l7-3 7 3v14" />
          <path d="M9 20v-6h6v6" />
        }
        @case ('plus') {
          <path d="M12 5v14M5 12h14" />
        }
        @case ('heart') {
          <path d="M12 19s-7-4.4-7-9.2A4 4 0 0 1 12 7a4 4 0 0 1 7 2.8C19 14.6 12 19 12 19z" />
        }
        @case ('edit') {
          <path d="M4 20h4L19 9a2.8 2.8 0 0 0-4-4L4 16z" />
          <path d="m13.5 6.5 4 4" />
        }
        @case ('trash') {
          <path d="M4 7h16M10 11v6M14 11v6" />
          <path d="M6 7l1 12a2 2 0 0 0 2 2h6a2 2 0 0 0 2-2l1-12M9 7V4h6v3" />
        }
        @case ('power') {
          <path d="M12 3v8" />
          <path d="M6.6 6.6a8 8 0 1 0 10.8 0" />
        }
        @case ('x') {
          <path d="M6 6l12 12M18 6 6 18" />
        }
        @case ('upload') {
          <path d="M12 16V4M7 9l5-5 5 5" />
          <path d="M5 16v3a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1v-3" />
        }
        @case ('download') {
          <path d="M12 4v12M7 11l5 5 5-5" />
          <path d="M5 16v3a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1v-3" />
        }
        @case ('film') {
          <rect x="4" y="4" width="16" height="16" rx="2" />
          <path d="M8 4v16M16 4v16M4 9h4M4 15h4M16 9h4M16 15h4" />
        }
        @case ('settings') {
          <circle cx="12" cy="12" r="3" />
          <path d="M19 12a7 7 0 0 0-.1-1.2l2-1.5-2-3.4-2.3.9a7 7 0 0 0-2-1.2L14.2 3h-4.4l-.4 2.6a7 7 0 0 0-2 1.2l-2.3-.9-2 3.4 2 1.5a7 7 0 0 0 0 2.4l-2 1.5 2 3.4 2.3-.9a7 7 0 0 0 2 1.2l.4 2.6h4.4l.4-2.6a7 7 0 0 0 2-1.2l2.3.9 2-3.4-2-1.5c.1-.4.1-.8.1-1.2z" />
        }
        @case ('shield') {
          <path d="M12 3 5 6v5c0 4.5 3 8.2 7 10 4-1.8 7-5.5 7-10V6z" />
          <path d="m9 12 2 2 4-4" />
        }
        @case ('refresh') {
          <path d="M20 11a8 8 0 0 0-14.7-4.3L4 8" />
          <path d="M4 4v4h4M4 13a8 8 0 0 0 14.7 4.3L20 16" />
          <path d="M20 20v-4h-4" />
        }
        @case ('zap') {
          <path d="M13 3 5 14h6l-1 7 8-11h-6z" />
        }
        @case ('pause') {
          <path d="M9 6v12M15 6v12" />
        }
        @case ('more') {
          <circle cx="6" cy="12" r="1.4" fill="currentColor" />
          <circle cx="12" cy="12" r="1.4" fill="currentColor" />
          <circle cx="18" cy="12" r="1.4" fill="currentColor" />
        }
        @case ('flame') {
          <path d="M12 21c-3.9 0-7-2.7-7-6.5 0-3 2-5.1 3.5-6.5.3 1.6 1.2 2.7 2.5 3.2C11 8 12 5.5 14 3c.5 3 4 5.5 4 10.5 0 4.3-2.6 7.5-6 7.5z" />
        }
        @case ('trophy') {
          <path d="M8 4h8v5a4 4 0 0 1-8 0z" />
          <path d="M8 6H5a3 3 0 0 0 3 4M16 6h3a3 3 0 0 1-3 4M12 13v4M8.5 20h7M10 17h4" />
        }
        @case ('camera') {
          <path d="M4 8h3l2-3h6l2 3h3v11H4z" />
          <circle cx="12" cy="13" r="3.5" />
        }
        @case ('check-circle') {
          <circle cx="12" cy="12" r="8.5" />
          <path d="m8.5 12.5 2.3 2.3 4.7-5" />
        }
        @case ('x-circle') {
          <circle cx="12" cy="12" r="8.5" />
          <path d="m9 9 6 6M15 9l-6 6" />
        }
        @case ('info') {
          <circle cx="12" cy="12" r="8.5" />
          <path d="M12 11v5M12 8v.5" />
        }
        @case ('save') {
          <path d="M5 4h11l3 3v12a1 1 0 0 1-1 1H6a1 1 0 0 1-1-1z" />
          <path d="M8 4v5h7V4M8 20v-6h8v6" />
        }
        @case ('key') {
          <circle cx="8" cy="15" r="4" />
          <path d="m11 12 8-8M16 7l2 2M14 9l2 2" />
        }
        @case ('menu') {
          <path d="M4 7h16M4 12h16M4 17h16" />
        }
      }
    </svg>
  `,
  host: {
    '[style.--icon-size.px]': 'size',
  },
  styles: `
    :host {
      display: inline-flex;
      width: var(--icon-size, 20px);
      height: var(--icon-size, 20px);
      flex-shrink: 0;
      color: inherit;
      line-height: 0;
    }
    svg {
      width: 100%;
      height: 100%;
      display: block;
    }
  `,
})
export class IconComponent {
  @Input({ required: true }) name = 'home';
  @Input() size = 20;
}
