import { Component, Input } from '@angular/core';

@Component({
  selector: 'app-progress-ring',
  template: `
    <svg viewBox="0 0 100 100" aria-hidden="true">
      <circle cx="50" cy="50" r="42" fill="none" stroke="#e0e7ff" stroke-width="10" />
      <circle
        cx="50"
        cy="50"
        r="42"
        fill="none"
        stroke="#1e40af"
        stroke-width="10"
        stroke-linecap="round"
        transform="rotate(-90 50 50)"
        [attr.stroke-dasharray]="circumference"
        [attr.stroke-dashoffset]="offset"
      />
    </svg>
    <div class="absolute text-center">
      <b>{{ done }}/{{ total }}</b>
      <small>pausas</small>
    </div>
  `,
  styles: `
    :host {
      position: relative;
      display: grid;
      place-items: center;
      width: 112px;
      height: 112px;
      flex-shrink: 0;
    }
    svg {
      width: 100%;
      height: 100%;
    }
    b {
      display: block;
      font-size: 20px;
      line-height: 1;
      color: #1e40af;
      font-weight: 800;
    }
    small {
      color: #64748b;
      font-size: 10px;
      font-weight: 600;
    }
  `,
})
export class ProgressRingComponent {
  @Input() done = 0;
  @Input() total = 4;
  readonly circumference = 2 * Math.PI * 42;

  get offset(): number {
    const ratio = this.total ? this.done / this.total : 0;
    return this.circumference * (1 - ratio);
  }
}