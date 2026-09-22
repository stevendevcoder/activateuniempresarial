import { Component, Input } from '@angular/core';

@Component({
  selector: 'app-progress-ring',
  template: `
    <svg viewBox="0 0 100 100" aria-hidden="true">
      <circle cx="50" cy="50" r="42" fill="none" stroke="#e5eaf7" stroke-width="10" />
      <circle
        cx="50"
        cy="50"
        r="42"
        fill="none"
        stroke="#1b2f8a"
        stroke-width="10"
        stroke-linecap="round"
        transform="rotate(-90 50 50)"
        [attr.stroke-dasharray]="circumference"
        [attr.stroke-dashoffset]="offset"
      />
    </svg>
    <div class="label">
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
    .label {
      position: absolute;
      text-align: center;
    }
    b {
      display: block;
      font-size: 20px;
      color: #1b2f8a;
      line-height: 1;
    }
    small {
      color: #64748b;
      font-size: 10px;
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
