import { Component, Input } from '@angular/core';

@Component({
  selector: 'app-logo',
  template: `
    <img
      src="logo-ue.png"
      alt="Uniempresarial"
      [style.width.px]="size"
      [style.height.px]="size"
    />
  `,
  styles: `
    :host {
      display: inline-flex;
      line-height: 0;
    }
    img {
      display: block;
      border-radius: 50%;
      object-fit: cover;
      background: #fff;
      box-shadow: 0 8px 24px rgba(0, 0, 0, 0.18);
    }
  `,
})
export class LogoComponent {
  @Input() size = 92;
}
