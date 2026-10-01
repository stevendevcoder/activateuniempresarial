import { Component, computed, input } from '@angular/core';
import { DayMood } from '../core/models';

const TINT: Record<DayMood, string> = {
  happy: '#10B981',
  sad: '#e11d48',
  neutral: '#94a3b8',
  pending: '#f59e0b',
};

const LABEL: Record<DayMood, string> = {
  happy: 'Pausas completadas',
  sad: 'Pausas sin completar',
  neutral: 'Sin pausas',
  pending: 'Pausas pendientes',
};

@Component({
  selector: 'app-mood',
  template: `
    <svg viewBox="0 0 48 48" role="img" [attr.aria-label]="LABEL[mood()]">
      <circle cx="24" cy="24" r="22" [attr.fill]="tint()" opacity="0.14" />
      <circle cx="24" cy="24" r="22" fill="none" [attr.stroke]="tint()" stroke-width="2.5" />
      <circle cx="17" cy="20" r="2.6" [attr.fill]="tint()" />
      <circle cx="31" cy="20" r="2.6" [attr.fill]="tint()" />
      @switch (mood()) {
        @case ('happy') {
          <path d="M15 29c3 5 15 5 18 0" fill="none" [attr.stroke]="tint()" stroke-width="2.8" stroke-linecap="round" />
        }
        @case ('sad') {
          <path d="M15 33c3 -5 15 -5 18 0" fill="none" [attr.stroke]="tint()" stroke-width="2.8" stroke-linecap="round" />
        }
        @default {
          <path d="M16 31h16" fill="none" [attr.stroke]="tint()" stroke-width="2.8" stroke-linecap="round" />
        }
      }
    </svg>
  `,
  styles: `
    :host { display: inline-block; line-height: 0; }
    svg { width: 100%; height: 100%; display: block; }
  `,
})
export class MoodComponent {
  readonly mood = input.required<DayMood>();
  readonly LABEL = LABEL;
  readonly tint = computed(() => TINT[this.mood()]);
}
