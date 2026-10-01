import { Component, input } from '@angular/core';

/** Muestra la mascota oficial Activate (imágenes en public/mascota) con animación opcional. */
@Component({
  selector: 'app-mascota',
  template: `<img [src]="'mascota/' + name() + '.png'" [alt]="alt()" [class.breathe]="animate()" />`,
  styles: `
    :host {
      display: block;
      width: 100%;
      height: 100%;
      line-height: 0;
    }
    img {
      width: 100%;
      height: 100%;
      object-fit: contain;
      display: block;
    }
    .breathe {
      animation: mascota-activa 2.6s ease-in-out infinite;
      transform-origin: 50% 90%;
      will-change: transform;
    }
    @keyframes mascota-activa {
      0%   { transform: translateY(0) rotate(0deg) scale(1); }
      20%  { transform: translateY(-7px) rotate(-2.5deg) scale(1.02); }
      50%  { transform: translateY(0) rotate(0deg) scale(1.04); }
      80%  { transform: translateY(-7px) rotate(2.5deg) scale(1.02); }
      100% { transform: translateY(0) rotate(0deg) scale(1); }
    }
    @media (prefers-reduced-motion: reduce) {
      .breathe { animation: none; }
    }
  `,
})
export class MascotaComponent {
  readonly name = input.required<string>();
  readonly animate = input(false);
  readonly alt = input('Mascota Activate Uniempresarial');
}
