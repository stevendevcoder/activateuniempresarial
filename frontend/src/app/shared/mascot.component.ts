import { Component, Input } from '@angular/core';
import { MascotPose } from '../core/models';

@Component({
  selector: 'app-mascot',
  template: `
    <svg viewBox="0 0 160 180" role="img" aria-label="Mascota ACTIVATE">
      <ellipse cx="80" cy="168" rx="42" ry="8" fill="#c7d2fe" opacity="0.7" />
      <path d="M48 92c-10 18-16 38-10 52 4 10 18 18 42 18s38-8 42-18c6-14 0-34-10-52" fill="#1b2f8a" />
      <ellipse cx="80" cy="118" rx="28" ry="32" fill="#eef2ff" />
      @if (pose === 'arms-up') {
        <path d="M46 78c-22-28-8-48 4-42" fill="none" stroke="#1b2f8a" stroke-width="12" stroke-linecap="round" />
        <path d="M114 78c22-28 8-48-4-42" fill="none" stroke="#1b2f8a" stroke-width="12" stroke-linecap="round" />
        <circle cx="46" cy="34" r="9" fill="#f8d7c4" />
        <circle cx="114" cy="34" r="9" fill="#f8d7c4" />
      } @else if (pose === 'wave') {
        <path d="M44 90c-24 2-28-22-12-28" fill="none" stroke="#1b2f8a" stroke-width="12" stroke-linecap="round" />
        <path d="M116 92c18 16 8 28-2 26" fill="none" stroke="#1b2f8a" stroke-width="12" stroke-linecap="round" />
        <circle cx="34" cy="58" r="9" fill="#f8d7c4" />
        <circle cx="122" cy="122" r="9" fill="#f8d7c4" />
      } @else {
        <path d="M48 98c-16 10-18 24-8 28" fill="none" stroke="#1b2f8a" stroke-width="12" stroke-linecap="round" />
        <path d="M112 98c16 10 18 24 8 28" fill="none" stroke="#1b2f8a" stroke-width="12" stroke-linecap="round" />
        <circle cx="38" cy="128" r="9" fill="#f8d7c4" />
        <circle cx="122" cy="128" r="9" fill="#f8d7c4" />
      }
      <circle cx="58" cy="158" r="10" fill="#e11d48" />
      <circle cx="102" cy="158" r="10" fill="#e11d48" />
      <circle cx="80" cy="58" r="36" fill="#f8d7c4" />
      <path d="M50 48c8-28 52-28 60 0 2 8-4 14-12 16H62c-8-2-14-8-12-16z" fill="#5b3a29" />
      @if (pose === 'eyes') {
        <path d="M64 62c6 6 12 6 18 0" fill="none" stroke="#1e293b" stroke-width="3" stroke-linecap="round" />
        <path d="M90 62c6 6 12 6 18 0" fill="none" stroke="#1e293b" stroke-width="3" stroke-linecap="round" />
      } @else {
        <circle cx="68" cy="64" r="4.5" fill="#1e293b" />
        <circle cx="94" cy="64" r="4.5" fill="#1e293b" />
        <circle cx="69.5" cy="62.5" r="1.4" fill="white" />
        <circle cx="95.5" cy="62.5" r="1.4" fill="white" />
      }
      @if (pose === 'breathe') {
        <ellipse cx="81" cy="80" rx="8" ry="6" fill="none" stroke="#1e293b" stroke-width="3" />
      } @else {
        <path d="M72 80c4 8 14 8 18 0" fill="none" stroke="#e11d48" stroke-width="3" stroke-linecap="round" />
      }
    </svg>
  `,
  styles: `
    :host {
      display: block;
      width: 100%;
      height: 100%;
      line-height: 0;
    }
    svg {
      width: 100%;
      height: 100%;
      display: block;
    }
  `,
})
export class MascotComponent {
  @Input() pose: MascotPose = 'idle';
}
